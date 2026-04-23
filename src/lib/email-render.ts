// Shared email renderer — mirrors supabase/functions/_shared/email-render.ts
// Used both client-side (live preview) and server-side (real send).
// Keep logic identical to keep "preview = real" guarantee.

const GI_LOGO_URL = "https://yucwxukikfianvaokebs.supabase.co/storage/v1/object/public/brand-assets/growthinnov-logo.svg";
const BRAND_PRIMARY = "#2563EB";
const BRAND_DARK = "#0F172A";
const BRAND_MUTED = "#64748B";
const BRAND_BG = "#F8FAFC";

export interface EmailRenderInput {
  subject: string;
  markdown: string;
  variables: Record<string, any>;
  branding: {
    orgLogoUrl?: string | null;
    orgName?: string | null;
    coBrand: boolean;
  };
  footer?: {
    unsubscribeUrl?: string;
    organizationLine?: string;
  };
}

export interface EmailRenderOutput {
  subject: string;
  html: string;
  text: string;
}

function interpolate(input: string, vars: Record<string, any>): string {
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = path.split(".").reduce((acc: any, k: string) => acc?.[k], vars);
    return value === undefined || value === null ? "" : String(value);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(s: string): string {
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) =>
    `<a href="${u}" style="color:${BRAND_PRIMARY};text-decoration:underline">${escapeHtml(t)}</a>`,
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, '<code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>');
  return s;
}

function renderBody(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let inBlockquote = false;

  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const closeQuote = () => { if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; } };

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
      if (!inBlockquote) { out.push(`<blockquote style="margin:16px 0;padding:12px 18px;border-left:3px solid ${BRAND_PRIMARY};background:${BRAND_BG};color:${BRAND_DARK};font-style:italic">`); inBlockquote = true; }
      out.push(`<p style="margin:0">${inlineMd(escapeHtml(line.slice(2)))}</p>`);
      continue;
    } else { closeQuote(); }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push(`<ul style="margin:12px 0 12px 20px;padding:0;color:${BRAND_DARK};font-size:15px;line-height:1.65">`); inList = true; }
      out.push(`<li style="margin:6px 0">${inlineMd(escapeHtml(line.replace(/^[-*]\s+/, "")))}</li>`);
      continue;
    } else { closeList(); }

    out.push(`<p style="margin:0 0 14px;color:${BRAND_DARK};font-size:15px;line-height:1.7">${inlineMd(escapeHtml(line))}</p>`);
  }
  closeList(); closeQuote();
  return out.join("\n");
}

function header(branding: EmailRenderInput["branding"]): string {
  if (branding.coBrand && branding.orgLogoUrl) {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:32px">
      <tr>
        <td align="left" style="padding:0">
          <img src="${branding.orgLogoUrl}" alt="${escapeHtml(branding.orgName || "")}" height="36" style="max-height:36px;display:block"/>
        </td>
        <td align="center" style="width:1px;background:#E2E8F0;height:32px"></td>
        <td align="right" style="padding:0">
          <img src="${GI_LOGO_URL}" alt="GROWTHINNOV" height="28" style="max-height:28px;display:block;margin-left:auto"/>
        </td>
      </tr>
    </table>`;
  }
  return `<div style="margin-bottom:32px">
    <img src="${GI_LOGO_URL}" alt="GROWTHINNOV" height="32" style="max-height:32px;display:block"/>
  </div>`;
}

function footer(branding: EmailRenderInput["branding"], footerOpts: EmailRenderInput["footer"]): string {
  const orgLine = footerOpts?.organizationLine || branding.orgName || "GROWTHINNOV";
  const unsub = footerOpts?.unsubscribeUrl
    ? `<p style="margin:8px 0 0;color:${BRAND_MUTED};font-size:12px"><a href="${footerOpts.unsubscribeUrl}" style="color:${BRAND_MUTED};text-decoration:underline">Se désinscrire</a></p>`
    : "";
  return `<div style="margin-top:40px;padding-top:24px;border-top:1px solid #E2E8F0;text-align:center">
    <p style="margin:0;color:${BRAND_MUTED};font-size:12px;line-height:1.6">
      ${escapeHtml(orgLine)} • Propulsé par GROWTHINNOV<br/>
      <a href="https://www.growthinnov.com" style="color:${BRAND_MUTED};text-decoration:none">www.growthinnov.com</a>
    </p>
    ${unsub}
  </div>`;
}

export function renderEmail(input: EmailRenderInput): EmailRenderOutput {
  const subject = interpolate(input.subject, input.variables);
  const interpolatedMd = interpolate(input.markdown, input.variables);
  const body = renderBody(interpolatedMd);

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${BRAND_BG}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(15,23,42,0.06)">
        <tr><td style="padding:40px 40px 32px">
          ${header(input.branding)}
          ${body}
          ${footer(input.branding, input.footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = interpolatedMd
    .replace(/\{\{\s*button:([^|]+)\|([^}]+)\s*\}\}/g, "$1: $2")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  return { subject, html, text };
}

export const SAMPLE_VARS = {
  firstName: "Marie",
  organization: { name: "Acme SaaS" },
  recipient: { email: "marie@acme.com" },
};
