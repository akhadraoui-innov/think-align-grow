import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { CheckCircle2, ArrowRight, Layers } from "lucide-react";
import type { FlowNode } from "./flowData";
import { LAYER_CONFIG, getNodeById } from "./flowData";

interface FlowDetailSheetProps {
  node: FlowNode | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function FlowDetailSheet({ node, open, onClose, onNavigate }: FlowDetailSheetProps) {
  if (!node) return null;
  const layer = LAYER_CONFIG[node.layer];
  const Icon = node.icon;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Icon + Layer badge */}
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg", layer.bg)}>
              <Icon className={cn("h-6 w-6", layer.text)} />
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", layer.border, layer.text)}>
              {LAYER_CONFIG[node.layer].label}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-black">{node.label}</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">{node.description}</SheetDescription>
        </SheetHeader>

        {/* Detail */}
        <div className="space-y-6 mt-2">
          {/* Description longue */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm leading-relaxed text-foreground/80">{node.detail}</p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Fonctionnalités clés
            </h4>
            <div className="space-y-2">
              {node.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", layer.bg.replace("/10", "/60"))} />
                  <span className="text-sm text-foreground/70">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" /> Technologies
            </h4>
            <div className="flex flex-wrap gap-2">
              {node.techBadges.map((b) => (
                <Badge key={b} variant="secondary" className="text-[10px] font-semibold">{b}</Badge>
              ))}
            </div>
          </div>

          {/* Connected nodes */}
          {node.connections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5" /> Nœuds connectés
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {node.connections.map((cid) => {
                  const connected = getNodeById(cid);
                  if (!connected) return null;
                  const cLayer = LAYER_CONFIG[connected.layer];
                  const CIcon = connected.icon;
                  return (
                    <Button
                      key={cid}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 h-auto py-2 px-3"
                      onClick={() => onNavigate(cid)}
                    >
                      <CIcon className={cn("h-4 w-4 shrink-0", cLayer.text)} />
                      <span className="text-xs font-medium truncate">{connected.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
