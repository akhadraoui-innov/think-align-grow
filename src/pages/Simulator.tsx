import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Sparkles, Code, FileText, FolderSearch, Layout, ClipboardCheck, Zap, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODE_REGISTRY, UNIVERSE_LABELS, type ModeFamily, type ModeUniverse } from "@/components/simulator/config/modeRegistry";
import { PageTransition } from "@/components/ui/PageTransition";
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
  const [search, setSearch] = useState("");
  const [filterUniverse, setFilterUniverse] = useState<string>("all");
  const [filterFamily, setFilterFamily] = useState<string>("all");

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

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Professional Simulator</h1>
              <p className="text-sm text-muted-foreground">50 simulations interactives pilotées par IA</p>
            </div>
          </div>
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
              className="group rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all p-4 space-y-3 cursor-default"
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
              <div className="flex flex-wrap gap-1">
                {def.evaluationDimensions.slice(0, 3).map((dim) => (
                  <Badge key={dim} variant="secondary" className="text-[9px] capitalize">
                    {dim.replace(/_/g, " ")}
                  </Badge>
                ))}
                {def.evaluationDimensions.length > 3 && (
                  <Badge variant="secondary" className="text-[9px]">+{def.evaluationDimensions.length - 3}</Badge>
                )}
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
    </PageTransition>
  );
}
