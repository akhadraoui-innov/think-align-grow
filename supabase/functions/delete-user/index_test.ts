// Tests E2E pour l'edge function delete-user (Lot 2 — non-régression Lot 4)
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/delete-user`;

async function call(body: unknown, token?: string) {
  const r = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${token ?? ANON}`,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* */ }
  return { status: r.status, json };
}

Deno.test("delete-user: rejects anonymous", async () => {
  const { status } = await call({ user_id: "00000000-0000-0000-0000-000000000000" });
  assert(status === 401 || status === 403, `got ${status}`);
});

Deno.test("delete-user: rejects malformed user_id with auth check first", async () => {
  // Without a real super_admin JWT, function returns 401 (invalid_session) or 403 (forbidden)
  const { status } = await call({ user_id: "bad" });
  assert(
    status === 400 || status === 401 || status === 403,
    `got ${status}`,
  );
});

Deno.test("delete-user: CORS preflight", async () => {
  const r = await fetch(FN_URL, { method: "OPTIONS" });
  await r.text();
  assertEquals(r.status, 200);
});
