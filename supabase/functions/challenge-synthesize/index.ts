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

const AGENTS: Array<{ key: string; system: string }> = [
  {
    key: "executive",
    system: `Tu es un consultant senior en stratégie. À partir du briefing et des artefacts d'une session collaborative, produis une synthèse exécutive structurée. Réponds UNIQUEMENT en JSON valide avec ce schéma :
{ "summary": string (3-5 phrases), "insights": string[] (3 à 6), "tensions": string[] (2 à 5), "actions": string[] (3 à 6, formulées à l'impératif), "questions": string[] (2 à 4 questions ouvertes pour aller plus loin) }
Interdit : pas de chiffres inventés, pas de tournures vagues. Français.`,
  },
];

async function callLLM(system: string, user: string): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90_000);
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`LLM ${resp.status}: ${txt.slice(0, 200)}`);
    }
    const j = await resp.json();
    const raw = (j?.choices?.[0]?.message?.content ?? "").toString();
    try { return JSON.parse(raw); } catch { return { summary: raw }; }
  } finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id) return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: session } = await admin.from("challenge_sessions").select("*").eq("id", session_id).maybeSingle();
    if (!session) return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isHost } = await admin.rpc("is_workshop_host", { _workshop_id: session.workshop_id, _user_id: user.id });
    if (!isHost) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const [{ data: ctx }, { data: artifacts }, { data: votes }] = await Promise.all([
      admin.from("challenge_session_context").select("*").eq("session_id", session_id).maybeSingle(),
      admin.from("challenge_artifacts").select("id, kind, content, emoji, criticality, tags, status, parent_artifact_id").eq("session_id", session_id).neq("status", "archived").order("created_at", { ascending: true }).limit(400),
      admin.from("challenge_votes").select("artifact_id, weight").eq("session_id", session_id),
    ]);

    const voteByArt: Record<string, number> = {};
    for (const v of (votes ?? [])) voteByArt[v.artifact_id] = (voteByArt[v.artifact_id] ?? 0) + (v.weight || 1);

    const briefing = ctx ? `
PÉRIMÈTRE: ${ctx.scope || "—"}
OBJECTIFS: ${ctx.goals || "—"}
HYPOTHÈSES: ${ctx.hypotheses || "—"}
CONTRAINTES: ${ctx.constraints || "—"}
PARTIES PRENANTES: ${(ctx.stakeholders || []).map((s: any) => s.role || s).join(", ") || "—"}`.trim() : "(briefing non renseigné)";

    const formatted = (artifacts ?? [])
      .filter((a: any) => a.content)
      .map((a: any) => {
        const v = voteByArt[a.id] ? ` votes=${voteByArt[a.id]}` : "";
        const c = a.criticality ? `/${a.criticality}` : "";
        const s = a.status === "resolved" ? " (résolu)" : "";
        return `- [${a.kind}${c}${v}]${s} ${a.emoji || ""} ${a.content}`;
      }).join("\n").slice(0, 18000);

    const userPrompt = `BRIEFING:
${briefing}

ARTEFACTS DE LA SESSION (${(artifacts ?? []).length} éléments) :
${formatted || "(aucun artefact)"}

Produis maintenant la synthèse.`;

    const results: Array<{ agent: string; ok: boolean; error?: string }> = [];

    for (const agent of AGENTS) {
      try {
        const content = await callLLM(agent.system, userPrompt);
        const { data: prev } = await admin
          .from("challenge_syntheses")
          .select("version")
          .eq("session_id", session_id)
          .eq("agent", agent.key)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        const version = (prev?.version ?? 0) + 1;
        const { error } = await admin.from("challenge_syntheses").insert({
          session_id, agent: agent.key, version, content, generated_by: user.id,
        });
        if (error) throw error;
        results.push({ agent: agent.key, ok: true });
      } catch (e) {
        console.error(`agent ${agent.key}:`, e);
        results.push({ agent: agent.key, ok: false, error: String(e).slice(0, 200) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
