import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DbCard, DbPillar, getPillarCssColor, getPillarCssColorAlpha, PHASE_LABELS } from "@/hooks/useToolkitData";
import { CanvasItem } from "@/hooks/useCanvasItems";
import { Zap, BarChart3, Target, Footprints } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CardContextSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  card: DbCard;
  pillar: DbPillar | null;
  item: CanvasItem;
  onUpdateContent: (content: Record<string, any>) => void;
}

export function CardContextSheet({ isOpen, onOpenChange, card, pillar, item, onUpdateContent }: CardContextSheetProps) {
  const slug = pillar?.slug || "";
  const dbCol = pillar?.color || null;
  const pillarColor = getPillarCssColor(slug, dbCol);
  const pillarColorAlpha = (a: number) => getPillarCssColorAlpha(slug, dbCol, a);

  const notes = item.content?.custom_notes || "";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-md flex flex-col p-0 border-l-0 z-[100]" onPointerDown={(e) => e.stopPropagation()}>
        <div 
          className="h-2 w-full shrink-0"
          style={{ background: pillarColor }}
        />
        <ScrollArea className="flex-1 p-6">
          <div className="mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              {(card as any).icon_name && (
                <span className="text-[10px] text-muted-foreground">
                  {(card as any).icon_name}
                </span>
              )}
              <span 
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ 
                  background: pillarColorAlpha(0.08),
                  color: pillarColor,
                }}
              >
                {pillar?.name || "Pilier"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {PHASE_LABELS[card.phase] || card.phase}
              </span>
            </div>
            <SheetTitle className="font-display font-black text-2xl uppercase tracking-tight leading-tight">
              {card.title}
            </SheetTitle>
            {card.subtitle && (
              <SheetDescription className="text-sm font-medium italic mt-2">
                {card.subtitle}
              </SheetDescription>
            )}
          </div>

          <div className="space-y-6 pb-12">
            {/* Objective */}
            {(card as any).objective && (
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: `${pillarColor}06` }}>
                <Target className="h-5 w-5 shrink-0 mt-0.5" style={{ color: pillarColor }} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: pillarColor }}>
                    Objectif
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {(card as any).objective}
                  </p>
                </div>
              </div>
            )}

            {/* Definition */}
            {card.definition && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Définition
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {card.definition}
                </p>
              </div>
            )}

            {/* Step + Action */}
            {card.action && (
              <div 
                className="rounded-xl p-4"
                style={{ background: `${pillarColor}08`, borderLeft: `4px solid ${pillarColor}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Footprints className="h-4 w-4" style={{ color: pillarColor }} />
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: pillarColor }}
                  >
                    {(card as any).step_name || "Action recommandée"}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {card.action}
                </p>
              </div>
            )}

            {/* KPI - Structured as 3 maturity indicators */}
            {card.kpi && (
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Indicateurs de maturité (KPI)
                  </h4>
                </div>
                <div className="space-y-2">
                  {card.kpi.split('\n').map((line, i) => {
                    const maturityLevel = item.content?.maturity_level || 0;
                    const isActive = maturityLevel >= (i + 1);
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                          isActive 
                            ? "border-transparent shadow-sm" 
                            : "border-border/50 bg-background/50"
                        )}
                        style={isActive ? { background: `${pillarColor}12` } : {}}
                      >
                        <div 
                          className={cn("h-3 w-3 rounded-full shrink-0", isActive ? "opacity-100" : "opacity-20")}
                          style={{ background: pillarColor }}
                        />
                        <span className={cn("text-sm", isActive ? "font-semibold" : "text-muted-foreground")}>
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Context Notes */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-foreground" />
                <h3 className="font-bold">Notes de contexte & Échanges</h3>
              </div>
              <Textarea 
                placeholder="Ajoutez des notes spécifiques à votre contexte, des idées d'application ou des remarques pour l'équipe..."
                className="min-h-[150px] resize-none"
                value={notes}
                onChange={(e) => onUpdateContent({ custom_notes: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Ces notes sont partagées avec tous les participants du workshop et sont sauvegardées automatiquement sur le canvas.
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}