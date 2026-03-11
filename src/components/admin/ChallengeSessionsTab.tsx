import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/DataTable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, CheckCircle2, BarChart3 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  lobby: { label: "Lobby", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Actif", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  paused: { label: "Pausé", className: "bg-primary/10 text-primary border-primary/30" },
  completed: { label: "Terminé", className: "bg-accent/50 text-foreground border-border" },
};

interface SessionWorkshop {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  organizations?: { id: string; name: string; logo_url: string | null } | null;
}

interface Props {
  sessions: SessionWorkshop[];
  participantCounts: Record<string, number>;
  responseCounts: Record<string, number>;
  analysesMap: Record<string, { maturity: number | null }>;
  totalSlots: number;
}

export function ChallengeSessionsTab({ sessions, participantCounts, responseCounts, analysesMap, totalSlots }: Props) {
  const columns = [
    {
      key: "name",
      label: "Session",
      sortable: true,
      render: (row: SessionWorkshop) => (
        <div>
          <span className="font-semibold text-sm text-foreground">{row.name}</span>
          <p className="text-[11px] text-muted-foreground/60 font-mono">{row.code}</p>
        </div>
      ),
    },
    {
      key: "organization",
      label: "Organisation",
      render: (row: SessionWorkshop) => (
        <span className="text-sm text-foreground">
          {row.organizations?.name || <span className="text-muted-foreground/50">—</span>}
        </span>
      ),
    },
    {
      key: "participants",
      label: "Participants",
      render: (row: SessionWorkshop) => {
        const count = participantCounts[row.id] || 0;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{count}</span>
          </div>
        );
      },
    },
    {
      key: "completion",
      label: "Complétude",
      render: (row: SessionWorkshop) => {
        const responses = responseCounts[row.id] || 0;
        const participants = participantCounts[row.id] || 0;
        const expected = totalSlots * participants;
        const pct = expected > 0 ? Math.round((responses / expected) * 100) : 0;
        return (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "analysis",
      label: "Analyse",
      render: (row: SessionWorkshop) => {
        const a = analysesMap[row.id];
        if (!a) return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">Non</Badge>;
        return <Badge variant="outline" className="text-[10px] bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30">Oui</Badge>;
      },
    },
    {
      key: "maturity",
      label: "Maturité",
      render: (row: SessionWorkshop) => {
        const a = analysesMap[row.id];
        if (!a || a.maturity === null) return <span className="text-xs text-muted-foreground/40">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold font-mono">{typeof a.maturity === "number" ? a.maturity.toFixed(1) : a.maturity}/5</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (row: SessionWorkshop) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.lobby;
        return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>;
      },
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row: SessionWorkshop) => (
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
