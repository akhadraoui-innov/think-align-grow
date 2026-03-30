import { useState, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Layers, Clock, Users, Star, X, ChevronRight, Puzzle, Award,
  BarChart3, FileText, LayoutGrid, List, ArrowLeft, Eye, Target, Zap,
  Grid3X3
} from "lucide-react";
import { GameCard } from "@/components/challenge/GameCard";
import { getPillarCssColor, getPillarCssColorAlpha, getPillarIconName, PHASE_LABELS } from "@/hooks/useToolkitData";
import type { Tables } from "@/integrations/supabase/types";
import dynamicIconImports from "lucide-react/dynamicIconImports";

const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ className?: string }>>>();

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const importFn = dynamicIconImports[kebab as keyof typeof dynamicIconImports];
  if (!importFn) return null;
  if (!iconCache.has(kebab)) {
    iconCache.set(kebab, lazy(importFn as () => Promise<{ default: React.ComponentType<{ className?: string }> }>));
  }
  const LazyIcon = iconCache.get(kebab)!;
  return (
    <Suspense fallback={<div className={className} />}>
      <LazyIcon className={className} />
    </Suspense>
  );
}

type CardFormat = "preview" | "game" | "gamified";

const DIFFICULTY_MAP: Record<string, { label: string; class: string }> = {
  easy: { label: "Facile", class: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  intermediate: { label: "Intermédiaire", class: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  advanced: { label: "Avancé", class: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
};

export default function PortalToolkits() {
  const [selectedToolkitId, setSelectedToolkitId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardFormat, setCardFormat] = useState<CardFormat>("preview");

  // All published toolkits
  const { data: toolkits = [], isLoading } = useQuery({
    queryKey: ["portal-toolkits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("toolkits")
        .select("*")
        .eq("status", "published")
        .order("name");
      return data || [];
    },
  });

  // Pillars for selected toolkit
  const { data: pillars = [] } = useQuery({
    queryKey: ["portal-toolkit-pillars", selectedToolkitId],
    enabled: !!selectedToolkitId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pillars")
        .select("*")
        .eq("toolkit_id", selectedToolkitId!)
        .order("sort_order");
      return data || [];
    },
  });

  // Cards for selected toolkit
  const { data: cards = [] } = useQuery({
    queryKey: ["portal-toolkit-cards", pillars.map((p: any) => p.id)],
    enabled: pillars.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .in("pillar_id", pillars.map((p: any) => p.id))
        .order("sort_order");
      return data || [];
    },
  });

  // Pillar counts per toolkit (for catalogue badges)
  const { data: pillarCounts = {} } = useQuery({
    queryKey: ["portal-toolkit-pillar-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("pillars").select("id, toolkit_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        counts[p.toolkit_id] = (counts[p.toolkit_id] || 0) + 1;
      });
      return counts;
    },
  });

  const selectedToolkit = toolkits.find((t: any) => t.id === selectedToolkitId);

  // ─── Toolkit detail view ───
  if (selectedToolkit) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main: Card browser */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Back + title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedToolkitId(null)}
                className="gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {selectedToolkit.icon_emoji || "🚀"}
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                    {selectedToolkit.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {pillars.length} pilier{pillars.length > 1 ? "s" : ""} · {cards.length} carte{cards.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Reuse the full ToolkitCardsBrowser from admin */}
            <ToolkitCardsBrowser
              cards={cards as Tables<"cards">[]}
              pillars={pillars as Tables<"pillars">[]}
            />
          </div>
        </div>

        {/* Right sidebar — always visible */}
        <aside className="w-[340px] border-l border-border/50 bg-card/50 shrink-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                    {selectedToolkit.icon_emoji || "🚀"}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedToolkit.name}</p>
                    <p className="text-xs text-muted-foreground">v{selectedToolkit.version}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedToolkitId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Description
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedToolkit.description || "—"}
                </p>
              </div>

              {/* Audience */}
              {selectedToolkit.target_audience && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" /> Public cible
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedToolkit.target_audience}</p>
                </div>
              )}

              {/* Benefits */}
              {selectedToolkit.benefits && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" /> Bénéfices
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedToolkit.benefits}</p>
                </div>
              )}

              {/* Content */}
              {selectedToolkit.content_description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" /> Contenu
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedToolkit.content_description}</p>
                </div>
              )}

              {/* Usage mode */}
              {selectedToolkit.usage_mode && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Puzzle className="h-4 w-4 text-muted-foreground" /> Mode d'utilisation
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedToolkit.usage_mode}</p>
                </div>
              )}

              {/* Nomenclature */}
              {selectedToolkit.nomenclature && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" /> Nomenclature
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedToolkit.nomenclature}</p>
                </div>
              )}

              <Separator />

              {/* Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Statistiques</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{pillars.length}</p>
                    <p className="text-[11px] text-muted-foreground">Piliers</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{cards.length}</p>
                    <p className="text-[11px] text-muted-foreground">Cartes</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{selectedToolkit.credit_cost_workshop || 0}</p>
                    <p className="text-[11px] text-muted-foreground">Crédits / Workshop</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{selectedToolkit.credit_cost_challenge || 0}</p>
                    <p className="text-[11px] text-muted-foreground">Crédits / Challenge</p>
                  </div>
                </div>
              </div>

              {/* Pillar list */}
              {pillars.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground">Piliers</h4>
                  <div className="space-y-2">
                    {pillars.map((p: any) => {
                      const count = cards.filter((c: any) => c.pillar_id === p.id).length;
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                          <div
                            className="h-4 w-4 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || "hsl(var(--primary))" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {count} cartes · Poids: {p.weight}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {Array.isArray(selectedToolkit.tags) && selectedToolkit.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedToolkit.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    );
  }

  // ─── Catalogue view ───
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Toolkits</h1>
          <p className="text-base text-muted-foreground">
            Explorez les référentiels stratégiques et leurs cartes
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-1.5 text-xs h-9"
          >
            <LayoutGrid className="h-4 w-4" /> Grille
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-1.5 text-xs h-9"
          >
            <List className="h-4 w-4" /> Liste
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {toolkits.length} toolkit{toolkits.length > 1 ? "s" : ""} disponible{toolkits.length > 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolkits.map((toolkit: any, idx: number) => (
            <motion.div
              key={toolkit.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                onClick={() => setSelectedToolkitId(toolkit.id)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {toolkit.icon_emoji || "🚀"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {toolkit.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">v{toolkit.version}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {toolkit.description || "Aucune description"}
                  </p>

                  {/* Harmonized badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs border-border">
                      <Layers className="h-3 w-3 mr-1" /> {pillarCounts[toolkit.id] || 0} piliers
                    </Badge>
                    {toolkit.difficulty_level && (() => {
                      const d = DIFFICULTY_MAP[toolkit.difficulty_level] || DIFFICULTY_MAP.intermediate;
                      return (
                        <Badge variant="outline" className={cn("text-xs border", d.class)}>
                          {d.label}
                        </Badge>
                      );
                    })()}
                    {toolkit.estimated_duration && (
                      <Badge variant="outline" className="text-xs border-border">
                        <Clock className="h-3 w-3 mr-1" /> {toolkit.estimated_duration}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    {toolkit.target_audience && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" /> {toolkit.target_audience}
                      </span>
                    )}
                    <span className="text-sm font-semibold flex items-center gap-1 text-muted-foreground/50 group-hover:text-primary transition-all ml-auto">
                      Voir <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── List view ── */
        <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
          {toolkits.map((toolkit: any, idx: number) => (
            <motion.div
              key={toolkit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setSelectedToolkitId(toolkit.id)}
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                {toolkit.icon_emoji || "🚀"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground truncate">{toolkit.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {toolkit.description || "Aucune description"}
                </p>
              </div>

              {/* Harmonized badges */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs border-border">
                  <Layers className="h-3 w-3 mr-1" /> {pillarCounts[toolkit.id] || 0}
                </Badge>
                {toolkit.difficulty_level && (() => {
                  const d = DIFFICULTY_MAP[toolkit.difficulty_level] || DIFFICULTY_MAP.intermediate;
                  return (
                    <Badge variant="outline" className={cn("text-xs border", d.class)}>
                      {d.label}
                    </Badge>
                  );
                })()}
                {toolkit.target_audience && (
                  <Badge variant="outline" className="text-xs border-border hidden lg:flex">
                    <Users className="h-3 w-3 mr-1" /> {toolkit.target_audience}
                  </Badge>
                )}
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            </motion.div>
          ))}
          {toolkits.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucun toolkit disponible.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
