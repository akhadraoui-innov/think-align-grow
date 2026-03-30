import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Layers, BookOpen, Clock, Target, Users, Star, X,
  ChevronRight, Puzzle, Award, BarChart3, FileText
} from "lucide-react";

const phaseLabels: Record<string, string> = {
  foundations: "Fondations",
  growth: "Croissance",
  optimization: "Optimisation",
  mastery: "Maîtrise",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-600",
  intermediate: "bg-amber-500/15 text-amber-600",
  advanced: "bg-rose-500/15 text-rose-600",
};

export default function PortalToolkits() {
  const [selectedToolkitId, setSelectedToolkitId] = useState<string | null>(null);

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

  // Cards for selected toolkit (via pillars)
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

  const selectedToolkit = toolkits.find((t: any) => t.id === selectedToolkitId);

  // Group cards by pillar
  const cardsByPillar = pillars.reduce((acc: Record<string, any[]>, p: any) => {
    acc[p.id] = cards.filter((c: any) => c.pillar_id === p.id);
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Toolkits</h1>
          <p className="text-base text-muted-foreground">Explorez les référentiels stratégiques et leurs cartes</p>
        </div>

        <p className="text-sm text-muted-foreground">
          {toolkits.length} toolkit{toolkits.length > 1 ? "s" : ""} disponible{toolkits.length > 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolkits.map((toolkit: any, idx: number) => {
              const isSelected = selectedToolkitId === toolkit.id;
              return (
                <motion.div
                  key={toolkit.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all group overflow-hidden",
                      isSelected && "ring-2 ring-primary shadow-lg"
                    )}
                    onClick={() => setSelectedToolkitId(isSelected ? null : toolkit.id)}
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Emoji + Name */}
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

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {toolkit.description || "Aucune description"}
                      </p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-2">
                        {toolkit.difficulty_level && (
                          <Badge className={cn("text-xs", difficultyColors[toolkit.difficulty_level] || difficultyColors.intermediate)}>
                            {toolkit.difficulty_level}
                          </Badge>
                        )}
                        {toolkit.estimated_duration && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> {toolkit.estimated_duration}
                          </Badge>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {toolkit.target_audience && (
                            <span className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" /> {toolkit.target_audience}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-semibold flex items-center gap-1 transition-all",
                          isSelected ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary"
                        )}>
                          {isSelected ? "Ouvert" : "Voir"} <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Cards view when toolkit selected */}
        <AnimatePresence>
          {selectedToolkit && pillars.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pt-4"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  {selectedToolkit.icon_emoji} Cartes — {selectedToolkit.name}
                </h2>
                <Badge variant="secondary" className="text-xs">{cards.length} cartes</Badge>
              </div>

              {pillars.map((pillar: any) => {
                const pillarCards = cardsByPillar[pillar.id] || [];
                if (pillarCards.length === 0) return null;
                return (
                  <div key={pillar.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: pillar.color || "hsl(var(--primary))" }}
                      />
                      <h3 className="text-base font-bold text-foreground">{pillar.name}</h3>
                      <span className="text-sm text-muted-foreground">{pillarCards.length} cartes</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {pillarCards.map((card: any) => (
                        <Card key={card.id} className="hover:shadow-md transition-all">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-8 rounded-full"
                                style={{ backgroundColor: pillar.color || "hsl(var(--primary))" }}
                              />
                              <Badge variant="outline" className="text-[10px]">
                                {phaseLabels[card.phase] || card.phase}
                              </Badge>
                            </div>
                            <p className="text-sm font-bold text-foreground leading-snug">{card.title}</p>
                            {card.subtitle && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                              {card.valorization > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" /> {card.valorization} pts
                                </span>
                              )}
                              {card.difficulty && (
                                <Badge variant="outline" className="text-[9px] px-1.5">{card.difficulty}</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Right sidebar — toolkit detail */}
      <AnimatePresence>
        {selectedToolkit && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-border/50 bg-card/50 overflow-hidden shrink-0"
          >
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
                      <p className="text-[10px] text-muted-foreground">Piliers</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{cards.length}</p>
                      <p className="text-[10px] text-muted-foreground">Cartes</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedToolkit.credit_cost_workshop || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Crédits / Workshop</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{selectedToolkit.credit_cost_challenge || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Crédits / Challenge</p>
                    </div>
                  </div>
                </div>

                {/* Pillar list */}
                {pillars.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Piliers</h4>
                    <div className="space-y-2">
                      {pillars.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                          <div
                            className="h-4 w-4 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || "hsl(var(--primary))" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(cardsByPillar[p.id] || []).length} cartes · Poids: {p.weight}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {Array.isArray(selectedToolkit.tags) && selectedToolkit.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-foreground">Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedToolkit.tags.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
