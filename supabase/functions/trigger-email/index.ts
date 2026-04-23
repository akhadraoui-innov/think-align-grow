// Edge Function: trigger-email
// Core dispatcher for the v2.6 Email Platform.
// Resolves automation → template → provider → branding → renders → sends.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAdapter } from "../_shared/email-adapters/index.ts";
import { renderEmail } from "../_shared/email-render.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TriggerBody {
  event: string;
  organization_id?: string | null;
  recipient_email: string;
  recipient_user_id?: string | null;
  payload?: Record<string, any>;
  entity_id?: string | null;          // for idempotency
  override_template_code?: string;     // bypass automation lookup
}

const ENC_KEY = Deno.env.get("EMAIL_CREDENTIALS_KEY") || "growthinnov_default_key_v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body: TriggerBody = await req.json();
    if (!body?.event || !body?.recipient_email) {
      return json({ error: "event and recipient_email are required" }, 400);
    }

    // ── 1. Resolve automation (org > global) ─────────────────────────
    let automation: any = null;
    let templateCode: string | null = body.override_template_code ?? null;

    if (!templateCode) {
      const { data: autoRows } = await supabase
        .from("email_automations")
        .select("id, code, template_code, conditions, delay_minutes, organization_id, is_active")
        .eq("trigger_event", body.event)
        .eq("is_active", true)
        .or(body.organization_id
          ? `organization_id.eq.${body.organization_id},organization_id.is.null`
          : `organization_id.is.null`);

      // Prefer org-specific
      automation = (autoRows || []).find((a) => a.organization_id === body.organization_id)
        || (autoRows || []).find((a) => a.organization_id === null);

      if (!automation) {
        return json({ skipped: true, reason: `no active automation for event '${body.event}'` }, 200);
      }
      templateCode = automation.template_code;
    }

    // ── 2. Idempotency check ─────────────────────────────────────────
    if (body.entity_id) {
      const { data: existing } = await supabase
        .from("email_automation_runs")
        .select("id, status")
        .eq("trigger_event", body.event)
        .eq("entity_id", body.entity_id)
        .eq("template_code", templateCode!)
        .maybeSingle();
      if (existing) {
        return json({ skipped: true, reason: "already processed", run_id: existing.id }, 200);
      }
    }

    // ── 3. Resolve template (org > global) ───────────────────────────
    const { data: tplRows } = await supabase
      .from("email_templates")
      .select("id, code, organization_id, subject, markdown_body, variables, version, is_active")
      .eq("code", templateCode!)
      .eq("is_active", true)
      .or(body.organization_id
        ? `organization_id.eq.${body.organization_id},organization_id.is.null`
        : `organization_id.is.null`);

    const template = (tplRows || []).find((t) => t.organization_id === body.organization_id)
      || (tplRows || []).find((t) => t.organization_id === null);

    if (!template) {
      return json({ error: `template '${templateCode}' not found or inactive` }, 404);
    }

    // ── 4. Resolve org context (branding + plan + features) ──────────
    let org: any = null;
    let planFeatures: Record<string, any> = {};
    if (body.organization_id) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id, name, brand_logo_url, email_sender_domain, email_tracking_enabled, email_features_override, plan_id")
        .eq("id", body.organization_id)
        .maybeSingle();
      org = orgRow;
      if (orgRow?.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("features")
          .eq("id", orgRow.plan_id)
          .maybeSingle();
        planFeatures = (plan?.features as any) || {};
      }
    }

    // Effective feature flags = plan features + org override
    const overrides = (org?.email_features_override as any) || {};
    const effective = {
      custom_email_domain: overrides.custom_email_domain ?? planFeatures.custom_email_domain ?? false,
      custom_email_provider: overrides.custom_email_provider ?? planFeatures.custom_email_provider ?? false,
      email_co_branding: overrides.email_co_branding ?? planFeatures.email_co_branding ?? false,
    };

    // ── 5. Resolve provider (org > global) honoring entitlement ──────
    let providerConfig: any = null;
    if (body.organization_id && effective.custom_email_provider) {
      const { data: orgCfg } = await supabase
        .from("email_provider_configs")
        .select("id, provider_code, credentials_encrypted, from_email, from_name, reply_to, is_default, is_active")
        .eq("organization_id", body.organization_id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();
      providerConfig = orgCfg;
    }
    if (!providerConfig) {
      const { data: globalCfg } = await supabase
        .from("email_provider_configs")
        .select("id, provider_code, credentials_encrypted, from_email, from_name, reply_to, is_default, is_active")
        .is("organization_id", null)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();
      providerConfig = globalCfg;
    }
    if (!providerConfig) {
      return json({ error: "No active email provider configured" }, 500);
    }

    // ── 6. Decrypt credentials ───────────────────────────────────────
    let credentials: Record<string, any> = {};
    if (providerConfig.credentials_encrypted) {
      const { data: dec, error: decErr } = await supabase.rpc("decrypt_email_credentials", {
        _encrypted: providerConfig.credentials_encrypted,
        _key: ENC_KEY,
      });
      if (decErr) {
        console.warn("[trigger-email] decrypt failed, using empty creds", decErr.message);
      } else if (dec) {
        try { credentials = typeof dec === "string" ? JSON.parse(dec) : dec; } catch { credentials = {}; }
      }
    }

    // ── 7. Render ────────────────────────────────────────────────────
    const variables = {
      ...(body.payload || {}),
      organization: org ? { name: org.name } : undefined,
      recipient: { email: body.recipient_email },
    };

    const rendered = renderEmail({
      subject: template.subject,
      markdown: template.markdown_body,
      variables,
      branding: {
        orgLogoUrl: org?.brand_logo_url || null,
        orgName: org?.name || null,
        coBrand: !!(effective.email_co_branding && org?.brand_logo_url),
      },
      footer: { organizationLine: org?.name || "GROWTHINNOV" },
    });

    // ── 8. Send via adapter ──────────────────────────────────────────
    const adapter = getAdapter(providerConfig.provider_code);
    const sendRes = await adapter.send({
      to: body.recipient_email,
      from: providerConfig.from_email || "noreply@growthinnov.com",
      fromName: providerConfig.from_name || "GROWTHINNOV",
      replyTo: providerConfig.reply_to || undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    }, credentials);

    // ── 9. Persist run for traceability ──────────────────────────────
    await supabase.from("email_automation_runs").insert({
      automation_id: automation?.id || null,
      template_code: templateCode!,
      template_version: template.version,
      organization_id: body.organization_id || null,
      trigger_event: body.event,
      entity_id: body.entity_id || null,
      recipient_email: body.recipient_email,
      recipient_user_id: body.recipient_user_id || null,
      payload: body.payload || {},
      provider_used: providerConfig.provider_code,
      message_id: sendRes.messageId || null,
      status: sendRes.success ? "sent" : "failed",
      sent_at: sendRes.success ? new Date().toISOString() : null,
      error: sendRes.error || null,
    });

    return json({
      success: sendRes.success,
      message_id: sendRes.messageId,
      provider: providerConfig.provider_code,
      template_code: templateCode,
      error: sendRes.error,
    }, sendRes.success ? 200 : 502);

  } catch (err: any) {
    console.error("[trigger-email] error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
