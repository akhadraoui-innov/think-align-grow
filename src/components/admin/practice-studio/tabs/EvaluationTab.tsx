import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { AdminPractice } from "@/hooks/useAdminPractices";
import { Badge } from "@/components/ui/badge";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

const STRATEGIES = [
  { value: "rubric", label: "Rubric (critères discrets)" },
  { value: "dimensions", label: "Dimensions pondérées" },
  { value: "hybrid", label: "Hybride (rubric + dimensions)" },
  { value: "ai_holistic", label: "Holistique IA" },
];

const RESTITUTION_SECTIONS = [
  "score", "feedback", "strengths", "improvements", "kpis",
  "learning_gaps", "explore_next", "best_practices",
];

export function EvaluationTab({ practice, onChange }: Props) {
  const dims = (practice.evaluation_dimensions ?? []) as Array<{ name: string; weight: number }>;
  const restitution = (practice.restitution_template ?? {}) as { sections?: string[]; tone?: string; min_score?: number };
  const totalWeight = dims.reduce((s, d) => s + (d.weight || 0), 0);

  const toggleSection = (s: string) => {
    const cur = restitution.sections ?? RESTITUTION_SECTIONS;
    const next = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s];
    onChange({ restitution_template: { ...restitution, sections: next } });
  };

  const activeSections = restitution.sections ?? RESTITUTION_SECTIONS;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Stratégie d'évaluation</h3>
        <Select value={practice.evaluation_strategy} onValueChange={v => onChange({ evaluation_strategy: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STRATEGIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Dimensions évaluées</h3>
            <p className="text-xs text-muted-foreground">
              Total des poids : <span className={totalWeight === 100 ? "text-emerald-500 font-mono" : "text-amber-500 font-mono"}>{totalWeight}%</span>
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onChange({ evaluation_dimensions: [...dims, { name: "", weight: 25 }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {dims.map((d, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Input
                value={d.name}
                onChange={e => {
                  const next = [...dims]; next[i] = { ...d, name: e.target.value };
                  onChange({ evaluation_dimensions: next });
                }}
                placeholder="Clarté de communication"
                className="flex-1"
              />
              <div className="w-48">
                <Slider
                  value={[d.weight]}
                  min={0} max={100} step={5}
                  onValueChange={v => {
                    const next = [...dims]; next[i] = { ...d, weight: v[0] };
                    onChange({ evaluation_dimensions: next });
                  }}
                />
              </div>
              <span className="font-mono text-xs w-10 text-right">{d.weight}%</span>
              <Button size="sm" variant="ghost" onClick={() => onChange({ evaluation_dimensions: dims.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Restitution finale</h3>
        <div>
          <Label className="text-xs">Sections affichées dans le rapport</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {RESTITUTION_SECTIONS.map(s => (
              <Badge
                key={s}
                variant={activeSections.includes(s) ? "default" : "outline"}
                className="cursor-pointer text-[10px]"
                onClick={() => toggleSection(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Ton du rapport</Label>
            <Select value={restitution.tone ?? "professional"} onValueChange={v => onChange({ restitution_template: { ...restitution, tone: v } })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="encouraging">Encourageant</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="coaching">Coaching</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Score minimum de réussite</Label>
            <Input
              type="number" min={0} max={100}
              value={restitution.min_score ?? 70}
              onChange={e => onChange({ restitution_template: { ...restitution, min_score: parseInt(e.target.value) || 70 } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
