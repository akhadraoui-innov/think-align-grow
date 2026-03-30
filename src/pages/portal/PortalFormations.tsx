import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  GraduationCap, BookOpen, Clock, Search, ArrowRight
} from "lucide-react";

const difficultyConfig: Record<string, { label: string; color: string; border: string }> = {
  beginner: { label: "Débutant", color: "text-emerald-600", border: "border-t-emerald-500" },
  intermediate: { label: "Intermédiaire", color: "text-amber-600", border: "border-t-amber-500" },
  advanced: { label: "Avancé", color: "text-rose-600", border: "border-t-rose-500" },
};

export default function PortalFormations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

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

  const filtered = catalog.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Catalogue des formations</h1>
        <p className="text-base text-muted-foreground">Découvrez et inscrivez-vous aux parcours disponibles</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un parcours..."
            className="pl-11 h-12 text-base"
          />
        </div>
        <div className="flex gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map(d => (
            <Button
              key={d}
              variant={filterDifficulty === d ? "default" : "outline"}
              size="default"
              className="text-sm h-10 px-5"
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
        {filterDifficulty && ` · filtre: ${difficultyConfig[filterDifficulty]?.label}`}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((path: any, idx: number) => {
            const diff = difficultyConfig[path.difficulty] || difficultyConfig.intermediate;
            const modCount = (catalogModuleCounts as Record<string, number>)[path.id] || 0;
            const isEnrolled = enrolledIds.has(path.id);
            const tags = Array.isArray(path.tags) ? path.tags.filter(Boolean) : [];

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer hover:shadow-lg transition-all group border-t-4",
                    diff.border,
                    isEnrolled && "ring-1 ring-primary/20"
                  )}
                  onClick={() => navigate(`/portal/path/${path.id}`)}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Top row */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs px-3 py-0.5", diff.color)}>{diff.label}</Badge>
                      {isEnrolled && <Badge className="text-xs bg-primary/10 text-primary border-0 px-3 py-0.5">Inscrit</Badge>}
                    </div>

                    {/* Title */}
                    <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {path.name}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{path.description}</p>

                    {/* Function / Persona tags */}
                    {((path as any).academy_functions || (path as any).academy_personae || tags.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {(path as any).academy_functions && (
                          <Badge variant="secondary" className="text-xs">{(path as any).academy_functions.name}</Badge>
                        )}
                        {(path as any).academy_personae && (
                          <Badge variant="outline" className="text-xs">{(path as any).academy_personae.name}</Badge>
                        )}
                        {tags.slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {modCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" /> {modCount} module{modCount > 1 ? "s" : ""}
                          </span>
                        )}
                        {Number(path.estimated_hours) > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {path.estimated_hours}h
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="h-14 w-14 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun parcours trouvé</p>
          <p className="text-sm mt-2">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}
