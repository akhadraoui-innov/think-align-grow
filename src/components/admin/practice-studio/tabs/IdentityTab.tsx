import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MODE_REGISTRY, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

export function IdentityTab({ practice, onChange }: Props) {
  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Identité" subtitle="Nom, statut et visibilité">
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
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Pratique publique</p>
              <p className="text-xs text-muted-foreground">Visible par tous les apprenants sans assignation.</p>
            </div>
            <Switch checked={practice.is_public} onCheckedChange={v => onChange({ is_public: v })} />
          </div>
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
            <Select value={practice.practice_type} onValueChange={v => onChange({ practice_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(MODE_REGISTRY).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
