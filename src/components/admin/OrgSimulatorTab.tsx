import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Award, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getModeDefinition } from "@/components/simulator/config/modeRegistry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  organizationId: string;
}

export function OrgSimulatorTab({ organizationId }: Props) {
  // Practices assigned to this org
  const { data: practices = [], isLoading: pLoading } = useQuery({
    queryKey: ["org-practices", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sessions from org members
  const { data: members = [] } = useQuery({
    queryKey: ["org-members-ids", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data;
    },
  });

  const memberIds = members.map((m: any) => m.user_id);

  const { data: sessions = [], isLoading: sLoading } = useQuery({
    queryKey: ["org-sim-sessions", organizationId, memberIds],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practice_sessions")
        .select("*")
        .in("user_id", memberIds)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const completed = sessions.filter((s: any) => s.completed_at);
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((a: number, s: any) => a + (s.score || 0), 0) / completed.length)
    : 0;

  if (pLoading || sLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{practices.length}</p>
            <p className="text-xs text-muted-foreground">Pratiques assignées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Sessions membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{avgScore}<span className="text-sm text-muted-foreground">/100</span></p>
            <p className="text-xs text-muted-foreground">Score moyen</p>
          </CardContent>
        </Card>
      </div>

      {/* Practices list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" /> Pratiques de l'organisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {practices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune pratique assignée à cette organisation.
            </p>
          ) : (
            <div className="space-y-2">
              {practices.map((pr: any) => {
                const def = getModeDefinition(pr.practice_type);
                return (
                  <div key={pr.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">{pr.title}</span>
                      {def && <Badge className="text-[9px] bg-primary/10 text-primary border-0">{def.label}</Badge>}
                      <Badge variant="outline" className="text-[9px]">{pr.ai_assistance_level || "guided"}</Badge>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">{pr.difficulty}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4" /> Sessions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 10).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.completed_at ? "default" : "secondary"} className="text-[9px]">
                      {s.completed_at ? "Terminée" : "En cours"}
                    </Badge>
                    <span className="text-muted-foreground">{s.user_id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.score !== null && <span className="font-bold">{s.score}/100</span>}
                    <span className="text-muted-foreground">
                      {format(new Date(s.started_at), "dd MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
