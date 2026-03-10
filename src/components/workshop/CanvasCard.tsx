import { useState, lazy, Suspense } from "react";
import { Trash2, BarChart3, Zap, PanelRight, Minimize2, Maximize2, Columns, Target, Footprints, Gem } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { cn } from "@/lib/utils";
import { CanvasItem } from "@/hooks/useCanvasItems";
import type { DbCard, DbPillar } from "@/hooks/useToolkitData";
import { getPillarGradient, getPillarIconName, PHASE_LABELS } from "@/hooks/useToolkitData";

// Dynamic icon loader for pillar icons
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const importFn = dynamicIconImports[kebab as keyof typeof dynamicIconImports];
  if (!importFn) return null;
  const LazyIcon = lazy(importFn);
  return (
    <Suspense fallback={<div className={className} />}>
      <LazyIcon className={className} />
    </Suspense>
  );
}
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
  item, card, pillar, isSelected, isDragging, creatorName,
  onPointerDown, onDelete, onUpdateContent,
}: CanvasCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const displayMode = item.content?.display_mode || "preview";
  const maturityLevel = item.content?.maturity_level || 0;

  const setDisplayMode = (mode: "section" | "preview" | "full" | "gamified") => {
    onUpdateContent({ display_mode: mode });
  };
  const setMaturityLevel = (level: number) => {
    onUpdateContent({ maturity_level: level });
  };

  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
  const pillarColorVar = `var(--pillar-${gradient})`;
  const pillarColor = `hsl(${pillarColorVar})`;

  const width = displayMode === "section" ? 220 : displayMode === "full" ? 420 : displayMode === "gamified" ? 240 : 280;

  const MaturitySelector = () => {
    const labels = ["Découverte", "En cours", "Maîtrisé"];
    return (
      <div className="flex gap-1.5 mt-3 w-full">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={(e) => { e.stopPropagation(); setMaturityLevel(level); }}
            className={cn(
              "flex-1 h-8 rounded-md border text-[9px] font-bold transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden group",
              maturityLevel >= level
                ? "border-transparent text-white shadow-sm"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
            )}
            style={{ backgroundColor: maturityLevel >= level ? pillarColor : 'transparent' }}
          >
            {maturityLevel >= level && <div className="absolute inset-0 bg-black/10" />}
            <span className="relative z-10">{labels[level-1]}</span>
          </button>
        ))}
      </div>
    );
  };

  const pillarIconName = pillar ? getPillarIconName(pillar.slug) : "Circle";

  // ═══════════════════════════════════════════
  // GAMIFIED MODE — Full-color collectible card
  // ═══════════════════════════════════════════
  if (displayMode === "gamified") {
    return (
      <>
        <div
          className={cn(
            "absolute rounded-3xl overflow-hidden select-none flex flex-col group transition-all animate-canvas-in",
            isSelected ? "ring-4 ring-white/40 shadow-2xl" : "shadow-xl hover:shadow-2xl",
            isDragging ? "opacity-90 cursor-grabbing scale-105" : "cursor-grab"
          )}
          style={{
            width: `${width}px`, left: item.x, top: item.y, zIndex: item.z_index,
            background: `linear-gradient(145deg, hsl(${pillarColorVar}), hsl(${pillarColorVar} / 0.85))`,
          }}
          onPointerDown={onPointerDown}
        >
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }} />

          {/* Top controls */}
          <div className={cn(
            "absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected && "opacity-100"
          )}>
            <button onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white/80 hover:bg-white/30 hover:text-white transition-colors">
              <PanelRight className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => {
              e.stopPropagation();
              const modes: Array<"section" | "preview" | "full" | "gamified"> = ["section", "preview", "full", "gamified"];
              setDisplayMode(modes[(modes.indexOf(displayMode as any) + 1) % modes.length]);
            }}
              className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white/80 hover:bg-white/30 hover:text-white transition-colors">
              <Gem className="h-3.5 w-3.5" />
            </button>
            {isSelected && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg bg-red-500/30 backdrop-blur-sm text-white/80 hover:bg-red-500/50 hover:text-white transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Card content */}
          <div className="relative p-5 flex flex-col items-center text-center min-h-[280px]">
            <div className="inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
                {PHASE_LABELS[card.phase] || card.phase}
              </span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-inner">
              <DynamicIcon name={pillarIconName} className="h-8 w-8 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">
              {pillar?.name || "Pilier"}
            </span>
            <h3 className="font-display font-black text-base uppercase tracking-tight leading-tight text-white mb-3 line-clamp-3">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-[11px] text-white/60 italic line-clamp-2 mb-3">{card.subtitle}</p>
            )}
            <div className="mt-auto flex gap-2 pt-3">
              {[1, 2, 3].map((level) => (
                <button key={level} onClick={(e) => { e.stopPropagation(); setMaturityLevel(level); }}
                  className={cn("h-3 w-3 rounded-full border-2 transition-all",
                    maturityLevel >= level ? "bg-white border-white shadow-lg shadow-white/30 scale-110" : "bg-transparent border-white/30 hover:border-white/60"
                  )} />
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
        <CardContextSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} card={card} pillar={pillar} item={item} onUpdateContent={onUpdateContent} />
      </>
    );
  }

  // ═══════════════════════════════════════════
  // SECTION MODE — compact colored card
  // ═══════════════════════════════════════════
  if (displayMode === "section") {
    return (
      <>
        <div
          className={cn(
            "absolute rounded-2xl select-none flex flex-col group transition-colors animate-canvas-in",
            isSelected ? "ring-2 ring-white/40 shadow-xl" : "shadow-md hover:shadow-lg",
            isDragging ? "opacity-90 cursor-grabbing" : "cursor-grab"
          )}
          style={{
            width: `${width}px`, left: item.x, top: item.y, zIndex: item.z_index,
            background: `linear-gradient(145deg, hsl(${pillarColorVar}), hsl(${pillarColorVar} / 0.85))`,
          }}
          onPointerDown={onPointerDown}
        >
          <div className="p-3 text-white">
            {/* Header with pillar + controls */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/70">
                {pillar?.name || "Pilier"}
              </span>
              <div className={cn(
                "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                isSelected && "opacity-100"
              )}>
                <button onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}
                  className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                  <PanelRight className="h-3 w-3" />
                </button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  const modes: Array<"section" | "preview" | "full" | "gamified"> = ["section", "preview", "full", "gamified"];
                  setDisplayMode(modes[(modes.indexOf("section") + 1) % modes.length]);
                }}
                  className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                  <Columns className="h-3 w-3" />
                </button>
                {isSelected && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 rounded hover:bg-red-500/30 text-white/70 hover:text-white transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="font-display font-black text-sm uppercase tracking-tight leading-tight text-white line-clamp-2 mb-2">
              {card.title}
            </h3>

            {/* Maturity dots */}
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3].map((level) => (
                <button key={level} onClick={(e) => { e.stopPropagation(); setMaturityLevel(level); }}
                  className={cn("h-2 w-2 rounded-full border transition-all",
                    maturityLevel >= level ? "bg-white border-white" : "bg-transparent border-white/40 hover:border-white/70"
                  )} />
              ))}
            </div>
          </div>
        </div>
        <CardContextSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} card={card} pillar={pillar} item={item} onUpdateContent={onUpdateContent} />
      </>
    );
  }

  // ═══════════════════════════════════════════
  // STANDARD MODES — preview / full
  // ═══════════════════════════════════════════
  return (
    <>
      <div
        className={cn(
          "absolute rounded-2xl bg-card border-2 select-none flex flex-col group transition-colors animate-canvas-in",
          isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20",
          isDragging ? "shadow-elevated opacity-90 cursor-grabbing" : "cursor-grab"
        )}
        style={{ width: `${width}px`, left: item.x, top: item.y, zIndex: item.z_index }}
        onPointerDown={onPointerDown}
      >
        {/* Pillar color bar */}
        <div className="h-2 w-full shrink-0 rounded-t-2xl" style={{ background: pillarColor }} />

        {/* Content */}
        <div className={cn("p-4", displayMode === "full" && "p-5")}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black uppercase tracking-widest rounded-full text-[9px] px-2 py-0.5"
                style={{ background: `hsl(${pillarColorVar} / 0.08)`, color: pillarColor }}>
                {pillar?.name || "Pilier"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {PHASE_LABELS[card.phase] || card.phase}
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isSelected && "opacity-100"
            )}>
              <button onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Ouvrir la fiche contexte">
                <PanelRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={(e) => {
                e.stopPropagation();
                const modes: Array<"section" | "preview" | "full" | "gamified"> = ["section", "preview", "full", "gamified"];
                setDisplayMode(modes[(modes.indexOf(displayMode as any) + 1) % modes.length]);
              }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Changer l'affichage">
                {displayMode === "preview" ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className={cn(
            "font-display font-black uppercase tracking-tight leading-tight",
            "text-lg mb-2", displayMode === "full" && "text-xl mb-3"
          )}>
            {card.title}
          </h3>

          {/* Subtitle */}
          {card.subtitle && (
            <p className="text-xs text-muted-foreground italic mb-2">{card.subtitle}</p>
          )}

          {/* Objective */}
          {displayMode === "full" && (card as any).objective && (
            <div className="flex items-start gap-2 mb-3">
              <Target className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: pillarColor }} />
              <p className="text-xs text-foreground/80 leading-relaxed">{(card as any).objective}</p>
            </div>
          )}

          {/* Definition */}
          {card.definition && (
            <p className={cn("text-xs text-foreground/80 leading-relaxed mb-3", displayMode === "preview" && "line-clamp-3")}>
              {card.definition}
            </p>
          )}

          {/* Action */}
          {card.action && (
            <div className="rounded-xl p-3 mb-3" style={{ background: `hsl(${pillarColorVar} / 0.04)`, borderLeft: `3px solid ${pillarColor}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3 w-3" style={{ color: pillarColor }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: pillarColor }}>
                  {(card as any).step_name || "Action"}
                </span>
              </div>
              <p className={cn("text-xs text-foreground leading-relaxed", displayMode === "preview" && "line-clamp-2")}>
                {card.action}
              </p>
            </div>
          )}

          {/* KPI */}
          {card.kpi && (
            <div className={cn("flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50", displayMode === "preview" ? "mb-2" : "mb-4")}>
              <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <div className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Indicateurs de maturité</div>
                <div className={cn("text-foreground/90 space-y-0.5", displayMode === "preview" && "line-clamp-3")}>
                  {card.kpi.split('\n').map((line, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", maturityLevel >= (i + 1) ? "opacity-100" : "opacity-30")}
                        style={{ background: pillarColor }} />
                      <span className={cn("text-[10px]", maturityLevel >= (i + 1) ? "font-bold" : "font-normal")}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: pillarColor }}>
                {creatorName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] text-muted-foreground">{creatorName}</span>
            </div>
            {isSelected && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Maturity selector */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Niveau de maturité</span>
            </div>
            <MaturitySelector />
          </div>
        </div>
      </div>

      <CardContextSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} card={card} pillar={pillar} item={item} onUpdateContent={onUpdateContent} />
    </>
  );
}
