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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── JWT Authentication ──
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
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Service role client for DB queries ──
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { practice_id, messages, evaluate, system_override } = await req.json();
    if (!practice_id) throw new Error("Missing practice_id");

    let systemPrompt: string;
    let rubric: any[] = [];
    let practiceType = "conversation";
    let typeConfig: Record<string, any> = {};

    if ((practice_id === "__persona_chat__" || practice_id === "__standalone__") && system_override) {
      systemPrompt = system_override;
    } else {
      const { data: practice, error: pErr } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("id", practice_id)
        .single();
      if (pErr || !practice) throw new Error("Practice not found");
      
      practiceType = practice.practice_type || "conversation";
      typeConfig = practice.type_config || {};
      rubric = practice.evaluation_rubric || [];
      const assistanceLevel = practice.ai_assistance_level || "guided";

      // Build system prompt: behavior injection + admin custom prompt
      const behaviorInjection = BEHAVIOR_INJECTIONS[practiceType] || "";
      const adminPrompt = practice.system_prompt || `Tu es un coach pédagogique bienveillant et exigeant. Guide l'apprenant avec des questions pertinentes, donne du feedback constructif, et aide-le à progresser.`;
      
      // Inject type_config context
      const configContext = Object.keys(typeConfig).length > 0 
        ? `\n\nCONTEXTE DE CONFIGURATION :\n${JSON.stringify(typeConfig, null, 2)}`
        : "";

      // Assistance level instructions
      const assistanceInstructions: Record<string, string> = {
        autonomous: `\n\nMODE AUTONOME : Ne fournis PAS de suggestions de réponse. Pas de chips. Évalue uniquement à la fin. Feedback minimal pendant la session. L'apprenant doit trouver par lui-même.`,
        guided: `\n\nAPRÈS chaque réponse, ajoute un bloc JSON de suggestions de réponses possibles pour l'apprenant :
\`\`\`suggestions
["suggestion 1", "suggestion 2", "suggestion 3"]
\`\`\`
Les suggestions doivent être des pistes de réponse variées et pertinentes (pas les réponses complètes).`,
        intensive: `\n\nMODE COACHING INTENSIF : Après chaque réponse, fournis :
1. Un feedback immédiat sur la qualité de la réponse
2. Des conseils méthodologiques concrets
3. Un bloc de suggestions proactives :
\`\`\`suggestions
["suggestion guidée 1", "suggestion guidée 2", "suggestion guidée 3"]
\`\`\`
Si l'apprenant semble bloqué ou donne des réponses courtes, relance-le avec des questions d'approfondissement.`,
      };

      systemPrompt = [behaviorInjection, adminPrompt, configContext, assistanceInstructions[assistanceLevel] || assistanceInstructions.guided].filter(Boolean).join("\n\n---\n\n");
    }

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    if (evaluate && rubric.length > 0) {
      aiMessages.push({
        role: "system",
        content: `C'est le dernier échange. Évalue la performance de l'apprenant en te basant sur ces critères : ${JSON.stringify(rubric)}. 
Termine ta réponse par un bloc JSON sur une nouvelle ligne au format : 
\`\`\`evaluation
{"score": <0-100>, "feedback": "<résumé global>", "dimensions": [{"name": "<critère>", "score": <0-10>}, ...], "recommendations": ["<conseil 1>", "<conseil 2>", "<conseil 3>"]}
\`\`\``,
      });
    } else if (evaluate) {
      aiMessages.push({
        role: "system",
        content: `C'est le dernier échange. Évalue la performance de l'apprenant. 
Termine ta réponse par un bloc JSON sur une nouvelle ligne au format : 
\`\`\`evaluation
{"score": <0-100>, "feedback": "<résumé global>", "dimensions": [{"name": "<critère>", "score": <0-10>}, ...], "recommendations": ["<conseil 1>", "<conseil 2>", "<conseil 3>"]}
\`\`\``,
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
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
    if (!aiResp.ok) throw new Error("AI gateway error");

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("academy-practice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
