import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";
import { useSynthesizeUCM } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { usePermissions } from "@/hooks/usePermissions";
import { UCMPageHeader } from "./UCMPageHeader";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { code: "g_exec", title: "Executive Summary", icon: "📋", color: "from-blue-500/20 to-blue-600/10", border: "border-l-blue-500", desc: "Vue d'ensemble stratégique du programme IA" },
  { code: "g_synergies", title: "Synergies", icon: "🔗", color: "from-violet-500/20 to-violet-600/10", border: "border-l-violet-500", desc: "Mutualisations et dépendances entre UC" },
  { code: "g_roadmap", title: "Roadmap Programme", icon: "🗺️", color: "from-primary/20 to-primary/10", border: "border-l-primary", desc: "Planification et séquencement du déploiement" },
  { code: "g_archi", title: "Architecture Cible", icon: "🏗️", color: "from-amber-500/20 to-amber-600/10", border: "border-l-amber-500", desc: "Infrastructure technique et intégrations" },
  { code: "g_business", title: "Business Case", icon: "💰", color: "from-emerald-500/20 to-emerald-600/10", border: "border-l-emerald-500", desc: "ROI, investissements et projection financière" },
  { code: "g_change", title: "Transformation", icon: "🔄", color: "from-orange-500/20 to-orange-600/10", border: "border-l-orange-500", desc: "Conduite du changement et adoption" },
  { code: "g_next", title: "Next Steps", icon: "🚀", color: "from-red-500/20 to-red-600/10", border: "border-l-red-500", desc: "Actions immédiates et quick wins" },
];

interface Props {
  projectId: string;
  globalSections: any[];
}

export function UCMSynthesisPage({ projectId, globalSections }: Props) {
  const synthesizeUCM = useSynthesizeUCM();
  const perms = usePermissions();
  const canSynthesize = perms.has("ucm.global.generate");
  const generatedCount = globalSections?.length || 0;

  return (
    <div className="p-6 overflow-auto flex-1">
      <div className="max-w-4xl mx-auto space-y-6">
        <UCMPageHeader
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          title="Synthèse Globale"
          subtitle="Vue transversale et consolidée de tous les use cases analysés"
          badge={`${generatedCount}/7`}
        />

        {SECTIONS.map(({ code, title, icon, color, border, desc }) => {
          const existing = globalSections?.find((s: any) => s.section_id === code);
          return (
            <Card key={code} className={cn("transition-all shadow-sm border-l-4", existing ? border : "border-l-muted")}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2.5">
                    <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-sm", color)}>
                      {icon}
                    </div>
                    <div>
                      <span className="font-bold">{title}</span>
                      {existing && (
                        <Badge variant="secondary" className="text-[10px] ml-2 font-bold">
                          v{existing.version}
                        </Badge>
                      )}
                    </div>
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
                    className="gap-1.5"
                  >
                    {synthesizeUCM.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {existing ? "Régénérer" : "Générer"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {existing ? (
                  <EnrichedMarkdown content={existing.content || ""} />
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">{desc}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
