// Email security: HTML sanitization + anti-phishing detection
// Used by trigger-email to strip dangerous markup and flag suspicious content
// before sending. Output is logged to public.email_security_flags when blocked.

const ALLOWED_TAGS = new Set([
  "a", "p", "br", "strong", "em", "b", "i", "u", "span", "div",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "img", "table", "thead", "tbody", "tr", "td", "th",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr",
]);

// Strict allowlisted attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "title"]),
  td: new Set(["colspan", "rowspan", "align"]),
  th: new Set(["colspan", "rowspan", "align"]),
  table: new Set(["cellpadding", "cellspacing", "border", "width"]),
};

const DANGEROUS_TAG_RE = /<\/?(script|iframe|object|embed|style|form|input|button|meta|link)[^>]*>/gi;
const ON_HANDLER_RE = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_PROTOCOL_RE = /javascript\s*:/gi;
const DATA_URI_RE = /data:(?!image\/(png|jpeg|jpg|gif|webp|svg\+xml))/gi;

/** Strip dangerous HTML constructs while preserving allowlisted markup. */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";
  let out = html;

  out = out.replace(DANGEROUS_TAG_RE, "");
  out = out.replace(ON_HANDLER_RE, "");
  out = out.replace(JS_PROTOCOL_RE, "blocked:");
  out = out.replace(DATA_URI_RE, "blocked:");

  // Strip non-allowlisted tags but keep their text content
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (match, tag) => {
    if (ALLOWED_TAGS.has(tag.toLowerCase())) {
      return filterAttributes(match, tag.toLowerCase());
    }
    return "";
  });

  return out;
}

function filterAttributes(rawTag: string, tagName: string): string {
  const isClosing = rawTag.startsWith("</");
  if (isClosing) return `</${tagName}>`;
  const allowed = ALLOWED_ATTRS[tagName];
  if (!allowed) return `<${tagName}>`;

  const result: string[] = [`<${tagName}`];
  const attrRe = /([a-zA-Z\-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawTag)) !== null) {
    const name = m[1].toLowerCase();
    const value = (m[3] ?? m[4] ?? m[5] ?? "").trim();
    if (!allowed.has(name)) continue;
    // Re-validate href/src for protocol safety
    if ((name === "href" || name === "src") && /^(javascript|data|file|vbscript):/i.test(value)) continue;
    result.push(` ${name}="${escapeAttr(value)}"`);
  }
  result.push(">");
  return result.join("");
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------- Anti-phishing detector ------------------------- */

export interface PhishingFlag {
  type: "phishing_link_mismatch" | "homoglyph" | "shortener" | "script_residue";
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
}

const KNOWN_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
  "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
]);

// Common Cyrillic homoglyphs that could spoof Latin letters
const HOMOGLYPH_PAIRS: Array<[string, string]> = [
  ["а", "a"], ["е", "e"], ["о", "o"], ["р", "p"], ["с", "c"],
  ["х", "x"], ["у", "y"], ["і", "i"], ["ѕ", "s"],
];

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch { return null; }
}

function rootDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

export function detectPhishing(html: string): PhishingFlag[] {
  const flags: PhishingFlag[] = [];
  if (!html) return flags;

  // 1) Residual <script> after sanitization (defence in depth)
  if (/<script\b/i.test(html)) {
    flags.push({
      type: "script_residue",
      severity: "critical",
      details: { reason: "script tag survived sanitization" },
    });
  }

  // 2) Homoglyphs in visible text (sample check on first 5 KB)
  const sample = html.slice(0, 5000);
  for (const [bad] of HOMOGLYPH_PAIRS) {
    if (sample.includes(bad)) {
      flags.push({
        type: "homoglyph",
        severity: "medium",
        details: { character: bad, hint: "Cyrillic look-alike letter" },
      });
      break; // one flag per email is enough
    }
  }

  // 3) Anchor text/href domain mismatch + URL shorteners
  const anchorRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    const inner = m[2].replace(/<[^>]*>/g, "").trim();
    const hrefHost = extractHost(href);
    if (!hrefHost) continue;

    if (KNOWN_SHORTENERS.has(hrefHost)) {
      flags.push({
        type: "shortener",
        severity: "medium",
        details: { href, host: hrefHost },
      });
    }

    // If the visible anchor text looks like a domain that doesn't match href
    const textHostMatch = inner.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
    if (textHostMatch) {
      const textHost = textHostMatch[0].toLowerCase();
      if (rootDomain(textHost) !== rootDomain(hrefHost)) {
        flags.push({
          type: "phishing_link_mismatch",
          severity: "high",
          details: { displayText: inner, displayDomain: textHost, actualHref: href, actualDomain: hrefHost },
        });
      }
    }
  }

  return flags;
}

/** Blocking decision: any high/critical flag blocks the send. */
export function shouldBlockSend(flags: PhishingFlag[]): boolean {
  return flags.some((f) => f.severity === "high" || f.severity === "critical");
}
