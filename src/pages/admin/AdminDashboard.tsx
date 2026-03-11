import { AdminShell } from "@/components/admin/AdminShell";
import { Building2, Users, Presentation, Coins } from "lucide-react";

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Building2} label="Organisations" value="—" color="bg-primary/10 text-primary" />
          <StatsCard icon={Users} label="Utilisateurs" value="—" color="bg-accent/10 text-accent" />
          <StatsCard icon={Presentation} label="Workshops ce mois" value="—" color="bg-pillar-finance/10 text-pillar-finance" />
          <StatsCard icon={Coins} label="Crédits consommés" value="—" color="bg-pillar-impact/10 text-pillar-impact" />
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activité récente</h2>
          <p className="text-sm text-muted-foreground">Aucune activité enregistrée pour le moment.</p>
        </div>
      </div>
    </AdminShell>
  );
}
