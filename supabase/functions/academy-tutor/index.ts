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
      case "explain": return await handleExplain(supabase, user, params, LOVABLE_API_KEY, corsHeaders);
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

async function callAI(apiKey: string, messages: any[], maxTokens = 1500) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, max_tokens: maxTokens }),
  });
  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error("Rate limit exceeded");
    if (status === 402) throw new Error("Payment required");
    throw new Error(`AI call failed: ${status}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function getProfile(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("display_name, job_title, department").eq("user_id", userId).single();
  return data;
}

function getFirstName(profile: any, email: string | undefined): string {
  const name = profile?.display_name || email?.split("@")[0] || "Apprenant";
  return name.split(" ")[0];
}

// ─── BRIEF: Pre-module personalized introduction ───
async function handleBrief(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, path_id } = params;

  const [{ data: mod }, { data: path }, profile] = await Promise.all([
    supabase.from("academy_modules").select("title, description, objectives, module_type").eq("id", module_id).single(),
    path_id ? supabase.from("academy_paths").select("name, skills, aptitudes, description").eq("id", path_id).single() : { data: null },
    getProfile(supabase, user.id),
  ]);

  const firstName = getFirstName(profile, user.email);

  const systemPrompt = `Tu es un tuteur IA pédagogique professionnel et bienveillant. Tu tutoies l'apprenant et l'appelles par son prénom (${firstName}).
Tu prépares l'apprenant à un module de formation. Sois concis (3-5 phrases max), engageant et personnalisé.
Adapte ton discours au poste (${profile?.job_title || "collaborateur"}) et au service (${profile?.department || ""}).
Utilise le markdown avec des emojis professionnels.`;

  const userPrompt = `Module : ${mod?.title} (${mod?.module_type})
Description : ${mod?.description}
Objectifs : ${JSON.stringify(mod?.objectives)}
Parcours : ${path?.name || "N/A"}
Compétences visées : ${JSON.stringify(path?.skills || [])}

Génère un brief personnalisé pour ${firstName} : pourquoi ce module est important pour lui/elle dans son rôle de ${profile?.job_title || "collaborateur"}, ce qu'il/elle va apprendre, et le lien avec les compétences du parcours.`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── EXPLAIN: Post-quiz-answer contextual insight ───
async function handleExplain(supabase: any, user: any, _params: any, apiKey: string, cors: any) {
  const { question, user_answer, correct_answer, is_correct, module_title, explanation } = _params;

  const profile = await getProfile(supabase, user.id);
  const firstName = getFirstName(profile, user.email);

  const systemPrompt = `Tu es un tuteur IA bienveillant. Tu tutoies ${firstName} et l'appelles par son prénom.
Après une réponse de quiz, tu donnes un insight pédagogique enrichi en 2-3 phrases.
Si la réponse est correcte, renforce et approfondis. Si incorrecte, explique sans juger et donne un angle nouveau.
Adapte tes exemples au contexte professionnel de ${firstName} (${profile?.job_title || "collaborateur"}).
Sois concis et professionnel. Utilise le markdown.`;

  const userPrompt = `Module : ${module_title || ""}
Question : ${question}
Réponse de ${firstName} : ${user_answer}
Bonne réponse : ${correct_answer}
Résultat : ${is_correct ? "CORRECT" : "INCORRECT"}
${explanation ? `Explication existante : ${explanation}` : ""}

Donne un insight pédagogique enrichi (2-3 phrases) personnalisé pour ${firstName}.`;

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

  const [{ data: mod }, profile] = await Promise.all([
    supabase.from("academy_modules").select("title, objectives").eq("id", module_id).single(),
    getProfile(supabase, user.id),
  ]);

  const firstName = getFirstName(profile, user.email);

  const systemPrompt = phase === "pre"
    ? `Tu es un coach pédagogique bienveillant. Tu tutoies ${firstName}. Donne un guide méthodologique structuré et concis (5-6 points max) adapté à son rôle de ${profile?.job_title || "collaborateur"}. Sois professionnel. Markdown.`
    : `Tu es un coach pédagogique bienveillant. Tu tutoies ${firstName}. Donne un feedback enrichi avec des questions de suivi adaptées à son contexte professionnel (${profile?.job_title || "collaborateur"}, ${profile?.department || ""}). Sois encourageant et précis. Markdown.`;

  const userPrompt = phase === "pre"
    ? `Module : ${mod?.title}\nObjectifs : ${JSON.stringify(mod?.objectives)}\nConsignes de l'exercice : ${instructions}\n\nDonne un guide méthodologique pour aider ${firstName} à bien aborder cet exercice.`
    : `Module : ${mod?.title}\nConsignes : ${instructions}\nSoumission de ${firstName} : ${submission}\n\nDonne un feedback enrichi avec des suggestions concrètes pour ${firstName}.`;

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── DEBRIEF: Post-completion synthesis (analysis, knowledge, evaluation) ───
async function handleDebrief(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, path_id, metadata, mode = "analysis" } = params;

  const [{ data: mod }, { data: path }, { data: contents }, profile] = await Promise.all([
    supabase.from("academy_modules").select("title, description, objectives, module_type").eq("id", module_id).single(),
    path_id ? supabase.from("academy_paths").select("name, skills, aptitudes").eq("id", path_id).single() : { data: null },
    supabase.from("academy_contents").select("body").eq("module_id", module_id).order("sort_order").limit(5),
    getProfile(supabase, user.id),
  ]);

  const firstName = getFirstName(profile, user.email);
  const contentSummary = (contents || []).map((c: any) => c.body).join("\n").slice(0, 4000);

  let systemPrompt: string;
  let userPrompt: string;

  const baseContext = `Module : ${mod?.title} (${mod?.module_type})
Description : ${mod?.description}
Objectifs : ${JSON.stringify(mod?.objectives)}
Parcours : ${path?.name || "N/A"}
Compétences : ${JSON.stringify(path?.skills || [])}
Apprenant : ${firstName} — ${profile?.job_title || "Collaborateur"} (${profile?.department || ""})
${metadata ? `Données de l'apprenant : ${JSON.stringify(metadata)}` : ""}`;

  if (mode === "evaluation") {
    systemPrompt = `Tu es un évaluateur pédagogique expert. Tu rédiges une évaluation globale professionnelle et personnalisée.
Tu tutoies ${firstName} et l'appelles par son prénom. Sois bienveillant mais exigeant.
Structure ton évaluation avec : 
1. Note de synthèse (niveau de maîtrise global)
2. Qualité des réponses (analyse de la pertinence)
3. Points forts identifiés
4. Axes d'amélioration prioritaires
5. Recommandations pour la suite du parcours
Utilise un ton corporate et professionnel. Markdown riche avec sections bien structurées.`;

    userPrompt = `${baseContext}

Rédige une évaluation globale détaillée et personnalisée de la performance de ${firstName} sur ce module.
Analyse ses réponses, son niveau de maîtrise, la qualité de ses soumissions.
Fais le lien avec son rôle de ${profile?.job_title || "collaborateur"} et les compétences du parcours.`;

  } else if (mode === "knowledge") {
    systemPrompt = `Tu es un expert Knowledge qui synthétise les concepts clés d'un module de formation.
Tu tutoies ${firstName}. Crée un brief de connaissances structuré : concepts clés, points à retenir, liens avec la suite du parcours.
Adapte les exemples au contexte professionnel de ${firstName} (${profile?.job_title || "collaborateur"}).
Markdown professionnel avec des sections claires.`;

    userPrompt = `${baseContext}
${mode === "knowledge" ? `Contenu de référence :\n${contentSummary}` : ""}

Synthétise les concepts clés pour ${firstName}, les points à retenir, et prépare-le/la pour la suite du parcours.
Donne des exemples concrets liés à son rôle.`;

  } else {
    // analysis mode
    systemPrompt = `Tu es un analyste pédagogique expert. Tu tutoies ${firstName}.
Analyse les résultats : patterns d'erreurs, compétences maîtrisées, axes d'amélioration, recommandations concrètes.
Adapte ton analyse au contexte professionnel de ${firstName} (${profile?.job_title || "collaborateur"}).
Sois professionnel et actionnable. Markdown riche.`;

    userPrompt = `${baseContext}

Analyse les résultats de ${firstName}, identifie les patterns, et donne des recommandations concrètes adaptées à son rôle.`;
  }

  const content = await callAI(apiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], mode === "evaluation" ? 2000 : 1500);

  return new Response(JSON.stringify({ content }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
