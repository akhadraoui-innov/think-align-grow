import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DEFAULT_PRICING_ROLES, DEFAULT_SETUP_FEES, DEFAULT_SERVICES, DEFAULT_SALE_MODELS,
  type PricingRole, type QuoteRoleConfig,
} from "@/components/admin/business/businessConfig";
import {
  ArrowLeft, Copy, RefreshCw, Pencil, Eye, Save, Send, Lock, FileText, Sparkles, Printer,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared totals calculation (mirrors BusinessQuoteTab logic)         */
/* ------------------------------------------------------------------ */
const parsePriceAvg = (priceRange: string): number => {
  const match = priceRange.match(/[\d\s]+/g);
  if (!match) return 0;
  return match.reduce((a, n) => a + parseInt(n.replace(/\s/g, ""), 10), 0) / match.length;
};

function computeTotals(
  roleConfigs: QuoteRoleConfig[],
  selectedSetupIds: string[],
  selectedServiceIds: string[],
  engagementMonths: number,
  pricingRoles: PricingRole[] = DEFAULT_PRICING_ROLES,
) {
  const engagementDiscount = engagementMonths === 24 ? 0.10 : engagementMonths === 36 ? 0.15 : 0;
  let mrrBeforeDiscount = 0;
  roleConfigs.forEach(rc => {
    const role = pricingRoles.find(r => r.id === rc.roleId);
    const plan = role?.plans.find(p => p.id === rc.planId);
    if (!plan || rc.count <= 0 || plan.billing === "usage") return;
    mrrBeforeDiscount += plan.pricePerUser * rc.count;
  });
  const discountAmount = mrrBeforeDiscount * engagementDiscount;
  const mrr = mrrBeforeDiscount - discountAmount;
  const arr = mrr * 12;

  const setup = selectedSetupIds.reduce((s, id) => {
    const fee = DEFAULT_SETUP_FEES.find(f => f.id === id);
    return s + (fee ? (fee.minPrice + fee.maxPrice) / 2 : 0);
  }, 0);

  let servicesOneShot = 0;
  let servicesMonthly = 0;
  selectedServiceIds.forEach(id => {
    const svc = DEFAULT_SERVICES.find(sv => sv.id === id);
    if (!svc) return;
    const avg = parsePriceAvg(svc.priceRange);
    if (svc.priceModel === "Mensuel") servicesMonthly += avg;
    else servicesOneShot += avg;
  });

  const year1 = arr + setup + servicesOneShot + (servicesMonthly * 12);
  const year2 = engagementMonths >= 24 ? arr + (servicesMonthly * 12) : 0;
  const year3 = engagementMonths >= 36 ? arr + (servicesMonthly * 12) : 0;
  const totalContract = year1 + year2 + year3;
  const margin = year1 > 0 ? Math.round(((year1 - year1 * 0.3) / year1) * 100) : 0;

  return {
    mrr: Math.round(mrr), arr: Math.round(arr),
    mrrBeforeDiscount: Math.round(mrrBeforeDiscount),
    discountAmount: Math.round(discountAmount * 12),
    discountPercent: engagementDiscount * 100,
    setup: Math.round(setup),
    servicesOneShot: Math.round(servicesOneShot),
    servicesMonthly: Math.round(servicesMonthly),
    year1: Math.round(year1), year2: Math.round(year2), year3: Math.round(year3),
    totalContract: Math.round(totalContract), margin,
  };
}

/* ------------------------------------------------------------------ */
/*  Build AI generate payload from DB record                           */
/* ------------------------------------------------------------------ */
function buildPayloadFromRecord(q: any, totals: Record<string, number>) {
  const roleConfigs = (q.role_configs || []) as QuoteRoleConfig[];
  const saleModel = DEFAULT_SALE_MODELS.find(m => m.id === q.sale_model_id);

  const rolesPayload = roleConfigs.filter(rc => rc.count > 0).map(rc => {
    const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId)!;
    const plan = role?.plans.find(p => p.id === rc.planId);
    return { roleName: role?.name, planName: plan?.name, count: rc.count, price: plan?.pricePerUser, billing: plan?.billing };
  });

  const selectedServiceIds = (q.selected_service_ids || []) as string[];
  const oneShotSvcs = selectedServiceIds.map(id => DEFAULT_SERVICES.find(s => s.id === id)).filter(s => s && s.priceModel !== "Mensuel");
  const recurringSvcs = selectedServiceIds.map(id => DEFAULT_SERVICES.find(s => s.id === id)).filter(s => s && s.priceModel === "Mensuel");

  return {
    prospectName: q.prospect_name,
    segment: q.segment,
    userCount: q.user_count,
    challenges: q.challenges,
    saleModel: saleModel ? { label: saleModel.label, description: saleModel.description } : {},
    roles: rolesPayload,
    setupFees: (q.selected_setup_ids || []).map((id: string) => DEFAULT_SETUP_FEES.find(f => f.id === id)).filter(Boolean),
    servicesOneShot: oneShotSvcs,
    servicesRecurring: recurringSvcs,
    engagement: q.engagement_months,
    totals,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AdminQuotePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const quoteId = (location.state as any)?.id as string | null;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  /* ---------- Load from DB ---------- */
  useEffect(() => {
    if (!quoteId) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase.from("business_quotes").select("*").eq("id", quoteId).single();
      if (error || !data) { toast.error("Devis introuvable"); setLoading(false); return; }
      setQuote(data);
      setMarkdown((data as any).quote_markdown || "");
      setStatus((data as any).status as "draft" | "sent");
      setLoading(false);
    })();
  }, [quoteId]);

  /* ---------- Compute live totals from DB config ---------- */
  const totals = useMemo(() => {
    if (!quote) return { mrr: 0, arr: 0, mrrBeforeDiscount: 0, discountAmount: 0, discountPercent: 0, setup: 0, servicesOneShot: 0, servicesMonthly: 0, year1: 0, year2: 0, year3: 0, totalContract: 0, margin: 0 };
    return computeTotals(
      (quote.role_configs || []) as QuoteRoleConfig[],
      (quote.selected_setup_ids || []) as string[],
      (quote.selected_service_ids || []) as string[],
      quote.engagement_months || 12,
    );
  }, [quote]);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  if (!quote) {
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
  const engYears = Math.ceil((quote.engagement_months || 12) / 12);
  const docRef = `GI-${new Date(quote.created_at).getFullYear()}-${String(quote.version).padStart(3, "0")}`;

  /* ---------- Save ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes")
        .update({ quote_markdown: markdown, totals } as any).eq("id", quoteId);
      if (error) throw error;
      toast.success("Devis sauvegardé");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  /* ---------- Mark sent ---------- */
  const handleMarkSent = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes")
        .update({ status: "sent", quote_markdown: markdown, totals } as any).eq("id", quoteId);
      if (error) throw error;
      setStatus("sent");
      toast.success("Devis marqué comme envoyé — verrouillé");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  /* ---------- Regenerate ---------- */
  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const payload = buildPayloadFromRecord(quote, totals);
      const { data, error } = await supabase.functions.invoke("business-quote", { body: payload });
      if (error) throw error;
      const newMd = data.quote || "Erreur de génération";
      setMarkdown(newMd);
      // Auto-save after regen
      await supabase.from("business_quotes")
        .update({ quote_markdown: newMd, totals } as any).eq("id", quoteId);
      toast.success("Proposition régénérée et sauvegardée");
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <AdminShell>
      <div className="min-h-screen bg-muted/30 print:bg-white">
        {/* ──── Sticky toolbar ──── */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 print:hidden">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/business")} className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />Retour
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <div>
                <h1 className="text-sm font-bold text-foreground">{quote.prospect_name}</h1>
                <p className="text-[10px] text-muted-foreground">{quote.segment} · v{quote.version} · {docRef}</p>
              </div>
              {locked
                ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 text-[10px]"><Lock className="h-3 w-3" />Envoyé</Badge>
                : <Badge variant="secondary" className="gap-1 text-[10px]"><Pencil className="h-3 w-3" />Brouillon</Badge>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { navigator.clipboard.writeText(markdown); toast.success("Copié !"); }}>
                <Copy className="h-3 w-3" />Copier
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
                <Printer className="h-3 w-3" />Imprimer
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
                  <Button size="sm" variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-600 hover:bg-emerald-50" onClick={handleMarkSent} disabled={saving}>
                    <Send className="h-3 w-3" />Envoyer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ──── Content ──── */}
        <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 print:grid-cols-1 print:max-w-none print:px-0">

          {/* ──── Document panel ──── */}
          <div className="bg-background rounded-xl border border-border shadow-sm print:shadow-none print:border-0 print:rounded-none">
            {editMode && !locked ? (
              <Textarea
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                className="font-mono text-xs min-h-[80vh] border-0 rounded-xl p-6 focus-visible:ring-0"
              />
            ) : (
              <div className="p-8 md:p-12 lg:p-16">
                {/* ── Letterhead ── */}
                <div className="flex items-start justify-between mb-10 pb-8 border-b-2 border-primary/20">
                  <div className="flex items-center gap-4">
                    <Logo size="lg" />
                    <div>
                      <span className="font-display text-lg font-bold uppercase tracking-wider text-foreground">GROWTHINNOV</span>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">AI Acceleration Platform</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    <p className="font-mono text-[10px]">Réf : {docRef}</p>
                    <p>{new Date(quote.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p>Version {quote.version}</p>
                  </div>
                </div>

                {/* ── Title block ── */}
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">Proposition commerciale</span>
                  </div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">{quote.prospect_name}</h1>
                  <p className="text-sm text-muted-foreground">{quote.segment} · Engagement {quote.engagement_months} mois</p>
                </div>

                {/* ── Markdown body ── */}
                <div className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:font-display prose-headings:tracking-tight
                  prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
                  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                  prose-p:leading-[1.85] prose-p:text-foreground/80
                  prose-li:leading-[1.8]
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-table:text-sm
                  prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold
                  prose-td:px-4 prose-td:py-2.5 prose-td:border-t
                  prose-strong:text-foreground
                ">
                  <EnrichedMarkdown content={markdown} />
                </div>

                {/* ── Footer ── */}
                <div className="mt-16 pt-8 border-t-2 border-primary/20 flex items-center justify-between text-[10px] text-muted-foreground">
                  <p>Ce document est confidentiel et destiné exclusivement à {quote.prospect_name}.</p>
                  <p className="font-mono">{docRef} · v{quote.version}</p>
                </div>
              </div>
            )}
          </div>

          {/* ──── Financial sidebar ──── */}
          <div className="space-y-4 print:hidden">
            <Card className="border-border sticky top-20">
              <CardContent className="p-5 space-y-4 text-xs">
                <p className="font-display font-bold text-foreground text-sm">Synthèse financière</p>
                <Separator />

                {/* SaaS */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Abonnement SaaS</p>
                  {totals.discountPercent > 0 && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">MRR brut</span><span className="text-muted-foreground line-through">{totals.mrrBeforeDiscount.toLocaleString()}€</span></div>
                      <div className="flex justify-between text-emerald-600"><span>Remise -{totals.discountPercent}%</span><span className="font-semibold">-{totals.discountAmount.toLocaleString()}€/an</span></div>
                    </>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">MRR</span><span className="font-bold text-foreground">{totals.mrr.toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ARR</span><span className="font-bold text-foreground">{totals.arr.toLocaleString()}€</span></div>
                </div>
                <Separator />

                {/* One-shot */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">One-shot (Année 1)</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Setup</span><span className="font-medium text-foreground">{totals.setup.toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Services</span><span className="font-medium text-foreground">{totals.servicesOneShot.toLocaleString()}€</span></div>
                </div>
                <Separator />

                {/* Recurring */}
                {totals.servicesMonthly > 0 && (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Récurrent mensuel</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Services</span><span className="font-medium text-foreground">{totals.servicesMonthly.toLocaleString()}€/mois</span></div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Years */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Détail par année</p>
                  <div className="flex justify-between font-semibold text-primary"><span>Année 1</span><span>{totals.year1.toLocaleString()}€</span></div>
                  {engYears >= 2 && (
                    <div className="flex justify-between font-semibold text-foreground"><span>Année 2</span><span>{totals.year2.toLocaleString()}€</span></div>
                  )}
                  {engYears >= 3 && (
                    <div className="flex justify-between font-semibold text-foreground"><span>Année 3</span><span>{totals.year3.toLocaleString()}€</span></div>
                  )}
                </div>
                <Separator />

                {/* Total */}
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total contrat</span>
                    <span>{totals.totalContract.toLocaleString()}€</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Engagement {quote.engagement_months} mois
                  </p>
                  {totals.discountPercent > 0 && (
                    <p className="text-[10px] text-emerald-600 text-center font-medium mt-0.5">
                      Économie engagement : {totals.discountAmount.toLocaleString()}€/an
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
