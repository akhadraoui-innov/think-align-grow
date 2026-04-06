import { useParams, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUCMProject, useUCMUseCases, useUCMAnalyses, useUCMGlobalSections, useUCMAnalysisSections } from "@/hooks/useUCMProject";
import { PageTransition } from "@/components/ui/PageTransition";
import { UCMProjectSidebar } from "@/components/ucm/UCMProjectSidebar";
import { UCMContextStep } from "@/components/ucm/UCMContextStep";
import { UCMScopeStep } from "@/components/ucm/UCMScopeStep";
import { UCMUseCasesList } from "@/components/ucm/UCMUseCasesList";
import { UCMAnalysisPage } from "@/components/ucm/UCMAnalysisPage";
import { UCMSynthesisPage } from "@/components/ucm/UCMSynthesisPage";
import { UCMChat } from "@/components/ucm/UCMChat";
import { Badge } from "@/components/ui/badge";

export default function PortalUCMProject() {
  const { id, ucId } = useParams<{ id: string; ucId?: string }>();
  const location = useLocation();
  const { data: project, isLoading } = useUCMProject(id);
  const { data: useCases } = useUCMUseCases(id);
  const { data: analyses } = useUCMAnalyses(id);
  const { data: globalSections } = useUCMGlobalSections(id);
  const { data: analysisSections } = useUCMAnalysisSections();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!project) return null;

  // Determine active view from pathname
  const basePath = `/portal/ucm/${id}`;
  const subPath = location.pathname.replace(basePath, "").replace(/^\//, "");

  const selectedUCs = (useCases || []).filter((uc: any) => uc.is_selected);

  const renderContent = () => {
    if (ucId || subPath.startsWith("uc/")) {
      return (
        <UCMAnalysisPage
          projectId={id!}
          useCases={useCases || []}
          analyses={analyses || []}
        />
      );
    }

    switch (subPath) {
      case "scope":
        return <UCMScopeStep project={project} projectId={id!} />;
      case "usecases":
        return (
          <div className="p-6 overflow-auto flex-1">
            <UCMUseCasesList projectId={id!} useCases={useCases || []} />
          </div>
        );
      case "synthesis":
        return (
          <div className="overflow-auto flex-1">
            <UCMSynthesisPage projectId={id!} globalSections={globalSections || []} />
          </div>
        );
      case "chat":
        return (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b shrink-0">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                🤖 Consultant IA
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Posez des questions sur le projet — l'IA a accès à tout le contexte
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <UCMChat projectId={id!} />
            </div>
          </div>
        );
      default: // context (root)
        return (
          <div className="p-6 overflow-auto flex-1">
            <UCMContextStep project={project} projectId={id!} />
          </div>
        );
    }
  };

  return (
    <PageTransition>
      <div className="flex h-full">
        <UCMProjectSidebar
          projectId={id!}
          company={project.company || "Nouveau projet"}
          useCases={useCases || []}
          analyses={analyses || []}
          analysisSections={analysisSections || []}
          globalSections={globalSections || []}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {renderContent()}
        </div>
      </div>
    </PageTransition>
  );
}
