import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    if (practice_id === "__persona_chat__" && system_override) {
      // Ad-hoc chat mode (e.g. persona creation assistant)
      systemPrompt = system_override;
    } else {
      // Fetch practice config
      const { data: practice, error: pErr } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("id", practice_id)
        .single();
      if (pErr || !practice) throw new Error("Practice not found");
      systemPrompt = practice.system_prompt || `Tu es un coach pédagogique bienveillant et exigeant. Guide l'apprenant avec des questions pertinentes, donne du feedback constructif, et aide-le à progresser.`;
      rubric = practice.evaluation_rubric || [];
    }

    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    // If this is the last exchange, ask for evaluation
    if (evaluate && rubric.length > 0) {
      aiMessages.push({
        role: "system",
        content: `C'est le dernier échange. Évalue la performance de l'apprenant en te basant sur ces critères : ${JSON.stringify(rubric)}. 
Termine ta réponse par un bloc JSON sur une nouvelle ligne au format : 
\`\`\`evaluation
{"score": <0-100>, "feedback": "<résumé de l'évaluation>"}
\`\`\``,
      });
    } else if (evaluate) {
      aiMessages.push({
        role: "system",
        content: `C'est le dernier échange. Évalue la performance de l'apprenant. 
Termine ta réponse par un bloc JSON sur une nouvelle ligne au format : 
\`\`\`evaluation
{"score": <0-100>, "feedback": "<résumé de l'évaluation>"}
\`\`\``,
      });
    }

    // Stream from AI gateway
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

    // Forward the SSE stream directly
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
