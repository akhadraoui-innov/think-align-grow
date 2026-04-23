import { useState } from "react";
import { FlaskConical, Trophy, Plus, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { useEmailABTests, useUpsertABTest, useStopABTest, EmailABTest } from "@/hooks/useEmailABTests";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";

function openRate(opened: number, sent: number) {
  return sent === 0 ? 0 : (opened / sent) * 100;
}

function ABTestCard({ t, onStop, onToggle }: { t: EmailABTest; onStop: (winner: "A" | "B") => void; onToggle: () => void }) {
  const orA = openRate(t.variant_a_opened, t.variant_a_sent);
  const orB = openRate(t.variant_b_opened, t.variant_b_sent);
  const leader = orA > orB ? "A" : orB > orA ? "B" : null;
  const sig = t.significance_pct ?? 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{t.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={t.status === "running" ? "default" : t.status === "paused" ? "secondary" : "outline"} className="text-[10px]">
              {t.status === "running" ? "En cours" : t.status === "paused" ? "Pause" : "Terminé"}
            </Badge>
            {t.winner && (
              <Badge variant="default" className="text-[10px] bg-emerald-500 hover:bg-emerald-500">
                <Trophy className="h-3 w-3 mr-1" />Variante {t.winner} gagnante
              </Badge>
            )}
            {sig >= 95 && t.status === "running" && (
              <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                Signification {sig.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
        {t.status === "running" && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onToggle}><Pause className="h-3 w-3" /></Button>
            <Button size="sm" variant="default" onClick={() => onStop(leader === "A" ? "A" : "B")}>
              <Trophy className="h-3 w-3 mr-1" />Déclarer gagnant
            </Button>
          </div>
        )}
        {t.status === "paused" && (
          <Button size="sm" variant="outline" onClick={onToggle}><Play className="h-3 w-3 mr-1" />Reprendre</Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${leader === "A" ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px]">Variante A</Badge>
            {leader === "A" && <Trophy className="h-3 w-3 text-emerald-600" />}
          </div>
          <p className="text-xs font-medium truncate" title={t.variant_a_subject}>{t.variant_a_subject}</p>
          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
            <div className="flex justify-between"><span>Envoyés</span><span className="font-mono">{t.variant_a_sent}</span></div>
            <div className="flex justify-between"><span>Ouverts</span><span className="font-mono">{t.variant_a_opened} ({orA.toFixed(1)}%)</span></div>
          </div>
          <Progress value={orA} className="h-1 mt-2" />
        </div>

        <div className={`p-3 rounded-lg border ${leader === "B" ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px]">Variante B</Badge>
            {leader === "B" && <Trophy className="h-3 w-3 text-emerald-600" />}
          </div>
          <p className="text-xs font-medium truncate" title={t.variant_b_subject}>{t.variant_b_subject}</p>
          <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
            <div className="flex justify-between"><span>Envoyés</span><span className="font-mono">{t.variant_b_sent}</span></div>
            <div className="flex justify-between"><span>Ouverts</span><span className="font-mono">{t.variant_b_opened} ({orB.toFixed(1)}%)</span></div>
          </div>
          <Progress value={orB} className="h-1 mt-2" />
        </div>
      </div>

      {sig < 95 && t.status === "running" && (t.variant_a_sent + t.variant_b_sent) >= 100 && (
        <p className="text-[10px] text-muted-foreground">
          Signification statistique : {sig.toFixed(1)}% — il faut au moins 95% pour conclure (z-test sur taux d'ouverture)
        </p>
      )}
    </Card>
  );
}

export function EmailABTestsTab({ organizationId }: { organizationId: string | null }) {
  const { data: tests = [], isLoading } = useEmailABTests(organizationId);
  const { data: templates = [] } = useEmailTemplates(organizationId);
  const upsert = useUpsertABTest();
  const stop = useStopABTest();

  const [editing, setEditing] = useState<Partial<EmailABTest> | null>(null);

  const handleSave = async () => {
    if (!editing?.template_id || !editing.name || !editing.variant_a_subject || !editing.variant_b_subject) {
      toast.error("Tous les champs sont requis"); return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        template_id: editing.template_id,
        organization_id: organizationId,
        name: editing.name,
        variant_a_subject: editing.variant_a_subject,
        variant_b_subject: editing.variant_b_subject,
        status: editing.status ?? "running",
      });
      toast.success("Test A/B enregistré");
      setEditing(null);
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><FlaskConical className="h-4 w-4" />Tests A/B sur sujets</h2>
          <p className="text-xs text-muted-foreground">Comparez deux objets d'email — la signification se calcule sur le taux d'ouverture</p>
        </div>
        <Button onClick={() => setEditing({ status: "running" })}><Plus className="h-3 w-3 mr-1" />Nouveau test</Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Chargement…</p>}
      {!isLoading && tests.length === 0 && (
        <Card className="p-12 text-center text-xs text-muted-foreground">
          Aucun test A/B en cours. Créez-en un pour comparer deux objets sur un même template.
        </Card>
      )}

      <div className="grid gap-3">
        {tests.map(t => (
          <ABTestCard
            key={t.id}
            t={t}
            onStop={(winner) => stop.mutate({ id: t.id, winner })}
            onToggle={() => upsert.mutate({ ...t, status: t.status === "running" ? "paused" : "running" })}
          />
        ))}
      </div>

      <Sheet open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          <SheetHeader><SheetTitle>Configurer un test A/B</SheetTitle></SheetHeader>
          {editing && (
            <div className="space-y-3 mt-6">
              <div>
                <Label className="text-xs">Nom du test</Label>
                <Input value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="ex. Welcome v2 vs personnalisé" />
              </div>
              <div>
                <Label className="text-xs">Template ciblé</Label>
                <Select value={editing.template_id} onValueChange={v => setEditing({ ...editing, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sujet A</Label>
                <Input value={editing.variant_a_subject || ""} onChange={e => setEditing({ ...editing, variant_a_subject: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Sujet B</Label>
                <Input value={editing.variant_b_subject || ""} onChange={e => setEditing({ ...editing, variant_b_subject: e.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={upsert.isPending}>Lancer le test</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
