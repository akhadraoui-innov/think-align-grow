// Edge Function: email-marketing-ai
// Streaming SSE assistant for SaaS email marketing.
// Modes: compose | refine | automation_design

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

interface Body {
  mode: "compose" | "refine" | "automation_design";
  brief?: string;
  current_template?: { subject?: string; markdown?: string };
  context?: {
    organization_name?: string;
    plan?: string;
    persona?: string;
    available_events?: string[];
  };
  conversation?: { role: "user" | "assistant"; content: string }[];
}

const SYSTEM_PROMPT = `Tu es un expert email marketing SaaS B2B (GROWTHINNOV).
Tu maîtrises : copywriting persuasif éthique, RGPD, mobile-first, CTA orientés action, segmentation, A/B testing.
Tu écris en français, ton chaleureux mais pro, jamais d'emoji envahissants (1 max, optionnel).
Format de sortie : Markdown enrichi compatible avec notre renderer.
Composants disponibles :
- Titres # ## ###
- **gras** *italique* \`code\`
- Listes - item
- > Citation
- [texte](url) pour les liens
- Bouton CTA : {{button:Label|https://url}}
- Variables : {{firstName}} {{organization.name}} {{recipient.email}} (interpolées au render)
- --- pour séparateur

Toujours :
- Subject ≤ 60 caractères, accroche claire
- 1 CTA principal max (bouton)
- Mobile-first : phrases courtes, paragraphes ≤ 3 lignes
- Mention RGPD légère si transactionnel
- Pas de jargon, valeur immédiate pour le destinataire`;

function buildUserPrompt(body: Body): string {
  const ctx = body.context || {};
  const ctxStr = `Contexte : org=${ctx.organization_name ?? "global"}, plan=${ctx.plan ?? "n/a"}, persona=${ctx.persona ?? "user SaaS"}.`;

  switch (body.mode) {
    case "compose": {
      return `${ctxStr}

MODE: COMPOSE
Brief : ${body.brief || "(brief vide)"}

Génère un email marketing complet. Retourne strictement ce JSON :
\`\`\`json
{
  "subject": "string ≤ 60 chars",
  "markdown": "string (corps complet, prêt à envoyer)",
  "variables": ["firstName", "organization.name", ...],
  "rationale": "1-2 phrases expliquant les choix copywriting"
}
\`\`\``;
    }
    case "refine": {
      return `${ctxStr}

MODE: REFINE
Sujet actuel : ${body.current_template?.subject || ""}
Markdown actuel :
${body.current_template?.markdown || ""}

Brief d'amélioration : ${body.brief || "améliore globalement (ton, clarté, CTA, mobile)"}

Retourne strictement ce JSON :
\`\`\`json
{
  "subject": "nouveau sujet",
  "markdown": "nouveau corps complet",
  "diff_summary": "3 puces résumant les changements"
}
\`\`\``;
    }
    case "automation_design": {
      return `${ctxStr}

MODE: AUTOMATION_DESIGN
Événements disponibles : ${(ctx.available_events || []).join(", ") || "user.created, user.status.suspended, user.inactive_Nd, invitation.sent"}

Brief : ${body.brief || ""}

Propose une automation. Retourne strictement ce JSON :
\`\`\`json
{
  "trigger_event": "string (parmi disponibles)",
  "conditions": { "key": "value" },
  "delay_minutes": 0,
  "template_code": "string suggéré (welcome|account_suspended|login_reminder|invitation|custom)",
  "rationale": "1-2 phrases"
}
\`\`\``;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body: Body = await req.json();
    if (!body?.mode) {
      return new Response(JSON.stringify({ error: "mode is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(body.conversation || []),
      { role: "user", content: buildUserPrompt(body) },
    ];

    const aiResp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Réessayez dans quelques instants." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez du crédit dans les paramètres Lovable Cloud." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok || !aiResp.body) {
      const errTxt = await aiResp.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status} ${errTxt}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream straight through (SSE)
    return new Response(aiResp.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("[email-marketing-ai] error", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
