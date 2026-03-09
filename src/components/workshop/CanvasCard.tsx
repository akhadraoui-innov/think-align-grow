import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, BarChart3, Zap, PanelRight, Minimize2, Maximize2, Columns, Target, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";
import { CardContextSheet } from "./CardContextSheet";

interface CanvasCardProps {
  item: CanvasItem;
  card: DbCard;
  pillar: DbPillar | null;
  isSelected: boolean;
  isDragging: boolean;
  creatorName: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onUpdateContent: (content: Record<string, any>) => void;
}

export function CanvasCard({
  item,
  card,
  pillar,
  isSelected,
  isDragging,
  creatorName,
  onPointerDown,
  onDelete,
  onUpdateContent,
}: CanvasCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const displayMode = item.content?.display_mode || "preview"; // "light" | "preview" | "full"
  const maturityLevel = item.content?.maturity_level || 0; // 0, 1, 2, 3

  const setDisplayMode = (mode: "light" | "preview" | "full") => {
    onUpdateContent({ display_mode: mode });
  };

  const setMaturityLevel = (level: number) => {
    onUpdateContent({ maturity_level: level });
  };

  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
  const pillarColor = `hsl(var(--pillar-${gradient}))`;

  const width = displayMode === "light" ? 220 : displayMode === "full" ? 420 : 280;

  const MaturitySelector = () => {
    const labels = ["Découverte", "En cours", "Maîtrisé"];
    
    return (
      <div className="flex gap-1.5 mt-3 w-full">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={(e) => {
              e.stopPropagation();
              setMaturityLevel(level);
            }}
            className={cn(
              "flex-1 h-8 rounded-md border text-[9px] font-bold transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group",
              maturityLevel >= level 
                ? "border-transparent text-white shadow-sm" 
                : "border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
            )}
            style={{ 
              backgroundColor: maturityLevel >= level ? pillarColor : 'transparent',
            }}
          >
            {maturityLevel >= level && (
              <div className="absolute inset-0 bg-black/10" />
            )}
            <span className="relative z-10">{labels[level-1]}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <motion.div
        className={cn(
          "absolute rounded-2xl bg-card border-2 overflow-hidden select-none flex flex-col group transition-colors",
          isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20",
          isDragging ? "shadow-elevated opacity-90 cursor-grabbing" : "cursor-grab"
        )}
        style={{
          width: `${width}px`,
          left: item.x,
          top: item.y,
          zIndex: item.z_index,
        }}
        onPointerDown={onPointerDown}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Pillar color bar */}
        <div 
          className="h-2 w-full shrink-0"
          style={{ background: pillarColor }}
        />

        {/* Content */}
        <div className={cn("p-4", displayMode === "light" && "p-3", displayMode === "full" && "p-5")}>
          
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className={cn("font-black uppercase tracking-widest rounded-full", displayMode === "light" ? "text-[8px] px-1.5 py-0.5" : "text-[9px] px-2 py-0.5")}
                style={{ 
                  background: `${pillarColor}15`,
                  color: pillarColor,
                }}
              >
                {pillar?.name || "Pilier"}
              </span>
              {displayMode !== "light" && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {PHASE_LABELS[card.phase] || card.phase}
                </span>
              )}
            </div>

            {/* Controls - visible on hover or when selected */}
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isSelected && "opacity-100"
            )}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Ouvrir la fiche contexte"
              >
                <PanelRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setDisplayMode(displayMode === "light" ? "preview" : displayMode === "preview" ? "full" : "light"); 
                }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Changer l'affichage"
              >
                {displayMode === "light" ? <Columns className="h-3.5 w-3.5" /> : displayMode === "preview" ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className={cn(
            "font-display font-black uppercase tracking-tight leading-tight",
            displayMode === "light" ? "text-sm mb-2 line-clamp-2" : "text-lg mb-2",
            displayMode === "full" && "text-xl mb-3"
          )}>
            {card.title}
          </h3>

          {/* Subtitle */}
          {displayMode !== "light" && card.subtitle && (
            <p className="text-xs text-muted-foreground italic mb-2">
              {card.subtitle}
            </p>
          )}

          {/* Definition */}
          {displayMode !== "light" && card.definition && (
            <p className={cn(
              "text-xs text-foreground/80 leading-relaxed mb-3",
              displayMode === "preview" && "line-clamp-3"
            )}>
              {card.definition}
            </p>
          )}

          {/* Action */}
          {displayMode !== "light" && card.action && (
            <div 
              className="rounded-xl p-3 mb-3"
              style={{ background: `${pillarColor}08`, borderLeft: `3px solid ${pillarColor}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3 w-3" style={{ color: pillarColor }} />
                <span 
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: pillarColor }}
                >
                  Action
                </span>
              </div>
              <p className={cn(
                "text-xs text-foreground leading-relaxed",
                displayMode === "preview" && "line-clamp-2"
              )}>
                {card.action}
              </p>
            </div>
          )}

          {/* KPI */}
          {displayMode === "full" && card.kpi && (
            <div className="flex items-start gap-2 mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Indicateur clé</div>
                <div className="text-foreground/90">{card.kpi}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          {displayMode !== "light" && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div 
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: pillarColor }}
                >
                  {creatorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {creatorName}
                </span>
              </div>

              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Maturity selector */}
          <div className={cn("pt-2", displayMode === "light" && "mt-1 pt-1 border-t border-border/50")}>
            {displayMode !== "light" && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Niveau de maturité</span>
              </div>
            )}
            <MaturitySelector />
          </div>

        </div>
      </motion.div>

      <CardContextSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        card={card}
        pillar={pillar}
        item={item}
        onUpdateContent={onUpdateContent}
      />
    </>
  );
}