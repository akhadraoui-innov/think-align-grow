import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  subscription: any | null;
}

const statusColors: Record<string, string> = {
  trial: "bg-pillar-business/10 text-pillar-business border-pillar-business/30",
  active: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/30",
  past_due: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Impayé",
  cancelled: "Annulé",
};

export function OrgSubscriptionTab({ subscription }: Props) {
  if (!subscription) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-3">
        <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucun abonnement actif pour cette organisation.</p>
      </div>
    );
  }

  const plan = subscription.subscription_plans;
  const quotas = (plan?.quotas || {}) as Record<string, number>;
  const features = (plan?.features || {}) as Record<string, boolean>;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Plan actuel</h3>
          <Badge variant="outline" className={`text-xs ${statusColors[subscription.status] || ""}`}>
            {statusLabels[subscription.status] || subscription.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Plan</p>
            <p className="text-lg font-bold text-foreground">{plan?.name || "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {plan?.price_monthly ? `${plan.price_monthly}€/mois` : "Gratuit"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Début</p>
            <p className="text-sm font-medium text-foreground">
              {format(new Date(subscription.started_at), "dd MMM yyyy", { locale: fr })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">Expiration</p>
            {subscription.expires_at ? (
              <p className="text-sm font-medium text-foreground">
                {format(new Date(subscription.expires_at), "dd MMM yyyy", { locale: fr })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Pas de date d'expiration</p>
            )}
          </div>
        </div>
      </div>

      {/* Quotas */}
      {Object.keys(quotas).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quotas</h3>
          <div className="space-y-4">
            {Object.entries(quotas).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {Object.keys(features).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fonctionnalités incluses</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(features).map(([key, enabled]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${enabled ? "bg-pillar-finance" : "bg-muted"}`} />
                <span className={enabled ? "text-foreground" : "text-muted-foreground"}>{key.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
