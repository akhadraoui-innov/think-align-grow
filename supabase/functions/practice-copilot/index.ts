import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Action -> { systemPrompt, instruction, expectsArray, fieldHint }
const ACTIONS: Record<string, { system: string; instruction: (ctx: any) => string }> = {
  suggest_titles: {
    system: "Tu es expert en learning design. Tu rédiges des titres de simulation pédagogique percutants en français.",
    instruction: (c) => `Voici une pratique :\nTitre actuel : "${c.title}"\nMode : ${c.practice_type}\nScénario : ${c.scenario?.slice(0, 500) ?? ""}\n\nPropose 5 titres alternatifs accrocheurs et professionnels. Réponds en JSON : { "titles": ["...", "...", "...", "...", "..."] }`,
  },
  improve_scenario: {
    system: "Tu es expert scénariste de business cases et de simulations professionnelles.",
    instruction: (c) => `Améliore ce brief de simulation. Renforce le réalisme, les enjeux, les contraintes chiffrées, les personae. Garde la même intention pédagogique.\n\nBrief actuel :\n${c.scenario}\n\nRéponds en JSON : { "scenario": "<markdown amélioré>" }`,
  },
  generate_objectives: {
    system: "Tu es expert en pédagogie active et taxonomie de Bloom.",
    instruction: (c) => `Génère 3 objectifs SMART pour cette simulation :\nTitre : ${c.title}\nMode : ${c.practice_type}\nScénario : ${c.scenario?.slice(0, 800) ?? ""}\n\nChaque objectif doit être Spécifique, Mesurable, Atteignable, Réaliste, Temporellement défini. Réponds en JSON : { "objectives": [{ "text": "...", "weight": 33 }, ...] }`,
  },
  reinforce_prompt: {
    system: "Tu es expert en prompt engineering pour LLM, spécialisé dans les simulations pédagogiques.",
    instruction: (c) => `Renforce ce system prompt pour une simulation. Améliore : posture, ton, persona IA, mécaniques, garde-fous implicites. Garde l'intention.\n\nPrompt actuel :\n${c.system_prompt}\n\nRéponds en JSON : { "system_prompt": "<prompt enrichi>" }`,
  },
  generate_guardrails: {
    system: "Tu es expert en sécurité et éthique IA pour la formation.",
    instruction: (c) => `Génère 5 garde-fous (interdictions strictes) pertinents pour cette simulation :\nTitre : ${c.title}\nScénario : ${c.scenario?.slice(0, 500) ?? ""}\n\nRéponds en JSON : { "guardrails": ["...", "...", "...", "...", "..."] }`,
  },
  generate_rubric: {
    system: "Tu es expert en évaluation de compétences et rubriques pondérées.",
    instruction: (c) => `Génère une rubric de 5 dimensions pondérées (somme = 100%) adaptée à :\nTitre : ${c.title}\nObjectifs : ${JSON.stringify(c.objectives ?? [])}\nMode : ${c.practice_type}\n\nRéponds en JSON : { "evaluation_dimensions": [{ "name": "...", "weight": 20 }, ...] }`,
  },
  challenge_criteria: {
    system: "Tu es expert critique en évaluation pédagogique.",
    instruction: (c) => `Challenge ces critères d'évaluation. Identifie ce qui manque, ce qui est trop subjectif, ce qui n'est pas mesurable. Propose une version améliorée.\n\nDimensions actuelles : ${JSON.stringify(c.evaluation_dimensions ?? [])}\nObjectifs : ${JSON.stringify(c.objectives ?? [])}\n\nRéponds en JSON : { "critique": "<analyse 3-5 phrases>", "evaluation_dimensions": [{ "name": "...", "weight": 20 }, ...] }`,
  },
  generate_hints: {
    system: "Tu es coach pédagogique. Tu rédiges des indices progressifs.",
    instruction: (c) => `Génère 5 indices progressifs (du plus subtil au plus directif) pour aider l'apprenant si bloqué.\n\nTitre : ${c.title}\nScénario : ${c.scenario?.slice(0, 500) ?? ""}\nObjectifs : ${JSON.stringify(c.objectives ?? [])}\n\nRéponds en JSON : { "hints": ["...", "...", "...", "...", "..."] }`,
  },
  generate_variants: {
    system: "Tu es expert en design d'expériences A/B pour la pédagogie.",
    instruction: (c) => `Génère 2 variantes opposées de system prompt à partir de l'original. La première doit être plus DIRECTIVE, la seconde plus SOCRATIQUE.\n\nPrompt original :\n${c.system_prompt}\n\nRéponds en JSON : { "variants": [{ "variant_label": "Directif", "system_prompt": "..." }, { "variant_label": "Socratique", "system_prompt": "..." }] }`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, context } = await req.json();
    const def = ACTIONS[action];
    if (!def) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        messages: [
          { role: "system", content: def.system + "\n\nRéponds STRICTEMENT en JSON valide. Pas de markdown autour. Tout en français." },
          { role: "user", content: def.instruction(context ?? {}) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({ error: aiResp.status === 429 ? "Rate limited" : "AI credits exhausted" }), {
        status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) throw new Error(`AI gateway error: ${aiResp.status}`);

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("practice-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
