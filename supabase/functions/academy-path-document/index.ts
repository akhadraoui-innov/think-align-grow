import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { path_id, action = "generate" } = await req.json();
    if (!path_id) throw new Error("path_id required");

    // Check existing document
    const { data: path } = await supabase.from("academy_paths")
      .select("*, academy_functions!academy_paths_function_id_fkey(name), academy_personae!academy_paths_persona_id_fkey(name)")
      .eq("id", path_id).single();
    if (!path) throw new Error("Path not found");

    if (action === "get" && path.guide_document) {
      return new Response(JSON.stringify({ document: path.guide_document }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch modules
    const { data: modules } = await supabase.from("academy_path_modules")
      .select("sort_order, academy_modules(title, description, objectives, module_type, estimated_minutes)")
      .eq("path_id", path_id).order("sort_order");

    const modulesInfo = (modules || []).map((m: any, i: number) => ({
      order: i + 1,
      title: m.academy_modules?.title,
      type: m.academy_modules?.module_type,
      description: m.academy_modules?.description,
      objectives: m.academy_modules?.objectives,
      duration: m.academy_modules?.estimated_minutes,
    }));

    const systemPrompt = `Tu es un concepteur pédagogique expert. Tu rédiges des guides de formation professionnels, structurés et visuellement riches en Markdown.
Le guide doit faire 4-8 pages (environ 3000-5000 mots) et être complet, corporate et engageant.
Utilise des sections Markdown bien structurées (H1, H2, H3), des tableaux, des listes, des callouts (💡, ⚠️, 📜).
Le ton est professionnel, bienveillant et motivant.`;

    const userPrompt = `Génère un guide pédagogique complet pour le parcours de formation suivant :

**Parcours** : ${path.name}
**Description** : ${path.description}
**Niveau** : ${path.difficulty || "Intermédiaire"}
**Durée estimée** : ${path.estimated_hours || "N/A"} heures
**Fonction cible** : ${(path as any).academy_functions?.name || "Tous profils"}
**Persona** : ${(path as any).academy_personae?.name || "N/A"}

**Compétences développées** :
${JSON.stringify(path.skills || [])}

**Prérequis** :
${JSON.stringify(path.prerequisites || [])}

**Aptitudes professionnelles** :
${JSON.stringify(path.aptitudes || [])}

**Débouchés professionnels** :
${JSON.stringify(path.professional_outcomes || [])}

**Modules du parcours** :
${modulesInfo.map((m: any) => `${m.order}. ${m.title} (${m.type}) - ${m.duration || "?"} min\n   ${m.description}\n   Objectifs: ${JSON.stringify(m.objectives)}`).join("\n")}

Structure du guide attendu :
1. **Page de couverture** — Titre, sous-titre, cible, durée, niveau
2. **Présentation du parcours** — Contexte, enjeux, public cible, modalités
3. **Objectifs pédagogiques** — Compétences, aptitudes, outcomes professionnels
4. **Programme détaillé** — Chaque module avec objectifs, contenu, modalités pédagogiques
5. **Référentiel de compétences** — Tableau des skills par catégorie et niveau
6. **Modalités d'évaluation** — Quiz, exercices, pratiques IA, certification
7. **Débouchés et perspectives** — Applications professionnelles, recommandations
8. **Glossaire** — Termes clés du parcours`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 6000,
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      if (status === 429) throw new Error("Rate limit exceeded");
      if (status === 402) throw new Error("Payment required");
      throw new Error(`AI call failed: ${status}`);
    }

    const aiData = await resp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Persist to path
    const guideDoc = {
      content,
      generated_at: new Date().toISOString(),
      version: 1,
      modules_count: modulesInfo.length,
    };

    await supabase.from("academy_paths").update({ guide_document: guideDoc as any }).eq("id", path_id);

    return new Response(JSON.stringify({ document: guideDoc }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("academy-path-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof Error && e.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
