import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { use_case_id, section_id, mode = "brief" } = await req.json();
    if (!use_case_id || !section_id) return new Response(JSON.stringify({ error: "use_case_id and section_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load UC + project + sector
    const { data: uc } = await supabase.from("ucm_use_cases").select("*, ucm_projects(*, ucm_sectors(*))").eq("id", use_case_id).single();
    if (!uc) return new Response(JSON.stringify({ error: "Use case not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const project = (uc as any).ucm_projects;
    const sector = project?.ucm_sectors;

    // Load analysis section config
    const { data: sectionConfig } = await supabase.from("ucm_analysis_sections").select("*").eq("code", section_id).is("organization_id", null).single();
    if (!sectionConfig) return new Response(JSON.stringify({ error: "Section not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load UC context if exists
    const { data: ucContext } = await supabase.from("ucm_uc_contexts").select("*").eq("use_case_id", use_case_id).maybeSingle();

    const instruction = mode === "detailed" ? sectionConfig.detailed_instruction : sectionConfig.brief_instruction;

    const contextParts = [];
    if (ucContext?.situation) contextParts.push(`Situation actuelle : ${ucContext.situation}`);
    if (ucContext?.tools) contextParts.push(`Outils existants : ${ucContext.tools}`);
    if (ucContext?.team) contextParts.push(`Équipe : ${ucContext.team}`);
    if (ucContext?.volumes) contextParts.push(`Volumes : ${ucContext.volumes}`);
    if (ucContext?.pain_points) contextParts.push(`Points de douleur : ${ucContext.pain_points}`);
    if (ucContext?.objectives) contextParts.push(`Objectifs : ${ucContext.objectives}`);
    if (ucContext?.constraints) contextParts.push(`Contraintes : ${ucContext.constraints}`);

    const prompt = `Tu es un consultant senior en transformation IA de niveau Tier 1 (McKinsey/BCG).

ENTREPRISE : ${project.company}
SECTEUR : ${project.sector_label || sector?.label || ""}
CONTEXTE GLOBAL : ${project.context}
${project.immersion ? `IMMERSION : ${project.immersion}` : ""}

CONNAISSANCE SECTORIELLE : ${sector?.knowledge || ""}

USE CASE : ${uc.name}
DESCRIPTION : ${uc.description || ""}
TECHNIQUES IA : ${(uc.ai_techniques || []).join(", ")}
PRIORITÉ : ${uc.priority || ""}
COMPLEXITÉ : ${uc.complexity || ""}
${contextParts.length > 0 ? `\nCONTEXTE SPÉCIFIQUE :\n${contextParts.join("\n")}` : ""}

INSTRUCTION (${sectionConfig.title} — mode ${mode}) :
${instruction}

Rédige l'analyse en markdown riche et structuré.`;

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const startTime = Date.now();
    const aiRes = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({
        model: mode === "detailed" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: mode === "detailed" ? 0.4 : 0.5,
        max_tokens: mode === "detailed" ? 8192 : 4096,
      }),
    });

    if (!aiRes.ok) return new Response(JSON.stringify({ error: "AI call failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const generationTime = Date.now() - startTime;
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Get next version
    const { data: existing } = await supabase
      .from("ucm_analyses")
      .select("version")
      .eq("use_case_id", use_case_id)
      .eq("section_id", section_id)
      .eq("mode", mode)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existing?.[0]?.version || 0) + 1;

    // Mark previous as not current
    if (nextVersion > 1) {
      await supabase.from("ucm_analyses").update({ is_current: false }).eq("use_case_id", use_case_id).eq("section_id", section_id).eq("mode", mode);
    }

    const { data: analysis, error: insertErr } = await supabase.from("ucm_analyses").insert({
      use_case_id,
      project_id: project.id,
      organization_id: project.organization_id,
      section_id,
      mode,
      content,
      ai_model: mode === "detailed" ? "gemini-2.5-pro" : "gemini-2.5-flash",
      tokens_used: tokensUsed,
      generation_time_ms: generationTime,
      version: nextVersion,
      is_current: true,
      generated_by: user.id,
    }).select().single();

    if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Increment quota
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await svc.rpc("ucm_increment_quota", { _org_id: project.organization_id, _field: "analysis_generations", _tokens: tokensUsed });

    return new Response(JSON.stringify({ analysis }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
