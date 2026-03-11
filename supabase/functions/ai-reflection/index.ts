import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM_PROMPT = `Tu es un consultant stratégique expert en innovation et business design. 
L'utilisateur va te décrire sa situation (contexte, problème, objectifs).
Tu dois analyser sa situation et produire un plan de jeu structuré.

IMPORTANT : Tu dois répondre en appelant la fonction "reflection_plan" avec le résultat structuré.

Règles :
- Sois concret et actionnable
- Propose 4 à 6 étapes séquentielles
- Chaque étape doit avoir un titre court, une description d'1-2 phrases, et un KPI mesurable
- Identifie les risques principaux
- Donne un score de faisabilité de 1 à 10
- Réponds en français`;

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
  const model = config?.model_structured || "google/gemini-3-flash-preview";
  const maxTokens = config?.max_tokens || 1000;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authPrefix === "x-api-key") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `${authPrefix} ${apiKey}`;
  }

  return { url: `${baseUrl}/chat/completions`, headers, model, maxTokens };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context, problem, objectives, organization_id } = await req.json();

    const config = await resolveAIConfig(organization_id);
    const systemPrompt = (config?.prompts as any)?.reflection || DEFAULT_SYSTEM_PROMPT;

    const userPrompt = `**Contexte :** ${context}\n**Problème :** ${problem}\n**Objectifs :** ${objectives}`;
    const { url, headers, model, maxTokens } = buildFetchParams(config);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        tools: [
          {
            type: "function",
            function: {
              name: "reflection_plan",
              description: "Return a structured strategic reflection plan.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Synthèse de la situation en 2-3 phrases" },
                  feasibility_score: { type: "number", description: "Score de faisabilité de 1 à 10" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { title: { type: "string" }, description: { type: "string" }, kpi: { type: "string" } },
                      required: ["title", "description", "kpi"],
                    },
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { risk: { type: "string" }, mitigation: { type: "string" } },
                      required: ["risk", "mitigation"],
                    },
                  },
                  next_action: { type: "string", description: "La toute prochaine action concrète à faire" },
                },
                required: ["summary", "feasibility_score", "steps", "risks", "next_action"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "reflection_plan" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Pas de réponse structurée" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const plan = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-reflection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
