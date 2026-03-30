import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ valid: false, error: "Missing certificate ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cert, error } = await supabase
      .from("academy_certificates")
      .select("id, user_id, path_id, issued_at, certificate_data, status, revoked_at, revoked_reason, public_share_enabled")
      .eq("id", id)
      .maybeSingle();

    if (error || !cert) {
      return new Response(JSON.stringify({ valid: false, error: "Certificate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!cert.public_share_enabled) {
      return new Response(JSON.stringify({ valid: false, error: "Certificate sharing disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get path info
    const { data: path } = await supabase
      .from("academy_paths")
      .select("name, description, difficulty, estimated_hours")
      .eq("id", cert.path_id)
      .single();

    // Get holder profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, job_title")
      .eq("user_id", cert.user_id)
      .single();

    // Get org via enrollment
    let organizationName = null;
    const { data: enrollment } = await supabase
      .from("academy_enrollments")
      .select("campaign_id")
      .eq("user_id", cert.user_id)
      .eq("path_id", cert.path_id)
      .maybeSingle();

    if (enrollment?.campaign_id) {
      const { data: campaign } = await supabase
        .from("academy_campaigns")
        .select("organization_id, organizations(name)")
        .eq("id", enrollment.campaign_id)
        .maybeSingle();
      organizationName = (campaign as any)?.organizations?.name || null;
    }

    const certData = cert.certificate_data as any || {};

    return new Response(JSON.stringify({
      valid: cert.status === "active",
      revoked: cert.status === "revoked",
      revoked_at: cert.revoked_at,
      revoked_reason: cert.revoked_reason,
      certificate_id: cert.id,
      holder_name: certData.holder_name || profile?.display_name || "Apprenant",
      holder_title: profile?.job_title || null,
      path_name: path?.name || "Parcours",
      path_description: path?.description || "",
      difficulty: path?.difficulty,
      score: certData.score || 0,
      modules_completed: certData.modules_completed || 0,
      total_time_hours: certData.total_time_hours || 0,
      issued_at: cert.issued_at,
      organization_name: organizationName,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
