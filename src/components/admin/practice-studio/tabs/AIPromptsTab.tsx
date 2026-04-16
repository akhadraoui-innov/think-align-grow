import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

const MODELS = [
  { value: "", label: "Par défaut (gemini-2.5-flash)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
];

export function AIPromptsTab({ practice, onChange }: Props) {
  const guardrails = (practice.guardrails ?? []) as string[];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">System prompt</h3>
        <p className="text-xs text-muted-foreground">Définit la posture, le rôle et le comportement de l'IA.</p>
        <Textarea
          value={practice.system_prompt}
          onChange={e => onChange({ system_prompt: e.target.value })}
          rows={14}
          className="font-mono text-xs"
          placeholder="Tu es…"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Modèle & paramètres</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Modèle (override)</Label>
            <Select value={practice.model_override ?? ""} onValueChange={v => onChange({ model_override: v || null })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map(m => <SelectItem key={m.value || "default"} value={m.value || "__default__"}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Max exchanges</Label>
            <Input type="number" value={practice.max_exchanges} onChange={e => onChange({ max_exchanges: parseInt(e.target.value) || 10 })} />
          </div>
        </div>
        <div>
          <Label className="text-xs flex items-center justify-between">
            Temperature <span className="font-mono">{practice.temperature_override ?? 0.7}</span>
          </Label>
          <Slider
            value={[practice.temperature_override ?? 0.7]}
            min={0} max={1} step={0.05}
            onValueChange={v => onChange({ temperature_override: v[0] })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Garde-fous</h3>
          <Button size="sm" variant="outline" onClick={() => onChange({ guardrails: [...guardrails, ""] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Règles strictes que l'IA doit toujours respecter.</p>
        <div className="space-y-2">
          {guardrails.map((g, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={g}
                onChange={e => {
                  const next = [...guardrails]; next[i] = e.target.value;
                  onChange({ guardrails: next });
                }}
                placeholder="Ne jamais révéler…"
              />
              <Button size="sm" variant="ghost" onClick={() => onChange({ guardrails: guardrails.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
