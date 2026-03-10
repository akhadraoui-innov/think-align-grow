import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MousePointer2, StickyNote, ArrowRight, Square, 
  ZoomIn, ZoomOut, Play, Pause, Check, 
  Users, ArrowLeft, Type, Smile, ChevronDown,
  Circle, Triangle, Hexagon, Diamond, RectangleHorizontal,
  icons
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkshopParticipant } from "@/hooks/useWorkshop";
import { ICON_LIBRARY } from "./CanvasIcon";

interface WorkshopToolbarProps {
  mode: string;
  onModeChange: (mode: string) => void;
  viewport: { x: number; y: number; scale: number };
  onViewportChange: (vp: { x: number; y: number; scale: number }) => void;
  workshopStatus: "lobby" | "active" | "paused" | "completed";
  isHost: boolean;
  participants: WorkshopParticipant[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onBack: () => void;
  workshopName: string;
  selectedIconName: string;
  onSelectIcon: (name: string) => void;
  stickyShape: string;
  onStickyShapeChange: (shape: string) => void;
  groupShape: string;
  onGroupShapeChange: (shape: string) => void;
  readOnly?: boolean;
}

const TOOLS = [
  { id: "select", icon: MousePointer2, label: "Sélection" },
  { id: "sticky", icon: StickyNote, label: "Post-it" },
  { id: "arrow", icon: ArrowRight, label: "Flèche" },
  { id: "group", icon: Square, label: "Groupe" },
  { id: "text", icon: Type, label: "Texte" },
  { id: "icon", icon: Smile, label: "Icône" },
];

const STICKY_SHAPES = [
  { id: "square", label: "Carré", icon: Square },
  { id: "round", label: "Rond", icon: Circle },
];

const GROUP_SHAPES = [
  { id: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { id: "rounded", label: "Arrondi", icon: Square },
  { id: "circle", label: "Cercle", icon: Circle },
  { id: "triangle", label: "Triangle", icon: Triangle },
  { id: "hexagon", label: "Hexagone", icon: Hexagon },
  { id: "diamond", label: "Losange", icon: Diamond },
];

export function WorkshopToolbar({
  mode, onModeChange,
  viewport, onViewportChange,
  workshopStatus, isHost, participants,
  onStart, onPause, onResume, onComplete, onBack,
  workshopName,
  selectedIconName, onSelectIcon,
  stickyShape, onStickyShapeChange,
  groupShape, onGroupShapeChange,
  readOnly,
}: WorkshopToolbarProps) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [showSubMenu, setShowSubMenu] = useState<string | null>(null);

  const handleZoom = (delta: number) => {
    onViewportChange({ ...viewport, scale: Math.max(0.25, Math.min(2, viewport.scale + delta)) });
  };

  const filteredIcons = ICON_LIBRARY.filter(name => 
    name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleToolClick = (toolId: string) => {
    onModeChange(toolId);
    if (toolId === "icon") {
      setShowIconPicker(!showIconPicker);
      setShowSubMenu(null);
    } else if (toolId === "sticky" || toolId === "group") {
      setShowSubMenu(showSubMenu === toolId ? null : toolId);
      setShowIconPicker(false);
    } else {
      setShowSubMenu(null);
      setShowIconPicker(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-sm uppercase tracking-tight">{workshopName}</h1>
          <StatusBadge status={workshopStatus} />
        </div>
      </div>

      {/* Center: Tools */}
      {!readOnly && (
      <div className="relative flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
        {TOOLS.map(tool => {
          const hasSubMenu = tool.id === "sticky" || tool.id === "group" || tool.id === "icon";
          return (
            <motion.button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={cn(
                "p-2.5 rounded-lg transition-colors flex items-center gap-1",
                mode === tool.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
              whileTap={{ scale: 0.95 }}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
              {hasSubMenu && <ChevronDown className="h-3 w-3" />}
            </motion.button>
          );
        })}

        <div className="w-px h-6 bg-border mx-1" />

        <button onClick={() => handleZoom(-0.1)} className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Zoom -">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={() => onViewportChange({ x: 0, y: 0, scale: 1 })} className="px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors" title="Reset">
          {Math.round(viewport.scale * 100)}%
        </button>
        <button onClick={() => handleZoom(0.1)} className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Zoom +">
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Sticky shape sub-menu */}
        <AnimatePresence>
          {showSubMenu === "sticky" && mode === "sticky" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 mt-2 flex items-center gap-1 p-2 rounded-xl bg-background border border-border shadow-lg z-50"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Forme :</span>
              {STICKY_SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => onStickyShapeChange(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    stickyShape === s.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group shape sub-menu */}
        <AnimatePresence>
          {showSubMenu === "group" && mode === "group" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 mt-2 flex flex-wrap items-center gap-1 p-2 rounded-xl bg-background border border-border shadow-lg z-50 max-w-sm"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mr-2 w-full mb-1">Forme du groupe :</span>
              {GROUP_SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => onGroupShapeChange(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    groupShape === s.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold">{participants.length}</span>
          <div className="flex -space-x-2">
            {participants.slice(0, 4).map(p => (
              <div
                key={p.id}
                className={cn(
                  "h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold uppercase",
                  p.role === "host" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}
                title={p.display_name}
              >
                {p.display_name.charAt(0)}
              </div>
            ))}
            {participants.length > 4 && (
              <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                +{participants.length - 4}
              </div>
            )}
          </div>
        </div>

        {isHost && workshopStatus !== "completed" && (
          <div className="flex items-center gap-2">
            {workshopStatus === "lobby" && (
              <Button onClick={onStart} size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                <Play className="h-3.5 w-3.5 mr-1.5" />Démarrer
              </Button>
            )}
            {workshopStatus === "active" && (
              <>
                <Button onClick={onPause} variant="outline" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                  <Pause className="h-3.5 w-3.5 mr-1.5" />Pause
                </Button>
                <Button onClick={onComplete} variant="destructive" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                  <Check className="h-3.5 w-3.5 mr-1.5" />Terminer
                </Button>
              </>
            )}
            {workshopStatus === "paused" && (
              <>
                <Button onClick={onResume} size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                  <Play className="h-3.5 w-3.5 mr-1.5" />Reprendre
                </Button>
                <Button onClick={onComplete} variant="destructive" size="sm" className="rounded-xl font-bold uppercase tracking-wider text-xs">
                  Terminer
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Icon picker dropdown */}
      <AnimatePresence>
        {showIconPicker && mode === "icon" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 max-h-72 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-2 border-b border-border">
              <input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Rechercher une icône..."
                className="w-full px-3 py-1.5 text-sm bg-secondary/50 rounded-lg outline-none"
                autoFocus
              />
            </div>
            <div className="p-2 grid grid-cols-8 gap-1 overflow-y-auto max-h-52">
              {filteredIcons.map(name => {
                const Icon = (icons as any)[name];
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    onClick={() => { onSelectIcon(name); setShowIconPicker(false); }}
                    className={cn(
                      "p-2 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center",
                      selectedIconName === name && "bg-primary/10 text-primary"
                    )}
                    title={name}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    lobby: { label: "En attente", class: "bg-muted text-muted-foreground" },
    active: { label: "En cours", class: "bg-pillar-finance/15 text-pillar-finance" },
    paused: { label: "Pause", class: "bg-pillar-business/15 text-pillar-business" },
    completed: { label: "Terminé", class: "bg-primary/15 text-primary" },
  };
  const s = map[status] || map.lobby;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${s.class}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {s.label}
    </span>
  );
}
