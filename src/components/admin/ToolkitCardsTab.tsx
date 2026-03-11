import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const PHASE_LABELS: Record<string, string> = {
  foundations: "Fondations",
  model: "Modèle",
  growth: "Croissance",
  execution: "Exécution",
};

interface Props {
  cards: Tables<"cards">[];
  pillars: Tables<"pillars">[];
  toolkitId: string;
  onUpdate: () => void;
}

export function ToolkitCardsTab({ cards, pillars, toolkitId, onUpdate }: Props) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const pillarMap = Object.fromEntries(pillars.map((p) => [p.id, p]));
  const grouped = pillars.map((p) => ({
    pillar: p,
    cards: cards.filter((c) => c.pillar_id === p.id),
  }));

  const handleImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-toolkit-cards", {
        body: { toolkit_id: toolkitId },
      });
      if (error) throw error;
      toast({ title: "Import terminé", description: `${data?.imported ?? 0} cartes importées` });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Erreur d'import", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-2">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importer des cartes
        </Button>
      </div>

      {grouped.map(({ pillar, cards: pillarCards }) => (
        <div key={pillar.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pillar.color || "#ccc" }} />
            <h4 className="font-medium text-sm text-foreground">{pillar.name}</h4>
            <Badge variant="outline" className="text-[10px] ml-auto">{pillarCards.length} cartes</Badge>
          </div>
          {pillarCards.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune carte</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Titre</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Phase</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Objectif</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">KPI</th>
                </tr>
              </thead>
              <tbody>
                {pillarCards.map((c) => (
                  <tr key={c.id} className="border-b border-border/20">
                    <td className="px-4 py-2 text-muted-foreground">{c.sort_order}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-foreground">{c.title}</p>
                      {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-[10px]">{PHASE_LABELS[c.phase] || c.phase}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs max-w-[200px] truncate">{c.objective || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs max-w-[150px] truncate">{c.kpi || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
          Créez d'abord des piliers pour organiser les cartes.
        </div>
      )}
    </div>
  );
}
