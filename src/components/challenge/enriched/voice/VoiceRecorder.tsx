import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Trash2, Send, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CreateArtifactInput } from "@/hooks/useChallengeArtifacts";

interface Props {
  sessionId: string;
  onCreate: (input: CreateArtifactInput) => Promise<any>;
  defaultSubjectId?: string | null;
}

export function VoiceRecorder({ sessionId, onCreate, defaultSubjectId }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [anon, setAnon] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startRef = useRef<number>(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b);
        setDuration(Math.round((Date.now() - startRef.current) / 1000));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      startRef.current = Date.now();
      setRecording(true);
    } catch (e) {
      console.error(e);
      toast.error("Micro inaccessible");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const reset = () => { setBlob(null); setDuration(0); };

  const send = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const path = `${sessionId}/${u.user!.id}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("challenge-media").upload(path, blob, {
        contentType: "audio/webm", upsert: false,
      });
      if (upErr) throw upErr;

      const created = await onCreate({
        kind: "voice",
        audio_url: path,
        audio_duration_ms: duration * 1000,
        subject_id: defaultSubjectId ?? null,
        content: "(transcription en cours…)",
        is_anonymous: anon,
      });
      if (!created) throw new Error("create_failed");

      supabase.functions.invoke("challenge-transcribe", {
        body: { artifact_id: created.id, storage_path: path },
      }).then(({ error }) => { if (error) toast.error("Transcription échouée"); });

      toast.success("Mémo vocal envoyé");
      reset();
    } catch (e: any) {
      console.error(e);
      toast.error("Envoi impossible");
    } finally { setBusy(false); }
  };

  if (blob) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Mic className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold">Mémo prêt</span>
          <span className="text-muted-foreground">{duration}s</span>
        </div>
        <audio src={URL.createObjectURL(blob)} controls className="w-full h-8" />
        <div className="flex justify-between gap-2 items-center">
          <button
            type="button"
            onClick={() => setAnon(v => !v)}
            className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", anon ? "bg-amber-500/15 text-amber-700" : "text-muted-foreground hover:bg-muted")}
          >
            <EyeOff className="h-3 w-3" /> {anon ? "Anonyme" : "Public"}
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={reset}><Trash2 className="h-3.5 w-3.5 mr-1" /> Refaire</Button>
            <Button size="sm" onClick={send} disabled={busy} className="font-bold">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant={recording ? "destructive" : "outline"}
      size="sm"
      onClick={recording ? stop : start}
      className="w-full justify-start font-bold"
    >
      {recording ? <><Square className="h-4 w-4 mr-2 animate-pulse" /> Arrêter</> : <><Mic className="h-4 w-4 mr-2" /> Mémo vocal</>}
    </Button>
  );
}
