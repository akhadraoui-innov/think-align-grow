// Edge Function: email-events (public, verify_jwt = false)
// Receives delivery webhooks from Resend / SendGrid / generic providers.
// - Verifies HMAC signature against email_webhook_secrets table
// - Maps events to suppressed_emails inserts and email_automation_runs updates
//
// Public URL: https://[ref].supabase.co/functions/v1/email-events?provider=resend

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-signature, svix-id, svix-timestamp, resend-signature, x-twilio-email-event-webhook-signature, x-twilio-email-event-webhook-timestamp",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Base64(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Provider verification ─────────────────────────────────────
async function verifyResend(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  // Resend uses Svix-style: id.timestamp.body, sig in svix-signature ("v1,base64sig v1,base64sig")
  const svixId = headers.get("svix-id");
  const svixTs = headers.get("svix-timestamp");
  const svixSig = headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) return false;
  const signed = `${svixId}.${svixTs}.${rawBody}`;
  // svix secret is "whsec_<base64>"
  let key = secret;
  if (key.startsWith("whsec_")) key = key.slice(6);
  let secretBytes: Uint8Array;
  try {
    secretBytes = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
  } catch {
    secretBytes = new TextEncoder().encode(key);
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(signed));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  // svixSig: "v1,sig1 v1,sig2"
  const sigs = svixSig.split(" ").map((p) => p.split(",")[1]).filter(Boolean);
  return sigs.some((s) => constantTimeEqual(s, expectedB64));
}

async function verifySendgrid(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  // SendGrid v3 webhook: ECDSA — but using simple HMAC fallback if user configured it that way.
  // Documented: X-Twilio-Email-Event-Webhook-Signature uses ECDSA P-256 with SendGrid public key.
  // For simplicity we accept HMAC-SHA256 over (timestamp + payload), per SendGrid HMAC option.
  const sig = headers.get("x-twilio-email-event-webhook-signature");
  const ts = headers.get("x-twilio-email-event-webhook-timestamp");
  if (!sig || !ts) return false;
  const expected = await hmacSha256Base64(secret, ts + rawBody);
  return constantTimeEqual(sig, expected);
}

async function verifyGeneric(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  // Fallback: X-Signature header containing hex-encoded HMAC-SHA256 of the body.
  const sig = headers.get("x-signature") || headers.get("x-webhook-signature");
  if (!sig) return false;
  const cleaned = sig.startsWith("sha256=") ? sig.slice(7) : sig;
  const expected = await hmacSha256Hex(secret, rawBody);
  return constantTimeEqual(cleaned.toLowerCase(), expected.toLowerCase());
}

// ── Event normalisation ───────────────────────────────────────
type NormalizedEvent = {
  type: "delivered" | "bounce" | "complaint" | "unsubscribe" | "open" | "click" | "ignored";
  email: string;
  provider_message_id?: string;
  reason?: string;
  hard?: boolean;
};

function normalizeResendEvent(payload: any): NormalizedEvent | null {
  const t = payload?.type as string | undefined;
  const data = payload?.data || {};
  const email = Array.isArray(data.to) ? data.to[0] : data.to || data.email;
  const id = data.email_id || data.id;
  if (!t || !email) return null;
  switch (t) {
    case "email.delivered":   return { type: "delivered", email, provider_message_id: id };
    case "email.bounced":     return { type: "bounce", email, provider_message_id: id, hard: data.bounce?.type !== "Transient" };
    case "email.complained":  return { type: "complaint", email, provider_message_id: id };
    case "email.opened":      return { type: "open", email, provider_message_id: id };
    case "email.clicked":     return { type: "click", email, provider_message_id: id };
    default: return { type: "ignored", email };
  }
}

function normalizeSendgridEvent(payload: any): NormalizedEvent | null {
  const t = payload?.event as string | undefined;
  const email = payload?.email;
  const id = payload?.sg_message_id;
  if (!t || !email) return null;
  switch (t) {
    case "delivered":   return { type: "delivered", email, provider_message_id: id };
    case "bounce":      return { type: "bounce", email, provider_message_id: id, hard: payload.type === "bounce" };
    case "dropped":     return { type: "bounce", email, provider_message_id: id, hard: true, reason: payload.reason };
    case "spamreport":  return { type: "complaint", email, provider_message_id: id };
    case "unsubscribe": return { type: "unsubscribe", email, provider_message_id: id };
    case "open":        return { type: "open", email, provider_message_id: id };
    case "click":       return { type: "click", email, provider_message_id: id };
    default: return { type: "ignored", email };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") || "").toLowerCase();
  const orgId = url.searchParams.get("organization_id");
  if (!provider) return json({ error: "missing_provider" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rawBody = await req.text();

  // 1) Lookup secret
  const { data: secret, error: secretErr } = await supabase.rpc("get_email_webhook_secret", {
    _provider_code: provider,
    _organization_id: orgId,
  });
  if (secretErr || !secret) {
    console.warn("[email-events] no secret configured for", provider, orgId);
    return json({ error: "secret_not_configured" }, 401);
  }

  // 2) Verify signature
  let valid = false;
  try {
    if (provider === "resend")        valid = await verifyResend(rawBody, req.headers, secret as string);
    else if (provider === "sendgrid") valid = await verifySendgrid(rawBody, req.headers, secret as string);
    else                               valid = await verifyGeneric(rawBody, req.headers, secret as string);
  } catch (e) {
    console.error("[email-events] verify error:", e);
  }
  if (!valid) return json({ error: "invalid_signature" }, 401);

  // 3) Parse + normalise (SendGrid sends arrays; Resend single object)
  let parsed: any;
  try { parsed = JSON.parse(rawBody); } catch { return json({ error: "invalid_json" }, 400); }
  const events = Array.isArray(parsed) ? parsed : [parsed];

  const normalised: NormalizedEvent[] = [];
  for (const ev of events) {
    const n = provider === "sendgrid" ? normalizeSendgridEvent(ev) : normalizeResendEvent(ev);
    if (n && n.type !== "ignored") normalised.push(n);
  }

  // 4) Persist
  let suppressed = 0;
  let updatedRuns = 0;
  for (const ev of normalised) {
    // Suppress on hard bounce / complaint / unsubscribe
    if ((ev.type === "bounce" && ev.hard) || ev.type === "complaint" || ev.type === "unsubscribe") {
      const { error } = await supabase.from("suppressed_emails").upsert({
        email: ev.email.toLowerCase(),
        organization_id: orgId,
        provider_code: provider,
        source: ev.type,
        reason: ev.reason || ev.type,
        bounced_at: ev.type === "bounce" ? new Date().toISOString() : null,
        metadata: { provider_message_id: ev.provider_message_id },
      }, { onConflict: "id" });
      if (!error) suppressed++;
    }

    // Update automation run timing
    if (ev.provider_message_id) {
      const colMap: Record<string, string> = {
        delivered: "delivered_at",
        bounce: "bounced_at",
        complaint: "complained_at",
        unsubscribe: "unsubscribed_at",
        open: "opened_at",
        click: "clicked_at",
      };
      const col = colMap[ev.type];
      if (col) {
        const { error } = await supabase
          .from("email_automation_runs")
          .update({ [col]: new Date().toISOString() })
          .eq("provider_message_id", ev.provider_message_id);
        if (!error) updatedRuns++;
      }
    }
  }

  return json({ received: events.length, normalised: normalised.length, suppressed, updated_runs: updatedRuns });
});
