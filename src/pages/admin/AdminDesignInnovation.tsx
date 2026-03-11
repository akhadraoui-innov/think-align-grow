import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminDesignInnovation() {
  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Design Innovation</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les templates et sessions de diagnostic</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Module en cours de développement — Sprint 8.</p>
        </div>
      </div>
    </AdminShell>
  );
}
