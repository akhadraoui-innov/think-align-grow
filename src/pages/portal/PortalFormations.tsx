import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  GraduationCap, BookOpen, Clock, Search, ArrowRight, Sparkles
} from "lucide-react";

import coverProcessMining from "@/assets/covers/gen-process-mining.jpg";
import coverPremiersPasIA from "@/assets/covers/gen-premiers-pas-ia.jpg";
import coverStrategieComex from "@/assets/covers/gen-strategie-comex.jpg";
import coverManagerTerrain from "@/assets/covers/gen-manager-terrain.jpg";
import coverRhIA from "@/assets/covers/gen-rh-ia.jpg";
import coverMaitriserIA from "@/assets/covers/gen-maitriser-ia.jpg";
import coverOngCom from "@/assets/covers/gen-ong-com.jpg";
import coverDafFinance from "@/assets/covers/gen-daf-finance.jpg";
import coverPhosphate from "@/assets/covers/gen-phosphate.jpg";

/* ── Static cover map (fallback when cover_image_url is null) ── */
const STATIC_COVERS: Record<string, string> = {
  "036db7ea-359a-4359-9be2-2697a0a0d6f7": coverProcessMining,
  "25584f02-f384-4274-8a85-8997648a23a4": coverPremiersPasIA,
  "79100126-1913-43c7-b7fd-e1f096dd069b": coverStrategieComex,
  "430ee134-af45-4dbc-9b4a-8c7485db5712": coverManagerTerrain,
  "bc3d7926-7302-4ff7-be3a-7fa555d46ad3": coverRhIA,
  "a0000000-0000-0000-0000-000000000001": coverMaitriserIA,
  "19530fc0-5a78-4511-a8ad-bb9bf90a39fb": coverOngCom,
  "6b914294-4015-46ab-af8f-b4c1eaf8c522": coverDafFinance,
  "4acfc42c-b747-4695-8cd8-25d62ba453a2": coverPhosphate,
};

const difficultyConfig: Record<string, { label: string; gradient: string; badge: string }> = {
  beginner:     { label: "Débutant",       gradient: "from-emerald-500/80 to-teal-600/80",   badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  intermediate: { label: "Intermédiaire",  gradient: "from-amber-500/80 to-orange-600/80",   badge: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  advanced:     { label: "Avancé",         gradient: "from-rose-500/80 to-pink-600/80",      badge: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
};

export default function PortalFormations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  /* ── Enrolled path IDs ── */
  const { data: enrolledIds = new Set<string>() } = useQuery({
    queryKey: ["portal-enrolled-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_enrollments")
        .select("path_id")
        .eq("user_id", user!.id);
      return new Set((data || []).map((e: any) => e.path_id));
    },
  });

  /* ── Catalog ── */
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["portal-catalog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paths")
        .select("*, academy_functions!academy_paths_function_id_fkey(name), academy_personae!academy_paths_persona_id_fkey(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  /* ── Module counts ── */
  const { data: catalogModuleCounts = {} } = useQuery({
    queryKey: ["portal-catalog-mod-counts", catalog.map((c: any) => c.id)],
    enabled: catalog.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_path_modules")
        .select("path_id")
        .in("path_id", catalog.map((c: any) => c.id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => { counts[d.path_id] = (counts[d.path_id] || 0) + 1; });
      return counts;
    },
  });

  /* ── Progress per path (for enrolled users) ── */
  const enrolledPathIds = Array.from(enrolledIds);
  const { data: progressMap = {} } = useQuery({
    queryKey: ["portal-catalog-progress", user?.id, enrolledPathIds],
    enabled: !!user && enrolledPathIds.length > 0,
    queryFn: async () => {
      // Get enrollments
      const { data: enrollments } = await supabase
        .from("academy_enrollments")
        .select("id, path_id")
        .eq("user_id", user!.id)
        .in("path_id", enrolledPathIds);
      if (!enrollments?.length) return {};

      const enrollmentMap: Record<string, string> = {};
      enrollments.forEach((e: any) => { enrollmentMap[e.id] = e.path_id; });

      // Get progress
      const { data: progress } = await supabase
        .from("academy_progress")
        .select("enrollment_id, status")
        .eq("user_id", user!.id)
        .in("enrollment_id", enrollments.map((e: any) => e.id));

      const result: Record<string, { total: number; completed: number }> = {};
      (progress || []).forEach((p: any) => {
        const pathId = enrollmentMap[p.enrollment_id];
        if (!pathId) return;
        if (!result[pathId]) result[pathId] = { total: 0, completed: 0 };
        result[pathId].total++;
        if (p.status === "completed") result[pathId].completed++;
      });
      return result;
    },
  });

  const filtered = catalog.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getCoverImage = (path: any): string | null => {
    return (path as any).cover_image_url || STATIC_COVERS[path.id] || null;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs font-medium border-primary/20 text-primary">
              {catalog.length} parcours
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
            Catalogue des formations
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Développez vos compétences IA avec des parcours conçus par des experts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un parcours..."
            className="pl-10 h-11 rounded-xl border-border/60 bg-background/80 backdrop-blur-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map(d => (
            <Button
              key={d}
              variant={filterDifficulty === d ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl text-xs h-9 px-4 transition-all",
                filterDifficulty !== d && "hover:bg-muted/60"
              )}
              onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
            >
              {difficultyConfig[d].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} parcours disponible{filtered.length > 1 ? "s" : ""}
        {filterDifficulty && ` · ${difficultyConfig[filterDifficulty]?.label}`}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[420px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((path: any, idx: number) => {
            const diff = difficultyConfig[path.difficulty] || difficultyConfig.intermediate;
            const modCount = (catalogModuleCounts as Record<string, number>)[path.id] || 0;
            const isEnrolled = enrolledIds.has(path.id);
            const tags = Array.isArray(path.tags) ? path.tags.filter(Boolean) : [];
            const cover = getCoverImage(path);
            const prog = (progressMap as Record<string, { total: number; completed: number }>)[path.id];
            const progressPct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.06, 0.3), duration: 0.4 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer group rounded-2xl border border-border/50",
                    "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300",
                    "flex flex-col h-[420px]",
                    isEnrolled && "ring-1 ring-primary/20"
                  )}
                  onClick={() => navigate(`/portal/path/${path.id}`)}
                >
                  {/* Cover Image */}
                  <div className="relative h-44 overflow-hidden flex-shrink-0">
                    {cover ? (
                      <img
                        src={cover}
                        alt={path.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={1024}
                        height={576}
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-full bg-gradient-to-br flex items-center justify-center",
                        diff.gradient
                      )}>
                        <GraduationCap className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className={cn("text-[11px] font-semibold border backdrop-blur-sm", diff.badge)}>
                        {diff.label}
                      </Badge>
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-3 right-3">
                        <Badge className="text-[11px] bg-primary/90 text-primary-foreground border-0 backdrop-blur-sm">
                          <Sparkles className="h-3 w-3 mr-1" /> Inscrit
                        </Badge>
                      </div>
                    )}
                    {/* Progress bar for enrolled */}
                    {isEnrolled && prog && (
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                        <div className="flex items-center gap-2">
                          <Progress value={progressPct} className="h-1.5 flex-1 bg-white/20" />
                          <span className="text-[10px] font-bold text-white drop-shadow-sm">{progressPct}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5 min-h-0">
                    {/* Title */}
                    <h3 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                      {path.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-shrink-0">
                      {path.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-auto">
                      {(path as any).academy_functions && (
                        <Badge variant="secondary" className="text-[11px] rounded-md">
                          {(path as any).academy_functions.name}
                        </Badge>
                      )}
                      {(path as any).academy_personae && (
                        <Badge variant="outline" className="text-[11px] rounded-md">
                          {(path as any).academy_personae.name}
                        </Badge>
                      )}
                      {tags.slice(0, 2).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[11px] text-muted-foreground rounded-md">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {modCount > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {modCount} module{modCount > 1 ? "s" : ""}
                          </span>
                        )}
                        {Number(path.estimated_hours) > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {path.estimated_hours}h
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Aucun parcours trouvé</p>
          <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}
