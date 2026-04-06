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

  const basePath = `/portal/ucm/${id}`;
  const subPath = location.pathname.replace(basePath, "").replace(/^\//, "");

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
        return <UCMUseCasesList projectId={id!} useCases={useCases || []} />;
      case "synthesis":
        return <UCMSynthesisPage projectId={id!} globalSections={globalSections || []} />;
      case "chat":
        return <UCMChat projectId={id!} />;
      default:
        return <UCMContextStep project={project} projectId={id!} />;
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </PageTransition>
  );
}
