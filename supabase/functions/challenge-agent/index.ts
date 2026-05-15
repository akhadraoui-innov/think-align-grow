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

async function loadBriefing(session_id: string) {
  const { data: ctx } = await admin
    .from("challenge_session_context")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle();
  if (!ctx) return "(briefing non renseigné)";
  return `PÉRIMÈTRE: ${ctx.scope || "—"}
OBJECTIFS: ${ctx.goals || "—"}
HYPOTHÈSES: ${ctx.hypotheses || "—"}
CONTRAINTES: ${ctx.constraints || "—"}
PARTIES PRENANTES: ${(ctx.stakeholders || []).map((s: any) => s.role || s).join(", ") || "—"}`;
}

async function callLLM(messages: any[], opts: { model?: string; timeoutMs?: number } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60_000);
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: opts.model || "google/gemini-2.5-flash", messages }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway:", resp.status, txt);
      return { ok: false as const, error: txt.slice(0, 300), status: resp.status };
    }
    const data = await resp.json();
    const answer = (data?.choices?.[0]?.message?.content ?? "").toString().trim();
    return { ok: true as const, answer };
  } finally { clearTimeout(t); }
}

const POSTIT_ACTION_PROMPTS: Record<string, string> = {
  reformuler: "Reformule ce post-it en une version plus claire, percutante et professionnelle (1-2 phrases). Garde le sens.",
  challenger: "Challenge ce post-it : pointe l'angle mort, la faiblesse, la contradiction. Sois constructif mais incisif (3-4 phrases).",
  approfondir: "Approfondis ce post-it : déroule les implications, ouvre 2-3 pistes concrètes, propose une question à creuser.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const mode = (body?.mode as string | undefined) || "qa";
    const session_id = body?.session_id as string | undefined;
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ COPILOT MODE (no artifact required) ============
    if (mode === "copilot") {
      const { data: session } = await admin.from("challenge_sessions").select("workshop_id").eq("id", session_id).maybeSingle();
      if (!session) return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!(await isParticipantOrHost(session.workshop_id, user.id))) {
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const briefing = await loadBriefing(session_id);
      const ctx = body?.context || {};
      const userMessages = (body?.messages || []) as Array<{ role: "user" | "assistant"; content: string }>;
      const lastUser = [...userMessages].reverse().find(m => m.role === "user")?.content || "";

      // Hybrid retrieval
      const qEmb = lastUser ? await embed(lastUser) : null;
      let semantic: any[] = [];
      if (qEmb) {
        const { data: matches } = await admin.rpc("match_challenge_artifacts", {
          _query: qEmb as any, _session: session_id, _k: 8, _exclude: null,
        });
        semantic = (matches as any[]) || [];
      }
      const { data: recent } = await admin
        .from("challenge_artifacts")
        .select("id, kind, content, emoji, criticality, transcription, ai_meta")
        .eq("session_id", session_id)
        .order("created_at", { ascending: false })
        .limit(15);
      const seen = new Set<string>();
      const merged = [...semantic, ...(recent || [])].filter((a: any) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
      const ctxBlock = merged.slice(0, 16).map((a: any) => {
        const txt = a.content || a.transcription || a.ai_meta?.alt || a.ai_meta?.description || "";
        return `- [${a.kind}${a.criticality ? `/${a.criticality}` : ""}] ${a.emoji || ""} ${txt}`.trim();
      }).join("\n");

      let focusBlock = "";
      if (ctx.artifact_id) {
        const { data: a } = await admin.from("challenge_artifacts").select("kind, content, transcription, ai_meta, criticality").eq("id", ctx.artifact_id).maybeSingle();
        if (a) focusBlock = `\nÉLÉMENT EN FOCUS: [${a.kind}${a.criticality ? `/${a.criticality}` : ""}] ${a.content || a.transcription || a.ai_meta?.alt || ""}`;
      }

      const sys = `Tu es le Co-pilote IA d'un atelier d'innovation collaboratif. Tu réponds en français, ton de coach senior, concis (max 6 phrases), structuré avec puces si utile, actionnable. Tu peux poser une contre-question si la demande est floue. Tu cites les éléments du plateau quand pertinent.`;
      const sysCtx = `BRIEFING:\n${briefing}\n\nCONTEXTE PLATEAU (extrait pertinent):\n${ctxBlock || "(aucun)"}${focusBlock}`;
      const messages = [
        { role: "system", content: sys },
        { role: "system", content: sysCtx },
        ...userMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      ];

      const out = await callLLM(messages);
      if (!out.ok) return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true, answer: out.answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ ARTIFACT-BOUND MODES ============
    const artifact_id = body?.artifact_id as string | undefined;
    if (!artifact_id) {
      return new Response(JSON.stringify({ error: "artifact_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: artifact } = await admin.from("challenge_artifacts").select("*").eq("id", artifact_id).maybeSingle();
    if (!artifact || artifact.session_id !== session_id) {
      return new Response(JSON.stringify({ error: "artifact_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!(await isParticipantOrHost(artifact.workshop_id, user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const briefing = await loadBriefing(session_id);

    // Mark thinking
    await admin.from("challenge_artifacts").update({
      ai_meta: { ...(artifact.ai_meta || {}), status: "thinking", recipient: artifact.ai_meta?.recipient || "ai" },
    }).eq("id", artifact_id);

    // ===== POSTIT ACTION =====
    if (mode === "postit_action") {
      const action = (body?.action as string) || "reformuler";
      const instr = POSTIT_ACTION_PROMPTS[action] || POSTIT_ACTION_PROMPTS.reformuler;
      const out = await callLLM([
        { role: "system", content: `Tu es un coach senior. Réponds en français, concis et actionnable. ${instr}` },
        { role: "user", content: `BRIEFING:\n${briefing}\n\nPOST-IT:\n${artifact.content || ""}` },
      ]);
      if (!out.ok) {
        await admin.from("challenge_artifacts").update({ ai_meta: { ...(artifact.ai_meta || {}), status: "failed" } }).eq("id", artifact_id);
        return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await admin.from("challenge_artifacts").update({
        ai_meta: { ...(artifact.ai_meta || {}), status: "answered", response: out.answer, action, mode, answered_at: new Date().toISOString() },
      }).eq("id", artifact_id);
      return new Response(JSON.stringify({ ok: true, answer: out.answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== IMAGE DESCRIBE (vision) =====
    if (mode === "image_describe") {
      const url = artifact.content as string | null;
      if (!url) {
        return new Response(JSON.stringify({ error: "no_image_url" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const out = await callLLM([
        { role: "system", content: "Tu décris une image dans le contexte d'un atelier d'innovation. Tu produis : (1) une description objective en 2 phrases, (2) un titre court, (3) une critique constructive en 2 phrases (ce qui marche / ce qu'on pourrait améliorer). Réponds en français, structuré en markdown léger." },
        { role: "user", content: [
          { type: "text", text: `BRIEFING:\n${briefing}\n\nDécris cette image.` },
          { type: "image_url", image_url: { url } },
        ] as any },
      ], { model: "google/gemini-2.5-flash" });
      if (!out.ok) {
        await admin.from("challenge_artifacts").update({ ai_meta: { ...(artifact.ai_meta || {}), status: "failed" } }).eq("id", artifact_id);
        return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await admin.from("challenge_artifacts").update({
        ai_meta: { ...(artifact.ai_meta || {}), status: "answered", description: out.answer, response: out.answer, mode, answered_at: new Date().toISOString() },
      }).eq("id", artifact_id);
      return new Response(JSON.stringify({ ok: true, answer: out.answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== VOICE SUMMARY =====
    if (mode === "voice_summary") {
      const transcript = (artifact.transcription || "").trim();
      if (!transcript) {
        return new Response(JSON.stringify({ error: "no_transcription" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const out = await callLLM([
        { role: "system", content: "Tu synthétises un mémo vocal d'atelier. Produis : (1) un résumé en 2 phrases, (2) 3 bullets clés, (3) 1-2 actions concrètes. Réponds en français, markdown léger." },
        { role: "user", content: `BRIEFING:\n${briefing}\n\nTRANSCRIPTION:\n${transcript}` },
      ]);
      if (!out.ok) {
        await admin.from("challenge_artifacts").update({ ai_meta: { ...(artifact.ai_meta || {}), status: "failed" } }).eq("id", artifact_id);
        return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await admin.from("challenge_artifacts").update({
        ai_meta: { ...(artifact.ai_meta || {}), status: "answered", summary: out.answer, response: out.answer, mode, answered_at: new Date().toISOString() },
      }).eq("id", artifact_id);
      return new Response(JSON.stringify({ ok: true, answer: out.answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== DEFAULT: QA (existing question/answer behavior with hybrid retrieval) =====
    const queryText = (artifact.content || "").toString();
    const queryEmbedding = queryText ? await embed(queryText) : null;

    let semanticHits: any[] = [];
    if (queryEmbedding) {
      const { data: matches } = await admin.rpc("match_challenge_artifacts", {
        _query: queryEmbedding as any, _session: session_id, _k: 8, _exclude: artifact_id,
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

    const out = await callLLM([
      { role: "system", content: `Tu es un coach senior en innovation/stratégie qui assiste un atelier collaboratif. Tu réponds en français, de manière concise (max 6 phrases), structurée, actionnable. Tu peux poser une contre-question si la question est trop floue. Tu cites le briefing quand c'est utile. Tu ne fabriques pas de chiffres.` },
      { role: "user", content: `BRIEFING DE LA SESSION:\n${briefing}\n\nARTEFACTS PERTINENTS:\n${contextBlock || "(aucun)"}\n\nQUESTION:\n${queryText || "(vide)"}\n\nRéponds maintenant.` },
    ]);
    if (!out.ok) {
      await admin.from("challenge_artifacts").update({ ai_meta: { ...(artifact.ai_meta || {}), status: "failed" } }).eq("id", artifact_id);
      return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("challenge_artifacts").update({
      ai_meta: {
        ...(artifact.ai_meta || {}),
        status: "answered", response: out.answer, model: "gemini-2.5-flash",
        retrieval: { semantic: semanticHits.length, recent: (recent || []).length },
        mode, answered_at: new Date().toISOString(),
      },
    }).eq("id", artifact_id);

    return new Response(JSON.stringify({ ok: true, answer: out.answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
