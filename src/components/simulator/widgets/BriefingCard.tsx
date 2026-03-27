import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, BookOpen, Award, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { getModeDefinition } from "../config/modeRegistry";

interface BriefingCardProps {
  content: string;
  practiceType: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

function parseBriefingSections(content: string) {
  const sections: { context: string; mission: string; rules: string; tip: string } = {
    context: "",
    mission: "",
    rules: "",
    tip: "",
  };

  // Try structured markers
  const contextMatch = content.match(/(?:##?\s*(?:Contexte|Context|Situation)[^\n]*\n)([\s\S]*?)(?=##?\s|$)/i);
  const missionMatch = content.match(/(?:##?\s*(?:Votre mission|Mission|Objectif|Your mission)[^\n]*\n)([\s\S]*?)(?=##?\s|$)/i);
  const rulesMatch = content.match(/(?:##?\s*(?:Règles|Critères|Rules|Criteria|Consignes|Instructions)[^\n]*\n)([\s\S]*?)(?=##?\s|$)/i);
  const tipMatch = content.match(/(?:##?\s*(?:Conseil|Tip|Astuce|💡)[^\n]*\n)([\s\S]*?)(?=##?\s|$)/i);

  if (contextMatch || missionMatch) {
    sections.context = contextMatch?.[1]?.trim() || "";
    sections.mission = missionMatch?.[1]?.trim() || "";
    sections.rules = rulesMatch?.[1]?.trim() || "";
    sections.tip = tipMatch?.[1]?.trim() || "";
  } else {
    // Fallback: split by paragraphs
    const paragraphs = content.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length >= 3) {
      sections.context = paragraphs[0];
      sections.mission = paragraphs.slice(1, -1).join("\n\n");
      sections.tip = paragraphs[paragraphs.length - 1];
    } else {
      sections.context = content;
    }
  }

  return sections;
}

export function BriefingCard({ content, practiceType, collapsed = false, onToggle }: BriefingCardProps) {
  const [isOpen, setIsOpen] = useState(!collapsed);
  const modeDef = getModeDefinition(practiceType);
  const sections = parseBriefingSections(content);
  const hasStructured = !!(sections.mission || sections.rules);

  const toggle = () => {
    setIsOpen(!isOpen);
    onToggle?.();
  };

  return (
    <div className="mb-2">
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={toggle}
          className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Briefing de mission</p>
              {!isOpen && (
                <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                  {sections.context.substring(0, 80)}…
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {modeDef && !isOpen && (
              <Badge variant="outline" className="text-xs hidden sm:flex">
                {modeDef.evaluationDimensions.length} critères
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                <Separator />

                {/* Context section */}
                {sections.context && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contexte
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90 pl-5.5">
                      <EnrichedMarkdown content={sections.context} />
                    </div>
                  </div>
                )}

                {/* Mission section */}
                {sections.mission && (
                  <>
                    <Separator className="opacity-50" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Votre mission
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed text-foreground/90 pl-5.5">
                        <EnrichedMarkdown content={sections.mission} />
                      </div>
                    </div>
                  </>
                )}

                {/* Rules / Criteria section */}
                {sections.rules && (
                  <>
                    <Separator className="opacity-50" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Critères d'évaluation
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed text-foreground/90 pl-5.5">
                        <EnrichedMarkdown content={sections.rules} />
                      </div>
                    </div>
                  </>
                )}

                {/* Evaluation dimensions badges */}
                {modeDef && modeDef.evaluationDimensions.length > 0 && !sections.rules && (
                  <>
                    <Separator className="opacity-50" />
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Critères d'évaluation
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5.5">
                        {modeDef.evaluationDimensions.map((dim) => (
                          <Badge
                            key={dim}
                            variant="outline"
                            className="text-xs capitalize bg-primary/5 border-primary/20"
                          >
                            {dim.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Tip */}
                {sections.tip && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-foreground/80">
                      <EnrichedMarkdown content={sections.tip} />
                    </div>
                  </div>
                )}

                {/* Fallback: no structured content, render full markdown */}
                {!hasStructured && !sections.tip && (
                  <div className="text-sm leading-relaxed text-foreground/90">
                    <EnrichedMarkdown content={content} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
