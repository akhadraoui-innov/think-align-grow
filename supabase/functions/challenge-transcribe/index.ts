import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function getSignedAudio(path: string): Promise<Blob> {
  const resp = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/challenge-media/${path}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  const { signedURL } = await resp.json();
  const file = await fetch(`${SUPABASE_URL}/storage/v1${signedURL}`);
  return await file.blob();
}

async function patchArtifact(id: string, patch: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/challenge_artifacts?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": SERVICE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(patch),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { artifact_id, storage_path } = await req.json();
    if (!artifact_id || !storage_path) {
      return new Response(JSON.stringify({ error: "artifact_id and storage_path required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const blob = await getSignedAudio(storage_path);
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    // Use Gemini multimodal via Lovable AI Gateway for transcription
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcris fidèlement ce mémo audio en français. Renvoie uniquement la transcription, sans préambule." },
            { type: "input_audio", input_audio: { data: b64, format: "webm" } },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error:", resp.status, txt);
      await patchArtifact(artifact_id, { content: "(transcription échouée)", ai_meta: { status: "transcribe_failed" } });
      return new Response(JSON.stringify({ error: "transcription_failed", details: txt }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    await patchArtifact(artifact_id, {
      transcription: text,
      content: text,
      ai_meta: { status: "transcribed", model: "gemini-2.5-flash" },
    });

    return new Response(JSON.stringify({ ok: true, transcription: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
