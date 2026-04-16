import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

const POSTURES = [
  { value: "proactive", label: "Proactif", desc: "L'IA prend l'initiative et oriente l'apprenant." },
  { value: "guided", label: "Guidé", desc: "Suggestions et conseils à chaque étape." },
  { value: "socratic", label: "Socratique", desc: "Pose des questions pour faire émerger la réflexion." },
  { value: "challenger", label: "Challenger", desc: "Confronte les hypothèses, demande des preuves." },
  { value: "silent", label: "Silencieux", desc: "Pas d'aide pendant la session, évaluation à la fin." },
  { value: "intensive", label: "Intensif", desc: "Coaching dense, feedback continu, relances." },
];

const ASSISTANCE = [
  { value: "autonomous", label: "Autonome (pas de chips)" },
  { value: "guided", label: "Guidé (chips de suggestions)" },
  { value: "intensive", label: "Intensif (feedback + chips)" },
];

export function CoachingTab({ practice, onChange }: Props) {
  const hints = (practice.hints ?? []) as string[];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Posture de coaching</h3>
        <RadioGroup value={practice.coaching_mode} onValueChange={v => onChange({ coaching_mode: v })}>
          <div className="grid grid-cols-2 gap-2">
            {POSTURES.map(p => (
              <label key={p.value} className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/40 transition-colors data-[state=checked]:border-primary">
                <RadioGroupItem value={p.value} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Niveau d'assistance UI</h3>
        <RadioGroup value={practice.ai_assistance_level} onValueChange={v => onChange({ ai_assistance_level: v })}>
          <div className="space-y-2">
            {ASSISTANCE.map(a => (
              <label key={a.value} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/40 transition-colors">
                <RadioGroupItem value={a.value} />
                <span className="text-sm">{a.label}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Indices (hints)</h3>
          <Button size="sm" variant="outline" onClick={() => onChange({ hints: [...hints, ""] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Suggestions affichées si l'apprenant est bloqué.</p>
        <div className="space-y-2">
          {hints.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={h}
                onChange={e => {
                  const next = [...hints]; next[i] = e.target.value;
                  onChange({ hints: next });
                }}
                placeholder="Indice…"
              />
              <Button size="sm" variant="ghost" onClick={() => onChange({ hints: hints.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
