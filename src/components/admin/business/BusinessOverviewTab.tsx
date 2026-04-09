import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_BMC, DEFAULT_SWOT, type BMCBlock, type SWOTData, type SWOTItem } from "./businessConfig";
import { MetricTooltip } from "./MetricTooltip";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Plus, X, GraduationCap, Brain, Layers, Zap, Globe, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const swotColors: Record<string, { bg: string; border: string; title: string }> = {
  strengths: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", title: "Forces" },
  weaknesses: { bg: "bg-destructive/5", border: "border-destructive/20", title: "Faiblesses" },
  opportunities: { bg: "bg-primary/5", border: "border-primary/20", title: "Opportunités" },
  threats: { bg: "bg-orange-500/5", border: "border-orange-500/20", title: "Menaces" },
};

export function BusinessOverviewTab() {
  const { data: stats } = useAdminStats();
  const [bmc, setBmc] = useState<BMCBlock[]>(DEFAULT_BMC);
  const [swot, setSwot] = useState<SWOTData>(DEFAULT_SWOT);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [newBmcItem, setNewBmcItem] = useState("");
  const [newSwotItem, setNewSwotItem] = useState("");

  const kpis = [
    { label: "Modules actifs", value: "6", icon: Layers, trend: "+2 ce trimestre" },
    { label: "Parcours Academy", value: "11", icon: GraduationCap, trend: "9 publiés" },
    { label: "Modes Simulateur", value: "7", icon: Brain, trend: "50+ scénarios" },
    { label: "Toolkits", value: String(stats?.publishedToolkits ?? 4), icon: Zap, trend: `${stats?.totalCards ?? 400}+ cartes` },
    { label: "Secteurs UCM", value: "35", icon: Globe, trend: "Tous actifs" },
    { label: "Organisations", value: String(stats?.orgCount ?? 0), icon: Users, trend: `${stats?.userCount ?? 0} users` },
  ];

  const addBmcItem = (blockId: string) => {
    if (!newBmcItem.trim()) return;
    setBmc(prev => prev.map(b => b.id === blockId ? { ...b, items: [...b.items, newBmcItem.trim()] } : b));
    setNewBmcItem("");
  };

  const removeBmcItem = (blockId: string, idx: number) => {
    setBmc(prev => prev.map(b => b.id === blockId ? { ...b, items: b.items.filter((_, i) => i !== idx) } : b));
  };

  const addSwotItemFn = (quadrant: keyof SWOTData) => {
    if (!newSwotItem.trim()) return;
    const item: SWOTItem = { id: `${quadrant}-${Date.now()}`, text: newSwotItem.trim(), priority: "medium" };
    setSwot(prev => ({ ...prev, [quadrant]: [...prev[quadrant], item] }));
    setNewSwotItem("");
  };

  const removeSwotItem = (quadrant: keyof SWOTData, id: string) => {
    setSwot(prev => ({ ...prev, [quadrant]: prev[quadrant].filter(i => i.id !== id) }));
  };

  const cyclePriority = (quadrant: keyof SWOTData, id: string) => {
    const cycle: Record<string, "high" | "medium" | "low"> = { high: "medium", medium: "low", low: "high" };
    setSwot(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].map(i => i.id === id ? { ...i, priority: cycle[i.priority] } : i),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Vue d'ensemble stratégique</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Synthèse du positionnement GROWTHINNOV : plateforme SaaS + CaaS d'IA appliquée à la transformation stratégique, 
            couvrant formation, simulation, conseil et gamification pour les organisations en transition IA.
          </p>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <MetricTooltip key={k.label} label={k.label} explanation={`Nombre actuel : ${k.value}. ${k.trend}`} benchmark="Donnée en temps réel depuis la base">
            <Card className="bg-background/60 backdrop-blur-xl border-border/50 hover:shadow-md hover:shadow-primary/5 transition-all">
              <CardContent className="p-4 text-center">
                <k.icon className="h-5 w-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                <div className="text-[10px] text-primary/70 mt-1">{k.trend}</div>
              </CardContent>
            </Card>
          </MetricTooltip>
        ))}
      </motion.div>

      {/* BMC */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Model Canvas</CardTitle>
            <p className="text-xs text-muted-foreground">Double-cliquez sur un bloc pour éditer, cliquez sur × pour retirer</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {bmc.map(block => (
                <div
                  key={block.id}
                  className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2 min-h-[140px] cursor-pointer hover:border-primary/30 transition-colors"
                  onDoubleClick={() => setEditingBlock(editingBlock === block.id ? null : block.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{block.title}</span>
                    <Badge variant="outline" className="text-[10px]">{block.items.length}</Badge>
                  </div>
                  <ul className="space-y-1">
                    <AnimatePresence>
                      {block.items.map((item, idx) => (
                        <motion.li key={idx} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex items-start gap-1 text-[11px] text-muted-foreground group">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                          {editingBlock === block.id && (
                            <button onClick={() => removeBmcItem(block.id, idx)} className="opacity-0 group-hover:opacity-100 text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  {editingBlock === block.id && (
                    <div className="flex gap-1 mt-2">
                      <Input
                        value={newBmcItem}
                        onChange={e => setNewBmcItem(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addBmcItem(block.id)}
                        placeholder="Ajouter…"
                        className="h-7 text-xs"
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => addBmcItem(block.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SWOT */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analyse SWOT</CardTitle>
            <p className="text-xs text-muted-foreground">Cliquez sur la priorité pour la changer, double-cliquez sur un quadrant pour ajouter</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(swotColors) as (keyof SWOTData)[]).map(quadrant => {
                const cfg = swotColors[quadrant];
                return (
                  <div
                    key={quadrant}
                    className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}
                    onDoubleClick={() => setEditingBlock(editingBlock === quadrant ? null : quadrant)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{cfg.title}</span>
                      <Badge variant="outline" className="text-[10px]">{swot[quadrant].length}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <AnimatePresence>
                        {swot[quadrant].map(item => (
                          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 group">
                            <button
                              onClick={() => cyclePriority(quadrant, item.id)}
                              className={`text-[9px] px-1.5 py-0.5 rounded border ${priorityColors[item.priority]} font-medium`}
                            >
                              {item.priority === "high" ? "H" : item.priority === "medium" ? "M" : "L"}
                            </button>
                            <span className="text-xs text-foreground/80 flex-1">{item.text}</span>
                            <button
                              onClick={() => removeSwotItem(quadrant, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {editingBlock === quadrant && (
                      <div className="flex gap-1 mt-2">
                        <Input
                          value={newSwotItem}
                          onChange={e => setNewSwotItem(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addSwotItemFn(quadrant)}
                          placeholder="Nouvel élément…"
                          className="h-7 text-xs"
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => addSwotItemFn(quadrant)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Synthèse */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Synthèse</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Positionnement unique sur le marché français : seule plateforme intégrant IA + formation + simulation + conseil en un seul outil. 
            Le modèle hybride SaaS + CaaS + Crédits IA offre 3 leviers de monétisation complémentaires. 
            Les risques principaux (dépendance LLM, notoriété) sont mitigés par la diversification technologique et le contenu propriétaire.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
