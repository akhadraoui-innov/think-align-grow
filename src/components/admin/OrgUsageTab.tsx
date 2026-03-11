import { Building2, Users, Presentation, Coins, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  memberCount: number;
  workshopCount: number;
  toolkitCount: number;
  subscription: any | null;
}

export function OrgUsageTab({ memberCount, workshopCount, toolkitCount, subscription }: Props) {
  const quotas = (subscription?.subscription_plans?.quotas || {}) as Record<string, number>;
  const maxWorkshops = quotas.max_workshops_per_month || 0;
  const maxToolkits = quotas.max_toolkits || 0;
  const maxParticipants = quotas.max_participants_per_workshop || 0;
  const aiCredits = quotas.ai_credits_per_month || 0;

  const metrics = [
    {
      label: "Membres",
      icon: Users,
      current: memberCount,
      max: maxParticipants || null,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Workshops créés",
      icon: Presentation,
      current: workshopCount,
      max: maxWorkshops || null,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Toolkits assignés",
      icon: Building2,
      current: toolkitCount,
      max: maxToolkits || null,
      color: "text-pillar-innovation",
      bgColor: "bg-pillar-innovation/10",
    },
    {
      label: "Crédits IA / mois",
      icon: Coins,
      current: 0,
      max: aiCredits || null,
      color: "text-pillar-impact",
      bgColor: "bg-pillar-impact/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Usage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => {
          const pct = m.max ? Math.min(100, Math.round((m.current / m.max) * 100)) : 0;
          return (
            <div key={m.label} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.bgColor}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">
                    {m.current}
                    {m.max ? <span className="text-sm font-normal text-muted-foreground"> / {m.max}</span> : null}
                  </p>
                </div>
                {m.max ? (
                  <span className={`text-sm font-semibold ${pct > 80 ? "text-destructive" : m.color}`}>
                    {pct}%
                  </span>
                ) : null}
              </div>
              {m.max ? <Progress value={pct} className="h-1.5" /> : null}
            </div>
          );
        })}
      </div>

      {/* Empty state for detailed analytics */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Tendances de consommation</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Les graphiques de tendances seront disponibles lorsque l'organisation aura généré plus de données d'usage.
        </p>
      </div>
    </div>
  );
}
