import { Badge } from "@/components/ui/badge";
import { Presentation, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  workshops: any[];
}

const statusColors: Record<string, string> = {
  lobby: "bg-pillar-business/10 text-pillar-business border-pillar-business/30",
  active: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30",
  paused: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/10 text-primary border-primary/30",
};

const statusLabels: Record<string, string> = {
  lobby: "En attente",
  active: "En cours",
  paused: "En pause",
  completed: "Terminé",
};

export function OrgWorkshopsTab({ workshops }: Props) {
  const completed = workshops.filter((w) => w.status === "completed").length;
  const active = workshops.filter((w) => w.status === "active").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{workshops.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-pillar-finance">{completed}</p>
          <p className="text-xs text-muted-foreground">Terminés</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-accent">{active}</p>
          <p className="text-xs text-muted-foreground">En cours</p>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
        {workshops.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun workshop pour cette organisation.
          </div>
        ) : (
          workshops.map((w) => (
            <div key={w.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Presentation className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Code : {w.code}</span>
                  <span>·</span>
                  <span>{format(new Date(w.created_at), "dd MMM yyyy", { locale: fr })}</span>
                  {w.session_mode && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{w.session_mode}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${statusColors[w.status] || ""}`}>
                {statusLabels[w.status] || w.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
