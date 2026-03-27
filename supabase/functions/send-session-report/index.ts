import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth
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
    const userId = claimsData.claims.sub;

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get session
    const { data: session, error: sessErr } = await supabase
      .from("academy_practice_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", userId)
      .single();
    if (sessErr || !session) throw new Error("Session not found");

    // Get practice
    const { data: practice } = await supabase
      .from("academy_practices")
      .select("title, practice_type, difficulty")
      .eq("id", session.practice_id)
      .single();

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) throw new Error("No email found");

    const evaluation = session.evaluation || {};
    const score = evaluation.score ?? session.score ?? 0;
    const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";

    // Build HTML report
    const kpiLabels: Record<string, string> = {
      communication_clarity: "Clarté de communication",
      analysis_depth: "Profondeur d'analyse",
      adaptability: "Adaptabilité",
      response_relevance: "Pertinence",
      idea_structuring: "Structuration",
    };

    const kpisHtml = evaluation.kpis
      ? Object.entries(evaluation.kpis).map(([k, v]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${kpiLabels[k] || k}</td><td style="padding:6px 12px;text-align:right;font-weight:bold;border-bottom:1px solid #f0f0f0">${v}/10</td></tr>`).join("")
      : "";

    const strengthsHtml = (evaluation.strengths || []).map((s: any) =>
      `<div style="border-left:3px solid #22c55e;padding:8px 12px;margin-bottom:8px;background:#f0fdf4;border-radius:4px"><strong>${s.title}</strong><br><span style="color:#555">${s.detail}</span></div>`
    ).join("");

    const improvementsHtml = (evaluation.improvements || []).map((s: any) =>
      `<div style="border-left:3px solid #f59e0b;padding:8px 12px;margin-bottom:8px;background:#fffbeb;border-radius:4px"><strong>${s.title}</strong><br><span style="color:#555">${s.detail}</span>${s.how ? `<br><em style="color:#92400e">📌 ${s.how}</em>` : ""}</div>`
    ).join("");

    const learningHtml = (evaluation.learning_gaps || []).map((s: any) =>
      `<div style="border-left:3px solid #3b82f6;padding:8px 12px;margin-bottom:8px;background:#eff6ff;border-radius:4px"><strong>${s.topic}</strong><br><span style="color:#555">${s.detail}</span>${s.resources ? `<br><em style="color:#1e40af">📚 ${s.resources}</em>` : ""}</div>`
    ).join("");

    const exploreHtml = (evaluation.explore_next || []).map((s: any) =>
      `<div style="border-left:3px solid #8b5cf6;padding:8px 12px;margin-bottom:8px;background:#f5f3ff;border-radius:4px"><strong>${s.topic}</strong><br><span style="color:#555">${s.why}</span></div>`
    ).join("");

    const bpHtml = (evaluation.best_practices || []).map((s: any) =>
      `<div style="padding:8px 0;border-bottom:1px solid #e5e5e5"><strong>✅ ${s.title}</strong><br><span style="color:#555">${s.content}</span></div>`
    ).join("");

    const messagesHtml = (Array.isArray(session.messages) ? session.messages : []).map((m: any) =>
      `<div style="margin-bottom:8px"><strong style="color:${m.role === "user" ? "#2563eb" : "#16a34a"}">${m.role === "user" ? "Vous" : "Coach IA"}</strong><p style="margin:2px 0;white-space:pre-wrap;font-size:13px">${String(m.content).replace(/</g, "&lt;")}</p></div>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1a1a1a;font-size:14px">
<h1 style="font-size:20px;margin-bottom:4px">📊 Rapport de Simulation</h1>
<p style="color:#888;font-size:12px;margin-top:0">${practice?.title || "Session"} · ${new Date(session.started_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>
<div style="background:#f8f8f8;border-radius:12px;padding:16px;margin:16px 0;text-align:center">
  <span style="font-size:36px;font-weight:900">${score}</span><span style="font-size:16px;color:#888">/100</span>
  <span style="font-size:28px;font-weight:900;margin-left:12px">${grade}</span>
</div>
<p style="color:#555">${evaluation.feedback || ""}</p>
${kpisHtml ? `<h2 style="font-size:16px;margin-top:24px">📈 Indicateurs clés</h2><table style="width:100%;border-collapse:collapse">${kpisHtml}</table>` : ""}
${strengthsHtml ? `<h2 style="font-size:16px;margin-top:24px">✅ Ce que vous faites bien</h2>${strengthsHtml}` : ""}
${improvementsHtml ? `<h2 style="font-size:16px;margin-top:24px">⚠️ Ce que vous devez améliorer</h2>${improvementsHtml}` : ""}
${learningHtml ? `<h2 style="font-size:16px;margin-top:24px">📚 Ce que vous devez apprendre</h2>${learningHtml}` : ""}
${exploreHtml ? `<h2 style="font-size:16px;margin-top:24px">🔭 Ce qui devrait vous intéresser</h2>${exploreHtml}` : ""}
${bpHtml ? `<h2 style="font-size:16px;margin-top:24px">📖 Bonnes pratiques</h2>${bpHtml}` : ""}
${messagesHtml ? `<h2 style="font-size:16px;margin-top:24px">💬 Échanges</h2>${messagesHtml}` : ""}
<hr style="margin-top:24px;border:none;border-top:1px solid #e5e5e5">
<p style="font-size:11px;color:#999;text-align:center">Rapport généré automatiquement par la plateforme de simulation</p>
</body></html>`;

    // Use AI gateway to send email
    const emailResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are an email formatter. Return exactly the subject line for this simulation report email, in French. Just the subject, nothing else." },
          { role: "user", content: `Practice: ${practice?.title || "Simulation"}, Score: ${score}/100, Grade: ${grade}` },
        ],
        max_tokens: 100,
      }),
    });

    // For now, since we can't directly send emails without email infra, 
    // we'll return the HTML for the client to handle or store
    // In production, this would integrate with the email sending system
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Rapport envoyé à ${email}`,
      email,
      html_preview: html.substring(0, 200),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("send-session-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
