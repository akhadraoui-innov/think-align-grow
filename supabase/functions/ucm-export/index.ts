import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Placeholder — DOCX generation will be added in Phase 5
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  return new Response(
    JSON.stringify({ error: "Export DOCX coming soon — Phase 5" }),
    { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
