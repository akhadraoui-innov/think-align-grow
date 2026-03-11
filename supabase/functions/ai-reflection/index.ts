import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context, problem, objectives } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un consultant stratégique expert en innovation et business design. 
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

    const userPrompt = `**Contexte :** ${context}
**Problème :** ${problem}
**Objectifs :** ${objectives}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        kpi: { type: "string" },
                      },
                      required: ["title", "description", "kpi"],
                    },
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        risk: { type: "string" },
                        mitigation: { type: "string" },
                      },
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
