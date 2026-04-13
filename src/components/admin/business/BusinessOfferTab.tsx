import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SEGMENT_LABELS, type ModuleConfig } from "./businessConfig";
import { GraduationCap, Brain, Presentation, Gamepad2, Lightbulb, Layers } from "lucide-react";

const moduleIcons: Record<string, any> = {
  academy: GraduationCap, simulator: Brain, workshop: Presentation,
  challenge: Gamepad2, ucm: Lightbulb, toolkits: Layers,
};

const attractivityDots = (level: number) => "●".repeat(level) + "○".repeat(3 - level);

interface Props {
  modules: ModuleConfig[];
  onModulesChange: (modules: ModuleConfig[]) => void;
}

export function BusinessOfferTab({ modules, onModulesChange }: Props) {
  const toggleModule = (id: string) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const cycleAttractivity = (moduleId: string, segment: string) => {
    onModulesChange(modules.map(m =>
      m.id === moduleId
        ? { ...m, segments: { ...m.segments, [segment]: (m.segments[segment] % 3) + 1 } }
        : m
    ));
  };

  const segments = Object.keys(SEGMENT_LABELS);

  return (
    <div className="space-y-8">
      {/* Module cards */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Catalogue produit</h3>
        <p className="text-xs text-muted-foreground mb-4">Activez/désactivez les modules et ajustez les segments cibles</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => {
            const Icon = moduleIcons[mod.id] || Layers;
            return (
              <Card key={mod.id} className={`transition-all ${mod.active ? "border-primary/30 bg-background" : "opacity-50 border-border/30"}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{mod.name}</div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{mod.delivery}</Badge>
                      </div>
                    </div>
                    <Switch checked={mod.active} onCheckedChange={() => toggleModule(mod.id)} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
                  <div className="text-xs font-medium text-primary">{mod.priceRange}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Attractivity matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Matrice Produit × Segment</CardTitle>
          <p className="text-xs text-muted-foreground">Cliquez sur une cellule pour changer l'attractivité (●○○ → ●●○ → ●●●)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Module</th>
                  {segments.map(s => (
                    <th key={s} className="text-center py-2 px-3 font-medium text-muted-foreground">{SEGMENT_LABELS[s]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.filter(m => m.active).map(mod => (
                  <tr key={mod.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-foreground">{mod.name}</td>
                    {segments.map(s => (
                      <td
                        key={s}
                        className="py-2 px-3 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => cycleAttractivity(mod.id, s)}
                      >
                        <span className={`font-mono ${mod.segments[s] === 3 ? "text-primary" : mod.segments[s] === 2 ? "text-yellow-600" : "text-muted-foreground"}`}>
                          {attractivityDots(mod.segments[s])}
                        </span>
                      </td>
                    ))}
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
