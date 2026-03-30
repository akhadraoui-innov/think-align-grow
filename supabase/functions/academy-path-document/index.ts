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

    const { data: path } = await supabase.from("academy_paths")
      .select("*, academy_functions!academy_paths_function_id_fkey(name), academy_personae!academy_paths_persona_id_fkey(name)")
      .eq("id", path_id).single();
    if (!path) throw new Error("Path not found");

    if (action === "get" && path.guide_document) {
      return new Response(JSON.stringify({ document: path.guide_document }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch modules with their contents
    const { data: modules } = await supabase.from("academy_path_modules")
      .select("sort_order, academy_modules(id, title, description, objectives, module_type, estimated_minutes)")
      .eq("path_id", path_id).order("sort_order");

    // Fetch all contents for all modules
    const moduleIds = (modules || []).map((m: any) => m.academy_modules?.id).filter(Boolean);
    const { data: allContents } = await supabase.from("academy_contents")
      .select("module_id, body, content_type, sort_order")
      .in("module_id", moduleIds)
      .order("sort_order");

    // Fetch quizzes and exercises
    const { data: allQuizzes } = await supabase.from("academy_quizzes")
      .select("module_id, title, description, passing_score")
      .in("module_id", moduleIds);

    const { data: allExercises } = await supabase.from("academy_exercises")
      .select("module_id, title, instructions")
      .in("module_id", moduleIds);

    const contentsByModule = new Map<string, any[]>();
    (allContents || []).forEach((c: any) => {
      const arr = contentsByModule.get(c.module_id) || [];
      arr.push(c);
      contentsByModule.set(c.module_id, arr);
    });

    const modulesInfo = (modules || []).map((m: any, i: number) => {
      const mod = m.academy_modules;
      const contents = contentsByModule.get(mod?.id) || [];
      const quizzes = (allQuizzes || []).filter((q: any) => q.module_id === mod?.id);
      const exercises = (allExercises || []).filter((e: any) => e.module_id === mod?.id);

      return {
        order: i + 1,
        title: mod?.title,
        type: mod?.module_type,
        description: mod?.description,
        objectives: mod?.objectives,
        duration: mod?.estimated_minutes,
        content: contents.map((c: any) => c.body).join("\n\n").slice(0, 6000),
        quizzes: quizzes.map((q: any) => ({ title: q.title, description: q.description })),
        exercises: exercises.map((e: any) => ({ title: e.title, instructions: e.instructions })),
      };
    });

    const systemPrompt = `Tu es un concepteur pédagogique expert de niveau international. Tu rédiges des **livrets de cours complets** (pas des fiches techniques) — le type de document qu'un formateur remet à ses apprenants comme référence permanente.

Le livret doit faire 8-15 pages (environ 6000-10000 mots), être exhaustif, documenté, illustré conceptuellement et annoté.

Règles de rédaction :
- Utilise des sections Markdown bien structurées (H1, H2, H3)
- Inclus des **tableaux comparatifs et récapitulatifs**
- Utilise des callouts pédagogiques : 💡 À retenir, 📜 Le saviez-vous ?, ⚠️ Attention, 🎯 Objectif, 🔑 Concept clé
- Ajoute des **exemples concrets et cas pratiques** pour chaque concept
- Inclus des **schémas conceptuels en texte** (diagrammes, matrices)
- Le ton est professionnel, bienveillant, corporate et motivant
- Chaque chapitre doit être autosuffisant pour la relecture
- Inclus un glossaire riche et des références`;

    const userPrompt = `Rédige le **livret de cours complet** pour le parcours de formation suivant. Ce n'est PAS un résumé ni une fiche technique — c'est le document pédagogique de référence que l'apprenant conserve.

**Parcours** : ${path.name}
**Description** : ${path.description}
**Niveau** : ${path.difficulty || "Intermédiaire"}
**Durée estimée** : ${path.estimated_hours || "N/A"} heures
**Fonction cible** : ${(path as any).academy_functions?.name || "Tous profils"}
**Persona** : ${(path as any).academy_personae?.name || "N/A"}

**Compétences développées** : ${JSON.stringify(path.skills || [])}
**Prérequis** : ${JSON.stringify(path.prerequisites || [])}
**Aptitudes professionnelles** : ${JSON.stringify(path.aptitudes || [])}
**Débouchés professionnels** : ${JSON.stringify(path.professional_outcomes || [])}

---

**CONTENU DÉTAILLÉ DES MODULES** :

${modulesInfo.map((m: any) => `
## Chapitre ${m.order} — ${m.title} (${m.type}, ${m.duration || "?"}min)

**Description** : ${m.description}
**Objectifs pédagogiques** : ${JSON.stringify(m.objectives)}

### Contenu du cours :
${m.content || "(Contenu à rédiger à partir des objectifs)"}

${m.quizzes.length > 0 ? `### Quiz associés :\n${m.quizzes.map((q: any) => `- ${q.title} : ${q.description}`).join("\n")}` : ""}
${m.exercises.length > 0 ? `### Exercices associés :\n${m.exercises.map((e: any) => `- ${e.title} : ${e.instructions?.slice(0, 200)}`).join("\n")}` : ""}
`).join("\n---\n")}

---

Structure attendue du livret :
1. **Page de couverture** — Titre, sous-titre, public cible, durée, niveau, date
2. **Avant-propos** — Contexte, enjeux du domaine, pourquoi cette formation
3. **Pour chaque module/chapitre** :
   - Introduction du chapitre avec objectifs
   - Contenu pédagogique complet et détaillé (reprendre et enrichir le contenu existant)
   - Concepts clés annotés avec 💡 callouts
   - Exemples concrets et cas d'usage professionnels
   - Points d'attention ⚠️
   - Récapitulatif du chapitre (tableau ou bullet points)
4. **Référentiel de compétences** — Tableau skills par catégorie et niveau cible
5. **Méthodologie d'évaluation** — Comment les quiz, exercices et pratiques IA évaluent
6. **Perspectives professionnelles** — Applications, débouchés, recommandations
7. **Glossaire** — Termes clés avec définitions
8. **Ressources complémentaires** — Recommandations de lectures, outils, formations avancées`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 12000,
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
