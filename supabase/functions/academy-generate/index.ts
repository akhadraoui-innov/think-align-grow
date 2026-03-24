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

    if (action === "generate-path") {
      return await generatePath(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-content") {
      return await generateContent(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-quiz") {
      return await generateQuiz(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("academy-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, tools?: any[], toolChoice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) throw new Error("Rate limited, please try again later");
  if (resp.status === 402) throw new Error("AI credits exhausted, please add funds");
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI error:", resp.status, t);
    throw new Error("AI generation failed");
  }

  const data = await resp.json();
  
  if (tools) {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) return JSON.parse(toolCall.function.arguments);
    throw new Error("No tool call in AI response");
  }
  
  return data.choices?.[0]?.message?.content || "";
}

// ─── Generate a complete learning path ───────────────────────────────

async function generatePath(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { name, description, difficulty = "intermediate", persona_description = "", module_count = 5 } = params;

  const systemPrompt = `Tu es un architecte pédagogique expert en formation professionnelle.
Tu conçois des parcours de formation structurés, progressifs et orientés compétences.
Chaque module doit avoir un objectif clair, des compétences visées, et une durée réaliste.
Les modules doivent couvrir : introduction/contexte, concepts clés, application pratique, évaluation, synthèse.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un parcours de formation complet avec ${module_count} modules.

Nom du parcours : ${name}
Description : ${description}
Difficulté : ${difficulty}
${persona_description ? `Public cible : ${persona_description}` : ""}

Pour chaque module, définis :
- Un titre clair et engageant
- Une description précise des objectifs
- Le type de module (lesson, quiz, exercise, ou practice)
- Les objectifs pédagogiques (2-4 par module)
- La durée estimée en minutes (réaliste)

Assure une progression logique du plus simple au plus complexe.
Inclus au minimum 1 quiz et 1 exercice dans le parcours.`;

  const tools = [{
    type: "function",
    function: {
      name: "create_learning_path",
      description: "Create a structured learning path with modules",
      parameters: {
        type: "object",
        properties: {
          estimated_hours: { type: "number", description: "Total estimated hours" },
          modules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                module_type: { type: "string", enum: ["lesson", "quiz", "exercise", "practice"] },
                objectives: { type: "array", items: { type: "string" } },
                estimated_minutes: { type: "number" },
              },
              required: ["title", "description", "module_type", "objectives", "estimated_minutes"],
            },
          },
        },
        required: ["estimated_hours", "modules"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_learning_path" } });

  // Create the path
  const { data: path, error: pathErr } = await supabase
    .from("academy_paths")
    .insert({
      name,
      description,
      difficulty,
      estimated_hours: result.estimated_hours,
      status: "draft",
      generation_mode: "ai",
      created_by: userId,
      persona_id: params.persona_id || null,
    })
    .select("id")
    .single();
  if (pathErr) throw pathErr;

  // Create modules and link them
  for (let i = 0; i < result.modules.length; i++) {
    const m = result.modules[i];
    const { data: mod, error: modErr } = await supabase
      .from("academy_modules")
      .insert({
        title: m.title,
        description: m.description,
        module_type: m.module_type,
        objectives: m.objectives,
        estimated_minutes: m.estimated_minutes,
        status: "draft",
        generation_mode: "ai",
      })
      .select("id")
      .single();
    if (modErr) throw modErr;

    await supabase.from("academy_path_modules").insert({
      path_id: path.id,
      module_id: mod.id,
      sort_order: i,
    });
  }

  return new Response(JSON.stringify({ success: true, path_id: path.id, module_count: result.modules.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate content for a module ───────────────────────────────────

async function generateContent(supabase: any, params: any, apiKey: string, cors: any) {
  const { module_id } = params;

  // Fetch module info
  const { data: mod, error: modErr } = await supabase
    .from("academy_modules")
    .select("*")
    .eq("id", module_id)
    .single();
  if (modErr || !mod) throw new Error("Module not found");

  const systemPrompt = `Tu es un concepteur de contenu pédagogique expert.
Tu crées du contenu de formation en markdown riche, structuré et engageant.
Utilise des titres, sous-titres, listes, exemples concrets, encadrés de conseil, et mises en garde.
Le contenu doit être professionnel, applicable immédiatement, et adapté à un public business.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée le contenu pédagogique complet pour ce module de formation :

Titre : ${mod.title}
Description : ${mod.description}
Type : ${mod.module_type}
Objectifs : ${JSON.stringify(mod.objectives)}
Durée estimée : ${mod.estimated_minutes} minutes

Génère 2 à 4 sections de contenu en markdown, chacune avec un angle différent :
1. Introduction et contexte
2. Concepts clés et frameworks
3. Exemples concrets et cas pratiques
4. Points clés à retenir et prochaines étapes

Chaque section doit faire entre 300 et 800 mots.`;

  const tools = [{
    type: "function",
    function: {
      name: "create_module_content",
      description: "Create structured content sections for a learning module",
      parameters: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string", description: "Markdown content" },
                content_type: { type: "string", enum: ["markdown"] },
              },
              required: ["title", "body", "content_type"],
            },
          },
        },
        required: ["sections"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_module_content" } });

  // Insert content sections
  for (let i = 0; i < result.sections.length; i++) {
    const s = result.sections[i];
    await supabase.from("academy_contents").insert({
      module_id,
      content_type: s.content_type || "markdown",
      body: `## ${s.title}\n\n${s.body}`,
      sort_order: i,
      generation_mode: "ai",
    });
  }

  return new Response(JSON.stringify({ success: true, section_count: result.sections.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate quiz for a module ──────────────────────────────────────

async function generateQuiz(supabase: any, params: any, apiKey: string, cors: any) {
  const { module_id, question_count = 5 } = params;

  const { data: mod, error: modErr } = await supabase
    .from("academy_modules")
    .select("*")
    .eq("id", module_id)
    .single();
  if (modErr || !mod) throw new Error("Module not found");

  // Fetch existing content for context
  const { data: contents } = await supabase
    .from("academy_contents")
    .select("body")
    .eq("module_id", module_id)
    .order("sort_order");
  const contentText = (contents || []).map((c: any) => c.body).join("\n\n").slice(0, 4000);

  const systemPrompt = `Tu es un expert en évaluation pédagogique.
Tu crées des quiz rigoureux qui testent la compréhension réelle, pas la mémorisation.
Chaque question doit avoir une explication claire de la bonne réponse.
Varie les types : QCM (4 options), vrai/faux, et questions ouvertes.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un quiz de ${question_count} questions pour ce module :

Titre : ${mod.title}
Objectifs : ${JSON.stringify(mod.objectives)}

${contentText ? `Contenu du module :\n${contentText}` : ""}

Les questions doivent :
- Tester la compréhension, pas la mémorisation
- Être progressives en difficulté
- Avoir des explications claires
- Mélanger QCM et vrai/faux`;

  const tools = [{
    type: "function",
    function: {
      name: "create_quiz",
      description: "Create a quiz with questions",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          passing_score: { type: "number" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                question_type: { type: "string", enum: ["mcq", "true_false"] },
                options: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] } },
                correct_answer: { type: "string" },
                explanation: { type: "string" },
                points: { type: "number" },
              },
              required: ["question", "question_type", "options", "correct_answer", "explanation", "points"],
            },
          },
        },
        required: ["title", "description", "passing_score", "questions"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_quiz" } });

  // Create quiz
  const { data: quiz, error: quizErr } = await supabase
    .from("academy_quizzes")
    .insert({
      module_id,
      title: result.title,
      description: result.description,
      passing_score: result.passing_score || 70,
      generation_mode: "ai",
    })
    .select("id")
    .single();
  if (quizErr) throw quizErr;

  // Create questions
  for (let i = 0; i < result.questions.length; i++) {
    const q = result.questions[i];
    await supabase.from("academy_quiz_questions").insert({
      quiz_id: quiz.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points || 1,
      sort_order: i,
    });
  }

  return new Response(JSON.stringify({ success: true, quiz_id: quiz.id, question_count: result.questions.length }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
