import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SEGMENTS, DEFAULT_GEO_REGIONS, DEFAULT_TAM, DEFAULT_SAM, DEFAULT_SOM, type SegmentConfig, type GeoRegion } from "./businessConfig";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, MapPin, TrendingUp } from "lucide-react";

const personas = [
  { role: "DG / CEO", painPoint: "ROI de la transformation IA", budget: "Élevé", decisionTime: "3-6 mois" },
  { role: "DRH", painPoint: "Montée en compétences IA des équipes", budget: "Moyen", decisionTime: "2-4 mois" },
  { role: "DSI / CTO", painPoint: "Intégration IA dans les process", budget: "Élevé", decisionTime: "4-6 mois" },
  { role: "CDO", painPoint: "Stratégie data & IA", budget: "Moyen-Élevé", decisionTime: "2-3 mois" },
  { role: "Dir. Innovation", painPoint: "Identifier les cas d'usage IA à valeur", budget: "Moyen", decisionTime: "1-3 mois" },
  { role: "Dir. Formation", painPoint: "Moderniser l'offre formation avec l'IA", budget: "Faible-Moyen", decisionTime: "1-2 mois" },
];

const trends = [
  { name: "IA générative en entreprise", cagr: "35%", impact: "Très fort" },
  { name: "Formation professionnelle digitale", cagr: "18%", impact: "Fort" },
  { name: "Consulting-as-a-Service", cagr: "22%", impact: "Fort" },
  { name: "Low-code / No-code", cagr: "25%", impact: "Moyen" },
  { name: "Sustainability & ESG", cagr: "15%", impact: "Moyen" },
];

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(262 83% 58%)", "hsl(25 95% 53%)", "hsl(200 80% 50%)"];

export function BusinessMarketTab() {
  const [segments, setSegments] = useState<SegmentConfig[]>(DEFAULT_SEGMENTS);
  const [regions, setRegions] = useState<GeoRegion[]>(DEFAULT_GEO_REGIONS);
  const [tam, setTam] = useState(DEFAULT_TAM);
  const [sam, setSam] = useState(DEFAULT_SAM);
  const [som, setSom] = useState(DEFAULT_SOM);

  const toggleRegion = (id: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const updateWeight = (id: string, weight: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, weight } : s));
  };

  const activeMultiplier = regions.filter(r => r.active).reduce((s, r) => s + r.tamMultiplier, 0);
  const adjustedSam = Math.round(sam * activeMultiplier);

  const pieData = segments.map(s => ({ name: s.name, value: s.weight }));

  return (
    <div className="space-y-8">
      {/* TAM / SAM / SOM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">TAM / SAM / SOM</CardTitle>
          <p className="text-xs text-muted-foreground">Ajustez les valeurs de marché et activez les régions géographiques</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">TAM — Total Addressable Market (M€)</label>
                <Slider value={[tam]} onValueChange={v => setTam(v[0])} min={1000} max={200000} step={1000} />
                <div className="text-xl font-bold text-foreground">{(tam / 1000).toFixed(0)} Md€</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">SAM — Serviceable Available Market (M€)</label>
                <Slider value={[sam]} onValueChange={v => setSam(v[0])} min={100} max={20000} step={100} />
                <div className="text-xl font-bold text-foreground">{(sam / 1000).toFixed(1)} Md€ <span className="text-xs text-muted-foreground">(ajusté: {(adjustedSam / 1000).toFixed(1)} Md€)</span></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">SOM — Serviceable Obtainable Market (M€)</label>
                <Slider value={[som]} onValueChange={v => setSom(v[0])} min={1} max={500} step={5} />
                <div className="text-xl font-bold text-primary">{som} M€</div>
              </div>
            </div>

            {/* Concentric visualization */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-48 w-48 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center">
                  <div className="text-[10px] text-muted-foreground absolute top-2">TAM {(tam / 1000).toFixed(0)} Md€</div>
                  <div className="h-32 w-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <div className="text-[10px] text-muted-foreground absolute" style={{ marginTop: "-40px" }}>SAM {(adjustedSam / 1000).toFixed(1)} Md€</div>
                    <div className="h-16 w-16 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{som}M€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Geo toggles */}
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

      {/* Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Segments clients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {segments.map(s => (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.size} entreprises • Potentiel {s.potential}%</span>
                </div>
                <Slider value={[s.weight]} onValueChange={v => updateWeight(s.id, v[0])} min={0} max={100} step={5} />
                <div className="text-xs font-bold text-primary">{s.weight}%</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition</CardTitle>
          </CardHeader>
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

      {/* Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Personas décideurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {personas.map(p => (
              <div key={p.role} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                <div className="font-semibold text-sm text-foreground">{p.role}</div>
                <div className="text-xs text-muted-foreground">Pain point : {p.painPoint}</div>
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
                  <tr key={t.name} className="border-b border-border/30">
                    <td className="py-2 px-3 text-foreground">{t.name}</td>
                    <td className="py-2 px-3 text-center font-bold text-primary">{t.cagr}</td>
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
