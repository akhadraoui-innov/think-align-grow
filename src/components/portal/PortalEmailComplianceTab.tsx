import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Shield, AlertTriangle } from "lucide-react";
import { useExportEmailData, useEraseEmailData } from "@/hooks/useEmailCompliance";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PortalEmailComplianceTab() {
  const exportMut = useExportEmailData();
  const eraseMut = useEraseEmailData();
  const [confirm, setConfirm] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      {/* Export RGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            Exporter mes données email
          </CardTitle>
          <CardDescription>
            Téléchargez en JSON l'ensemble de vos préférences, historique d'envois, suppressions et tokens — au format
            portable conforme RGPD (article 20).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Toutes vos préférences par catégorie et organisation</li>
            <li>Historique complet des emails reçus (avec statuts)</li>
            <li>Liste des suppressions (bounces, désinscriptions)</li>
          </ul>
          <Button
            onClick={() => exportMut.mutate(undefined)}
            disabled={exportMut.isPending}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMut.isPending ? "Génération…" : "Télécharger l'export JSON"}
          </Button>
        </CardContent>
      </Card>

      {/* Droit à l'oubli */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4 text-destructive" />
            Effacer mes données email
          </CardTitle>
          <CardDescription>
            Droit à l'oubli (RGPD article 17). Anonymise vos logs d'envoi et supprime définitivement vos préférences,
            tokens et données associées à votre adresse email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Action irréversible. Votre adresse sera ajoutée à la liste de suppression et ne recevra plus jamais
              d'emails marketing. Les emails transactionnels essentiels (sécurité du compte) restent envoyés.
            </p>
          </div>
          <AlertDialog onOpenChange={(o) => !o && setConfirm("")}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Demander l'effacement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  Confirmer l'effacement RGPD
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Pour confirmer, tapez <strong>EFFACER</strong> ci-dessous. Vos préférences, tokens et liens
                  d'historique seront définitivement supprimés ou anonymisés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-erase">Confirmation</Label>
                <Input
                  id="confirm-erase"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="EFFACER"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirm !== "EFFACER" || eraseMut.isPending}
                  onClick={() => eraseMut.mutate(undefined)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {eraseMut.isPending ? "Effacement…" : "Effacer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
