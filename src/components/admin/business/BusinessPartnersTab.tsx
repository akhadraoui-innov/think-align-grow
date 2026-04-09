import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_PARTNER_TIERS, DEFAULT_PLANS, type PartnerTier } from "./businessConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Handshake, CheckCircle, Plus, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const partnerModels = [
  { id: "reseller", name: "Revendeur", description: "Revend la plateforme sous sa marque commerciale", defaultCommission: 15, volume: 10 },
  { id: "integrator", name: "Intégrateur", description: "Intègre GROWTHINNOV dans ses missions de conseil", defaultCommission: 20, volume: 5 },
  { id: "whitelabel", name: "White-label", description: "Plateforme en marque blanche avec branding custom", defaultCommission: 10, volume: 3 },
];

interface PipelinePartner {
  id: string;
  name: string;
}

export function BusinessPartnersTab() {
  const [tiers, setTiers] = useState<PartnerTier[]>(DEFAULT_PARTNER_TIERS);
  const [models, setModels] = useState(partnerModels);
  const [pipeline, setPipeline] = useState<Record<string, PipelinePartner[]>>({
    Prospect: [{ id: "p1", name: "Cabinet Alpha" }, { id: "p2", name: "ESN Beta" }, { id: "p3", name: "OF Gamma" }],
    Négociation: [{ id: "p4", name: "Consulting Delta" }],
    Actif: [{ id: "p5", name: "Partenaire Epsilon" }],
  });
  const [newPartner, setNewPartner] = useState<Record<string, string>>({ Prospect: "", Négociation: "", Actif: "" });

  // Revenue mix: Pro + Enterprise + Credits
  const proPrice = DEFAULT_PLANS.find(p => p.id === "pro")?.price || 149;
  const entAvgPrice = 2000;
  const creditAvgRevenue = 15;

  const updateCommission = (id: string, commission: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, defaultCommission: commission } : m));
  };

  const updateVolume = (id: string, volume: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, volume } : m));
  };

  const updateTierCommission = (id: string, commission: number) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, commission } : t));
  };

  const updateTierMinRevenue = (id: string, minRevenue: number) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, minRevenue } : t));
  };

  const addTierBenefit = (tierId: string, benefit: string) => {
    if (!benefit.trim()) return;
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, benefits: [...t.benefits, benefit.trim()] } : t));
  };

  const removeTierBenefit = (tierId: string, idx: number) => {
    setTiers(prev => prev.map(t => t.id === tierId ? { ...t, benefits: t.benefits.filter((_, i) => i !== idx) } : t));
  };

  const addPartnerToPipeline = (stage: string) => {
    const name = newPartner[stage]?.trim();
    if (!name) return;
    setPipeline(prev => ({ ...prev, [stage]: [...(prev[stage] || []), { id: `p-${Date.now()}`, name }] }));
    setNewPartner(prev => ({ ...prev, [stage]: "" }));
  };

  const removePartnerFromPipeline = (stage: string, id: string) => {
    setPipeline(prev => ({ ...prev, [stage]: prev[stage].filter(p => p.id !== id) }));
  };

  // Multi-product revenue share
  const revenueData = models.map(m => {
    const proRev = m.volume * proPrice * 12;
    const entRev = Math.round(m.volume * 0.2) * entAvgPrice * 12;
    const creditRev = m.volume * creditAvgRevenue * 12;
    const totalRev = proRev + entRev + creditRev;
    return {
      name: m.name,
      revenue: Math.round(totalRev * (1 - m.defaultCommission / 100)),
      commission: Math.round(totalRev * (m.defaultCommission / 100)),
      total: totalRev,
    };
  });

  const pipelineStages = ["Prospect", "Négociation", "Actif"];

  return (
    <div className="space-y-8">
      {/* Partner models */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                  <div className="text-xs text-muted-foreground">Projection revenue Y1 (multi-produit)</div>
                  <div className="text-xl font-bold text-foreground">
                    {(revenueData.find(r => r.name === m.name)?.total || 0) > 0
                      ? `${((revenueData.find(r => r.name === m.name)?.total || 0) / 1000).toFixed(0)}K€`
                      : "0€"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue share par modèle (multi-produit)</CardTitle>
          <p className="text-xs text-muted-foreground">Inclut Pro + Enterprise + Crédits IA</p>
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

      {/* Tiers — editable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Programme partenaire</CardTitle>
          <p className="text-xs text-muted-foreground">Ajustez les commissions et avantages par tier</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(tier => (
              <div key={tier.id} className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={tier.id === "platinum" ? "default" : "outline"} className="text-xs">{tier.name}</Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Commission %</label>
                  <Slider value={[tier.commission]} onValueChange={v => updateTierCommission(tier.id, v[0])} min={5} max={50} step={1} />
                  <div className="text-lg font-bold text-primary">{tier.commission}%</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Revenu min (€/an)</label>
                  <Input type="number" value={tier.minRevenue} onChange={e => updateTierMinRevenue(tier.id, Number(e.target.value))} className="h-7 text-xs border-dashed" />
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-foreground/80 group">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      <span className="flex-1">{b}</span>
                      <button onClick={() => removeTierBenefit(tier.id, i)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-1">
                  <Input
                    placeholder="Nouvel avantage…"
                    className="h-7 text-xs"
                    onKeyDown={e => { if (e.key === "Enter") { addTierBenefit(tier.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline interactive Kanban */}
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
                  <AnimatePresence>
                    {pipeline[stage]?.map(p => (
                      <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground flex items-center justify-between group">
                        <span>{p.name}</span>
                        <button onClick={() => removePartnerFromPipeline(stage, p.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="h-3 w-3" /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="flex gap-1">
                  <Input
                    value={newPartner[stage] || ""}
                    onChange={e => setNewPartner(prev => ({ ...prev, [stage]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addPartnerToPipeline(stage)}
                    placeholder="Ajouter…"
                    className="h-7 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => addPartnerToPipeline(stage)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
