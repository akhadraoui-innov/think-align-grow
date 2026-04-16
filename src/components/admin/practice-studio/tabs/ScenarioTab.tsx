import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

export function ScenarioTab({ practice, onChange }: Props) {
  const phases = (practice.phases ?? []) as Array<{ name: string; goal: string }>;
  const objectives = (practice.objectives ?? []) as Array<{ text: string; weight?: number }>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Brief immersif</h3>
        <p className="text-xs text-muted-foreground">Markdown supporté. Décrivez le contexte, les enjeux, les contraintes.</p>
        <Textarea
          value={practice.scenario}
          onChange={e => onChange({ scenario: e.target.value })}
          rows={10}
          className="font-mono text-xs"
          placeholder="## Contexte&#10;Vous êtes…"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Objectifs SMART</h3>
          <Button size="sm" variant="outline" onClick={() => onChange({ objectives: [...objectives, { text: "", weight: 25 }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {objectives.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input
                value={o.text}
                onChange={e => {
                  const next = [...objectives]; next[i] = { ...o, text: e.target.value };
                  onChange({ objectives: next });
                }}
                placeholder="Objectif mesurable…"
                className="flex-1"
              />
              <Input
                type="number"
                value={o.weight ?? 25}
                onChange={e => {
                  const next = [...objectives]; next[i] = { ...o, weight: parseInt(e.target.value) || 0 };
                  onChange({ objectives: next });
                }}
                className="w-20"
                placeholder="Pds"
              />
              <Button size="sm" variant="ghost" onClick={() => onChange({ objectives: objectives.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {objectives.length === 0 && <p className="text-xs text-muted-foreground">Aucun objectif défini</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Phases du parcours</h3>
          <Button size="sm" variant="outline" onClick={() => onChange({ phases: [...phases, { name: "", goal: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {phases.map((p, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] gap-2 items-center">
              <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
              <Input
                value={p.name}
                onChange={e => {
                  const next = [...phases]; next[i] = { ...p, name: e.target.value };
                  onChange({ phases: next });
                }}
                placeholder="Nom"
              />
              <Input
                value={p.goal}
                onChange={e => {
                  const next = [...phases]; next[i] = { ...p, goal: e.target.value };
                  onChange({ phases: next });
                }}
                placeholder="Objectif de la phase"
              />
              <Button size="sm" variant="ghost" onClick={() => onChange({ phases: phases.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {phases.length === 0 && <p className="text-xs text-muted-foreground">Aucune phase</p>}
        </div>
      </div>
    </div>
  );
}
