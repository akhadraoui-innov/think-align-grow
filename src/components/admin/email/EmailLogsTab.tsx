import { useMemo } from "react";
import { Download, Mail, AlertCircle, Eye, MousePointer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmailRuns, useEmailStats } from "@/hooks/useEmailStats";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function EmailLogsTab({ organizationId }: { organizationId: string | null }) {
  const { data: runs = [], isLoading } = useEmailRuns({ organization_id: organizationId, limit: 200 });
  const { data: stats = [] } = useEmailStats(organizationId);

  const totals = useMemo(() => {
    return runs.reduce((acc, r) => {
      acc.total++;
      if (r.status === "sent") acc.sent++;
      if (r.status === "failed") acc.failed++;
      if (r.opened_at) acc.opened++;
      if (r.clicked_at) acc.clicked++;
      return acc;
    }, { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 });
  }, [runs]);

  const exportCSV = () => {
    const rows = [
      ["created_at", "status", "trigger_event", "template_code", "recipient_email", "provider_used", "error"],
      ...runs.map(r => [r.created_at, r.status, r.trigger_event, r.template_code, r.recipient_email, r.provider_used || "", r.error || ""]),
    ];
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Logs & Statistiques</h2>
          <p className="text-xs text-muted-foreground">{runs.length} envois récents</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" />Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={Mail} label="Total" value={totals.total} color="text-foreground" />
        <KPI icon={Mail} label="Envoyés" value={totals.sent} color="text-emerald-600" />
        <KPI icon={AlertCircle} label="Échecs" value={totals.failed} color="text-destructive" />
        <KPI icon={Eye} label="Ouverts" value={totals.opened} color="text-blue-600" />
        <KPI icon={MousePointer} label="Clics" value={totals.clicked} color="text-violet-600" />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Tracking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Chargement…</TableCell></TableRow>
            )}
            {runs.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.created_at), "dd MMM HH:mm", { locale: fr })}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.trigger_event}</Badge></TableCell>
                <TableCell className="text-xs"><code>{r.template_code}</code></TableCell>
                <TableCell className="text-xs">{r.recipient_email}</TableCell>
                <TableCell className="text-xs">{r.provider_used || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={r.status === "sent" ? "default" : r.status === "failed" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {r.status}
                  </Badge>
                  {r.error && <div className="text-[10px] text-destructive mt-1 max-w-[240px] truncate">{r.error}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  {r.opened_at && <Eye className="h-3 w-3 inline text-blue-600 mr-1" />}
                  {r.clicked_at && <MousePointer className="h-3 w-3 inline text-violet-600" />}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && runs.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Aucun envoi enregistré</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </Card>
  );
}
