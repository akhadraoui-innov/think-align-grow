const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function rest(path: string, init?: RequestInit) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
  if (resp.status === 204) return null;
  return await resp.json();
}

async function patchArtifact(id: string, patch: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/challenge_artifacts?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(patch),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { artifact_id, session_id, mode = "qa" } = await req.json();
    if (!artifact_id || !session_id) {
      return new Response(JSON.stringify({ error: "artifact_id and session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [artifactRows, ctxRows, recentArtifacts] = await Promise.all([
      rest(`challenge_artifacts?id=eq.${artifact_id}&select=*`),
      rest(`challenge_session_context?session_id=eq.${session_id}&select=*`),
      rest(`challenge_artifacts?session_id=eq.${session_id}&order=created_at.desc&limit=20&select=kind,content,emoji,criticality`),
    ]) as any[];

    const artifact = artifactRows?.[0];
    const ctx = ctxRows?.[0];
    if (!artifact) throw new Error("artifact_not_found");

    const briefing = ctx ? `
PÉRIMÈTRE: ${ctx.scope || "—"}
OBJECTIFS: ${ctx.goals || "—"}
HYPOTHÈSES: ${ctx.hypotheses || "—"}
CONTRAINTES: ${ctx.constraints || "—"}
PARTIES PRENANTES: ${(ctx.stakeholders || []).map((s: any) => s.role || s).join(", ") || "—"}
`.trim() : "(briefing non renseigné)";

    const recent = (recentArtifacts || [])
      .filter((a: any) => a.content)
      .slice(0, 12)
      .map((a: any) => `- [${a.kind}${a.criticality ? `/${a.criticality}` : ""}] ${a.emoji || ""} ${a.content}`)
      .join("\n");

    const systemPrompt = `Tu es un coach senior en innovation/stratégie qui assiste un atelier collaboratif. Tu réponds en français, de manière concise (max 6 phrases), structurée, actionnable. Tu peux poser une contre-question si la question est trop floue. Tu cites le briefing quand c'est utile. Tu ne fabriques pas de chiffres.`;

    const userPrompt = `BRIEFING DE LA SESSION:
${briefing}

DERNIERS ARTEFACTS DE L'ATELIER:
${recent || "(aucun)"}

QUESTION DU PARTICIPANT:
${artifact.content || "(vide)"}

Réponds maintenant.`;

    await patchArtifact(artifact_id, { ai_meta: { ...(artifact.ai_meta || {}), status: "thinking", recipient: artifact.ai_meta?.recipient || "ai" } });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway:", resp.status, txt);
      await patchArtifact(artifact_id, { ai_meta: { ...(artifact.ai_meta || {}), status: "failed", error: txt.slice(0, 200) } });
      return new Response(JSON.stringify({ error: "ai_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const answer = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    await patchArtifact(artifact_id, {
      ai_meta: {
        ...(artifact.ai_meta || {}),
        status: "answered",
        response: answer,
        model: "gemini-2.5-flash",
        mode,
        answered_at: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({ ok: true, answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
