import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.98.0/cors";

const LOVABLE_API_URL = "https://api.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { project_id, section_id } = await req.json();
    if (!project_id || !section_id) return new Response(JSON.stringify({ error: "project_id and section_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load project + sector
    const { data: project } = await supabase.from("ucm_projects").select("*, ucm_sectors(*)").eq("id", project_id).single();
    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load section config
    const { data: sectionConfig } = await supabase.from("ucm_global_analysis_sections").select("*").eq("code", section_id).is("organization_id", null).single();
    if (!sectionConfig) return new Response(JSON.stringify({ error: "Section not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load selected UCs + their analyses
    const { data: useCases } = await supabase.from("ucm_use_cases").select("*").eq("project_id", project_id).eq("is_selected", true).order("sort_order");
    const { data: analyses } = await supabase.from("ucm_analyses").select("*").eq("project_id", project_id).eq("is_current", true);

    const sector = (project as any).ucm_sectors;
    const ucSummaries = (useCases || []).map((uc: any) => {
      const ucAnalyses = (analyses || []).filter((a: any) => a.use_case_id === uc.id);
      return `## ${uc.name}\n${uc.description}\nPriorité: ${uc.priority} | Complexité: ${uc.complexity} | Impact: ${uc.impact_level}\n${ucAnalyses.map((a: any) => `### ${a.section_id} (${a.mode})\n${(a.content || "").slice(0, 500)}...`).join("\n")}`;
    }).join("\n\n");

    const prompt = `Tu es un consultant senior en transformation IA de niveau Tier 1.

ENTREPRISE : ${project.company}
SECTEUR : ${project.sector_label || sector?.label || ""}
CONTEXTE : ${project.context}
${project.immersion ? `IMMERSION : ${project.immersion}` : ""}

USE CASES SÉLECTIONNÉS ET LEURS ANALYSES :
${ucSummaries}

INSTRUCTION (${sectionConfig.title}) :
${sectionConfig.instruction}

Rédige en markdown riche et structuré.`;

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 8192,
      }),
    });

    if (!aiRes.ok) return new Response(JSON.stringify({ error: "AI call failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Get next version
    const { data: existing } = await supabase.from("ucm_global_sections").select("version").eq("project_id", project_id).eq("section_id", section_id).order("version", { ascending: false }).limit(1);
    const nextVersion = (existing?.[0]?.version || 0) + 1;

    if (nextVersion > 1) {
      await supabase.from("ucm_global_sections").update({ is_current: false }).eq("project_id", project_id).eq("section_id", section_id);
    }

    const { data: section, error: insertErr } = await supabase.from("ucm_global_sections").insert({
      project_id,
      organization_id: project.organization_id,
      section_id,
      content,
      ai_model: "gemini-2.5-pro",
      tokens_used: tokensUsed,
      version: nextVersion,
      is_current: true,
      generated_by: user.id,
    }).select().single();

    if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await svc.rpc("ucm_increment_quota", { _org_id: project.organization_id, _field: "global_generations", _tokens: tokensUsed });

    return new Response(JSON.stringify({ section }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
