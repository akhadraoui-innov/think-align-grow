import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminToolkits() {
  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Toolkits</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les toolkits et leur contenu</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Module en cours de développement — Sprint 4.</p>
        </div>
      </div>
    </AdminShell>
  );
}
