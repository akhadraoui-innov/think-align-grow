import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_SALES_STAGES, DEFAULT_MEDDIC, DEFAULT_ENT_USE_CASES, type SalesStage, type MEDDICScore, type EntUseCaseConfig } from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { Building2, Calculator, ArrowRight, Target, Shield, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const meddicLabels: Record<string, string> = {
  metrics: "Metrics",
  economicBuyer: "Economic Buyer",
  decisionCriteria: "Decision Criteria",
  decisionProcess: "Decision Process",
  identifyPain: "Identify Pain",
  champion: "Champion",
};

export function BusinessEnterpriseTab() {
  const [stages, setStages] = useState<SalesStage[]>(DEFAULT_SALES_STAGES);
  const [meddic, setMeddic] = useState<MEDDICScore[]>(DEFAULT_MEDDIC);
  const [useCases, setUseCases] = useState<EntUseCaseConfig[]>(DEFAULT_ENT_USE_CASES);

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

  const updateMeddic = (id: string, field: keyof MEDDICScore, value: number) => {
    setMeddic(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addMeddicProspect = () => {
    setMeddic(prev => [...prev, { id: `m-${Date.now()}`, prospectName: "Nouveau prospect", metrics: 5, economicBuyer: 5, decisionCriteria: 5, decisionProcess: 5, identifyPain: 5, champion: 5 }]);
  };

  const removeMeddicProspect = (id: string) => {
    setMeddic(prev => prev.filter(m => m.id !== id));
  };

  const updateUseCase = (id: string, field: keyof EntUseCaseConfig, value: any) => {
    setUseCases(prev => prev.map(uc => uc.id === id ? { ...uc, [field]: value } : uc));
  };

  return (
    <div className="space-y-8">
      {/* Sales cycle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                      <Input type="number" value={stage.durationWeeks} onChange={e => updateStage(stage.id, "durationWeeks", Number(e.target.value))} className="h-7 text-xs border-dashed" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Conversion %</label>
                      <Input type="number" value={stage.conversionRate} onChange={e => updateStage(stage.id, "conversionRate", Number(e.target.value))} className="h-7 text-xs border-dashed" />
                    </div>
                  </div>
                  {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* MEDDIC */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Qualification MEDDIC</CardTitle>
              <Button size="sm" variant="outline" onClick={addMeddicProspect} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />Prospect
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Scorez chaque prospect de 1 à 10 sur les 6 dimensions MEDDIC</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[180px]">Prospect</th>
                    {Object.entries(meddicLabels).map(([k, v]) => (
                      <th key={k} className="text-center py-2 px-3 font-medium text-muted-foreground">{v}</th>
                    ))}
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {meddic.map(m => {
                    const total = m.metrics + m.economicBuyer + m.decisionCriteria + m.decisionProcess + m.identifyPain + m.champion;
                    const pct = Math.round(total / 60 * 100);
                    return (
                      <tr key={m.id} className="border-b border-border/30">
                        <td className="py-2 px-3">
                          <Input value={m.prospectName} onChange={e => setMeddic(prev => prev.map(p => p.id === m.id ? { ...p, prospectName: e.target.value } : p))} className="h-6 text-xs border-none shadow-none p-0 font-medium" />
                        </td>
                        {(["metrics", "economicBuyer", "decisionCriteria", "decisionProcess", "identifyPain", "champion"] as const).map(field => (
                          <td key={field} className="py-1 px-1 text-center">
                            <Input type="number" value={m[field]} onChange={e => updateMeddic(m.id, field, Math.min(10, Math.max(0, Number(e.target.value))))} className="w-12 h-7 text-xs text-center mx-auto border-dashed" min={0} max={10} />
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          <MetricTooltip label="Score MEDDIC" explanation={`${total}/60 — ${pct}% de qualification`} benchmark="> 70% = deal qualifié">
                            <span className={`font-bold ${pct >= 70 ? "text-emerald-500" : pct >= 50 ? "text-yellow-600" : "text-destructive"}`}>
                              {total}/60
                            </span>
                          </MetricTooltip>
                        </td>
                        <td className="py-2 px-3">
                          <button onClick={() => removeMeddicProspect(m.id)} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ROI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Calculateur ROI client</CardTitle>
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

      {/* Use cases — editable */}
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
                  <tr key={uc.id} className="border-b border-border/30">
                    <td className="py-2 px-3">
                      <Input value={uc.sector} onChange={e => updateUseCase(uc.id, "sector", e.target.value)} className="h-6 text-xs border-none shadow-none p-0 font-medium text-foreground" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-2 rounded-full bg-muted w-20">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${uc.opportunity}%` }} />
                        </div>
                        <Input type="number" value={uc.opportunity} onChange={e => updateUseCase(uc.id, "opportunity", Number(e.target.value))} className="w-12 h-6 text-xs text-center border-dashed font-bold text-primary" min={0} max={100} />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {uc.modules.map(m => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Input value={uc.deal} onChange={e => updateUseCase(uc.id, "deal", e.target.value)} className="w-24 h-6 text-xs text-center border-dashed font-medium text-foreground" />
                    </td>
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
