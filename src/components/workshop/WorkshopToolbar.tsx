import { motion } from "framer-motion";
import { 
  MousePointer2, StickyNote, ArrowRight, Square, 
  ZoomIn, ZoomOut, Play, Pause, Check, 
  Timer, Users, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkshopParticipant } from "@/hooks/useWorkshop";

interface WorkshopToolbarProps {
  mode: "select" | "sticky" | "arrow" | "group";
  onModeChange: (mode: "select" | "sticky" | "arrow" | "group") => void;
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
}

const TOOLS = [
  { id: "select" as const, icon: MousePointer2, label: "Sélection" },
  { id: "sticky" as const, icon: StickyNote, label: "Post-it" },
  { id: "arrow" as const, icon: ArrowRight, label: "Flèche" },
  { id: "group" as const, icon: Square, label: "Groupe" },
];

export function WorkshopToolbar({
  mode,
  onModeChange,
  viewport,
  onViewportChange,
  workshopStatus,
  isHost,
  participants,
  onStart,
  onPause,
  onResume,
  onComplete,
  onBack,
  workshopName,
}: WorkshopToolbarProps) {
  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.25, Math.min(2, viewport.scale + delta));
    onViewportChange({ ...viewport, scale: newScale });
  };

  const resetView = () => {
    onViewportChange({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-sm uppercase tracking-tight">
            {workshopName}
          </h1>
          <StatusBadge status={workshopStatus} />
        </div>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
        {TOOLS.map(tool => (
          <motion.button
            key={tool.id}
            onClick={() => onModeChange(tool.id)}
            className={cn(
              "p-2.5 rounded-lg transition-colors",
              mode === tool.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
            whileTap={{ scale: 0.95 }}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </motion.button>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Zoom */}
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom -"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          className="px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          title="Reset zoom"
        >
          {Math.round(viewport.scale * 100)}%
        </button>
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom +"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Participants + Controls */}
      <div className="flex items-center gap-3">
        {/* Participants */}
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

        {/* Host controls */}
        {isHost && workshopStatus !== "completed" && (
          <div className="flex items-center gap-2">
            {workshopStatus === "lobby" && (
              <Button 
                onClick={onStart} 
                size="sm" 
                className="rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Démarrer
              </Button>
            )}
            {workshopStatus === "active" && (
              <>
                <Button 
                  onClick={onPause} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                  Pause
                </Button>
                <Button 
                  onClick={onComplete} 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Terminer
                </Button>
              </>
            )}
            {workshopStatus === "paused" && (
              <>
                <Button 
                  onClick={onResume} 
                  size="sm" 
                  className="rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Reprendre
                </Button>
                <Button 
                  onClick={onComplete} 
                  variant="destructive" 
                  size="sm" 
                  className="rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  Terminer
                </Button>
              </>
            )}
          </div>
        )}
      </div>
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
