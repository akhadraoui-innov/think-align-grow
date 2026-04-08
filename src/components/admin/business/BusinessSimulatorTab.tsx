import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SCENARIOS, DEFAULT_PLANS, type ScenarioPreset } from "./businessConfig";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, BarChart3, TrendingUp } from "lucide-react";

export function BusinessSimulatorTab() {
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>(DEFAULT_SCENARIOS);
  const [activeScenarios, setActiveScenarios] = useState<string[]>(["realistic"]);
  const [selectedScenario, setSelectedScenario] = useState("realistic");

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const updateScenarioField = (id: string, field: keyof ScenarioPreset, value: number) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const current = scenarios.find(s => s.id === selectedScenario) || scenarios[1];

  // Generate projections for all active scenarios
  const months = 36;
  const allProjections = Array.from({ length: months }, (_, m) => {
    const point: Record<string, any> = { month: `M${m + 1}` };
    scenarios.filter(s => activeScenarios.includes(s.id)).forEach(sc => {
      const starterM = Math.round(sc.starterClients * Math.pow(1 + sc.growthRate / 100, m));
      const proM = Math.round(sc.proClients * Math.pow(1 + (sc.growthRate - sc.churnRate) / 100, m));
      const entM = Math.round(sc.enterpriseClients * Math.pow(1 + sc.growthRate / 200, m));
      const conversion = Math.round(starterM * sc.conversionRate / 100);
      const totalPro = proM + conversion;
      const mrr = totalPro * 149 + entM * 2000;
      const costs = sc.fixedCosts + (totalPro + entM) * sc.variableCostPerClient;
      point[`mrr_${sc.id}`] = mrr;
      point[`arr_${sc.id}`] = mrr * 12;
      point[`profit_${sc.id}`] = mrr - costs;
      point[`clients_${sc.id}`] = starterM + totalPro + entM;
    });
    return point;
  });

  // Break-even for current scenario
  const breakEvenMonth = allProjections.findIndex(p => (p[`profit_${current.id}`] || 0) > 0) + 1;

  // P&L for current scenario at M12
  const m12 = allProjections[11] || {};
  const m12Mrr = m12[`mrr_${current.id}`] || 0;
  const m12Costs = current.fixedCosts + ((m12[`clients_${current.id}`] || 0) * current.variableCostPerClient);
  const m12Margin = m12Mrr - m12Costs;

  const exportCSV = () => {
    const headers = ["Month", ...activeScenarios.flatMap(id => [`MRR_${id}`, `ARR_${id}`, `Profit_${id}`])];
    const rows = allProjections.map(p => [
      p.month,
      ...activeScenarios.flatMap(id => [p[`mrr_${id}`] || 0, p[`arr_${id}`] || 0, p[`profit_${id}`] || 0]),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "business-simulation.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Scenario selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Scénarios</CardTitle>
          <p className="text-xs text-muted-foreground">Activez les scénarios à comparer et cliquez pour éditer les paramètres</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {param.field === "fixedCosts" ? `${(current[param.field] as number / 1000).toFixed(0)}K€` :
                   param.field === "variableCostPerClient" ? `${current[param.field]}€` :
                   param.field === "churnRate" || param.field === "growthRate" || param.field === "conversionRate" ? `${current[param.field]}%` :
                   current[param.field]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-background/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{(m12Mrr / 1000).toFixed(0)}K€</div>
            <div className="text-xs text-muted-foreground">MRR M12</div>
          </CardContent>
        </Card>
        <Card className="bg-background/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{(m12Mrr * 12 / 1000000).toFixed(1)}M€</div>
            <div className="text-xs text-muted-foreground">ARR M12</div>
          </CardContent>
        </Card>
        <Card className="bg-background/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${m12Margin > 0 ? "text-emerald-500" : "text-destructive"}`}>{(m12Margin / 1000).toFixed(0)}K€</div>
            <div className="text-xs text-muted-foreground">Marge M12</div>
          </CardContent>
        </Card>
        <Card className="bg-background/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{breakEvenMonth > 0 ? `M${breakEvenMonth}` : "N/A"}</div>
            <div className="text-xs text-muted-foreground">Break-even</div>
          </CardContent>
        </Card>
        <Card className="bg-background/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{m12Mrr > 0 ? `${Math.round(m12Margin / m12Mrr * 100)}%` : "0%"}</div>
            <div className="text-xs text-muted-foreground">Marge nette</div>
          </CardContent>
        </Card>
      </div>

      {/* MRR comparison chart */}
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

      {/* P&L */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profit & Loss — {current.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allProjections.filter((_, i) => i % 3 === 2)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`]} />
                <Bar dataKey={`mrr_${current.id}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenus" />
                <Bar dataKey={`profit_${current.id}`} fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
