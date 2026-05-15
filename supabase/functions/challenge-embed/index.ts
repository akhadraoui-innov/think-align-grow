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

async function upsertEmbedding(params: {
  session_id: string;
  workshop_id: string;
  source_type: "artifact" | "card" | "subject" | "slot" | "briefing" | "thread" | "synthesis";
  source_id: string;
  content: string;
  metadata?: Record<string, any>;
  vec: number[];
}) {
  await admin.from("challenge_embeddings").upsert({
    session_id: params.session_id,
    workshop_id: params.workshop_id,
    source_type: params.source_type,
    source_id: params.source_id,
    content: params.content.slice(0, 8000),
    metadata: params.metadata || {},
    embedding: vectorLiteral(params.vec) as any,
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id,source_type,source_id" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const target = body?.target as
      | "artifact" | "context" | "subject" | "slot" | "card" | "synthesis" | "batch_session";
    const id = body?.id as string | undefined;
    if (!target) {
      return new Response(JSON.stringify({ error: "target required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (target === "artifact" && id) {
      const { data: a } = await admin.from("challenge_artifacts").select("id, workshop_id, session_id, kind, content, transcription, ai_meta, criticality, parent_artifact_id, subject_id, slot_id").eq("id", id).maybeSingle();
      if (!a) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await isParticipantOrHost(a.workshop_id, user.id))) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const text = (a.transcription || a.content || (a.ai_meta as any)?.alt || "").trim();
      if (!text) return new Response(JSON.stringify({ ok: true, skipped: "empty" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const vec = await embed(text);
      if (!vec) return new Response(JSON.stringify({ error: "embed_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await admin.from("challenge_artifacts").update({
        embedding: vectorLiteral(vec) as any,
        embedding_input: text,
      }).eq("id", id);

      // Mirror into unified RAG store
      await upsertEmbedding({
        session_id: a.session_id, workshop_id: a.workshop_id,
        source_type: a.parent_artifact_id ? "thread" : "artifact",
        source_id: a.id,
        content: text,
        metadata: { kind: a.kind, criticality: a.criticality, subject_id: a.subject_id, slot_id: a.slot_id },
        vec,
      });

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (target === "context" && id) {
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

      await upsertEmbedding({
        session_id: ctx.session_id, workshop_id: sess.workshop_id,
        source_type: "briefing", source_id: ctx.id,
        content: text, vec,
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generic targets: subject / slot / card / synthesis (free-form text from client)
    if (["subject", "slot", "card", "synthesis"].includes(target)) {
      const session_id = body?.session_id as string | undefined;
      const workshop_id = body?.workshop_id as string | undefined;
      const source_id = (body?.source_id || id) as string | undefined;
      const text = (body?.text as string | undefined)?.trim();
      const metadata = (body?.metadata || {}) as Record<string, any>;
      if (!session_id || !workshop_id || !source_id || !text) {
        return new Response(JSON.stringify({ error: "session_id, workshop_id, source_id, text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!(await isParticipantOrHost(workshop_id, user.id))) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const vec = await embed(text);
      if (!vec) return new Response(JSON.stringify({ error: "embed_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await upsertEmbedding({
        session_id, workshop_id,
        source_type: target as any, source_id,
        content: text, metadata, vec,
      });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "invalid_target" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
