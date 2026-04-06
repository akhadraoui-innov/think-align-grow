import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_CONFIG = { model: "google/gemini-2.5-flash", temperature: 0.6, max_tokens: 2048 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { project_id, message } = await req.json();
    if (!project_id || !message) return new Response(JSON.stringify({ error: "project_id and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: project } = await supabase.from("ucm_projects").select("*, ucm_sectors(*)").eq("id", project_id).single();
    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const orgId = project.organization_id;
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Permission check
    const { data: hasPerm } = await svc.rpc("is_org_member", { _user_id: user.id, _org_id: orgId });
    if (!hasPerm) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Quota pre-check
    const { data: quotaOk } = await svc.rpc("check_ucm_quota", { p_org_id: orgId, p_action: "chat" });
    if (quotaOk === false) {
      return new Response(JSON.stringify({ error: "quota_exceeded", quota_type: "chat", message: "Limite de messages chat atteinte pour ce mois." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load UCs + history
    const { data: useCases } = await supabase.from("ucm_use_cases").select("name, description, priority, complexity, impact_level, is_selected").eq("project_id", project_id);
    const { data: history } = await supabase.from("ucm_chat_messages").select("role, content").eq("project_id", project_id).order("created_at", { ascending: true }).limit(20);

    await supabase.from("ucm_chat_messages").insert({ project_id, organization_id: orgId, user_id: user.id, role: "user", content: message });

    const sector = (project as any).ucm_sectors;
    const ucList = (useCases || []).map((uc: any) => `- ${uc.name} (${uc.priority}, ${uc.complexity}) ${uc.is_selected ? "✅" : ""}: ${uc.description}`).join("\n");

    // Load AI config
    const { data: orgData } = await svc.from("organizations").select("ucm_ai_config").eq("id", orgId).single();
    const aiCfg = (orgData?.ucm_ai_config as any)?.chat || DEFAULT_CONFIG;
    const model = aiCfg.model || DEFAULT_CONFIG.model;
    const temperature = aiCfg.temperature ?? DEFAULT_CONFIG.temperature;
    const max_tokens = aiCfg.max_tokens || DEFAULT_CONFIG.max_tokens;

    const systemPrompt = `Tu es un consultant senior IA spécialisé en transformation digitale. Tu accompagnes un client dans son projet de transformation IA.

CONTEXTE DU PROJET :
- Entreprise : ${project.company}
- Secteur : ${project.sector_label || sector?.label || ""}
- Contexte : ${project.context}
${project.immersion ? `- Immersion : ${project.immersion}` : ""}
${sector?.knowledge ? `- Knowledge sectoriel : ${sector.knowledge}` : ""}

USE CASES IDENTIFIÉS :
${ucList}

Réponds de manière concise, experte et actionnable. Utilise le markdown pour structurer tes réponses.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });

    if (!aiRes.ok) return new Response(JSON.stringify({ error: "AI call failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    await supabase.from("ucm_chat_messages").insert({ project_id, organization_id: orgId, role: "assistant", content: reply, tokens_used: tokensUsed });
    await svc.rpc("ucm_increment_quota", { _org_id: orgId, _field: "chat_messages", _tokens: tokensUsed });

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
