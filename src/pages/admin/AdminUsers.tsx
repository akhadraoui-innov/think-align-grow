import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { users, isLoading } = useAdminUsers();
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [orgFilter, setOrgFilter] = useState<string>("__all__");

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) for (const o of u.organizations) map.set(o.id, o.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "__all__" && !u.roles.includes(roleFilter)) return false;
      if (statusFilter !== "__all__" && u.status !== statusFilter) return false;
      if (orgFilter !== "__all__" && !u.organizations.some((o) => o.id === orgFilter)) return false;
      return true;
    });
  }, [users, roleFilter, statusFilter, orgFilter]);

  const columns = [
    {
      key: "display_name",
      label: "Utilisateur",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(row.display_name || row.email || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline(row.last_seen_at) && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{row.display_name || "Sans nom"}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{row.email || row.user_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.email || "—"}</span>,
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
      key: "status",
      label: "Statut",
      render: (row: any) => (
        <Badge variant="outline" className={
          row.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
          : row.status === "suspended" ? "bg-red-500/10 text-red-600 border-red-500/30 text-xs"
          : "text-xs"
        }>
          {row.status === "active" ? "Actif" : row.status === "suspended" ? "Suspendu" : row.status}
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

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.roles.forEach((r) => set.add(r)));
    return [...set].sort();
  }, [users]);

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} / {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] text-xs"><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les rôles</SelectItem>
              {allRoles.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-[200px] text-xs"><SelectValue placeholder="Organisation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes orgs</SelectItem>
              {orgOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            searchKey="display_name"
            searchPlaceholder="Rechercher par nom ou email..."
            onRowClick={(row) => navigate(`/admin/users/${row.user_id}`)}
          />
        )}
      </div>
    </AdminShell>
  );
}
