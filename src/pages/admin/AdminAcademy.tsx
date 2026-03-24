import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Route, Megaphone, Briefcase, BookOpen, TrendingUp, Clock, ArrowRight, Plus, Map, BarChart3, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function AdminAcademy() {
  const navigate = useNavigate();

  const { data: pathCount = 0 } = useQuery({
    queryKey: ["admin-academy-path-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_paths").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: personaeCount = 0 } = useQuery({
    queryKey: ["admin-academy-personae-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_personae").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: campaignCount = 0 } = useQuery({
    queryKey: ["admin-academy-campaign-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_campaigns").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: enrollmentCount = 0 } = useQuery({
    queryKey: ["admin-academy-enrollment-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_enrollments").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: functionCount = 0 } = useQuery({
    queryKey: ["admin-academy-function-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_functions" as any).select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: moduleCount = 0 } = useQuery({
    queryKey: ["admin-academy-module-count"],
    queryFn: async () => {
      const { count } = await supabase.from("academy_modules").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: recentEnrollments = [] } = useQuery({
    queryKey: ["admin-academy-recent-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("*, academy_paths(name)")
        .order("enrolled_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentProgress = [] } = useQuery({
    queryKey: ["admin-academy-recent-progress"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_progress")
        .select("*, academy_modules(title)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const completionRate = enrollmentCount > 0
    ? Math.round((recentEnrollments.filter((e: any) => e.status === "completed").length / Math.min(enrollmentCount, 5)) * 100)
    : 0;

  const stats = [
    { label: "Parcours", value: pathCount, icon: Route, color: "from-violet-500 to-blue-500" },
    { label: "Modules", value: moduleCount, icon: BookOpen, color: "from-blue-500 to-cyan-500" },
    { label: "Fonctions", value: functionCount, icon: Briefcase, color: "from-emerald-500 to-teal-500" },
    { label: "Personae", value: personaeCount, icon: UserCircle, color: "from-amber-500 to-orange-500" },
    { label: "Campagnes", value: campaignCount, icon: Megaphone, color: "from-rose-500 to-pink-500" },
    { label: "Inscrits", value: enrollmentCount, icon: Users, color: "from-indigo-500 to-purple-500" },
  ];

  const quickLinks = [
    { label: "Cartographie", desc: "Vue relationnelle", icon: Map, path: "/admin/academy/map", color: "text-violet-600" },
    { label: "Fonctions", desc: "Rôles organisationnels", icon: Briefcase, path: "/admin/academy/functions", color: "text-emerald-600" },
    { label: "Personae", desc: "Profils comportementaux", icon: UserCircle, path: "/admin/academy/personae", color: "text-amber-600" },
    { label: "Parcours", desc: "Formations", icon: Route, path: "/admin/academy/paths", color: "text-blue-600" },
    { label: "Campagnes", desc: "Déploiements", icon: Megaphone, path: "/admin/academy/campaigns", color: "text-rose-600" },
    { label: "Suivi", desc: "Progression apprenants", icon: BarChart3, path: "/admin/academy/tracking", color: "text-indigo-600" },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Academy</h1>
              <p className="text-xs text-muted-foreground">Plateforme de formation IA</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/academy/paths")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau parcours
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", s.color)}>
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Navigation */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Navigation rapide</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickLinks.map(ql => (
                <Card
                  key={ql.path}
                  className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
                  onClick={() => navigate(ql.path)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <ql.icon className={cn("h-5 w-5 shrink-0", ql.color)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{ql.label}</p>
                      <p className="text-[10px] text-muted-foreground">{ql.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Activité récente</h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                {recentEnrollments.length === 0 && recentProgress.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune activité récente</p>
                )}
                {recentEnrollments.slice(0, 3).map((e: any) => (
                  <div key={e.id} className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs">Inscription à <span className="font-semibold">{(e as any).academy_paths?.name || "parcours"}</span></p>
                      <p className="text-[10px] text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
                {recentProgress.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs">Module complété : <span className="font-semibold">{(p as any).academy_modules?.title || "module"}</span></p>
                      <p className="text-[10px] text-muted-foreground">{p.completed_at ? new Date(p.completed_at).toLocaleDateString("fr-FR") : ""}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
