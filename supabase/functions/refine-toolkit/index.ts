import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function resolveAIConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  const { data: globalConfig } = await sb
    .from("ai_configurations")
    .select("*, ai_providers(*)")
    .is("organization_id", null)
    .eq("is_active", true)
    .maybeSingle();

  if (globalConfig && !globalConfig.api_key && globalConfig.api_key_secret_id) {
    try {
      const { data } = await sb.rpc("get_ai_api_key", { _config_id: globalConfig.id });
      if (data) globalConfig.api_key = data as string;
    } catch (e) { console.warn("[refine-toolkit] vault decrypt failed", e); }
  }
  return globalConfig;
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isSaas } = await adminClient.rpc("is_saas_team", { _user_id: userId });
    if (!isSaas) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { toolkit_id, scope, instruction } = await req.json();
    if (!toolkit_id || !instruction) {
      return new Response(JSON.stringify({ error: "toolkit_id and instruction required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load toolkit
    const { data: toolkit } = await adminClient.from("toolkits").select("*").eq("id", toolkit_id).single();
    if (!toolkit) throw new Error("Toolkit not found");

    // Load cards for scope
    let cardsQuery = adminClient.from("cards").select("*, pillars!inner(name, toolkit_id)").eq("pillars.toolkit_id", toolkit_id);
    if (scope && scope !== "all") {
      cardsQuery = cardsQuery.eq("pillar_id", scope);
    }
    const { data: cards, error: cardsError } = await cardsQuery;
    if (cardsError) throw new Error(cardsError.message);
    if (!cards || cards.length === 0) throw new Error("No cards found for this scope");

    // Build AI prompt
    const config = await resolveAIConfig();
    const fetchParams = buildFetchParams(config);

    const cardsContext = cards.map((c: any) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      definition: c.definition,
      action: c.action,
      kpi: c.kpi,
      pillar: c.pillars?.name,
    }));

    const prompt = `Tu es un expert en conception pédagogique. Voici les cartes du toolkit "${toolkit.name}" :

${JSON.stringify(cardsContext, null, 2)}

INSTRUCTION DE L'UTILISATEUR : "${instruction}"

Applique cette instruction aux cartes ci-dessus. Retourne UNIQUEMENT un JSON avec les cartes modifiées, au format :
{
  "modifications": [
    { "id": "uuid-de-la-carte", "field": "definition|action|kpi|subtitle|title", "new_value": "..." },
    ...
  ],
  "summary": "Résumé des modifications en 2-3 phrases"
}

IMPORTANT :
- Ne modifie que les cartes qui sont pertinentes par rapport à l'instruction
- Garde le même style et niveau de qualité
- Si l'instruction ne s'applique pas à certaines cartes, ignore-les`;

    const resp = await fetch(fetchParams.url, {
      method: "POST",
      headers: fetchParams.headers,
      body: JSON.stringify({
        model: fetchParams.model,
        messages: [
          { role: "system", content: "Tu es un expert en pédagogie et stratégie. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt },
        ],
        max_tokens: 16000,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`AI error ${resp.status}: ${txt}`);
    }

    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown fences
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
    }

    const result = JSON.parse(content);
    const mods = result.modifications || [];

    // Apply modifications
    let applied = 0;
    for (const mod of mods) {
      if (!mod.id || !mod.field || !mod.new_value) continue;
      const allowedFields = ["title", "subtitle", "definition", "action", "kpi", "objective"];
      if (!allowedFields.includes(mod.field)) continue;

      const { error } = await adminClient.from("cards").update({ [mod.field]: mod.new_value }).eq("id", mod.id);
      if (!error) applied++;
    }

    return new Response(
      JSON.stringify({ summary: result.summary || `${applied} cartes modifiées.`, applied, total: mods.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("refine-toolkit error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
