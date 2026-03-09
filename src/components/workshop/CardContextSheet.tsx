import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DbCard, DbPillar, getPillarGradient, PHASE_LABELS } from "@/hooks/useToolkitData";
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
  const gradient = pillar ? getPillarGradient(pillar.slug) : "primary";
  const pillarColor = `hsl(var(--pillar-${gradient}))`;

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
              <span 
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ 
                  background: `${pillarColor}15`,
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

            {/* Action */}
            {card.action && (
              <div 
                className="rounded-xl p-4"
                style={{ background: `${pillarColor}08`, borderLeft: `4px solid ${pillarColor}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" style={{ color: pillarColor }} />
                  <span 
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: pillarColor }}
                  >
                    Action recommandée
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {card.action}
                </p>
              </div>
            )}

            {/* KPI */}
            {card.kpi && (
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                <BarChart3 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Indicateur clé (KPI)
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {card.kpi}
                  </p>
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