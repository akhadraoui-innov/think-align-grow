import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Loader2, ShieldAlert } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";

interface Props {
  userId: string;
  userEmail?: string | null;
  userLabel?: string | null;
}

export function ImpersonateButton({ userId, userEmail, userLabel }: Props) {
  const { isAdmin: isSuperAdmin } = useAdminRole();
  const { start } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  if (!isSuperAdmin) return null;

  async function handleConfirm() {
    setWorking(true);
    try {
      await start({ user_id: userId, reason: reason.trim() || undefined });
      setOpen(false);
      setReason("");
    } catch (e: any) {
      toast.error(e?.message ?? "Impersonation impossible");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" /> Voir comme cet utilisateur
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> Activer le mode support ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Vous allez ouvrir une session en tant que{" "}
                <strong className="text-foreground">
                  {userLabel || userEmail || userId}
                </strong>{" "}
                pendant 30 minutes maximum.
              </span>
              <span className="block text-xs">
                • Cette session est <strong>en lecture seule</strong> — aucune modification ne sera possible.<br />
                • L'opération est tracée dans le journal d'audit immuable.<br />
                • L'utilisateur recevra un email l'informant de cet accès (RGPD).
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium">
              Motif (recommandé, sera consigné)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ex : Ticket #1234 — investigation accès parcours"
              maxLength={500}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirm} disabled={working}>
                {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Générer le lien d'impersonation
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
