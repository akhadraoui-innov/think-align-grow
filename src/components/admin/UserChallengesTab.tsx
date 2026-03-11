import { Badge } from "@/components/ui/badge";
import { Swords, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChallengeResponse {
  id: string;
  workshop_id: string;
  subject_id: string;
  maturity: number;
  rank: number;
  format: string;
  created_at: string;
}

interface QuizResult {
  id: string;
  total_score: number;
  scores: any;
  created_at: string;
  toolkits: { name: string } | null;
}

interface Props {
  challenges: ChallengeResponse[];
  quizResults: QuizResult[];
}

export function UserChallengesTab({ challenges, quizResults }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Swords className="h-4 w-4 text-violet-500" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Réponses challenges</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{challenges.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Quiz complétés</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{quizResults.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Score moyen quiz</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {quizResults.length > 0 ? Math.round(quizResults.reduce((s, q) => s + q.total_score, 0) / quizResults.length) : "—"}
          </p>
        </div>
      </div>

      {/* Quiz Results */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Quiz complétés</h3>
        {quizResults.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun quiz</p>
        ) : (
          <div className="space-y-2">
            {quizResults.map((qr) => (
              <div key={qr.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{(qr.toolkits as any)?.name || "Toolkit"}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(qr.created_at), "dd MMM yyyy", { locale: fr })}</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">{qr.total_score} pts</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Challenge Responses */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Dernières réponses challenges ({challenges.length})</h3>
        {challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune réponse</p>
        ) : (
          <div className="space-y-2">
            {challenges.slice(0, 20).map((cr) => (
              <div key={cr.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                <div>
                  <p className="text-sm text-foreground font-mono text-[11px]">Workshop {cr.workshop_id.slice(0, 8)}…</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(cr.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">Maturité: {cr.maturity}</Badge>
                  <Badge variant="outline" className="text-[10px]">{cr.format}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
