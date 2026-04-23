// Edge Function: send-test-email
// Renders an email template (with sample vars) and sends it to a test recipient
// using the org's default email provider config.
//
// Auth: requires a valid JWT (super_admin / saas_team / org_admin).
// Body: { template_id?: string, subject?: string, markdown?: string, recipient: string, organization_id?: string|null, locale?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Inline shared renderer (same logic as src/lib/email-render.ts) ──
const GI_LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/brand-assets/growthinnov-logo.svg`;
const BRAND_PRIMARY = "#2563EB";
const BRAND_DARK = "#0F172A";
const BRAND_MUTED = "#64748B";
const BRAND_BG = "#F8FAFC";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function interpolate(input: string, vars: Record<string, any>) {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = p.split(".").reduce((a: any, k: string) => a?.[k], vars);
    return v == null ? "" : String(v);
  });
}
function inlineMd(s: string) {
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}" style="color:${BRAND_PRIMARY};text-decoration:underline">${escapeHtml(t)}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, '<code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>');
  return s;
}
function renderBody(md: string) {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false, inQuote = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const closeQuote = () => { if (inQuote) { out.push("</blockquote>"); inQuote = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); closeQuote(); continue; }
    const btn = line.match(/^\{\{\s*button:([^|]+)\|([^}]+)\s*\}\}$/);
    if (btn) {
      closeList(); closeQuote();
      out.push(`<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0"><tr><td align="center" bgcolor="${BRAND_PRIMARY}" style="border-radius:10px"><a href="${btn[2].trim()}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(btn[1].trim())}</a></td></tr></table>`);
      continue;
    }
    if (line.startsWith("### ")) { closeList(); closeQuote(); out.push(`<h3 style="font-size:18px;color:${BRAND_DARK};margin:24px 0 12px;font-weight:600">${inlineMd(escapeHtml(line.slice(4)))}</h3>`); continue; }
    if (line.startsWith("## ")) { closeList(); closeQuote(); out.push(`<h2 style="font-size:22px;color:${BRAND_DARK};margin:28px 0 14px;font-weight:700">${inlineMd(escapeHtml(line.slice(3)))}</h2>`); continue; }
    if (line.startsWith("# ")) { closeList(); closeQuote(); out.push(`<h1 style="font-size:26px;color:${BRAND_DARK};margin:0 0 16px;font-weight:700;line-height:1.3">${inlineMd(escapeHtml(line.slice(2)))}</h1>`); continue; }
    if (/^---+$/.test(line)) { closeList(); closeQuote(); out.push(`<hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0"/>`); continue; }
    if (line.startsWith("> ")) {
      closeList();
      if (!inQuote) { out.push(`<blockquote style="margin:16px 0;padding:12px 18px;border-left:3px solid ${BRAND_PRIMARY};background:${BRAND_BG};color:${BRAND_DARK};font-style:italic">`); inQuote = true; }
      out.push(`<p style="margin:0">${inlineMd(escapeHtml(line.slice(2)))}</p>`);
      continue;
    } else closeQuote();
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push(`<ul style="margin:12px 0 12px 20px;padding:0;color:${BRAND_DARK};font-size:15px;line-height:1.65">`); inList = true; }
      out.push(`<li style="margin:6px 0">${inlineMd(escapeHtml(line.replace(/^[-*]\s+/, "")))}</li>`);
      continue;
    } else closeList();
    out.push(`<p style="margin:0 0 14px;color:${BRAND_DARK};font-size:15px;line-height:1.7">${inlineMd(escapeHtml(line))}</p>`);
  }
  closeList(); closeQuote();
  return out.join("\n");
}
function renderEmail(subject: string, markdown: string, vars: any, branding: { orgName?: string; orgLogoUrl?: string; coBrand: boolean }) {
  const subj = interpolate(subject, vars);
  const body = renderBody(interpolate(markdown, vars));
  const headerBlock = branding.coBrand && branding.orgLogoUrl
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:32px"><tr><td align="left"><img src="${branding.orgLogoUrl}" alt="" height="36" style="max-height:36px"/></td><td align="center" style="width:1px;background:#E2E8F0;height:32px"></td><td align="right"><img src="${GI_LOGO_URL}" alt="GROWTHINNOV" height="28" style="max-height:28px;margin-left:auto;display:block"/></td></tr></table>`
    : `<div style="margin-bottom:32px"><img src="${GI_LOGO_URL}" alt="GROWTHINNOV" height="32" style="max-height:32px;display:block"/></div>`;
  const footer = `<div style="margin-top:40px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center"><p style="margin:0;color:${BRAND_MUTED};font-size:12px;line-height:1.6">${escapeHtml(branding.orgName || "GROWTHINNOV")} • Propulsé par GROWTHINNOV<br/><span style="color:${BRAND_MUTED}">[Email de TEST — non transactionnel]</span></p></div>`;
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${escapeHtml(subj)}</title></head><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND_BG}"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(15,23,42,0.06)"><tr><td style="padding:40px 40px 32px">${headerBlock}${body}${footer}</td></tr></table></td></tr></table></body></html>`;
  return { subject: subj, html };
}

// ─── Provider dispatch (Lovable AI gateway by default) ──
async function sendViaLovable(to: string, subject: string, html: string, fromEmail: string, fromName: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/email/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html, from: fromName ? `${fromName} <${fromEmail}>` : fromEmail }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lovable email gateway: ${res.status} ${err}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { template_id, subject, markdown, recipient, organization_id, locale } = body;
    if (!recipient || (!template_id && (!subject || !markdown))) {
      return new Response(JSON.stringify({ error: "recipient + (template_id OR subject+markdown) required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve template content
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let finalSubject = subject as string;
    let finalMarkdown = markdown as string;
    let resolvedOrgId: string | null = organization_id ?? null;

    if (template_id) {
      const { data: tpl, error: tplErr } = await admin.from("email_templates").select("*").eq("id", template_id).maybeSingle();
      if (tplErr || !tpl) throw new Error("Template not found");
      finalSubject = tpl.subject;
      finalMarkdown = tpl.markdown_body;
      resolvedOrgId = resolvedOrgId ?? tpl.organization_id;
      if (locale && locale !== "fr") {
        const { data: tr } = await admin.from("email_template_translations").select("*").eq("template_id", template_id).eq("locale", locale).maybeSingle();
        if (tr) {
          finalSubject = tr.subject;
          finalMarkdown = tr.markdown_body;
        }
      }
    }

    // Resolve branding
    let orgName = "GROWTHINNOV";
    let orgLogoUrl: string | undefined;
    if (resolvedOrgId) {
      const { data: org } = await admin.from("organizations").select("name, brand_logo_url").eq("id", resolvedOrgId).maybeSingle();
      if (org) {
        orgName = org.name || orgName;
        orgLogoUrl = org.brand_logo_url || undefined;
      }
    }

    // Resolve provider (default config)
    const { data: providerCfg } = await admin
      .from("email_provider_configs")
      .select("*")
      .or(`organization_id.eq.${resolvedOrgId ?? "00000000-0000-0000-0000-000000000000"},organization_id.is.null`)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fromEmail = providerCfg?.from_email || "noreply@growthinnov.com";
    const fromName = providerCfg?.from_name || orgName;

    const { subject: subj, html } = renderEmail(finalSubject, finalMarkdown, {
      firstName: "Marie",
      organization: { name: orgName },
      recipient: { email: recipient },
    }, { orgName, orgLogoUrl, coBrand: !!orgLogoUrl });

    const finalSubj = `[TEST] ${subj}`;
    const sendResult = await sendViaLovable(recipient, finalSubj, html, fromEmail, fromName);

    // Audit log
    await admin.from("email_send_log").insert({
      message_id: sendResult?.id ?? `test-${Date.now()}`,
      template_name: template_id ? `template:${template_id}` : "ad-hoc-test",
      recipient_email: recipient,
      status: "sent",
      metadata: { test: true, sent_by: user.id },
    });

    return new Response(JSON.stringify({ ok: true, message_id: sendResult?.id ?? null }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[send-test-email]", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
