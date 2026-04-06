import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Briefcase, BarChart3, Zap } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";

export default function AdminUCM() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-ucm-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ucm_projects")
        .select("*, organizations(name), ucm_use_cases(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: quotaStats } = useQuery({
    queryKey: ["admin-ucm-quota-stats"],
    queryFn: async () => {
      const period = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from("ucm_quota_usage")
        .select("*")
        .eq("period", period);
      if (error) throw error;
      const totals = (data || []).reduce(
        (acc, r: any) => ({
          generations: acc.generations + (r.uc_generations || 0),
          analyses: acc.analyses + (r.analysis_generations || 0),
          tokens: acc.tokens + (r.total_tokens || 0),
        }),
        { generations: 0, analyses: 0, tokens: 0 }
      );
      return totals;
    },
  });

  return (
    <AdminShell>
      <PageTransition>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">AI Value Builder — Admin</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl"><Briefcase className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Projets UCM</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl"><BarChart3 className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{quotaStats?.analyses || 0}</p>
                  <p className="text-sm text-muted-foreground">Analyses ce mois</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl"><Zap className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{(quotaStats?.tokens || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Tokens consommés</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Card>
              <CardHeader><CardTitle>Tous les projets</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(projects || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{p.company}</p>
                        <p className="text-xs text-muted-foreground">{(p as any).organizations?.name || "—"} • {p.sector_label || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{(p as any).ucm_use_cases?.[0]?.count || 0} UC</Badge>
                        <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {(!projects || projects.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Aucun projet UCM</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
}
