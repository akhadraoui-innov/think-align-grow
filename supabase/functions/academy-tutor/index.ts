import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    switch (action) {
      case "brief": return await handleBrief(supabase, user, params, LOVABLE_API_KEY, corsHeaders);
      case "explain": return await handleExplain(params, LOVABLE_API_KEY, corsHeaders);
      case "coach": return await handleCoach(supabase, user, params, LOVABLE_API_KEY, corsHeaders);
      case "debrief": return await handleDebrief(supabase, user, params, LOVABLE_API_KEY, corsHeaders);
      default: throw new Error(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("academy-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(apiKey: string, messages: any[]) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, max_tokens: 1000 }),
  });
  if (!resp.ok) throw new Error(`AI call failed: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── BRIEF: Pre-module personalized introduction ───
async function handleBrief(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, path_id } = params;

  const [{ data: mod }, { data: path }, { data: profile }] = await Promise.all([
    supabase.from("academy_modules").select("title, description, objectives, module_type").eq("id", module_id).single(),
    path_id ? supabase.from("academy_paths").select("name, skills, aptitudes, description").eq("id", path_id).single() : { data: null },
    supabase.from("profiles").select("display_name, job_title, department").eq("user_id", user.id).single(),
  ]);

  const systemPrompt = `Tu es un tuteur IA pédagogique professionnel. Tu prépares l'apprenant à un module de formation.
Sois concis (3-5 phrases max), engageant et personnalisé. Utilise le markdown.`;

  const userPrompt = `Module : ${mod?.title} (${mod?.module_type})
Description : ${mod?.description}
Objectifs : ${JSON.stringify(mod?.objectives)}
Parcours : ${path?.name || "N/A"}
Compétences visées : ${JSON.stringify(path?.skills || [])}
Apprenant : ${profile?.display_name || user.email?.split("@")[0]} — ${profile?.job_title || "Collaborateur"} (${profile?.department || ""})

Génère un brief personnalisé : pourquoi ce module est important pour l'apprenant, ce qu'il va apprendre, et le lien avec les compétences du parcours.`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── EXPLAIN: Post-quiz-answer contextual insight ───
async function handleExplain(_params: any, apiKey: string, cors: any) {
  const { question, user_answer, correct_answer, is_correct, module_title, explanation } = _params;

  const systemPrompt = `Tu es un tuteur IA. Après une réponse de quiz, tu donnes un insight pédagogique enrichi en 2-3 phrases.
Si la réponse est correcte, renforce et approfondis. Si incorrecte, explique sans juger et donne un angle nouveau.
Sois concis et professionnel. Utilise le markdown.`;

  const userPrompt = `Module : ${module_title || ""}
Question : ${question}
Réponse de l'apprenant : ${user_answer}
Bonne réponse : ${correct_answer}
Résultat : ${is_correct ? "CORRECT" : "INCORRECT"}
${explanation ? `Explication existante : ${explanation}` : ""}

Donne un insight pédagogique enrichi (2-3 phrases) qui va au-delà de l'explication basique.`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── COACH: Exercise guidance ───
async function handleCoach(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, instructions, submission, phase = "pre" } = params;

  const { data: mod } = await supabase.from("academy_modules").select("title, objectives").eq("id", module_id).single();

  const systemPrompt = phase === "pre"
    ? `Tu es un coach pédagogique. L'apprenant s'apprête à rédiger un exercice. Donne un guide méthodologique structuré et concis (5-6 points max) pour l'aider à aborder l'exercice. Sois professionnel. Markdown.`
    : `Tu es un coach pédagogique. L'apprenant a soumis son exercice. Donne un feedback enrichi avec des questions de suivi pour l'aider à approfondir. Sois encourageant et précis. Markdown.`;

  const userPrompt = phase === "pre"
    ? `Module : ${mod?.title}\nObjectifs : ${JSON.stringify(mod?.objectives)}\nConsignes de l'exercice : ${instructions}\n\nDonne un guide méthodologique pour bien aborder cet exercice.`
    : `Module : ${mod?.title}\nConsignes : ${instructions}\nSoumission de l'apprenant : ${submission}\n\nDonne un feedback enrichi avec des suggestions concrètes.`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── DEBRIEF: Post-completion synthesis ───
async function handleDebrief(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, path_id, metadata, mode = "analysis" } = params;

  const [{ data: mod }, { data: path }, { data: contents }] = await Promise.all([
    supabase.from("academy_modules").select("title, description, objectives, module_type").eq("id", module_id).single(),
    path_id ? supabase.from("academy_paths").select("name, skills, aptitudes").eq("id", path_id).single() : { data: null },
    supabase.from("academy_contents").select("body").eq("module_id", module_id).order("sort_order").limit(5),
  ]);

  const contentSummary = (contents || []).map((c: any) => c.body).join("\n").slice(0, 4000);

  const systemPrompt = mode === "knowledge"
    ? `Tu es un expert Knowledge qui synthétise les concepts clés d'un module de formation. Crée un brief de connaissances structuré : concepts clés, points à retenir, liens avec la suite du parcours. Markdown professionnel.`
    : `Tu es un analyste pédagogique. Analyse les résultats d'un apprenant sur un module : patterns d'erreurs, compétences maîtrisées, axes d'amélioration, recommandations concrètes. Sois professionnel et actionnable. Markdown.`;

  const userPrompt = `Module : ${mod?.title} (${mod?.module_type})
Description : ${mod?.description}
Objectifs : ${JSON.stringify(mod?.objectives)}
Parcours : ${path?.name || "N/A"}
Compétences : ${JSON.stringify(path?.skills || [])}
${metadata ? `Données de l'apprenant : ${JSON.stringify(metadata)}` : ""}
${mode === "knowledge" ? `Contenu de référence :\n${contentSummary}` : ""}

${mode === "knowledge" ? "Synthétise les concepts clés, points à retenir, et prépare l'apprenant pour la suite." : "Analyse les résultats, identifie les patterns, et donne des recommandations concrètes."}`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
