import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PILLAR_COLORS = [
  "#E8552D", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#EF4444",
];

const PILLAR_ICONS = [
  "Lightbulb", "Rocket", "Briefcase", "Hammer", "TrendingUp",
  "BarChart3", "Users", "Wallet", "Shield", "Target",
];

async function resolveAIConfig(organizationId?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  if (organizationId) {
    const { data: orgConfig } = await sb
      .from("ai_configurations")
      .select("*, ai_providers(*)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (orgConfig) return orgConfig;
  }

  const { data: globalConfig } = await sb
    .from("ai_configurations")
    .select("*, ai_providers(*)")
    .is("organization_id", null)
    .eq("is_active", true)
    .maybeSingle();
  if (globalConfig) return globalConfig;

  return null;
}

function buildFetchParams(config: any) {
  const provider = config?.ai_providers;
  const baseUrl = provider?.base_url || "https://ai.gateway.lovable.dev/v1";
  const apiKey = config?.api_key || Deno.env.get("LOVABLE_API_KEY")!;
  const authPrefix = provider?.auth_header_prefix || "Bearer";
  const model = config?.model_structured || "google/gemini-2.5-pro";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authPrefix === "x-api-key") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `${authPrefix} ${apiKey}`;
  }

  return { url: `${baseUrl}/chat/completions`, headers, model };
}

function parseAIContent(raw: string): any {
  let cleaned = raw.trim();
  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

async function callAI(fetchParams: any, messages: any[], maxTokens: number, tools?: any[], toolChoice?: any) {
  const body: any = { model: fetchParams.model, messages, max_tokens: maxTokens };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

  const resp = await fetch(fetchParams.url, {
    method: "POST",
    headers: fetchParams.headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI error ${resp.status}: ${txt}`);
  }

  const data = await resp.json();
  const choice = data.choices?.[0];
  
  console.log(`AI response: finish_reason=${choice?.finish_reason}, has_tool_calls=${!!choice?.message?.tool_calls}, content_length=${choice?.message?.content?.length || 0}`);

  if (choice?.message?.tool_calls?.[0]) {
    return JSON.parse(choice.message.tool_calls[0].function.arguments);
  }
  if (choice?.message?.content) {
    return parseAIContent(choice.message.content);
  }
  throw new Error("No valid AI response");
}

async function callAIWithRetry(fetchParams: any, messages: any[], maxTokens: number, tools?: any[], toolChoice?: any) {
  try {
    return await callAI(fetchParams, messages, maxTokens, tools, toolChoice);
  } catch (e: any) {
    console.warn(`AI call failed, retrying once: ${e.message}`);
    return await callAI(fetchParams, messages, maxTokens, tools, toolChoice);
  }
}

const SYSTEM_PROMPT = `Tu es un expert en conception pédagogique, stratégie business et innovation. Tu crées des toolkits éducatifs de niveau professionnel.

MODÈLE DE RÉFÉRENCE — "Bootstrap in Business" :
- 10 piliers thématiques (ex: Thinking, Innovation, Business, Building, Profitability, Indicators, Managing, Finance, Gouvernance, Fundraising)
- Chaque pilier a: name, slug, description détaillée (2-3 phrases), subtitle (phrase courte), target_audience, learning_outcomes (3-5 items)
- 20 cartes par pilier réparties en 4 phases:
  * foundations (cartes 1-5) : concepts fondamentaux
  * model (cartes 6-10) : structuration du modèle  
  * growth (cartes 11-15) : stratégies de croissance
  * execution (cartes 16-20) : mise en œuvre concrète
- Chaque carte a: title (concept clé, 2-4 mots), subtitle (phrase d'accroche), definition (explication pédagogique 2-3 phrases), action (exercice concret actionnable), kpi (indicateur mesurable), qualification (niveau: essentiel/avancé/expert), difficulty (easy/medium/hard), valorization (points: 10-50)

QUALITÉ ATTENDUE :
- Contenu de niveau MBA / formation professionnelle
- Définitions claires, pédagogiques, avec des exemples concrets
- Actions réellement actionnables, pas de vague conseil
- KPIs mesurables et pertinents
- Progression logique du fondamental vers l'expert
- Vocabulaire professionnel mais accessible`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // SSE stream setup
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  function sendEvent(data: any) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(msg)).catch(() => {});
  }

  async function run() {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        sendEvent({ type: "error", message: "Unauthorized" });
        writer.close();
        return;
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (claimsError || !claimsData?.claims) {
        sendEvent({ type: "error", message: "Unauthorized" });
        writer.close();
        return;
      }
      const userId = claimsData.claims.sub as string;

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: isSaas } = await adminClient.rpc("is_saas_team", { _user_id: userId });
      if (!isSaas) {
        sendEvent({ type: "error", message: "Forbidden" });
        writer.close();
        return;
      }

      const { name, slug, icon_emoji, description, target_audience, objectives, pillar_count, cards_per_pillar, language, difficulty_level, generate_quiz } = await req.json();

      const config = await resolveAIConfig();
      const fetchParams = buildFetchParams(config);

      // Step 1: Create toolkit
      const { data: toolkit, error: tkError } = await adminClient
        .from("toolkits")
        .insert({ name, slug, icon_emoji: icon_emoji || "🚀", description, target_audience, difficulty_level, status: "draft" })
        .select()
        .single();
      if (tkError) throw new Error(`Toolkit insert error: ${tkError.message}`);

      sendEvent({ type: "progress", step: "toolkit_created", toolkit_id: toolkit.id });

      // Step 2: Generate pillars
      const pillarPrompt = `Crée exactement ${pillar_count || 8} piliers thématiques pour un toolkit intitulé "${name}".
Description: ${description || "Non fournie"}
Audience cible: ${target_audience || "Professionnels"}
Objectifs: ${objectives || "Formation complète"}
Langue: ${language || "Français"}
Niveau: ${difficulty_level || "Intermédiaire"}

Chaque pilier doit couvrir un aspect essentiel et distinct du sujet. La progression doit être logique.`;

      const pillarTool = {
        type: "function",
        function: {
          name: "create_pillars",
          description: "Create the pillar structure for the toolkit",
          parameters: {
            type: "object",
            properties: {
              pillars: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Nom du pilier (2-3 mots)" },
                    slug: { type: "string", description: "Slug URL-friendly" },
                    description: { type: "string", description: "Description détaillée (2-3 phrases)" },
                    subtitle: { type: "string", description: "Phrase d'accroche courte" },
                    target_audience: { type: "string", description: "Audience cible spécifique" },
                    learning_outcomes: { type: "array", items: { type: "string" }, description: "3-5 acquis pédagogiques" },
                  },
                  required: ["name", "slug", "description", "subtitle", "target_audience", "learning_outcomes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["pillars"],
            additionalProperties: false,
          },
        },
      };

      const pillarResult = await callAIWithRetry(
        fetchParams,
        [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: pillarPrompt }],
        8000,
        [pillarTool],
        { type: "function", function: { name: "create_pillars" } }
      );

      const pillarInserts = pillarResult.pillars.map((p: any, i: number) => ({
        toolkit_id: toolkit.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        subtitle: p.subtitle,
        target_audience: p.target_audience,
        learning_outcomes: p.learning_outcomes,
        icon_name: PILLAR_ICONS[i % PILLAR_ICONS.length],
        color: PILLAR_COLORS[i % PILLAR_COLORS.length],
        sort_order: i,
        weight: 1,
        status: "active",
      }));

      const { data: pillars, error: pError } = await adminClient
        .from("pillars")
        .insert(pillarInserts)
        .select();
      if (pError) throw new Error(`Pillars insert error: ${pError.message}`);

      const pillarNames = pillars!.map((p: any) => p.name);
      sendEvent({ type: "progress", step: "pillars_generated", pillars: pillarNames });

      // Step 3: Generate cards per pillar
      const cardsPerPillar = cards_per_pillar || 20;
      const cardTool = {
        type: "function",
        function: {
          name: "create_cards",
          description: "Create cards for a pillar",
          parameters: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Concept clé (2-4 mots)" },
                    subtitle: { type: "string", description: "Phrase d'accroche" },
                    definition: { type: "string", description: "Explication pédagogique (2-3 phrases)" },
                    action: { type: "string", description: "Exercice concret et actionnable" },
                    kpi: { type: "string", description: "Indicateur mesurable" },
                    objective: { type: "string", description: "Objectif pédagogique de la carte" },
                    phase: { type: "string", enum: ["foundations", "model", "growth", "execution"] },
                    qualification: { type: "string", enum: ["essentiel", "avancé", "expert"] },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    valorization: { type: "integer", description: "Points (10-50)" },
                  },
                  required: ["title", "subtitle", "definition", "action", "kpi", "objective", "phase", "qualification", "difficulty", "valorization"],
                  additionalProperties: false,
                },
              },
            },
            required: ["cards"],
            additionalProperties: false,
          },
        },
      };

      let totalCards = 0;

      for (let pi = 0; pi < pillars!.length; pi++) {
        const pillar = pillars![pi];
        sendEvent({ type: "progress", step: "cards_generating", pillar: pillar.name, index: pi, total: pillars!.length });

        const f = Math.floor(cardsPerPillar * 0.25);
        const m = Math.floor(cardsPerPillar * 0.25);
        const g = Math.floor(cardsPerPillar * 0.25);
        const e = cardsPerPillar - f - m - g;

        const cardPrompt = `Crée exactement ${cardsPerPillar} cartes pour le pilier "${pillar.name}" du toolkit "${name}".
Description du pilier: ${pillar.description}
Audience: ${target_audience || "Professionnels"}
Langue: ${language || "Français"}

Répartition stricte par phase:
- foundations: ${f} cartes (concepts fondamentaux, qualification "essentiel", difficulty "easy")
- model: ${m} cartes (structuration, qualification "essentiel"/"avancé", difficulty "easy"/"medium")
- growth: ${g} cartes (croissance, qualification "avancé", difficulty "medium")
- execution: ${e} cartes (mise en œuvre, qualification "avancé"/"expert", difficulty "medium"/"hard")

Valorization: foundations 10-20pts, model 15-30pts, growth 25-40pts, execution 30-50pts.
Chaque carte doit avoir un contenu unique, professionnel et actionnable.`;

        const cardResult = await callAIWithRetry(
          fetchParams,
          [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: cardPrompt }],
          16000,
          [cardTool],
          { type: "function", function: { name: "create_cards" } }
        );

        const cardInserts = cardResult.cards.map((c: any, i: number) => ({
          pillar_id: pillar.id,
          title: c.title,
          subtitle: c.subtitle,
          definition: c.definition,
          action: c.action,
          kpi: c.kpi,
          objective: c.objective,
          phase: c.phase,
          qualification: c.qualification,
          difficulty: c.difficulty,
          valorization: c.valorization,
          sort_order: i,
          status: "active",
          tags: [],
        }));

        const { error: cError } = await adminClient.from("cards").insert(cardInserts);
        if (cError) throw new Error(`Cards insert error for pillar ${pillar.name}: ${cError.message}`);

        totalCards += cardInserts.length;
        sendEvent({ type: "progress", step: "cards_done", pillar: pillar.name, count: cardInserts.length });
      }

      // Step 4: Quiz (optional)
      let totalQuiz = 0;
      if (generate_quiz) {
        const quizTool = {
          type: "function",
          function: {
            name: "create_quiz",
            description: "Create quiz questions for a pillar",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string", description: "Question de quiz" },
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            score: { type: "integer", description: "Score 0-3" },
                          },
                          required: ["label", "score"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["question", "options"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        };

        for (const pillar of pillars!) {
          sendEvent({ type: "progress", step: "quiz_generating", pillar: pillar.name });

          const quizPrompt = `Crée 4 questions de quiz pour évaluer la compréhension du pilier "${pillar.name}" du toolkit "${name}".
Description: ${pillar.description}
Langue: ${language || "Français"}

Chaque question doit avoir 4 options avec un score de 0 à 3.`;

          const quizResult = await callAIWithRetry(
            fetchParams,
            [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: quizPrompt }],
            4000,
            [quizTool],
            { type: "function", function: { name: "create_quiz" } }
          );

          const quizInserts = quizResult.questions.map((q: any, i: number) => ({
            pillar_id: pillar.id,
            question: q.question,
            options: q.options,
            sort_order: i,
          }));

          const { error: qError } = await adminClient.from("quiz_questions").insert(quizInserts);
          if (qError) throw new Error(`Quiz insert error for pillar ${pillar.name}: ${qError.message}`);

          totalQuiz += quizInserts.length;
          sendEvent({ type: "progress", step: "quiz_done", pillar: pillar.name, count: quizInserts.length });
        }
      }

      sendEvent({ type: "complete", toolkit_id: toolkit.id, pillars: pillars!.length, cards: totalCards, quiz: totalQuiz });
      writer.close();
    } catch (e: any) {
      console.error("generate-toolkit error:", e);
      sendEvent({ type: "error", message: e.message || "Une erreur est survenue" });
      writer.close();
    }
  }

  // Start the generation in the background
  run();

  return new Response(stream.readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
