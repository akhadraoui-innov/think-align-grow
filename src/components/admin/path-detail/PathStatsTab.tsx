import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, CheckCircle2, Percent, Timer } from "lucide-react";
import { moduleTypeConfig } from "./PathModulesTab";

interface PathStatsTabProps {
  enrollments: any[];
  enrollmentCount: number;
  pathModules: any[];
  progress: any[];
}

export function PathStatsTab({ enrollments, enrollmentCount, pathModules, progress }: PathStatsTabProps) {
  const completedProgress = progress.filter((p: any) => p.status === "completed");
  const completionRate = enrollmentCount > 0 ? Math.round((enrollments.filter((e: any) => e.status === "completed").length / enrollmentCount) * 100) : 0;
  const inProgressCount = enrollments.filter((e: any) => e.status === "active").length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === "completed").length;
  const publishedModules = pathModules.filter((pm: any) => pm.academy_modules?.status === "published").length;
  const avgTimeMin = completedProgress.length > 0
    ? Math.round(completedProgress.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) / completedProgress.length / 60)
    : 0;

  const getModuleProgress = (moduleId: string) => progress.filter((p: any) => p.module_id === moduleId);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Inscrits", value: enrollmentCount, color: "text-primary" },
          { icon: TrendingUp, label: "En cours", value: inProgressCount, color: "text-amber-600" },
          { icon: CheckCircle2, label: "Complétés", value: completedEnrollments, color: "text-emerald-600" },
          { icon: Percent, label: "Complétion", value: `${completionRate}%`, color: "text-primary" },
          { icon: Timer, label: "Temps moy.", value: `${avgTimeMin} min`, color: "text-muted-foreground" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border/40 bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mini funnel */}
      {enrollmentCount > 0 && (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30">
            <h3 className="font-semibold text-sm text-foreground tracking-tight">Funnel d'engagement</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Inscrits", count: enrollmentCount, pct: 100 },
              { label: "En cours", count: inProgressCount, pct: Math.round((inProgressCount / enrollmentCount) * 100) },
              { label: "Complétés", count: completedEnrollments, pct: Math.round((completedEnrollments / enrollmentCount) * 100) },
            ].map((step, i) => (
              <div key={step.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground">{step.count} ({step.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/80 transition-all" style={{ width: `${step.pct}%`, opacity: 1 - i * 0.2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module breakdown */}
      {pathModules.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground tracking-tight">Détail par module</h3>
            <Badge variant="outline" className="text-[10px]">{publishedModules}/{pathModules.length} publiés</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Module</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">En cours</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Complétés</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Score moy.</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Temps moy.</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground w-32">Progression</th>
                </tr>
              </thead>
              <tbody>
                {pathModules.map((pm: any) => {
                  const mod = pm.academy_modules;
                  if (!mod) return null;
                  const mp = getModuleProgress(mod.id);
                  const inProg = mp.filter((p: any) => p.status === "in_progress").length;
                  const mc = mp.filter((p: any) => p.status === "completed");
                  const ms = mc.length > 0 ? Math.round(mc.reduce((s: number, p: any) => s + (p.score || 0), 0) / mc.length) : 0;
                  const avgT = mc.length > 0 ? Math.round(mc.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) / mc.length / 60) : 0;
                  const modPct = enrollmentCount > 0 ? Math.round((mc.length / enrollmentCount) * 100) : 0;
                  return (
                    <tr key={pm.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <p className="text-xs font-medium">{mod.title}</p>
                        <p className="text-[10px] text-muted-foreground">{moduleTypeConfig[mod.module_type]?.label || mod.module_type}</p>
                      </td>
                      <td className="p-3 text-xs text-center">{inProg}</td>
                      <td className="p-3 text-xs text-center font-medium">{mc.length}</td>
                      <td className="p-3 text-xs text-center">{mc.length > 0 ? `${ms}%` : "—"}</td>
                      <td className="p-3 text-xs text-center">{mc.length > 0 ? `${avgT} min` : "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={modPct} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{modPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
