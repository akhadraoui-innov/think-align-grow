import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getModeDefinition, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Award, RotateCcw, TrendingUp, ArrowLeft, FileText, ChevronDown, MessageSquare, Brain, Zap, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Session {
  id: string;
  practice_id: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  messages: any;
  evaluation: any;
  practice?: { title: string; practice_type: string; difficulty: string | null };
}

interface PracticeGroup {
  practiceId: string;
  title: string;
  practiceType: string;
  difficulty: string | null;
  sessions: Session[];
}

export default function SimulatorHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("academy_practice_sessions")
        .select("id, practice_id, score, started_at, completed_at, messages, evaluation, academy_practices!left(title, practice_type, difficulty)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(100);

      if (data) {
        setSessions(
          data.map((d: any) => ({ ...d, practice: d.academy_practices }))
        );
        // Expand first group by default
        const firstPracticeId = data[0]?.practice_id;
        if (firstPracticeId) setExpandedGroups(new Set([firstPracticeId]));
      }
      setLoading(false);
    })();
  }, [user]);

  // Group sessions by practice_id
  const groups = useMemo<PracticeGroup[]>(() => {
    const map = new Map<string, PracticeGroup>();
    sessions.forEach((s) => {
      const key = s.practice_id || "__standalone__";
      if (!map.has(key)) {
        map.set(key, {
          practiceId: key,
          title: s.practice?.title ?? "Session libre",
          practiceType: s.practice?.practice_type ?? "",
          difficulty: s.practice?.difficulty ?? null,
          sessions: [],
        });
      }
      map.get(key)!.sessions.push(s);
    });
    return Array.from(map.values());
  }, [sessions]);

  const completedSessions = sessions.filter((s) => s.completed_at);
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / completedSessions.length)
    : 0;
  const bestScore = completedSessions.length
    ? Math.max(...completedSessions.map((s) => s.score ?? 0))
    : 0;

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/simulator")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Mon historique
            </h1>
            <p className="text-sm text-muted-foreground">Vos sessions de simulation passées</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-primary">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-emerald-500">{completedSessions.length}</p>
              <p className="text-xs text-muted-foreground">Terminées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-black", avgScore >= 60 ? "text-primary" : "text-amber-500")}>
                {avgScore}<span className="text-xs text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-emerald-500">
                {bestScore}<span className="text-xs text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground">Meilleur</p>
            </CardContent>
          </Card>
        </div>

        {/* Grouped sessions */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Aucune session pour l'instant</p>
            <Button onClick={() => navigate("/simulator")}>Démarrer une simulation</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, gi) => {
              const modeDef = group.practiceType ? getModeDefinition(group.practiceType) : null;
              const isOpen = expandedGroups.has(group.practiceId);

              return (
                <motion.div
                  key={group.practiceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                >
                  <Card>
                    <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.practiceId)}>
                      <CollapsibleTrigger className="w-full text-left">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{group.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {modeDef && <Badge variant="outline" className="text-[10px] h-4">{modeDef.label}</Badge>}
                              {group.difficulty && <Badge variant="secondary" className="text-[10px] h-4">{group.difficulty}</Badge>}
                              <span className="text-[11px] text-muted-foreground">
                                {group.sessions.length} tentative{group.sessions.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-2">
                          {group.sessions.map((session, si) => {
                            const attemptNum = group.sessions.length - si;
                            const prevSession = group.sessions[si + 1];
                            const delta = session.score != null && prevSession?.score != null
                              ? session.score - prevSession.score
                              : null;

                            return (
                              <div
                                key={session.id}
                                className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors"
                              >
                                {/* Score badge */}
                                <div className="shrink-0">
                                  {session.completed_at ? (
                                    <div className={cn(
                                      "h-11 w-11 rounded-xl flex flex-col items-center justify-center font-black text-sm",
                                      (session.score ?? 0) >= 60
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-amber-500/10 text-amber-500"
                                    )}>
                                      {session.score ?? 0}
                                      <span className="text-[8px] font-medium opacity-60">/100</span>
                                    </div>
                                  ) : (
                                    <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
                                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>

                                {/* Info + mini KPIs */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold">Tentative {attemptNum}</p>
                                    {delta !== null && delta !== 0 && (
                                      <Badge variant={delta > 0 ? "default" : "destructive"} className="text-[9px] h-4 px-1.5">
                                        {delta > 0 ? "+" : ""}{delta}
                                      </Badge>
                                    )}
                                    <span className="text-[10px] text-muted-foreground ml-auto mr-1">
                                      {format(new Date(session.started_at), "dd MMM yyyy · HH:mm", { locale: fr })}
                                    </span>
                                  </div>

                                  {/* Mini KPI row */}
                                  {session.completed_at && (() => {
                                    const eval_ = session.evaluation as any;
                                    const kpis = eval_?.kpis;
                                    const msgCount = Array.isArray(session.messages) ? session.messages.length : 0;
                                    return (
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <MessageSquare className="h-3 w-3" />
                                          {msgCount} échanges
                                        </span>
                                        {kpis && (
                                          <>
                                            <span className="flex items-center gap-1" title="Clarté">
                                              <Brain className="h-3 w-3" />
                                              {kpis.communication_clarity ?? "–"}/10
                                            </span>
                                            <span className="flex items-center gap-1" title="Pertinence">
                                              <Target className="h-3 w-3" />
                                              {kpis.response_relevance ?? "–"}/10
                                            </span>
                                            <span className="flex items-center gap-1" title="Adaptabilité">
                                              <Zap className="h-3 w-3" />
                                              {kpis.adaptability ?? "–"}/10
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {session.completed_at && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/simulator/session/${session.id}/report`)}
                                    className="gap-1.5 text-xs shrink-0"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Rapport
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
