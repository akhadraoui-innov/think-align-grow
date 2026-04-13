import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      prospectName, segment, userCount, challenges, saleModel, roles,
      setupFees, servicesOneShot, servicesRecurring, engagement, totals,
      activeModules, mainChannels,
    } = body;

    if (!prospectName || !segment) {
      return new Response(JSON.stringify({ error: "prospectName et segment sont requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const engagementYears = Math.ceil((engagement || 12) / 12);
    const multiYear = engagementYears > 1;

    const systemPrompt = `Tu es un expert en revenue management, sales engineering et conseil stratégique SaaS B2B.
Tu génères des propositions commerciales professionnelles en markdown structuré.
Ton style est corporate, précis, orienté valeur client et ROI.
Tu adaptes le discours au segment client et au modèle de vente choisi.
Tu justifies chaque ligne de prix par la valeur apportée.

RÈGLES DE CALCUL STRICTES :
- Les "prestations one-shot" (setup, workshops, audits, bootcamps) sont facturées UNE SEULE FOIS en Année 1.
- Les "prestations récurrentes mensuelles" (accompagnement, support) sont facturées CHAQUE MOIS pendant la durée du contrat.
- L'ARR (Annual Recurring Revenue) = MRR × 12 — c'est l'abonnement SaaS uniquement.
- Année 1 = ARR + Setup fees + Services one-shot + (Services mensuels × 12)
- Année 2 (si applicable) = ARR + (Services mensuels × 12) — PAS de setup ni de one-shot
- Année 3 (si applicable) = ARR + (Services mensuels × 12)
- Total contrat = somme de toutes les années

Tu DOIS inclure un TABLEAU D'INVESTISSEMENT structuré avec ces colonnes : Poste | Type | Montant.
${multiYear ? `Le contrat étant sur ${engagementYears} ans, tu DOIS afficher un détail par année (Année 1, Année 2${engagementYears >= 3 ? ", Année 3" : ""}) avec le total de chaque année et le total global du contrat.` : ""}`;

    const userPrompt = `Génère une proposition commerciale complète pour :

**Prospect** : ${prospectName}
**Segment** : ${segment}
**Nombre d'utilisateurs** : ${userCount || "Non précisé"}
**Enjeux** : ${challenges || "Non précisé"}
**Modèle de vente** : ${saleModel?.label || "Non précisé"} — ${saleModel?.description || ""}

**Composition par rôle** :
${(roles || []).map((r: any) => `- ${r.roleName} (${r.planName}) : ${r.count} users × ${r.price}€/${r.billing}`).join("\n") || "Non configuré"}

**Setup fees (one-shot Année 1 uniquement)** :
${(setupFees || []).map((s: any) => `- ${s.name} : ${s.minPrice}-${s.maxPrice}€`).join("\n") || "Aucun"}

**Services one-shot (facturés une seule fois en Année 1)** :
${(servicesOneShot || []).map((s: any) => `- ${s.name} (${s.priceModel}) : ${s.priceRange}`).join("\n") || "Aucun"}

**Services récurrents mensuels (facturés chaque mois pendant toute la durée)** :
${(servicesRecurring || []).map((s: any) => `- ${s.name} : ${s.priceRange}`).join("\n") || "Aucun"}

**Engagement** : ${engagement || 12} mois (${engagementYears} an${engagementYears > 1 ? "s" : ""})

**Modules actifs** : ${(activeModules || []).join(", ") || "Tous"}

**Canaux principaux** : ${(mainChannels || []).map((c: any) => `${c.name} (${c.share}%)`).join(", ") || "Non précisé"}

**Totaux calculés (à utiliser comme référence pour tes calculs)** :
- MRR : ${totals?.mrr || 0}€
- ARR : ${totals?.arr || 0}€
- Setup one-shot : ${totals?.setup || 0}€
- Services one-shot : ${totals?.servicesOneShot || 0}€
- Services mensuels : ${totals?.servicesMonthly || 0}€/mois
- Total Année 1 : ${totals?.year1 || 0}€
${multiYear ? `- Total Année 2 : ${totals?.year2 || 0}€` : ""}
${engagementYears >= 3 ? `- Total Année 3 : ${totals?.year3 || 0}€` : ""}
- Total contrat (${engagementYears} an${engagementYears > 1 ? "s" : ""}) : ${totals?.totalContract || totals?.year1 || 0}€

Structure la proposition avec :
1. **Executive Summary** personnalisé (3-4 phrases)
2. **Proposition de valeur** adaptée au segment et aux enjeux
3. **Détail de l'offre** (modules, rôles, accès)
4. **Tableau d'investissement** structuré avec distinction one-shot vs récurrent${multiYear ? " et détail par année" : ""}
5. **ROI estimé** (qualitatif et quantitatif)
6. **Conditions & prochaines étapes**`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const quote = data.choices?.[0]?.message?.content || "Erreur de génération";

    return new Response(JSON.stringify({ quote }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("business-quote error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
