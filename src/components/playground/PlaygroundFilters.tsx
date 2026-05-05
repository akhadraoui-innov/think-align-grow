import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X, RotateCcw } from "lucide-react";
import { PHASE_LABELS } from "@/hooks/useToolkitData";
import type { Tables } from "@/integrations/supabase/types";

type Pillar = Tables<"pillars">;

export type FiltersState = {
  search: string;
  pillarIds: string[];
  phases: string[];
  difficulties: string[];
  withImageOnly: boolean;
};

const DIFFICULTIES = ["easy", "intermediate", "advanced"];
const PHASES = ["foundations", "model", "growth", "execution"];

export function PlaygroundFilters({
  pillars,
  filters,
  setFilters,
  onClose,
  accent,
  counts,
}: {
  pillars: Pillar[];
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  onClose: () => void;
  accent: string;
  counts: { byPillar: Record<string, number>; byPhase: Record<string, number> };
}) {
  const togglePillar = (id: string) => {
    setFilters({
      ...filters,
      pillarIds: filters.pillarIds.includes(id)
        ? filters.pillarIds.filter((x) => x !== id)
        : [...filters.pillarIds, id],
    });
  };
  const togglePhase = (p: string) => {
    setFilters({
      ...filters,
      phases: filters.phases.includes(p) ? filters.phases.filter((x) => x !== p) : [...filters.phases, p],
    });
  };
  const toggleDiff = (d: string) => {
    setFilters({
      ...filters,
      difficulties: filters.difficulties.includes(d)
        ? filters.difficulties.filter((x) => x !== d)
        : [...filters.difficulties, d],
    });
  };
  const reset = () =>
    setFilters({ search: "", pillarIds: [], phases: [], difficulties: [], withImageOnly: false });

  return (
    <aside className="w-72 flex-shrink-0 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-wider">Filtres</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={reset} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Piliers</h4>
          <div className="flex flex-wrap gap-1.5">
            {pillars.map((p) => {
              const active = filters.pillarIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePillar(p.id)}
                  className="px-2.5 py-1 rounded-full border text-xs font-medium transition-all"
                  style={{
                    background: active ? p.color || accent : "transparent",
                    color: active ? "#fff" : "inherit",
                    borderColor: p.color || accent,
                  }}
                >
                  {p.name}{" "}
                  <span className="opacity-70">({counts.byPillar[p.id] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Phases</h4>
          <div className="flex flex-wrap gap-1.5">
            {PHASES.map((p) => {
              const active = filters.phases.includes(p);
              return (
                <Badge
                  key={p}
                  variant={active ? "default" : "outline"}
                  onClick={() => togglePhase(p)}
                  className="cursor-pointer"
                  style={active ? { background: accent } : undefined}
                >
                  {PHASE_LABELS[p] || p} ({counts.byPhase[p] || 0})
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Difficulté</h4>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((d) => {
              const active = filters.difficulties.includes(d);
              return (
                <Badge
                  key={d}
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleDiff(d)}
                  className="cursor-pointer capitalize"
                >
                  {d}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor="with-img" className="text-xs">Avec illustration</Label>
          <Switch
            id="with-img"
            checked={filters.withImageOnly}
            onCheckedChange={(v) => setFilters({ ...filters, withImageOnly: v })}
          />
        </div>
      </div>
    </aside>
  );
}
