import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Code, FileText, FolderSearch, Layout, ClipboardCheck, Zap, MessageSquare, Play, History, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODE_REGISTRY, UNIVERSE_LABELS, getModeDefinition, type ModeFamily, type ModeUniverse } from "@/components/simulator/config/modeRegistry";
import { SimulatorEngine } from "@/components/simulator/SimulatorEngine";
import { PageTransition } from "@/components/ui/PageTransition";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

export default function Simulator() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterUniverse, setFilterUniverse] = useState<string>("all");
  const [filterFamily, setFilterFamily] = useState<string>("all");
  const [activeSim, setActiveSim] = useState<{ key: string; def: any } | null>(null);

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
  const families = Object.keys(FAMILY_LABELS) as ModeFamily[];

  const launchSim = (key: string, def: any) => {
    setActiveSim({ key, def });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Professional Simulator</h1>
              <p className="text-sm text-muted-foreground">{Object.keys(MODE_REGISTRY).length} simulations interactives pilotées par IA</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/simulator/history")} className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Mon historique
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un mode..."
              className="pl-9"
            />
          </div>
          <Select value={filterUniverse} onValueChange={setFilterUniverse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Univers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les univers</SelectItem>
              {universes.map((u) => (
                <SelectItem key={u} value={u}>{UNIVERSE_LABELS[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFamily} onValueChange={setFilterFamily}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type d'interface" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les familles</SelectItem>
              {families.map((f) => (
                <SelectItem key={f} value={f}>{FAMILY_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">{modes.length} modes</Badge>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modes.map(([key, def], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="group rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {FAMILY_ICONS[def.family]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{def.label}</p>
                    <p className="text-[10px] text-muted-foreground">{UNIVERSE_LABELS[def.universe]}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {FAMILY_LABELS[def.family].split(" ")[0]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {def.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {def.evaluationDimensions.slice(0, 2).map((dim: string) => (
                    <Badge key={dim} variant="secondary" className="text-[9px] capitalize">
                      {dim.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  {def.evaluationDimensions.length > 2 && (
                    <Badge variant="secondary" className="text-[9px]">+{def.evaluationDimensions.length - 2}</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => launchSim(key, def)}
                >
                  <Play className="h-3 w-3" />
                  Lancer
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {modes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Aucun mode ne correspond à vos filtres.</p>
          </div>
        )}
      </div>

      {/* Fullscreen Simulator Dialog */}
      <Dialog open={!!activeSim} onOpenChange={(open) => !open && setActiveSim(null)}>
        <DialogContent className="max-w-full w-full h-[100dvh] p-0 gap-0 [&>button]:hidden rounded-none border-0">
          {activeSim && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {FAMILY_ICONS[activeSim.def.family]}
                  </div>
                  <span className="text-sm font-semibold">{activeSim.def.label}</span>
                  <Badge variant="outline" className="text-[9px]">{UNIVERSE_LABELS[activeSim.def.universe]}</Badge>
                  <Badge variant="secondary" className="text-[9px]">Mode libre</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveSim(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <SimulatorEngine
                  practiceType={activeSim.key}
                  typeConfig={activeSim.def.defaultConfig || {}}
                  systemPrompt=""
                  scenario={activeSim.def.description}
                  maxExchanges={10}
                  practiceId="__standalone__"
                  previewMode
                  difficulty="intermediate"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
