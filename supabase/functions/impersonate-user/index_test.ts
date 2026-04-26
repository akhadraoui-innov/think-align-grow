// Tests E2E pour l'edge function impersonate-user
// Lancement: supabase test db (Deno)
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/impersonate-user`;

async function call(body: unknown, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${token ?? ANON}`,
  };
  const r = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, json };
}

Deno.test("impersonate-user: rejects anonymous (no auth header beyond anon)", async () => {
  const { status, json } = await call({ user_id: "00000000-0000-0000-0000-000000000000" });
  // anon JWT is not a real user → invalid_session OR forbidden depending on JWT shape
  assert(
    status === 401 || status === 403,
    `expected 401|403, got ${status} (${JSON.stringify(json)})`,
  );
});

Deno.test("impersonate-user: rejects malformed UUID", async () => {
  const { status, json } = await call({ user_id: "not-a-uuid" });
  // Either auth fails first (401) or validation fails (400)
  assert(
    status === 400 || status === 401 || status === 403,
    `expected 400|401|403, got ${status} (${JSON.stringify(json)})`,
  );
});

Deno.test("impersonate-user: handles OPTIONS (CORS)", async () => {
  const r = await fetch(FN_URL, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.status, 200);
});
