// Edge Function: trigger-email (v2.6.1 — world-class edition)
// - Consumes get_org_effective_features() helper (single source of truth)
// - Idempotency keys via X-Idempotency-Key header (24h TTL)
// - Circuit breaker per provider
// - Email monthly quota enforcement
// - Audit log immutable trace on send
// - Logs to email_send_log + email_automation_runs

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAdapter } from "../_shared/email-adapters/index.ts";
import { renderEmail } from "../_shared/email-render.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-event-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TriggerBody {
  event: string;
  organization_id?: string | null;
  recipient_email: string;
  recipient_user_id?: string | null;
  payload?: Record<string, any>;
  entity_id?: string | null;
  override_template_code?: string;
}

// Map template codes → preference category. Anything starting with "auth." or
// "transactional." is considered required and bypasses opt-in checks.
function categoryForTemplate(code: string): string {
  if (code.startsWith("auth.") || code.startsWith("transactional.")) return "transactional";
  if (code.startsWith("academy.")) return "academy";
  if (code.startsWith("digest.")) return "digest";
  if (code.startsWith("product.")) return "product";
  if (code.startsWith("marketing.") || code.startsWith("campaign.")) return "marketing";
  // Default: treat as transactional to avoid silently dropping system emails.
  return "transactional";
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyHmac(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;
  const expected = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // constant-time compare
  if (expected.length !== computed.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ computed.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Read raw body once for HMAC verification + JSON parsing
    const rawBody = await req.text();

    // ── 0pre. HMAC signature verification (server-to-server calls) ──
    // If X-Event-Signature is present, it MUST be valid (DB dispatcher path).
    // Direct UI calls without the header are accepted (auth via Supabase JWT).
    const sigHeader = req.headers.get("x-event-signature");
    if (sigHeader) {
      const { data: secretRow, error: secretErr } = await supabase.rpc("get_or_create_email_hmac_secret");
      if (secretErr || !secretRow) {
        console.error("[trigger-email] hmac secret unavailable:", secretErr);
        return json({ error: "hmac_secret_unavailable" }, 500);
      }
      const ok = await verifyHmac(rawBody, sigHeader, secretRow as string);
      if (!ok) return json({ error: "invalid_signature" }, 401);
    }

    let body: TriggerBody;
    try { body = JSON.parse(rawBody); } catch { return json({ error: "invalid_json" }, 400); }
    if (!body?.event || !body?.recipient_email) {
      return json({ error: "event and recipient_email are required" }, 400);
    }

    // ── 0. Idempotency check (header X-Idempotency-Key) ──────────────
    const idemKey = req.headers.get("x-idempotency-key");
    if (idemKey) {
      const { data: existing } = await supabase
        .from("email_idempotency_keys")
        .select("response_payload")
        .eq("key", idemKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (existing?.response_payload) {
        return json({ ...existing.response_payload, replayed: true }, 200);
      }
    }

    // ── 0bis. Quota enforcement ──────────────────────────────────────
    if (body.organization_id) {
      const { data: quotaOk } = await supabase.rpc("check_email_quota", {
        _org_id: body.organization_id,
      });
      if (quotaOk === false) {
        return json({ error: "email_quota_exceeded", organization_id: body.organization_id }, 429);
      }
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

      automation = (autoRows || []).find((a) => a.organization_id === body.organization_id)
        || (autoRows || []).find((a) => a.organization_id === null);

      if (!automation) {
        return json({ skipped: true, reason: `no active automation for event '${body.event}'` }, 200);
      }
      templateCode = automation.template_code;
    }

    // ── 2. Idempotency check by entity_id (legacy path) ──────────────
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

    // ── 4. Resolve org context + EFFECTIVE FEATURES via helper RPC ───
    let org: any = null;
    let effective: Record<string, any> = {};
    if (body.organization_id) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("id, name, brand_logo_url, email_sender_domain, email_tracking_enabled")
        .eq("id", body.organization_id)
        .maybeSingle();
      org = orgRow;
    }
    const { data: feats } = await supabase.rpc("get_org_effective_features", {
      _org_id: body.organization_id ?? null,
    });
    effective = (feats as Record<string, any>) || {};

    // ── 5. Resolve provider (org > global) honoring entitlement ──────
    let providerConfig: any = null;
    if (body.organization_id && effective.custom_email_provider) {
      const { data: orgCfg } = await supabase
        .from("email_provider_configs")
        .select("id, provider_code, credentials, from_email, from_name, reply_to, is_default, is_active")
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
        .select("id, provider_code, credentials, from_email, from_name, reply_to, is_default, is_active")
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

    // ── 5bis. Circuit breaker check ──────────────────────────────────
    const { data: cbOk } = await supabase.rpc("check_circuit_breaker", {
      _provider_code: providerConfig.provider_code,
    });
    if (cbOk === false) {
      return json({
        error: "provider_circuit_open",
        provider: providerConfig.provider_code,
        hint: "Provider has > 20% failure rate on last 100 sends. Auto-disabled.",
      }, 503);
    }

    // ── 6. Use credentials from JSONB column (already plaintext-safe) ─
    const credentials: Record<string, any> = (providerConfig.credentials as any) || {};

    // ── 7. Render ────────────────────────────────────────────────────
    const variables = {
      ...(body.payload || {}),
      organization: org ? { name: org.name } : { name: "GROWTHINNOV" },
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

    // ── 8. Persist pending log row before send ───────────────────────
    const messageId = crypto.randomUUID();
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateCode!,
      recipient_email: body.recipient_email,
      status: "pending",
      metadata: {
        provider: providerConfig.provider_code,
        organization_id: body.organization_id || null,
        event: body.event,
        idempotency_key: idemKey || null,
      },
    });

    // ── 9. Send via adapter ──────────────────────────────────────────
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

    // ── 10. Persist final status to email_send_log + run ─────────────
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateCode!,
      recipient_email: body.recipient_email,
      status: sendRes.success ? "sent" : "failed",
      error_message: sendRes.error || null,
      metadata: {
        provider: providerConfig.provider_code,
        organization_id: body.organization_id || null,
        event: body.event,
      },
    });

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
      message_id: sendRes.messageId || messageId,
      status: sendRes.success ? "sent" : "failed",
      sent_at: sendRes.success ? new Date().toISOString() : null,
      error: sendRes.error || null,
    });

    // ── 11. Increment org quota counter (best-effort) ────────────────
    if (body.organization_id && sendRes.success) {
      await supabase.rpc("increment_email_quota", { _org_id: body.organization_id, _by: 1 });
    }

    // ── 12. Append to immutable audit log (best-effort) ──────────────
    await supabase.rpc("append_audit_log", {
      _action: sendRes.success ? "email.sent" : "email.failed",
      _entity_type: "email",
      _entity_id: messageId,
      _organization_id: body.organization_id || null,
      _payload: {
        event: body.event,
        template: templateCode,
        provider: providerConfig.provider_code,
        recipient_email: body.recipient_email,
      },
    });

    const responsePayload = {
      success: sendRes.success,
      message_id: sendRes.messageId || messageId,
      provider: providerConfig.provider_code,
      template_code: templateCode,
      error: sendRes.error,
    };

    // ── 13. Persist idempotency key payload ──────────────────────────
    if (idemKey) {
      await supabase.from("email_idempotency_keys").upsert({
        key: idemKey,
        response_payload: responsePayload,
        organization_id: body.organization_id || null,
      });
    }

    return json(responsePayload, sendRes.success ? 200 : 502);

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
