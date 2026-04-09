import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SCENARIOS, DEFAULT_COHORTS, type ScenarioPreset, type CohortRow } from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, BarChart3, TrendingUp, AlertTriangle, Wallet } from "lucide-react";
import { motion } from "framer-motion";

export function BusinessSimulatorTab() {
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>(DEFAULT_SCENARIOS);
  const [activeScenarios, setActiveScenarios] = useState<string[]>(["realistic"]);
  const [selectedScenario, setSelectedScenario] = useState("realistic");
  const [cohorts, setCohorts] = useState<CohortRow[]>(DEFAULT_COHORTS);

  // Token cost & runway
  const [tokenCostPer1M, setTokenCostPer1M] = useState(5);
  const [tokensPerUserMonth, setTokensPerUserMonth] = useState(50000);
  const [initialCash, setInitialCash] = useState(200000);
  const [infraCost, setInfraCost] = useState(3000);

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const updateScenarioField = (id: string, field: keyof ScenarioPreset, value: number) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const current = scenarios.find(s => s.id === selectedScenario) || scenarios[1];

  // Generate projections
  const months = 36;
  const allProjections = Array.from({ length: months }, (_, m) => {
    const point: Record<string, any> = { month: `M${m + 1}` };
    scenarios.filter(s => activeScenarios.includes(s.id)).forEach(sc => {
      const starterM = Math.round(sc.starterClients * Math.pow(1 + sc.growthRate / 100, m));
      const proM = Math.round(sc.proClients * Math.pow(1 + (sc.growthRate - sc.churnRate) / 100, m));
      const entM = Math.round(sc.enterpriseClients * Math.pow(1 + sc.growthRate / 200, m));
      const conversion = Math.round(starterM * sc.conversionRate / 100);
      const totalPro = proM + conversion;
      const totalPaying = totalPro + entM;

      // Revenue breakdown
      const revSaaS = totalPro * 149;
      const revEnt = entM * 2000;
      const revCredits = totalPaying * 15; // avg credit revenue
      const totalRevenue = revSaaS + revEnt + revCredits;

      // COGS
      const aiTokenCost = totalPaying * (tokensPerUserMonth / 1_000_000) * tokenCostPer1M;
      const totalCOGS = infraCost + aiTokenCost;

      // Gross margin
      const grossMargin = totalRevenue - totalCOGS;

      // OPEX
      const opex = sc.fixedCosts;

      // EBITDA
      const ebitda = grossMargin - opex;

      point[`mrr_${sc.id}`] = totalRevenue;
      point[`revenue_saas_${sc.id}`] = revSaaS;
      point[`revenue_ent_${sc.id}`] = revEnt;
      point[`revenue_credits_${sc.id}`] = revCredits;
      point[`cogs_${sc.id}`] = totalCOGS;
      point[`gross_margin_${sc.id}`] = grossMargin;
      point[`opex_${sc.id}`] = opex;
      point[`ebitda_${sc.id}`] = ebitda;
      point[`clients_${sc.id}`] = starterM + totalPro + entM;
    });
    return point;
  });

  // Cumulative revenue
  const cumulativeProjections = allProjections.map((p, idx) => {
    const cp: Record<string, any> = { month: p.month };
    activeScenarios.forEach(id => {
      cp[`cumul_${id}`] = allProjections.slice(0, idx + 1).reduce((sum, curr) => sum + (curr[`mrr_${id}`] || 0), 0);
    });
    return cp;
  });

  // Break-even & runway
  const breakEvenMonth = allProjections.findIndex(p => (p[`ebitda_${current.id}`] || 0) > 0) + 1;
  const runwayMonths = (() => {
    let cash = initialCash;
    for (let i = 0; i < months; i++) {
      const ebitda = allProjections[i]?.[`ebitda_${current.id}`] || 0;
      cash += ebitda;
      if (cash <= 0) return i + 1;
    }
    return months;
  })();

  // Sensitivity analysis (tornado)
  const baseBreakeven = breakEvenMonth;
  const sensitivityParams = [
    { name: "Churn", field: "churnRate" as const, delta: current.churnRate * 0.2 },
    { name: "Croissance", field: "growthRate" as const, delta: current.growthRate * 0.2 },
    { name: "Conversion", field: "conversionRate" as const, delta: current.conversionRate * 0.2 },
    { name: "Coût fixe", field: "fixedCosts" as const, delta: current.fixedCosts * 0.2 },
  ];

  const tornadoData = sensitivityParams.map(param => {
    const calcBE = (override: number) => {
      const sc = { ...current, [param.field]: override };
      for (let m = 0; m < months; m++) {
        const starterM = Math.round(sc.starterClients * Math.pow(1 + sc.growthRate / 100, m));
        const proM = Math.round(sc.proClients * Math.pow(1 + (sc.growthRate - sc.churnRate) / 100, m));
        const entM = Math.round(sc.enterpriseClients * Math.pow(1 + sc.growthRate / 200, m));
        const totalPro = proM + Math.round(starterM * sc.conversionRate / 100);
        const totalPaying = totalPro + entM;
        const rev = totalPro * 149 + entM * 2000 + totalPaying * 15;
        const costs = infraCost + totalPaying * (tokensPerUserMonth / 1_000_000) * tokenCostPer1M + sc.fixedCosts;
        if (rev - costs > 0) return m + 1;
      }
      return months;
    };
    const low = calcBE((current[param.field] as number) - param.delta);
    const high = calcBE((current[param.field] as number) + param.delta);
    return { name: param.name, low: low - baseBreakeven, high: high - baseBreakeven, base: baseBreakeven };
  });

  // P&L M12
  const m12 = allProjections[11] || {};
  const m12Rev = m12[`mrr_${current.id}`] || 0;
  const m12COGS = m12[`cogs_${current.id}`] || 0;
  const m12GM = m12[`gross_margin_${current.id}`] || 0;
  const m12EBITDA = m12[`ebitda_${current.id}`] || 0;

  const exportCSV = () => {
    const headers = ["Month", ...activeScenarios.flatMap(id => [`Revenue_${id}`, `COGS_${id}`, `EBITDA_${id}`])];
    const rows = allProjections.map(p => [
      p.month,
      ...activeScenarios.flatMap(id => [p[`mrr_${id}`] || 0, p[`cogs_${id}`] || 0, p[`ebitda_${id}`] || 0]),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "business-simulation.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const updateCohort = (idx: number, field: keyof CohortRow, value: number) => {
    setCohorts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-8">
      {/* Scenario selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Scénarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scenarios.map(sc => (
                <div
                  key={sc.id}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${selectedScenario === sc.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-primary/30"}`}
                  onClick={() => setSelectedScenario(sc.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sc.color }} />
                      <span className="font-semibold text-sm text-foreground">{sc.name}</span>
                    </div>
                    <Switch checked={activeScenarios.includes(sc.id)} onCheckedChange={() => toggleScenario(sc.id)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Starter:</span> <span className="font-medium text-foreground">{sc.starterClients}</span></div>
                    <div><span className="text-muted-foreground">Pro:</span> <span className="font-medium text-foreground">{sc.proClients}</span></div>
                    <div><span className="text-muted-foreground">Enterprise:</span> <span className="font-medium text-foreground">{sc.enterpriseClients}</span></div>
                    <div><span className="text-muted-foreground">Croissance:</span> <span className="font-medium text-foreground">{sc.growthRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scenario editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres — {current.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Clients Starter", field: "starterClients" as const, min: 0, max: 5000, step: 50 },
              { label: "Clients Pro", field: "proClients" as const, min: 0, max: 1000, step: 10 },
              { label: "Clients Enterprise", field: "enterpriseClients" as const, min: 0, max: 100, step: 1 },
              { label: "Conversion trial→paid (%)", field: "conversionRate" as const, min: 1, max: 30, step: 1 },
              { label: "Churn mensuel (%)", field: "churnRate" as const, min: 0, max: 15, step: 0.5 },
              { label: "Croissance (%/mois)", field: "growthRate" as const, min: 1, max: 40, step: 1 },
              { label: "Coûts fixes (€/mois)", field: "fixedCosts" as const, min: 5000, max: 100000, step: 1000 },
              { label: "Coût variable (€/client)", field: "variableCostPerClient" as const, min: 1, max: 20, step: 0.5 },
            ].map(param => (
              <div key={param.field} className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{param.label}</label>
                <Slider
                  value={[current[param.field] as number]}
                  onValueChange={v => updateScenarioField(current.id, param.field, v[0])}
                  min={param.min} max={param.max} step={param.step}
                />
                <div className="text-lg font-bold text-foreground">
                  {param.field === "fixedCosts" ? `${((current[param.field] as number) / 1000).toFixed(0)}K€` :
                   param.field === "variableCostPerClient" ? `${current[param.field]}€` :
                   ["churnRate", "growthRate", "conversionRate"].includes(param.field) ? `${current[param.field]}%` :
                   String(current[param.field])}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token cost & Runway */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Coûts IA & Trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Coût token ($/1M)</label>
                <Slider value={[tokenCostPer1M]} onValueChange={v => setTokenCostPer1M(v[0])} min={0.1} max={30} step={0.1} />
                <div className="text-lg font-bold text-foreground">${tokenCostPer1M}</div>
                <div className="flex gap-1 flex-wrap">
                  {[{ label: "Gemini Flash", v: 0.15 }, { label: "GPT-4o mini", v: 0.6 }, { label: "GPT-4o", v: 5 }, { label: "Claude", v: 15 }].map(p => (
                    <button key={p.label} onClick={() => setTokenCostPer1M(p.v)} className="text-[9px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground hover:border-primary/30">{p.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tokens/user/mois</label>
                <Slider value={[tokensPerUserMonth]} onValueChange={v => setTokensPerUserMonth(v[0])} min={10000} max={500000} step={10000} />
                <div className="text-lg font-bold text-foreground">{(tokensPerUserMonth / 1000).toFixed(0)}K</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Trésorerie initiale (€)</label>
                <Slider value={[initialCash]} onValueChange={v => setInitialCash(v[0])} min={10000} max={2000000} step={10000} />
                <div className="text-lg font-bold text-foreground">{(initialCash / 1000).toFixed(0)}K€</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Infra cloud (€/mois)</label>
                <Slider value={[infraCost]} onValueChange={v => setInfraCost(v[0])} min={500} max={20000} step={500} />
                <div className="text-lg font-bold text-foreground">{(infraCost / 1000).toFixed(1)}K€</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "MRR M12", value: `${(m12Rev / 1000).toFixed(0)}K€`, color: "text-primary" },
          { label: "ARR M12", value: `${(m12Rev * 12 / 1000000).toFixed(1)}M€`, color: "text-foreground" },
          { label: "Marge brute", value: `${m12Rev > 0 ? Math.round(m12GM / m12Rev * 100) : 0}%`, color: m12GM > 0 ? "text-emerald-500" : "text-destructive" },
          { label: "EBITDA M12", value: `${(m12EBITDA / 1000).toFixed(0)}K€`, color: m12EBITDA > 0 ? "text-emerald-500" : "text-destructive" },
          { label: "Break-even", value: breakEvenMonth > 0 ? `M${breakEvenMonth}` : "N/A", color: "text-foreground" },
          { label: "Runway", value: `${runwayMonths} mois`, color: runwayMonths < 6 ? "text-destructive" : runwayMonths < 12 ? "text-yellow-600" : "text-emerald-500" },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-background/60 backdrop-blur-xl">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {runwayMonths < 6 && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <div className="text-sm font-semibold text-destructive">Alerte Runway</div>
            <div className="text-xs text-muted-foreground">Trésorerie épuisée en {runwayMonths} mois. Accélérez le pipeline Enterprise ou réduisez le burn rate.</div>
          </div>
        </div>
      )}

      {/* MRR comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Projection MRR — 36 mois</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs gap-1">
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={allProjections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={5} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`]} />
                <Legend />
                {scenarios.filter(s => activeScenarios.includes(s.id)).map(sc => (
                  <Line key={sc.id} type="monotone" dataKey={`mrr_${sc.id}`} stroke={sc.color} strokeWidth={2} dot={false} name={sc.name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus cumulés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeProjections}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={5} />
                <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${(v / 1000000).toFixed(2)}M€`]} />
                {scenarios.filter(s => activeScenarios.includes(s.id)).map(sc => (
                  <Area key={sc.id} type="monotone" dataKey={`cumul_${sc.id}`} stroke={sc.color} fill={sc.color} fillOpacity={0.1} strokeWidth={2} name={sc.name} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* P&L structuré */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">P&L structuré — {current.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Ligne</th>
                  {[3, 6, 12, 18, 24, 36].map(m => (
                    <th key={m} className="text-center py-2 px-3 font-medium text-muted-foreground">M{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Revenus SaaS", key: `revenue_saas_${current.id}`, bold: false },
                  { label: "Revenus Enterprise", key: `revenue_ent_${current.id}`, bold: false },
                  { label: "Revenus Crédits", key: `revenue_credits_${current.id}`, bold: false },
                  { label: "Revenue total", key: `mrr_${current.id}`, bold: true },
                  { label: "COGS (infra + IA)", key: `cogs_${current.id}`, bold: false },
                  { label: "Marge brute", key: `gross_margin_${current.id}`, bold: true },
                  { label: "OPEX", key: `opex_${current.id}`, bold: false },
                  { label: "EBITDA", key: `ebitda_${current.id}`, bold: true },
                ].map(row => (
                  <tr key={row.label} className={`border-b border-border/30 ${row.bold ? "bg-muted/20" : ""}`}>
                    <td className={`py-2 px-3 ${row.bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{row.label}</td>
                    {[2, 5, 11, 17, 23, 35].map(idx => {
                      const val = allProjections[idx]?.[row.key] || 0;
                      return (
                        <td key={idx} className={`py-2 px-3 text-center ${row.bold ? "font-bold" : ""} ${val < 0 ? "text-destructive" : "text-foreground"}`}>
                          {(val / 1000).toFixed(0)}K€
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity tornado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analyse de sensibilité (±20%)</CardTitle>
          <p className="text-xs text-muted-foreground">Impact sur le break-even (mois) par rapport au scénario de base (M{baseBreakeven})</p>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tornadoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="low" fill="hsl(142 76% 36%)" name="-20%" radius={[4, 0, 0, 4]} />
                <Bar dataKey="high" fill="hsl(var(--destructive))" name="+20%" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cohort retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rétention par cohorte</CardTitle>
          <p className="text-xs text-muted-foreground">Cliquez sur une valeur pour la modifier</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cohorte</th>
                  {["M0", "M1", "M2", "M3", "M6", "M12"].map(h => (
                    <th key={h} className="text-center py-2 px-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c, idx) => (
                  <tr key={c.cohort} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium text-foreground">{c.cohort}</td>
                    {(["m0", "m1", "m2", "m3", "m6", "m12"] as (keyof CohortRow)[]).map(field => {
                      const val = c[field] as number;
                      const opacity = val / 100;
                      return (
                        <td key={field} className="py-1 px-1 text-center">
                          <div className="relative">
                            <div className="absolute inset-0 rounded" style={{ backgroundColor: `hsl(var(--primary))`, opacity: opacity * 0.3 }} />
                            <Input
                              type="number"
                              value={val}
                              onChange={e => updateCohort(idx, field, Number(e.target.value))}
                              className="w-14 h-7 text-xs text-center mx-auto border-none bg-transparent relative z-10 font-bold"
                            />
                          </div>
                        </td>
                      );
                    })}
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
