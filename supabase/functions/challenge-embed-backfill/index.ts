// Backfill embeddings for an entire session: artifacts, threads, briefing, syntheses, interactions (edits/ai_ask).
// Idempotent — uses upsert on (session_id, source_type, source_id).

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

async function getCaller(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const u = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data } = await u.auth.getUser();
  return data?.user ?? null;
}

async function isHost(workshopId: string, userId: string) {
  const { data } = await admin.rpc("is_workshop_host", { _workshop_id: workshopId, _user_id: userId });
  return Boolean(data);
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

const vec = (v: number[]) => "[" + v.join(",") + "]";

async function upsert(row: {
  session_id: string; workshop_id: string;
  source_type: string; source_id: string;
  content: string; metadata?: Record<string, any>; v: number[];
}) {
  await admin.from("challenge_embeddings").upsert({
    session_id: row.session_id,
    workshop_id: row.workshop_id,
    source_type: row.source_type,
    source_id: row.source_id,
    content: row.content.slice(0, 8000),
    metadata: row.metadata || {},
    embedding: vec(row.v) as any,
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id,source_type,source_id" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getCaller(req);
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const session_id = body?.session_id as string;
    const force = Boolean(body?.force);
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: sess } = await admin.from("challenge_sessions").select("id, workshop_id").eq("id", session_id).maybeSingle();
    if (!sess) return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!(await isHost(sess.workshop_id, user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Existing keys to skip
    const existing = new Set<string>();
    if (!force) {
      const { data: ex } = await admin
        .from("challenge_embeddings")
        .select("source_type, source_id")
        .eq("session_id", session_id);
      for (const e of (ex || [])) existing.add(`${e.source_type}:${e.source_id}`);
    }

    const stats = { artifacts: 0, threads: 0, briefing: 0, syntheses: 0, interactions: 0, skipped: 0, failed: 0 };

    // 1) Artifacts (and threads)
    const { data: arts } = await admin
      .from("challenge_artifacts")
      .select("id, kind, content, transcription, ai_meta, criticality, subject_id, slot_id, parent_artifact_id")
      .eq("session_id", session_id)
      .eq("status", "active");

    for (const a of (arts || [])) {
      const src_type = a.parent_artifact_id ? "thread" : "artifact";
      const key = `${src_type}:${a.id}`;
      if (existing.has(key)) { stats.skipped++; continue; }
      const text = (a.transcription || a.content || (a.ai_meta as any)?.alt || "").trim();
      if (!text) { stats.skipped++; continue; }
      const v = await embed(text);
      if (!v) { stats.failed++; continue; }
      await upsert({
        session_id, workshop_id: sess.workshop_id, source_type: src_type, source_id: a.id,
        content: text,
        metadata: { kind: a.kind, criticality: a.criticality, subject_id: a.subject_id, slot_id: a.slot_id },
        v,
      });
      if (src_type === "thread") stats.threads++; else stats.artifacts++;
    }

    // 2) Briefing (session_context)
    const { data: ctxs } = await admin
      .from("challenge_session_context")
      .select("id, scope, goals, hypotheses, constraints, stakeholders")
      .eq("session_id", session_id);
    for (const c of (ctxs || [])) {
      const key = `briefing:${c.id}`;
      if (existing.has(key)) { stats.skipped++; continue; }
      const text = [
        c.scope && `Périmètre: ${c.scope}`,
        c.goals && `Objectifs: ${c.goals}`,
        c.hypotheses && `Hypothèses: ${c.hypotheses}`,
        c.constraints && `Contraintes: ${c.constraints}`,
        Array.isArray(c.stakeholders) && c.stakeholders.length
          ? `Parties prenantes: ${(c.stakeholders as any[]).map((s: any) => s.role || s).join(", ")}` : null,
      ].filter(Boolean).join("\n").trim();
      if (!text) { stats.skipped++; continue; }
      const v = await embed(text);
      if (!v) { stats.failed++; continue; }
      await upsert({ session_id, workshop_id: sess.workshop_id, source_type: "briefing", source_id: c.id, content: text, v });
      stats.briefing++;
    }

    // 3) Syntheses
    const { data: syns } = await admin
      .from("challenge_syntheses")
      .select("id, agent, scope, scope_id, content")
      .eq("session_id", session_id);
    for (const s of (syns || [])) {
      const key = `synthesis:${s.id}`;
      if (existing.has(key)) { stats.skipped++; continue; }
      const c = s.content as any;
      const text = (typeof c === "string" ? c : c?.markdown || c?.text || JSON.stringify(c)).slice(0, 8000);
      if (!text) { stats.skipped++; continue; }
      const v = await embed(text);
      if (!v) { stats.failed++; continue; }
      await upsert({
        session_id, workshop_id: sess.workshop_id, source_type: "synthesis", source_id: s.id,
        content: text, metadata: { agent: s.agent, scope: s.scope, scope_id: s.scope_id }, v,
      });
      stats.syntheses++;
    }

    // 4) Significant interactions (edits + ai_ask)
    const { data: ints } = await admin
      .from("challenge_interactions")
      .select("id, kind, payload, artifact_id, subject_id, slot_id, created_at")
      .eq("session_id", session_id)
      .in("kind", ["edit", "ai_ask", "create"])
      .order("created_at", { ascending: false })
      .limit(500);
    for (const i of (ints || [])) {
      const key = `interaction:${i.id}`;
      if (existing.has(key)) { stats.skipped++; continue; }
      const p = i.payload as any;
      const text = (p?.content_preview || p?.prompt || p?.text || "").trim();
      if (!text || text.length < 20) { stats.skipped++; continue; }
      const v = await embed(text);
      if (!v) { stats.failed++; continue; }
      await upsert({
        session_id, workshop_id: sess.workshop_id, source_type: "interaction", source_id: i.id,
        content: text, metadata: { kind: i.kind, artifact_id: i.artifact_id, subject_id: i.subject_id, slot_id: i.slot_id }, v,
      });
      stats.interactions++;
    }

    return new Response(JSON.stringify({ ok: true, stats }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
