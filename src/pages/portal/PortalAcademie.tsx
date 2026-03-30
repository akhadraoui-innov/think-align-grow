
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Route, Megaphone, Briefcase, BookOpen, TrendingUp, ArrowRight, Plus, Map, BarChart3, UserCircle, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

export default function AdminAcademy() {
  const navigate = useNavigate();

  const { data: paths = [] } = useQuery({
    queryKey: ["dash-paths"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name, status, difficulty, function_id, persona_id");
      return data || [];
    },
  });

  const { data: moduleCount = 0 } = useQuery({
    queryKey: ["dash-module-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_modules").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: functions = [] } = useQuery({
    queryKey: ["dash-functions"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_functions" as any).select("id, name, department");
      return (data || []) as any[];
    },
  });

  const { data: personae = [] } = useQuery({
    queryKey: ["dash-personae"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_personae").select("id, name");
      return data || [];
    },
  });

  const { data: campaignCount = 0 } = useQuery({
    queryKey: ["dash-campaign-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_campaigns").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["dash-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("id, status, enrolled_at, path_id, academy_paths(name)")
        .order("enrolled_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const { data: recentProgress = [] } = useQuery({
    queryKey: ["dash-progress"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_progress")
        .select("id, status, completed_at, academy_modules(title)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Stats
  const enrollmentCount = enrollments.length;
  const completedCount = enrollments.filter((e: any) => e.status === "completed").length;
  const completionRate = enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0;

  // Difficulty chart data
  const diffData = [
    { name: "Débutant", value: paths.filter(p => p.difficulty === "beginner").length, color: "hsl(155, 65%, 42%)" },
    { name: "Intermédiaire", value: paths.filter(p => p.difficulty === "intermediate").length, color: "hsl(38, 95%, 50%)" },
    { name: "Avancé", value: paths.filter(p => p.difficulty === "advanced").length, color: "hsl(350, 85%, 52%)" },
  ];

  // Coverage heatmap
  const coverageMatrix = functions.slice(0, 8).map((f: any) => {
    const row: Record<string, any> = { name: f.name };
    personae.slice(0, 6).forEach((p: any) => {
      row[p.id] = paths.filter(path => path.function_id === f.id && path.persona_id === p.id).length;
    });
    return row;
  });

  const stats = [
    { label: "Parcours", value: `${paths.length}`, icon: Route, gradient: "from-violet-500 to-blue-500" },
    { label: "Modules", value: `${moduleCount}`, icon: BookOpen, gradient: "from-blue-500 to-cyan-500" },
    { label: "Fonctions", value: `${functions.length}`, icon: Briefcase, gradient: "from-emerald-500 to-teal-500" },
    { label: "Personae", value: `${personae.length}`, icon: UserCircle, gradient: "from-amber-500 to-orange-500" },
    { label: "Campagnes", value: `${campaignCount}`, icon: Megaphone, gradient: "from-rose-500 to-pink-500" },
    { label: "Complétion", value: `${completionRate}%`, icon: TrendingUp, gradient: "from-indigo-500 to-purple-500" },
  ];

  const quickLinks = [
    { label: "Cartographie", desc: "Vue relationnelle", icon: Map, path: "/portal/academie/map" },
    { label: "Fonctions", desc: `${functions.length} rôles`, icon: Briefcase, path: "/portal/academie/functions" },
    { label: "Personae", desc: `${personae.length} profils`, icon: UserCircle, path: "/portal/academie/personae" },
    { label: "Parcours", desc: `${paths.length} formations`, icon: Route, path: "/portal/academie/paths" },
    { label: "Campagnes", desc: "Déploiements", icon: Megaphone, path: "/portal/academie/campaigns" },
    { label: "Suivi", desc: "Apprenants", icon: BarChart3, path: "/portal/academie/tracking" },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-accent/5 to-transparent border p-6">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold tracking-tight">Academy</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Plateforme de formation IA — Vue d'ensemble</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/portal/academie/map")} className="gap-2">
                <Map className="h-4 w-4" /> Cartographie
              </Button>
              <Button size="sm" onClick={() => navigate("/portal/academie/paths")} className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau parcours
              </Button>
            </div>
          </div>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="group hover:shadow-md transition-all overflow-hidden border-transparent hover:border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm text-white", s.gradient)}>
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <AnimatedCounter value={s.value} label={s.label} className="text-left [&>div:first-child]:text-xl [&>div:last-child]:text-left" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts + Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Difficulty chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Parcours par difficulté
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={diffData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-card)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                    {diffData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coverage Heatmap */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                Couverture Fonctions × Personae
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {functions.length > 0 && personae.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="text-left p-1.5 font-medium text-muted-foreground">Fonction</th>
                        {personae.slice(0, 6).map((p: any) => (
                          <th key={p.id} className="p-1.5 text-center font-medium text-muted-foreground max-w-[70px] truncate">{p.name.split(" ").slice(0, 2).join(" ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coverageMatrix.map((row, i) => (
                        <tr key={i}>
                          <td className="p-1.5 font-medium truncate max-w-[100px]">{row.name.length > 20 ? row.name.slice(0, 20) + "…" : row.name}</td>
                          {personae.slice(0, 6).map((p: any) => {
                            const v = row[p.id] || 0;
                            return (
                              <td key={p.id} className="p-1">
                                <div className={cn(
                                  "w-6 h-6 mx-auto rounded flex items-center justify-center text-[9px] font-bold transition-colors",
                                  v > 0 ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground/30"
                                )}>
                                  {v > 0 ? v : "—"}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Créez des fonctions et personae pour voir la couverture</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Navigation */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest">Accès rapide</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {quickLinks.map(ql => (
                <button
                  key={ql.path}
                  className="group flex items-center gap-3 p-3.5 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all text-left"
                  onClick={() => navigate(ql.path)}
                >
                  <ql.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{ql.label}</p>
                    <p className="text-[10px] text-muted-foreground">{ql.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h2 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest">Activité récente</h2>
            <Card>
              <CardContent className="p-4">
                {enrollments.length === 0 && recentProgress.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Aucune activité</p>
                ) : (
                  <div className="relative space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                    {enrollments.slice(0, 4).map((e: any, i: number) => (
                      <div key={e.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                        <div className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-200">
                          <Users className="h-2.5 w-2.5 text-blue-600" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-xs leading-tight">Inscription — <span className="font-semibold">{(e as any).academy_paths?.name || "parcours"}</span></p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(e.enrolled_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    ))}
                    {recentProgress.slice(0, 3).map((p: any) => (
                      <div key={p.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                        <div className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-200">
                          <BookOpen className="h-2.5 w-2.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-xs leading-tight">Module complété — <span className="font-semibold">{(p as any).academy_modules?.title || "module"}</span></p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{p.completed_at ? new Date(p.completed_at).toLocaleDateString("fr-FR") : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
