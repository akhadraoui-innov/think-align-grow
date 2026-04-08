import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_SALES_STAGES, type SalesStage } from "./businessConfig";
import { Building2, Calculator, ArrowRight, Target } from "lucide-react";

const useCases = [
  { sector: "Banque & Assurance", opportunity: 95, modules: ["UCM", "Simulator", "Academy"], deal: "80-200K€" },
  { sector: "Industrie 4.0", opportunity: 80, modules: ["Workshop", "Challenge", "Academy"], deal: "50-150K€" },
  { sector: "Conseil & Audit", opportunity: 90, modules: ["Toolkits", "Workshop", "UCM"], deal: "30-100K€" },
  { sector: "Secteur public", opportunity: 60, modules: ["Academy", "Simulator"], deal: "40-120K€" },
  { sector: "Retail & Distribution", opportunity: 70, modules: ["UCM", "Academy", "Challenge"], deal: "40-100K€" },
];

export function BusinessEnterpriseTab() {
  const [stages, setStages] = useState<SalesStage[]>(DEFAULT_SALES_STAGES);

  // ROI calculator
  const [employees, setEmployees] = useState(500);
  const [currentCost, setCurrentCost] = useState(1500);
  const [productivityGain, setProductivityGain] = useState(15);

  const totalCurrentCost = employees * currentCost;
  const savings = Math.round(totalCurrentCost * productivityGain / 100);
  const platformCost = employees <= 100 ? 15000 : employees <= 500 ? 40000 : 80000;
  const roi = Math.round(((savings - platformCost) / platformCost) * 100);

  const updateStage = (id: string, field: "durationWeeks" | "conversionRate", value: number) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const overallConversion = stages.reduce((acc, s) => acc * (s.conversionRate / 100), 1) * 100;
  const totalWeeks = stages.reduce((s, st) => s + st.durationWeeks, 0);

  return (
    <div className="space-y-8">
      {/* Sales cycle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Cycle de vente Enterprise</CardTitle>
          <p className="text-xs text-muted-foreground">
            Durée totale : <span className="font-bold">{totalWeeks} semaines</span> — Taux global : <span className="font-bold text-primary">{overallConversion.toFixed(1)}%</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start gap-3">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 min-w-[160px] space-y-3">
                  <div className="text-sm font-semibold text-foreground">{stage.name}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Durée (sem.)</label>
                    <Input
                      type="number"
                      value={stage.durationWeeks}
                      onChange={e => updateStage(stage.id, "durationWeeks", Number(e.target.value))}
                      className="h-7 text-xs border-dashed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Conversion %</label>
                    <Input
                      type="number"
                      value={stage.conversionRate}
                      onChange={e => updateStage(stage.id, "conversionRate", Number(e.target.value))}
                      className="h-7 text-xs border-dashed"
                    />
                  </div>
                </div>
                {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Calculateur ROI client</CardTitle>
          <p className="text-xs text-muted-foreground">Simulez le retour sur investissement pour un prospect Enterprise</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre d'employés concernés</label>
              <Slider value={[employees]} onValueChange={v => setEmployees(v[0])} min={50} max={5000} step={50} />
              <div className="text-lg font-bold text-foreground">{employees}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Coût formation actuel (€/pers/an)</label>
              <Slider value={[currentCost]} onValueChange={v => setCurrentCost(v[0])} min={200} max={5000} step={100} />
              <div className="text-lg font-bold text-foreground">{currentCost}€</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Gain productivité estimé (%)</label>
              <Slider value={[productivityGain]} onValueChange={v => setProductivityGain(v[0])} min={5} max={40} step={1} />
              <div className="text-lg font-bold text-foreground">{productivityGain}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{(totalCurrentCost / 1000).toFixed(0)}K€</div>
              <div className="text-xs text-muted-foreground">Budget actuel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{(savings / 1000).toFixed(0)}K€</div>
              <div className="text-xs text-muted-foreground">Économies estimées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(platformCost / 1000).toFixed(0)}K€</div>
              <div className="text-xs text-muted-foreground">Coût plateforme</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${roi > 0 ? "text-emerald-500" : "text-destructive"}`}>{roi}%</div>
              <div className="text-xs text-muted-foreground">ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Use cases sectoriels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Secteur</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Score opportunité</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Modules clés</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Deal moyen</th>
                </tr>
              </thead>
              <tbody>
                {useCases.map(uc => (
                  <tr key={uc.sector} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium text-foreground">{uc.sector}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-2 rounded-full bg-muted w-20">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${uc.opportunity}%` }} />
                        </div>
                        <span className="text-primary font-bold">{uc.opportunity}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {uc.modules.map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-medium text-foreground">{uc.deal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
