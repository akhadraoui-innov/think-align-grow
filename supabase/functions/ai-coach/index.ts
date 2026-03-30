import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM_PROMPT = `Tu es un coach stratégique IA expert en business et innovation, spécialisé dans le framework GROWTHINNOV.
Tu aides les entrepreneurs et managers à structurer leur réflexion stratégique.
Tu connais les concepts suivants : Business Model Canvas, Problem-Solution Fit, Product-Market Fit, Jobs To Be Done, First Principles, Unit Economics, Viral Loop, Network Effects.
Réponds de manière concise, actionnable et en français. Utilise du **gras** pour les concepts clés.
Pose des questions pour challenger les hypothèses de l'utilisateur.`;

async function resolveAIConfig(organizationId?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  // Try org config first
  if (organizationId) {
    const { data: orgConfig } = await sb
      .from("ai_configurations")
      .select("*, ai_providers(*)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (orgConfig) return orgConfig;
  }

  // Try global config
  const { data: globalConfig } = await sb
    .from("ai_configurations")
    .select("*, ai_providers(*)")
    .is("organization_id", null)
    .eq("is_active", true)
    .maybeSingle();
  if (globalConfig) return globalConfig;

  return null;
}

function buildFetchParams(config: any, messages: any[], model: string, maxTokens: number) {
  const provider = config?.ai_providers;
  const baseUrl = provider?.base_url || "https://ai.gateway.lovable.dev/v1";
  const apiKey = config?.api_key || Deno.env.get("LOVABLE_API_KEY")!;
  const authPrefix = provider?.auth_header_prefix || "Bearer";
  const finalModel = config?.model_chat || model;
  const finalMaxTokens = config?.max_tokens || maxTokens;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (authPrefix === "x-api-key") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `${authPrefix} ${apiKey}`;
  }

  return { url: `${baseUrl}/chat/completions`, headers, model: finalModel, maxTokens: finalMaxTokens };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userMessage, organization_id } = await req.json();

    const config = await resolveAIConfig(organization_id);
    const systemPrompt = (config?.prompts as any)?.coach || DEFAULT_SYSTEM_PROMPT;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
      { role: "user", content: userMessage },
    ];

    const { url, headers, model, maxTokens } = buildFetchParams(config, aiMessages, "google/gemini-2.5-flash", 500);

    const aiResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages: aiMessages, max_tokens: maxTokens }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ reply: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ reply: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "Je n'ai pas pu générer une réponse.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ reply: "Désolé, une erreur est survenue." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
