import { useEffect, useState } from "react";
import { Loader2, Sparkles, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Synthesis {
  id: string;
  agent: string;
  version: number;
  content: any;
  generated_at: string;
}

interface Props {
  sessionId: string;
  isHost: boolean;
  onClose: () => void;
}

export function SynthesisPanel({ sessionId, isHost, onClose }: Props) {
  const [items, setItems] = useState<Synthesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("challenge_syntheses")
      .select("*")
      .eq("session_id", sessionId)
      .order("generated_at", { ascending: false });
    setItems((data ?? []) as Synthesis[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sessionId]);

  useEffect(() => {
    const ch = supabase
      .channel(`csyn-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_syntheses", filter: `session_id=eq.${sessionId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  const generate = async () => {
    setGenerating(true);
    const { error } = await supabase.functions.invoke("challenge-synthesize", { body: { session_id: sessionId } });
    setGenerating(false);
    if (error) toast.error("Synthèse impossible");
    else toast.success("Synthèse générée");
  };

  // Group latest version per agent
  const latest: Record<string, Synthesis> = {};
  for (const s of items) {
    if (!latest[s.agent] || s.version > latest[s.agent].version) latest[s.agent] = s;
  }
  const agents = Object.values(latest);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3"><Sparkles className="h-6 w-6 text-primary" /></div>
        <div className="flex-1">
          <h3 className="font-display text-2xl font-black uppercase tracking-tight">Synthèse multi-agents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Restitution IA de la session — exécutif, points de tension, prochaines étapes.
          </p>
        </div>
        {isHost && (
          <Button onClick={generate} disabled={generating} className="font-bold">
            {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            {agents.length === 0 ? "Générer" : "Régénérer"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune synthèse pour le moment.</p>
          {isHost && <p className="text-xs text-muted-foreground mt-1">Cliquez sur « Générer » pour lancer la restitution IA.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          {agents.map(s => (
            <article key={s.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <header className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase font-bold text-[10px]">{s.agent}</Badge>
                <span className="text-[10px] text-muted-foreground">v{s.version} · {new Date(s.generated_at).toLocaleString("fr-FR")}</span>
              </header>
              <SynthesisContent content={s.content} />
            </article>
          ))}
        </div>
      )}

      {isHost && (
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Clôturer définitivement</Button>
        </div>
      )}
    </div>
  );
}

function SynthesisContent({ content }: { content: any }) {
  if (!content) return null;
  if (typeof content === "string") return <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>;
  return (
    <div className="space-y-3 text-sm">
      {content.summary && (
        <section>
          <h4 className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground mb-1">Synthèse exécutive</h4>
          <p className="whitespace-pre-wrap leading-relaxed">{content.summary}</p>
        </section>
      )}
      {Array.isArray(content.insights) && content.insights.length > 0 && (
        <section>
          <h4 className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground mb-1">Insights clés</h4>
          <ul className="list-disc pl-5 space-y-1">{content.insights.map((i: string, k: number) => <li key={k}>{i}</li>)}</ul>
        </section>
      )}
      {Array.isArray(content.tensions) && content.tensions.length > 0 && (
        <section>
          <h4 className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground mb-1">Tensions / risques</h4>
          <ul className="list-disc pl-5 space-y-1">{content.tensions.map((i: string, k: number) => <li key={k}>{i}</li>)}</ul>
        </section>
      )}
      {Array.isArray(content.actions) && content.actions.length > 0 && (
        <section>
          <h4 className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground mb-1">Actions recommandées</h4>
          <ol className="list-decimal pl-5 space-y-1">{content.actions.map((i: string, k: number) => <li key={k}>{i}</li>)}</ol>
        </section>
      )}
      {Array.isArray(content.questions) && content.questions.length > 0 && (
        <section>
          <h4 className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground mb-1">Questions ouvertes</h4>
          <ul className="list-disc pl-5 space-y-1">{content.questions.map((i: string, k: number) => <li key={k}>{i}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
