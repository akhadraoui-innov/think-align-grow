import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { useSynthesizeUCM } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { code: "g_exec", title: "Executive Summary", icon: "📋" },
  { code: "g_synergies", title: "Synergies", icon: "🔗" },
  { code: "g_roadmap", title: "Roadmap Programme", icon: "🗺️" },
  { code: "g_archi", title: "Architecture Cible", icon: "🏗️" },
  { code: "g_business", title: "Business Case", icon: "💰" },
  { code: "g_change", title: "Transformation", icon: "🔄" },
  { code: "g_next", title: "Next Steps", icon: "🚀" },
];

interface Props {
  projectId: string;
  globalSections: any[];
}

export function UCMSynthesisPage({ projectId, globalSections }: Props) {
  const synthesizeUCM = useSynthesizeUCM();
  const perms = usePermissions();
  const canSynthesize = perms.has("ucm.global.generate");

  return (
    <div className="space-y-6 max-w-3xl p-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Synthèse Globale</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vue transversale et consolidée de tous les use cases analysés
        </p>
      </div>

      {SECTIONS.map(({ code, title, icon }) => {
        const existing = globalSections?.find((s: any) => s.section_id === code);
        return (
          <Card key={code} className={cn("transition-all shadow-sm", existing ? "border-l-4 border-l-primary" : "")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  {title}
                  {existing && <Badge variant="secondary" className="text-[10px] ml-2">v{existing.version}</Badge>}
                </CardTitle>
                <Button
                  size="sm"
                  variant={existing ? "outline" : "default"}
                  disabled={synthesizeUCM.isPending || !canSynthesize}
                  title={!canSynthesize ? "Permission requise" : ""}
                  onClick={() => synthesizeUCM.mutate(
                    { project_id: projectId, section_id: code },
                    { onSuccess: () => toast.success(`${title} généré`), onError: (e) => toast.error(e.message) }
                  )}
                >
                  {synthesizeUCM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {existing && (
              <CardContent>
                <EnrichedMarkdown content={existing.content || ""} />
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
