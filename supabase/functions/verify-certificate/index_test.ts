// Smoke tests for the verify-certificate edge function.
// Tests against the deployed function via HTTP — no Deno.serve mocking.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const FN_URL = `${SUPABASE_URL}/functions/v1/verify-certificate`;

async function callVerify(payload: Record<string, unknown>) {
  return await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

Deno.test({
  name: "verify-certificate handles CORS preflight",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await fetch(FN_URL, { method: "OPTIONS" });
    await res.text();
    assertEquals([200, 204].includes(res.status), true);
  },
});

Deno.test({
  name: "verify-certificate returns 400/404 for missing identifier",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callVerify({});
    await res.text();
    // Accept any client-error status — function should reject empty input
    assertEquals(res.status >= 400 && res.status < 500, true);
  },
});

Deno.test({
  name: "verify-certificate returns 404 for unknown certificate",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callVerify({ certificate_id: "00000000-0000-0000-0000-000000000000" });
    const body = await res.json().catch(() => ({}));
    // Either 404 or 200 with valid:false depending on implementation
    if (res.status === 200) {
      assertEquals(body?.valid ?? false, false);
    } else {
      assertEquals(res.status, 404);
    }
  },
});
