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
  if (!text?.trim()) return null;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!resp.ok) { console.error("embed:", resp.status, await resp.text()); return null; }
    const j = await resp.json();
    return j?.data?.[0]?.embedding ?? null;
  } catch (e) { console.error("embed err", e); return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const artifact_id = body?.artifact_id as string | undefined;
    const session_id = body?.session_id as string | undefined;
    const mode = (body?.mode as string | undefined) || "qa";
    if (!artifact_id || !session_id) {
      return new Response(JSON.stringify({ error: "artifact_id and session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: artifact } = await admin
      .from("challenge_artifacts")
      .select("*")
      .eq("id", artifact_id)
      .maybeSingle();
    if (!artifact || artifact.session_id !== session_id) {
      return new Response(JSON.stringify({ error: "artifact_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!(await isParticipantOrHost(artifact.workshop_id, user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: ctx } = await admin
      .from("challenge_session_context")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();

    const briefing = ctx ? `
PÉRIMÈTRE: ${ctx.scope || "—"}
OBJECTIFS: ${ctx.goals || "—"}
HYPOTHÈSES: ${ctx.hypotheses || "—"}
CONTRAINTES: ${ctx.constraints || "—"}
PARTIES PRENANTES: ${(ctx.stakeholders || []).map((s: any) => s.role || s).join(", ") || "—"}
`.trim() : "(briefing non renseigné)";

    // Hybrid retrieval: semantic (if question has embedding) + 12 most recent
    const queryText = (artifact.content || "").toString();
    const queryEmbedding = queryText ? await embed(queryText) : null;

    let semanticHits: any[] = [];
    if (queryEmbedding) {
      const { data: matches } = await admin.rpc("match_challenge_artifacts", {
        _query: queryEmbedding as any,
        _session: session_id,
        _k: 8,
        _exclude: artifact_id,
      });
      semanticHits = (matches as any[]) || [];
    }

    const { data: recent } = await admin
      .from("challenge_artifacts")
      .select("id, kind, content, emoji, criticality")
      .eq("session_id", session_id)
      .neq("id", artifact_id)
      .order("created_at", { ascending: false })
      .limit(12);

    const seen = new Set<string>();
    const merged = [
      ...semanticHits.map((m: any) => ({ ...m, source: "semantic" })),
      ...(recent || []).map((m: any) => ({ ...m, source: "recent" })),
    ].filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

    const contextBlock = merged
      .filter((a: any) => a.content)
      .slice(0, 14)
      .map((a: any) => `- [${a.kind}${a.criticality ? `/${a.criticality}` : ""}${a.source === "semantic" ? ` sim=${(a.similarity ?? 0).toFixed(2)}` : ""}] ${a.emoji || ""} ${a.content}`)
      .join("\n");

    const systemPrompt = `Tu es un coach senior en innovation/stratégie qui assiste un atelier collaboratif. Tu réponds en français, de manière concise (max 6 phrases), structurée, actionnable. Tu peux poser une contre-question si la question est trop floue. Tu cites le briefing quand c'est utile. Tu ne fabriques pas de chiffres.`;

    const userPrompt = `BRIEFING DE LA SESSION:
${briefing}

ARTEFACTS PERTINENTS DE L'ATELIER:
${contextBlock || "(aucun)"}

QUESTION DU PARTICIPANT:
${queryText || "(vide)"}

Réponds maintenant.`;

    await admin.from("challenge_artifacts").update({
      ai_meta: { ...(artifact.ai_meta || {}), status: "thinking", recipient: artifact.ai_meta?.recipient || "ai" },
    }).eq("id", artifact_id);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60_000);
    let resp: Response;
    try {
      resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway:", resp.status, txt);
      await admin.from("challenge_artifacts").update({
        ai_meta: { ...(artifact.ai_meta || {}), status: "failed", error: txt.slice(0, 200) },
      }).eq("id", artifact_id);
      return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const answer = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    await admin.from("challenge_artifacts").update({
      ai_meta: {
        ...(artifact.ai_meta || {}),
        status: "answered",
        response: answer,
        model: "gemini-2.5-flash",
        retrieval: { semantic: semanticHits.length, recent: (recent || []).length },
        mode,
        answered_at: new Date().toISOString(),
      },
    }).eq("id", artifact_id);

    return new Response(JSON.stringify({ ok: true, answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
