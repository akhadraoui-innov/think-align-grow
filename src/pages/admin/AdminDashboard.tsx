import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Building2, Users, Presentation, Coins, Loader2, AlertTriangle, TrendingUp, Trophy, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

function StatsCard({ icon: Icon, label, value, color, trend }: { icon: any; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">
            <TrendingUp className="h-3 w-3" /> {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  // Top users by XP
  const { data: topUsers } = useQuery({
    queryKey: ["admin-top-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, job_title")
        .order("xp", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Expiring subscriptions (within 30 days)
  const { data: expiringSubscriptions } = useQuery({
    queryKey: ["admin-expiring-subs"],
    queryFn: async () => {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      const { data } = await supabase
        .from("organization_subscriptions")
        .select("id, status, expires_at, organizations(name), subscription_plans(name)")
        .eq("status", "active")
        .not("expires_at", "is", null)
        .lte("expires_at", thirtyDaysLater.toISOString())
        .order("expires_at", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  // Monthly user growth (last 6 months)
  const { data: userGrowth } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });
      if (!data) return [];
      const months: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = format(d, "MMM yy", { locale: fr });
        months[key] = 0;
      }
      data.forEach(p => {
        const key = format(new Date(p.created_at), "MMM yy", { locale: fr });
        if (key in months) months[key]++;
      });
      let cumulative = data.filter(p => {
        const d = new Date(p.created_at);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return d < sixMonthsAgo;
      }).length;
      return Object.entries(months).map(([month, count]) => {
        cumulative += count;
        return { month, nouveaux: count, total: cumulative };
      });
    },
  });

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
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard icon={Building2} label="Organisations" value={stats?.orgCount ?? 0} color="bg-primary/10 text-primary" />
              <StatsCard icon={Users} label="Utilisateurs" value={stats?.userCount ?? 0} color="bg-accent/10 text-accent" />
              <StatsCard icon={Presentation} label="Workshops ce mois" value={stats?.workshopCountThisMonth ?? 0} color="bg-pillar-finance/10 text-pillar-finance" />
              <StatsCard icon={Coins} label="Crédits consommés" value={stats?.creditsConsumed ?? 0} color="bg-pillar-impact/10 text-pillar-impact" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly sessions */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Sessions par semaine</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.weeklyWorkshops || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 12 }} />
                      <Bar dataKey="count" name="Sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User growth */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Croissance utilisateurs</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 12 }} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Bar dataKey="nouveaux" name="Nouveaux" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom row: Top users + Alerts + Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Top users */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-pillar-impact" />
                  <h2 className="text-lg font-semibold text-foreground">Top utilisateurs</h2>
                </div>
                {topUsers && topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {topUsers.map((u, i) => (
                      <div key={u.user_id} className="flex items-center gap-3">
                        <span className="font-display font-bold text-lg text-muted-foreground/40 w-6">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{u.display_name || "—"}</p>
                          {u.job_title && <p className="text-[10px] text-muted-foreground truncate">{u.job_title}</p>}
                        </div>
                        <span className="text-sm font-bold text-primary">{u.xp} XP</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
                )}
              </div>

              {/* Alerts */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-foreground">Alertes</h2>
                </div>
                {expiringSubscriptions && expiringSubscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {expiringSubscriptions.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{sub.organizations?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{sub.subscription_plans?.name}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          {sub.expires_at ? format(new Date(sub.expires_at), "dd MMM", { locale: fr }) : "—"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
                )}
              </div>

              {/* Recent activity */}
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Activité récente</h2>
                {stats?.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
                ) : (
                  <div className="space-y-3">
                    {stats?.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="font-medium text-foreground text-xs">{log.action}</span>
                          {log.entity_type && <span className="text-muted-foreground text-[10px]">· {log.entity_type}</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
