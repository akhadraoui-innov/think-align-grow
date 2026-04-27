// Smoke tests for the Vault helper RPCs introduced in Lot 9.3.
// These RPCs are service-role only — calling them with anon key MUST fail.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ??
  Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ?? "";

async function callRpc(name: string, body: Record<string, unknown>) {
  return await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

Deno.test({
  name: "app_get_secret is not callable by anon role",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callRpc("app_get_secret", {
      _secret_id: "00000000-0000-0000-0000-000000000000",
      _context: "test",
    });
    await res.text();
    // Expect 403/404 (not 200) — function is REVOKEd from anon
    assertEquals(res.status >= 400, true, `Expected 4xx, got ${res.status}`);
  },
});

Deno.test({
  name: "get_ai_api_key is not callable by anon role",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callRpc("get_ai_api_key", {
      _config_id: "00000000-0000-0000-0000-000000000000",
    });
    await res.text();
    assertEquals(res.status >= 400, true, `Expected 4xx, got ${res.status}`);
  },
});

Deno.test({
  name: "get_email_provider_credentials is not callable by anon role",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callRpc("get_email_provider_credentials", {
      _config_id: "00000000-0000-0000-0000-000000000000",
    });
    await res.text();
    assertEquals(res.status >= 400, true, `Expected 4xx, got ${res.status}`);
  },
});

Deno.test({
  name: "get_email_webhook_secret is not callable by anon role",
  ignore: !SUPABASE_URL,
  fn: async () => {
    const res = await callRpc("get_email_webhook_secret", {
      _provider_code: "resend",
      _organization_id: null,
    });
    await res.text();
    assertEquals(res.status >= 400, true, `Expected 4xx, got ${res.status}`);
  },
});
