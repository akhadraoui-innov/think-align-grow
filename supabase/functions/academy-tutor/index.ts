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

// ─── BRIEF ───
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
  const userPrompt = `Module : ${mod?.title} (${mod?.module_type})\nDescription : ${mod?.description}\nObjectifs : ${JSON.stringify(mod?.objectives)}\nParcours : ${path?.name || "N/A"}\nCompétences visées : ${JSON.stringify(path?.skills || [])}\n\nGénère un brief personnalisé pour ${firstName}.`;
  const content = await callAI(apiKey, [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]);
  return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
}

// ─── EXPLAIN ───
async function handleExplain(supabase: any, user: any, _params: any, apiKey: string, cors: any) {
  const { question, user_answer, correct_answer, is_correct, module_title, explanation } = _params;
  const profile = await getProfile(supabase, user.id);
  const firstName = getFirstName(profile, user.email);
  const systemPrompt = `Tu es un tuteur IA bienveillant. Tu tutoies ${firstName}. Après une réponse de quiz, donne un insight pédagogique enrichi en 2-3 phrases. Adapte au contexte professionnel de ${firstName} (${profile?.job_title || "collaborateur"}). Markdown.`;
  const userPrompt = `Module : ${module_title || ""}\nQuestion : ${question}\nRéponse de ${firstName} : ${user_answer}\nBonne réponse : ${correct_answer}\nRésultat : ${is_correct ? "CORRECT" : "INCORRECT"}\n${explanation ? `Explication existante : ${explanation}` : ""}\n\nDonne un insight pédagogique enrichi personnalisé pour ${firstName}.`;
  const content = await callAI(apiKey, [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]);
  return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
}

// ─── COACH ───
async function handleCoach(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, instructions, submission, phase = "pre" } = params;
  const [{ data: mod }, profile] = await Promise.all([
    supabase.from("academy_modules").select("title, objectives").eq("id", module_id).single(),
    getProfile(supabase, user.id),
  ]);
  const firstName = getFirstName(profile, user.email);
  const systemPrompt = phase === "pre"
    ? `Tu es un coach pédagogique bienveillant. Tu tutoies ${firstName}. Donne un guide méthodologique structuré et concis adapté à son rôle de ${profile?.job_title || "collaborateur"}. Markdown.`
    : `Tu es un coach pédagogique bienveillant. Tu tutoies ${firstName}. Donne un feedback enrichi avec des questions de suivi. Markdown.`;
  const userPrompt = phase === "pre"
    ? `Module : ${mod?.title}\nObjectifs : ${JSON.stringify(mod?.objectives)}\nConsignes : ${instructions}\n\nGuide méthodologique pour ${firstName}.`
    : `Module : ${mod?.title}\nConsignes : ${instructions}\nSoumission de ${firstName} : ${submission}\n\nFeedback enrichi pour ${firstName}.`;
  const content = await callAI(apiKey, [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]);
  return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
}

// ─── DEBRIEF (module-level or path-level) ───
async function handleDebrief(supabase: any, user: any, params: any, apiKey: string, cors: any) {
  const { module_id, path_id, metadata, mode = "analysis", enrollment_id } = params;

  const profile = await getProfile(supabase, user.id);
  const firstName = getFirstName(profile, user.email);

  // ─── PATH-LEVEL EVALUATION (module_id is null) ───
  if (!module_id && path_id) {
    const [{ data: path }, { data: allProgress }] = await Promise.all([
      supabase.from("academy_paths").select("name, description, skills, aptitudes, professional_outcomes, difficulty, estimated_hours, academy_functions!academy_paths_function_id_fkey(name)").eq("id", path_id).single(),
      enrollment_id
        ? supabase.from("academy_progress").select("*, academy_modules(title, module_type)").eq("enrollment_id", enrollment_id).order("started_at")
        : supabase.from("academy_progress").select("*, academy_modules(title, module_type)").eq("user_id", user.id).order("started_at"),
    ]);

    const modulesSummary = (allProgress || []).map((p: any) => ({
      title: p.academy_modules?.title,
      type: p.academy_modules?.module_type,
      score: p.score,
      status: p.status,
      time_spent: p.time_spent_seconds,
      quiz_answers: (p.metadata as any)?.quiz_answers?.length || 0,
      exercise_submitted: !!(p.metadata as any)?.exercise_submission,
    }));

    const avgScore = modulesSummary.filter((m: any) => m.score != null).reduce((s: number, m: any) => s + m.score, 0) / (modulesSummary.filter((m: any) => m.score != null).length || 1);
    const totalTime = modulesSummary.reduce((s: number, m: any) => s + (m.time_spent || 0), 0);

    const systemPrompt = `Tu es un évaluateur pédagogique senior. Tu rédiges une évaluation finale complète et personnalisée du parcours de formation.
Tu tutoies ${firstName} et l'appelles par son prénom. Sois bienveillant mais exigeant.
Structure ton évaluation avec des sections Markdown riches (H2, H3), des tableaux, des callouts (💡, ⚠️, 📜, 🏆).
Sections obligatoires :
1. 🏆 Synthèse globale — niveau de maîtrise global, score moyen, temps total
2. 📊 Performance par module — tableau avec titre, type, score, appréciation
3. ✅ Compétences acquises — analyse des skills du parcours
4. 💪 Points forts identifiés
5. 📈 Axes d'amélioration prioritaires
6. 🎯 Recommandations pour la suite professionnelle
Ton corporate, professionnel et motivant. 2000 mots minimum.`;

    const userPrompt = `Parcours : ${path?.name}
Description : ${path?.description}
Niveau : ${path?.difficulty || "Intermédiaire"}
Durée estimée : ${path?.estimated_hours || "N/A"}h
Fonction : ${(path as any)?.academy_functions?.name || "Tous profils"}
Apprenant : ${firstName} — ${profile?.job_title || "Collaborateur"} (${profile?.department || ""})
Score moyen : ${Math.round(avgScore)}%
Temps total : ${Math.round(totalTime / 60)} minutes

Compétences du parcours : ${JSON.stringify(path?.skills || [])}
Aptitudes : ${JSON.stringify(path?.aptitudes || [])}
Débouchés : ${JSON.stringify(path?.professional_outcomes || [])}

Résultats par module :
${modulesSummary.map((m: any, i: number) => `${i + 1}. ${m.title} (${m.type}) — Score: ${m.score ?? "N/A"}% — ${m.status} — ${Math.round((m.time_spent || 0) / 60)}min`).join("\n")}

Rédige une évaluation finale complète et personnalisée pour ${firstName}.`;

    const content = await callAI(apiKey, [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], 6000);
    return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  // ─── MODULE-LEVEL DEBRIEF (existing logic) ───
  const [{ data: mod }, { data: path }, { data: contents }] = await Promise.all([
    supabase.from("academy_modules").select("title, description, objectives, module_type").eq("id", module_id).single(),
    path_id ? supabase.from("academy_paths").select("name, skills, aptitudes").eq("id", path_id).single() : { data: null },
    supabase.from("academy_contents").select("body").eq("module_id", module_id).order("sort_order").limit(5),
  ]);

  const contentSummary = (contents || []).map((c: any) => c.body).join("\n").slice(0, 4000);
  let systemPrompt: string;
  let userPrompt: string;

  const baseContext = `Module : ${mod?.title} (${mod?.module_type})\nDescription : ${mod?.description}\nObjectifs : ${JSON.stringify(mod?.objectives)}\nParcours : ${path?.name || "N/A"}\nCompétences : ${JSON.stringify(path?.skills || [])}\nApprenant : ${firstName} — ${profile?.job_title || "Collaborateur"} (${profile?.department || ""})\n${metadata ? `Données : ${JSON.stringify(metadata)}` : ""}`;

  if (mode === "evaluation") {
    systemPrompt = `Tu es un évaluateur pédagogique expert. Tu tutoies ${firstName}. Structure : note de synthèse, qualité des réponses, points forts, axes d'amélioration, recommandations. Markdown riche avec callouts (💡, ⚠️, 📜).`;
    userPrompt = `${baseContext}\n\nÉvaluation globale détaillée et personnalisée de ${firstName} sur ce module.`;
  } else if (mode === "knowledge") {
    systemPrompt = `Tu es un expert Knowledge. Tu tutoies ${firstName}. Concepts clés, points à retenir, liens avec la suite. Adapte au contexte professionnel. Markdown avec callouts.`;
    userPrompt = `${baseContext}\nContenu :\n${contentSummary}\n\nSynthèse des concepts clés pour ${firstName}.`;
  } else {
    systemPrompt = `Tu es un analyste pédagogique expert. Tu tutoies ${firstName}. Patterns d'erreurs, compétences maîtrisées, axes d'amélioration. Markdown riche.`;
    userPrompt = `${baseContext}\n\nAnalyse des résultats de ${firstName} avec recommandations.`;
  }

  const content = await callAI(apiKey, [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], mode === "evaluation" ? 2000 : 1500);
  return new Response(JSON.stringify({ content }), { headers: { ...cors, "Content-Type": "application/json" } });
}
