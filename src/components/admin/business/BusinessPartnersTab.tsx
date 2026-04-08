import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DEFAULT_PARTNER_TIERS, type PartnerTier } from "./businessConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Handshake, CheckCircle, ArrowRight } from "lucide-react";

const partnerModels = [
  { id: "reseller", name: "Revendeur", description: "Revend la plateforme sous sa marque commerciale", defaultCommission: 15, volume: 10 },
  { id: "integrator", name: "Intégrateur", description: "Intègre GROWTHINNOV dans ses missions de conseil", defaultCommission: 20, volume: 5 },
  { id: "whitelabel", name: "White-label", description: "Plateforme en marque blanche avec branding custom", defaultCommission: 10, volume: 3 },
];

const pipelineStages = ["Prospect", "Négociation", "Actif"];

export function BusinessPartnersTab() {
  const [tiers] = useState<PartnerTier[]>(DEFAULT_PARTNER_TIERS);
  const [models, setModels] = useState(partnerModels);
  const [pipeline] = useState<Record<string, string[]>>({
    Prospect: ["Cabinet Alpha", "ESN Beta", "OF Gamma"],
    Négociation: ["Consulting Delta"],
    Actif: ["Partenaire Epsilon"],
  });

  const updateCommission = (id: string, commission: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, defaultCommission: commission } : m));
  };

  const updateVolume = (id: string, volume: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, volume } : m));
  };

  const revenueData = models.map(m => ({
    name: m.name,
    revenue: m.volume * 149 * 12 * (1 - m.defaultCommission / 100),
    commission: m.volume * 149 * 12 * (m.defaultCommission / 100),
  }));

  return (
    <div className="space-y-8">
      {/* Partner models with sliders */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Handshake className="h-5 w-5 text-primary" />Modèles de partenariat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map(m => (
            <Card key={m.id}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground">{m.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Commission %</label>
                  <Slider value={[m.defaultCommission]} onValueChange={v => updateCommission(m.id, v[0])} min={5} max={50} step={1} />
                  <div className="text-lg font-bold text-primary">{m.defaultCommission}%</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Partenaires estimés (Y1)</label>
                  <Slider value={[m.volume]} onValueChange={v => updateVolume(m.id, v[0])} min={1} max={50} step={1} />
                  <div className="text-lg font-bold text-foreground">{m.volume}</div>
                </div>
                <div className="pt-3 border-t border-border/50 text-center">
                  <div className="text-xs text-muted-foreground">Projection revenue Y1</div>
                  <div className="text-xl font-bold text-foreground">
                    {(m.volume * 149 * 12 / 1000).toFixed(0)}K€
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue share par modèle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}K€`]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Revenu net" />
                <Bar dataKey="commission" fill="hsl(25 95% 53%)" radius={[6, 6, 0, 0]} name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Programme partenaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(tier => (
              <div key={tier.id} className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={tier.id === "platinum" ? "default" : "outline"} className="text-xs">{tier.name}</Badge>
                  <span className="text-lg font-bold text-primary">{tier.commission}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Revenu min : {tier.minRevenue > 0 ? `${(tier.minRevenue / 1000).toFixed(0)}K€/an` : "Aucun"}
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline mini-kanban */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline partenaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {pipelineStages.map(stage => (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{stage}</span>
                  <Badge variant="outline" className="text-[10px]">{pipeline[stage]?.length || 0}</Badge>
                </div>
                <div className="space-y-1.5 min-h-[80px] rounded-lg border border-dashed border-border/50 p-2">
                  {pipeline[stage]?.map((p, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground">{p}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
