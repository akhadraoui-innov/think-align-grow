import { useState } from "react";
import { Ban, RotateCw, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmailSuppressions, useReactivateSuppression, useAddSuppression } from "@/hooks/useEmailSuppressions";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  bounce: { label: "Rebond", color: "bg-destructive/10 text-destructive" },
  complaint: { label: "Plainte", color: "bg-orange-500/10 text-orange-600" },
  unsubscribe: { label: "Désinscription", color: "bg-blue-500/10 text-blue-600" },
  manual: { label: "Manuel", color: "bg-muted text-muted-foreground" },
};

export function EmailSuppressionsTab({ organizationId }: { organizationId: string | null }) {
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(true);
  const [adding, setAdding] = useState<{ email: string; reason: "bounce" | "complaint" | "unsubscribe" | "manual" } | null>(null);

  const { data: suppressions = [], isLoading } = useEmailSuppressions(organizationId, {
    activeOnly,
    reason: reasonFilter === "all" ? undefined : reasonFilter,
  });
  const reactivate = useReactivateSuppression();
  const addSuppression = useAddSuppression();

  const handleReactivate = async (id: string, email: string) => {
    try {
      await reactivate.mutateAsync(id);
      toast.success(`${email} réactivée`, { description: "Cette adresse pourra de nouveau recevoir des emails" });
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  const handleAdd = async () => {
    if (!adding?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adding.email)) {
      toast.error("Email invalide"); return;
    }
    try {
      await addSuppression.mutateAsync({ email: adding.email, organization_id: organizationId, reason: adding.reason });
      toast.success("Adresse ajoutée à la liste de suppression");
      setAdding(null);
    } catch (e: any) {
      toast.error("Erreur", { description: e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Ban className="h-4 w-4" />Adresses supprimées</h2>
          <p className="text-xs text-muted-foreground">{suppressions.length} adresse(s) sur ce périmètre</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes raisons</SelectItem>
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setActiveOnly(!activeOnly)}>
            {activeOnly ? "Afficher tout" : "Actives uniquement"}
          </Button>
          <Button size="sm" onClick={() => setAdding({ email: "", reason: "manual" })}>
            <Plus className="h-3 w-3 mr-1" />Ajouter
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">Chargement…</TableCell></TableRow>}
            {!isLoading && suppressions.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">Aucune adresse supprimée</TableCell></TableRow>
            )}
            {suppressions.map(s => {
              const rmeta = REASON_LABELS[s.reason] ?? REASON_LABELS.manual;
              return (
                <TableRow key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs">{s.email}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${rmeta.color}`} variant="outline">{rmeta.label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.source_provider || "—"}</TableCell>
                  <TableCell className="text-xs">{format(new Date(s.suppressed_at), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                  <TableCell>
                    {s.is_active
                      ? <Badge variant="destructive" className="text-[10px]">Bloquée</Badge>
                      : <Badge variant="secondary" className="text-[10px]">Réactivée</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost"><RotateCw className="h-3 w-3 mr-1" />Réactiver</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Réactiver {s.email} ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette adresse pourra de nouveau recevoir des emails. Les rebonds futurs la re-bloqueront automatiquement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReactivate(s.id, s.email)}>Réactiver</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!adding} onOpenChange={o => !o && setAdding(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une adresse à supprimer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={adding?.email || ""} onChange={e => setAdding(prev => prev ? { ...prev, email: e.target.value } : null)} />
            </div>
            <div>
              <Label className="text-xs">Raison</Label>
              <Select value={adding?.reason} onValueChange={(v: any) => setAdding(prev => prev ? { ...prev, reason: v } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(null)}>Annuler</Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
