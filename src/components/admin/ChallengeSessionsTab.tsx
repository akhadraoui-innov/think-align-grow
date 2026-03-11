import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/DataTable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  lobby: { label: "Lobby", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Actif", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  paused: { label: "Pausé", className: "bg-primary/10 text-primary border-primary/30" },
  completed: { label: "Terminé", className: "bg-accent/50 text-foreground border-border" },
};

interface Props {
  sessions: Tables<"workshops">[];
}

export function ChallengeSessionsTab({ sessions }: Props) {
  const columns = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (row: Tables<"workshops">) => (
        <div>
          <span className="font-semibold text-sm text-foreground">{row.name}</span>
          <p className="text-[11px] text-muted-foreground/60 font-mono">{row.code}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (row: Tables<"workshops">) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.lobby;
        return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>;
      },
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row: Tables<"workshops">) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center text-muted-foreground/60 text-sm">
          Aucune session liée à ce template
        </div>
      ) : (
        <DataTable data={sessions} columns={columns} searchKey="name" searchPlaceholder="Rechercher une session..." />
      )}
    </div>
  );
}
