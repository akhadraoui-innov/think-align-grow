import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search, Sparkles, Code, FileText, FolderSearch, Layout, ClipboardCheck,
  Zap, MessageSquare, Play, History, Building2, RotateCcw, TrendingUp,
  Target, Brain, ChevronDown, FileText as FileTextIcon, Award
} from "lucide-react";
import {
  MODE_REGISTRY, UNIVERSE_LABELS, getModeDefinition,
  type ModeFamily, type ModeUniverse
} from "@/components/simulator/config/modeRegistry";
import { SimulatorInsightPanel } from "@/components/simulator/widgets/SimulatorInsightPanel";
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
  chat: "Chat",
  code: "Code",
  document: "Document",
  analysis: "Analyse",
  decision: "Décision",
  design: "Design",
  assessment: "Audit",
};

const UNIVERSE_COLORS: Record<ModeUniverse, string> = {
  engineering: "bg-[hsl(var(--pillar-building))]/10 text-[hsl(var(--pillar-building))]",
  vibe_coding: "bg-[hsl(var(--pillar-operations))]/10 text-[hsl(var(--pillar-operations))]",
  product: "bg-[hsl(var(--pillar-finance))]/10 text-[hsl(var(--pillar-finance))]",
  infra: "bg-[hsl(var(--pillar-business))]/10 text-[hsl(var(--pillar-business))]",
  business_analysis: "bg-[hsl(var(--pillar-marketing))]/10 text-[hsl(var(--pillar-marketing))]",
  transformation: "bg-[hsl(var(--pillar-thinking))]/10 text-[hsl(var(--pillar-thinking))]",
  ma_finance: "bg-[hsl(var(--pillar-impact))]/10 text-[hsl(var(--pillar-impact))]",
  leadership: "bg-[hsl(var(--pillar-innovation))]/10 text-[hsl(var(--pillar-innovation))]",
  legal: "bg-[hsl(var(--pillar-legal))]/10 text-[hsl(var(--pillar-legal))]",
  strategy: "bg-[hsl(var(--pillar-operations))]/10 text-[hsl(var(--pillar-operations))]",
  prompting: "bg-[hsl(var(--pillar-thinking))]/10 text-[hsl(var(--pillar-thinking))]",
  sales_hr: "bg-[hsl(var(--pillar-team))]/10 text-[hsl(var(--pillar-team))]",
  personal_development: "bg-[hsl(var(--pillar-growth))]/10 text-[hsl(var(--pillar-growth))]",
  therapy: "bg-[hsl(var(--pillar-gouvernance))]/10 text-[hsl(var(--pillar-gouvernance))]",
};

interface Session {
  id: string;
  practice_id: string;
  score: number | null;
  started_at: string;
  completed_at: string | null;
  messages: any;
  evaluation: any;
  practice?: { title: string; practice_type: string; difficulty: string | null };
}

export default function PortalExperiences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();
  const [activeTab, setActiveTab] = useState("catalogue");
  const [search, setSearch] = useState("");
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [filterFamily, setFilterFamily] = useState("all");
  const [selectedMode, setSelectedMode] = useState<{ key: string; def: any } | null>(null);
  const [aiLevel, setAiLevel] = useState<AIAssistanceLevel>("guided");

  // ─── Sessions history ───
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("academy_practice_sessions")
        .select("id, practice_id, score, started_at, completed_at, messages, evaluation, academy_practices!left(title, practice_type, difficulty)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(100);
      if (data) {
        setSessions(data.map((d: any) => ({ ...d, practice: d.academy_practices })));
        const firstId = data[0]?.practice_id;
        if (firstId) setExpandedGroups(new Set([firstId]));
      }
      setLoadingHistory(false);
    })();
  }, [user]);

  // ─── Org practices ───
  const { data: orgPractices = [] } = useQuery({
    queryKey: ["portal-org-practices", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_practices")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .is("module_id", null)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: publicPractices = [] } = useQuery({
    queryKey: ["portal-public-practices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_practices")
        .select("*")
        .is("module_id", null)
        .is("organization_id", null)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const availablePractices = [...orgPractices, ...publicPractices];

  // ─── Catalogue modes ───
  const modes = useMemo(() => {
    return Object.entries(MODE_REGISTRY)
      .filter(([key, def]) => {
        if (filterUniverse !== "all" && def.universe !== filterUniverse) return false;
        if (filterFamily !== "all" && def.family !== filterFamily) return false;
        if (search) {
          const q = search.toLowerCase();
          return def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [search, filterUniverse, filterFamily]);

  const universes = Object.keys(UNIVERSE_LABELS) as ModeUniverse[];
  const universeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    Object.values(MODE_REGISTRY).forEach(def => { c[def.universe] = (c[def.universe] || 0) + 1; });
    return c;
  }, []);

  // ─── History groups ───
  const groups = useMemo(() => {
    const map = new Map<string, { practiceId: string; title: string; practiceType: string; difficulty: string | null; sessions: Session[] }>();
    sessions.forEach(s => {
      const key = s.practice_id || "__standalone__";
      if (!map.has(key)) map.set(key, { practiceId: key, title: s.practice?.title ?? "Session libre", practiceType: s.practice?.practice_type ?? "", difficulty: s.practice?.difficulty ?? null, sessions: [] });
      map.get(key)!.sessions.push(s);
    });
    return Array.from(map.values());
  }, [sessions]);

  const completedSessions = sessions.filter(s => s.completed_at);
  const avgScore = completedSessions.length ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / completedSessions.length) : 0;
  const bestScore = completedSessions.length ? Math.max(...completedSessions.map(s => s.score ?? 0)) : 0;

  const launchStandalone = (key: string, def: any) => {
    const behaviorPrompt = getBehaviorInjection(key);
    const assistInstr = aiLevel === "intensive"
      ? "\n\nIMPORTANT: Tu es en mode coaching INTENSIF. À chaque échange, fournis des suggestions proactives.\n\n```suggestions\n[\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"]\n```"
      : aiLevel === "guided"
      ? "\n\nTu es en mode GUIDÉ. Si l'apprenant semble bloqué, propose des pistes.\n```suggestions\n[\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"]\n```"
      : "";
    const richScenario = generateRichScenario(key, "intermediate", aiLevel);
    setSelectedMode(null);
    navigate("/portal/pratique/session", { state: { key, def, systemPrompt: behaviorPrompt + assistInstr, scenario: richScenario, aiLevel } });
  };

  const launchPractice = (pr: any) => {
    const def = getModeDefinition(pr.practice_type) || { family: "chat" as ModeFamily, label: pr.practice_type, universe: "leadership" as ModeUniverse, description: pr.scenario, evaluationDimensions: [], defaultConfig: {} };
    navigate("/portal/pratique/session", { state: { key: pr.practice_type, def, practiceId: pr.id, practice: pr, systemPrompt: pr.system_prompt || "", scenario: pr.scenario, aiLevel: pr.ai_assistance_level || "guided" } });
  };

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* ─── Stats ─── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Sessions", value: sessions.length, color: "text-primary" },
          { label: "Terminées", value: completedSessions.length, color: "text-[hsl(var(--pillar-finance))]" },
          { label: "Score moyen", value: avgScore, suffix: "/100", color: avgScore >= 60 ? "text-primary" : "text-[hsl(var(--pillar-business))]" },
          { label: "Meilleur", value: bestScore, suffix: "/100", color: "text-[hsl(var(--pillar-finance))]" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-black", kpi.color)}>
                {kpi.value}{kpi.suffix && <span className="text-xs text-muted-foreground">{kpi.suffix}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalogue" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Catalogue
          </TabsTrigger>
          <TabsTrigger value="practices" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Mes simulations ({availablePractices.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> Historique ({sessions.length})
          </TabsTrigger>
        </TabsList>

        {/* ═══ CATALOGUE ═══ */}
        <TabsContent value="catalogue" className="space-y-4 mt-4">
          {/* Universe pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterUniverse("all")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                filterUniverse === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Tous ({Object.keys(MODE_REGISTRY).length})
            </button>
            {universes.map(u => (
              <button
                key={u}
                onClick={() => setFilterUniverse(filterUniverse === u ? "all" : u)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                  filterUniverse === u ? "bg-primary text-primary-foreground border-primary" : cn("border-border/60", UNIVERSE_COLORS[u])
                )}
              >
                {UNIVERSE_LABELS[u]} ({universeCounts[u] || 0})
              </button>
            ))}
          </div>

          {/* Search + family */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-8 h-8 text-xs" />
            </div>
            <div className="flex gap-1">
              {(Object.keys(FAMILY_LABELS) as ModeFamily[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterFamily(filterFamily === f ? "all" : f)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all",
                    filterFamily === f ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {FAMILY_ICONS[f]}
                  <span className="hidden lg:inline">{FAMILY_LABELS[f]}</span>
                </button>
              ))}
            </div>
            <Badge variant="outline" className="text-[10px]">{modes.length} résultats</Badge>
          </div>

          {/* Grid + Insight */}
          <div className="flex gap-0">
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modes.map(([key, def], i) => {
                  const isSelected = selectedMode?.key === key;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      onClick={() => setSelectedMode(isSelected ? null : { key, def })}
                      className={cn(
                        "group rounded-xl border bg-card hover:shadow-md transition-all p-3.5 space-y-2.5 cursor-pointer",
                        isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", UNIVERSE_COLORS[def.universe])}>
                            {FAMILY_ICONS[def.family]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-tight">{def.label}</p>
                            <p className="text-[10px] text-muted-foreground">{UNIVERSE_LABELS[def.universe]}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{def.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {def.evaluationDimensions.slice(0, 2).map((dim: string) => (
                            <Badge key={dim} variant="secondary" className="text-[8px] capitalize">{dim.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                        <Button
                          size="sm" variant="default"
                          className="h-6 gap-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => { e.stopPropagation(); launchStandalone(key, def); }}
                        >
                          <Play className="h-3 w-3" /> Lancer
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {modes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-xs">Aucun mode ne correspond à vos filtres.</p>
                </div>
              )}
            </div>
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

        {/* ═══ PRACTICES ═══ */}
        <TabsContent value="practices" className="space-y-4 mt-4">
          {availablePractices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">Aucune simulation assignée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePractices.map((pr: any) => {
                const def = getModeDefinition(pr.practice_type);
                const family = def?.family || "chat";
                return (
                  <div key={pr.id} className="group rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", def ? UNIVERSE_COLORS[def.universe] : "bg-muted")}>
                          {FAMILY_ICONS[family]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{pr.title}</p>
                          {def && <p className="text-[10px] text-muted-foreground">{def.label}</p>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px]">{pr.difficulty}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{pr.scenario}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-[8px]">{pr.max_exchanges} éch.</Badge>
                        <Badge variant="secondary" className="text-[8px] capitalize">{pr.ai_assistance_level}</Badge>
                      </div>
                      <Button size="sm" className="h-6 gap-1 text-[10px]" onClick={() => launchPractice(pr)}>
                        <Play className="h-3 w-3" /> Lancer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ HISTORY ═══ */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucune session pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group, gi) => {
                const modeDef = group.practiceType ? getModeDefinition(group.practiceType) : null;
                const isOpen = expandedGroups.has(group.practiceId);
                return (
                  <motion.div key={group.practiceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}>
                    <Card>
                      <Collapsible open={isOpen} onOpenChange={() => { setExpandedGroups(prev => { const n = new Set(prev); n.has(group.practiceId) ? n.delete(group.practiceId) : n.add(group.practiceId); return n; }); }}>
                        <CollapsibleTrigger className="w-full text-left">
                          <CardContent className="p-3.5 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{group.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {modeDef && <Badge variant="outline" className="text-[9px] h-4">{modeDef.label}</Badge>}
                                {group.difficulty && <Badge variant="secondary" className="text-[9px] h-4">{group.difficulty}</Badge>}
                                <span className="text-[10px] text-muted-foreground">{group.sessions.length} tentative{group.sessions.length > 1 ? "s" : ""}</span>
                              </div>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-3.5 pb-3.5 space-y-2">
                            {group.sessions.map((session, si) => {
                              const attemptNum = group.sessions.length - si;
                              const prevSession = group.sessions[si + 1];
                              const delta = session.score != null && prevSession?.score != null ? session.score - prevSession.score : null;
                              const eval_ = session.evaluation as any;
                              const kpis = eval_?.kpis;
                              const msgCount = Array.isArray(session.messages) ? session.messages.length : 0;

                              return (
                                <div key={session.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-accent/30 transition-all cursor-default group/row">
                                  {/* Score */}
                                  <div className="shrink-0">
                                    {session.completed_at ? (
                                      <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black tabular-nums",
                                        (session.score ?? 0) >= 80 ? "bg-[hsl(var(--pillar-finance))]/10 text-[hsl(var(--pillar-finance))]"
                                          : (session.score ?? 0) >= 60 ? "bg-primary/10 text-primary"
                                          : "bg-[hsl(var(--pillar-business))]/10 text-[hsl(var(--pillar-business))]"
                                      )}>
                                        {session.score ?? 0}
                                      </div>
                                    ) : (
                                      <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
                                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-[11px] font-medium">Tentative {attemptNum}</p>
                                        {delta !== null && delta !== 0 && (
                                          <span className={cn("text-[10px] font-bold", delta > 0 ? "text-[hsl(var(--pillar-finance))]" : "text-destructive")}>
                                            {delta > 0 ? "+" : ""}{delta}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9px] text-muted-foreground">
                                        {format(new Date(session.started_at), "dd MMM yyyy · HH:mm", { locale: fr })}
                                      </p>
                                    </div>
                                    {session.completed_at && kpis && (
                                      <div className="hidden sm:flex items-center gap-1.5 ml-auto">
                                        {[
                                          { label: "Clarté", val: kpis.communication_clarity, icon: Brain },
                                          { label: "Pertinence", val: kpis.response_relevance, icon: Target },
                                          { label: "Adapt.", val: kpis.adaptability, icon: Zap },
                                        ].map(c => (
                                          <div key={c.label} className="flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5">
                                            <c.icon className={cn("h-2.5 w-2.5", c.val >= 7 ? "text-[hsl(var(--pillar-finance))]" : c.val >= 4 ? "text-[hsl(var(--pillar-business))]" : "text-destructive")} />
                                            <span className="text-[9px] text-muted-foreground">{c.label}</span>
                                            <span className={cn("text-[9px] font-bold tabular-nums", c.val >= 7 ? "text-[hsl(var(--pillar-finance))]" : c.val >= 4 ? "text-[hsl(var(--pillar-business))]" : "text-destructive")}>{c.val}/10</span>
                                          </div>
                                        ))}
                                        <div className="flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5">
                                          <MessageSquare className="h-2.5 w-2.5 text-muted-foreground" />
                                          <span className="text-[9px] font-bold tabular-nums">{msgCount}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {session.completed_at ? (
                                    <Button
                                      variant="ghost" size="sm"
                                      onClick={() => navigate(`/simulator/session/${session.id}/report`)}
                                      className="gap-1 text-[10px] shrink-0 opacity-60 group-hover/row:opacity-100"
                                    >
                                      <FileTextIcon className="h-3 w-3" /> Rapport
                                    </Button>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] shrink-0">En cours</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
