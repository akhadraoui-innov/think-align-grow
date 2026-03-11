import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-600 border-red-500/30",
  customer_lead: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  innovation_lead: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  performance_lead: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  product_actor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  owner: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  admin: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  member: "bg-muted text-muted-foreground border-border",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { users, isLoading } = useAdminUsers();

  const columns = [
    {
      key: "display_name",
      label: "Utilisateur",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatar_url} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {(row.display_name || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground text-sm">{row.display_name || "Sans nom"}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">{row.user_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      label: "Rôles",
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          {row.roles.map((r: string) => (
            <Badge key={r} variant="outline" className={`text-[10px] ${ROLE_COLORS[r] || ROLE_COLORS.member}`}>
              {r.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "organizations",
      label: "Organisations",
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.organizations.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          {row.organizations.slice(0, 2).map((o: any) => (
            <Badge key={o.id} variant="secondary" className="text-[10px]">{o.name}</Badge>
          ))}
          {row.organizations.length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{row.organizations.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "credit_balance",
      label: "Crédits",
      sortable: true,
      render: (row: any) => <span className="text-sm font-mono">{row.credit_balance}</span>,
    },
    {
      key: "xp",
      label: "XP",
      sortable: true,
      render: (row: any) => <span className="text-sm font-mono">{row.xp}</span>,
    },
    {
      key: "status",
      label: "Statut",
      render: (row: any) => (
        <Badge variant="outline" className={row.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs" : "text-xs"}>
          {row.status === "active" ? "Actif" : row.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Inscrit le",
      sortable: true,
      render: (row: any) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} sur la plateforme
          </p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={users}
            columns={columns}
            searchKey="display_name"
            searchPlaceholder="Rechercher un utilisateur..."
            onRowClick={(row) => navigate(`/admin/users/${row.user_id}`)}
          />
        )}
      </div>
    </AdminShell>
  );
}
