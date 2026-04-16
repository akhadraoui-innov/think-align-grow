import { useState } from "react";
import { Plus, Trash2, FlaskConical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePracticeVariants, useUpsertVariant, useDeleteVariant } from "@/hooks/useAdminPractices";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
}

export function VariantsTab({ practice }: Props) {
  const { data: variants = [] } = usePracticeVariants(practice.id);
  const upsert = useUpsertVariant();
  const remove = useDeleteVariant();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ variant_label: "", system_prompt: "", weight: 50 });

  const total = variants.reduce((s, v: any) => s + (v.is_active ? v.weight : 0), 0);
  const balanced = total === 100 || variants.length === 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" /> Variantes A/B
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Testez plusieurs system prompts en parallèle. Les sessions sont routées au hasard pondéré.
            </p>
          </div>
          <Button size="sm" onClick={() => setAdding(true)} disabled={variants.length >= 4}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Variante
          </Button>
        </div>

        {!balanced && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Total des poids : <span className="font-mono">{total}%</span> — devrait être 100% pour un routage équilibré.</span>
          </div>
        )}

        <div className="space-y-3">
          {variants.map((v: any) => (
            <div key={v.id} className="rounded-lg border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Input
                  value={v.variant_label}
                  onChange={e => upsert.mutate({ ...v, variant_label: e.target.value })}
                  className="text-xs font-medium max-w-xs h-8"
                />
                <div className="flex items-center gap-3">
                  <Badge variant={v.is_active ? "default" : "outline"} className="text-[10px]">
                    {v.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Switch
                    checked={v.is_active}
                    onCheckedChange={(b) => upsert.mutate({ ...v, is_active: b })}
                  />
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate({ id: v.id, practice_id: practice.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs flex items-center justify-between mb-1.5">
                  Poids de routage <span className="font-mono">{v.weight}%</span>
                </Label>
                <Slider
                  value={[v.weight]}
                  min={0} max={100} step={5}
                  onValueChange={(val) => upsert.mutate({ ...v, weight: val[0] })}
                />
              </div>
              <div>
                <Label className="text-xs">System prompt alternatif</Label>
                <Textarea
                  value={v.system_prompt}
                  onChange={e => upsert.mutate({ ...v, system_prompt: e.target.value })}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="Cette variante remplace le system prompt principal pendant les sessions routées vers elle."
                />
              </div>
            </div>
          ))}
          {variants.length === 0 && !adding && (
            <p className="text-xs text-muted-foreground text-center py-6">Aucune variante. Ajoutez-en pour démarrer un test A/B.</p>
          )}
        </div>

        {adding && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Input
                value={draft.variant_label}
                onChange={e => setDraft({ ...draft, variant_label: e.target.value })}
                placeholder="Ex. Plus directif"
                className="flex-1"
              />
              <div className="w-32">
                <Slider
                  value={[draft.weight]}
                  min={0} max={100} step={5}
                  onValueChange={(v) => setDraft({ ...draft, weight: v[0] })}
                />
              </div>
              <span className="font-mono text-xs w-10">{draft.weight}%</span>
            </div>
            <Textarea
              value={draft.system_prompt}
              onChange={e => setDraft({ ...draft, system_prompt: e.target.value })}
              rows={5}
              className="font-mono text-xs"
              placeholder="Prompt alternatif…"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setDraft({ variant_label: "", system_prompt: "", weight: 50 }); }}>
                Annuler
              </Button>
              <Button
                size="sm"
                disabled={!draft.variant_label.trim() || !draft.system_prompt.trim()}
                onClick={() => {
                  upsert.mutate(
                    { practice_id: practice.id, ...draft, is_active: true },
                    { onSuccess: () => { setAdding(false); setDraft({ variant_label: "", system_prompt: "", weight: 50 }); } }
                  );
                }}
              >
                Créer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
