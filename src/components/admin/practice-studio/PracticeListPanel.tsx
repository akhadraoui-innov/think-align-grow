import { useMemo, useState } from "react";
import { Search, Plus, Globe2, Building2, UserCheck, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODE_REGISTRY, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import type { AdminPractice } from "@/hooks/useAdminPractices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  practices: AdminPractice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

function useAllPracticeStats() {
  return useQuery({
    queryKey: ["all-practice-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_practice_sessions")
        .select("practice_id, score, completed_at");
      const map: Record<string, { total: number; avg: number; scores: number[] }> = {};
      for (const s of data ?? []) {
        const id = s.practice_id;
        if (!id) continue;
        if (!map[id]) map[id] = { total: 0, avg: 0, scores: [] };
        map[id].total++;
        if (typeof s.score === "number") map[id].scores.push(s.score);
      }
      Object.values(map).forEach(v => {
        v.avg = v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0;
      });
      return map;
    },
    staleTime: 30_000,
  });
}

const UNIVERSE_DOT: Record<string, string> = {
  conversation: "bg-blue-500",
  technical: "bg-emerald-500",
  creative: "bg-violet-500",
  analytical: "bg-amber-500",
  decision: "bg-rose-500",
  pedagogical: "bg-cyan-500",
  immersive: "bg-fuchsia-500",
};

export function PracticeListPanel({ practices, selectedId, onSelect, onCreate }: Props) {
  const [search, setSearch] = useState("");
  const [universeFilter, setUniverseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: stats = {} } = useAllPracticeStats();

  const filtered = useMemo(() => {
    return practices.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (universeFilter !== "all") {
        const def = MODE_REGISTRY[p.practice_type];
        if (!def || def.universe !== universeFilter) return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [practices, search, universeFilter, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pratiques · {practices.length}
          </h2>
          <Button size="sm" variant="ghost" onClick={onCreate} className="h-7 px-2">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="pl-7 h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Select value={universeFilter} onValueChange={setUniverseFilter}>
            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Univers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous univers</SelectItem>
              {Object.entries(UNIVERSE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map(p => {
            const def = MODE_REGISTRY[p.practice_type];
            const active = p.id === selectedId;
            const dot = UNIVERSE_DOT[def?.universe ?? ""] ?? "bg-muted";
            const stat = stats[p.id];
            const diffusion = p.is_public ? "public" : p.organization_id ? "org" : "assigned";
            const DiffusionIcon = diffusion === "public" ? Globe2 : diffusion === "org" ? Building2 : UserCheck;
            const diffusionLabel = diffusion === "public" ? "Public" : diffusion === "org" ? "Org" : "Assigné";
            const diffusionColor = diffusion === "public"
              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              : diffusion === "org"
                ? "border-blue-500/40 text-blue-600 dark:text-blue-400"
                : "border-amber-500/40 text-amber-600 dark:text-amber-400";

            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`w-full text-left rounded-lg p-2.5 transition-all border ${
                  active
                    ? "bg-primary/5 border-primary/40 shadow-sm"
                    : "border-transparent hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dot}`} title={def?.universe} />
                  <p className="text-xs font-medium leading-tight line-clamp-2 flex-1">{p.title}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                    {def?.label ?? p.practice_type}
                  </Badge>
                  <Badge
                    variant={p.status === "published" ? "default" : "secondary"}
                    className="text-[9px] px-1.5 py-0 h-4"
                  >
                    {p.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 gap-0.5 ${diffusionColor}`}>
                    <DiffusionIcon className="h-2 w-2" /> {diffusionLabel}
                  </Badge>
                  {stat && stat.total > 0 && (
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] text-muted-foreground font-mono">
                      <Activity className="h-2.5 w-2.5" />
                      {stat.total}{stat.avg ? ` · ${stat.avg}%` : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Aucune pratique</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
