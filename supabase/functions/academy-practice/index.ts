import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Behavior injection templates by practice_type ──
const BEHAVIOR_INJECTIONS: Record<string, string> = {
  conversation: "",
  prompt_challenge: `MÉCANIQUE : 1) Présente un DÉFI de prompting. 2) L'apprenant prompt. 3) Évalue sur Clarté/Complétude/Efficacité/Créativité (0-10). 4) Feedback + suggestions. 5) Retenter possible.
FORMAT : Intègre un bloc \`\`\`scoring\n{"clarity":<0-10>,"completeness":<0-10>,"efficiency":<0-10>,"creativity":<0-10>,"total":<0-40>,"attempt":<n>}\n\`\`\``,
  negotiation: `Tu joues le rôle ADVERSE avec des objectifs cachés. Adapte ta posture selon la tension (1-10). Fais des concessions progressives si bonnes techniques.
FORMAT : Intègre \`\`\`gauges\n{"tension":<1-10>,"rapport":<1-10>,"progress":<0-100>}\n\`\`\` Ne révèle JAMAIS ce bloc.`,
  pitch: `Tu es un investisseur sceptique. L'apprenant a un temps limité. Ses messages doivent être courts. Challenge les hypothèses. Note Clarté/Impact/Structure/Crédibilité.`,
  code_review: `Présente du code avec bugs/smells intentionnels. L'apprenant review. Évalue bugs trouvés et qualité des suggestions.
FORMAT : \`\`\`scoring\n{"bugs_found":"<n>/<total>","false_positives":<n>,"suggestion_quality":<0-10>}\n\`\`\``,
  debug: `Présente un BUG : symptôme, stack trace, contexte. L'apprenant diagnostique. Révèle indices progressivement selon pertinence des questions.`,
  case_study: `PHASES : 1) BRIEFING avec données chiffrées. 2) ANALYSE — challenge. 3) RECOMMANDATION. 4) DEBRIEF — révèle la réalité.`,
  decision_game: `Narrateur de scénario à embranchements. Chaque décision impacte des KPIs.
FORMAT : \`\`\`kpis\n{"budget":<0-100>,"morale":<0-100>,"risk":<0-100>,"time_remaining":<0-100>}\n\`\`\``,
  crisis: `Système d'alertes d'entreprise en crise. Envoie des événements pressants. Empile si non traités.`,
  change_management: `Simule une transformation. Joue tour à tour sponsor/manager résistant/employé/syndicat.
FORMAT : \`\`\`stakeholders\n{"supporters":<0-100>,"neutrals":<0-100>,"resistants":<0-100>,"adoption":<0-100>}\n\`\`\``,
  vibe_coding: `Évaluateur de briefs techniques. Présente un objectif fonctionnel. Score le brief sur Clarté/Complétude/Edge Cases/UX/Technique.
FORMAT : \`\`\`scoring\n{"clarity":<0-10>,"completeness":<0-10>,"edge_cases":<0-10>,"ux_thinking":<0-10>,"technical":<0-10>,"total":<0-50>}\n\`\`\``,
  sales: `Prospect réaliste avec budget, contraintes, objections. Ne dis jamais oui facilement.
FORMAT : \`\`\`funnel\n{"interest":<0-10>,"trust":<0-10>,"urgency":<0-10>,"closing_probability":<0-100>}\n\`\`\``,
  teach_back: `Apprenant DÉBUTANT curieux mais naïf. Pose des questions naïves. Évalue silencieusement clarté et pédagogie.`,
  socratic: `Défends systématiquement la position OPPOSÉE. Exige preuves et logique. Pointe les biais cognitifs.`,
  feedback_360: `Joue successivement MANAGER, PAIR, SUBORDONNÉ. Annonce chaque changement. Évalue empathie/clarté/actionabilité.`,
};

// ── Coaching posture templates ──
const COACHING_POSTURES: Record<string, string> = {
  proactive: `POSTURE COACHING — PROACTIF : Tu prends l'initiative. Anticipe les blocages. Propose des angles d'attaque avant que l'apprenant ne demande. Sois directif sans être autoritaire.`,
  guided: `POSTURE COACHING — GUIDÉ : Tu accompagnes pas à pas. Donne des suggestions claires à chaque étape. Encourage l'autonomie progressive.`,
  socratic: `POSTURE COACHING — SOCRATIQUE : Réponds presque toujours par une question. Fais émerger la réflexion. Ne donne JAMAIS la réponse directement, même si insisté. Reformule, creuse, élargis.`,
  challenger: `POSTURE COACHING — CHALLENGER : Confronte systématiquement les hypothèses. Demande des preuves chiffrées. Pointe les biais cognitifs. Sois exigeant et rigoureux mais bienveillant.`,
  silent: `POSTURE COACHING — SILENCIEUX : Ne donne AUCUN conseil pendant la session. Réponds uniquement aux questions factuelles indispensables. Réserve toute évaluation et feedback pour la restitution finale.`,
  intensive: `POSTURE COACHING — INTENSIF : Coaching dense. Feedback à chaque échange (qualité, axes d'amélioration, méthode). Relances proactives si réponses courtes. Dose les encouragements et l'exigence.`,
};

// ── UI assistance level (suggestions chips) ──
const ASSISTANCE_INSTRUCTIONS: Record<string, string> = {
  autonomous: `\n\nMODE UI AUTONOME : Ne fournis PAS de suggestions chips. Pas de bloc \`suggestions\`.`,
  guided: `\n\nAPRÈS chaque réponse, ajoute un bloc JSON de suggestions de réponses possibles pour l'apprenant :
\`\`\`suggestions
["suggestion 1", "suggestion 2", "suggestion 3"]
\`\`\`
Les suggestions doivent être des pistes de réponse variées et pertinentes (pas les réponses complètes).`,
  intensive: `\n\nMODE UI INTENSIF : Après chaque réponse, fournis :
1. Un feedback immédiat sur la qualité de la réponse
2. Des conseils méthodologiques concrets
3. Un bloc de suggestions proactives :
\`\`\`suggestions
["suggestion guidée 1", "suggestion guidée 2", "suggestion guidée 3"]
\`\`\``,
};

// ── Build the assembled system prompt for a practice ──
function buildSystemPrompt(practice: any, opts: { variantOverride?: string } = {}): string {
  const practiceType = practice.practice_type || "conversation";
  const behaviorInjection = BEHAVIOR_INJECTIONS[practiceType] || "";
  const coachingPosture = COACHING_POSTURES[practice.coaching_mode] ?? COACHING_POSTURES.guided;
  const assistanceLevel = practice.ai_assistance_level || "guided";
  const assistanceBlock = ASSISTANCE_INSTRUCTIONS[assistanceLevel] ?? ASSISTANCE_INSTRUCTIONS.guided;

  const adminPrompt = opts.variantOverride
    ?? practice.system_prompt
    ?? `Tu es un coach pédagogique bienveillant et exigeant. Guide l'apprenant avec des questions pertinentes, donne du feedback constructif, et aide-le à progresser.`;

  // Scenario block
  const scenarioBlock = practice.scenario?.trim()
    ? `\n\n=== CONTEXTE DE LA SIMULATION ===\n${practice.scenario}`
    : "";

  // Type config context
  const typeConfig = practice.type_config ?? {};
  const configContext = Object.keys(typeConfig).length > 0
    ? `\n\n=== CONFIGURATION DU MODE ===\n${JSON.stringify(typeConfig, null, 2)}`
    : "";

  // Objectives SMART
  const objectives = (practice.objectives ?? []) as Array<{ text?: string; weight?: number }>;
  const objectivesBlock = objectives.length > 0
    ? `\n\n=== OBJECTIFS PÉDAGOGIQUES (SMART) ===\nL'apprenant doit atteindre ces objectifs :\n${objectives.map((o, i) => `${i + 1}. ${o.text}${o.weight ? ` (poids ${o.weight}%)` : ""}`).join("\n")}`
    : "";

  // Success criteria
  const successCriteria = practice.success_criteria ?? {};
  const successBlock = Object.keys(successCriteria).length > 0
    ? `\n\n=== CRITÈRES DE RÉUSSITE ===\n${JSON.stringify(successCriteria, null, 2)}`
    : "";

  // Phases
  const phases = (practice.phases ?? []) as Array<{ name?: string; goal?: string }>;
  const phasesBlock = phases.length > 0
    ? `\n\n=== PHASES DU PARCOURS ===\nDéroule la session en suivant ces phases :\n${phases.map((p, i) => `Phase ${i + 1} — ${p.name} : ${p.goal}`).join("\n")}\nIndique discrètement la phase courante quand elle change.`
    : "";

  // Guardrails
  const guardrails = (practice.guardrails ?? []) as string[];
  const guardrailsBlock = guardrails.length > 0
    ? `\n\n=== GARDE-FOUS STRICTS (NON NÉGOCIABLES) ===\n${guardrails.map((g) => `- ${g}`).join("\n")}`
    : "";

  // Attached data
  const attached = (practice.attached_data ?? []) as any[];
  const attachedBlock = attached.length > 0
    ? `\n\n=== DONNÉES ATTACHÉES ===\n${JSON.stringify(attached, null, 2)}`
    : "";

  const langRule = `\n\n=== RÈGLE LINGUISTIQUE ABSOLUE ===\nTu réponds TOUJOURS intégralement en français. Jamais un mot en anglais sauf termes techniques universels (framework, sprint, KPI, etc.).`;

  return [
    behaviorInjection,
    coachingPosture,
    adminPrompt,
    scenarioBlock,
    objectivesBlock,
    successBlock,
    phasesBlock,
    configContext,
    attachedBlock,
    guardrailsBlock,
    assistanceBlock,
    langRule,
  ].filter(Boolean).join("\n\n---\n\n");
}

// ── Build evaluation block according to strategy ──
function buildEvaluationBlock(practice: any): string {
  const strategy = practice.evaluation_strategy ?? "dimensions";
  const restitution = practice.restitution_template ?? {};
  const tone = restitution.tone ?? "professional";
  const sections: string[] = restitution.sections ?? ["score", "feedback", "strengths", "improvements", "kpis", "learning_gaps", "explore_next", "best_practices"];
  const minScore = restitution.min_score ?? 70;

  const dimensions = (practice.evaluation_dimensions ?? []) as Array<{ name: string; weight?: number }>;
  const rubric = practice.evaluation_rubric ?? [];
  const weights = practice.evaluation_weights ?? {};

  const toneDirective: Record<string, string> = {
    professional: "Adopte un ton professionnel, factuel et structuré.",
    encouraging: "Adopte un ton encourageant, valorisant les progrès.",
    direct: "Sois direct, concis, sans complaisance.",
    coaching: "Adopte un ton de coach : questionnement, miroir, projection.",
  };

  let criteriaText = "";
  if (strategy === "dimensions" && dimensions.length > 0) {
    criteriaText = `STRATÉGIE : Dimensions pondérées.\nÉvalue STRICTEMENT sur ces dimensions :\n${dimensions.map(d => `- ${d.name} (poids ${d.weight ?? 0}%)`).join("\n")}\nLe score global est la moyenne pondérée des dimensions.`;
  } else if (strategy === "rubric" && rubric.length > 0) {
    criteriaText = `STRATÉGIE : Rubric discrète.\nCritères : ${JSON.stringify(rubric)}`;
  } else if (strategy === "hybrid") {
    criteriaText = `STRATÉGIE : Hybride.\nDimensions : ${JSON.stringify(dimensions)}\nRubric : ${JSON.stringify(rubric)}\nPoids : ${JSON.stringify(weights)}`;
  } else {
    criteriaText = `STRATÉGIE : Évaluation holistique IA. Évalue la performance globale en cohérence avec les objectifs et le scénario.`;
  }

  // Build the JSON template based on requested sections
  const jsonParts: string[] = [];
  if (sections.includes("score")) jsonParts.push(`  "score": <0-100>`);
  if (sections.includes("feedback")) jsonParts.push(`  "feedback": "<synthèse 3-5 phrases>"`);
  jsonParts.push(`  "passed": <true si score >= ${minScore} sinon false>`);
  if (strategy === "dimensions" || strategy === "hybrid") {
    jsonParts.push(`  "dimensions": [{"name": "<nom>", "score": <0-10>, "weight": <%>, "comment": "<bref>"}]`);
  } else {
    jsonParts.push(`  "dimensions": [{"name": "<critère>", "score": <0-10>}]`);
  }
  jsonParts.push(`  "recommendations": ["<conseil 1>", "<conseil 2>", "<conseil 3>"]`);
  if (sections.includes("kpis")) jsonParts.push(`  "kpis": {"communication_clarity": <0-10>, "analysis_depth": <0-10>, "adaptability": <0-10>, "response_relevance": <0-10>, "idea_structuring": <0-10>}`);
  if (sections.includes("strengths")) jsonParts.push(`  "strengths": [{"title": "<court>", "detail": "<exemples concrets>"}]`);
  if (sections.includes("improvements")) jsonParts.push(`  "improvements": [{"title": "<court>", "detail": "<problème>", "how": "<méthode concrète>"}]`);
  if (sections.includes("learning_gaps")) jsonParts.push(`  "learning_gaps": [{"topic": "<sujet>", "detail": "<pourquoi>", "resources": "<frameworks>"}]`);
  if (sections.includes("explore_next")) jsonParts.push(`  "explore_next": [{"topic": "<sujet connexe>", "why": "<pourquoi>"}]`);
  if (sections.includes("best_practices")) jsonParts.push(`  "best_practices": [{"title": "<titre>", "content": "<méthode + retex>"}]`);

  return `C'est le dernier échange. Évalue la performance de l'apprenant.

${criteriaText}

${toneDirective[tone] ?? toneDirective.professional}

Termine ta réponse par un bloc JSON sur une nouvelle ligne au format :
\`\`\`evaluation
{
${jsonParts.join(",\n")}
}
\`\`\`
IMPORTANT : Génère au minimum 2-3 items pour chaque liste. Sois précis, concret, utilise des exemples tirés de la conversation. Tout en FRANÇAIS.`;
}

// ── Weighted random pick for variants ──
function pickVariant(variants: any[]): any | null {
  const active = variants.filter(v => v.is_active && v.weight > 0);
  if (active.length === 0) return null;
  const total = active.reduce((s, v) => s + v.weight, 0);
  let r = Math.random() * total;
  for (const v of active) { r -= v.weight; if (r <= 0) return v; }
  return active[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { practice_id, messages, evaluate, system_override, preview_practice, session_id } = await req.json();

    let systemPrompt: string;
    let model = "google/gemini-2.5-flash";
    let temperature = 0.7;
    let maxTokens = 8192;
    let practice: any = null;
    let variantPicked: any = null;

    // ── Live preview from Studio: build full prompt from in-memory practice draft ──
    if (preview_practice) {
      practice = preview_practice;
      systemPrompt = buildSystemPrompt(practice);
      model = practice.model_override || model;
      temperature = practice.temperature_override ?? temperature;
    }
    // ── Standalone or persona chat with explicit override ──
    else if ((practice_id === "__persona_chat__" || practice_id === "__standalone__" || !practice_id) && system_override) {
      systemPrompt = system_override;
    }
    // ── Generic standalone session ──
    else if (!practice_id) {
      systemPrompt = `Tu es un coach pédagogique bienveillant et exigeant. Guide l'apprenant avec des questions pertinentes, donne du feedback constructif, et aide-le à progresser.\n\nAPRÈS chaque réponse, ajoute un bloc JSON de suggestions :\n\`\`\`suggestions\n["suggestion 1", "suggestion 2", "suggestion 3"]\n\`\`\`\n\nRÈGLE ABSOLUE : Tu réponds TOUJOURS intégralement en français.`;
    }
    // ── Real practice session ──
    else {
      const { data: pData, error: pErr } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("id", practice_id)
        .single();
      if (pErr || !pData) throw new Error("Practice not found");
      practice = pData;

      // Try to use existing variant from session metadata, else pick weighted
      const { data: variants } = await supabase
        .from("practice_variants")
        .select("*")
        .eq("practice_id", practice_id);

      if (variants && variants.length > 0) {
        let existingVariantId: string | null = null;
        if (session_id) {
          const { data: sess } = await supabase
            .from("academy_practice_sessions")
            .select("metadata")
            .eq("id", session_id)
            .maybeSingle();
          existingVariantId = (sess?.metadata as any)?.variant_id ?? null;
        }
        if (existingVariantId) {
          variantPicked = variants.find(v => v.id === existingVariantId) ?? null;
        } else {
          variantPicked = pickVariant(variants);
          // Persist variant id on the session for future calls
          if (session_id && variantPicked) {
            await supabase
              .from("academy_practice_sessions")
              .update({ metadata: { variant_id: variantPicked.id, variant_label: variantPicked.variant_label } })
              .eq("id", session_id);
          }
        }
      }

      systemPrompt = buildSystemPrompt(practice, {
        variantOverride: variantPicked?.system_prompt || undefined,
      });
      model = practice.model_override || model;
      temperature = practice.temperature_override ?? temperature;
    }

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    if (evaluate && practice) {
      aiMessages.push({ role: "system", content: buildEvaluationBlock(practice) });
    } else if (evaluate) {
      aiMessages.push({
        role: "system",
        content: `C'est le dernier échange. Évalue la performance globale de l'apprenant. Retourne un bloc \`\`\`evaluation { "score": <0-100>, "feedback": "...", "dimensions": [...], "recommendations": [...] }\`\`\``,
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: aiMessages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      throw new Error(`AI gateway error: ${aiResp.status} ${errText}`);
    }

    return new Response(aiResp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Variant-Id": variantPicked?.id ?? "",
        "X-Model-Used": model,
      },
    });
  } catch (e) {
    console.error("academy-practice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
