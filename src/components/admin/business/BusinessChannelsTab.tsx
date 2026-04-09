import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_CHANNELS, DEFAULT_ROADMAP, type ChannelConfig, type RoadmapPhase } from "./businessConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BusinessChannelsTab() {
  const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
  const [funnel, setFunnel] = useState([
    { stage: "Awareness", rate: 100 },
    { stage: "Intérêt", rate: 40 },
    { stage: "Trial", rate: 15 },
    { stage: "Conversion", rate: 8 },
    { stage: "Expansion", rate: 3 },
  ]);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>(DEFAULT_ROADMAP);

  const totalShare = channels.reduce((s, c) => s + c.share, 0);

  const updateShare = (id: string, share: number) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, share } : c));
  };

  const updateConversion = (id: string, conversionRate: number) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, conversionRate } : c));
  };

  const updateCac = (id: string, cac: number) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, cac } : c));
  };

  const updateFunnelRate = (idx: number, rate: number) => {
    setFunnel(prev => prev.map((s, i) => i === idx ? { ...s, rate } : s));
  };

  const addChannel = () => {
    const id = `ch-${Date.now()}`;
    setChannels(prev => [...prev, { id, name: "Nouveau canal", share: 0, conversionRate: 5, cac: 200, color: "hsl(200 80% 50%)" }]);
  };

  const removeChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  // Rebalance to 100%
  const rebalance = () => {
    const factor = 100 / totalShare;
    setChannels(prev => prev.map(c => ({ ...c, share: Math.round(c.share * factor) })));
  };

  // Roadmap editing
  const addRoadmapItem = (phaseId: string, item: string) => {
    if (!item.trim()) return;
    setRoadmap(prev => prev.map(p => p.id === phaseId ? { ...p, items: [...p.items, item.trim()] } : p));
  };

  const removeRoadmapItem = (phaseId: string, idx: number) => {
    setRoadmap(prev => prev.map(p => p.id === phaseId ? { ...p, items: p.items.filter((_, i) => i !== idx) } : p));
  };

  const updateRoadmapTitle = (phaseId: string, title: string) => {
    setRoadmap(prev => prev.map(p => p.id === phaseId ? { ...p, title } : p));
  };

  return (
    <div className="space-y-8">
      {/* Channel distribution */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Répartition des canaux</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Total :
                  <span className={`font-bold ml-1 ${totalShare === 100 ? "text-emerald-500" : "text-destructive"}`}>{totalShare}%</span>
                  {totalShare !== 100 && (
                    <Button size="sm" variant="ghost" onClick={rebalance} className="text-xs text-primary ml-2 h-5 px-2">Rééquilibrer à 100%</Button>
                  )}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addChannel} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />Canal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.map(ch => (
              <div key={ch.id} className="grid grid-cols-12 gap-4 items-center group">
                <div className="col-span-3 md:col-span-2">
                  <Input value={ch.name} onChange={e => setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, name: e.target.value } : c))} className="text-sm font-medium text-foreground h-7 border-none shadow-none p-0" />
                </div>
                <div className="col-span-4 md:col-span-4">
                  <Slider value={[ch.share]} onValueChange={v => updateShare(ch.id, v[0])} min={0} max={100} step={5} />
                </div>
                <div className="col-span-1 text-sm font-bold text-foreground">{ch.share}%</div>
                <div className="col-span-1">
                  <Input type="number" value={ch.conversionRate} onChange={e => updateConversion(ch.id, Number(e.target.value))} className="h-7 text-xs w-14 border-dashed text-center" />
                </div>
                <div className="col-span-2">
                  <Input type="number" value={ch.cac} onChange={e => updateCac(ch.id, Number(e.target.value))} className="h-7 text-xs w-16 border-dashed text-center" />
                  <div className="text-[10px] text-muted-foreground">CAC €</div>
                </div>
                <div className="col-span-1">
                  <button onClick={() => removeChannel(ch.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funnel de conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {funnel.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-2">
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center min-w-[100px]">
                  <div className="text-xs font-medium text-foreground">{stage.stage}</div>
                  <Input type="number" value={stage.rate} onChange={e => updateFunnelRate(i, Number(e.target.value))} className="w-14 h-7 text-xs text-center mx-auto mt-1 border-dashed" />
                  <div className="text-[10px] text-muted-foreground mt-0.5">%</div>
                </div>
                {i < funnel.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
          <div className="h-48 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="%" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap — editable */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Roadmap Go-to-Market</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmap.map(phase => (
            <Card key={phase.id} className={`border ${phase.color}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{phase.phase}</Badge>
                  <Input value={phase.title} onChange={e => updateRoadmapTitle(phase.id, e.target.value)} className="font-semibold text-sm text-foreground border-none shadow-none h-7 p-0 flex-1" />
                </div>
                <ul className="space-y-1.5">
                  <AnimatePresence>
                    {phase.items.map((item, i) => (
                      <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs text-muted-foreground group">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeRoadmapItem(phase.id, i)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="h-3 w-3" /></button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="flex gap-1">
                  <Input
                    placeholder="Ajouter…"
                    className="h-7 text-xs"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        addRoadmapItem(phase.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
