import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  questions: Tables<"quiz_questions">[];
  pillars: Tables<"pillars">[];
}

export function ToolkitQuizTab({ questions, pillars }: Props) {
  const pillarMap = Object.fromEntries(pillars.map((p) => [p.id, p]));

  if (!questions.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
        Aucune question de quiz.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Question</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pilier</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Options</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const pillar = pillarMap[q.pillar_id];
            const opts = Array.isArray(q.options) ? q.options : [];
            return (
              <tr key={q.id} className="border-b border-border/30">
                <td className="px-4 py-3 text-muted-foreground">{q.sort_order}</td>
                <td className="px-4 py-3 text-foreground">{q.question}</td>
                <td className="px-4 py-3">
                  {pillar ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pillar.color || "#ccc" }} />
                      <span className="text-xs text-muted-foreground">{pillar.name}</span>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">{opts.length} options</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
