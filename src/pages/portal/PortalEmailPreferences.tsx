import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Mail, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useEmailCategories,
  useEmailPreferences,
  useUpdateEmailPreference,
  useEmailHistory,
} from "@/hooks/useEmailPreferences";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalEmailComplianceTab } from "@/components/portal/PortalEmailComplianceTab";

export default function PortalEmailPreferences() {
  const { data: categories, isLoading: catLoading } = useEmailCategories();
  const { data: preferences, isLoading: prefLoading } = useEmailPreferences();
  const { data: history, isLoading: histLoading } = useEmailHistory(50);
  const updatePref = useUpdateEmailPreference();

  const isSubscribed = (code: string) => {
    const required = categories?.find((c) => c.code === code)?.is_required;
    if (required) return true;
    const pref = preferences?.find((p) => p.category_code === code);
    return pref ? pref.subscribed : true; // default opt-in
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          Préférences email
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les types d'emails que vous recevez et consultez votre historique.
        </p>
      </div>

      <Tabs defaultValue="preferences">
        <TabsList>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="history">Historique reçu</TabsTrigger>
          <TabsTrigger value="compliance">Confidentialité &amp; RGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4 mt-4">
          {catLoading || prefLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            categories?.map((cat) => {
              const pref = preferences?.find((p) => p.category_code === cat.code);
              const subscribed = isSubscribed(cat.code);
              return (
                <Card key={cat.code}>
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label className="text-base font-semibold">{cat.name}</Label>
                        {cat.is_required && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Obligatoire
                          </Badge>
                        )}
                        {pref?.double_opt_in_confirmed_at && (
                          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600/40">
                            <CheckCircle2 className="h-3 w-3" />
                            Opt-in confirmé
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                    <Switch
                      checked={subscribed}
                      disabled={cat.is_required || updatePref.isPending}
                      onCheckedChange={(checked) =>
                        updatePref.mutate({ categoryCode: cat.code, subscribed: checked })
                      }
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos 50 derniers emails</CardTitle>
              <CardDescription>
                Historique des messages envoyés à votre adresse, dernier statut connu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {histLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : history && history.length > 0 ? (
                <ul className="divide-y divide-border">
                  {history.map((h) => (
                    <li key={h.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{h.template_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(h.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <StatusBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun email envoyé à votre adresse pour le moment.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <PortalEmailComplianceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, { label: string; cls: string; icon: any }> = {
    sent: { label: "Reçu", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
    pending: { label: "En cours", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
    bounced: { label: "Rejeté", cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle },
    failed: { label: "Échec", cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle },
    dlq: { label: "Échec", cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle },
    suppressed: { label: "Bloqué", cls: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  };
  const cfg = variant[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border", icon: Clock };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}
