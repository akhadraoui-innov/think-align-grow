import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Analysis {
  id: string;
  analysis: any;
  created_at: string;
  template_id: string;
  workshop_id: string;
  workshops?: { id: string; name: string; status: string; created_at: string; code: string } | null;
}

interface Props {
  analyses: Analysis[];
}

export function ChallengeAnalysesTab({ analyses }: Props) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-12 text-center text-muted-foreground/60 text-sm">
        Aucune analyse générée
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((a) => {
        const analysis = typeof a.analysis === "object" ? a.analysis : {};
        const maturity = (analysis as any)?.global_maturity ?? (analysis as any)?.maturity ?? null;

        return (
          <div key={a.id} className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 flex items-center gap-3">
              <div className="flex-1">
                <span className="font-semibold text-sm text-foreground">
                  {a.workshops?.name || "Workshop"}
                </span>
                <p className="text-[11px] text-muted-foreground/60 font-mono">
                  {a.workshops?.code || a.workshop_id}
                </p>
              </div>
              {maturity !== null && (
                <Badge variant="outline" className="text-xs font-mono">
                  Maturité: {typeof maturity === "number" ? maturity.toFixed(1) : maturity}/5
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(a.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
              </span>
            </div>
            {(analysis as any)?.summary && (
              <div className="px-5 pb-3.5 border-t border-border/20 pt-2.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {(analysis as any).summary}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
