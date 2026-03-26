import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Sparkles, BarChart3, Users, Clock, Award, Plus, Play, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODE_REGISTRY, UNIVERSE_LABELS, getModeDefinition } from "@/components/simulator/config/modeRegistry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminSimulator() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch all practice sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-simulator-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practice_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all standalone practices
  const { data: practices = [], isLoading: practicesLoading } = useQuery({
    queryKey: ["admin-simulator-practices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completedSessions = sessions.filter((s: any) => s.completed_at);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((a: number, s: any) => a + (s.score || 0), 0) / completedSessions.length)
    : 0;

  // Mode popularity
  const modeCounts: Record<string, number> = {};
  practices.forEach((p: any) => {
    const type = p.practice_type || "conversation";
    modeCounts[type] = (modeCounts[type] || 0) + 1;
  });
  const topModes = Object.entries(modeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const standalonePractices = practices.filter((p: any) => !p.module_id);

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Simulateur Professionnel</h1>
              <p className="text-xs text-muted-foreground">{Object.keys(MODE_REGISTRY).length} modes · {practices.length} pratiques · {sessions.length} sessions</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/admin/simulator/templates")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Bibliothèque de templates
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Play className="h-3.5 w-3.5" />
                <span className="text-xs">Sessions totales</span>
              </div>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Award className="h-3.5 w-3.5" />
                <span className="text-xs">Score moyen</span>
              </div>
              <p className="text-2xl font-bold">{avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Taux complétion</span>
              </div>
              <p className="text-2xl font-bold">
                {sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Pratiques standalone</span>
              </div>
              <p className="text-2xl font-bold">{standalonePractices.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Top modes */}
        {topModes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Modes les plus utilisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topModes.map(([mode, count]) => {
                  const def = getModeDefinition(mode);
                  return (
                    <Badge key={mode} variant="outline" className="gap-1.5 text-xs py-1 px-3">
                      {def?.label || mode}
                      <span className="text-muted-foreground">({count})</span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent sessions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sessions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune session enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 20).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 text-xs">
                    <div className="flex items-center gap-3">
                      <Badge variant={s.completed_at ? "default" : "secondary"} className="text-[9px]">
                        {s.completed_at ? "Terminée" : "En cours"}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[200px]">{s.practice_id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.score !== null && (
                        <span className="font-bold">{s.score}/100</span>
                      )}
                      <span className="text-muted-foreground">
                        {format(new Date(s.started_at), "dd MMM HH:mm", { locale: fr })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
