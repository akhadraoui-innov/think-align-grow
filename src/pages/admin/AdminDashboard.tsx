import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Building2, Users, Presentation, Coins, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
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
  const { data: stats, isLoading } = useAdminStats();

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard icon={Building2} label="Organisations" value={stats?.orgCount ?? 0} color="bg-primary/10 text-primary" />
              <StatsCard icon={Users} label="Utilisateurs" value={stats?.userCount ?? 0} color="bg-accent/10 text-accent" />
              <StatsCard icon={Presentation} label="Workshops ce mois" value={stats?.workshopCountThisMonth ?? 0} color="bg-pillar-finance/10 text-pillar-finance" />
              <StatsCard icon={Coins} label="Crédits consommés" value={stats?.creditsConsumed ?? 0} color="bg-pillar-impact/10 text-pillar-impact" />
            </div>

            {/* Weekly chart */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Sessions par semaine</h2>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weeklyWorkshops || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Activité récente</h2>
              {stats?.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {stats?.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium text-foreground">{log.action}</span>
                        {log.entity_type && (
                          <span className="text-muted-foreground">· {log.entity_type}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
