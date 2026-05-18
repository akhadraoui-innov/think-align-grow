import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BRAND = rgb(0.95, 0.42, 0.13); // GROWTHINNOV orange
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.45, 0.45, 0.45);
const PAGE_BG_ALT = rgb(0.98, 0.97, 0.95);

function clean(s: unknown, max = 1000): string {
  if (s == null) return "";
  const str = typeof s === "string" ? s : JSON.stringify(s);
  return str.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const [{ data: session }, { data: context }, { data: template }] = await Promise.all([
      supabase.from("challenge_sessions").select("*").eq("id", session_id).maybeSingle(),
      supabase.from("challenge_session_context").select("*").eq("session_id", session_id).maybeSingle(),
      // joined later
      Promise.resolve({ data: null }),
    ]);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: tpl } = await supabase.from("challenge_templates").select("id,title").eq("id", session.template_id).maybeSingle();
    const { data: subjects } = await supabase.from("challenge_subjects").select("*").eq("template_id", session.template_id).order("sort_order");
    const subjectIds = (subjects ?? []).map((s: any) => s.id);
    const [{ data: slots }, { data: artifacts }, { data: syntheses }] = await Promise.all([
      supabase.from("challenge_slots").select("*").in("subject_id", subjectIds.length ? subjectIds : ["00000000-0000-0000-0000-000000000000"]).order("sort_order"),
      supabase.from("challenge_artifacts").select("id,subject_id,slot_id,kind,content,transcription,emoji,author_id,is_anonymous,is_custom_card,card_payload,ai_meta,created_at").eq("session_id", session_id).neq("status", "deleted"),
      supabase.from("challenge_syntheses").select("scope,scope_id,content,generated_at,version,agent").eq("session_id", session_id).order("version", { ascending: false }),
    ]);

    const slotsBySubject: Record<string, any[]> = {};
    for (const s of slots ?? []) (slotsBySubject[s.subject_id] ??= []).push(s);
    const artifactsBySlot: Record<string, any[]> = {};
    const artifactsBySubject: Record<string, any[]> = {};
    for (const a of artifacts ?? []) {
      if (a.slot_id) (artifactsBySlot[a.slot_id] ??= []).push(a);
      if (a.subject_id) (artifactsBySubject[a.subject_id] ??= []).push(a);
    }
    const globalSynth = (syntheses ?? []).find((s: any) => s.scope === "global" || s.scope === "session");
    const subjectSynth: Record<string, any> = {};
    for (const s of syntheses ?? []) {
      if (s.scope === "subject" && s.scope_id && !subjectSynth[s.scope_id]) subjectSynth[s.scope_id] = s;
    }

    // Author display names
    const authorIds = Array.from(new Set((artifacts ?? []).map((a: any) => a.author_id).filter(Boolean)));
    let profiles: Record<string, string> = {};
    if (authorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", authorIds);
      for (const p of profs ?? []) profiles[p.id] = p.full_name || "Participant";
    }

    // ----- PDF build -----
    const pdf = await PDFDocument.create();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const W = 595.28; // A4
    const H = 841.89;
    const M = 48;

    // ---- Cover ----
    {
      const p = pdf.addPage([W, H]);
      p.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: BRAND });
      p.drawText("GROWTHINNOV", { x: M, y: H - 70, size: 11, font: fontBold, color: BRAND });
      p.drawText("AI ACCELERATION  ·  CHALLENGE REPORT", { x: M, y: H - 86, size: 8, font: fontRegular, color: MUTED });

      const title = clean(tpl?.title || "Challenge", 80);
      const titleLines = wrap(title, fontBold, 32, W - M * 2);
      let y = H - 200;
      for (const l of titleLines) {
        p.drawText(l, { x: M, y, size: 32, font: fontBold, color: INK });
        y -= 38;
      }

      p.drawRectangle({ x: M, y: y - 20, width: 60, height: 3, color: BRAND });
      y -= 60;

      const meta = [
        ["Statut", String(session.status)],
        ["Démarrée", session.started_at ? new Date(session.started_at).toLocaleString("fr-FR") : "—"],
        ["Clôturée", session.ended_at ? new Date(session.ended_at).toLocaleString("fr-FR") : "—"],
        ["Sujets", String((subjects ?? []).length)],
        ["Contributions", String((artifacts ?? []).length)],
      ];
      for (const [k, v] of meta) {
        p.drawText(k.toUpperCase(), { x: M, y, size: 8, font: fontBold, color: MUTED });
        p.drawText(v, { x: M + 110, y, size: 11, font: fontRegular, color: INK });
        y -= 22;
      }

      // Briefing block
      if (context) {
        y -= 20;
        p.drawText("BRIEFING", { x: M, y, size: 9, font: fontBold, color: BRAND });
        y -= 16;
        const fields: Array<[string, any]> = [
          ["Scope", context.scope],
          ["Objectifs", context.goals],
          ["Hypothèses", context.hypotheses],
          ["Contraintes", context.constraints],
        ];
        for (const [k, v] of fields) {
          if (!v) continue;
          p.drawText(k, { x: M, y, size: 9, font: fontBold, color: INK });
          y -= 14;
          for (const l of wrap(clean(v, 600), fontRegular, 10, W - M * 2)) {
            if (y < 80) break;
            p.drawText(l, { x: M, y, size: 10, font: fontRegular, color: INK });
            y -= 13;
          }
          y -= 8;
        }
      }

      p.drawText(`Généré le ${new Date().toLocaleString("fr-FR")}`, { x: M, y: 32, size: 8, font: fontItalic, color: MUTED });
    }

    // ---- One page per subject ----
    for (const subj of subjects ?? []) {
      const p = pdf.addPage([W, H]);
      p.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: BRAND });
      p.drawText(`SUJET ${(subj.sort_order ?? 0) + 1}`, { x: M, y: H - 36, size: 8, font: fontBold, color: BRAND });

      const titleLines = wrap(clean(subj.title, 120), fontBold, 18, W - M * 2);
      let y = H - 60;
      for (const l of titleLines) {
        p.drawText(l, { x: M, y, size: 18, font: fontBold, color: INK });
        y -= 22;
      }
      if (subj.description) {
        for (const l of wrap(clean(subj.description, 400), fontRegular, 10, W - M * 2)) {
          if (y < 100) break;
          p.drawText(l, { x: M, y, size: 10, font: fontRegular, color: MUTED });
          y -= 13;
        }
      }
      y -= 12;

      const subSlots = slotsBySubject[subj.id] ?? [];
      const free = artifactsBySubject[subj.id]?.filter((a: any) => !a.slot_id) ?? [];

      const renderArtifact = (a: any, x: number, yPos: number, width: number): number => {
        const txt = clean(a.content || a.transcription || a.card_payload?.title || `[${a.kind}]`, 240);
        const author = a.is_anonymous ? "Participant" : (profiles[a.author_id] || "—");
        const lines = wrap(txt, fontRegular, 9, width - 14);
        const blockH = 18 + lines.length * 11 + 12;
        p.drawRectangle({ x, y: yPos - blockH, width, height: blockH, color: PAGE_BG_ALT, borderColor: MUTED, borderWidth: 0.4 });
        p.drawText(`${a.emoji ? a.emoji + " " : ""}${a.kind.toUpperCase()}`, { x: x + 7, y: yPos - 12, size: 7, font: fontBold, color: BRAND });
        p.drawText(author, { x: x + width - 7 - fontRegular.widthOfTextAtSize(author, 7), y: yPos - 12, size: 7, font: fontRegular, color: MUTED });
        let ly = yPos - 24;
        for (const l of lines) {
          p.drawText(l, { x: x + 7, y: ly, size: 9, font: fontRegular, color: INK });
          ly -= 11;
        }
        return blockH + 6;
      };

      if (subSlots.length) {
        const cols = Math.min(2, subSlots.length);
        const colW = (W - M * 2 - 12 * (cols - 1)) / cols;
        let colY: number[] = new Array(cols).fill(y);
        let i = 0;
        for (const slot of subSlots) {
          const col = i % cols;
          const x = M + col * (colW + 12);
          if (colY[col] < 140) { i++; continue; }
          p.drawText(clean(slot.label, 60).toUpperCase(), { x, y: colY[col], size: 9, font: fontBold, color: INK });
          colY[col] -= 14;
          const arts = artifactsBySlot[slot.id] ?? [];
          if (!arts.length) {
            p.drawText("— vide", { x, y: colY[col], size: 9, font: fontItalic, color: MUTED });
            colY[col] -= 14;
          }
          for (const a of arts) {
            if (colY[col] < 100) break;
            colY[col] -= renderArtifact(a, x, colY[col], colW);
          }
          colY[col] -= 12;
          i++;
        }
        y = Math.min(...colY);
      }

      if (free.length && y > 130) {
        p.drawText("CONTRIBUTIONS LIBRES", { x: M, y, size: 9, font: fontBold, color: BRAND });
        y -= 14;
        for (const a of free) {
          if (y < 100) break;
          y -= renderArtifact(a, M, y, W - M * 2);
        }
      }

      const synth = subjectSynth[subj.id];
      if (synth && y > 120) {
        y -= 6;
        p.drawText("SYNTHÈSE IA — SUJET", { x: M, y, size: 9, font: fontBold, color: BRAND });
        y -= 14;
        const markdown = clean(typeof synth.content === "string" ? synth.content : (synth.content?.markdown || JSON.stringify(synth.content)), 1500);
        for (const l of wrap(markdown, fontRegular, 9, W - M * 2)) {
          if (y < 60) break;
          p.drawText(l, { x: M, y, size: 9, font: fontRegular, color: INK });
          y -= 12;
        }
      }

      p.drawText(`Sujet ${(subj.sort_order ?? 0) + 1} · ${clean(tpl?.title, 40)}`, { x: M, y: 24, size: 7, font: fontItalic, color: MUTED });
    }

    // ---- Global synthesis ----
    if (globalSynth) {
      const p = pdf.addPage([W, H]);
      p.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: BRAND });
      p.drawText("SYNTHÈSE IA GLOBALE", { x: M, y: H - 50, size: 22, font: fontBold, color: INK });
      p.drawRectangle({ x: M, y: H - 60, width: 60, height: 3, color: BRAND });
      let y = H - 90;
      const markdown = clean(typeof globalSynth.content === "string" ? globalSynth.content : (globalSynth.content?.markdown || JSON.stringify(globalSynth.content)), 8000);
      for (const l of wrap(markdown, fontRegular, 10, W - M * 2)) {
        if (y < 60) break;
        p.drawText(l, { x: M, y, size: 10, font: fontRegular, color: INK });
        y -= 13;
      }
    }

    const bytes = await pdf.save();
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="challenge-${session_id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[challenge-export-pdf]", e);
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
