import { History, RotateCcw, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePracticeVersions, useSnapshotPractice, useRestoreVersion } from "@/hooks/useAdminPractices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Props {
  practiceId: string;
}

export function VersionsTab({ practiceId }: Props) {
  const { data: versions = [] } = usePracticeVersions(practiceId);
  const snap = useSnapshotPractice();
  const restore = useRestoreVersion();

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Historique des versions
            </h3>
            <p className="text-xs text-muted-foreground">Snapshots manuels et automatiques. Restauration en 1 clic.</p>
          </div>
          <Button
            size="sm"
            onClick={() => snap.mutate({ practiceId, summary: "Snapshot manuel" })}
            disabled={snap.isPending}
          >
            {snap.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 mr-1.5" />}
            Capturer maintenant
          </Button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">Aucun snapshot encore enregistré.</p>
            ) : (
              versions.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono">v{v.version_number}</Badge>
                      <span className="text-xs font-medium truncate">{v.change_summary ?? "Snapshot"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restaurer v{v.version_number} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          La pratique sera remplacée par le snapshot. Cette action est irréversible — pensez à capturer la version actuelle avant.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => restore.mutate({ practiceId, snapshot: v.snapshot })}
                        >
                          Restaurer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
