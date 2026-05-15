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
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function isParticipantOrHost(workshopId: string, userId: string): Promise<boolean> {
  const [{ data: p }, { data: h }] = await Promise.all([
    admin.rpc("is_workshop_participant", { _workshop_id: workshopId, _user_id: userId }),
    admin.rpc("is_workshop_host", { _workshop_id: workshopId, _user_id: userId }),
  ]);
  return Boolean(p) || Boolean(h);
}

async function embed(text: string): Promise<number[] | null> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!resp.ok) {
    console.error("embed fail", resp.status, await resp.text());
    return null;
  }
  const j = await resp.json();
  return j?.data?.[0]?.embedding ?? null;
}

function vectorLiteral(v: number[]): string {
  return "[" + v.join(",") + "]";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const target = body?.target as "artifact" | "context";
    const id = body?.id as string;
    if (!target || !id) {
      return new Response(JSON.stringify({ error: "target and id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (target === "artifact") {
      const { data: a } = await admin.from("challenge_artifacts").select("id, workshop_id, content, transcription").eq("id", id).maybeSingle();
      if (!a) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await isParticipantOrHost(a.workshop_id, user.id))) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const text = (a.transcription || a.content || "").trim();
      if (!text) return new Response(JSON.stringify({ ok: true, skipped: "empty" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const vec = await embed(text);
      if (!vec) return new Response(JSON.stringify({ error: "embed_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await admin.from("challenge_artifacts").update({
        embedding: vectorLiteral(vec) as any,
        embedding_input: text,
      }).eq("id", id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (target === "context") {
      const { data: ctx } = await admin
        .from("challenge_session_context")
        .select("id, session_id, scope, goals, hypotheses, constraints, stakeholders")
        .eq("id", id).maybeSingle();
      if (!ctx) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: sess } = await admin.from("challenge_sessions").select("workshop_id").eq("id", ctx.session_id).maybeSingle();
      if (!sess || !(await isParticipantOrHost(sess.workshop_id, user.id))) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const text = [
        ctx.scope && `Périmètre: ${ctx.scope}`,
        ctx.goals && `Objectifs: ${ctx.goals}`,
        ctx.hypotheses && `Hypothèses: ${ctx.hypotheses}`,
        ctx.constraints && `Contraintes: ${ctx.constraints}`,
        Array.isArray(ctx.stakeholders) && ctx.stakeholders.length ? `Parties prenantes: ${(ctx.stakeholders as any[]).map(s => s.role || s).join(", ")}` : null,
      ].filter(Boolean).join("\n");

      if (!text) return new Response(JSON.stringify({ ok: true, skipped: "empty" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const vec = await embed(text);
      if (!vec) return new Response(JSON.stringify({ error: "embed_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await admin.from("challenge_session_context").update({
        embedding: vectorLiteral(vec) as any,
        embedding_input: text,
      }).eq("id", id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "invalid_target" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
