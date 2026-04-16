// Portal version of Simulator — same logic, portal navigation
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Code, FileText, FolderSearch, Layout, ClipboardCheck, Zap, MessageSquare, Play, History, Building2, GraduationCap, Award, HeartHandshake, Globe2, UserCheck, CalendarClock } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getBehaviorInjection } from "@/components/simulator/config/promptTemplates";
import { generateRichScenario } from "@/components/simulator/config/scenarioTemplates";
import type { AIAssistanceLevel } from "@/components/simulator/SimulatorShell";

const FAMILY_ICONS: Record<ModeFamily, React.ReactNode> = { chat: <MessageSquare className="h-4 w-4" />, code: <Code className="h-4 w-4" />, document: <FileText className="h-4 w-4" />, analysis: <FolderSearch className="h-4 w-4" />, decision: <Zap className="h-4 w-4" />, design: <Layout className="h-4 w-4" />, assessment: <ClipboardCheck className="h-4 w-4" /> };
const FAMILY_LABELS: Record<ModeFamily, string> = { chat: "Chat & Coaching", code: "Code & Review", document: "Document & Rédaction", analysis: "Analyse & Investigation", decision: "Décision & Crise", design: "Design & Board", assessment: "Audit & Conformité" };
const UNIVERSE_COLORS: Record<ModeUniverse, string> = { engineering: "bg-blue-500/10 text-blue-700 border-blue-200", vibe_coding: "bg-violet-500/10 text-violet-700 border-violet-200", product: "bg-emerald-500/10 text-emerald-700 border-emerald-200", infra: "bg-orange-500/10 text-orange-700 border-orange-200", business_analysis: "bg-cyan-500/10 text-cyan-700 border-cyan-200", transformation: "bg-rose-500/10 text-rose-700 border-rose-200", ma_finance: "bg-amber-500/10 text-amber-700 border-amber-200", leadership: "bg-indigo-500/10 text-indigo-700 border-indigo-200", legal: "bg-slate-500/10 text-slate-700 border-slate-200", strategy: "bg-purple-500/10 text-purple-700 border-purple-200", prompting: "bg-pink-500/10 text-pink-700 border-pink-200", sales_hr: "bg-teal-500/10 text-teal-700 border-teal-200", personal_development: "bg-lime-500/10 text-lime-700 border-lime-200", therapy: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200" };

type PracticeScope = "public" | "org" | "assigned";

export default function PortalPratique() {
  const navigate = useNavigate();
  const { activeOrgId } = useActiveOrg();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterUniverse, setFilterUniverse] = useState<string>("all");
  const [filterFamily, setFilterFamily] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<{ key: string; def: any } | null>(null);
  const [aiLevel, setAiLevel] = useState<AIAssistanceLevel>("guided");
  const [activeTab, setActiveTab] = useState("catalogue");

  // RLS now returns the union of public + org-targeted + user-assigned practices automatically
  const { data: availablePractices = [] } = useQuery({
    queryKey: ["visible-practices", activeOrgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_practices")
        .select("*")
        .is("module_id", null)
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch scope metadata (org links + personal assignments) to compute real badges
  const { data: scopeMeta = { orgPracticeIds: new Set<string>(), assignmentMap: new Map<string, { due_date: string | null }>() } } = useQuery({
    queryKey: ["practice-scope-meta", user?.id, availablePractices.map((p: any) => p.id).join(",")],
    enabled: !!user && availablePractices.length > 0,
    queryFn: async () => {
      const ids = availablePractices.map((p: any) => p.id);
      const [{ data: orgs }, { data: assigns }] = await Promise.all([
        supabase.from("practice_organizations").select("practice_id").in("practice_id", ids),
        supabase.from("practice_user_assignments").select("practice_id, due_date").in("practice_id", ids).eq("user_id", user!.id),
      ]);
      const orgPracticeIds = new Set((orgs ?? []).map((o: any) => o.practice_id));
      const assignmentMap = new Map<string, { due_date: string | null }>();
      (assigns ?? []).forEach((a: any) => assignmentMap.set(a.practice_id, { due_date: a.due_date }));
      return { orgPracticeIds, assignmentMap };
    },
  });

  const getScope = (pr: any): PracticeScope => {
    if (scopeMeta.assignmentMap.has(pr.id)) return "assigned";
    if (scopeMeta.orgPracticeIds.has(pr.id)) return "org";
    return "public";
  };
  const getDueDate = (pr: any): string | null => scopeMeta.assignmentMap.get(pr.id)?.due_date ?? null;

  // Build unified catalogue: MODE_REGISTRY entries + org practices mapped as catalogue items
  const practiceEntries: [string, any][] = useMemo(() => {
    return availablePractices.map((pr: any) => {
      const registryDef = getModeDefinition(pr.practice_type);
      const def = {
        family: registryDef?.family || ("chat" as ModeFamily),
        universe: registryDef?.universe || ("leadership" as ModeUniverse),
        label: pr.title,
        description: pr.scenario || "",
        evaluationDimensions: Array.isArray(pr.evaluation_dimensions) ? (pr.evaluation_dimensions as string[]) : [],
        defaultConfig: {},
        _practice: pr, // marker to distinguish from registry modes
      };
      return [`practice_${pr.id}`, def] as [string, any];
    });
  }, [availablePractices]);

  const modes = useMemo(() => {
    const all: [string, any][] = [...Object.entries(MODE_REGISTRY), ...practiceEntries];
    return all.filter(([key, def]) => {
      if (filterUniverse !== "all" && def.universe !== filterUniverse) return false;
      if (filterFamily !== "all" && def.family !== filterFamily) return false;
      if (search) { const q = search.toLowerCase(); return def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q); }
      return true;
    }).sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [search, filterUniverse, filterFamily, practiceEntries]);

  const universes = Object.keys(UNIVERSE_LABELS) as ModeUniverse[];
  const totalCatalogueCount = Object.keys(MODE_REGISTRY).length + practiceEntries.length;
  const universeCounts = useMemo(() => { const c: Record<string, number> = {}; Object.values(MODE_REGISTRY).forEach(def => { c[def.universe] = (c[def.universe] || 0) + 1; }); practiceEntries.forEach(([, def]) => { c[def.universe] = (c[def.universe] || 0) + 1; }); return c; }, [practiceEntries]);

  const launchStandalone = (key: string, def: any) => {
    const behaviorPrompt = getBehaviorInjection(key);
    const assistanceInstructions = aiLevel === "intensive" ? "\n\nIMPORTANT: Mode coaching INTENSIF...\n```suggestions\n[\"s1\",\"s2\",\"s3\"]\n```" : aiLevel === "guided" ? "\n\nMode GUIDÉ...\n```suggestions\n[\"s1\",\"s2\",\"s3\"]\n```" : "";
    const fullPrompt = behaviorPrompt + assistanceInstructions;
    const richScenario = generateRichScenario(key, "intermediate", aiLevel);
    setSelectedMode(null);
    navigate("/portal/pratique/session", { state: { key, def, systemPrompt: fullPrompt, scenario: richScenario, aiLevel } });
  };

  const launchPractice = (pr: any) => {
    const def = getModeDefinition(pr.practice_type) || { family: "chat" as ModeFamily, label: pr.practice_type, universe: "leadership" as ModeUniverse, description: pr.scenario, evaluationDimensions: [], defaultConfig: {} };
    navigate("/portal/pratique/session", { state: { key: pr.practice_type, def, practiceId: pr.id, practice: pr, systemPrompt: pr.system_prompt || "", scenario: pr.scenario, aiLevel: pr.ai_assistance_level || "guided" } });
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border p-6 md:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Centre de Simulation</h1>
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
              <AnimatedCounter value={String(totalCatalogueCount)} label="Simulations" />
              <AnimatedCounter value={String(universes.length)} label="Univers" />
              <Button variant="outline" size="sm" onClick={() => navigate("/portal/pratique/history")} className="gap-1.5 hidden md:flex"><History className="h-3.5 w-3.5" /> Historique</Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="catalogue" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Catalogue</TabsTrigger>
              <TabsTrigger value="practices" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Mes simulations ({availablePractices.length})</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={() => navigate("/portal/pratique/history")} className="gap-1.5 md:hidden"><History className="h-3.5 w-3.5" /></Button>
          </div>

          <TabsContent value="catalogue" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterUniverse("all")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", filterUniverse === "all" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border hover:border-primary/40 text-muted-foreground hover:text-foreground")}>Tous ({totalCatalogueCount})</button>
              {universes.map(u => <button key={u} onClick={() => setFilterUniverse(filterUniverse === u ? "all" : u)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", filterUniverse === u ? "bg-primary text-primary-foreground border-primary shadow-sm" : cn("hover:shadow-sm", UNIVERSE_COLORS[u]))}>{UNIVERSE_LABELS[u]} ({universeCounts[u] || 0})</button>)}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" /></div>
              <div className="flex gap-1.5">{(Object.keys(FAMILY_LABELS) as ModeFamily[]).map(f => <button key={f} onClick={() => setFilterFamily(filterFamily === f ? "all" : f)} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all", filterFamily === f ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground")}>{FAMILY_ICONS[f]}<span className="hidden lg:inline">{FAMILY_LABELS[f].split(" ")[0]}</span></button>)}</div>
              <Badge variant="outline" className="text-xs">{modes.length} résultats</Badge>
            </div>
            <div className="flex gap-0">
              <div className={cn("flex-1 transition-all", selectedMode ? "pr-0" : "")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modes.map(([key, def], i) => {
                    const isSelected = selectedMode?.key === key;
                    const isPractice = !!def._practice;
                    const handleLaunch = (e: React.MouseEvent) => { e.stopPropagation(); isPractice ? launchPractice(def._practice) : launchStandalone(key, def); };
                    const scope = isPractice ? getScope(def._practice) : null;
                    const due = isPractice ? getDueDate(def._practice) : null;
                    const dueDateMs = due ? new Date(due).getTime() : null;
                    const isUrgent = dueDateMs ? (dueDateMs - Date.now()) < 3 * 24 * 3600 * 1000 : false;
                    return (
                      <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i*0.015, 0.3) }} onClick={() => !isPractice && setSelectedMode(isSelected ? null : { key, def })} className={cn("group rounded-xl border bg-card hover:shadow-md transition-all p-4 space-y-3 cursor-pointer", isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "hover:border-primary/30", isPractice && "border-accent/30 bg-accent/[0.02]")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", UNIVERSE_COLORS[def.universe])}>{FAMILY_ICONS[def.family]}</div>
                            <div className="min-w-0"><p className="text-sm font-semibold leading-tight truncate">{def.label}</p><p className="text-[10px] text-muted-foreground">{UNIVERSE_LABELS[def.universe]}</p></div>
                          </div>
                          {isPractice && scope && (
                            scope === "assigned" ? <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-primary/20"><UserCheck className="h-2.5 w-2.5" /> Assignée</Badge>
                            : scope === "org" ? <Badge className="text-[9px] gap-1 bg-accent/10 text-accent border-accent/20"><Building2 className="h-2.5 w-2.5" /> Org</Badge>
                            : <Badge variant="outline" className="text-[9px] gap-1"><Globe2 className="h-2.5 w-2.5" /> Public</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{def.description}</p>
                        {isPractice && due && (
                          <div className={cn("flex items-center gap-1.5 text-[10px] font-medium", isUrgent ? "text-destructive" : "text-muted-foreground")}>
                            <CalendarClock className="h-3 w-3" />
                            Échéance : {new Date(due).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            {isUrgent && <span className="ml-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">J-{Math.max(0, Math.ceil((dueDateMs! - Date.now()) / (24 * 3600 * 1000)))}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">{(def.evaluationDimensions || []).slice(0,2).map((dim: any, idx: number) => { const label = typeof dim === "string" ? dim : (dim?.name || dim?.label || dim?.key || ""); if (!label) return null; return <Badge key={`${label}-${idx}`} variant="secondary" className="text-[9px] capitalize">{String(label).replace(/_/g," ")}</Badge>; })}</div>
                          <Button size="sm" variant="default" className="h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleLaunch}><Play className="h-3 w-3" /> Lancer</Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <AnimatePresence>{selectedMode && <SimulatorInsightPanel practiceType={selectedMode.key} modeDef={selectedMode.def} aiLevel={aiLevel} onAiLevelChange={setAiLevel} onLaunch={() => launchStandalone(selectedMode.key, selectedMode.def)} onClose={() => setSelectedMode(null)} />}</AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="practices" className="space-y-4 mt-4">
            {availablePractices.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Zap className="h-8 w-8 mx-auto mb-3 opacity-50" /><p className="text-sm font-medium">Aucune simulation assignée</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePractices.map((pr: any) => {
                  const def = getModeDefinition(pr.practice_type);
                  const family = def?.family || "chat";
                  const scope = getScope(pr);
                  const due = getDueDate(pr);
                  const dueDateMs = due ? new Date(due).getTime() : null;
                  const isUrgent = dueDateMs ? (dueDateMs - Date.now()) < 3 * 24 * 3600 * 1000 : false;
                  return (
                    <motion.div key={pr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", def ? UNIVERSE_COLORS[def.universe] : "bg-muted")}>{FAMILY_ICONS[family]}</div>
                          <div className="min-w-0"><p className="text-sm font-semibold leading-tight truncate">{pr.title}</p>{def && <p className="text-[10px] text-muted-foreground">{def.label}</p>}</div>
                        </div>
                        {scope === "assigned" ? <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-primary/20"><UserCheck className="h-2.5 w-2.5" /> Assignée</Badge>
                          : scope === "org" ? <Badge className="text-[9px] gap-1 bg-accent/10 text-accent border-accent/20"><Building2 className="h-2.5 w-2.5" /> Org</Badge>
                          : <Badge variant="outline" className="text-[9px] gap-1"><Globe2 className="h-2.5 w-2.5" /> Public</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pr.scenario}</p>
                      {due && (
                        <div className={cn("flex items-center gap-1.5 text-[10px] font-medium", isUrgent ? "text-destructive" : "text-muted-foreground")}>
                          <CalendarClock className="h-3 w-3" />
                          Échéance : {new Date(due).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          {isUrgent && <span className="ml-1 px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">J-{Math.max(0, Math.ceil((dueDateMs! - Date.now()) / (24 * 3600 * 1000)))}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[9px]">{pr.difficulty}</Badge>
                          <Badge variant="secondary" className="text-[9px]">{pr.max_exchanges} échanges</Badge>
                        </div>
                        <Button size="sm" variant="default" className="h-7 gap-1.5 text-xs" onClick={() => launchPractice(pr)}><Play className="h-3 w-3" /> Lancer</Button>
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
