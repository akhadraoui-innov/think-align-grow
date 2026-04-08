import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { DEFAULT_CHANNELS, type ChannelConfig } from "./businessConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowRight } from "lucide-react";

const funnelStages = [
  { stage: "Awareness", rate: 100 },
  { stage: "Intérêt", rate: 40 },
  { stage: "Trial", rate: 15 },
  { stage: "Conversion", rate: 8 },
  { stage: "Expansion", rate: 3 },
];

const roadmap = [
  { phase: "M1-M3", title: "Fondations", items: ["Site web & SEO", "Contenu thought leadership", "Premiers partenaires", "Early adopters"], color: "bg-primary/10 border-primary/30" },
  { phase: "M4-M6", title: "Accélération", items: ["Campagnes inbound", "Programme partenaires", "Événements sectoriels", "Case studies"], color: "bg-emerald-500/10 border-emerald-500/30" },
  { phase: "M7-M12", title: "Scale", items: ["Expansion géographique", "Enterprise ABM", "Marketplace", "Affiliation"], color: "bg-purple-500/10 border-purple-500/30" },
];

export function BusinessChannelsTab() {
  const [channels, setChannels] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
  const [funnel, setFunnel] = useState(funnelStages);

  const totalShare = channels.reduce((s, c) => s + c.share, 0);

  const updateShare = (id: string, share: number) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, share } : c));
  };

  const updateConversion = (id: string, conversionRate: number) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, conversionRate } : c));
  };

  const updateFunnelRate = (idx: number, rate: number) => {
    setFunnel(prev => prev.map((s, i) => i === idx ? { ...s, rate } : s));
  };

  return (
    <div className="space-y-8">
      {/* Channel distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition des canaux</CardTitle>
          <p className="text-xs text-muted-foreground">
            Ajustez les % pour chaque canal — Total actuel :
            <span className={`font-bold ml-1 ${totalShare === 100 ? "text-emerald-500" : "text-destructive"}`}>{totalShare}%</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map(ch => (
            <div key={ch.id} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 md:col-span-2">
                <div className="text-sm font-medium text-foreground">{ch.name}</div>
              </div>
              <div className="col-span-4 md:col-span-5">
                <Slider value={[ch.share]} onValueChange={v => updateShare(ch.id, v[0])} min={0} max={100} step={5} />
              </div>
              <div className="col-span-1 text-sm font-bold text-foreground">{ch.share}%</div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Conv.</div>
                <Input
                  type="number"
                  value={ch.conversionRate}
                  onChange={e => updateConversion(ch.id, Number(e.target.value))}
                  className="h-7 text-xs w-16 border-dashed"
                />
              </div>
              <div className="col-span-2 md:col-span-2 text-right">
                <div className="text-xs text-muted-foreground">CAC</div>
                <div className="text-sm font-bold text-foreground">{ch.cac}€</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funnel de conversion</CardTitle>
          <p className="text-xs text-muted-foreground">Cliquez sur un taux pour le modifier</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {funnel.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-2">
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center min-w-[100px]">
                  <div className="text-xs font-medium text-foreground">{stage.stage}</div>
                  <Input
                    type="number"
                    value={stage.rate}
                    onChange={e => updateFunnelRate(i, Number(e.target.value))}
                    className="w-14 h-7 text-xs text-center mx-auto mt-1 border-dashed"
                  />
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

      {/* Roadmap */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Roadmap Go-to-Market</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmap.map(phase => (
            <Card key={phase.phase} className={`border ${phase.color}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{phase.phase}</Badge>
                  <span className="font-semibold text-sm text-foreground">{phase.title}</span>
                </div>
                <ul className="space-y-1.5">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
