import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODE_REGISTRY, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

export function IdentityTab({ practice, onChange }: Props) {
  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Identité" subtitle="Nom et statut">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Titre</Label>
            <Input value={practice.title} onChange={e => onChange({ title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={practice.status} onValueChange={v => onChange({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulté</Label>
              <Select value={practice.difficulty ?? "intermediate"} onValueChange={v => onChange({ difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            La visibilité publique se gère dans l'onglet <strong>Diffusion</strong>.
          </p>
        </div>
      </Section>

      <Section title="Mode & Univers" subtitle="Type de simulation et famille UI">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Univers</Label>
            <Select value={practice.universe ?? ""} onValueChange={v => onChange({ universe: v })}>
              <SelectTrigger><SelectValue placeholder="Univers" /></SelectTrigger>
              <SelectContent>
                {Object.entries(UNIVERSE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mode (practice_type)</Label>
            <Select
              value={practice.practice_type}
              onValueChange={v => {
                const def = MODE_REGISTRY[v];
                // Auto-suggest universe if user hasn't set one yet, or it doesn't match the new mode's family
                const patch: Partial<AdminPractice> = { practice_type: v };
                if (def && (!practice.universe || practice.universe === "")) {
                  patch.universe = def.universe;
                }
                onChange(patch);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(MODE_REGISTRY).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              L'univers est suggéré automatiquement à partir du mode (modifiable).
            </p>
          </div>
        </div>
      </Section>

      <Section title="Métadonnées" subtitle="Audience, durée, tags">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Audience</Label>
            <Input value={practice.audience ?? ""} onChange={e => onChange({ audience: e.target.value })} placeholder="Manager, dev senior…" />
          </div>
          <div>
            <Label className="text-xs">Durée estimée (min)</Label>
            <Input
              type="number"
              value={practice.estimated_minutes ?? 20}
              onChange={e => onChange({ estimated_minutes: parseInt(e.target.value) || 20 })}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Tags (séparés par des virgules)</Label>
          <Input
            value={(practice.tags ?? []).join(", ")}
            onChange={e => onChange({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
