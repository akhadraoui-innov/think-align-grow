import { PageTransition } from "@/components/ui/PageTransition";
import { GraduationCap, BookOpen, Trophy, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Academy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
    queryKey: ["academy-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_enrollments")
        .select("*, academy_paths(*)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ["academy-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <PageTransition>
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Academy</h1>
              <p className="text-sm text-muted-foreground">Vos parcours de formation et le catalogue</p>
            </div>
          </div>
        </div>

        {/* Mes formations */}
        {user && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Mes formations
            </h2>
            {enrollLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Vous n'êtes inscrit à aucun parcours pour le moment.</p>
                  <p className="text-xs mt-1">Explorez le catalogue ci-dessous pour commencer.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((e: any) => (
                  <Card key={e.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/academy/path/${e.path_id}`)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{e.academy_paths?.name || "Parcours"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-2">{e.academy_paths?.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-medium text-primary capitalize">{e.status}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Catalogue */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Catalogue des parcours
          </h2>
          {catalogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : catalog.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Aucun parcours disponible pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map((path: any) => (
                <Card key={path.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/academy/path/${path.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{path.name}</CardTitle>
                      {path.difficulty && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                          {path.difficulty}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2">{path.description}</p>
                    {path.estimated_hours > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-2">{path.estimated_hours}h estimées</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
