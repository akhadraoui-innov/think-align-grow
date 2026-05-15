import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Target, FlaskConical, Shield, Users } from "lucide-react";
import type { ChallengeSessionContextRow } from "@/hooks/useChallengeSession";

interface BriefingFormProps {
  context: ChallengeSessionContextRow | null;
  readOnly?: boolean;
  onSave: (patch: Partial<ChallengeSessionContextRow>) => Promise<void>;
  onStart?: () => void;
  canStart?: boolean;
}

const Field = ({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
    <div className="px-4 py-2.5 bg-muted/20 border-b border-border/30 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-bold text-sm">{label}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export function BriefingForm({ context, readOnly, onSave, onStart, canStart }: BriefingFormProps) {
  const [scope, setScope] = useState(context?.scope || "");
  const [goals, setGoals] = useState(context?.goals || "");
  const [hypotheses, setHypotheses] = useState(context?.hypotheses || "");
  const [constraints, setConstraints] = useState(context?.constraints || "");
  const [stakeholders, setStakeholders] = useState<string>(
    Array.isArray(context?.stakeholders) ? context!.stakeholders.map((s: any) => s.role || s).join(", ") : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScope(context?.scope || "");
    setGoals(context?.goals || "");
    setHypotheses(context?.hypotheses || "");
    setConstraints(context?.constraints || "");
    setStakeholders(Array.isArray(context?.stakeholders) ? context!.stakeholders.map((s: any) => s.role || s).join(", ") : "");
  }, [context?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        scope: scope || null,
        goals: goals || null,
        hypotheses: hypotheses || null,
        constraints: constraints || null,
        stakeholders: stakeholders.split(",").map(s => s.trim()).filter(Boolean).map(role => ({ role })),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight">Briefing de session</h2>
        <p className="text-sm text-muted-foreground mt-1">Pose le décor — l'IA s'en servira tout au long de l'atelier (RAG).</p>
      </div>

      <Field icon={Target} label="Périmètre & objectifs">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Périmètre</Label>
            <Input value={scope} onChange={e => setScope(e.target.value)} placeholder="Ex : Lancement produit X EMEA" disabled={readOnly} />
          </div>
          <div>
            <Label className="text-xs">Objectifs SMART</Label>
            <Textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} placeholder="Spécifiques, mesurables, atteignables…" disabled={readOnly} />
          </div>
        </div>
      </Field>

      <Field icon={FlaskConical} label="Hypothèses de départ">
        <Textarea value={hypotheses} onChange={e => setHypotheses(e.target.value)} rows={3} placeholder="Ce que nous pensons savoir avant de démarrer…" disabled={readOnly} />
      </Field>

      <Field icon={Shield} label="Contraintes">
        <Textarea value={constraints} onChange={e => setConstraints(e.target.value)} rows={3} placeholder="Budget, délais, technologies, conformité…" disabled={readOnly} />
      </Field>

      <Field icon={Users} label="Parties prenantes">
        <Input value={stakeholders} onChange={e => setStakeholders(e.target.value)} placeholder="Ex : CEO, CMO, Lead Tech, Customer Success" disabled={readOnly} />
        <p className="text-[11px] text-muted-foreground mt-1">Séparées par des virgules.</p>
      </Field>

      {!readOnly && (
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
          {onStart && (
            <Button onClick={onStart} disabled={!canStart} className="font-bold">
              Démarrer la session →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
