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
    } else if (action === "evaluate-exercise") {
      return await evaluateExercise(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-persona") {
      return await generatePersona(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-exercise") {
      return await generateExercise(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-practice") {
      return await generatePractice(supabase, params, LOVABLE_API_KEY, corsHeaders);
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

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, tools?: any[], toolChoice?: any, model?: string) {
  const body: any = {
    model: model || "google/gemini-2.5-flash",
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

// ─── Evaluate exercise submission ────────────────────────────────────

async function evaluateExercise(supabase: any, params: any, apiKey: string, cors: any) {
  const { exercise_id, module_id, submission } = params;
  if (!exercise_id || !submission) throw new Error("Missing exercise_id or submission");

  const { data: exercise, error: exErr } = await supabase
    .from("academy_exercises")
    .select("*")
    .eq("id", exercise_id)
    .single();
  if (exErr || !exercise) throw new Error("Exercise not found");

  const { data: mod } = await supabase
    .from("academy_modules")
    .select("title, description, objectives")
    .eq("id", module_id)
    .single();

  const criteria = exercise.evaluation_criteria || [];

  const systemPrompt = `Tu es un évaluateur pédagogique expert, exigeant mais bienveillant.
Tu évalues les soumissions d'exercices de formation professionnelle.
Tu donnes un feedback structuré, actionnable et encourageant.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Évalue cette soumission d'exercice.

Module : ${mod?.title || ""}
Description : ${mod?.description || ""}
Objectifs : ${JSON.stringify(mod?.objectives || [])}

Exercice : ${exercise.title}
Consigne : ${exercise.instructions}
Critères d'évaluation : ${JSON.stringify(criteria)}

--- SOUMISSION DE L'APPRENANT ---
${submission}
--- FIN DE LA SOUMISSION ---

Évalue en donnant :
- Un score de 0 à 100
- Les points forts (2-4)
- Les axes d'amélioration (2-4)
- Un résumé bienveillant et constructif`;

  const tools = [{
    type: "function",
    function: {
      name: "evaluate_submission",
      description: "Evaluate a learner's exercise submission",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Score from 0 to 100" },
          strengths: { type: "array", items: { type: "string" }, description: "Strong points" },
          improvements: { type: "array", items: { type: "string" }, description: "Areas for improvement" },
          summary: { type: "string", description: "Overall feedback summary" },
        },
        required: ["score", "strengths", "improvements", "summary"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "evaluate_submission" } }, "google/gemini-2.5-pro");

  return new Response(JSON.stringify({ success: true, feedback: result }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Persona ────────────────────────────────────────────────

async function generatePersona(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { brief, mode = "guided", organization_id = null } = params;
  if (!brief) throw new Error("Missing brief");

  const systemPrompt = `Tu es un expert en ingénierie pédagogique et en design de formation professionnelle.
Tu crées des personae détaillés et réalistes pour des parcours de formation.
Chaque persona doit être actionnable : suffisamment précis pour guider la conception d'un parcours adapté.
Tu dois penser à :
- Le contexte professionnel réel (industrie, taille d'entreprise, enjeux sectoriels)
- Les compétences actuelles vs souhaitées (gap analysis)
- Les contraintes d'apprentissage (temps, format, prérequis)
- Les motivations et freins à la formation
- Les cas d'usage concrets où la formation sera appliquée
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un persona de formation complet à partir de ce brief :

${brief}

Le persona doit inclure :
- Un nom de rôle précis et professionnel
- Une description riche du contexte et des enjeux
- Niveau de séniorité (Junior, Confirmé, Senior, Expert, C-Level)
- Département / fonction
- 3-5 objectifs de formation prioritaires
- 3-5 points de douleur / frustrations actuelles
- 2-3 scénarios d'usage concrets de la formation
- Prérequis recommandés
- Format d'apprentissage préféré (micro-learning, immersif, hybride)
- Indicateurs de succès mesurables`;

  const tools = [{
    type: "function",
    function: {
      name: "create_persona",
      description: "Create a detailed training persona",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Role name (e.g. 'Directeur Commercial PME')" },
          description: { type: "string", description: "Rich description of context and challenges" },
          characteristics: {
            type: "object",
            properties: {
              seniority: { type: "string" },
              department: { type: "string" },
              goals: { type: "array", items: { type: "string" } },
              pain_points: { type: "array", items: { type: "string" } },
              scenarios: { type: "array", items: { type: "string" } },
              prerequisites: { type: "array", items: { type: "string" } },
              learning_format: { type: "string" },
              success_metrics: { type: "array", items: { type: "string" } },
              industry: { type: "string" },
              company_size: { type: "string" },
            },
            required: ["seniority", "department", "goals", "pain_points"],
          },
        },
        required: ["name", "description", "characteristics"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_persona" } }, "google/gemini-2.5-pro");

  const { data: persona, error } = await supabase
    .from("academy_personae")
    .insert({
      name: result.name,
      description: result.description,
      characteristics: result.characteristics,
      status: "draft",
      generation_mode: "ai",
      created_by: userId,
      organization_id,
    })
    .select("*")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, persona }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Exercise for a module ──────────────────────────────────

async function generateExercise(supabase: any, params: any, apiKey: string, cors: any) {
  const { module_id } = params;
  if (!module_id) throw new Error("Missing module_id");

  const { data: mod, error: modErr } = await supabase
    .from("academy_modules").select("*").eq("id", module_id).single();
  if (modErr || !mod) throw new Error("Module not found");

  const { data: contents } = await supabase
    .from("academy_contents").select("body").eq("module_id", module_id).order("sort_order");
  const contentText = (contents || []).map((c: any) => c.body).join("\n\n").slice(0, 4000);

  const systemPrompt = `Tu es un concepteur d'exercices pédagogiques expert.
Tu crées des exercices pratiques, exigeants et formateurs, avec des critères d'évaluation précis et objectifs.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un exercice pratique pour ce module :
Titre : ${mod.title}
Description : ${mod.description}
Objectifs : ${JSON.stringify(mod.objectives)}
${contentText ? `Contenu :\n${contentText}` : ""}

L'exercice doit :
- Être concret et applicable
- Avoir des instructions claires en markdown
- Définir 3-5 critères d'évaluation précis avec pondération`;

  const tools = [{
    type: "function",
    function: {
      name: "create_exercise",
      description: "Create a practical exercise with evaluation criteria",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          instructions: { type: "string", description: "Markdown instructions" },
          expected_output_type: { type: "string", enum: ["text", "file", "code"] },
          evaluation_criteria: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                weight: { type: "number" },
                description: { type: "string" },
              },
              required: ["criterion", "weight"],
            },
          },
        },
        required: ["title", "instructions", "evaluation_criteria"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_exercise" } }, "google/gemini-2.5-pro");

  const { data: exercise, error } = await supabase
    .from("academy_exercises")
    .insert({
      module_id,
      title: result.title,
      instructions: result.instructions,
      expected_output_type: result.expected_output_type || "text",
      evaluation_criteria: result.evaluation_criteria,
      ai_evaluation_enabled: true,
      generation_mode: "ai",
    })
    .select("id")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, exercise_id: exercise.id }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Practice scenario for a module ─────────────────────────

async function generatePractice(supabase: any, params: any, apiKey: string, cors: any) {
  const { module_id } = params;
  if (!module_id) throw new Error("Missing module_id");

  const { data: mod, error: modErr } = await supabase
    .from("academy_modules").select("*").eq("id", module_id).single();
  if (modErr || !mod) throw new Error("Module not found");

  const systemPrompt = `Tu es un expert en simulation pédagogique et coaching IA.
Tu conçois des scénarios de pratique immersifs où l'apprenant interagit avec une IA qui joue un rôle.
Le scénario doit être réaliste, engageant, et évaluer des compétences concrètes.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un scénario de pratique IA pour ce module :
Titre : ${mod.title}
Description : ${mod.description}
Objectifs : ${JSON.stringify(mod.objectives)}

Le scénario doit inclure :
- Un contexte de mise en situation réaliste
- Un rôle précis pour l'IA (ex: client difficile, manager exigeant, investisseur)
- Un system prompt détaillé pour guider le comportement de l'IA
- 3-5 critères d'évaluation avec barème
- Un nombre d'échanges adapté (5-15)`;

  const tools = [{
    type: "function",
    function: {
      name: "create_practice",
      description: "Create an AI practice scenario",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          scenario: { type: "string", description: "Context description shown to the learner" },
          system_prompt: { type: "string", description: "System prompt for the AI role" },
          max_exchanges: { type: "number" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          evaluation_rubric: {
            type: "array",
            items: {
              type: "object",
              properties: {
                criterion: { type: "string" },
                weight: { type: "number" },
                description: { type: "string" },
              },
              required: ["criterion", "weight"],
            },
          },
        },
        required: ["title", "scenario", "system_prompt", "max_exchanges", "evaluation_rubric"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_practice" } }, "google/gemini-2.5-pro");

  const { data: practice, error } = await supabase
    .from("academy_practices")
    .insert({
      module_id,
      title: result.title,
      scenario: result.scenario,
      system_prompt: result.system_prompt,
      max_exchanges: result.max_exchanges || 10,
      difficulty: result.difficulty || "intermediate",
      evaluation_rubric: result.evaluation_rubric,
      generation_mode: "ai",
    })
    .select("id")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, practice_id: practice.id }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
