import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Globe, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

export function WebhookAllowlistTab() {
  const qc = useQueryClient();
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [matchSuffix, setMatchSuffix] = useState(true);

  const list = useQuery({
    queryKey: ["webhook-allowlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_allowlist_domains")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!cleaned) throw new Error("Domaine requis");
      const { error } = await supabase.from("webhook_allowlist_domains").insert({
        domain: cleaned,
        description: description.trim() || null,
        match_suffix: matchSuffix,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domaine ajouté à la allowlist");
      setDomain(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["webhook-allowlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("webhook_allowlist_domains").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-allowlist"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_allowlist_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domaine supprimé");
      qc.invalidateQueries({ queryKey: ["webhook-allowlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Tous les appels HTTP sortants (webhooks, providers email, intégrations) sont vérifiés contre cette allowlist.
            Les IPs privées et loopback sont systématiquement bloquées (protection SSRF).
          </p>
          <p>
            <strong>Match suffix</strong> : autorise tous les sous-domaines (ex: <code>resend.com</code> autorise <code>api.resend.com</code>).
          </p>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" />Ajouter un domaine</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="text-xs text-muted-foreground">Domaine</label>
            <Input placeholder="api.resend.com" value={domain} onChange={e => setDomain(e.target.value)} />
          </div>
          <div className="md:col-span-5">
            <label className="text-xs text-muted-foreground">Description</label>
            <Input placeholder="Provider email Resend" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <Switch checked={matchSuffix} onCheckedChange={setMatchSuffix} id="match-suffix" />
            <label htmlFor="match-suffix" className="text-xs text-muted-foreground">Match suffix</label>
          </div>
          <div className="md:col-span-1">
            <Button onClick={() => add.mutate()} disabled={add.isPending} size="sm" className="w-full">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domaine</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
            ) : (list.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Allowlist vide — aucun webhook sortant ne pourra fonctionner.</TableCell></TableRow>
            ) : (
              list.data!.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{d.domain}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.description || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.match_suffix ? "Suffix" : "Exact"}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={d.is_active} onCheckedChange={v => toggle.mutate({ id: d.id, is_active: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Supprimer ${d.domain} ?`)) remove.mutate(d.id); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
