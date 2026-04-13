import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, RefreshCw, Pencil, Eye, Save, Send, Lock, FileText, Sparkles,
} from "lucide-react";

interface QuotePreviewState {
  id: string | null;
  prospectName: string;
  segment: string;
  version: number;
  status: "draft" | "sent";
  quoteMarkdown: string;
  totals: Record<string, number>;
  engagementMonths: number;
  createdAt?: string;
  // For regeneration
  generatePayload?: Record<string, unknown>;
}

export default function AdminQuotePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as QuotePreviewState | null;

  const [markdown, setMarkdown] = useState(state?.quoteMarkdown || "");
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<"draft" | "sent">(state?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!state) {
    return (
      <AdminShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun devis sélectionné</p>
          <Button variant="outline" onClick={() => navigate("/admin/business")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />Retour
          </Button>
        </div>
      </AdminShell>
    );
  }

  const locked = status === "sent";
  const totals = state.totals || {};

  const handleSave = async () => {
    if (!state.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes")
        .update({ quote_markdown: markdown } as any).eq("id", state.id);
      if (error) throw error;
      toast.success("Devis sauvegardé");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleMarkSent = async () => {
    if (!state.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes")
        .update({ status: "sent", quote_markdown: markdown } as any).eq("id", state.id);
      if (error) throw error;
      setStatus("sent");
      toast.success("Devis marqué comme envoyé — verrouillé");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleRegenerate = async () => {
    if (!state.generatePayload) { toast.error("Données de génération manquantes"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("business-quote", {
        body: state.generatePayload,
      });
      if (error) throw error;
      setMarkdown(data.quote || "Erreur de génération");
      toast.success("Proposition régénérée");
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const engYears = Math.ceil((state.engagementMonths || 12) / 12);

  return (
    <AdminShell>
      <div className="min-h-screen bg-muted/30">
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/business")} className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />Retour
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <div>
                <h1 className="text-sm font-bold text-foreground">{state.prospectName}</h1>
                <p className="text-[10px] text-muted-foreground">{state.segment} · v{state.version}</p>
              </div>
              {locked
                ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 text-[10px]"><Lock className="h-3 w-3" />Envoyé</Badge>
                : <Badge variant="secondary" className="gap-1 text-[10px]"><Pencil className="h-3 w-3" />Brouillon</Badge>
              }
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { navigator.clipboard.writeText(markdown); toast.success("Copié !"); }}>
                <Copy className="h-3 w-3" />Copier
              </Button>
              {!locked && (
                <>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleRegenerate} disabled={generating}>
                    <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />{generating ? "…" : "Régénérer"}
                  </Button>
                  <Button size="sm" variant={editMode ? "default" : "outline"} className="text-xs gap-1" onClick={() => setEditMode(!editMode)}>
                    {editMode ? <><Eye className="h-3 w-3" />Aperçu</> : <><Pencil className="h-3 w-3" />Éditer</>}
                  </Button>
                  <Button size="sm" className="text-xs gap-1" onClick={handleSave} disabled={saving}>
                    <Save className="h-3 w-3" />{saving ? "…" : "Sauvegarder"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleMarkSent} disabled={saving}>
                    <Send className="h-3 w-3" />Envoyer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1100px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Document */}
          <div className="bg-background rounded-xl border border-border shadow-sm">
            {editMode && !locked ? (
              <Textarea
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                className="font-mono text-xs min-h-[80vh] border-0 rounded-xl p-6 focus-visible:ring-0"
              />
            ) : (
              <div className="p-8 md:p-12 prose prose-sm max-w-none">
                {/* Document header */}
                <div className="mb-8 pb-6 border-b-2 border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-widest">Proposition commerciale</span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{state.prospectName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {state.segment} · Version {state.version} · {state.createdAt ? new Date(state.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <EnrichedMarkdown content={markdown} />
              </div>
            )}
          </div>

          {/* Financial sidebar */}
          <div className="space-y-4">
            <Card className="border-border sticky top-20">
              <CardContent className="p-4 space-y-3 text-xs">
                <p className="font-bold text-foreground text-sm">Synthèse financière</p>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">MRR</span><span className="font-bold text-foreground">{(totals.mrr || 0).toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ARR</span><span className="font-bold text-foreground">{(totals.arr || 0).toLocaleString()}€</span></div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Setup (one-shot)</span><span className="font-medium text-foreground">{(totals.setup || 0).toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Services one-shot</span><span className="font-medium text-foreground">{(totals.servicesOneShot || 0).toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Services mensuels</span><span className="font-medium text-foreground">{(totals.servicesMonthly || 0).toLocaleString()}€/mois</span></div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-primary"><span>Année 1</span><span>{(totals.year1 || 0).toLocaleString()}€</span></div>
                  {engYears >= 2 && (
                    <div className="flex justify-between font-bold text-foreground"><span>Année 2</span><span>{(totals.year2 || 0).toLocaleString()}€</span></div>
                  )}
                  {engYears >= 3 && (
                    <div className="flex justify-between font-bold text-foreground"><span>Année 3</span><span>{(totals.year3 || 0).toLocaleString()}€</span></div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total contrat</span>
                  <span>{(totals.totalContract || totals.year1 || 0).toLocaleString()}€</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Engagement {state.engagementMonths} mois
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
