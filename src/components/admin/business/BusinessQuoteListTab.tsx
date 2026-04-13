import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, Copy, Eye, Lock, Pencil, Trash2, User, FileText } from "lucide-react";

interface QuoteRecord {
  id: string;
  prospect_name: string;
  segment: string;
  user_count: number;
  sale_model_id: string;
  engagement_months: number;
  totals: Record<string, number>;
  quote_markdown: string;
  status: "draft" | "sent";
  version: number;
  parent_quote_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function BusinessQuoteListTab() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const grouped = useMemo(() => {
    const map = new Map<string, QuoteRecord[]>();
    quotes.forEach(q => {
      const key = q.prospect_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });
    map.forEach(v => v.sort((a, b) => b.version - a.version));
    return Array.from(map.entries());
  }, [quotes]);

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase.from("business_quotes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Devis supprimé");
      await fetchQuotes();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const duplicateQuote = async (q: QuoteRecord) => {
    try {
      const maxVersion = quotes
        .filter(x => x.prospect_name === q.prospect_name)
        .reduce((m, x) => Math.max(m, x.version), 0);
      const { error } = await supabase.from("business_quotes").insert({
        prospect_name: q.prospect_name,
        segment: q.segment,
        user_count: q.user_count,
        sale_model_id: q.sale_model_id,
        engagement_months: q.engagement_months,
        totals: q.totals,
        quote_markdown: q.quote_markdown,
        status: "draft",
        version: maxVersion + 1,
        parent_quote_id: q.id,
        created_by: q.created_by,
        role_configs: [] as any,
        selected_setup_ids: [] as any,
        selected_service_ids: [] as any,
      } as any);
      if (error) throw error;
      toast.success(`Nouvelle version v${maxVersion + 1} créée`);
      await fetchQuotes();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openPreview = (id: string) => {
    navigate("/admin/business/quote-preview", { state: { id } });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Chargement des devis…</p>;
  }

  if (quotes.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Aucun devis créé pour le moment</p>
          <p className="text-xs text-muted-foreground mt-1">Utilisez l'onglet "Nouveau devis" pour commencer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Liste des devis</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {quotes.length} devis · {grouped.length} prospect{grouped.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-2">
        {grouped.map(([prospect, versions]) => {
          const latestTotals = versions[0].totals;
          const sentCount = versions.filter(v => v.status === "sent").length;
          const draftCount = versions.filter(v => v.status === "draft").length;

          return (
            <Collapsible key={prospect} defaultOpen={grouped.length <= 5}>
              <Card className="border-border">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-sm">{prospect}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {versions.length} version{versions.length > 1 ? "s" : ""}
                            {sentCount > 0 && <span className="ml-1">· {sentCount} envoyé{sentCount > 1 ? "s" : ""}</span>}
                            {draftCount > 0 && <span className="ml-1">· {draftCount} brouillon{draftCount > 1 ? "s" : ""}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{(latestTotals.totalContract || latestTotals.year1 || 0).toLocaleString()}€</p>
                          <p className="text-[10px] text-muted-foreground">MRR {(latestTotals.mrr || 0).toLocaleString()}€</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-2 font-medium text-muted-foreground">Date</th>
                            <th className="text-center p-2 font-medium text-muted-foreground">Version</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Statut</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Segment</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">MRR</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">Total contrat</th>
                            <th className="text-center p-2 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {versions.map(q => {
                            const t = q.totals;
                            return (
                              <tr key={q.id} className="border-b border-border/20 hover:bg-muted/20">
                                <td className="p-2 text-muted-foreground">{new Date(q.updated_at).toLocaleDateString("fr-FR")}</td>
                                <td className="p-2 text-center">
                                  <Badge variant="outline" className="text-[9px]">v{q.version}</Badge>
                                </td>
                                <td className="p-2">
                                  {q.status === "sent" ? (
                                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                      <Lock className="h-2.5 w-2.5 mr-0.5" />Envoyé
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[9px]">
                                      <Pencil className="h-2.5 w-2.5 mr-0.5" />Brouillon
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-2 text-muted-foreground">{q.segment}</td>
                                <td className="p-2 text-right font-medium text-foreground">{(t.mrr || 0).toLocaleString()}€</td>
                                <td className="p-2 text-right font-bold text-primary">{(t.totalContract || t.year1 || 0).toLocaleString()}€</td>
                                <td className="p-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openPreview(q.id)} title="Voir">
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicateQuote(q)} title="Dupliquer">
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    {q.status === "draft" && (
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteQuote(q.id)} title="Supprimer">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
