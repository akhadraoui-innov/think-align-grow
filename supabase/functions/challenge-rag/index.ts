import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function getCallerOrFail(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const u = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data, error } = await u.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function isParticipantOrHost(workshopId: string, userId: string) {
  const [{ data: p }, { data: h }] = await Promise.all([
    admin.rpc("is_workshop_participant", { _workshop_id: workshopId, _user_id: userId }),
    admin.rpc("is_workshop_host", { _workshop_id: workshopId, _user_id: userId }),
  ]);
  return Boolean(p) || Boolean(h);
}

async function embed(text: string): Promise<number[] | null> {
  if (!text?.trim()) return null;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!r.ok) { console.error("embed", r.status, await r.text()); return null; }
  const j = await r.json();
  return j?.data?.[0]?.embedding ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const session_id = body?.session_id as string;
    const query = (body?.query as string)?.trim();
    const kinds = (body?.kinds as string[] | undefined) || null;
    const k = Math.min(Math.max(Number(body?.k) || 8, 1), 30);

    if (!session_id || !query) {
      return new Response(JSON.stringify({ error: "session_id and query required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: sess } = await admin.from("challenge_sessions").select("workshop_id").eq("id", session_id).maybeSingle();
    if (!sess) return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!(await isParticipantOrHost(sess.workshop_id, user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const vec = await embed(query);
    if (!vec) return new Response(JSON.stringify({ error: "embed_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: matches, error } = await admin.rpc("match_challenge_context", {
      p_session_id: session_id,
      p_query_embedding: vec as any,
      p_source_types: kinds,
      p_match_count: k,
    });
    if (error) {
      console.error("rpc match_challenge_context", error);
      return new Response(JSON.stringify({ error: "rag_failed", details: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, matches: matches || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
