import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AcademyPractice } from "@/components/academy/AcademyPractice";
import { Play, AlertTriangle } from "lucide-react";

interface PracticeTestDialogProps {
  moduleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function PracticeTestDialog({ moduleId, open, onOpenChange, title }: PracticeTestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Play className="h-4 w-4 text-violet-500" />
            Practice Studio{title ? ` — ${title}` : ""}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Mode test — Les échanges ne sont pas enregistrés
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {open && moduleId && (
            <AcademyPractice moduleId={moduleId} previewMode />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
