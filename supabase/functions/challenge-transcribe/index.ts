import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function getCallerOrFail(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function isParticipantOrHost(workshopId: string, userId: string): Promise<boolean> {
  const [{ data: p }, { data: h }] = await Promise.all([
    admin.rpc("is_workshop_participant", { _workshop_id: workshopId, _user_id: userId }),
    admin.rpc("is_workshop_host", { _workshop_id: workshopId, _user_id: userId }),
  ]);
  return Boolean(p) || Boolean(h);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getCallerOrFail(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const artifact_id = body?.artifact_id as string | undefined;
    const storage_path = body?.storage_path as string | undefined;
    if (!artifact_id || !storage_path) {
      return new Response(JSON.stringify({ error: "artifact_id and storage_path required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch artifact via service role then enforce membership
    const { data: art, error: artErr } = await admin
      .from("challenge_artifacts")
      .select("id, workshop_id, session_id, audio_url, kind")
      .eq("id", artifact_id)
      .maybeSingle();
    if (artErr || !art) {
      return new Response(JSON.stringify({ error: "artifact_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!(await isParticipantOrHost(art.workshop_id, user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Download audio via service role storage API
    const { data: blob, error: dlErr } = await admin.storage.from("challenge-media").download(storage_path);
    if (dlErr || !blob) {
      return new Response(JSON.stringify({ error: "download_failed", details: dlErr?.message }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = new Uint8Array(await blob.arrayBuffer());
    if (buf.byteLength > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "audio_too_large" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let bin = "";
    for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60_000);
    let resp: Response;
    try {
      resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
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
    } finally {
      clearTimeout(timeout);
    }

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway:", resp.status, txt);
      await admin.from("challenge_artifacts").update({
        content: "(transcription échouée)",
        ai_meta: { status: "transcribe_failed", error: txt.slice(0, 200) },
      }).eq("id", artifact_id);
      return new Response(JSON.stringify({ error: "transcription_failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text = (data?.choices?.[0]?.message?.content ?? "").toString().trim();

    await admin.from("challenge_artifacts").update({
      transcription: text,
      content: text,
      embedding_input: text,
      ai_meta: { status: "transcribed", model: "gemini-2.5-flash" },
    }).eq("id", artifact_id);

    return new Response(JSON.stringify({ ok: true, transcription: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
