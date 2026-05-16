import { useState } from "react";
import { Loader2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sessionId: string;
}

export function ReindexButton({ sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("challenge-embed-backfill", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "backfill failed");
      const s = data.stats || {};
      toast.success(
        `Réindexé : ${s.artifacts || 0} artefacts, ${s.threads || 0} fils, ${s.briefing || 0} briefings, ${s.syntheses || 0} synthèses, ${s.interactions || 0} actions`,
      );
    } catch (e: any) {
      toast.error("Réindexation échouée : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={run}
      disabled={loading}
      className="h-7 px-2 rounded-md border border-border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
      title="Reconstruire l'index sémantique de la session"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
      Réindexer
    </button>
  );
}
