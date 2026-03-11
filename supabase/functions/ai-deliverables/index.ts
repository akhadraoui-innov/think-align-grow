import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, { system: string; tool: any }> = {
  swot: {
    system: `Tu es un consultant stratégique. Génère une analyse SWOT complète et détaillée basée sur la description du projet. Réponds en français. Sois concret et spécifique.`,
    tool: {
      name: "swot_analysis",
      description: "Return a structured SWOT analysis.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          threats: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
        },
        required: ["title", "strengths", "weaknesses", "opportunities", "threats", "recommendation"],
      },
    },
  },
  bmc: {
    system: `Tu es un expert en Business Model Canvas. Génère un BMC complet et détaillé. Réponds en français. Chaque bloc doit contenir 3-5 éléments concrets.`,
    tool: {
      name: "bmc_analysis",
      description: "Return a structured Business Model Canvas.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          key_partners: { type: "array", items: { type: "string" } },
          key_activities: { type: "array", items: { type: "string" } },
          key_resources: { type: "array", items: { type: "string" } },
          value_propositions: { type: "array", items: { type: "string" } },
          customer_relationships: { type: "array", items: { type: "string" } },
          channels: { type: "array", items: { type: "string" } },
          customer_segments: { type: "array", items: { type: "string" } },
          cost_structure: { type: "array", items: { type: "string" } },
          revenue_streams: { type: "array", items: { type: "string" } },
        },
        required: ["title", "key_partners", "key_activities", "key_resources", "value_propositions", "customer_relationships", "channels", "customer_segments", "cost_structure", "revenue_streams"],
      },
    },
  },
  pitch_deck: {
    system: `Tu es un expert en pitch deck pour startups. Génère un pitch deck structuré en slides. Réponds en français. Chaque slide doit avoir un titre et un contenu percutant.`,
    tool: {
      name: "pitch_deck",
      description: "Return a structured pitch deck.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slide_title: { type: "string" },
                content: { type: "string" },
                speaker_notes: { type: "string" },
              },
              required: ["slide_title", "content"],
            },
          },
        },
        required: ["title", "slides"],
      },
    },
  },
  action_plan: {
    system: `Tu es un chef de projet expert. Génère un plan d'action détaillé avec des phases, des jalons et des responsabilités. Réponds en français.`,
    tool: {
      name: "action_plan",
      description: "Return a structured action plan.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          vision: { type: "string" },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase_name: { type: "string" },
                duration: { type: "string" },
                tasks: { type: "array", items: { type: "string" } },
                milestone: { type: "string" },
              },
              required: ["phase_name", "duration", "tasks", "milestone"],
            },
          },
          success_metrics: { type: "array", items: { type: "string" } },
        },
        required: ["title", "vision", "phases", "success_metrics"],
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const config = PROMPTS[type];
    if (!config) return new Response(JSON.stringify({ error: "Type de livrable inconnu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: config.system },
          { role: "user", content: `Voici la description du projet :\n\n${description}` },
        ],
        tools: [{ type: "function", function: config.tool }],
        tool_choice: { type: "function", function: { name: config.tool.name } },
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
    if (!toolCall) return new Response(JSON.stringify({ error: "Pas de réponse structurée" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const deliverable = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ deliverable, type }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-deliverables error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
