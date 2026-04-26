import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { SavedViewsMenu } from "@/components/admin/SavedViewsMenu";
import { useAdminUsers, type AppRole } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useSavedViews, type SavedView } from "@/hooks/useSavedViews";
import { appendAuditLog } from "@/lib/auditClient";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, MoreHorizontal, Eye, Pause, Play, ShieldOff, ShieldPlus, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate as _u } from "react-router-dom"; // dedupe import

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

// All roles available for bulk-add (matches Database['public']['Enums']['app_role'])
const ALL_ROLES: AppRole[] = [
  "super_admin", "customer_lead", "innovation_lead", "performance_lead", "product_actor",
];

const PROTECTED_ROLES = new Set<string>(["super_admin"]);

const filterSchema = z.object({
  role: z.string().default("__all__"),
  status: z.enum(["__all__", "active", "suspended", "deleted"]).default("__all__"),
  org: z.string().default("__all__"),
  q: z.string().default(""),
});

const BUILTIN_VIEWS: SavedView[] = [
  { id: "builtin:suspended", name: "Comptes suspendus", params: "status=suspended", builtin: true, createdAt: "" },
  { id: "builtin:super_admins", name: "Super admins", params: "role=super_admin", builtin: true, createdAt: "" },
  { id: "builtin:customer_leads", name: "Customer leads actifs", params: "role=customer_lead&status=active", builtin: true, createdAt: "" },
];

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { users, isLoading, toggleStatus, addRole, removeRole } = useAdminUsers();

  const [filters, setFilters] = useUrlFilters(filterSchema);
  const { views, save, remove } = useSavedViews("users", BUILTIN_VIEWS);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "suspend" | "reactivate" | "addRole" | "removeRole";
    role?: AppRole;
    title: string;
    description: string;
    targets: string[]; // user_ids
  }>(null);
  const [working, setWorking] = useState(false);

  // ── Filtering ──
  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) for (const o of u.organizations) map.set(o.id, o.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return users.filter((u) => {
      if (filters.role !== "__all__" && !u.roles.includes(filters.role)) return false;
      if (filters.status !== "__all__" && u.status !== filters.status) return false;
      if (filters.org !== "__all__" && !u.organizations.some((o) => o.id === filters.org)) return false;
      if (q) {
        const hay = `${u.display_name ?? ""} ${u.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, filters]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.roles.forEach((r) => set.add(r)));
    return [...set].sort();
  }, [users]);

  // ── Single-row actions ──
  const handleToggleStatus = (row: any) => {
    const newStatus = row.status === "active" ? "suspended" : "active";
    toggleStatus.mutate(
      { userId: row.user_id, newStatus },
      {
        onSuccess: () =>
          toast.success(newStatus === "suspended" ? "Compte suspendu" : "Compte réactivé"),
        onError: (e: any) => toast.error(e?.message ?? "Erreur"),
      },
    );
  };

  // ── Bulk action helpers ──
  function getSelectedUsers(): typeof users {
    const ids = new Set(selectedIds);
    return filtered.filter((u) => ids.has(u.user_id));
  }

  function guardSelection(action: "suspend" | "reactivate" | "addRole" | "removeRole", role?: AppRole) {
    const targets = getSelectedUsers();
    if (targets.length === 0) {
      toast.error("Aucun utilisateur sélectionné");
      return null;
    }
    if (targets.length > 100) {
      toast.error(`Sélection limitée à 100 utilisateurs (${targets.length} sélectionnés)`);
      return null;
    }
    if (action === "suspend" || action === "reactivate") {
      const includesSelf = targets.some((u) => u.user_id === currentUser?.id);
      if (includesSelf) {
        toast.error("Vous ne pouvez pas modifier votre propre statut.");
        return null;
      }
      const includesSuper = targets.some((u) => u.roles.includes("super_admin"));
      if (includesSuper) {
        toast.error("Au moins un super_admin est sélectionné — opération refusée.");
        return null;
      }
    }
    if (action === "removeRole" && role && PROTECTED_ROLES.has(role)) {
      // Extra confirmation: removing super_admin in bulk is locked
      toast.error("Le retrait de super_admin en masse est désactivé.");
      return null;
    }
    return targets;
  }

  function openSuspend() {
    const t = guardSelection("suspend");
    if (!t) return;
    setConfirmAction({
      type: "suspend",
      title: `Suspendre ${t.length} utilisateur${t.length > 1 ? "s" : ""} ?`,
      description: "Les comptes seront immédiatement bloqués. Action réversible.",
      targets: t.map((u) => u.user_id),
    });
  }

  function openReactivate() {
    const t = guardSelection("reactivate");
    if (!t) return;
    setConfirmAction({
      type: "reactivate",
      title: `Réactiver ${t.length} compte${t.length > 1 ? "s" : ""} ?`,
      description: "Les utilisateurs pourront à nouveau se connecter immédiatement.",
      targets: t.map((u) => u.user_id),
    });
  }

  function openAddRole(role: AppRole) {
    const t = guardSelection("addRole", role);
    if (!t) return;
    setConfirmAction({
      type: "addRole",
      role,
      title: `Attribuer "${role.replace(/_/g, " ")}" à ${t.length} utilisateur${t.length > 1 ? "s" : ""} ?`,
      description: "Le rôle sera ajouté en plus des rôles existants. Action tracée dans l'audit.",
      targets: t.map((u) => u.user_id),
    });
  }

  function openRemoveRole(role: AppRole) {
    const t = guardSelection("removeRole", role);
    if (!t) return;
    setConfirmAction({
      type: "removeRole",
      role,
      title: `Retirer "${role.replace(/_/g, " ")}" de ${t.length} utilisateur${t.length > 1 ? "s" : ""} ?`,
      description: "Les utilisateurs perdront immédiatement les permissions associées.",
      targets: t.map((u) => u.user_id),
    });
  }

  async function executeConfirmed() {
    if (!confirmAction) return;
    setWorking(true);
    const { type, role, targets } = confirmAction;

    const tasks = targets.map((userId) => {
      switch (type) {
        case "suspend":
          return toggleStatus.mutateAsync({ userId, newStatus: "suspended" });
        case "reactivate":
          return toggleStatus.mutateAsync({ userId, newStatus: "active" });
        case "addRole":
          return addRole.mutateAsync({ userId, role: role! });
        case "removeRole":
          return removeRole.mutateAsync({ userId, role: role! });
      }
    });

    const results = await Promise.allSettled(tasks);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const ko = results.length - ok;

    const auditAction =
      type === "suspend" || type === "reactivate"
        ? "bulk.status_changed"
        : type === "addRole"
          ? "bulk.role_added"
          : "bulk.role_removed";

    appendAuditLog({
      action: auditAction,
      entityType: "user",
      payload: {
        type,
        role: role ?? null,
        attempted: targets.length,
        succeeded: ok,
        failed: ko,
      },
    });

    if (ko === 0) {
      toast.success(`${ok} opération${ok > 1 ? "s" : ""} effectuée${ok > 1 ? "s" : ""}`);
    } else if (ok === 0) {
      toast.error(`Échec — ${ko} erreur${ko > 1 ? "s" : ""}`);
    } else {
      toast.warning(`${ok} ok · ${ko} erreur${ko > 1 ? "s" : ""}`);
    }

    setConfirmAction(null);
    setWorking(false);
  }

  // ── Columns ──
  const columns = [
    {
      key: "display_name",
      label: "Utilisateur",
      sortable: true,
      exportValue: (row: any) => row.display_name ?? "",
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
      exportValue: (row: any) => row.email ?? "",
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.email || "—"}</span>,
    },
    {
      key: "roles",
      label: "Rôles",
      exportValue: (row: any) => row.roles,
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
      exportValue: (row: any) => row.organizations.map((o: any) => o.name),
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
      exportValue: (row: any) => row.created_at,
      render: (row: any) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}
        </span>
      ),
    },
    {
      key: "_actions",
      label: "",
      exportHide: true,
      render: (row: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/admin/users/${row.user_id}`)}>
                <Eye className="h-3.5 w-3.5 mr-2" /> Voir le détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.status === "active" ? (
                <DropdownMenuItem
                  onClick={() => handleToggleStatus(row)}
                  className="text-destructive focus:text-destructive"
                >
                  <Pause className="h-3.5 w-3.5 mr-2" /> Suspendre
                </DropdownMenuItem>
              ) : row.status === "suspended" ? (
                <DropdownMenuItem onClick={() => handleToggleStatus(row)}>
                  <Play className="h-3.5 w-3.5 mr-2" /> Réactiver
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // ── Saved views handlers ──
  function applyView(params: string) {
    const sp = new URLSearchParams(params);
    const next: Record<string, string> = {};
    for (const k of Object.keys(filterSchema.shape)) {
      next[k] = sp.get(k) ?? "";
    }
    setFilters(next as any);
  }

  function currentParamsString(): string {
    const sp = new URLSearchParams();
    if (filters.role !== "__all__") sp.set("role", filters.role);
    if (filters.status !== "__all__") sp.set("status", filters.status);
    if (filters.org !== "__all__") sp.set("org", filters.org);
    if (filters.q) sp.set("q", filters.q);
    return sp.toString();
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} / {users.length} utilisateur{users.length > 1 ? "s" : ""}
            </p>
          </div>
          <SavedViewsMenu
            views={views}
            currentParams={currentParamsString()}
            onApply={applyView}
            onSave={(name, params) => {
              save(name, params);
              toast.success(`Vue "${name}" sauvegardée`);
            }}
            onRemove={(id) => {
              remove(id);
              toast.info("Vue supprimée");
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={filters.role} onValueChange={(v) => setFilters({ role: v })}>
            <SelectTrigger className="w-[180px] text-xs"><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les rôles</SelectItem>
              {allRoles.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters({ status: v as any })}>
            <SelectTrigger className="w-[150px] text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="deleted">Supprimé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.org} onValueChange={(v) => setFilters({ org: v })}>
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
            search={filters.q}
            onSearchChange={(v) => setFilters({ q: v })}
            selectable
            getRowId={(row: any) => row.user_id}
            onSelectionChange={setSelectedIds}
            exportable
            exportFilename={`users_${new Date().toISOString().slice(0, 10)}`}
            onExport={(count) =>
              appendAuditLog({
                action: "admin.export",
                entityType: "user",
                payload: { count, filters: currentParamsString() },
              })
            }
            onRowClick={(row) => navigate(`/admin/users/${row.user_id}`)}
            bulkActions={() => (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={openSuspend}>
                  <Pause className="h-3.5 w-3.5 mr-1" /> Suspendre
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={openReactivate}>
                  <Play className="h-3.5 w-3.5 mr-1" /> Réactiver
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <ShieldPlus className="h-3.5 w-3.5 mr-1" /> Ajouter rôle
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel className="text-xs">Rôle à ajouter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_ROLES.filter((r) => !PROTECTED_ROLES.has(r)).map((r) => (
                      <DropdownMenuItem key={r} onClick={() => openAddRole(r)} className="text-xs">
                        {r.replace(/_/g, " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <ShieldOff className="h-3.5 w-3.5 mr-1" /> Retirer rôle
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel className="text-xs">Rôle à retirer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_ROLES.filter((r) => !PROTECTED_ROLES.has(r)).map((r) => (
                      <DropdownMenuItem key={r} onClick={() => openRemoveRole(r)} className="text-xs">
                        {r.replace(/_/g, " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          />
        )}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {confirmAction?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={executeConfirmed} disabled={working}>
                {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
