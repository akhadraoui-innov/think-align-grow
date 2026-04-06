import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.98.0/cors";

// Placeholder — DOCX generation will be added in Phase 5
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  return new Response(
    JSON.stringify({ error: "Export DOCX coming soon — Phase 5" }),
    { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
