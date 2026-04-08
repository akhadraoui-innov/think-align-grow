import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_PLANS, DEFAULT_CREDITS, type PlanConfig, type CreditAction } from "./businessConfig";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Check, Plus, Trash2 } from "lucide-react";

export function BusinessPricingTab() {
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS);
  const [credits, setCredits] = useState<CreditAction[]>(DEFAULT_CREDITS);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  // Unit economics sliders
  const [cac, setCac] = useState(300);
  const [ltv, setLtv] = useState(3600);
  const [churn, setChurn] = useState(5);

  const ltvCacRatio = ltv / cac;
  const paybackMonths = Math.round(cac / (ltv / 24));

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

  const updateCreditCost = (id: string, cost: number) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, cost } : c));
  };

  const avgRevenuePerUser = credits.reduce((sum, c) => sum + c.cost * c.avgUsagePerUser, 0);

  return (
    <div className="space-y-8">
      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Grille tarifaire</h3>
        <p className="text-xs text-muted-foreground mb-4">Cliquez sur un prix pour l'éditer, double-cliquez sur un plan pour modifier ses features</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={`relative ${plan.highlighted ? "border-primary shadow-lg shadow-primary/5" : "border-border/50"}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Recommandé</Badge>
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <h4 className="font-bold text-foreground">{plan.name}</h4>
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
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlighted ? "default" : "outline"} size="sm" className="w-full text-xs">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
                      <Input
                        type="number"
                        value={c.cost}
                        onChange={e => updateCreditCost(c.id, Number(e.target.value))}
                        className="w-16 h-7 text-xs text-center mx-auto border-dashed"
                      />
                    </td>
                    <td className="py-2 px-3 text-center text-muted-foreground">{c.avgUsagePerUser}×/mois</td>
                    <td className="py-2 px-3 text-center font-medium text-primary">{c.cost * c.avgUsagePerUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unit Economics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{ltvCacRatio.toFixed(1)}x</div>
              <div className="text-xs text-muted-foreground">LTV/CAC</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{paybackMonths} mois</div>
              <div className="text-xs text-muted-foreground">Payback period</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${ltvCacRatio >= 3 ? "text-emerald-500" : "text-destructive"}`}>
                {ltvCacRatio >= 3 ? "✓ Sain" : "⚠ À risque"}
              </div>
              <div className="text-xs text-muted-foreground">Santé ratio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{Math.round(1 / (churn / 100))} mois</div>
              <div className="text-xs text-muted-foreground">Durée de vie client</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`, ""]}
                />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="url(#mrrGradient)" strokeWidth={2} name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
