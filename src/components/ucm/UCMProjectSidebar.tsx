import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, FileText, Target, Layers, BarChart3, MessageCircle, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UCItem {
  id: string;
  name: string;
  is_selected: boolean;
}

interface Analysis {
  use_case_id: string;
  section_id: string;
}

interface Props {
  projectId: string;
  company: string;
  useCases: UCItem[];
  analyses: Analysis[];
  analysisSections: { code: string; title: string; icon: string }[];
  globalSections: { section_id: string }[];
}

const NAV_ITEMS = [
  { key: "context", label: "Contexte", icon: "📋", path: "" },
  { key: "scope", label: "Périmètre", icon: "🎯", path: "/scope" },
  { key: "usecases", label: "Use Cases", icon: "💡", path: "/usecases" },
];

const SYNTH_ITEMS = [
  { key: "synthesis", label: "Synthèse Globale", icon: "📊", path: "/synthesis" },
  { key: "chat", label: "Consultant IA", icon: "🤖", path: "/chat" },
];

export function UCMProjectSidebar({ projectId, company, useCases, analyses, analysisSections, globalSections }: Props) {
  const location = useLocation();
  const basePath = `/portal/ucm/${projectId}`;
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    const full = basePath + path;
    if (path === "") return currentPath === basePath || currentPath === basePath + "/";
    return currentPath.startsWith(full);
  };

  const selectedUCs = useCases.filter((uc) => uc.is_selected);

  const getUCAnalyzedSections = (ucId: string) => {
    return analyses.filter((a) => a.use_case_id === ucId).map((a) => a.section_id);
  };

  const isUCFullyAnalyzed = (ucId: string) => {
    const done = getUCAnalyzedSections(ucId);
    return analysisSections.length > 0 && done.length >= analysisSections.length;
  };

  return (
    <div className="w-60 border-r bg-card/50 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b">
        <Link
          to="/portal/ucm"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Projets
        </Link>
        <h3 className="font-semibold text-sm mt-3 truncate" title={company}>
          {company}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Project section */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pt-2 pb-1">
            Projet
          </p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={basePath + item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.key === "usecases" && selectedUCs.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {selectedUCs.length}
                </span>
              )}
            </Link>
          ))}

          {/* Analysis per UC */}
          {selectedUCs.length > 0 && (
            <>
              <div className="pt-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pb-1">
                Analyse par UC
              </p>
              {selectedUCs.map((uc, i) => {
                const analyzedSections = getUCAnalyzedSections(uc.id);
                const fullyDone = isUCFullyAnalyzed(uc.id);
                const ucActive = currentPath.includes(`/uc/${uc.id}`);

                return (
                  <div key={uc.id}>
                    <Link
                      to={`${basePath}/uc/${uc.id}`}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                        ucActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="truncate flex-1 text-xs">{uc.name}</span>
                      <span className={cn("text-xs", fullyDone ? "text-primary" : "text-muted-foreground/50")}>
                        {fullyDone ? "●" : "○"}
                      </span>
                    </Link>
                    {ucActive && (
                      <div className="ml-7 space-y-0.5 mt-0.5 mb-1">
                        {analysisSections.map((section) => {
                          const done = analyzedSections.includes(section.code);
                          return (
                            <Link
                              key={section.code}
                              to={`${basePath}/uc/${uc.id}?section=${section.code}`}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-all",
                                "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                              )}
                            >
                              <span className={cn("text-[10px]", done ? "text-primary" : "text-muted-foreground/40")}>
                                {done ? "★" : "○"}
                              </span>
                              <span className="truncate">{section.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Synthesis section */}
          <div className="pt-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pb-1">
            Synthèse
          </p>
          {SYNTH_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={basePath + item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.key === "synthesis" && globalSections.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {globalSections.length}
                </span>
              )}
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
