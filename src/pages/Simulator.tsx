import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Code, FileText, FolderSearch, Layout, ClipboardCheck, Zap, MessageSquare, Play, History, X, Building2, GraduationCap, Award, HeartHandshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODE_REGISTRY, UNIVERSE_LABELS, getModeDefinition, type ModeFamily, type ModeUniverse } from "@/components/simulator/config/modeRegistry";

import { SimulatorInsightPanel } from "@/components/simulator/widgets/SimulatorInsightPanel";
import { PageTransition } from "@/components/ui/PageTransition";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useNavigate } from "react-router-dom";
import { useActiveOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getBehaviorInjection } from "@/components/simulator/config/promptTemplates";
import { generateRichScenario } from "@/components/simulator/config/scenarioTemplates";
import type { AIAssistanceLevel } from "@/components/simulator/SimulatorShell";

const FAMILY_ICONS: Record<ModeFamily, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  analysis: <FolderSearch className="h-4 w-4" />,
  decision: <Zap className="h-4 w-4" />,
  design: <Layout className="h-4 w-4" />,
  assessment: <ClipboardCheck className="h-4 w-4" />,
};

const FAMILY_LABELS: Record<ModeFamily, string> = {
  chat: "Chat & Coaching",
  code: "Code & Review",
  document: "Document & Rédaction",
  analysis: "Analyse & Investigation",
  decision: "Décision & Crise",
  design: "Design & Board",
  assessment: "Audit & Conformité",
};

const UNIVERSE_COLORS: Record<ModeUniverse, string> = {
  engineering: "bg-blue-500/10 text-blue-700 border-blue-200",
  vibe_coding: "bg-violet-500/10 text-violet-700 border-violet-200",
  product: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  infra: "bg-orange-500/10 text-orange-700 border-orange-200",
  business_analysis: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  transformation: "bg-rose-500/10 text-rose-700 border-rose-200",
  ma_finance: "bg-amber-500/10 text-amber-700 border-amber-200",
  leadership: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  legal: "bg-slate-500/10 text-slate-700 border-slate-200",
  strategy: "bg-purple-500/10 text-purple-700 border-purple-200",
  prompting: "bg-pink-500/10 text-pink-700 border-pink-200",
  sales_hr: "bg-teal-500/10 text-teal-700 border-teal-200",
  personal_development: "bg-lime-500/10 text-lime-700 border-lime-200",
  therapy: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200",
};

const DIFFICULTY_DOTS: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3, expert: 4,
};

export default function Simulator() {
  const navigate = useNavigate();
  const { activeOrgId } = useActiveOrg();
  const [search, setSearch] = useState("");
  const [filterUniverse, setFilterUniverse] = useState<string>("all");
  const [filterFamily, setFilterFamily] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<{ key: string; def: any } | null>(null);
  const [aiLevel, setAiLevel] = useState<AIAssistanceLevel>("guided");
  
  const [activeTab, setActiveTab] = useState("catalogue");

  // Aligned with PortalPratique: RLS returns the union of public + org-targeted + user-assigned practices
  const { data: availablePractices = [] } = useQuery({
    queryKey: ["visible-practices-cabinet", activeOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_practices")
        .select("*")
        .is("module_id", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const modes = useMemo(() => {
    return Object.entries(MODE_REGISTRY)
      .filter(([key, def]) => {
        if (filterUniverse !== "all" && def.universe !== filterUniverse) return false;
        if (filterFamily !== "all" && def.family !== filterFamily) return false;
        if (search) {
          const q = search.toLowerCase();
          return def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q) || key.includes(q);
        }
        return true;
      })
      .sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [search, filterUniverse, filterFamily]);

  const universes = Object.keys(UNIVERSE_LABELS) as ModeUniverse[];
  const universeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(MODE_REGISTRY).forEach(def => {
      counts[def.universe] = (counts[def.universe] || 0) + 1;
    });
    return counts;
  }, []);

  const launchStandalone = (key: string, def: any) => {
    const behaviorPrompt = getBehaviorInjection(key);
    const assistanceInstructions = aiLevel === "intensive"
      ? "\n\nIMPORTANT: Tu es en mode coaching INTENSIF. À chaque échange, fournis des suggestions proactives, des conseils méthodologiques, et guide l'apprenant. Propose toujours des pistes de réflexion après chaque réponse.\n\nIntègre dans chaque réponse un bloc :\n```suggestions\n[\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"]\n```"
      : aiLevel === "guided"
      ? "\n\nTu es en mode GUIDÉ. Si l'apprenant semble bloqué ou si sa réponse est courte, propose des pistes de réflexion via un bloc :\n```suggestions\n[\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"]\n```"
      : "";
    const fullPrompt = behaviorPrompt + assistanceInstructions;
    const richScenario = generateRichScenario(key, "intermediate", aiLevel);

    setSelectedMode(null);
    navigate("/simulator/session", {
      state: { key, def, systemPrompt: fullPrompt, scenario: richScenario, aiLevel },
    });
  };

  const launchPractice = (pr: any) => {
    const def = getModeDefinition(pr.practice_type) || { family: "chat" as ModeFamily, label: pr.practice_type, universe: "leadership" as ModeUniverse, description: pr.scenario, evaluationDimensions: [], defaultConfig: {} };
    navigate("/simulator/session", {
      state: {
        key: pr.practice_type,
        def,
        practiceId: pr.id,
        practice: pr,
        systemPrompt: pr.system_prompt || "",
        scenario: pr.scenario,
        aiLevel: pr.ai_assistance_level || "guided",
      },
    });
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border p-6 md:p-8"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Centre de Simulation Professionnelle</h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Acculturation</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Certification</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1"><HeartHandshake className="h-3.5 w-3.5" /> Support Métier</span>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <AnimatedCounter value={String(Object.keys(MODE_REGISTRY).length)} label="Simulations" />
              <AnimatedCounter value={String(universes.length)} label="Univers" />
              <AnimatedCounter value="7" label="Interfaces" />
              <Button variant="outline" size="sm" onClick={() => navigate("/simulator/history")} className="gap-1.5 hidden md:flex">
                <History className="h-3.5 w-3.5" /> Historique
              </Button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="catalogue" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Catalogue
              </TabsTrigger>
              <TabsTrigger value="practices" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Mes simulations ({availablePractices.length})
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={() => navigate("/simulator/history")} className="gap-1.5 md:hidden">
              <History className="h-3.5 w-3.5" />
            </Button>
          </div>

          <TabsContent value="catalogue" className="space-y-4 mt-4">
            {/* Universe pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterUniverse("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  filterUniverse === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                Tous ({Object.keys(MODE_REGISTRY).length})
              </button>
              {universes.map(u => (
                <button
                  key={u}
                  onClick={() => setFilterUniverse(filterUniverse === u ? "all" : u)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    filterUniverse === u
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : cn("hover:shadow-sm", UNIVERSE_COLORS[u])
                  )}
                >
                  {UNIVERSE_LABELS[u]} ({universeCounts[u] || 0})
                </button>
              ))}
            </div>

            {/* Search + family filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une simulation..." className="pl-9" />
              </div>
              <div className="flex gap-1.5">
                {(Object.keys(FAMILY_LABELS) as ModeFamily[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterFamily(filterFamily === f ? "all" : f)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                      filterFamily === f
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                    )}
                  >
                    {FAMILY_ICONS[f]}
                    <span className="hidden lg:inline">{FAMILY_LABELS[f].split(" ")[0]}</span>
                  </button>
                ))}
              </div>
              <Badge variant="outline" className="text-xs">{modes.length} résultats</Badge>
            </div>

            {/* Grid + Insight Panel */}
            <div className="flex gap-0">
              <div className={cn("flex-1 transition-all", selectedMode ? "pr-0" : "")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modes.map(([key, def], i) => {
                    const isSelected = selectedMode?.key === key;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.3) }}
                        onClick={() => setSelectedMode(isSelected ? null : { key, def })}
                        className={cn(
                          "group rounded-xl border bg-card hover:shadow-md transition-all p-4 space-y-3 cursor-pointer",
                          isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", UNIVERSE_COLORS[def.universe])}>
                              {FAMILY_ICONS[def.family]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold leading-tight">{def.label}</p>
                              <p className="text-[10px] text-muted-foreground">{UNIVERSE_LABELS[def.universe]}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: DIFFICULTY_DOTS["intermediate"] }).map((_, j) => (
                              <div key={j} className="h-1.5 w-1.5 rounded-full bg-primary" />
                            ))}
                            {Array.from({ length: 4 - DIFFICULTY_DOTS["intermediate"] }).map((_, j) => (
                              <div key={j} className="h-1.5 w-1.5 rounded-full bg-muted" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{def.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {def.evaluationDimensions.slice(0, 2).map((dim: string) => (
                              <Badge key={dim} variant="secondary" className="text-[9px] capitalize">{dim.replace(/_/g, " ")}</Badge>
                            ))}
                            {def.evaluationDimensions.length > 2 && (
                              <Badge variant="secondary" className="text-[9px]">+{def.evaluationDimensions.length - 2}</Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); launchStandalone(key, def); }}
                          >
                            <Play className="h-3 w-3" /> Lancer
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {modes.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-sm">Aucun mode ne correspond à vos filtres.</p>
                  </div>
                )}
              </div>

              {/* Insight Panel */}
              <AnimatePresence>
                {selectedMode && (
                  <SimulatorInsightPanel
                    practiceType={selectedMode.key}
                    modeDef={selectedMode.def}
                    aiLevel={aiLevel}
                    onAiLevelChange={setAiLevel}
                    onLaunch={() => launchStandalone(selectedMode.key, selectedMode.def)}
                    onClose={() => setSelectedMode(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="practices" className="space-y-4 mt-4">
            {availablePractices.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Aucune simulation assignée</p>
                <p className="text-xs mt-1">Explorez le catalogue ou demandez à votre administrateur d'assigner des simulations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePractices.map((pr: any) => {
                  const def = getModeDefinition(pr.practice_type);
                  const family = def?.family || "chat";
                  return (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", def ? UNIVERSE_COLORS[def.universe] : "bg-muted")}>
                            {FAMILY_ICONS[family]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{pr.title}</p>
                            {def && <p className="text-[10px] text-muted-foreground">{def.label}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[9px]">{pr.difficulty}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pr.scenario}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-[9px]">{pr.max_exchanges} échanges</Badge>
                          <Badge variant="secondary" className="text-[9px] capitalize">{pr.ai_assistance_level}</Badge>
                        </div>
                        <Button size="sm" variant="default" className="h-7 gap-1.5 text-xs" onClick={() => launchPractice(pr)}>
                          <Play className="h-3 w-3" /> Lancer
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      
    </PageTransition>
  );
}
