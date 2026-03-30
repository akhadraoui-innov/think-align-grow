import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, Clock, Target, BookOpen, Flame } from "lucide-react";

const SKILLS = [
  { label: "Leadership", score: 78 },
  { label: "Communication", score: 85 },
  { label: "Design Thinking", score: 62 },
  { label: "Data Analysis", score: 45 },
  { label: "Strategy", score: 70 },
  { label: "Prompt Engineering", score: 55 },
];

const WEEKLY = [
  { day: "Lun", value: 45 },
  { day: "Mar", value: 80 },
  { day: "Mer", value: 30 },
  { day: "Jeu", value: 65 },
  { day: "Ven", value: 90 },
  { day: "Sam", value: 20 },
  { day: "Dim", value: 10 },
];

export default function PortalAnalytics() {
  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Votre progression et performance détaillées.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Parcours actifs", value: "3" },
          { icon: Award, label: "Certificats", value: "1" },
          { icon: Flame, label: "Streak", value: "5 jours" },
          { icon: Clock, label: "Ce mois", value: "8h 32min" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Skills radar (simplified bar chart) */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-xs font-bold text-foreground mb-4 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-accent" />
            Radar de compétences
          </h3>
          <div className="space-y-3">
            {SKILLS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-28 shrink-0">{s.label}</span>
                <Progress value={s.score} className="h-2 flex-1" />
                <span className="text-[10px] font-semibold text-foreground w-8 text-right">{s.score}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly activity heatmap */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-xs font-bold text-foreground mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Activité de la semaine
          </h3>
          <div className="flex items-end gap-2 h-24">
            {WEEKLY.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/20 transition-all"
                  style={{ height: `${d.value}%`, minHeight: 4 }}
                >
                  <div
                    className="w-full rounded-t bg-primary transition-all"
                    style={{ height: `${d.value}%`, minHeight: 2 }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
