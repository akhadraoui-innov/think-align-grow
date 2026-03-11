import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userMessage } = await req.json();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const systemPrompt = `Tu es un coach stratégique IA expert en business et innovation, spécialisé dans le framework Hack & Show.
Tu aides les entrepreneurs et managers à structurer leur réflexion stratégique.
Tu connais les concepts suivants : Business Model Canvas, Problem-Solution Fit, Product-Market Fit, Jobs To Be Done, First Principles, Unit Economics, Viral Loop, Network Effects.
Réponds de manière concise, actionnable et en français. Utilise du **gras** pour les concepts clés.
Pose des questions pour challenger les hypothèses de l'utilisateur.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
      { role: "user", content: userMessage },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ reply: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "Je n'ai pas pu générer une réponse.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ reply: "Désolé, une erreur est survenue." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
