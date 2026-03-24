import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AcademyModule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: module, isLoading } = useQuery({
    queryKey: ["academy-module", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ["academy-module-contents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_contents")
        .select("*")
        .eq("module_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!module) {
    return (
      <PageTransition>
        <div className="container max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Module introuvable.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">{module.title}</h1>
          </div>
          <p className="text-muted-foreground">{module.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{module.module_type}</Badge>
            {module.estimated_minutes && (
              <span className="text-xs text-muted-foreground">{module.estimated_minutes} min</span>
            )}
          </div>
        </div>

        {/* Contenu */}
        {contents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Le contenu de ce module sera bientôt disponible.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contents.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-6">
                  {c.content_type === "markdown" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: c.body }} />
                  ) : c.content_type === "video" && c.media_url ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe src={c.media_url} className="w-full h-full" allowFullScreen />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{c.body}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
