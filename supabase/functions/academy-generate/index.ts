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
    } else if (action === "derive-persona") {
      return await derivePersona(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-exercise") {
      return await generateExercise(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-practice") {
      return await generatePractice(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-function") {
      return await generateFunction(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-illustrations") {
      return await generateIllustrations(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-campaign") {
      return await generateCampaign(supabase, user.id, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-cover") {
      return await generateCover(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-all-covers") {
      return await generateAllCovers(supabase, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-toolkit-cover") {
      return await generateToolkitCover(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-all-toolkit-covers") {
      return await generateAllToolkitCovers(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-card-illustration") {
      return await generateCardIllustration(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-all-card-illustrations") {
      return await generateAllCardIllustrations(supabase, params, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "generate-card-illustrations-batch") {
      return await generateCardIllustrationsBatch(supabase, params, LOVABLE_API_KEY, corsHeaders);
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
Tu génères également le référentiel de compétences, prérequis, aptitudes et débouchés professionnels du parcours.
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

Génère également :
- skills : 4-8 compétences développées (nom, catégorie parmi technique/transversale/métier, niveau de 1 à 5)
- prerequisites : 2-5 prérequis textuels
- aptitudes : 3-6 aptitudes professionnelles développées
- professional_outcomes : 2-4 débouchés professionnels concrets

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
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string", enum: ["technique", "transversale", "métier"] },
                level: { type: "number", description: "1-5" },
              },
              required: ["name", "category", "level"],
            },
          },
          prerequisites: { type: "array", items: { type: "string" } },
          aptitudes: { type: "array", items: { type: "string" } },
          professional_outcomes: { type: "array", items: { type: "string" } },
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
        required: ["estimated_hours", "modules", "skills", "prerequisites", "aptitudes", "professional_outcomes"],
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
      skills: result.skills || [],
      prerequisites: result.prerequisites || [],
      aptitudes: result.aptitudes || [],
      professional_outcomes: result.professional_outcomes || [],
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

  const { data: mod, error: modErr } = await supabase
    .from("academy_modules").select("*").eq("id", module_id).single();
  if (modErr || !mod) throw new Error("Module not found");

  // Fetch path context (difficulty, persona, function)
  const { data: pathLink } = await supabase
    .from("academy_path_modules").select("path_id").eq("module_id", module_id).limit(1).maybeSingle();
  
  let pathContext = { difficulty: "intermediate", personaName: "", functionName: "", pathName: "" };
  if (pathLink) {
    const { data: path } = await supabase
      .from("academy_paths").select("name, difficulty, persona_id, function_id").eq("id", pathLink.path_id).single();
    if (path) {
      pathContext.difficulty = path.difficulty || "intermediate";
      pathContext.pathName = path.name;
      if (path.persona_id) {
        const { data: p } = await supabase.from("academy_personae").select("name, description").eq("id", path.persona_id).single();
        if (p) pathContext.personaName = `${p.name} — ${p.description?.slice(0, 200)}`;
      }
      if (path.function_id) {
        const { data: f } = await supabase.from("academy_functions").select("name, department, seniority").eq("id", path.function_id).single();
        if (f) pathContext.functionName = `${f.name} (${f.department || ''}, ${f.seniority || ''})`;
      }
    }
  }

  const levelInstructions: Record<string, string> = {
    beginner: `NIVEAU DÉBUTANT :
- Vocabulaire simple et accessible, pas de jargon non expliqué
- Chaque concept nouveau est défini avec un exemple du quotidien
- Analogies concrètes et visuelles
- Longueur : 600-1200 mots par section
- Ton : encourageant, rassurant, pédagogue`,
    intermediate: `NIVEAU INTERMÉDIAIRE :
- Vocabulaire professionnel avec définitions contextuelles
- Liens entre concepts, frameworks reconnus du domaine
- Cas d'usage concrets en entreprise
- Longueur : 800-1500 mots par section
- Ton : professionnel, pragmatique, orienté action`,
    advanced: `NIVEAU AVANCÉ :
- Vocabulaire technique sans simplification excessive
- Analyse critique, perspectives divergentes, état de l'art
- Benchmarks, études de cas complexes, données chiffrées
- Longueur : 1000-2000 mots par section
- Ton : expert, analytique, stratégique`,
  };

  const systemPrompt = `Tu es un concepteur de contenu pédagogique de niveau premium pour la formation professionnelle en entreprise.

${levelInstructions[pathContext.difficulty] || levelInstructions.intermediate}

${pathContext.functionName ? `FONCTION CIBLE : ${pathContext.functionName}\nAdapte tes exemples, cas d'usage et terminologie à cette fonction métier.` : ""}
${pathContext.personaName ? `PERSONA CIBLE : ${pathContext.personaName}\nAdapte le style, le rythme et la complexité au profil comportemental.` : ""}

RÈGLES DE MISE EN FORME OBLIGATOIRES :
Tu DOIS utiliser les encadrés enrichis suivants dans chaque section :

1. Points clés — format obligatoire :
> 💡 **À retenir** : [concept essentiel en 1-2 phrases percutantes]

2. Anecdotes / contexte historique — au moins 1 par section :
> 📜 **Le saviez-vous ?** : [fait historique, anecdote industrielle, ou donnée chiffrée surprenante]

3. Mises en garde pratiques :
> ⚠️ **Attention** : [erreur courante, piège à éviter, nuance importante]

4. Diagrammes Mermaid OBLIGATOIRES pour illustrer processus, architectures, organigrammes, flux, relations
   → INTERDIT : ASCII art (pipes, slashes, dashes pour dessiner). C'est illisible et non interactif.
   → Utilise EXCLUSIVEMENT des blocs \`\`\`mermaid valides
   → Types autorisés : flowchart TD/LR, sequenceDiagram, erDiagram, classDiagram, stateDiagram-v2, gantt, mindmap, timeline
   → Règles syntaxe : pas d'accents dans les IDs (utilise des labels entre crochets : \`A[Texte avec accents]\`)
5. Tableaux comparatifs markdown pour les frameworks et outils
6. Listes numérotées pour les processus séquentiels
7. Citations ou verbatims de praticiens reconnus si pertinent

STRUCTURE DE CHAQUE SECTION :
- Accroche (question rhétorique ou fait marquant)
- Développement structuré avec sous-titres H3
- Minimum 2 encadrés (💡, 📜, ⚠️) par section
- Conclusion orientée action avec transition vers la section suivante

Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée le contenu pédagogique complet pour ce module de formation :

Parcours : ${pathContext.pathName || "Non spécifié"}
Titre du module : ${mod.title}
Description : ${mod.description}
Type : ${mod.module_type}
Objectifs pédagogiques : ${JSON.stringify(mod.objectives)}
Durée estimée : ${mod.estimated_minutes} minutes

Génère 3 à 5 sections de contenu en markdown riche, chacune avec un angle complémentaire :
1. Contextualisation et enjeux (pourquoi ce sujet est critique aujourd'hui)
2. Fondamentaux et frameworks (les modèles de référence)
3. Application pratique et cas d'usage (exemples concrets adaptés au public cible)
4. Outils et méthodes (comment mettre en œuvre concrètement)
5. Synthèse et prochaines étapes (points clés + transition)

IMPORTANT : chaque section doit contenir au minimum 2 encadrés enrichis (💡, 📜, ⚠️) et au moins 1 diagramme Mermaid OU 1 tableau markdown. JAMAIS d'ASCII art.`;

  const tools = [{
    type: "function",
    function: {
      name: "create_module_content",
      description: "Create structured rich content sections for a learning module",
      parameters: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string", description: "Rich markdown content with 💡/📜/⚠️ callouts, tables, and Mermaid diagrams (```mermaid blocks). NEVER use ASCII art." },
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

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_module_content" } }, "google/gemini-2.5-flash");

  // Delete existing content before regenerating
  await supabase.from("academy_contents").delete().eq("module_id", module_id);

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
  const { module_id, question_count = 8 } = params;

  const { data: mod, error: modErr } = await supabase
    .from("academy_modules").select("*").eq("id", module_id).single();
  if (modErr || !mod) throw new Error("Module not found");

  const { data: contents } = await supabase
    .from("academy_contents").select("body").eq("module_id", module_id).order("sort_order");
  const contentText = (contents || []).map((c: any) => c.body).join("\n\n").slice(0, 6000);

  // Fetch path difficulty
  const { data: pathLink } = await supabase
    .from("academy_path_modules").select("path_id").eq("module_id", module_id).limit(1).maybeSingle();
  let difficulty = "intermediate";
  if (pathLink) {
    const { data: path } = await supabase.from("academy_paths").select("difficulty").eq("id", pathLink.path_id).single();
    if (path?.difficulty) difficulty = path.difficulty;
  }

  const systemPrompt = `Tu es un expert en évaluation pédagogique et en ingénierie de quiz innovants.

NIVEAU : ${difficulty.toUpperCase()}

Tu crées des quiz qui testent la COMPRÉHENSION RÉELLE, la capacité d'ANALYSE et l'APPLICATION PRATIQUE — jamais la simple mémorisation.

Tu DOIS utiliser un MIX VARIÉ de ces 6 types de questions :
1. **mcq** (QCM) : 4 options, une seule bonne réponse. Options plausibles qui testent les nuances.
2. **true_false** : Vrai/Faux avec une affirmation précise qui nécessite réflexion.
3. **ordering** : Remettre 4-6 éléments dans le bon ordre (processus, étapes, chronologie).
4. **matching** : Associer 3-5 paires (concept↔définition, outil↔usage, problème↔solution).
5. **fill_blank** : Phrase à compléter avec 1-2 mots clés (le texte contient ___ pour les blancs).
6. **scenario** : Mise en situation professionnelle réaliste avec 3-4 choix contextuels.

RÈGLES :
- Minimum 3 types différents par quiz
- Questions progressives en difficulté (les 2 premières sont accessibles, les dernières sont exigeantes)
- Chaque question a une explication DÉTAILLÉE (2-3 phrases, pas un simple "bonne réponse")
- Chaque question a un hint (indice sans donner la réponse)
- Les scénarios doivent être réalistes et ancrés dans le contexte métier
- Les ordering/matching testent la logique, pas la mémorisation

Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un quiz de ${question_count} questions pour ce module :

Titre : ${mod.title}
Objectifs : ${JSON.stringify(mod.objectives)}

${contentText ? `Contenu du module :\n${contentText}` : ""}

Exigences :
- Au moins 1 question de chaque type parmi : mcq, ordering, scenario
- Mix de niveaux : 30% facile, 40% moyen, 30% difficile
- Les explications doivent enseigner, pas juste valider
- Les hints doivent orienter sans donner la réponse`;

  const tools = [{
    type: "function",
    function: {
      name: "create_quiz",
      description: "Create an innovative quiz with 6 question types",
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
                question: { type: "string", description: "The question text. For fill_blank, use ___ for blanks." },
                question_type: { type: "string", enum: ["mcq", "true_false", "ordering", "matching", "fill_blank", "scenario"] },
                options: {
                  type: "array",
                  description: "For mcq/true_false/scenario: [{label, value}]. For ordering: [{label, value}] in correct order. For matching: [{label, value}] where label=left item, value=right item. For fill_blank: [{label: answer, value: answer}].",
                  items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] }
                },
                correct_answer: { type: "string", description: "For mcq/true_false/scenario: the correct value. For ordering: comma-separated values in correct order. For matching: comma-separated 'label:value' pairs. For fill_blank: the correct word(s)." },
                explanation: { type: "string", description: "Detailed 2-3 sentence explanation that teaches" },
                hint: { type: "string", description: "A helpful hint without giving away the answer" },
                points: { type: "number" },
                scenario_context: { type: "string", description: "For scenario type: the situation description" },
              },
              required: ["question", "question_type", "options", "correct_answer", "explanation", "points"],
            },
          },
        },
        required: ["title", "description", "passing_score", "questions"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_quiz" } }, "google/gemini-2.5-pro");

  // Delete existing quiz before regenerating
  const { data: existingQuizzes } = await supabase.from("academy_quizzes").select("id").eq("module_id", module_id);
  if (existingQuizzes?.length) {
    for (const eq of existingQuizzes) {
      await supabase.from("academy_quiz_questions").delete().eq("quiz_id", eq.id);
    }
    await supabase.from("academy_quizzes").delete().eq("module_id", module_id);
  }

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

  for (let i = 0; i < result.questions.length; i++) {
    const q = result.questions[i];
    await supabase.from("academy_quiz_questions").insert({
      quiz_id: quiz.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options.map((o: any) => ({ ...o, hint: q.hint, scenario_context: q.scenario_context })),
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

// ─── Generate Persona (behavioral archetype) ────────────────────────

async function generatePersona(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { brief, mode = "guided", organization_id = null } = params;
  if (!brief) throw new Error("Missing brief");

  const systemPrompt = `Tu es un expert en psychologie organisationnelle et en ingénierie pédagogique.
Tu crées des PERSONAE COMPORTEMENTAUX — pas des fiches de poste. Un persona décrit COMMENT une personne apprend, réagit face au changement, et interagit avec la technologie. Deux personnes du même poste peuvent avoir des personas radicalement différents.

Les noms doivent être CORPORATE et professionnels, jamais familiers ou caricaturaux.
Exemples : "Le Précurseur Digital", "Le Décideur Orienté Résultats", "Le Méthodique Structuré", "Le Leader Transformationnel".

Tu dois produire un profil riche avec :
- 10 traits numériques (1-5)
- Des tags comportementaux détaillés (habitudes, style de communication, patterns de décision, relation à la tech, types d'objections, déclencheurs d'engagement, blockers)
- Des textes de contexte (journée type, relation à l'IA, parcours idéal, approche coaching, indicateurs de succès)

Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée un persona comportemental complet à partir de ce brief :\n\n${brief}`;

  const tools = [{
    type: "function",
    function: {
      name: "create_persona",
      description: "Create a detailed behavioral persona for learning design",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Corporate professional name (e.g. 'Le Précurseur Digital')" },
          description: { type: "string", description: "Rich 2-3 paragraph behavioral description" },
          tags: { type: "array", items: { type: "string" }, description: "Categorization tags (e.g. 'tech-savvy', 'change-leader')" },
          characteristics: {
            type: "object",
            properties: {
              digital_maturity: { type: "number", minimum: 1, maximum: 5 },
              ai_apprehension: { type: "number", minimum: 1, maximum: 5 },
              experimentation_level: { type: "number", minimum: 1, maximum: 5 },
              initiative_level: { type: "number", minimum: 1, maximum: 5 },
              change_appetite: { type: "number", minimum: 1, maximum: 5 },
              collaboration_preference: { type: "number", minimum: 1, maximum: 5 },
              autonomy_level: { type: "number", minimum: 1, maximum: 5 },
              risk_tolerance: { type: "number", minimum: 1, maximum: 5 },
              data_literacy: { type: "number", minimum: 1, maximum: 5 },
              feedback_receptivity: { type: "number", minimum: 1, maximum: 5 },
              learning_style: { type: "string", enum: ["visual", "reading", "doing", "discussing"] },
              time_availability: { type: "string", enum: ["micro", "short", "medium", "intensive"] },
              preferred_format: { type: "string", enum: ["autonome", "guidé", "coaching", "groupe"] },
              motivation_drivers: { type: "array", items: { type: "string" } },
              resistance_patterns: { type: "array", items: { type: "string" } },
              habits: { type: "array", items: { type: "string" } },
              communication_style: { type: "array", items: { type: "string" } },
              decision_patterns: { type: "array", items: { type: "string" } },
              tech_relationship: { type: "array", items: { type: "string" } },
              objections_type: { type: "array", items: { type: "string" } },
              engagement_triggers: { type: "array", items: { type: "string" } },
              blockers: { type: "array", items: { type: "string" } },
              typical_day: { type: "string" },
              ai_relationship_summary: { type: "string" },
              ideal_learning_journey: { type: "string" },
              coaching_approach: { type: "string" },
              success_indicators: { type: "string" },
            },
            required: ["digital_maturity", "ai_apprehension", "experimentation_level", "initiative_level", "change_appetite", "collaboration_preference", "autonomy_level", "risk_tolerance", "data_literacy", "feedback_receptivity", "learning_style", "time_availability", "preferred_format", "motivation_drivers", "resistance_patterns", "habits", "communication_style", "typical_day", "coaching_approach", "success_indicators"],
          },
        },
        required: ["name", "description", "tags", "characteristics"],
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
      tags: result.tags || [],
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

// ─── Derive Persona for an organization ──────────────────────────────

async function derivePersona(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { parent_persona_id, organization_id } = params;
  if (!parent_persona_id || !organization_id) throw new Error("Missing parent_persona_id or organization_id");

  const { data: parent, error: pErr } = await supabase
    .from("academy_personae").select("*").eq("id", parent_persona_id).single();
  if (pErr || !parent) throw new Error("Parent persona not found");

  const { data: org } = await supabase
    .from("organizations").select("name, sector").eq("id", organization_id).single();

  const systemPrompt = `Tu es un expert en adaptation pédagogique.
Tu reçois un persona comportemental générique et tu dois le décliner pour une organisation spécifique.
Conserve la structure et les traits principaux mais adapte : les habitudes, les objections, les déclencheurs, les exemples de journée type, au contexte sectoriel et organisationnel.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Décline ce persona générique pour l'organisation "${org?.name || 'inconnue'}" (secteur: ${org?.sector || 'non spécifié'}).

Persona générique : ${parent.name}
Description : ${parent.description}
Caractéristiques actuelles : ${JSON.stringify(parent.characteristics)}

Adapte les habitudes, objections, déclencheurs d'engagement, journée type, approche coaching au contexte de cette organisation.`;

  const tools = [{
    type: "function",
    function: {
      name: "derive_persona",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          characteristics: { type: "object" },
        },
        required: ["name", "description", "characteristics"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "derive_persona" } }, "google/gemini-2.5-pro");

  const { data: derived, error } = await supabase
    .from("academy_personae")
    .insert({
      name: result.name,
      description: result.description,
      characteristics: { ...parent.characteristics, ...result.characteristics },
      tags: result.tags || parent.tags || [],
      parent_persona_id,
      status: "draft",
      generation_mode: "ai",
      created_by: userId,
      organization_id,
    })
    .select("*")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, persona: derived }), {
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

  const systemPrompt = `Tu es un expert en simulation pédagogique et coaching IA.
Tu conçois des scénarios de pratique immersifs où l'apprenant interagit avec une IA qui joue un rôle.

TYPES DE SIMULATION DISPONIBLES (choisis le plus pertinent selon le contexte) :
- conversation : coaching conversationnel générique
- prompt_challenge : défi de prompting avec scoring
- negotiation : négociation avec adversaire IA
- pitch : présentation à un investisseur/décideur
- code_review : revue de code avec bugs à trouver
- debug : diagnostic de bug avec indices progressifs
- case_study : étude de cas à analyser
- decision_game : jeu de décision avec KPIs dynamiques
- crisis : gestion de crise sous pression
- change_management : conduite du changement avec stakeholders
- vibe_coding : briefing technique pour no-code/vibe coding
- sales : simulation de vente B2B
- teach_back : enseigner un concept à un apprenant IA
- socratic : dialogue socratique avec contradicteur
- feedback_360 : donner du feedback multi-perspectives
- user_story : rédaction de user stories
- sprint_planning : planification de sprint
- requirements : élicitation de besoins
- data_analysis : analyse de données métier
- compliance_audit : audit de conformité
- contract_review : revue de contrat
- architecture_review : revue d'architecture technique
- process_mapping : cartographie de processus
- due_diligence : audit d'acquisition
- restructuring : plan de restructuration
- incident_response : réponse à incident technique
- backlog_prio : priorisation de backlog

Réponds UNIQUEMENT via l'outil fourni.`;

  let userPrompt: string;
  if (module_id) {
    const { data: mod, error: modErr } = await supabase
      .from("academy_modules").select("*").eq("id", module_id).single();
    if (modErr || !mod) throw new Error("Module not found");

    userPrompt = `Crée un scénario de pratique IA pour ce module :
Titre : ${mod.title}
Description : ${mod.description}
Objectifs : ${JSON.stringify(mod.objectives)}

Choisis le practice_type le PLUS ADAPTÉ au contexte du module (pas toujours "conversation").
Le scénario doit inclure :
- Un contexte de mise en situation réaliste
- Un rôle précis pour l'IA
- Un system prompt détaillé
- 3-5 critères d'évaluation avec barème
- Le type_config approprié au mode choisi
- Le niveau d'aide IA adapté (beginner → intensive, advanced → autonomous)`;
  } else {
    userPrompt = `Crée un scénario de pratique IA standalone.
${params.brief || ""}
Choisis le practice_type le plus adapté.`;
  }

  const tools = [{
    type: "function",
    function: {
      name: "create_practice",
      description: "Create an AI practice scenario with specialized type",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          scenario: { type: "string", description: "Context description shown to the learner" },
          system_prompt: { type: "string", description: "System prompt for the AI role" },
          practice_type: { type: "string", description: "The simulation type key" },
          type_config: { type: "object", description: "Mode-specific configuration" },
          max_exchanges: { type: "number" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
          ai_assistance_level: { type: "string", enum: ["autonomous", "guided", "intensive"] },
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
        required: ["title", "scenario", "system_prompt", "practice_type", "max_exchanges", "evaluation_rubric"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_practice" } }, "google/gemini-2.5-pro");

  const insertPayload: any = {
    title: result.title,
    scenario: result.scenario,
    system_prompt: result.system_prompt,
    practice_type: result.practice_type || "conversation",
    type_config: result.type_config || {},
    max_exchanges: result.max_exchanges || 10,
    difficulty: result.difficulty || "intermediate",
    ai_assistance_level: result.ai_assistance_level || "guided",
    evaluation_rubric: result.evaluation_rubric,
    generation_mode: "ai",
  };
  if (module_id) insertPayload.module_id = module_id;

  const { data: practice, error } = await supabase
    .from("academy_practices")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, practice_id: practice.id }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Function (organizational role) ─────────────────────────

async function generateFunction(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { brief, mode = "guided", organization_id = null } = params;
  if (!brief) throw new Error("Missing brief");

  const systemPrompt = `Tu es un expert en design organisationnel et en transformation digitale.
Tu crées des fiches de fonction détaillées pour un LMS de formation professionnelle.
Chaque fiche doit décrire le rôle organisationnel : responsabilités, outils, KPIs, et surtout les cas d'usage concrets de l'IA pour cette fonction.
Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Crée une fiche fonction complète à partir de ce brief :

${brief}

La fiche doit inclure :
- Nom exact du poste
- Description synthétique du rôle et de son importance stratégique
- Département et niveau de séniorité
- Secteur d'activité et taille d'entreprise typique
- 5-8 responsabilités clés
- 3-6 outils/technologies utilisés
- 3-5 KPIs de performance
- 4-6 cas d'usage IA concrets et actionnables pour cette fonction`;

  const tools = [{
    type: "function",
    function: {
      name: "create_function",
      description: "Create a detailed organizational function record",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          department: { type: "string" },
          seniority: { type: "string" },
          industry: { type: "string" },
          company_size: { type: "string" },
          responsibilities: { type: "array", items: { type: "string" } },
          tools_used: { type: "array", items: { type: "string" } },
          kpis: { type: "array", items: { type: "string" } },
          ai_use_cases: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "responsibilities", "ai_use_cases"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_function" } }, "google/gemini-2.5-pro");

  const { data: function_record, error } = await supabase
    .from("academy_functions")
    .insert({
      name: result.name,
      description: result.description,
      department: result.department || null,
      seniority: result.seniority || null,
      industry: result.industry || null,
      company_size: result.company_size || null,
      responsibilities: result.responsibilities || [],
      tools_used: result.tools_used || [],
      kpis: result.kpis || [],
      ai_use_cases: result.ai_use_cases || [],
      status: "draft",
      generation_mode: "ai",
      created_by: userId,
      organization_id,
    })
    .select("*")
    .single();
  if (error) throw error;

  return new Response(JSON.stringify({ success: true, function_record }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate illustrations for a module ─────────────────────────────

async function generateIllustrations(supabase: any, params: any, apiKey: string, cors: any) {
  const { module_id } = params;
  if (!module_id) throw new Error("Missing module_id");

  // Fetch module content
  const { data: contents, error: contErr } = await supabase
    .from("academy_contents")
    .select("id, body, sort_order")
    .eq("module_id", module_id)
    .order("sort_order");
  if (contErr) throw contErr;
  if (!contents?.length) throw new Error("No content to illustrate — generate content first");

  const { data: mod } = await supabase
    .from("academy_modules")
    .select("title")
    .eq("id", module_id)
    .single();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  let illustrationCount = 0;

  // Generate 1 illustration for each content section (max 3)
  const sectionsToIllustrate = contents.slice(0, 3);

  for (const section of sectionsToIllustrate) {
    // Extract the first heading and key concept from the section
    const firstHeading = section.body.match(/^##?\s+(.+)/m)?.[1] || mod?.title || "Concept";
    const bodyPreview = section.body.replace(/[>#*_`\[\]|]/g, "").slice(0, 300);

    // Step 1: Ask text AI for a good image prompt
    const promptResult = await callAI(
      apiKey,
      "You are an expert at writing concise image generation prompts for professional training illustrations. Output ONLY the prompt text, nothing else.",
      `Write a concise image generation prompt for a professional training illustration about: "${firstHeading}". Context: ${bodyPreview.slice(0, 200)}. Style: clean modern flat illustration, corporate colors (blue/teal/orange accents), white background, suitable for a professional e-learning platform. No text in the image.`,
      undefined,
      undefined,
      "google/gemini-2.5-flash-lite"
    );

    const imagePrompt = typeof promptResult === "string" ? promptResult.trim() : firstHeading;

    // Step 2: Generate the image
    try {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResp.ok) {
        console.error("Image generation failed:", imgResp.status);
        continue;
      }

      const imgData = await imgResp.json();
      const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!base64Url) {
        console.error("No image in response");
        continue;
      }

      // Step 3: Upload to storage
      const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `${module_id}/${section.id}_${Date.now()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("academy-assets")
        .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}`;

      // Step 4: Inject illustration into content body
      const illustrationMd = `\n\n![${firstHeading}](${publicUrl})\n\n`;
      // Insert after the first heading in the section
      const headingMatch = section.body.match(/^(##?\s+.+\n)/m);
      let updatedBody: string;
      if (headingMatch) {
        const insertPos = section.body.indexOf(headingMatch[0]) + headingMatch[0].length;
        updatedBody = section.body.slice(0, insertPos) + illustrationMd + section.body.slice(insertPos);
      } else {
        updatedBody = illustrationMd + section.body;
      }

      await supabase
        .from("academy_contents")
        .update({ body: updatedBody })
        .eq("id", section.id);

      illustrationCount++;
    } catch (imgErr) {
      console.error("Illustration generation error:", imgErr);
      continue;
    }
  }

  return new Response(JSON.stringify({ success: true, illustration_count: illustrationCount }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Campaign ──────────────────────────────────────────────

async function generateCampaign(supabase: any, userId: string, params: any, apiKey: string, cors: any) {
  const { name, description, organization_id, mode = "guided", duration_weeks, objectives } = params;
  if (!name) throw new Error("Missing campaign name");

  // Fetch rich context
  const [orgResult, pathsResult, membersResult, functionsResult, enrollmentsResult, personaeResult] = await Promise.all([
    organization_id ? supabase.from("organizations").select("name, sector, group_name").eq("id", organization_id).single() : { data: null },
    supabase.from("academy_paths").select("id, name, description, difficulty, estimated_hours, status, function_id, persona_id").eq("status", "published").order("name"),
    organization_id ? supabase.from("organization_members").select("user_id").eq("organization_id", organization_id) : { data: [] },
    supabase.from("academy_functions").select("id, name, department, seniority").order("name"),
    organization_id ? supabase.from("academy_enrollments").select("path_id, campaign_id, user_id, status").order("enrolled_at", { ascending: false }).limit(200) : { data: [] },
    supabase.from("academy_personae").select("id, name, description").order("name"),
  ]);

  const org = orgResult.data;
  const paths = pathsResult.data || [];
  const memberCount = (membersResult.data || []).length;
  const functions = functionsResult.data || [];
  const existingEnrollments = enrollmentsResult.data || [];
  const personae = personaeResult.data || [];

  // Build context string
  let contextParts: string[] = [];
  if (org) {
    contextParts.push(`ORGANISATION : ${org.name}${org.sector ? ` (secteur : ${org.sector})` : ""}${org.group_name ? ` — Groupe : ${org.group_name}` : ""}\nNombre de membres : ${memberCount}`);
  }
  if (paths.length > 0) {
    const pathList = paths.map((p: any) => {
      const fn = functions.find((f: any) => f.id === p.function_id);
      const pe = personae.find((pp: any) => pp.id === p.persona_id);
      return `- ${p.name} (${p.difficulty}, ${p.estimated_hours || "?"}h)${fn ? ` → Fonction: ${fn.name}` : ""}${pe ? ` → Persona: ${pe.name}` : ""}`;
    }).join("\n");
    contextParts.push(`PARCOURS DISPONIBLES :\n${pathList}`);
  }
  if (existingEnrollments.length > 0) {
    const enrolledPaths = [...new Set(existingEnrollments.map((e: any) => e.path_id))];
    contextParts.push(`INSCRIPTIONS EXISTANTES : ${existingEnrollments.length} inscriptions sur ${enrolledPaths.length} parcours différents`);
  }

  const contextBlock = contextParts.join("\n\n");

  const systemPrompt = `Tu es un consultant expert en déploiement de formation et en change management.
Tu conçois des campagnes de formation optimales en tenant compte du contexte organisationnel, des parcours disponibles, et de la population cible.

Tu recommandes :
- Le parcours le plus adapté parmi ceux disponibles
- Les dates optimales de déploiement
- La configuration de relances (fréquence, canaux)
- Une stratégie de déploiement (communication, engagement, suivi)

Réponds UNIQUEMENT via l'outil fourni.`;

  const userPrompt = `Conçois une campagne de formation complète.

NOM : ${name}
${description ? `BRIEF : ${description}` : ""}
${objectives ? `OBJECTIFS DE DÉPLOIEMENT : ${objectives}` : ""}
${duration_weeks ? `DURÉE SOUHAITÉE : ${duration_weeks} semaines` : ""}
MODE : ${mode}

${contextBlock}

Recommande le parcours le plus adapté parmi les parcours disponibles (fournis son ID exact).
Propose des dates réalistes, une description engageante, et une stratégie de déploiement.`;

  const pathIds = paths.map((p: any) => p.id);

  const tools = [{
    type: "function",
    function: {
      name: "create_campaign",
      description: "Create a training campaign with deployment strategy",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Engaging campaign description (2-3 paragraphs)" },
          recommended_path_id: { type: "string", description: "ID of the recommended path from available paths" },
          starts_at: { type: "string", description: "ISO date for campaign start (YYYY-MM-DD)" },
          ends_at: { type: "string", description: "ISO date for campaign end (YYYY-MM-DD)" },
          reminder_config: {
            type: "object",
            properties: {
              frequency: { type: "string", enum: ["daily", "weekly", "biweekly"] },
              channels: { type: "array", items: { type: "string" } },
              first_reminder_days: { type: "number" },
            },
          },
          deployment_strategy: { type: "string", description: "Detailed deployment strategy (communication plan, engagement tactics, milestones)" },
        },
        required: ["description", "recommended_path_id", "starts_at", "ends_at", "reminder_config", "deployment_strategy"],
      },
    },
  }];

  const result = await callAI(apiKey, systemPrompt, userPrompt, tools, { type: "function", function: { name: "create_campaign" } });

  // Validate path_id
  const chosenPathId = pathIds.includes(result.recommended_path_id) ? result.recommended_path_id : (params.path_id || pathIds[0]);
  if (!chosenPathId) throw new Error("No published path available for campaign");
  if (!organization_id) throw new Error("organization_id required");

  const { data: campaign, error: campErr } = await supabase
    .from("academy_campaigns")
    .insert({
      name,
      description: result.description || description || "",
      path_id: chosenPathId,
      organization_id,
      status: "draft",
      starts_at: result.starts_at || new Date().toISOString(),
      ends_at: result.ends_at || null,
      reminder_config: result.reminder_config || {},
      created_by: userId,
    })
    .select("id")
    .single();
  if (campErr) throw campErr;

  return new Response(JSON.stringify({
    success: true,
    campaign_id: campaign.id,
    recommended_path_id: chosenPathId,
    deployment_strategy: result.deployment_strategy,
  }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate Cover Image for a Path ────────────────────────────────

async function generateCover(supabase: any, params: any, apiKey: string, cors: any) {
  const { path_id } = params;
  if (!path_id) throw new Error("Missing path_id");

  const { data: path, error: pathErr } = await supabase
    .from("academy_paths")
    .select("id, name, description, difficulty")
    .eq("id", path_id)
    .single();
  if (pathErr || !path) throw new Error("Path not found");

  // Step 1: Generate a cover image prompt — premium editorial style
  const premiumStyle = `Premium e-learning course cover, editorial corporate illustration of Behance/Dribbble quality. Rich, detailed scene combining isometric 3D elements and modern flat-vector business iconography (charts, devices, abstract data flows, silhouettes, tools) directly related to the topic. Cinematic lighting with soft glows and depth, layered foreground/background composition, vibrant but harmonious palette of 2-4 colors with one strong topic-driven accent, subtle gradients, polished shadows. Wide 16:9 aspect, professional and aspirational mood. Absolutely NO text, NO letters, NO words, NO watermark, NO logo.`;
  const promptResult = await callAI(
    apiKey,
    "You write rich, evocative image prompts for premium e-learning course covers. The covers must look like top-tier editorial illustrations (Behance/Dribbble) — detailed scenes mixing isometric 3D and flat vectors, cinematic lighting, layered composition, never a single icon on a flat gradient. Always specify NO text/letters/words. Output ONLY the prompt, 60-90 words.",
    `Write a detailed, evocative image prompt for a PREMIUM training course cover about: "${path.name}". Description: ${(path.description || "").slice(0, 400)}. Difficulty: ${path.difficulty || "intermediate"}. Required base style (extend it with topic-specific scene details): ${premiumStyle}`,
    undefined,
    undefined,
    "google/gemini-2.5-flash"
  );

  const imagePrompt = typeof promptResult === "string" ? promptResult.trim() : `Professional training course cover about ${path.name}`;

  // Step 2: Generate the image (with retry on 429)
  let imgResp: Response | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });
    lastStatus = imgResp.status;
    if (imgResp.ok) break;
    if (imgResp.status !== 429 && imgResp.status < 500) break;
    await imgResp.text().catch(() => {});
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }

  if (!imgResp || !imgResp.ok) {
    // Soft fallback: don't 500. Client keeps gradient placeholder.
    const code = lastStatus === 429 ? "RATE_LIMITED"
      : lastStatus === 402 ? "PAYMENT_REQUIRED"
      : `HTTP_${lastStatus}`;
    return new Response(JSON.stringify({
      success: false,
      fallback: true,
      error_code: code,
      message: lastStatus === 429
        ? "Génération d'image temporairement saturée (rate limit). Réessaie dans quelques minutes."
        : lastStatus === 402
        ? "Crédits IA épuisés sur l'espace Lovable AI."
        : `Image generation failed (${lastStatus})`,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const imgData = await imgResp.json();
  const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!base64Url) {
    return new Response(JSON.stringify({
      success: false, fallback: true, error_code: "NO_IMAGE",
      message: "Aucune image renvoyée par le modèle.",
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // Step 3: Upload to storage
  const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const fileName = `covers/${path_id}.png`;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  const { error: uploadErr } = await supabase.storage
    .from("academy-assets")
    .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}`;

  // Step 4: Update path
  await supabase
    .from("academy_paths")
    .update({ cover_image_url: publicUrl })
    .eq("id", path_id);

  return new Response(JSON.stringify({ success: true, cover_url: publicUrl }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Generate All Missing Covers ────────────────────────────────────

async function generateAllCovers(supabase: any, apiKey: string, cors: any) {
  const { data: paths, error } = await supabase
    .from("academy_paths")
    .select("id, name, description, difficulty")
    .is("cover_image_url", null);
  if (error) throw error;

  const results: { path_id: string; name: string; success: boolean; error?: string }[] = [];

  for (const path of (paths || [])) {
    try {
      // Generate prompt — premium editorial style
      const batchStyle = `Premium e-learning course cover, editorial corporate illustration of Behance/Dribbble quality. Rich, detailed scene combining isometric 3D elements and modern flat-vector business iconography (charts, devices, abstract data flows, silhouettes, tools) directly related to the topic. Cinematic lighting with soft glows and depth, layered foreground/background composition, vibrant but harmonious palette of 2-4 colors with one strong topic-driven accent, subtle gradients, polished shadows. Wide 16:9 aspect, professional and aspirational mood. Absolutely NO text, NO letters, NO words, NO watermark, NO logo.`;
      const promptResult = await callAI(
        apiKey,
        "You write rich, evocative image prompts for premium e-learning course covers. The covers must look like top-tier editorial illustrations (Behance/Dribbble) — detailed scenes mixing isometric 3D and flat vectors, cinematic lighting, layered composition, never a single icon on a flat gradient. Always specify NO text/letters/words. Output ONLY the prompt, 60-90 words.",
        `Write a detailed, evocative image prompt for a PREMIUM training course cover about: "${path.name}". Description: ${(path.description || "").slice(0, 400)}. Required base style (extend it with topic-specific scene details): ${batchStyle}`,
        undefined,
        undefined,
        "google/gemini-2.5-flash"
      );

      const imagePrompt = typeof promptResult === "string" ? promptResult.trim() : `Professional training cover about ${path.name}`;

      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResp.ok) { results.push({ path_id: path.id, name: path.name, success: false, error: `HTTP ${imgResp.status}` }); continue; }

      const imgData = await imgResp.json();
      const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!base64Url) { results.push({ path_id: path.id, name: path.name, success: false, error: "No image" }); continue; }

      const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `covers/${path.id}.png`;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

      const { error: uploadErr } = await supabase.storage
        .from("academy-assets")
        .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });
      if (uploadErr) { results.push({ path_id: path.id, name: path.name, success: false, error: uploadErr.message }); continue; }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}`;
      await supabase.from("academy_paths").update({ cover_image_url: publicUrl }).eq("id", path.id);

      results.push({ path_id: path.id, name: path.name, success: true });
    } catch (e) {
      results.push({ path_id: path.id, name: path.name, success: false, error: e instanceof Error ? e.message : "Unknown" });
    }
    // Throttle to avoid 429 rate limits on the AI gateway
    await new Promise((r) => setTimeout(r, 2000));
  }

  return new Response(JSON.stringify({ success: true, total: paths?.length || 0, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
// ─── Toolkit Cover Generation ───────────────────────────────────────

const TOOLKIT_STYLE = `Premium editorial illustration of a strategic ideation workshop in action. Top-down or 3/4 view of a collaborative table covered with physical ideation cards, sticky notes, sketchnotes, and a structured framework canvas, with the diverse hands of professionals collaborating around it. Symbolic objects, charts and props specific to the toolkit topic are visible on the cards and the canvas. Modern flat-vector mixed with light isometric 3D, Behance/Dribbble grade quality, cinematic soft lighting, layered composition with depth, harmonious palette of 2-4 colors with one strong topic-driven accent. Wide 16:9. Absolutely NO text, NO letters, NO words, NO logo, NO watermark.`;

const TOOLKIT_PROMPTER_SYS = "You write rich, evocative image prompts for premium business toolkit cover illustrations depicting collective intelligence workshops with physical ideation cards, sticky notes and frameworks. Top-tier editorial quality (Behance/Dribbble). Always specify NO text/letters/words. Output ONLY the prompt, 60-90 words.";

async function buildToolkitPrompt(apiKey: string, toolkit: any): Promise<string> {
  const tags = Array.isArray(toolkit.tags) ? toolkit.tags.slice(0, 3).join(", ") : "";
  const promptResult = await callAI(
    apiKey,
    TOOLKIT_PROMPTER_SYS,
    `Write a detailed image prompt for a PREMIUM strategic toolkit cover about: "${toolkit.name}". Description: ${(toolkit.description || "").slice(0, 350)}. Audience: ${toolkit.target_audience || "professionals"}. Tags: ${tags}. The scene MUST clearly depict a collective intelligence workshop with physical ideation cards, sticky notes, sketchnotes and a framework canvas, with hands collaborating. Required base style (extend with topic-specific objects): ${TOOLKIT_STYLE}`,
    undefined,
    undefined,
    "google/gemini-2.5-flash"
  );
  return typeof promptResult === "string" ? promptResult.trim() : `Collective intelligence workshop about ${toolkit.name}`;
}

async function renderImage(apiKey: string, prompt: string): Promise<{ ok: boolean; bytes?: Uint8Array; status?: number }> {
  let imgResp: Response | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    lastStatus = imgResp.status;
    if (imgResp.ok) break;
    if (imgResp.status !== 429 && imgResp.status < 500) break;
    await imgResp.text().catch(() => {});
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (!imgResp || !imgResp.ok) return { ok: false, status: lastStatus };
  const data = await imgResp.json();
  const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!base64Url) return { ok: false, status: lastStatus };
  const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  return { ok: true, bytes };
}

async function generateToolkitCover(supabase: any, params: any, apiKey: string, cors: any) {
  const { toolkit_id } = params;
  if (!toolkit_id) throw new Error("Missing toolkit_id");

  const { data: toolkit, error } = await supabase
    .from("toolkits")
    .select("id, name, description, target_audience, nomenclature, tags")
    .eq("id", toolkit_id)
    .single();
  if (error || !toolkit) throw new Error("Toolkit not found");

  const prompt = await buildToolkitPrompt(apiKey, toolkit);
  const img = await renderImage(apiKey, prompt);

  if (!img.ok) {
    const code = img.status === 429 ? "RATE_LIMITED" : img.status === 402 ? "PAYMENT_REQUIRED" : `HTTP_${img.status}`;
    return new Response(JSON.stringify({
      success: false, fallback: true, error_code: code,
      message: img.status === 429
        ? "Génération d'image temporairement saturée. Réessaie dans quelques minutes."
        : img.status === 402
        ? "Crédits IA épuisés."
        : `Image generation failed (${img.status})`,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const fileName = `toolkit-covers/${toolkit_id}.png`;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const { error: uploadErr } = await supabase.storage
    .from("academy-assets")
    .upload(fileName, img.bytes!, { contentType: "image/png", upsert: true });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}`;
  await supabase.from("toolkits").update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", toolkit_id);

  console.log(JSON.stringify({ action: "generate-toolkit-cover", toolkit_id, status: "ok" }));
  return new Response(JSON.stringify({ success: true, cover_url: publicUrl }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function generateAllToolkitCovers(supabase: any, params: any, apiKey: string, cors: any) {
  const force = !!params?.force;
  let q = supabase.from("toolkits").select("id, name, description, target_audience, nomenclature, tags, cover_image_url");
  if (!force) q = q.is("cover_image_url", null);
  const { data: toolkits, error } = await q;
  if (error) throw error;

  const list = toolkits || [];
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  // Run heavy work in background to avoid CPU time limit on the request
  const work = (async () => {
    const CONCURRENCY = 2;
    async function process(t: any) {
      try {
        const prompt = await buildToolkitPrompt(apiKey, t);
        const img = await renderImage(apiKey, prompt);
        if (!img.ok) return;
        const fileName = `toolkit-covers/${t.id}.png`;
        const { error: uploadErr } = await supabase.storage
          .from("academy-assets")
          .upload(fileName, img.bytes!, { contentType: "image/png", upsert: true });
        if (uploadErr) return;
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}`;
        await supabase.from("toolkits").update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", t.id);
      } catch (e) {
        console.warn("toolkit cover failed", t.id, e instanceof Error ? e.message : e);
      }
    }
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const batch = list.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(process));
    }
    console.log(JSON.stringify({ action: "generate-all-toolkit-covers", total: list.length, status: "background-done" }));
  })();

  // @ts-ignore EdgeRuntime is available in Supabase edge functions
  if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(work);
  }

  return new Response(JSON.stringify({ success: true, queued: list.length, async: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ─── Card Illustration Generation ───────────────────────────────────
// Architecture:
//  1. Toolkit-level style guide computed ONCE per batch (cached in toolkits.illustration_style)
//     → guarantees visual coherence across all cards of a toolkit.
//  2. Per-card prompt built deterministically (NO LLM call) from style guide + pillar color + card title
//     → halves time + cost per card.
//  3. PNG output from Gemini is decoded, resized to max 768px and re-encoded as JPEG q82
//     → ~10x lighter assets (storage + portal load).

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

type StyleGuide = {
  palette: string[]; // hex colors
  abstraction: string; // e.g. "flat vector with subtle isometric depth"
  motifs: string; // recurring visual elements
  mood: string; // adjectives
};

const DEFAULT_STYLE: StyleGuide = {
  palette: ["#1a1a2e", "#e94560", "#f5f5f7"],
  abstraction: "flat vector with subtle isometric depth",
  motifs: "geometric shapes, soft gradients, layered composition",
  mood: "premium, editorial, calm",
};

async function buildToolkitStyleGuide(
  supabase: any,
  apiKey: string,
  toolkit: any,
  pillars: any[],
): Promise<StyleGuide> {
  // Reuse cached style guide if present
  if (toolkit.illustration_style && typeof toolkit.illustration_style === "object" && Array.isArray(toolkit.illustration_style.palette)) {
    return toolkit.illustration_style as StyleGuide;
  }

  const pillarColors = (pillars || [])
    .map((p) => p?.color)
    .filter((c) => typeof c === "string" && c.startsWith("#"));

  const sys = "You are an art director defining a coherent illustration style guide for a card game. Output STRICT JSON only.";
  const usr = `Toolkit: "${toolkit.name}". Theme: ${(toolkit.description || "").slice(0, 300)}. Audience: ${toolkit.target_audience || "professionals"}. Pillar colors: ${pillarColors.join(", ") || "none provided"}.

Return ONLY a JSON object with this shape:
{
  "palette": ["#hex","#hex","#hex"],   // 3 harmonious hex colors anchoring all cards
  "abstraction": "...",                 // 1 short sentence: art style (flat vector, soft isometric, line art, etc.)
  "motifs": "...",                      // recurring visual elements (shapes, textures)
  "mood": "..."                         // 3-5 adjectives
}
No prose, no markdown, no code fences.`;

  let style: StyleGuide = DEFAULT_STYLE;
  try {
    const raw = await callAI(apiKey, sys, usr, undefined, undefined, "google/gemini-2.5-flash");
    const txt = typeof raw === "string" ? raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim() : "";
    const parsed = JSON.parse(txt);
    if (parsed && Array.isArray(parsed.palette) && parsed.palette.length >= 2) {
      style = {
        palette: parsed.palette.slice(0, 4).map((c: any) => String(c)),
        abstraction: String(parsed.abstraction || DEFAULT_STYLE.abstraction).slice(0, 200),
        motifs: String(parsed.motifs || DEFAULT_STYLE.motifs).slice(0, 200),
        mood: String(parsed.mood || DEFAULT_STYLE.mood).slice(0, 120),
      };
    }
  } catch (e) {
    console.warn("style guide fallback for toolkit", toolkit.id, e instanceof Error ? e.message : e);
  }

  // Persist for reuse on future card additions
  await supabase.from("toolkits").update({ illustration_style: style }).eq("id", toolkit.id);
  return style;
}

function buildCardPrompt(card: any, pillar: any, toolkit: any, style: StyleGuide): string {
  const accent = pillar?.color || style.palette[1] || "#e94560";
  const palette = style.palette.join(", ");
  const title = String(card.title || "").slice(0, 120);
  const subtitle = String(card.subtitle || "").slice(0, 120);
  return [
    `Premium SQUARE pictogram for the corporate strategy card "${title}".`,
    subtitle ? `Concept: ${subtitle}.` : "",
    `Toolkit theme: ${toolkit?.name}. Pillar: ${pillar?.name || "—"}.`,
    `Style: ${style.abstraction}. Motifs: ${style.motifs}. Mood: ${style.mood}.`,
    `Strict palette (use ONLY these colors, dominant accent ${accent}): ${palette}.`,
    `Centered abstract symbolic composition expressing the card title. Elegant negative space, soft cinematic lighting, balanced 1:1 framing.`,
    `ABSOLUTELY NO people, NO faces, NO text, NO letters, NO words, NO numbers, NO logo, NO watermark.`,
  ].filter(Boolean).join(" ");
}

async function compressToJpeg(pngBytes: Uint8Array, maxSize = 768, quality = 82): Promise<Uint8Array> {
  try {
    const img = await Image.decode(pngBytes);
    const longest = Math.max(img.width, img.height);
    if (longest > maxSize) {
      const scale = maxSize / longest;
      img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
    }
    return await img.encodeJPEG(quality);
  } catch (e) {
    console.warn("compress fallback to png", e instanceof Error ? e.message : e);
    return pngBytes;
  }
}

async function renderCardIllustration(
  supabase: any,
  apiKey: string,
  card: any,
  pillar: any,
  toolkit: any,
  style: StyleGuide,
): Promise<{ ok: boolean; url?: string; status?: number }> {
  await supabase.from("cards").update({ image_status: "generating" }).eq("id", card.id);
  try {
    const prompt = buildCardPrompt(card, pillar, toolkit, style);
    const img = await renderImage(apiKey, prompt);
    if (!img.ok) {
      await supabase.from("cards").update({ image_status: "failed" }).eq("id", card.id);
      return { ok: false, status: img.status };
    }
    const compressed = await compressToJpeg(img.bytes!);
    const fileName = `card-illustrations/${toolkit.id}/${card.id}.jpg`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const { error: uploadErr } = await supabase.storage
      .from("academy-assets")
      .upload(fileName, compressed, { contentType: "image/jpeg", upsert: true });
    if (uploadErr) {
      await supabase.from("cards").update({ image_status: "failed" }).eq("id", card.id);
      return { ok: false };
    }
    // Cache-bust via timestamp param (URL always stable, but new upload replaces bytes)
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/academy-assets/${fileName}?v=${Date.now()}`;
    await supabase.from("cards").update({
      image_url: publicUrl,
      image_prompt: prompt,
      image_status: "ready",
    }).eq("id", card.id);
    return { ok: true, url: publicUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("card illustration failed", card.id, msg);
    const isQuota = /credits exhausted/i.test(msg);
    await supabase.from("cards").update({ image_status: isQuota ? "pending" : "failed" }).eq("id", card.id);
    return { ok: false, status: isQuota ? 402 : undefined };
  }
}

async function generateCardIllustration(supabase: any, params: any, apiKey: string, cors: any) {
  const { card_id } = params;
  if (!card_id) throw new Error("Missing card_id");
  const { data: card } = await supabase.from("cards").select("*, pillars!inner(*, toolkit_id, toolkits!inner(*))").eq("id", card_id).single();
  if (!card) throw new Error("Card not found");
  const pillar = card.pillars;
  const toolkit = pillar.toolkits;
  const result = await renderCardIllustration(supabase, apiKey, card, pillar, toolkit);
  return new Response(JSON.stringify({ success: result.ok, image_url: result.url }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function generateAllCardIllustrations(supabase: any, params: any, apiKey: string, cors: any) {
  const { toolkit_id, force } = params;
  if (!toolkit_id) throw new Error("Missing toolkit_id");

  const { data: toolkit } = await supabase.from("toolkits").select("*").eq("id", toolkit_id).single();
  if (!toolkit) throw new Error("Toolkit not found");

  const { data: pillars } = await supabase.from("pillars").select("*").eq("toolkit_id", toolkit_id);
  const pillarIds = (pillars || []).map((p: any) => p.id);
  if (pillarIds.length === 0) {
    return new Response(JSON.stringify({ success: true, queued: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });
  }
  const pillarMap = new Map((pillars || []).map((p: any) => [p.id, p]));

  let q = supabase.from("cards").select("*").in("pillar_id", pillarIds);
  if (!force) q = q.or("image_url.is.null,image_status.eq.failed");
  const { data: cards } = await q;
  const list = cards || [];

  const work = (async () => {
    const CONCURRENCY = 2;
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const batch = list.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map((c: any) => renderCardIllustration(supabase, apiKey, c, pillarMap.get(c.pillar_id), toolkit)));
    }
    console.log(JSON.stringify({ action: "generate-all-card-illustrations", toolkit_id, total: list.length, status: "background-done" }));
  })();

  // @ts-ignore
  if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(work);
  }

  return new Response(JSON.stringify({ success: true, queued: list.length, async: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function generateCardIllustrationsBatch(supabase: any, params: any, apiKey: string, cors: any) {
  const { card_ids } = params;
  if (!Array.isArray(card_ids) || card_ids.length === 0) throw new Error("Missing card_ids");
  if (card_ids.length > 20) throw new Error("Batch too large (max 20)");
  // Hard cap to avoid 150s edge timeout (each render ~10-20s)
  const MAX_PER_CALL = 5;
  if (card_ids.length > MAX_PER_CALL) {
    card_ids.length = MAX_PER_CALL;
  }

  // Reset to pending so the UI sees progress
  await supabase.from("cards").update({ image_status: "pending" }).in("id", card_ids);

  const { data: cards } = await supabase
    .from("cards")
    .select("*, pillars!inner(*, toolkit_id, toolkits!inner(*))")
    .in("id", card_ids);

  const list = cards || [];
  let processed = 0;
  let succeeded = 0;
  let consecutive402 = 0;
  let aiCredits: "ok" | "exhausted" = "ok";

  for (const c of list) {
    const pillar = c.pillars;
    const toolkit = pillar?.toolkits;
    const r = await renderCardIllustration(supabase, apiKey, c, pillar, toolkit);
    processed++;
    if (r.ok) {
      succeeded++;
      consecutive402 = 0;
    } else if (r.status === 402) {
      consecutive402++;
      if (consecutive402 >= 3) {
        aiCredits = "exhausted";
        break;
      }
    } else {
      consecutive402 = 0;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed,
    succeeded,
    failed: processed - succeeded,
    skipped: list.length - processed,
    aiCredits,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
}
