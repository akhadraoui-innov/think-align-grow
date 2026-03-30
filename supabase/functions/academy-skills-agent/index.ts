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

    if (action === "assess-skills") {
      return await assessSkills(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-rex") {
      return await generateRex(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "knowledge") {
      return await knowledgeChat(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("academy-skills-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(apiKey: string, messages: any[], stream = false) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, stream }),
  });
  if (resp.status === 429) throw new Error("Rate limited, please try again later");
  if (resp.status === 402) throw new Error("AI credits exhausted, please add funds");
  if (!resp.ok) throw new Error("AI generation failed");
  if (stream) return resp;
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAIStructured(apiKey: string, systemPrompt: string, userPrompt: string, tools: any[], toolChoice: any) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: toolChoice,
    }),
  });
  if (resp.status === 429) throw new Error("Rate limited");
  if (resp.status === 402) throw new Error("AI credits exhausted");
  if (!resp.ok) throw new Error("AI generation failed");
  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) return JSON.parse(toolCall.function.arguments);
  throw new Error("No tool call in AI response");
}

// ─── Assess Skills ───
async function assessSkills(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { enrollment_id, path_id } = params;

  // Get path with skills
  const { data: path } = await supabase.from("academy_paths").select("*").eq("id", path_id).single();
  if (!path) throw new Error("Path not found");

  // Get progress
  const { data: progress } = await supabase.from("academy_progress").select("*, academy_modules(title, module_type, objectives)").eq("enrollment_id", enrollment_id);

  const skills: any[] = Array.isArray(path.skills) ? path.skills : [];
  if (skills.length === 0) {
    return new Response(JSON.stringify({ success: false, error: "No skills defined for this path" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `Tu es un expert en évaluation de compétences professionnelles. Analyse les résultats d'un apprenant et évalue son niveau pour chaque compétence du référentiel.`;

  const userPrompt = `Parcours : ${path.name}
Compétences du référentiel : ${JSON.stringify(skills)}
Résultats par module : ${JSON.stringify(progress?.map((p: any) => ({
    title: p.academy_modules?.title,
    type: p.academy_modules?.module_type,
    score: p.score,
    objectives: p.academy_modules?.objectives,
  })))}

Pour chaque compétence du référentiel, évalue :
- initial_level (estimation avant la formation, basée sur le type de compétence et la difficulté)
- final_level (basé sur les scores des modules pertinents)
- evidence (quels modules et scores justifient cette évaluation)`;

  const tools = [{
    type: "function",
    function: {
      name: "assess_skills",
      description: "Assess skill levels based on module performance",
      parameters: {
        type: "object",
        properties: {
          assessments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                skill_name: { type: "string" },
                initial_level: { type: "number" },
                final_level: { type: "number" },
                evidence: { type: "array", items: { type: "object", properties: { module: { type: "string" }, score: { type: "number" } }, required: ["module", "score"] } },
              },
              required: ["skill_name", "initial_level", "final_level", "evidence"],
            },
          },
        },
        required: ["assessments"],
      },
    },
  }];

  const result = await callAIStructured(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "assess_skills" } });

  // Delete existing assessments and insert new ones
  await supabase.from("academy_skill_assessments").delete().eq("enrollment_id", enrollment_id);
  for (const a of result.assessments) {
    await supabase.from("academy_skill_assessments").insert({
      enrollment_id,
      user_id: userId,
      skill_name: a.skill_name,
      initial_level: a.initial_level,
      final_level: a.final_level,
      evidence: a.evidence,
    });
  }

  return new Response(JSON.stringify({ success: true, count: result.assessments.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate REX ───
async function generateRex(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { enrollment_id, path_id } = params;

  const { data: path } = await supabase.from("academy_paths").select("*").eq("id", path_id).single();
  const { data: progress } = await supabase.from("academy_progress").select("*, academy_modules(title, module_type)").eq("enrollment_id", enrollment_id);
  const { data: assessments } = await supabase.from("academy_skill_assessments").select("*").eq("enrollment_id", enrollment_id);

  const systemPrompt = `Tu es un expert en retour d'expérience pédagogique. Génère un rapport REX structuré, professionnel et actionnable.`;

  const userPrompt = `Parcours : ${path?.name}
Description : ${path?.description}
Résultats : ${JSON.stringify(progress?.map((p: any) => ({ title: p.academy_modules?.title, type: p.academy_modules?.module_type, score: p.score })))}
Évaluations compétences : ${JSON.stringify(assessments)}

Génère un retour d'expérience structuré avec :
1. Points forts (modules >85%)
2. Axes d'amélioration (modules <70%)
3. Recommandations concrètes de parcours complémentaires
4. Score NPS estimé
5. Synthèse narrative professionnelle`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_rex",
      description: "Generate a structured return on experience report",
      parameters: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          nps_score: { type: "number" },
          narrative: { type: "string" },
        },
        required: ["strengths", "improvements", "recommendations", "nps_score", "narrative"],
      },
    },
  }];

  const result = await callAIStructured(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "generate_rex" } });

  // Update feedback with AI insights
  await supabase.from("academy_path_feedback").upsert({
    path_id,
    user_id: userId,
    enrollment_id,
    ai_generated_insights: result,
  }, { onConflict: "enrollment_id" });

  return new Response(JSON.stringify({ success: true, rex: result }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Knowledge IA Chat (streaming) ───
async function knowledgeChat(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { path_id, messages: userMessages = [] } = params;

  // Fetch path context
  const { data: path } = await supabase.from("academy_paths").select("*").eq("id", path_id).single();
  const { data: pathModules } = await supabase.from("academy_path_modules").select("module_id, academy_modules(title, description, objectives, module_type)").eq("path_id", path_id).order("sort_order");
  
  // Fetch user progress with metadata for RAG enrichment
  const { data: userEnrollment } = await supabase.from("academy_enrollments").select("id").eq("path_id", path_id).eq("user_id", userId).maybeSingle();
  let progressMetadata: any[] = [];
  if (userEnrollment) {
    const { data: progressData } = await supabase.from("academy_progress").select("module_id, score, status, metadata").eq("enrollment_id", userEnrollment.id);
    progressMetadata = progressData || [];
  }

  // Fetch contents (limit to avoid token overflow)
  const moduleIds = (pathModules || []).map((pm: any) => pm.module_id);
  const { data: contents } = await supabase.from("academy_contents").select("body, module_id").in("module_id", moduleIds).order("sort_order").limit(20);
  
  const contentSummary = (contents || []).map((c: any) => c.body).join("\n\n").slice(0, 8000);
  const moduleSummary = (pathModules || []).map((pm: any) => {
    const m = pm.academy_modules;
    return `- ${m?.title} (${m?.module_type}): ${m?.description}. Objectifs: ${JSON.stringify(m?.objectives)}`;
  }).join("\n");

  const skillsSummary = Array.isArray(path?.skills) ? path.skills.map((s: any) => `${s.name} (${s.category}, niveau ${s.level})`).join(", ") : "";

  // Build learner performance context from metadata
  const learnerContext = progressMetadata.map((p: any) => {
    const mod = (pathModules || []).find((pm: any) => pm.module_id === p.module_id);
    const meta = p.metadata || {};
    let details = `${mod?.academy_modules?.title || "Module"} (${mod?.academy_modules?.module_type}): score ${p.score || "N/A"}`;
    if (meta.quiz_answers) details += `, ${(meta.quiz_answers as any[]).filter((a: any) => a.is_correct).length}/${(meta.quiz_answers as any[]).length} bonnes réponses`;
    if (meta.submissions) details += `, ${(meta.submissions as any[]).length} soumission(s)`;
    return details;
  }).join("\n");

  const systemPrompt = `Tu es un expert Knowledge IA spécialisé dans le domaine du parcours "${path?.name}".

CONTEXTE DU PARCOURS :
${path?.description}

MODULES :
${moduleSummary}

COMPÉTENCES DÉVELOPPÉES : ${skillsSummary}
APTITUDES : ${Array.isArray(path?.aptitudes) ? path.aptitudes.join(", ") : ""}
DÉBOUCHÉS : ${Array.isArray(path?.professional_outcomes) ? path.professional_outcomes.join(", ") : ""}

CONTENU DE RÉFÉRENCE :
${contentSummary}

INSTRUCTIONS :
- Tu es un expert du domaine, pas un simple chatbot
- Réponds de manière précise, professionnelle et approfondie
- Cite les concepts du parcours quand pertinent
- Propose des approfondissements et des ressources complémentaires
- Si l'apprenant pose une question hors périmètre, redirige-le vers le contenu du parcours
- Utilise le markdown pour structurer tes réponses
- Sois pédagogue et encourageant`;

  const allMessages = [
    { role: "system", content: systemPrompt },
    ...userMessages,
  ];

  const response = await callAI(apiKey, allMessages, true);
  
  return new Response(response.body, {
    headers: { ...cors, "Content-Type": "text/event-stream" },
  });
}
