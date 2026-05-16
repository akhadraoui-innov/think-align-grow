import { useEffect, useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  scope: "slot" | "subject";
  scopeId: string;
  label?: string;
  canRegenerate?: boolean;
}

interface Synthesis {
  id: string;
  version: number;
  content: { markdown?: string } | string;
  generated_at: string;
}

export function ScopedSynthesisPanel({ sessionId, scope, scopeId, label, canRegenerate = true }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syn, setSyn] = useState<Synthesis | null>(null);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("challenge_syntheses")
      .select("id, version, content, generated_at")
      .eq("session_id", sessionId)
      .eq("scope", scope)
      .eq("scope_id", scopeId)
      .eq("agent", `synthesizer_${scope}`)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSyn((data as any) || null);
    setLoading(false);
  }, [sessionId, scope, scopeId]);

  useEffect(() => { if (open) void fetchLatest(); }, [open, fetchLatest]);

  const generate = async () => {
    setGenerating(true);
    try {
      const body: any = { session_id: sessionId, mode: `synthesize_${scope}` };
      body[`${scope}_id`] = scopeId;
      const { data, error } = await supabase.functions.invoke("challenge-agent", { body });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "synthesis failed");
      toast.success(`Synthèse ${scope === "slot" ? "du slot" : "du sujet"} générée (v${data.version})`);
      await fetchLatest();
    } catch (e: any) {
      toast.error("Synthèse échouée : " + (e?.message || e));
    } finally {
      setGenerating(false);
    }
  };

  const md = typeof syn?.content === "string" ? syn?.content : syn?.content?.markdown;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-7 px-2 rounded-md border border-border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
          title={`Synthèse IA ${scope === "slot" ? "du slot" : "du sujet"}`}
        >
          <Sparkles className="h-3 w-3" /> Synthèse {scope === "subject" ? "sujet" : "slot"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[440px] max-h-[70vh] overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider font-bold">
            Synthèse IA · {label || scope}
            {syn && <span className="ml-2 text-muted-foreground font-normal normal-case">v{syn.version}</span>}
          </div>
          {canRegenerate && (
            <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={generating} onClick={generate}>
              {generating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {syn ? "Régénérer" : "Générer"}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : md ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <EnrichedMarkdown content={md} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">Aucune synthèse pour le moment.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
