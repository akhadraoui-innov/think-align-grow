import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, Trash2, Play, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { PlaygroundSession } from "@/hooks/usePlaygroundSessions";

export function PlateauSessionDrawer({
  sessions,
  onLoad,
  onDelete,
  onNew,
  activeId,
  accent,
}: {
  sessions: PlaygroundSession[];
  onLoad: (s: PlaygroundSession) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  activeId: string | null;
  accent: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-1.5" />
          Mes parties
          {sessions.length > 0 && (
            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted">
              {sessions.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Historique des parties</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle partie
          </Button>
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune partie sauvegardée pour ce toolkit.
            </p>
          )}
          {sessions.map((s) => {
            const placements = (s.placements as any[]) || [];
            const isActive = s.id === activeId;
            return (
              <div
                key={s.id}
                className="rounded-lg border p-3 hover:bg-muted/50 transition"
                style={isActive ? { borderColor: accent, background: accent + "0F" } : {}}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {placements.length} carte{placements.length > 1 ? "s" : ""} •{" "}
                      {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        onLoad(s);
                        setOpen(false);
                      }}
                      title="Charger"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette partie ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Action irréversible. La partie « {s.name} » sera supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(s.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
