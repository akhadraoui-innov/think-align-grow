import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ScrollText, Loader2, Mail, BookOpen, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { PageTransition } from "@/components/ui/PageTransition";

export default function PortalGuideReader() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: path, isLoading } = useQuery({
    queryKey: ["guide-reader-path", pathId],
    enabled: !!pathId,
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_paths")
        .select("name, description, difficulty, estimated_hours, guide_document, academy_functions!academy_paths_function_id_fkey(name)")
        .eq("id", pathId!).single();
      if (error) throw error;
      return data;
    },
  });

  const [guide, setGuide] = useState<any>(null);

  // Set guide from fetched path data
  const guideDoc = guide || (path as any)?.guide_document;

  const generateGuide = async () => {
    setGenerating(true);
    try {
      const resp = await supabase.functions.invoke("academy-path-document", {
        body: { path_id: pathId, action: "generate" },
      });
      if (resp.data?.document) {
        setGuide(resp.data.document);
        toast.success("Livret de cours généré !");
      } else {
        toast.error("Erreur lors de la génération");
      }
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const sendByEmail = async () => {
    if (!user) return;
    setSendingEmail(true);
    try {
      await supabase.from("academy_document_sends").insert({
        user_id: user.id,
        path_id: pathId!,
        email: user.email,
      } as any);
      toast.success("Demande d'envoi enregistrée !");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour au parcours
            </Button>
            <div className="flex items-center gap-2">
              {guideDoc && user && (
                <Button variant="outline" size="sm" onClick={sendByEmail} disabled={sendingEmail} className="gap-1.5 text-xs">
                  {sendingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                  Recevoir par email
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Cover page */}
          <header className="mb-16 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Livret de cours complet</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{path?.name}</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{path?.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              {path?.difficulty && <Badge variant="secondary" className="capitalize">{path.difficulty}</Badge>}
              {(path as any)?.academy_functions?.name && (
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {(path as any).academy_functions.name}</span>
              )}
              {path?.estimated_hours && (
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {path.estimated_hours}h</span>
              )}
            </div>
            <div className="h-px bg-border max-w-xs mx-auto mt-8" />
          </header>

          {/* Content */}
          {guideDoc?.content ? (
            <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h3:text-lg prose-p:leading-relaxed prose-table:text-sm prose-td:py-2 prose-th:py-2">
              <EnrichedMarkdown content={guideDoc.content} />
              {guideDoc.generated_at && (
                <p className="text-xs text-muted-foreground text-center mt-16 pt-8 border-t">
                  Généré le {new Date(guideDoc.generated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="h-20 w-20 rounded-2xl bg-muted/30 flex items-center justify-center">
                <ScrollText className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold">Livret de cours</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Générez le livret pédagogique complet de ce parcours : contenu détaillé de chaque module, exercices, glossaire et référentiel de compétences.
                </p>
              </div>
              <Button onClick={generateGuide} disabled={generating} size="lg" className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                {generating ? "Génération en cours..." : "Générer le livret"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
