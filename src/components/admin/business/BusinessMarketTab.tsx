import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SEGMENTS, DEFAULT_GEO_REGIONS, DEFAULT_TAM, DEFAULT_SAM, DEFAULT_SOM,
  DEFAULT_COMPETITORS, DEFAULT_RISKS, DEFAULT_PERSONAS, DEFAULT_TRENDS,
  RISK_CATEGORY_LABELS, RISK_CATEGORY_COLORS,
  type SegmentConfig, type GeoRegion, type Competitor, type BusinessRisk, type PersonaConfig, type TrendConfig,
} from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { Users, MapPin, TrendingUp, Shield, Plus, Trash2, X, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(262 83% 58%)", "hsl(25 95% 53%)", "hsl(200 80% 50%)"];

export function BusinessMarketTab() {
  const [segments, setSegments] = useState<SegmentConfig[]>(DEFAULT_SEGMENTS);
  const [regions, setRegions] = useState<GeoRegion[]>(DEFAULT_GEO_REGIONS);
  const [tam, setTam] = useState(DEFAULT_TAM);
  const [sam, setSam] = useState(DEFAULT_SAM);
  const [som, setSom] = useState(DEFAULT_SOM);
  const [competitors, setCompetitors] = useState<Competitor[]>(DEFAULT_COMPETITORS);
  const [risks, setRisks] = useState<BusinessRisk[]>(DEFAULT_RISKS);
  const [personas, setPersonas] = useState<PersonaConfig[]>(DEFAULT_PERSONAS);
  const [trends, setTrends] = useState<TrendConfig[]>(DEFAULT_TRENDS);

  // Build vs Buy
  const [bvbDevs, setBvbDevs] = useState(5);
  const [bvbSalary, setBvbSalary] = useState(65000);
  const [bvbDuration, setBvbDuration] = useState(18);
  const [bvbMaintenance, setBvbMaintenance] = useState(30);

  const toggleRegion = (id: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const updateWeight = (id: string, weight: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, weight } : s));
  };

  const activeMultiplier = regions.filter(r => r.active).reduce((s, r) => s + r.tamMultiplier, 0);
  const adjustedSam = Math.round(sam * activeMultiplier);
  const pieData = segments.map(s => ({ name: s.name, value: s.weight }));

  // Risk score
  const avgRiskScore = risks.length > 0 ? Math.round(risks.reduce((s, r) => s + (r.probability * r.impact) / 100, 0) / risks.length) : 0;

  // Build vs Buy
  const buildCostY1 = bvbDevs * bvbSalary;
  const buildCostY2 = buildCostY1 * (bvbMaintenance / 100);
  const buildCostY3 = buildCostY2;
  const buildTotal = buildCostY1 + buildCostY2 + buildCostY3;
  const buyTotal = 149 * 12 * 3 * bvbDevs; // assuming per-seat for the team

  const addCompetitor = () => {
    setCompetitors(prev => [...prev, { id: `c-${Date.now()}`, name: "Nouveau", price: 50, features: 5, category: "À définir" }]);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
  };

  const updateCompetitor = (id: string, field: keyof Competitor, value: any) => {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateRisk = (id: string, field: keyof BusinessRisk, value: any) => {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRisk = () => {
    setRisks(prev => [...prev, { id: `r-${Date.now()}`, name: "Nouveau risque", category: "market", probability: 50, impact: 50, mitigation: "" }]);
  };

  const updatePersona = (id: string, field: keyof PersonaConfig, value: string) => {
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateTrend = (id: string, field: keyof TrendConfig, value: string) => {
    setTrends(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-8">
      {/* TAM / SAM / SOM */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">TAM / SAM / SOM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">TAM (M€)</label>
                  <Slider value={[tam]} onValueChange={v => setTam(v[0])} min={1000} max={200000} step={1000} />
                  <div className="text-xl font-bold text-foreground">{(tam / 1000).toFixed(0)} Md€</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">SAM (M€)</label>
                  <Slider value={[sam]} onValueChange={v => setSam(v[0])} min={100} max={20000} step={100} />
                  <div className="text-xl font-bold text-foreground">{(sam / 1000).toFixed(1)} Md€ <span className="text-xs text-muted-foreground">(ajusté: {(adjustedSam / 1000).toFixed(1)} Md€)</span></div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">SOM (M€)</label>
                  <Slider value={[som]} onValueChange={v => setSom(v[0])} min={1} max={500} step={5} />
                  <div className="text-xl font-bold text-primary">{som} M€</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center">
                    <span className="absolute top-3 text-[10px] text-muted-foreground font-medium">TAM {(tam / 1000).toFixed(0)}Md€</span>
                    <div className="h-32 w-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="absolute text-[10px] text-muted-foreground font-medium" style={{ marginTop: "-30px" }}>SAM</span>
                      <div className="h-16 w-16 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{som}M€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Expansion géographique</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {regions.map(r => (
                  <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2">
                    <Switch checked={r.active} onCheckedChange={() => toggleRegion(r.id)} />
                    <span className="text-xs text-foreground">{r.name}</span>
                    <Badge variant="outline" className="text-[10px]">×{r.tamMultiplier}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Competitive matrix */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Matrice concurrentielle</CardTitle>
              <Button size="sm" variant="outline" onClick={addCompetitor} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Positionnement Prix (€/user/mois) × Richesse fonctionnelle (1-10)</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="features" type="number" domain={[0, 10]} name="Features" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: "Fonctionnalités", position: "bottom", fontSize: 10 }} />
                    <YAxis dataKey="price" type="number" name="Prix" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: "€/mois", angle: -90, position: "insideLeft", fontSize: 10 }} />
                    <ZAxis range={[60, 200]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: any, name: string) => [v, name]} />
                    <Scatter data={competitors} fill="hsl(var(--muted-foreground))">
                      {competitors.map((c, i) => (
                        <Cell key={c.id} fill={c.isUs ? "hsl(var(--primary))" : COLORS[i % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {competitors.map(c => (
                  <div key={c.id} className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${c.isUs ? "border-primary/30 bg-primary/5" : "border-border/50"}`}>
                    <Input value={c.name} onChange={e => updateCompetitor(c.id, "name", e.target.value)} className="h-6 text-xs border-none shadow-none flex-1" />
                    <Input type="number" value={c.price} onChange={e => updateCompetitor(c.id, "price", Number(e.target.value))} className="w-16 h-6 text-xs text-center border-dashed" />
                    <span className="text-muted-foreground">€</span>
                    <Input type="number" value={c.features} onChange={e => updateCompetitor(c.id, "features", Number(e.target.value))} className="w-12 h-6 text-xs text-center border-dashed" min={1} max={10} />
                    <span className="text-muted-foreground">/10</span>
                    {!c.isUs && (
                      <button onClick={() => removeCompetitor(c.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Segments clients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {segments.map(s => (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.size} ent. • {s.potential}%</span>
                </div>
                <Slider value={[s.weight]} onValueChange={v => updateWeight(s.id, v[0])} min={0} max={100} step={5} />
                <div className="text-xs font-bold text-primary">{s.weight}%</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Répartition</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disruptions & Risks */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Risques & Disruptions</CardTitle>
              <div className="flex items-center gap-3">
                <MetricTooltip label="Score de risque" explanation="Moyenne (probabilité × impact / 100) sur tous les risques identifiés" benchmark="< 30 = maîtrisé">
                  <div className={`text-lg font-bold ${avgRiskScore > 40 ? "text-destructive" : avgRiskScore > 25 ? "text-yellow-600" : "text-emerald-500"}`}>
                    Score: {avgRiskScore}
                  </div>
                </MetricTooltip>
                <Button size="sm" variant="outline" onClick={addRisk} className="text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />Ajouter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {risks.map(risk => (
                <motion.div key={risk.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] ${RISK_CATEGORY_COLORS[risk.category]}`}>{RISK_CATEGORY_LABELS[risk.category]}</Badge>
                    <Input value={risk.name} onChange={e => updateRisk(risk.id, "name", e.target.value)} className="flex-1 h-7 text-xs font-medium border-none shadow-none" />
                    <button onClick={() => setRisks(prev => prev.filter(r => r.id !== risk.id))} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Probabilité</label>
                      <Slider value={[risk.probability]} onValueChange={v => updateRisk(risk.id, "probability", v[0])} min={0} max={100} step={5} />
                      <span className="text-xs font-bold text-foreground">{risk.probability}%</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Impact</label>
                      <Slider value={[risk.impact]} onValueChange={v => updateRisk(risk.id, "impact", v[0])} min={0} max={100} step={5} />
                      <span className="text-xs font-bold text-foreground">{risk.impact}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Mitigation</label>
                    <Textarea value={risk.mitigation} onChange={e => updateRisk(risk.id, "mitigation", e.target.value)} className="text-xs min-h-[40px] mt-1" />
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${(risk.probability * risk.impact / 100) > 40 ? "text-destructive" : "text-emerald-500"}`}>
                      Score: {Math.round(risk.probability * risk.impact / 100)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Build vs Buy */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Build vs Buy — Calculateur prospect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Développeurs nécessaires</label>
                <Slider value={[bvbDevs]} onValueChange={v => setBvbDevs(v[0])} min={1} max={20} step={1} />
                <div className="text-lg font-bold text-foreground">{bvbDevs}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Salaire moyen (€/an)</label>
                <Slider value={[bvbSalary]} onValueChange={v => setBvbSalary(v[0])} min={30000} max={120000} step={5000} />
                <div className="text-lg font-bold text-foreground">{(bvbSalary / 1000).toFixed(0)}K€</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Durée dev (mois)</label>
                <Slider value={[bvbDuration]} onValueChange={v => setBvbDuration(v[0])} min={6} max={36} step={3} />
                <div className="text-lg font-bold text-foreground">{bvbDuration} mois</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Maintenance (%/an)</label>
                <Slider value={[bvbMaintenance]} onValueChange={v => setBvbMaintenance(v[0])} min={10} max={50} step={5} />
                <div className="text-lg font-bold text-foreground">{bvbMaintenance}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center">
                <div className="text-sm font-semibold text-foreground mb-2">🔨 Build (interne)</div>
                <div className="text-3xl font-bold text-destructive">{(buildTotal / 1000).toFixed(0)}K€</div>
                <div className="text-xs text-muted-foreground mt-1">TCO sur 3 ans</div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Y1: {(buildCostY1 / 1000).toFixed(0)}K€ | Y2: {(buildCostY2 / 1000).toFixed(0)}K€ | Y3: {(buildCostY3 / 1000).toFixed(0)}K€
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                <div className="text-sm font-semibold text-foreground mb-2">🛒 Buy (GROWTHINNOV)</div>
                <div className="text-3xl font-bold text-emerald-500">{(buyTotal / 1000).toFixed(0)}K€</div>
                <div className="text-xs text-muted-foreground mt-1">TCO sur 3 ans</div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  {bvbDevs} licences × 149€/mois × 36 mois
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className={`text-lg font-bold ${buildTotal > buyTotal ? "text-emerald-500" : "text-destructive"}`}>
                {buildTotal > buyTotal ? `Économie de ${((buildTotal - buyTotal) / 1000).toFixed(0)}K€ avec GROWTHINNOV` : "Build plus avantageux dans ce scénario"}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Personas décideurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {personas.map(p => (
              <div key={p.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                <Input value={p.role} onChange={e => updatePersona(p.id, "role", e.target.value)} className="font-semibold text-sm text-foreground border-none shadow-none h-7 p-0" />
                <div className="flex items-start gap-1">
                  <span className="text-xs text-muted-foreground shrink-0">Pain:</span>
                  <Input value={p.painPoint} onChange={e => updatePersona(p.id, "painPoint", e.target.value)} className="text-xs border-none shadow-none h-6 p-0" />
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px]">Budget: {p.budget}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.decisionTime}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Tendances marché</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tendance</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">CAGR</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Impact</th>
                </tr>
              </thead>
              <tbody>
                {trends.map(t => (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="py-2 px-3">
                      <Input value={t.name} onChange={e => updateTrend(t.id, "name", e.target.value)} className="h-6 text-xs border-none shadow-none p-0" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Input value={t.cagr} onChange={e => updateTrend(t.id, "cagr", e.target.value)} className="w-16 h-6 text-xs text-center mx-auto border-dashed font-bold text-primary" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant={t.impact === "Très fort" ? "default" : "outline"} className="text-[10px]">{t.impact}</Badge>
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
