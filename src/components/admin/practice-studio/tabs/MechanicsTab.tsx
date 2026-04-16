import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getConfigFields } from "@/components/simulator/config/typeConfigSchemas";
import type { AdminPractice } from "@/hooks/useAdminPractices";

interface Props {
  practice: AdminPractice;
  onChange: (patch: Partial<AdminPractice>) => void;
}

export function MechanicsTab({ practice, onChange }: Props) {
  const fields = getConfigFields(practice.practice_type);
  const config = (practice.type_config ?? {}) as Record<string, any>;

  const updateConfig = (key: string, value: any) =>
    onChange({ type_config: { ...config, [key]: value } });

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Configuration du mode</h3>
        <p className="text-xs text-muted-foreground">
          Paramètres spécifiques au mode <code className="px-1 py-0.5 bg-muted rounded text-[10px]">{practice.practice_type}</code>.
        </p>
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Ce mode n'a pas de configuration spécifique.</p>
        ) : (
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "select" ? (
                  <Select value={String(config[f.key] ?? f.defaultValue ?? "")} onValueChange={v => updateConfig(f.key, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" || f.type === "json" ? (
                  <Textarea
                    value={typeof config[f.key] === "string" ? config[f.key] : JSON.stringify(config[f.key] ?? f.defaultValue ?? "", null, 2)}
                    onChange={e => updateConfig(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={4}
                    className="font-mono text-xs"
                  />
                ) : f.type === "number" ? (
                  <Input
                    type="number"
                    value={config[f.key] ?? f.defaultValue ?? ""}
                    min={f.min} max={f.max}
                    onChange={e => updateConfig(f.key, parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <Input
                    value={config[f.key] ?? f.defaultValue ?? ""}
                    placeholder={f.placeholder}
                    onChange={e => updateConfig(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
