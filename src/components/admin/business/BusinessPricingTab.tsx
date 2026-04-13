import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PLANS, DEFAULT_CREDITS, DEFAULT_TOKEN_COSTS, DEFAULT_PRICING_MODELS,
  DEFAULT_SETUP_FEES, DEFAULT_ENTERPRISE_TIERS, DEFAULT_ENTERPRISE_OPTIONS,
  DEFAULT_ACADEMY_GROUP_TIERS, DEFAULT_SERVICES, DEFAULT_REVENUE_MIX,
  VALUE_PRICE_MATRIX,
  type PlanConfig, type CreditAction, type TokenCost, type SetupFee,
  type ServiceConfig, type RevenueMix, type EnterpriseTier, type EnterpriseOption,
  type AcademyGroupTier, type PricingModelComparison,
} from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Cell } from "recharts";
import { Check, Plus, Trash2, X, Cpu, DollarSign, Target, Building2, Zap, Briefcase, TrendingUp, ArrowRight, AlertTriangle, Users } from "lucide-react";

type PricingModel = "seat" | "usage" | "hybrid" | "caas";

export function BusinessPricingTab() {
  // ──── State ────
  const [pricingModel, setPricingModel] = useState<PricingModel>("hybrid");
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS);
  const [credits, setCredits] = useState<CreditAction[]>(DEFAULT_CREDITS);
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>(DEFAULT_TOKEN_COSTS);
  const [setupFees, setSetupFees] = useState<SetupFee[]>(DEFAULT_SETUP_FEES);
  const [entTiers, setEntTiers] = useState<EnterpriseTier[]>(DEFAULT_ENTERPRISE_TIERS);
  const [entOptions, setEntOptions] = useState<EnterpriseOption[]>(DEFAULT_ENTERPRISE_OPTIONS);
  const [academyTiers, setAcademyTiers] = useState<AcademyGroupTier[]>(DEFAULT_ACADEMY_GROUP_TIERS);
  const [services, setServices] = useState<ServiceConfig[]>(DEFAULT_SERVICES);
  const [revenueMix, setRevenueMix] = useState<RevenueMix>(DEFAULT_REVENUE_MIX);
  const [tokenShock, setTokenShock] = useState(1);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);

  // Unit economics
  const [cac, setCac] = useState(300);
  const [ltv, setLtv] = useState(3600);
  const [churn, setChurn] = useState(5);
  const [nrr, setNrr] = useState(110);

  // Revenue simulator
  const [clients, setClients] = useState(100);
  const [arpu, setArpu] = useState(149);
  const [growthRate, setGrowthRate] = useState(10);
  const [churnSim, setChurnSim] = useState(5);

  // ──── Computed ────
  const ltvCacRatio = ltv / cac;
  const paybackMonths = Math.round(cac / (ltv / 24));
  const customerLifetime = Math.round(1 / (churn / 100));
  const grossMarginPct = 72;
  const growthRateForRule40 = 10;
  const rule40 = growthRateForRule40 + grossMarginPct;
  const magicNumber = (ltv * 0.1) / cac;

  const aiCogPerUser = useMemo(() => tokenCosts.reduce((sum, t) => {
    const inputCost = (t.avgInputTokens / 1_000_000) * t.costPer1MInput * tokenShock;
    const outputCost = (t.avgOutputTokens / 1_000_000) * t.costPer1MOutput * tokenShock;
    return sum + inputCost + outputCost;
  }, 0), [tokenCosts, tokenShock]);

  const avgCreditRevPerUser = credits.reduce((sum, c) => sum + c.cost * c.avgUsagePerUser, 0);

  const projections = useMemo(() => Array.from({ length: 24 }, (_, m) => {
    const active = Math.round(clients * Math.pow(1 + (growthRate - churnSim) / 100, m));
    const mrr = active * arpu;
    return { month: `M${m + 1}`, mrr, arr: mrr * 12, clients: active };
  }), [clients, arpu, growthRate, churnSim]);

  const selectedModel = DEFAULT_PRICING_MODELS.find(m => m.model === pricingModel);

  // ──── Handlers ────
  const updatePlanPrice = (id: string, price: number) => setPlans(prev => prev.map(p => p.id === id ? { ...p, price } : p));
  const addPlan = () => setPlans(prev => [...prev, { id: `plan-${Date.now()}`, name: "Nouveau plan", price: 99, billing: "monthly", features: ["Feature 1"], cta: "S'abonner" }]);
  const removePlan = (id: string) => setPlans(prev => prev.filter(p => p.id !== id));
  const updatePlanFeature = (planId: string, idx: number, value: string) => setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.map((f, i) => i === idx ? value : f) } : p));
  const addFeature = (planId: string) => setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: [...p.features, "Nouvelle feature"] } : p));
  const removeFeature = (planId: string, idx: number) => setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== idx) } : p));
  const updateCreditCost = (id: string, cost: number) => setCredits(prev => prev.map(c => c.id === id ? { ...c, cost } : c));
  const updateCreditUsage = (id: string, avgUsagePerUser: number) => setCredits(prev => prev.map(c => c.id === id ? { ...c, avgUsagePerUser } : c));
  const updateTokenCost = (id: string, field: keyof TokenCost, value: number) => setTokenCosts(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateEntTier = (id: string, field: keyof EnterpriseTier, value: number) => setEntTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateEntOption = (id: string, price: number) => setEntOptions(prev => prev.map(o => o.id === id ? { ...o, price } : o));
  const updateAcademyTier = (id: string, pricePerLearner: number) => setAcademyTiers(prev => prev.map(t => t.id === id ? { ...t, pricePerLearner } : t));
  const updateService = (id: string, field: keyof ServiceConfig, value: string | number) => setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const updateSetupFee = (id: string, field: "minPrice" | "maxPrice", value: number) => setSetupFees(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const updateRevenueMix = (key: keyof RevenueMix, value: number) => {
    const remaining = 100 - value;
    const otherKeys = (Object.keys(revenueMix) as (keyof RevenueMix)[]).filter(k => k !== key);
    const currentOther = otherKeys.reduce((s, k) => s + revenueMix[k], 0);
    const newMix = { ...revenueMix, [key]: value };
    otherKeys.forEach(k => { newMix[k] = currentOther > 0 ? Math.round((revenueMix[k] / currentOther) * remaining) : Math.round(remaining / otherKeys.length); });
    setRevenueMix(newMix);
  };

  const benchmarks = [
    { name: "360Learning", price: "8€/user", ltv: "2 400€", cac: "200€" },
    { name: "Docebo", price: "15€/user", ltv: "4 500€", cac: "500€" },
    { name: "Coursera B2B", price: "30€/user", ltv: "7 200€", cac: "800€" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Pricing & Revenue Models</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Stratégie tarifaire, plans, coûts IA et unit economics</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Modèle actif : <span className="font-semibold ml-1">{selectedModel?.label}</span>
        </Badge>
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 border border-border h-9 px-1 flex-wrap">
          <TabsTrigger value="strategy" className="text-xs gap-1.5 data-[state=active]:bg-card"><Target className="h-3.5 w-3.5" />Stratégie</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs gap-1.5 data-[state=active]:bg-card"><DollarSign className="h-3.5 w-3.5" />Plans</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs gap-1.5 data-[state=active]:bg-card"><Users className="h-3.5 w-3.5" />Rôles & Plans</TabsTrigger>
          <TabsTrigger value="enterprise" className="text-xs gap-1.5 data-[state=active]:bg-card"><Building2 className="h-3.5 w-3.5" />Enterprise</TabsTrigger>
          <TabsTrigger value="credits" className="text-xs gap-1.5 data-[state=active]:bg-card"><Cpu className="h-3.5 w-3.5" />Crédits & IA</TabsTrigger>
          <TabsTrigger value="services" className="text-xs gap-1.5 data-[state=active]:bg-card"><Briefcase className="h-3.5 w-3.5" />Services</TabsTrigger>
          <TabsTrigger value="economics" className="text-xs gap-1.5 data-[state=active]:bg-card"><TrendingUp className="h-3.5 w-3.5" />Économie</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1 — STRATÉGIE ═══════ */}
        <TabsContent value="strategy" className="space-y-6 mt-4">
          {/* Choix du modèle */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Choix du modèle de pricing</CardTitle>
              <p className="text-xs text-muted-foreground">Le modèle sélectionné impacte les plans, les projections et les unit economics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DEFAULT_PRICING_MODELS.map(model => (
                  <button
                    key={model.model}
                    onClick={() => setPricingModel(model.model)}
                    className={`p-4 rounded-lg border text-left transition-all ${pricingModel === model.model ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card border-border hover:border-primary/30"}`}
                  >
                    <div className="font-semibold text-sm text-foreground">{model.label}</div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{model.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comparaison modèles */}
          {selectedModel && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600 flex items-center gap-1.5"><Check className="h-4 w-4" />Avantages</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{selectedModel.pros.map((p, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />{p}</li>)}</ul></CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />Inconvénients</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{selectedModel.cons.map((c, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><X className="h-3 w-3 text-destructive mt-0.5 shrink-0" />{c}</li>)}</ul></CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-primary flex items-center gap-1.5"><Users className="h-4 w-4" />Segments cibles</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1.5">{selectedModel.bestFor.map((b, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />{b}</li>)}</ul></CardContent>
              </Card>
            </div>
          )}

          {/* Matrice valeur/prix */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Matrice valeur / contribution au prix</CardTitle>
              <p className="text-xs text-muted-foreground">Quel module justifie quel % du prix de l'abonnement</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Module</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Score valeur</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Contribution prix</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Barre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VALUE_PRICE_MATRIX.map(v => (
                      <tr key={v.module} className="border-b border-border/30">
                        <td className="py-2.5 px-3 font-medium text-foreground">{v.module}</td>
                        <td className="py-2.5 px-3 text-center"><Badge variant="outline" className="text-[10px]">{v.valueScore}/10</Badge></td>
                        <td className="py-2.5 px-3 text-center font-bold text-primary">{v.priceContribution}%</td>
                        <td className="py-2.5 px-3"><div className="w-full bg-muted/50 rounded-full h-2"><div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${v.priceContribution * 2.8}%` }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Positionnement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Low-touch (Self-serve)</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Free → Solo → Team via onboarding automatisé, documentation, tutoriels vidéo.</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Signup en ligne", "Essai 14j", "Onboarding auto", "Support email"].map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">High-touch (Accompagné)</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Pro → Academy → Enterprise via vente consultative, POC, démo personnalisée.</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Démo sur mesure", "POC 30j", "Onboarding dédié", "Account manager"].map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ TAB 2 — PLANS & OFFRES ═══════ */}
        <TabsContent value="plans" className="space-y-6 mt-4">
          {/* Toggle billing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${!annualBilling ? "text-foreground" : "text-muted-foreground"}`}>Mensuel</span>
              <Switch checked={annualBilling} onCheckedChange={setAnnualBilling} />
              <span className={`text-xs font-medium ${annualBilling ? "text-foreground" : "text-muted-foreground"}`}>Annuel <Badge variant="secondary" className="text-[9px] ml-1">-20%</Badge></span>
            </div>
            <Button size="sm" variant="outline" onClick={addPlan} className="text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />Ajouter un plan
            </Button>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => {
              const displayPrice = plan.billing === "custom" ? null : annualBilling ? Math.round(plan.price * 0.8) : plan.price;
              return (
                <Card key={plan.id} className={`relative group border ${plan.highlighted ? "border-primary shadow-md shadow-primary/5" : "border-border"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px]">Recommandé</Badge>
                    </div>
                  )}
                  {plans.length > 1 && (
                    <button onClick={() => removePlan(plan.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="text-center space-y-2">
                      <Input value={plan.name} onChange={e => setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p))} className="text-center font-bold text-foreground border-none shadow-none h-7 text-base" />
                      {displayPrice !== null ? (
                        <div className="flex items-baseline justify-center gap-1">
                          <Input type="number" value={displayPrice} onChange={e => updatePlanPrice(plan.id, annualBilling ? Math.round(Number(e.target.value) / 0.8) : Number(e.target.value))} className="w-20 text-2xl font-bold text-center h-9 border-dashed" />
                          <span className="text-xs text-muted-foreground">€/{pricingModel === "seat" ? "user/" : ""}mois</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-foreground">Sur devis</span>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground group/feat">
                          <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <Input value={f} onChange={e => updatePlanFeature(plan.id, i, e.target.value)} className="h-5 text-[11px] border-none shadow-none p-0 bg-transparent" />
                          <button onClick={() => removeFeature(plan.id, i)} className="opacity-0 group-hover/feat:opacity-100 text-destructive shrink-0"><X className="h-3 w-3" /></button>
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" variant="ghost" className="w-full text-[11px] text-muted-foreground h-7" onClick={() => addFeature(plan.id)}><Plus className="h-3 w-3 mr-1" />Feature</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Setup fees */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Setup fees & Onboarding</CardTitle>
              <p className="text-xs text-muted-foreground">Frais ponctuels facturés à l'activation (Free et Solo exemptés)</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Min (€)</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Max (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupFees.map(sf => (
                      <tr key={sf.id} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium text-foreground">{sf.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{sf.description}</td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={sf.minPrice} onChange={e => updateSetupFee(sf.id, "minPrice", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={sf.maxPrice} onChange={e => updateSetupFee(sf.id, "maxPrice", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 3 — ENTERPRISE ═══════ */}
        <TabsContent value="enterprise" className="space-y-6 mt-4">
          {/* Enterprise tiers */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Grille tarifaire Enterprise</CardTitle>
              <p className="text-xs text-muted-foreground">Prix par siège avec remises volume — engagement annuel minimum</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Tranche</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">€/siège/mois</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Min annuel</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Remise vs Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entTiers.map(ep => (
                      <tr key={ep.id} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium text-foreground">{ep.tier}</td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={ep.pricePerSeat} onChange={e => updateEntTier(ep.id, "pricePerSeat", Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed font-bold text-primary" />
                        </td>
                        <td className="py-2 px-3 text-center text-foreground">{(ep.minAnnual / 1000).toFixed(0)}K€</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-600">-{Math.round((1 - ep.pricePerSeat / 149) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Academy Groupe */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Academy Groupe — Licence bulk</CardTitle>
              <p className="text-xs text-muted-foreground">Pour les organisations de formation et grands groupes déployant des parcours à l'échelle</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Apprenants</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">€/apprenant/mois</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Engagement</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">CA annuel indicatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academyTiers.map(ag => {
                      const midLearners = parseInt(ag.learners.split("-")[0]) * 1.5;
                      const annualRev = midLearners * ag.pricePerLearner * 12;
                      return (
                        <tr key={ag.id} className="border-b border-border/30">
                          <td className="py-2 px-3 font-medium text-foreground">{ag.learners}</td>
                          <td className="py-2 px-3 text-center">
                            <Input type="number" value={ag.pricePerLearner} onChange={e => updateAcademyTier(ag.id, Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed font-bold text-primary" />
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground">{ag.engagement}</td>
                          <td className="py-2 px-3 text-center font-semibold text-foreground">{(annualRev / 1000).toFixed(0)}K€</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Options à la carte */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Options à la carte</CardTitle>
              <p className="text-xs text-muted-foreground">Add-ons facturés en supplément de l'abonnement Enterprise</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {entOptions.map(opt => (
                  <div key={opt.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="font-semibold text-sm text-foreground">{opt.name}</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
                    <div className="flex items-baseline gap-1">
                      <Input type="number" value={opt.price} onChange={e => updateEntOption(opt.id, Number(e.target.value))} className="w-20 h-7 text-xs border-dashed font-bold text-primary" />
                      <span className="text-[10px] text-muted-foreground">{opt.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Setup fees Enterprise */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Setup fees Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Description</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Fourchette</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupFees.filter(sf => sf.maxPrice > 0).map(sf => (
                      <tr key={sf.id} className="border-b border-border/30">
                        <td className="py-2 px-3 font-medium text-foreground">{sf.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{sf.description}</td>
                        <td className="py-2 px-3 text-center font-semibold text-foreground">{(sf.minPrice / 1000).toFixed(0)}K - {(sf.maxPrice / 1000).toFixed(0)}K€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 4 — CRÉDITS & IA ═══════ */}
        <TabsContent value="credits" className="space-y-6 mt-4">
          {/* AI COGS */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />Coût IA réel (COGS tokens)</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>COGS IA/user/mois : <span className="font-bold text-destructive">{aiCogPerUser.toFixed(3)}€</span></span>
                <span>Marge brute sur Pro : <span className="font-bold text-emerald-600">{(((149 - aiCogPerUser) / 149) * 100).toFixed(1)}%</span></span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Action</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Tokens IN</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Tokens OUT</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">$/1M IN</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">$/1M OUT</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Coût/appel</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenCosts.map(t => {
                      const callCost = ((t.avgInputTokens / 1_000_000) * t.costPer1MInput + (t.avgOutputTokens / 1_000_000) * t.costPer1MOutput) * tokenShock;
                      const credit = credits.find(c => c.id === t.id);
                      const creditValue = credit ? credit.cost * 0.5 : 0; // 1 crédit ≈ 0.50€ approximatif
                      const margin = creditValue > 0 ? ((creditValue - callCost) / creditValue * 100) : 0;
                      return (
                        <tr key={t.id} className="border-b border-border/30">
                          <td className="py-2 px-3 text-foreground font-medium">{t.action}</td>
                          <td className="py-2 px-3 text-center"><Input type="number" value={t.avgInputTokens} onChange={e => updateTokenCost(t.id, "avgInputTokens", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" /></td>
                          <td className="py-2 px-3 text-center"><Input type="number" value={t.avgOutputTokens} onChange={e => updateTokenCost(t.id, "avgOutputTokens", Number(e.target.value))} className="w-20 h-7 text-xs text-center mx-auto border-dashed" /></td>
                          <td className="py-2 px-3 text-center"><Input type="number" value={t.costPer1MInput} onChange={e => updateTokenCost(t.id, "costPer1MInput", Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" step={0.1} /></td>
                          <td className="py-2 px-3 text-center"><Input type="number" value={t.costPer1MOutput} onChange={e => updateTokenCost(t.id, "costPer1MOutput", Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" step={0.1} /></td>
                          <td className="py-2 px-3 text-center font-bold text-destructive">{callCost.toFixed(4)}€</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-600">{margin > 0 ? `${margin.toFixed(0)}%` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Token shock */}
              <div className="border-t border-border pt-4">
                <Label className="text-xs font-medium text-muted-foreground">Scénario Token Price Shock</Label>
                <div className="flex items-center gap-4 mt-2">
                  {[1, 2, 3, 5].map(mult => (
                    <button
                      key={mult}
                      onClick={() => setTokenShock(mult)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${tokenShock === mult ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-card border-border text-muted-foreground hover:border-destructive/20"}`}
                    >
                      ×{mult}{mult === 1 ? " (actuel)" : ""}
                    </button>
                  ))}
                </div>
                {tokenShock > 1 && (
                  <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-xs text-destructive font-medium">
                      ⚠️ Avec un choc ×{tokenShock}, le COGS IA passe à {(aiCogPerUser).toFixed(3)}€/user — marge brute Pro : {(((149 - aiCogPerUser) / 149) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credits table */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Table des crédits IA</CardTitle>
              <p className="text-xs text-muted-foreground">Consommation moyenne : <span className="font-bold text-primary">{avgCreditRevPerUser} crédits/user/mois</span></p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Action</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Coût (crédits)</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Usage moyen/user</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Total/user</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map(c => (
                      <tr key={c.id} className="border-b border-border/30">
                        <td className="py-2 px-3 text-foreground font-medium">{c.action}</td>
                        <td className="py-2 px-3 text-center"><Input type="number" value={c.cost} onChange={e => updateCreditCost(c.id, Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" /></td>
                        <td className="py-2 px-3 text-center"><Input type="number" value={c.avgUsagePerUser} onChange={e => updateCreditUsage(c.id, Number(e.target.value))} className="w-16 h-7 text-xs text-center mx-auto border-dashed" /></td>
                        <td className="py-2 px-3 text-center font-medium text-primary">{c.cost * c.avgUsagePerUser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 5 — SERVICES & CaaS ═══════ */}
        <TabsContent value="services" className="space-y-6 mt-4">
          {/* Services catalogue */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Catalogue de services</CardTitle>
              <p className="text-xs text-muted-foreground">Revenus additionnels au-delà du SaaS : consulting, formation, marketplace</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Modèle</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Fourchette</th>
                      <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id} className="border-b border-border/30">
                        <td className="py-2 px-3">
                          <div className="font-medium text-foreground">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{s.description}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {s.type === "consulting" ? "Conseil" : s.type === "training" ? "Formation" : "Marketplace"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{s.priceModel}</td>
                        <td className="py-2 px-3 text-center font-semibold text-foreground">{s.priceRange}</td>
                        <td className="py-2 px-3 text-center">
                          <Input type="number" value={s.margin} onChange={e => updateService(s.id, "margin", Number(e.target.value))} className="w-14 h-7 text-xs text-center mx-auto border-dashed font-bold text-emerald-600" />
                          <span className="text-[10px] text-muted-foreground">%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue mix */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Revenue Mix cible</CardTitle>
              <p className="text-xs text-muted-foreground">Répartition cible des sources de revenus — ajustez les sliders</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(Object.entries(revenueMix) as [keyof RevenueMix, number][]).map(([key, val]) => {
                  const labels: Record<keyof RevenueMix, string> = { saas: "SaaS (abonnements)", credits: "Crédits IA", services: "Services & CaaS", partnership: "Partnership" };
                  const colors: Record<keyof RevenueMix, string> = { saas: "text-primary", credits: "text-purple-500", services: "text-emerald-600", partnership: "text-orange-500" };
                  return (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{labels[key]}</Label>
                      <Slider value={[val]} onValueChange={v => updateRevenueMix(key, v[0])} min={0} max={80} step={5} />
                      <div className={`text-xl font-bold ${colors[key]}`}>{val}%</div>
                    </div>
                  );
                })}
              </div>
              {/* Visual bar */}
              <div className="flex h-4 rounded-full overflow-hidden border border-border">
                <div className="bg-primary transition-all" style={{ width: `${revenueMix.saas}%` }} />
                <div className="bg-purple-500 transition-all" style={{ width: `${revenueMix.credits}%` }} />
                <div className="bg-emerald-500 transition-all" style={{ width: `${revenueMix.services}%` }} />
                <div className="bg-orange-500 transition-all" style={{ width: `${revenueMix.partnership}%` }} />
              </div>
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" />SaaS</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" />Crédits</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />Services</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" />Partnership</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 6 — UNIT ECONOMICS ═══════ */}
        <TabsContent value="economics" className="space-y-6 mt-4">
          {/* KPI sliders */}
          <Card className="border-border">
            <CardHeader className="pb-3">
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
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">CAC (€)</Label>
                  <Slider value={[cac]} onValueChange={v => setCac(v[0])} min={50} max={1000} step={10} />
                  <div className="text-xl font-bold text-foreground">{cac}€</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">LTV (€)</Label>
                  <Slider value={[ltv]} onValueChange={v => setLtv(v[0])} min={500} max={10000} step={100} />
                  <div className="text-xl font-bold text-foreground">{ltv.toLocaleString()}€</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Churn mensuel (%)</Label>
                  <Slider value={[churn]} onValueChange={v => setChurn(v[0])} min={1} max={20} step={0.5} />
                  <div className="text-xl font-bold text-foreground">{churn}%</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">NRR (%)</Label>
                  <Slider value={[nrr]} onValueChange={v => setNrr(v[0])} min={80} max={150} step={1} />
                  <div className={`text-xl font-bold ${nrr >= 100 ? "text-emerald-600" : "text-destructive"}`}>{nrr}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t border-border">
                <MetricTooltip label="LTV/CAC" explanation="Ratio valeur vie / coût acquisition" formula="LTV ÷ CAC" benchmark="≥ 3x">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${ltvCacRatio >= 3 ? "text-emerald-600" : "text-destructive"}`}>{ltvCacRatio.toFixed(1)}x</div>
                    <div className="text-[10px] text-muted-foreground">LTV/CAC</div>
                  </div>
                </MetricTooltip>
                <MetricTooltip label="Payback" explanation="Mois pour récupérer le CAC" formula="CAC ÷ MRR" benchmark="< 12 mois">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{paybackMonths}m</div>
                    <div className="text-[10px] text-muted-foreground">Payback</div>
                  </div>
                </MetricTooltip>
                <MetricTooltip label="Durée vie" explanation="Durée moyenne client" formula="1 ÷ churn" benchmark="> 20 mois">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{customerLifetime}m</div>
                    <div className="text-[10px] text-muted-foreground">Durée vie</div>
                  </div>
                </MetricTooltip>
                <MetricTooltip label="NRR" explanation="Net Revenue Retention" formula="(MRR + expansion - churn) ÷ MRR" benchmark="> 110%">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${nrr >= 100 ? "text-emerald-600" : "text-destructive"}`}>{nrr}%</div>
                    <div className="text-[10px] text-muted-foreground">NRR</div>
                  </div>
                </MetricTooltip>
                <MetricTooltip label="Magic Number" explanation="Efficacité commerciale" formula="Net New ARR ÷ S&M" benchmark="> 0.75">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${magicNumber >= 0.75 ? "text-emerald-600" : "text-destructive"}`}>{magicNumber.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">Magic #</div>
                  </div>
                </MetricTooltip>
                <MetricTooltip label="Rule of 40" explanation="Growth% + Margin%" formula="Croissance + Marge" benchmark="> 40">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${rule40 >= 40 ? "text-emerald-600" : "text-destructive"}`}>{rule40}</div>
                    <div className="text-[10px] text-muted-foreground">Rule 40</div>
                  </div>
                </MetricTooltip>
              </div>

              {showBenchmark && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Benchmark concurrentiel</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {benchmarks.map(b => (
                      <div key={b.name} className="rounded-lg border border-border bg-card p-3 text-xs">
                        <div className="font-semibold text-foreground">{b.name}</div>
                        <div className="text-muted-foreground mt-1">Prix: {b.price} | LTV: {b.ltv} | CAC: {b.cac}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue projection */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Projection de revenus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Clients initiaux</Label>
                  <Slider value={[clients]} onValueChange={v => setClients(v[0])} min={10} max={1000} step={10} />
                  <div className="text-lg font-bold text-foreground">{clients}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ARPU (€/mois)</Label>
                  <Slider value={[arpu]} onValueChange={v => setArpu(v[0])} min={10} max={500} step={5} />
                  <div className="text-lg font-bold text-foreground">{arpu}€</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Croissance (%/mois)</Label>
                  <Slider value={[growthRate]} onValueChange={v => setGrowthRate(v[0])} min={1} max={30} step={1} />
                  <div className="text-lg font-bold text-foreground">{growthRate}%</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Churn (%/mois)</Label>
                  <Slider value={[churnSim]} onValueChange={v => setChurnSim(v[0])} min={0} max={15} step={0.5} />
                  <div className="text-lg font-bold text-foreground">{churnSim}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{(projections[11]?.mrr / 1000).toFixed(0)}K€</div>
                  <div className="text-[10px] text-muted-foreground">MRR M12</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{(projections[11]?.arr / 1000).toFixed(0)}K€</div>
                  <div className="text-[10px] text-muted-foreground">ARR M12</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{projections[11]?.clients}</div>
                  <div className="text-[10px] text-muted-foreground">Clients M12</div>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections}>
                    <defs>
                      <linearGradient id="mrrGradPricing" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`, ""]} />
                    <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="url(#mrrGradPricing)" strokeWidth={2} name="MRR" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
