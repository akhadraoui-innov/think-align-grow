import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AcademyPath() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: path, isLoading } = useQuery({
    queryKey: ["academy-path", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paths")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["academy-path-modules", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_path_modules")
        .select("*, academy_modules(*)")
        .eq("path_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!path) {
    return (
      <PageTransition>
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Parcours introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/academy")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/academy")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'Academy
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">{path.name}</h1>
          </div>
          <p className="text-muted-foreground">{path.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {path.difficulty && <Badge variant="secondary">{path.difficulty}</Badge>}
            {path.estimated_hours > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {path.estimated_hours}h
              </span>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Modules
          </h2>
          {modules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Aucun module dans ce parcours pour le moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {modules.map((pm: any, idx: number) => (
                <Card key={pm.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/academy/module/${pm.module_id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pm.academy_modules?.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{pm.academy_modules?.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {pm.academy_modules?.module_type}
                    </Badge>
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
