import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Clock, Trophy, Zap, ArrowRight,
  Play, TrendingUp, Target
} from "lucide-react";
import { Link } from "react-router-dom";

const ACTIVE_PATHS = [
  { id: "1", title: "Design Thinking Avancé", progress: 72, modules: 8, completed: 5, category: "Innovation", color: "bg-accent" },
  { id: "2", title: "Leadership & Communication", progress: 35, modules: 6, completed: 2, category: "Soft Skills", color: "bg-primary" },
  { id: "3", title: "Theta Healing — Cas Clinique", progress: 15, modules: 6, completed: 1, category: "Développement Personnel", color: "hsl(var(--pillar-finance))" },
];

const RECENT_ACTIVITY = [
  { type: "practice", label: "Présentation Orale", score: 82, time: "Il y a 2h" },
  { type: "quiz", label: "Quiz UX Research", score: 90, time: "Hier" },
  { type: "module", label: "Module 3 : Prototypage", score: null, time: "Avant-hier" },
];

export default function PortalWorkspace() {
  const { profile } = useAuth();
  const { balance } = useCredits();

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Bonjour{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Votre espace de travail personnel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Modules complétés", value: "8", color: "text-primary" },
          { icon: Trophy, label: "Score moyen", value: "85%", color: "text-accent" },
          { icon: Clock, label: "Temps investi", value: "12h", color: "text-muted-foreground" },
          { icon: Zap, label: "Crédits", value: String(balance), color: "text-primary" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${kpi.color} shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active paths */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Parcours en cours</h2>
          <Link to="/portal/paths" className="text-[10px] text-primary font-medium flex items-center gap-0.5 hover:underline">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ACTIVE_PATHS.map((path) => (
            <Card key={path.id} className="hover:shadow-md transition-shadow group cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[9px]">{path.category}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{path.title}</h3>
                <div className="flex items-center gap-2 mb-1">
                  <Progress value={path.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-semibold text-primary">{path.progress}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {path.completed}/{path.modules} modules
                </p>
                <Button size="sm" variant="ghost" className="w-full mt-3 gap-1.5 text-xs h-8 group-hover:bg-primary/8 group-hover:text-primary">
                  <Play className="h-3 w-3" /> Reprendre
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Activité récente</h2>
        <div className="space-y-1.5">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                {a.type === "practice" && <Target className="h-3.5 w-3.5 text-primary" />}
                {a.type === "quiz" && <TrendingUp className="h-3.5 w-3.5 text-accent" />}
                {a.type === "module" && <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{a.label}</p>
                <p className="text-[10px] text-muted-foreground">{a.time}</p>
              </div>
              {a.score !== null && (
                <Badge variant="secondary" className="text-[10px] font-semibold">{a.score}%</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
