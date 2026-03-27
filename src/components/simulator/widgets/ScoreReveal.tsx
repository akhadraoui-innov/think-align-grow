import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Star, Lightbulb, RotateCcw, ArrowRight, TrendingUp, MessageSquare, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionReplay } from "./SessionReplay";
import { getNextPractices } from "../config/nextSteps";
import { toast } from "sonner";

interface ScoreRevealProps {
  score: number;
  feedback: string;
  dimensions?: { name: string; score: number }[];
  recommendations?: string[];
  practiceType?: string;
  sessionId?: string;
  nextPractices?: { label: string; type: string }[];
  messages?: { role: "user" | "assistant"; content: string }[];
  onRestart?: () => void;
  onNextPractice?: (type: string) => void;
}

export function ScoreReveal({ score, feedback, dimensions, recommendations, practiceType, sessionId, nextPractices: nextPracticesProp, messages, onRestart, onNextPractice }: ScoreRevealProps) {
  const nextPractices = nextPracticesProp ?? (practiceType ? getNextPractices(practiceType) : []);
  const [showReplay, setShowReplay] = useState(false);
  const navigate = useNavigate();
  const nextPractices = nextPracticesProp ?? (practiceType ? getNextPractices(practiceType) : []);
  const [showReplay, setShowReplay] = useState(false);

  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const gradeColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-primary" : score >= 40 ? "text-amber-500" : "text-destructive";

  const exportPDF = useCallback(() => {
    // Build a printable HTML document
    const dimRows = (dimensions || []).map(d => `<tr><td style="padding:4px 8px">${d.name.replace(/_/g, " ")}</td><td style="padding:4px 8px;text-align:right;font-weight:bold">${d.score}/10</td></tr>`).join("");
    const recoItems = (recommendations || []).map((r, i) => `<li>${i + 1}. ${r}</li>`).join("");
    const msgRows = (messages || []).map(m => `<div style="margin-bottom:8px"><strong style="color:${m.role === "user" ? "#2563eb" : "#16a34a"}">${m.role === "user" ? "Vous" : "IA"}</strong><p style="margin:2px 0;white-space:pre-wrap">${m.content.replace(/</g, "&lt;")}</p></div>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport de session</title>
<style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;color:#1a1a1a;font-size:13px}
h1{font-size:20px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #e5e5e5;padding-bottom:4px}
table{border-collapse:collapse;width:100%}tr:nth-child(even){background:#f9f9f9}
.grade{font-size:48px;font-weight:900;margin:0}.score{font-size:28px;font-weight:700}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
ul{padding-left:16px}li{margin-bottom:4px}</style></head><body>
<h1>📊 Rapport de Simulation</h1><p style="color:#666">${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
<div class="header"><div><div class="score">${score}/100</div><p>Grade : <strong>${grade}</strong></p></div></div>
<h2>Feedback</h2><p>${feedback}</p>
${dimRows ? `<h2>Dimensions</h2><table>${dimRows}</table>` : ""}
${recoItems ? `<h2>Recommandations</h2><ul>${recoItems}</ul>` : ""}
${msgRows ? `<h2>Échanges (${messages?.length || 0})</h2>${msgRows}` : ""}
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => { w.print(); URL.revokeObjectURL(url); };
    } else {
      // Fallback: download as HTML
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-simulation-${score}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success("Export prêt — utilisez Imprimer > PDF");
  }, [score, grade, feedback, dimensions, recommendations, messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 rounded-2xl border bg-card p-5 space-y-4"
    >
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
            <Award className={cn("h-8 w-8", gradeColor)} />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Score final</p>
            <motion.p
              className={cn("text-3xl font-black tabular-nums", gradeColor)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}<span className="text-lg text-muted-foreground">/100</span>
            </motion.p>
          </div>
        </div>
        <motion.div
          className={cn("text-5xl font-black", gradeColor)}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.4 }}
        >
          {grade}
        </motion.div>
      </div>

      {/* Dimensions */}
      {dimensions && dimensions.length > 0 && (
        <motion.div className="grid grid-cols-2 gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {dimensions.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <Star className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{d.name.replace(/_/g, " ")}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", d.score >= 7 ? "bg-emerald-500" : d.score >= 4 ? "bg-amber-500" : "bg-destructive")}
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score * 10}%` }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                />
              </div>
              <span className="font-bold tabular-nums">{d.score}/10</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Feedback */}
      <p className="text-sm text-muted-foreground leading-relaxed">{feedback}</p>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <motion.div
          className="bg-muted/50 rounded-xl p-3 space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            Recommandations
          </div>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary font-bold">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Next practices */}
      {nextPractices && nextPractices.length > 0 && onNextPractice && (
        <motion.div
          className="bg-primary/5 rounded-xl p-3 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Prochaines étapes suggérées
          </div>
          <div className="flex flex-wrap gap-2">
            {nextPractices.map((p) => (
              <Button
                key={p.type}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-7"
                onClick={() => onNextPractice(p.type)}
              >
                {p.label}
                <ArrowRight className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </Button>
        {messages && messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowReplay(true)} className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Revoir mes réponses
          </Button>
        )}
        {onRestart && (
          <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Recommencer
          </Button>
        )}
      </div>

      {/* Replay Dialog */}
      {messages && (
        <SessionReplay
          open={showReplay}
          onClose={() => setShowReplay(false)}
          messages={messages}
          score={score}
        />
      )}
    </motion.div>
  );
}
