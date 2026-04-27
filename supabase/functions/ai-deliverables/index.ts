import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PROMPTS: Record<string, string> = {
  swot: `Tu es un consultant stratégique. Génère une analyse SWOT complète et détaillée basée sur la description du projet. Réponds en français. Sois concret et spécifique.`,
  bmc: `Tu es un expert en Business Model Canvas. Génère un BMC complet et détaillé. Réponds en français. Chaque bloc doit contenir 3-5 éléments concrets.`,
  pitch_deck: `Tu es un expert en pitch deck pour startups. Génère un pitch deck structuré en slides. Réponds en français. Chaque slide doit avoir un titre et un contenu percutant.`,
  action_plan: `Tu es un chef de projet expert. Génère un plan d'action détaillé avec des phases, des jalons et des responsabilités. Réponds en français.`,
};

const TOOLS: Record<string, any> = {
  swot: {
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
  bmc: {
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
  pitch_deck: {
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
            properties: { slide_title: { type: "string" }, content: { type: "string" }, speaker_notes: { type: "string" } },
            required: ["slide_title", "content"],
          },
        },
      },
      required: ["title", "slides"],
    },
  },
  action_plan: {
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
            properties: { phase_name: { type: "string" }, duration: { type: "string" }, tasks: { type: "array", items: { type: "string" } }, milestone: { type: "string" } },
            required: ["phase_name", "duration", "tasks", "milestone"],
          },
        },
        success_metrics: { type: "array", items: { type: "string" } },
      },
      required: ["title", "vision", "phases", "success_metrics"],
    },
  },
};

async function resolveAIConfig(organizationId?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  async function hydrateKey(cfg: any) {
    if (cfg && !cfg.api_key && cfg.api_key_secret_id) {
      try {
        const { data } = await sb.rpc("get_ai_api_key", { _config_id: cfg.id });
        if (data) cfg.api_key = data as string;
      } catch (e) { console.warn("[ai-deliverables] vault decrypt failed", e); }
    }
    return cfg;
  }

  if (organizationId) {
    const { data: orgConfig } = await sb
      .from("ai_configurations")
      .select("*, ai_providers(*)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (orgConfig) return await hydrateKey(orgConfig);
  }

  const { data: globalConfig } = await sb
    .from("ai_configurations")
    .select("*, ai_providers(*)")
    .is("organization_id", null)
    .eq("is_active", true)
    .maybeSingle();
  if (globalConfig) return await hydrateKey(globalConfig);

  return null;
}

function buildFetchParams(config: any) {
  const provider = config?.ai_providers;
  const baseUrl = provider?.base_url || "https://ai.gateway.lovable.dev/v1";
  const apiKey = config?.api_key || Deno.env.get("LOVABLE_API_KEY")!;
  const authPrefix = provider?.auth_header_prefix || "Bearer";
  const model = config?.model_structured || "google/gemini-3-flash-preview";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authPrefix === "x-api-key") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `${authPrefix} ${apiKey}`;
  }

  return { url: `${baseUrl}/chat/completions`, headers, model };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, description, organization_id } = await req.json();

    const tool = TOOLS[type];
    if (!tool) return new Response(JSON.stringify({ error: "Type de livrable inconnu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const config = await resolveAIConfig(organization_id);
    const promptKey = `deliverables_${type}`;
    const systemPrompt = (config?.prompts as any)?.[promptKey] || DEFAULT_PROMPTS[type];

    const { url, headers, model } = buildFetchParams(config);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici la description du projet :\n\n${description}` },
        ],
        tools: [{ type: "function", function: tool }],
        tool_choice: { type: "function", function: { name: tool.name } },
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
