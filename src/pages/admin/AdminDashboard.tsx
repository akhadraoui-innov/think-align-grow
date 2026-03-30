import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminStats } from "@/hooks/useAdminStats";
import {
  Building2, Users, Presentation, Coins, Loader2, AlertTriangle,
  TrendingUp, Trophy, Clock, Layers, BookOpen, Target, Gamepad2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--pillar-business))",
  "hsl(var(--pillar-finance))", "hsl(var(--pillar-thinking))", "hsl(var(--pillar-impact))",
  "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#6366f1"
];

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
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
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, job_title").order("xp", { ascending: false }).limit(5);
      return data || [];
    },
  });

  // Expiring subscriptions
  const { data: expiringSubscriptions } = useQuery({
    queryKey: ["admin-expiring-subs"],
    queryFn: async () => {
      const d = new Date(); d.setDate(d.getDate() + 30);
      const { data } = await supabase.from("organization_subscriptions").select("id, status, expires_at, organizations(name), subscription_plans(name)").eq("status", "active").not("expires_at", "is", null).lte("expires_at", d.toISOString()).order("expires_at", { ascending: true }).limit(5);
      return data || [];
    },
  });

  // User growth
  const { data: userGrowth } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("created_at").order("created_at", { ascending: true });
      if (!data) return [];
      const months: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[format(d, "MMM yy", { locale: fr })] = 0;
      }
      data.forEach(p => {
        const key = format(new Date(p.created_at), "MMM yy", { locale: fr });
        if (key in months) months[key]++;
      });
      let cumulative = data.filter(p => new Date(p.created_at) < new Date(now.getFullYear(), now.getMonth() - 5, 1)).length;
      return Object.entries(months).map(([month, count]) => { cumulative += count; return { month, nouveaux: count, total: cumulative }; });
    },
  });

  // Low credit users
  const { data: lowCreditUsers } = useQuery({
    queryKey: ["admin-low-credits"],
    queryFn: async () => {
      const { data } = await supabase.from("user_credits").select("user_id, balance").eq("balance", 0).limit(5);
      return data || [];
    },
  });

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme GROWTHINNOV</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* 8 KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard icon={Building2} label="Organisations" value={stats?.orgCount ?? 0} color="bg-primary/10 text-primary" />
              <StatsCard icon={Users} label="Utilisateurs" value={stats?.userCount ?? 0} color="bg-accent/10 text-accent" />
              <StatsCard icon={Layers} label="Toolkits publiés" value={stats?.publishedToolkits ?? 0} color="bg-violet-500/10 text-violet-500" />
              <StatsCard icon={BookOpen} label="Cartes totales" value={stats?.totalCards ?? 0} color="bg-emerald-500/10 text-emerald-500" />
              <StatsCard icon={Presentation} label="Workshops ce mois" value={stats?.workshopCountThisMonth ?? 0} color="bg-pillar-finance/10 text-pillar-finance" />
              <StatsCard icon={Target} label="Challenges analysés" value={stats?.completedChallenges ?? 0} color="bg-orange-500/10 text-orange-500" />
              <StatsCard icon={Coins} label="Crédits consommés" value={stats?.creditsConsumed ?? 0} color="bg-pillar-impact/10 text-pillar-impact" />
              <StatsCard icon={Gamepad2} label="Quiz réalisés" value={stats?.quizCount ?? 0} color="bg-sky-500/10 text-sky-500" />
            </div>

            {/* Charts: Workshops/week + User growth + Role distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Workshops par semaine</h2>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.weeklyWorkshops || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 11 }} />
                      <Bar dataKey="count" name="Workshops" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Croissance utilisateurs</h2>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 11 }} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Répartition des rôles</h2>
                <div className="h-[180px]">
                  {stats?.roleDistribution && stats.roleDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.roleDistribution} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} label={({ role }) => role?.replace(/_/g, " ")}>
                          {stats.roleDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center pt-16">Aucun rôle attribué</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Top orgs + Alerts + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Top orgs */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Top organisations</h2>
                </div>
                {stats?.topOrgs && stats.topOrgs.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topOrgs.map((o, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-display font-bold text-lg text-muted-foreground/40 w-6">{i + 1}</span>
                        <p className="flex-1 text-sm font-medium truncate text-foreground">{o.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{o.workshopCount} workshops</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Aucune organisation avec workshops</p>}
              </div>

              {/* Alerts */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <h2 className="text-sm font-bold text-foreground">Alertes</h2>
                </div>
                <div className="space-y-3">
                  {expiringSubscriptions && expiringSubscriptions.length > 0 && expiringSubscriptions.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="font-medium text-foreground text-xs">{sub.organizations?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sub.subscription_plans?.name} — expire</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {sub.expires_at ? format(new Date(sub.expires_at), "dd MMM", { locale: fr }) : "—"}
                      </Badge>
                    </div>
                  ))}
                  {lowCreditUsers && lowCreditUsers.length > 0 && (
                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                      <p className="text-xs text-foreground"><Coins className="h-3 w-3 inline mr-1 text-muted-foreground" />{lowCreditUsers.length} utilisateur(s) à 0 crédits</p>
                    </div>
                  )}
                  {(!expiringSubscriptions || expiringSubscriptions.length === 0) && (!lowCreditUsers || lowCreditUsers.length === 0) && (
                    <p className="text-xs text-muted-foreground">Aucune alerte pour le moment.</p>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="text-sm font-bold text-foreground mb-4">Activité récente</h2>
                {stats?.recentActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune activité enregistrée.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats?.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="font-medium text-foreground text-xs">{log.action}</span>
                          {log.entity_type && <span className="text-muted-foreground text-[10px]">· {log.entity_type}</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}</span>
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
