import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/ui/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionReplay } from "@/components/simulator/widgets/SessionReplay";
import { getModeDefinition, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Award, RotateCcw, MessageSquare, TrendingUp, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

export default function SimulatorHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [replaySession, setReplaySession] = useState<Session | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("academy_practice_sessions")
        .select("id, practice_id, score, started_at, completed_at, messages, evaluation, academy_practices(title, practice_type, difficulty)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (data) {
        setSessions(
          data.map((d: any) => ({
            ...d,
            practice: d.academy_practices,
          }))
        );
      }
      setLoading(false);
    })();
  }, [user]);

  const completedSessions = sessions.filter((s) => s.completed_at);
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / completedSessions.length)
    : 0;

  const replayMessages = replaySession?.messages
    ? (Array.isArray(replaySession.messages) ? replaySession.messages : []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    : [];

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
        <div className="grid grid-cols-3 gap-4">
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
                {avgScore}<span className="text-sm text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Aucune session pour l'instant</p>
            <Button onClick={() => navigate("/simulator")}>Démarrer une simulation</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const modeDef = session.practice?.practice_type
                ? getModeDefinition(session.practice.practice_type)
                : null;
              const universeName = modeDef ? UNIVERSE_LABELS[modeDef.universe] : "";

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="shrink-0">
                        {session.completed_at ? (
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm",
                            (session.score ?? 0) >= 60
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          )}>
                            {session.score ?? 0}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {session.practice?.title ?? "Session"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {modeDef && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {modeDef.label}
                            </Badge>
                          )}
                          {universeName && (
                            <span className="text-[10px] text-muted-foreground">{universeName}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(session.started_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                          {session.completed_at && " · Terminée"}
                        </p>
                      </div>

                      {session.completed_at && session.messages && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplaySession(session)}
                          className="gap-1.5 text-xs"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Replay
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Replay dialog */}
        {replaySession && (
          <SessionReplay
            open={!!replaySession}
            onClose={() => setReplaySession(null)}
            messages={replayMessages}
            score={replaySession.score ?? undefined}
          />
        )}
      </div>
    </PageTransition>
  );
}
