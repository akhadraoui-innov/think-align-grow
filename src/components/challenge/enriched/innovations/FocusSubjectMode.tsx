import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  onSnapshot?: () => void;
}

/** Innovation #1 — Mode Focus : un sujet en plein écran "zen" */
export function FocusSubjectMode({ open, onOpenChange, title, children, onSnapshot }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 max-w-none w-screen h-screen p-0 gap-0 flex flex-col overflow-hidden rounded-none border-0 bg-background"
      >
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background/80 backdrop-blur shrink-0">
          <Maximize2 className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Mode Focus</p>
            <h2 className="font-display font-black text-base uppercase tracking-wider truncate">{title || "Sujet"}</h2>
          </div>
          {onSnapshot && (
            <Button size="sm" variant="outline" onClick={onSnapshot} className="font-bold text-[10px] uppercase">
              Capturer en PNG
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
