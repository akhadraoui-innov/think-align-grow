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
    staleTime: 5 * 60_000,
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

  // Pillar counts per toolkit (RPC for perf)
  const { data: pillarCounts = {} } = useQuery({
    queryKey: ["portal-toolkit-pillar-counts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_pillar_counts_per_toolkit");
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => { counts[r.toolkit_id] = r.count; });
      return counts;
    },
  });

  const selectedToolkit = toolkits.find((t: any) => t.id === selectedToolkitId);

  const pillarMap = useMemo(() => {
    const m = new Map<string, any>();
    pillars.forEach((p: any) => m.set(p.id, p));
    return m;
  }, [pillars]);

  const cardsByPillar = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    pillars.forEach((p: any) => { grouped[p.id] = []; });
    cards.forEach((c: any) => { if (grouped[c.pillar_id]) grouped[c.pillar_id].push(c); });
    return grouped;
  }, [pillars, cards]);

  const renderCard = (card: any) => {
    const pillar = pillarMap.get(card.pillar_id);
    const slug = pillar?.slug || "";
    const dbCol = pillar?.color || null;
    const pillarColor = getPillarCssColor(slug, dbCol);
    const pillarColorAlpha = (a: number) => getPillarCssColorAlpha(slug, dbCol, a);
    const pillarIconName = pillar ? getPillarIconName(pillar.slug, pillar.icon_name) : "Circle";

    if (cardFormat === "game") {
      return (
        <GameCard key={card.id} card={card} pillar={pillar} readOnly />
      );
    }

    if (cardFormat === "gamified") {
      return (
        <div
          key={card.id}
          className="relative rounded-3xl overflow-hidden flex flex-col min-h-[300px] w-64"
          style={{ background: `linear-gradient(145deg, ${pillarColor}, ${pillarColorAlpha(0.85)})` }}
        >
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />
          <div className="relative p-6 flex flex-col items-center text-center flex-1">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                {PHASE_LABELS[card.phase] || card.phase}
              </span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-inner">
              <DynamicIcon name={pillarIconName} className="h-8 w-8 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">
              {pillar?.name || "Pilier"}
            </span>
            <h3 className="font-display font-black text-base uppercase tracking-tight leading-tight text-white mb-3 line-clamp-3">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-xs text-white/60 italic line-clamp-2">{card.subtitle}</p>
            )}
          </div>
        </div>
      );
    }

    // ── Preview (default) ──
    return (
      <div key={card.id} className="rounded-2xl bg-card border border-border/60 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
        <div className="h-2 w-full shrink-0" style={{ background: pillarColor }} />
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="font-black uppercase tracking-widest rounded-full text-[10px] px-2.5 py-0.5"
              style={{ background: pillarColorAlpha(0.08), color: pillarColor }}
            >
              {pillar?.name || "Pilier"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {PHASE_LABELS[card.phase] || card.phase}
            </span>
          </div>

          <h3 className="font-display font-black uppercase tracking-tight leading-tight text-lg mb-2 text-foreground">
            {card.title}
          </h3>

          {card.subtitle && (
            <p className="text-sm text-muted-foreground italic mb-2">{card.subtitle}</p>
          )}

          {card.definition && (
            <p className="text-sm text-foreground/80 leading-relaxed mb-3 line-clamp-3">
              {card.definition}
            </p>
          )}

          {card.action && (
            <div className="rounded-xl p-3 mb-3" style={{ background: pillarColorAlpha(0.04), borderLeft: `3px solid ${pillarColor}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5" style={{ color: pillarColor }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: pillarColor }}>
                  {card.step_name || "Action"}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">{card.action}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-muted-foreground">
            {card.valorization > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" /> {card.valorization} pts
              </span>
            )}
            {card.difficulty && (
              <Badge variant="outline" className="text-[10px]">{card.difficulty}</Badge>
            )}
            {card.kpi && (
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" /> KPI
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Toolkit detail view ───
  if (selectedToolkit) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main: Card browser */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Back + title + format selector */}
            <div className="flex items-center justify-between">
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

              {/* Format selector */}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Select value={cardFormat} onValueChange={(v: CardFormat) => setCardFormat(v)}>
                  <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preview">Détaillée</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="gamified">Gamifié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cards grouped by pillar */}
            {pillars.map((pillar: any) => {
              const pillarCards = cardsByPillar[pillar.id] || [];
              if (pillarCards.length === 0) return null;
              return (
                <div key={pillar.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: pillar.color || "hsl(var(--primary))" }}
                    />
                    <h3 className="text-lg font-bold text-foreground">{pillar.name}</h3>
                    <Badge variant="outline" className="text-xs">{pillarCards.length} cartes</Badge>
                  </div>
                  <div className={cn(
                    cardFormat === "game" || cardFormat === "gamified"
                      ? "flex flex-wrap gap-5"
                      : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                  )}>
                    {pillarCards.map(renderCard)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar — always visible */}
        <aside className="w-[340px] border-l border-border/50 bg-card/50 shrink-0 overflow-hidden">
          <ScrollArea className="h-full">
            {/* Hero with cover */}
            <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {selectedToolkit.cover_image_url ? (
                <img
                  src={`${selectedToolkit.cover_image_url}?v=${new Date(selectedToolkit.updated_at || selectedToolkit.created_at).getTime()}`}
                  alt={selectedToolkit.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-60">
                  {selectedToolkit.icon_emoji || "🚀"}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 bg-black/40 hover:bg-black/60 text-white backdrop-blur"
                onClick={() => setSelectedToolkitId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-lg font-bold text-foreground drop-shadow line-clamp-2">{selectedToolkit.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">v{selectedToolkit.version}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">

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
        /* ── Grid view : aligned with Academy paths ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolkits.map((toolkit: any, idx: number) => {
            const diff = toolkit.difficulty_level ? DIFFICULTY_MAP[toolkit.difficulty_level] : null;
            return (
              <motion.div
                key={toolkit.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-xl transition-all group overflow-hidden flex flex-col h-full"
                  onClick={() => setSelectedToolkitId(toolkit.id)}
                >
                  {/* Cover */}
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5">
                    {toolkit.cover_image_url ? (
                      <img
                        src={`${toolkit.cover_image_url}?v=${new Date(toolkit.updated_at || toolkit.created_at).getTime()}`}
                        alt={toolkit.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-60">
                        {toolkit.icon_emoji || "🚀"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    {/* Badges top-right */}
                    <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                      {diff && (
                        <span className="text-[9px] bg-black/85 text-white uppercase tracking-wider font-bold px-2 py-1 rounded backdrop-blur">
                          {diff.label}
                        </span>
                      )}
                      <span className="text-[9px] bg-black/85 text-white uppercase tracking-wider font-bold px-2 py-1 rounded backdrop-blur inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {pillarCounts[toolkit.id] || 0}
                      </span>
                    </div>
                    {/* Title bottom */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-base font-bold text-white drop-shadow-lg line-clamp-2">{toolkit.name}</p>
                      <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5">v{toolkit.version}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <CardContent className="p-5 flex flex-col gap-3 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                      {toolkit.description || "Aucune description"}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
                      {toolkit.target_audience ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate min-w-0">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{toolkit.target_audience}</span>
                        </span>
                      ) : <span />}
                      <span className="text-xs font-semibold flex items-center gap-1 text-muted-foreground/60 group-hover:text-primary transition-all shrink-0">
                        Voir <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
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
              <div className="h-12 w-16 rounded-lg overflow-hidden flex items-center justify-center bg-muted shrink-0 relative">
                {toolkit.cover_image_url ? (
                  <img
                    src={`${toolkit.cover_image_url}?v=${new Date(toolkit.updated_at || toolkit.created_at).getTime()}`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">{toolkit.icon_emoji || "🚀"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground truncate">{toolkit.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {toolkit.description || "Aucune description"}
                </p>
              </div>

              {/* Badges */}
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
