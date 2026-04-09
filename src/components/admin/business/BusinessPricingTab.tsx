import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PLANS, DEFAULT_CREDITS, DEFAULT_TOKEN_COSTS, type PlanConfig, type CreditAction, type TokenCost } from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Check, Plus, Trash2, Cpu, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

type PricingModel = "seat" | "usage" | "hybrid";

export function BusinessPricingTab() {
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS);
  const [credits, setCredits] = useState<CreditAction[]>(DEFAULT_CREDITS);
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>(DEFAULT_TOKEN_COSTS);
  const [pricingModel, setPricingModel] = useState<PricingModel>("hybrid");
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Unit economics sliders
  const [cac, setCac] = useState(300);
  const [ltv, setLtv] = useState(3600);
  const [churn, setChurn] = useState(5);
  const [nrr, setNrr] = useState(110);

  const ltvCacRatio = ltv / cac;
  const paybackMonths = Math.round(cac / (ltv / 24));
  const customerLifetime = Math.round(1 / (churn / 100));
  const grossMarginPct = 72;
  const growthRateForRule40 = 10;
  const rule40 = growthRateForRule40 + grossMarginPct;
  const magicNumber = (ltv * 0.1) / cac;

  // Enterprise grille
  const [entPricing] = useState([
    { tier: "100-250 sièges", pricePerSeat: 39, minAnnual: 46800 },
    { tier: "250-500 sièges", pricePerSeat: 29, minAnnual: 87000 },
    { tier: "500-1000 sièges", pricePerSeat: 19, minAnnual: 114000 },
    { tier: "1000+ sièges", pricePerSeat: 14, minAnnual: 168000 },
  ]);

  // Revenue simulator
  const [clients, setClients] = useState(100);
  const [arpu, setArpu] = useState(149);
  const [growthRate, setGrowthRate] = useState(10);
  const [churnSim, setChurnSim] = useState(5);

  const projections = Array.from({ length: 24 }, (_, m) => {
    const active = Math.round(clients * Math.pow(1 + (growthRate - churnSim) / 100, m));
    const mrr = active * arpu;
    return { month: `M${m + 1}`, mrr, arr: mrr * 12, clients: active };
  });

  const updatePlanPrice = (id: string, price: number) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, price } : p));
  };

  const addPlan = () => {
    const id = `plan-${Date.now()}`;
    setPlans(prev => [...prev, { id, name: "Nouveau plan", price: 99, billing: "monthly", features: ["Feature 1"], cta: "S'abonner" }]);
  };

  const removePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const updatePlanFeature = (planId: string, idx: number, value: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.map((f, i) => i === idx ? value : f) } : p));
  };

  const addFeature = (planId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: [...p.features, "Nouvelle feature"] } : p));
  };

  const removeFeature = (planId: string, idx: number) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== idx) } : p));
  };

  const updateCreditCost = (id: string, cost: number) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, cost } : c));
  };

  const updateCreditUsage = (id: string, avgUsagePerUser: number) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, avgUsagePerUser } : c));
  };

  const avgRevenuePerUser = credits.reduce((sum, c) => sum + c.cost * c.avgUsagePerUser, 0);

  // AI COGS calculation
  const aiCogPerUser = tokenCosts.reduce((sum, t) => {
    const inputCost = (t.avgInputTokens / 1_000_000) * t.costPer1MInput;
    const outputCost = (t.avgOutputTokens / 1_000_000) * t.costPer1MOutput;
    return sum + inputCost + outputCost;
  }, 0);

  const updateTokenCost = (id: string, field: keyof TokenCost, value: number) => {
    setTokenCosts(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const benchmarks = [
    { name: "360Learning", price: "8€/user", ltv: "2 400€", cac: "200€" },
    { name: "Docebo", price: "15€/user", ltv: "4 500€", cac: "500€" },
    { name: "Coursera B2B", price: "30€/user", ltv: "7 200€", cac: "800€" },
  ];

  return (
    <div className="space-y-8">
      {/* Pricing model toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Modèle de pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["seat", "usage", "hybrid"] as PricingModel[]).map(model => (
                <button
                  key={model}
                  onClick={() => setPricingModel(model)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${pricingModel === model ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/30"}`}
                >
                  {model === "seat" ? "Par siège" : model === "usage" ? "Usage-based" : "Hybride (siège + crédits)"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {pricingModel === "seat" && "Facturation mensuelle fixe par utilisateur actif. Prévisible mais risque de sous-utilisation."}
              {pricingModel === "usage" && "Pay-per-use basé sur les crédits IA consommés. Aligné sur la valeur mais revenus variables."}
              {pricingModel === "hybrid" && "Abonnement de base + crédits IA à l'usage. Meilleur compromis prévisibilité / alignement valeur."}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plans CRUD */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Grille tarifaire</h3>
          <Button size="sm" variant="outline" onClick={addPlan} className="text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />Ajouter un plan
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={`relative group ${plan.highlighted ? "border-primary shadow-lg shadow-primary/5" : "border-border/50"}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Recommandé</Badge>
                </div>
              )}
              {plans.length > 1 && (
                <button onClick={() => removePlan(plan.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <Input
                    value={plan.name}
                    onChange={e => setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))}
                    className="text-center font-bold text-foreground border-none shadow-none h-8"
                  />
                  <div className="mt-2">
                    {plan.billing === "custom" ? (
                      <span className="text-2xl font-bold text-foreground">Sur devis</span>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1">
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={e => updatePlanPrice(plan.id, Number(e.target.value))}
                          className="w-20 text-2xl font-bold text-center h-10 border-dashed"
                        />
                        <span className="text-sm text-muted-foreground">€/mois</span>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground group/feat">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <Input
                        value={f}
                        onChange={e => updatePlanFeature(plan.id, i, e.target.value)}
                        className="h-6 text-xs border-none shadow-none p-0 bg-transparent"
                      />
                      <button onClick={() => removeFeature(plan.id, i)} className="opacity-0 group-hover/feat:opacity-100 text-destructive shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => addFeature(plan.id)}>
                  <Plus className="h-3 w-3 mr-1" />Ajouter feature
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Enterprise grille */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grille Enterprise</CardTitle>
            <p className="text-xs text-muted-foreground">Tarification par siège avec remises volume</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tranche</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">€/siège/mois</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Minimum annuel</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Remise vs Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {entPricing.map(ep => (
                    <tr key={ep.tier} className="border-b border-border/30">
                      <td className="py-2 px-3 font-medium text-foreground">{ep.tier}</td>
                      <td className="py-2 px-3 text-center font-bold text-primary">{ep.pricePerSeat}€</td>
                      <td className="py-2 px-3 text-center text-foreground">{(ep.minAnnual / 1000).toFixed(0)}K€</td>
                      <td className="py-2 px-3 text-center text-emerald-500 font-bold">-{Math.round((1 - ep.pricePerSeat / 149) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost of AI */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />Coût IA (COGS tokens)</CardTitle>
            <p className="text-xs text-muted-foreground">
              COGS IA moyen par user/mois : <span className="font-bold text-destructive">{aiCogPerUser.toFixed(3)}€</span> — 
              Marge brute sur Pro : <span className="font-bold text-emerald-500">{(((149 - aiCogPerUser) / 149) * 100).toFixed(1)}%</span>
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Tokens IN</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Tokens OUT</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">$/1M IN</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">$/1M OUT</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Coût/appel</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenCosts.map(t => {
                    const callCost = (t.avgInputTokens / 1_000_000) * t.costPer1MInput + (t.avgOutputTokens / 1_000_000) * t.costPer1MOutput;
                    return (
                      <tr key={t.id} className="border-b border-border/30">
                        <td className="py-2 px-3 text-foreground">{t.action}</td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={t.avgInputTokens} onChange={e => updateTokenCost(t.id, "avgInputTokens", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={t.avgOutputTokens} onChange={e => updateTokenCost(t.id, "avgOutputTokens", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={t.costPer1MInput} onChange={e => updateTokenCost(t.id, "costPer1MInput", Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" step={0.1} />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={t.costPer1MOutput} onChange={e => updateTokenCost(t.id, "costPer1MOutput", Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" step={0.1} />
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-destructive">{callCost.toFixed(4)}€</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Credits table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Table des crédits IA</CardTitle>
          <p className="text-xs text-muted-foreground">Revenu moyen par utilisateur : <span className="font-bold text-primary">{avgRevenuePerUser} crédits/mois</span></p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Coût (crédits)</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Usage moyen/user</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total/user</th>
                </tr>
              </thead>
              <tbody>
                {credits.map(c => (
                  <tr key={c.id} className="border-b border-border/30">
                    <td className="py-2 px-3 text-foreground">{c.action}</td>
                    <td className="py-2 px-3 text-center">
                      <Input type="number" value={c.cost} onChange={e => updateCreditCost(c.id, Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Input type="number" value={c.avgUsagePerUser} onChange={e => updateCreditUsage(c.id, Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" />
                    </td>
                    <td className="py-2 px-3 text-center font-medium text-primary">{c.cost * c.avgUsagePerUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics avancés */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Unit Economics avancés</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Benchmark</span>
                <Switch checked={showBenchmark} onCheckedChange={setShowBenchmark} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">CAC (€)</label>
                <Slider value={[cac]} onValueChange={v => setCac(v[0])} min={50} max={1000} step={10} />
                <div className="text-xl font-bold text-foreground">{cac}€</div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">LTV (€)</label>
                <Slider value={[ltv]} onValueChange={v => setLtv(v[0])} min={500} max={10000} step={100} />
                <div className="text-xl font-bold text-foreground">{ltv.toLocaleString()}€</div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Churn mensuel (%)</label>
                <Slider value={[churn]} onValueChange={v => setChurn(v[0])} min={1} max={20} step={0.5} />
                <div className="text-xl font-bold text-foreground">{churn}%</div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">NRR (%)</label>
                <Slider value={[nrr]} onValueChange={v => setNrr(v[0])} min={80} max={150} step={1} />
                <div className={`text-xl font-bold ${nrr >= 100 ? "text-emerald-500" : "text-destructive"}`}>{nrr}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t border-border/50">
              <MetricTooltip label="LTV/CAC" explanation="Ratio entre la valeur vie client et le coût d'acquisition" formula="LTV ÷ CAC" benchmark="≥ 3x pour un SaaS sain">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${ltvCacRatio >= 3 ? "text-emerald-500" : "text-destructive"}`}>{ltvCacRatio.toFixed(1)}x</div>
                  <div className="text-xs text-muted-foreground">LTV/CAC</div>
                </div>
              </MetricTooltip>
              <MetricTooltip label="Payback" explanation="Mois pour récupérer le CAC" formula="CAC ÷ (LTV ÷ durée)" benchmark="< 12 mois">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{paybackMonths} mois</div>
                  <div className="text-xs text-muted-foreground">Payback</div>
                </div>
              </MetricTooltip>
              <MetricTooltip label="Durée de vie" explanation="Durée moyenne d'un client" formula="1 ÷ churn" benchmark="> 20 mois">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{customerLifetime} mois</div>
                  <div className="text-xs text-muted-foreground">Durée de vie</div>
                </div>
              </MetricTooltip>
              <MetricTooltip label="NRR" explanation="Net Revenue Retention — inclut expansion/contraction" formula="(MRR début + expansion - churn) ÷ MRR début" benchmark="> 110% best-in-class">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${nrr >= 100 ? "text-emerald-500" : "text-destructive"}`}>{nrr}%</div>
                  <div className="text-xs text-muted-foreground">NRR</div>
                </div>
              </MetricTooltip>
              <MetricTooltip label="Magic Number" explanation="Efficacité commerciale" formula="Net New ARR ÷ S&M spend" benchmark="> 0.75">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${magicNumber >= 0.75 ? "text-emerald-500" : "text-destructive"}`}>{magicNumber.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Magic Number</div>
                </div>
              </MetricTooltip>
              <MetricTooltip label="Rule of 40" explanation="Growth rate + profit margin" formula="Croissance% + Marge%" benchmark="> 40 = excellent">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${rule40 >= 40 ? "text-emerald-500" : "text-destructive"}`}>{rule40}</div>
                  <div className="text-xs text-muted-foreground">Rule of 40</div>
                </div>
              </MetricTooltip>
            </div>

            {showBenchmark && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Benchmark concurrentiel</h4>
                <div className="grid grid-cols-3 gap-3">
                  {benchmarks.map(b => (
                    <div key={b.name} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs">
                      <div className="font-semibold text-foreground">{b.name}</div>
                      <div className="text-muted-foreground mt-1">Prix: {b.price} | LTV: {b.ltv} | CAC: {b.cac}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulateur de revenus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Clients initiaux</label>
              <Slider value={[clients]} onValueChange={v => setClients(v[0])} min={10} max={1000} step={10} />
              <div className="text-lg font-bold text-foreground">{clients}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">ARPU (€/mois)</label>
              <Slider value={[arpu]} onValueChange={v => setArpu(v[0])} min={10} max={500} step={5} />
              <div className="text-lg font-bold text-foreground">{arpu}€</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Croissance (%/mois)</label>
              <Slider value={[growthRate]} onValueChange={v => setGrowthRate(v[0])} min={1} max={30} step={1} />
              <div className="text-lg font-bold text-foreground">{growthRate}%</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Churn (%/mois)</label>
              <Slider value={[churnSim]} onValueChange={v => setChurnSim(v[0])} min={0} max={15} step={0.5} />
              <div className="text-lg font-bold text-foreground">{churnSim}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(projections[11]?.mrr / 1000).toFixed(0)}K€</div>
              <div className="text-xs text-muted-foreground">MRR M12</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{(projections[11]?.arr / 1000).toFixed(0)}K€</div>
              <div className="text-xs text-muted-foreground">ARR M12</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{projections[11]?.clients}</div>
              <div className="text-xs text-muted-foreground">Clients M12</div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`, ""]} />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="url(#mrrGrad)" strokeWidth={2} name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
