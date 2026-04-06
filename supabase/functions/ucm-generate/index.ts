import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DEFAULT_CONFIG = { model: "google/gemini-2.5-flash", temperature: 0.7, max_tokens: 4096 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { project_id } = await req.json();
    if (!project_id) return new Response(JSON.stringify({ error: "project_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load project + org
    const { data: project, error: projErr } = await supabase
      .from("ucm_projects").select("*, ucm_sectors(*)").eq("id", project_id).single();
    if (projErr || !project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Permission check
    const { data: hasPerm } = await svc.rpc("is_org_member", { _user_id: user.id, _org_id: project.organization_id });
    if (!hasPerm) return new Response(JSON.stringify({ error: "forbidden", message: "Vous n'avez pas accès à cette organisation." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Quota pre-check
    const { data: quotaOk } = await svc.rpc("check_ucm_quota", { p_org_id: project.organization_id, p_action: "uc_generation" });
    if (quotaOk === false) {
      return new Response(JSON.stringify({ error: "quota_exceeded", quota_type: "uc_generation", message: "Limite de générations de use cases atteinte pour ce mois. Passez au plan Pro." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load AI config from org
    const { data: orgData } = await svc.from("organizations").select("ucm_ai_config").eq("id", project.organization_id).single();
    const aiConfig = (orgData?.ucm_ai_config as any)?.uc_generation || DEFAULT_CONFIG;
    const model = aiConfig.model || DEFAULT_CONFIG.model;
    const temperature = aiConfig.temperature ?? DEFAULT_CONFIG.temperature;
    const max_tokens = aiConfig.max_tokens || DEFAULT_CONFIG.max_tokens;

    // Build context
    const sector = (project as any).ucm_sectors;
    const sectorKnowledge = sector?.knowledge || "";
    const selectedFunctions = project.selected_functions || [];

    const prompt = `Tu es un consultant senior en transformation IA, expert multi-sectoriel avec 20 ans d'expérience.

CONTEXTE CLIENT :
- Entreprise : ${project.company}
- Secteur : ${project.sector_label || sector?.label || "Non spécifié"}
- Contexte : ${project.context}
${project.immersion ? `- Immersion détaillée : ${project.immersion}` : ""}

CONNAISSANCE SECTORIELLE :
${sectorKnowledge}

FONCTIONS SÉLECTIONNÉES :
${selectedFunctions.join(", ")}

MISSION : Génère exactement 10 use cases IA pertinents, innovants et actionnables pour cette entreprise.

Pour chaque use case, fournis :
- name: nom court et impactant
- description: 2-3 phrases décrivant le use case
- priority: "Quick Win" | "Stratégique" | "Transformant" | "Exploratoire"
- complexity: "Faible" | "Moyenne" | "Haute"
- impact_level: "Fort" | "Significatif" | "Modéré"
- horizon: "Court terme" | "Moyen terme" | "Long terme"
- data_readiness: "Prêt" | "Partiel" | "À construire"
- ai_techniques: tableau de techniques IA (ML, NLP, Computer Vision, GenAI, etc.)
- value_drivers: tableau de leviers de valeur
- functions: tableau de fonctions métier concernées

Réponds UNIQUEMENT en JSON valide : { "use_cases": [...] }`;

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature, max_tokens, response_format: { type: "json_object" } }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI call failed", details: err }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const useCases = parsed.use_cases || [];
    const toInsert = useCases.map((uc: any, i: number) => ({
      project_id, organization_id: project.organization_id,
      name: uc.name, description: uc.description, priority: uc.priority,
      complexity: uc.complexity, impact_level: uc.impact_level, horizon: uc.horizon,
      data_readiness: uc.data_readiness, ai_techniques: uc.ai_techniques || [],
      value_drivers: uc.value_drivers || [], functions: uc.functions || [],
      is_generated: true, sort_order: i,
    }));

    const { data: inserted, error: insertErr } = await supabase.from("ucm_use_cases").insert(toInsert).select();
    if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("ucm_projects").update({ status: "in_progress" }).eq("id", project_id);
    await svc.rpc("ucm_increment_quota", { _org_id: project.organization_id, _field: "uc_generations", _tokens: aiData.usage?.total_tokens || 0 });

    return new Response(JSON.stringify({ use_cases: inserted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
