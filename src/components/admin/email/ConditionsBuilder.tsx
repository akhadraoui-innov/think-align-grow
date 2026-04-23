import { useState } from "react";
import { Plus, X, FlaskConical, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConditionRule, ConditionsDSL, CONDITION_OPS } from "@/hooks/useEmailAutomations";
import { evalConditions, SAMPLE_PAYLOADS } from "@/lib/conditions-eval";

interface Props {
  value: ConditionsDSL | Record<string, never>;
  onChange: (next: ConditionsDSL) => void;
  payloadHints?: string[];
  triggerEvent?: string;
}

const EMPTY_RULE: ConditionRule = { path: "payload.", op: "==", value: "" };

export function ConditionsBuilder({ value, onChange, payloadHints = [], triggerEvent }: Props) {
  const v: ConditionsDSL = (value && typeof value === "object" ? (value as ConditionsDSL) : {}) || {};
  const all = Array.isArray(v.all) ? v.all : [];
  const any = Array.isArray(v.any) ? v.any : [];

  const sample = triggerEvent ? SAMPLE_PAYLOADS[triggerEvent] ?? {} : {};
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [payloadJson, setPayloadJson] = useState<string>(() =>
    JSON.stringify({ payload: sample }, null, 2)
  );

  let report: ReturnType<typeof evalConditions> | null = null;
  let parseError: string | null = null;
  if (dryRunOpen) {
    try {
      const ctx = JSON.parse(payloadJson);
      report = evalConditions(v, ctx);
    } catch (e: any) {
      parseError = e?.message ?? "JSON invalide";
    }
  }

  const update = (key: "all" | "any", rules: ConditionRule[]) => {
    const next: ConditionsDSL = { ...v, [key]: rules };
    if (next.all?.length === 0) delete next.all;
    if (next.any?.length === 0) delete next.any;
    onChange(next);
  };

  const renderRules = (key: "all" | "any", rules: ConditionRule[]) => (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
          <Input
            value={r.path}
            onChange={(e) => {
              const next = [...rules];
              next[i] = { ...r, path: e.target.value };
              update(key, next);
            }}
            placeholder="payload.daysInactive"
            className="font-mono text-xs h-8 flex-1"
          />
          <Select
            value={r.op}
            onValueChange={(op: any) => {
              const next = [...rules];
              next[i] = { ...r, op };
              update(key, next);
            }}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONDITION_OPS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {r.op !== "exists" && (
            <Input
              value={typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                let parsed: any = raw;
                if (raw.startsWith("[") || raw.startsWith("{")) {
                  try { parsed = JSON.parse(raw); } catch { parsed = raw; }
                } else if (raw === "true" || raw === "false") {
                  parsed = raw === "true";
                } else if (raw !== "" && !isNaN(Number(raw))) {
                  parsed = Number(raw);
                }
                const next = [...rules];
                next[i] = { ...r, value: parsed };
                update(key, next);
              }}
              placeholder="valeur"
              className="text-xs h-8 w-[140px]"
            />
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => update(key, rules.filter((_, idx) => idx !== i))}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-xs h-7"
        onClick={() => update(key, [...rules, { ...EMPTY_RULE }])}
      >
        <Plus className="h-3 w-3 mr-1" />Ajouter une règle
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {payloadHints.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Variables disponibles dans le payload :{" "}
          {payloadHints.map((h) => (
            <Badge key={h} variant="outline" className="mr-1 font-mono text-[10px]">payload.{h}</Badge>
          ))}
        </div>
      )}

      <div>
        <Label className="text-xs font-semibold">Toutes les règles ci-dessous (AND)</Label>
        <p className="text-[10px] text-muted-foreground mb-2">L'automation se déclenche si toutes ces règles sont vraies.</p>
        {renderRules("all", all)}
      </div>

      <div>
        <Label className="text-xs font-semibold">Au moins une règle (OR)</Label>
        <p className="text-[10px] text-muted-foreground mb-2">Optionnel : au moins une de ces règles doit être vraie.</p>
        {renderRules("any", any)}
      </div>

      {all.length === 0 && any.length === 0 && (
        <div className="text-xs text-muted-foreground italic p-3 rounded-lg bg-muted/30 border border-dashed border-border">
          Aucune condition. L'automation se déclenche pour <strong>tous</strong> les événements de ce type.
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <FlaskConical className="h-3.5 w-3.5" /> Tester (dry-run)
          </Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs h-7"
            onClick={() => setDryRunOpen((o) => !o)}
          >
            {dryRunOpen ? "Masquer" : "Ouvrir"}
          </Button>
        </div>

        {dryRunOpen && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-[2px] shrink-0" />
              Saisissez un payload JSON simulé. L'évaluation utilise la même logique que l'edge function `trigger-email`.
            </p>
            <Textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              className="font-mono text-[11px] resize-none min-h-[120px]"
              spellCheck={false}
            />
            {parseError ? (
              <div className="flex items-center gap-2 text-xs text-destructive p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <XCircle className="h-3.5 w-3.5" /> JSON invalide : {parseError}
              </div>
            ) : report ? (
              <div className={`p-2 rounded-lg border text-xs ${report.passed ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border"}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {report.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  {report.reason}
                </div>
                {report.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {report.details.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                        <Badge variant="outline" className="text-[9px]">{d.group.toUpperCase()}</Badge>
                        {d.result ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />}
                        <span className="text-muted-foreground">{d.rule.path}</span>
                        <span>{d.rule.op}</span>
                        <span className="text-muted-foreground">{JSON.stringify(d.rule.value)}</span>
                        <span className="ml-auto opacity-60">→ {JSON.stringify(d.leftValue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
