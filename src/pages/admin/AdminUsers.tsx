import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminUsers() {
  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les utilisateurs de la plateforme</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Module en cours de développement — Sprint 3.</p>
        </div>
      </div>
    </AdminShell>
  );
}
