import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminWorkshops } from "@/hooks/useAdminWorkshops";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  lobby: { label: "Lobby", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "En cours", className: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30" },
  paused: { label: "En pause", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  completed: { label: "Terminé", className: "bg-primary/10 text-primary border-primary/30" },
};

export default function AdminWorkshops() {
  const { workshops, isLoading, profileMap, participantCountMap } = useAdminWorkshops();

  const columns = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (row: any) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.code}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (row: any) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.lobby;
        return <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>;
      },
    },
    {
      key: "host_id",
      label: "Animateur",
      render: (row: any) => {
        const host = profileMap[row.host_id];
        return <span className="text-sm text-muted-foreground">{host?.display_name || host?.email || "—"}</span>;
      },
    },
    {
      key: "organization",
      label: "Organisation",
      render: (row: any) => {
        const org = row.organizations;
        if (!org) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: org.primary_color || "#E8552D" }}>
              {org.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-muted-foreground">{org.name}</span>
          </div>
        );
      },
    },
    {
      key: "participants",
      label: "Participants",
      render: (row: any) => <span className="text-sm text-muted-foreground">{participantCountMap[row.id] || 0}</span>,
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Workshops</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les sessions de workshop</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={workshops}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Rechercher un workshop..."
          />
        )}
      </div>
    </AdminShell>
  );
}
