import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PathEnrollmentsTabProps {
  enrollments: any[];
  progress: any[];
  moduleIds: string[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "En cours", variant: "secondary" },
  completed: { label: "Terminé", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
};

export function PathEnrollmentsTab({ enrollments, progress, moduleIds }: PathEnrollmentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Inscriptions</h2>
        <Badge variant="outline" className="text-xs">{enrollments.length} inscrit{enrollments.length !== 1 ? "s" : ""}</Badge>
      </div>
      {enrollments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/50 p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Aucune inscription</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Les inscriptions apparaîtront ici lorsque des utilisateurs rejoindront ce parcours.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Utilisateur</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Inscrit le</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Progression</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Complété le</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e: any) => {
                  const profile = e.profile;
                  const userProgress = progress.filter((p: any) => p.enrollment_id === e.id);
                  const completedModules = userProgress.filter((p: any) => p.status === "completed").length;
                  const totalModules = moduleIds.length;
                  const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
                  const sc = statusConfig[e.status] || statusConfig.active;

                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(profile?.display_name || profile?.email || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{profile?.display_name || "Utilisateur"}</p>
                            {profile?.email && (
                              <p className="text-[10px] text-muted-foreground">{profile.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{format(new Date(e.enrolled_at), "dd MMM yyyy", { locale: fr })}</td>
                      <td className="p-3">
                        <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={progressPct} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{completedModules}/{totalModules}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{e.completed_at ? format(new Date(e.completed_at), "dd MMM yyyy", { locale: fr }) : "—"}</td>
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
