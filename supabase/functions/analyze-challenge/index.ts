import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workshop_id, template_id } = await req.json();
    if (!workshop_id || !template_id) throw new Error("Missing workshop_id or template_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch template
    const { data: template } = await supabase
      .from("challenge_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    // Fetch subjects
    const { data: subjects } = await supabase
      .from("challenge_subjects")
      .select("*")
      .eq("template_id", template_id)
      .order("sort_order");

    // Fetch slots
    const subjectIds = (subjects || []).map((s: any) => s.id);
    const { data: slots } = await supabase
      .from("challenge_slots")
      .select("*")
      .in("subject_id", subjectIds)
      .order("sort_order");

    // Fetch responses
    const { data: responses } = await supabase
      .from("challenge_responses")
      .select("*")
      .eq("workshop_id", workshop_id);

    // Fetch cards referenced
    const cardIds = [...new Set((responses || []).map((r: any) => r.card_id))];
    const { data: cards } = cardIds.length > 0
      ? await supabase.from("cards").select("id, title, definition, objective, action, kpi").in("id", cardIds)
      : { data: [] };

    // Build prompt
    const cardMap = Object.fromEntries((cards || []).map((c: any) => [c.id, c]));
    
    const subjectDetails = (subjects || []).map((subj: any) => {
      const subjSlots = (slots || []).filter((s: any) => s.subject_id === subj.id);
      const slotDetails = subjSlots.map((slot: any) => {
        const slotResponses = (responses || []).filter((r: any) => r.slot_id === slot.id);
        const placedCards = slotResponses.map((r: any) => {
          const card = cardMap[r.card_id];
          return card ? `"${card.title}" (${card.definition || "pas de définition"})` : "carte inconnue";
        });
        return `  - Emplacement "${slot.label}" (${slot.slot_type}): ${placedCards.length > 0 ? placedCards.join(", ") : "VIDE"}`;
      }).join("\n");

      return `### ${subj.title}\nType: ${subj.type}\nDescription: ${subj.description || "N/A"}\n${slotDetails}`;
    }).join("\n\n");

    const prompt = `Tu es un consultant en stratégie d'entreprise. Analyse les réponses d'un atelier de diagnostic stratégique.

Template: "${template?.name}"
Description: ${template?.description || "N/A"}

## Réponses par sujet

${subjectDetails}

Analyse chaque sujet en évaluant la maturité (1=débutant à 5=expert), interprète les choix de cartes, et propose des réflexions constructives. Calcule aussi un score global.`;

    // Call AI with tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Tu es un expert en diagnostic stratégique d'entreprise. Réponds en français." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the challenge analysis results",
              parameters: {
                type: "object",
                properties: {
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        maturity: { type: "number", minimum: 1, maximum: 5 },
                        interpretation: { type: "string" },
                        reflections: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "maturity", "interpretation", "reflections"],
                      additionalProperties: false,
                    },
                  },
                  global_maturity: { type: "number", minimum: 1, maximum: 5 },
                  summary: { type: "string" },
                },
                required: ["subjects", "global_maturity", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store analysis
    const { error: insertError } = await supabase
      .from("challenge_analyses")
      .insert({
        workshop_id,
        template_id,
        analysis,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-challenge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
