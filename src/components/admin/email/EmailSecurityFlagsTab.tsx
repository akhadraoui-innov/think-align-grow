import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Check, X, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props { organizationId: string | null }

const severityColor: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  critical: "bg-red-500/10 text-red-600 border-red-500/30",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
};

export function EmailSecurityFlagsTab({ organizationId }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const flags = useQuery({
    queryKey: ["email-security-flags", organizationId],
    queryFn: async () => {
      let q = supabase.from("email_security_flags").select("*").order("created_at", { ascending: false }).limit(200);
      if (organizationId) q = q.eq("organization_id", organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
      const { data, error } = await supabase.rpc("review_email_security_flag", {
        _flag_id: id,
        _decision: decision,
        _notes: reviewNotes || null,
      });
      if (error) throw error;
      const r = data as { success?: boolean; error?: string };
      if (!r?.success) throw new Error(r?.error ?? "review_failed");
    },
    onSuccess: (_, { decision }) => {
      toast.success(decision === "approved" ? "Email approuvé pour envoi" : "Blocage confirmé");
      setSelected(null);
      setReviewNotes("");
      qc.invalidateQueries({ queryKey: ["email-security-flags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (flags.data ?? []).filter((f: any) => f.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Security flags</h2>
          {pending > 0 && <Badge variant="destructive">{pending} en attente</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Emails bloqués pour suspicion de phishing, homoglyphes ou contenu non sanitizable.
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Quand</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>Raisons</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
            ) : (flags.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun email flaggé.</TableCell></TableRow>
            ) : (
              flags.data!.map((f: any) => {
                const reasons: string[] = Array.isArray(f.reasons) ? f.reasons : [];
                return (
                  <TableRow key={f.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(f.created_at), "dd MMM HH:mm", { locale: fr })}</TableCell>
                    <TableCell className="text-xs">{f.recipient_email ?? "—"}</TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate">{f.subject ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={severityColor[f.severity] ?? ""}>{f.severity}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {reasons.slice(0, 2).map((r, i) => <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>)}
                        {reasons.length > 2 && <Badge variant="outline" className="text-[10px]">+{reasons.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={statusColor[f.status] ?? ""}>{f.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setSelected(f)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flag de sécurité — détail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-muted-foreground">Destinataire</span><p className="font-mono text-xs">{selected.recipient_email}</p></div>
                <div><span className="text-xs text-muted-foreground">Sévérité</span><p><Badge className={severityColor[selected.severity]}>{selected.severity}</Badge></p></div>
                <div className="col-span-2"><span className="text-xs text-muted-foreground">Sujet</span><p>{selected.subject}</p></div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Raisons détectées</span>
                <ul className="mt-1 space-y-1">
                  {(Array.isArray(selected.reasons) ? selected.reasons : []).map((r: string, i: number) => (
                    <li key={i} className="text-xs"><Badge variant="outline" className="mr-2">{r}</Badge></li>
                  ))}
                </ul>
              </div>

              {selected.snippet && (
                <div>
                  <span className="text-xs text-muted-foreground">Extrait</span>
                  <pre className="mt-1 p-3 bg-muted rounded text-[10px] whitespace-pre-wrap break-all max-h-40 overflow-auto">{selected.snippet}</pre>
                </div>
              )}

              {selected.status === "pending" ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes de revue (optionnel)</label>
                    <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Justification de la décision…" className="text-xs" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={() => review.mutate({ id: selected.id, decision: "rejected" })} disabled={review.isPending}>
                      <X className="h-3.5 w-3.5 mr-1" /> Confirmer le blocage
                    </Button>
                    <Button size="sm" onClick={() => review.mutate({ id: selected.id, decision: "approved" })} disabled={review.isPending}>
                      {review.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Valider et envoyer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted p-3 text-xs">
                  <p className="font-medium">Décision : <Badge className={statusColor[selected.status]}>{selected.status}</Badge></p>
                  {selected.review_notes && <p className="mt-1 text-muted-foreground">{selected.review_notes}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
