import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Filter, CalendarIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface QuoteRecord {
  id: string;
  prospect_name: string;
  segment: string;
  user_count: number;
  engagement_months: number;
  totals: Record<string, number>;
  status: "draft" | "sent";
  version: number;
  created_at: string;
  updated_at: string;
}

export function BusinessQuoteSynthesisTab() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [filterProspect, setFilterProspect] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("business_quotes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setQuotes(data as unknown as QuoteRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const prospects = useMemo(() => [...new Set(quotes.map(q => q.prospect_name))], [quotes]);

  const filtered = useMemo(() => {
    return quotes.filter(q => {
      if (filterProspect && q.prospect_name !== filterProspect) return false;
      if (filterStatus !== "all" && q.status !== filterStatus) return false;
      if (filterDateFrom && new Date(q.updated_at) < filterDateFrom) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59);
        if (new Date(q.updated_at) > to) return false;
      }
      const total = q.totals?.totalContract || q.totals?.year1 || 0;
      if (filterMinAmount && total < Number(filterMinAmount)) return false;
      if (filterMaxAmount && total > Number(filterMaxAmount)) return false;
      return true;
    });
  }, [quotes, filterProspect, filterStatus, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount]);

  const kpis = useMemo(() => {
    // Deduplicate by prospect — latest version only
    const byProspect = new Map<string, QuoteRecord>();
    filtered.forEach(q => {
      const existing = byProspect.get(q.prospect_name);
      if (!existing || q.version > existing.version) byProspect.set(q.prospect_name, q);
    });
    let totalMRR = 0, totalARR = 0, totalContract = 0;
    byProspect.forEach(q => {
      totalMRR += q.totals?.mrr || 0;
      totalARR += q.totals?.arr || 0;
      totalContract += q.totals?.totalContract || q.totals?.year1 || 0;
    });
    return {
      count: filtered.length,
      prospects: byProspect.size,
      totalMRR,
      totalARR,
      totalContract,
      avgContract: byProspect.size > 0 ? Math.round(totalContract / byProspect.size) : 0,
    };
  }, [filtered]);

  const resetFilters = () => {
    setFilterProspect("");
    setFilterStatus("all");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setFilterMinAmount("");
    setFilterMaxAmount("");
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Synthèse pipeline</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Vue agrégée et filtrée de votre pipeline commercial</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4 text-primary" />Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prospect</Label>
              <Select value={filterProspect || "all"} onValueChange={v => setFilterProspect(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {prospects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !filterDateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {filterDateFrom ? format(filterDateFrom, "dd/MM/yyyy") : "Depuis"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} locale={fr} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 w-full text-xs justify-start", !filterDateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {filterDateTo ? format(filterDateTo, "dd/MM/yyyy") : "Jusqu'à"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} locale={fr} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Montant min (€)</Label>
              <Input type="number" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} placeholder="0" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Montant max (€)</Label>
              <Input type="number" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} placeholder="∞" className="h-8 text-xs" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" onClick={resetFilters} className="text-xs">Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Devis", value: kpis.count.toString(), color: "" },
          { label: "Prospects", value: kpis.prospects.toString(), color: "" },
          { label: "Pipeline MRR", value: `${kpis.totalMRR.toLocaleString()}€`, color: "text-primary" },
          { label: "Pipeline ARR", value: `${kpis.totalARR.toLocaleString()}€`, color: "" },
          { label: "Valeur totale", value: `${kpis.totalContract.toLocaleString()}€`, color: "text-primary" },
          { label: "Valeur moyenne", value: `${kpis.avgContract.toLocaleString()}€`, color: "" },
        ].map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color || "text-foreground"}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtered table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Résultats ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">Aucun devis correspondant aux filtres</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-2 font-medium text-muted-foreground">Prospect</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Version</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Segment</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">MRR</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">ARR</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Total contrat</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => {
                    const t = q.totals;
                    return (
                      <tr key={q.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="p-2 font-semibold text-foreground">{q.prospect_name}</td>
                        <td className="p-2 text-center"><Badge variant="outline" className="text-[9px]">v{q.version}</Badge></td>
                        <td className="p-2">
                          {q.status === "sent"
                            ? <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-200">Envoyé</Badge>
                            : <Badge variant="secondary" className="text-[9px]">Brouillon</Badge>}
                        </td>
                        <td className="p-2 text-muted-foreground">{q.segment}</td>
                        <td className="p-2 text-muted-foreground">{new Date(q.updated_at).toLocaleDateString("fr-FR")}</td>
                        <td className="p-2 text-right font-medium text-foreground">{(t.mrr || 0).toLocaleString()}€</td>
                        <td className="p-2 text-right font-medium text-foreground">{(t.arr || 0).toLocaleString()}€</td>
                        <td className="p-2 text-right font-bold text-primary">{(t.totalContract || t.year1 || 0).toLocaleString()}€</td>
                        <td className="p-2 text-center">{q.engagement_months}m</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
