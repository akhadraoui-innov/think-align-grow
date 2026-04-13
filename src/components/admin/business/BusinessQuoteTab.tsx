import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_PRICING_ROLES, DEFAULT_SALE_MODELS, DEFAULT_SEGMENTS,
  DEFAULT_SETUP_FEES, DEFAULT_SERVICES,
  type QuoteRoleConfig, type ModuleConfig, type SegmentConfig, type ChannelConfig, type PricingRole, type SaleModel,
} from "./businessConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, FileText, Calculator, Plus, Send, Lock, Eye, Pencil, History, Trash2, ExternalLink, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface QuoteRecord {
  id: string;
  prospect_name: string;
  segment: string;
  user_count: number;
  challenges: string;
  sale_model_id: string;
  role_configs: QuoteRoleConfig[];
  selected_setup_ids: string[];
  selected_service_ids: string[];
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

const defaultRoleConfigs = (roles: PricingRole[]): QuoteRoleConfig[] =>
  roles.map(r => ({
    roleId: r.id,
    planId: r.defaultPlanId,
    count: r.valueLevel === "strategic" ? 2 : r.valueLevel === "operational" ? 5 : 20,
  }));

/* helper — parse avg price from a priceRange string like "3 000 - 8 000€/mois" */
const parsePriceAvg = (priceRange: string): number => {
  const match = priceRange.match(/[\d\s]+/g);
  if (!match) return 0;
  return match.reduce((a, n) => a + parseInt(n.replace(/\s/g, ""), 10), 0) / match.length;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface BusinessQuoteTabProps {
  modules?: ModuleConfig[];
  segments?: SegmentConfig[];
  channels?: ChannelConfig[];
  pricingRoles?: PricingRole[];
  saleModels?: SaleModel[];
}

export function BusinessQuoteTab({
  modules: externalModules,
  segments: externalSegments,
  channels: externalChannels,
  pricingRoles: externalPricingRoles,
  saleModels: externalSaleModels,
}: BusinessQuoteTabProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const activePricingRoles = externalPricingRoles || DEFAULT_PRICING_ROLES;
  const activeSegments = externalSegments || DEFAULT_SEGMENTS;
  const activeSaleModels = externalSaleModels || DEFAULT_SALE_MODELS;
  const activeModules = externalModules;
  const activeChannels = externalChannels;

  /* ---------- list state ---------- */
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  /* ---------- form state ---------- */
  const [prospectName, setProspectName] = useState("");
  const [segment, setSegment] = useState("");
  const [userCount, setUserCount] = useState(50);
  const [challenges, setChallenges] = useState("");
  const [saleModelId, setSaleModelId] = useState("saas-conseil");
  const [roleConfigs, setRoleConfigs] = useState<QuoteRoleConfig[]>(defaultRoleConfigs(activePricingRoles));
  const [selectedSetupIds, setSelectedSetupIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [engagementMonths, setEngagementMonths] = useState(12);
  const [quoteMarkdown, setQuoteMarkdown] = useState("");
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [version, setVersion] = useState(1);
  const [parentQuoteId, setParentQuoteId] = useState<string | null>(null);

  /* ---------- ui state ---------- */
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const saleModel = activeSaleModels.find(m => m.id === saleModelId)!;
  const locked = status === "sent";
  const engagementDiscount = engagementMonths === 24 ? 0.10 : engagementMonths === 36 ? 0.15 : 0;

  /* ---------- totals with one-shot vs recurring ---------- */
  const totals = useMemo(() => {
    let mrrBeforeDiscount = 0;
    roleConfigs.forEach(rc => {
      const role = activePricingRoles.find(r => r.id === rc.roleId);
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

    // Categorize services: one-shot vs recurring monthly
    let servicesOneShot = 0;
    let servicesMonthly = 0;
    selectedServiceIds.forEach(id => {
      const svc = DEFAULT_SERVICES.find(sv => sv.id === id);
      if (!svc) return;
      const avg = parsePriceAvg(svc.priceRange);
      if (svc.priceModel === "Mensuel") {
        servicesMonthly += avg;
      } else {
        servicesOneShot += avg;
      }
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
  }, [roleConfigs, selectedSetupIds, selectedServiceIds, engagementDiscount, engagementMonths, activePricingRoles]);

  /* ---------- fetch list ---------- */
  const fetchQuotes = useCallback(async () => {
    setListLoading(true);
    const { data } = await supabase
      .from("business_quotes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setQuotes(data as unknown as QuoteRecord[]);
    setListLoading(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  /* ---------- load quote into form ---------- */
  const loadQuote = (q: QuoteRecord) => {
    setActiveId(q.id);
    setProspectName(q.prospect_name);
    setSegment(q.segment);
    setUserCount(q.user_count);
    setChallenges(q.challenges || "");
    setSaleModelId(q.sale_model_id);
    setRoleConfigs(q.role_configs as QuoteRoleConfig[]);
    setSelectedSetupIds(q.selected_setup_ids as string[]);
    setSelectedServiceIds(q.selected_service_ids as string[]);
    setEngagementMonths(q.engagement_months);
    setQuoteMarkdown(q.quote_markdown || "");
    setStatus(q.status as "draft" | "sent");
    setVersion(q.version);
    setParentQuoteId(q.parent_quote_id);
  };

  /* ---------- new quote ---------- */
  const resetForm = () => {
    setActiveId(null);
    setProspectName("");
    setSegment("");
    setUserCount(50);
    setChallenges("");
    setSaleModelId("saas-conseil");
    setRoleConfigs(defaultRoleConfigs(activePricingRoles));
    setSelectedSetupIds([]);
    setSelectedServiceIds([]);
    setEngagementMonths(12);
    setQuoteMarkdown("");
    setStatus("draft");
    setVersion(1);
    setParentQuoteId(null);
  };

  /* ---------- build generate payload ---------- */
  const buildGeneratePayload = () => {
    const rolesPayload = roleConfigs.filter(rc => rc.count > 0).map(rc => {
      const role = activePricingRoles.find(r => r.id === rc.roleId)!;
      const plan = role.plans.find(p => p.id === rc.planId)!;
      return { roleName: role.name, planName: plan.name, count: rc.count, price: plan.pricePerUser, billing: plan.billing };
    });

    const oneShotSvcs = selectedServiceIds
      .map(id => DEFAULT_SERVICES.find(s => s.id === id))
      .filter(s => s && s.priceModel !== "Mensuel");
    const recurringSvcs = selectedServiceIds
      .map(id => DEFAULT_SERVICES.find(s => s.id === id))
      .filter(s => s && s.priceModel === "Mensuel");

    return {
      prospectName, segment, userCount, challenges,
      saleModel: { label: saleModel.label, description: saleModel.description },
      roles: rolesPayload,
      setupFees: selectedSetupIds.map(id => DEFAULT_SETUP_FEES.find(f => f.id === id)).filter(Boolean),
      servicesOneShot: oneShotSvcs,
      servicesRecurring: recurringSvcs,
      engagement: engagementMonths, totals,
      activeModules: activeModules?.filter(m => m.active).map(m => m.name),
      mainChannels: activeChannels?.slice(0, 3).map(c => ({ name: c.name, share: c.share })),
    };
  };

  /* ---------- save ---------- */
  const saveQuote = async () => {
    if (!prospectName || !segment) { toast.error("Nom du prospect et segment requis"); return; }
    if (!user) { toast.error("Non authentifié"); return; }
    setSaving(true);
    const payload = {
      prospect_name: prospectName, segment, user_count: userCount, challenges,
      sale_model_id: saleModelId, role_configs: roleConfigs as unknown as Record<string, unknown>[],
      selected_setup_ids: selectedSetupIds, selected_service_ids: selectedServiceIds,
      engagement_months: engagementMonths, totals, quote_markdown: quoteMarkdown,
      status, version, parent_quote_id: parentQuoteId, created_by: user.id,
    };
    try {
      if (activeId) {
        const { error } = await supabase.from("business_quotes").update(payload as any).eq("id", activeId);
        if (error) throw error;
        toast.success("Devis sauvegardé");
      } else {
        const { data, error } = await supabase.from("business_quotes").insert(payload as any).select().single();
        if (error) throw error;
        setActiveId((data as any).id);
        toast.success("Devis créé");
      }
      await fetchQuotes();
    } catch (e: any) {
      toast.error(e.message || "Erreur de sauvegarde");
    } finally { setSaving(false); }
  };

  /* ---------- mark sent ---------- */
  const markSent = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes").update({ status: "sent" } as any).eq("id", activeId);
      if (error) throw error;
      setStatus("sent");
      toast.success("Devis marqué comme envoyé — verrouillé");
      await fetchQuotes();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  /* ---------- duplicate (new version) ---------- */
  const duplicateAsNewVersion = async () => {
    if (!activeId || !user) return;
    const maxVersion = quotes.filter(q => q.parent_quote_id === parentQuoteId || q.id === activeId || q.parent_quote_id === activeId)
      .reduce((m, q) => Math.max(m, q.version), version);
    const payload = {
      prospect_name: prospectName, segment, user_count: userCount, challenges,
      sale_model_id: saleModelId, role_configs: roleConfigs as unknown as Record<string, unknown>[],
      selected_setup_ids: selectedSetupIds, selected_service_ids: selectedServiceIds,
      engagement_months: engagementMonths, totals, quote_markdown: quoteMarkdown,
      status: "draft", version: maxVersion + 1, parent_quote_id: activeId, created_by: user.id,
    };
    setSaving(true);
    try {
      const { data, error } = await supabase.from("business_quotes").insert(payload as any).select().single();
      if (error) throw error;
      await fetchQuotes();
      loadQuote(data as unknown as QuoteRecord);
      toast.success(`Nouvelle version v${maxVersion + 1} créée`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  /* ---------- delete draft ---------- */
  const deleteDraft = async () => {
    if (!activeId || locked) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("business_quotes").delete().eq("id", activeId);
      if (error) throw error;
      resetForm();
      await fetchQuotes();
      toast.success("Devis supprimé");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  /* ---------- generate AI ---------- */
  const generateQuote = async () => {
    if (!prospectName || !segment) { toast.error("Renseignez le nom du prospect et le segment"); return; }
    setGenerating(true);
    try {
      const payload = buildGeneratePayload();
      const { data, error } = await supabase.functions.invoke("business-quote", { body: payload });
      if (error) throw error;
      setQuoteMarkdown(data.quote || "Erreur de génération");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally { setGenerating(false); }
  };

  /* ---------- open preview ---------- */
  const openPreview = async () => {
    // Save current state to DB first so preview reads fresh data
    if (activeId && !locked) {
      const payload = {
        prospect_name: prospectName, segment, user_count: userCount, challenges,
        sale_model_id: saleModelId, role_configs: roleConfigs as unknown as Record<string, unknown>[],
        selected_setup_ids: selectedSetupIds, selected_service_ids: selectedServiceIds,
        engagement_months: engagementMonths, totals, quote_markdown: quoteMarkdown,
        status, version, parent_quote_id: parentQuoteId,
      };
      await supabase.from("business_quotes").update(payload as any).eq("id", activeId);
    }
    navigate("/admin/business/quote-preview", { state: { id: activeId } });
  };

  const updateRoleConfig = (roleId: string, field: keyof QuoteRoleConfig, value: string | number) => {
    setRoleConfigs(prev => prev.map(rc => rc.roleId === roleId ? { ...rc, [field]: value } : rc));
  };

  const engYears = Math.ceil(engagementMonths / 12);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Nouveau devis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configurez et générez votre proposition commerciale</p>
        </div>
        <Button onClick={resetForm} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Réinitialiser</Button>
      </div>
        {/* ---- History bar ---- */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" />Historique ({quotes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {listLoading ? (
              <p className="text-xs text-muted-foreground p-2">Chargement…</p>
            ) : quotes.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">Aucun devis sauvegardé</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {quotes.map(q => (
                    <button key={q.id} onClick={() => loadQuote(q)}
                      className={`p-2.5 rounded-lg border text-left transition-all text-xs ${activeId === q.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card border-border hover:border-primary/30"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">{q.prospect_name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className="text-[9px]">v{q.version}</Badge>
                          {q.status === "sent"
                            ? <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-200"><Lock className="h-2.5 w-2.5 mr-0.5" />Envoyé</Badge>
                            : <Badge variant="secondary" className="text-[9px]">Brouillon</Badge>}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{q.segment} · {new Date(q.updated_at).toLocaleDateString("fr-FR")}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* ---- Main grid ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Config */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status bar */}
            {activeId && (
              <div className="flex items-center gap-2 flex-wrap">
                {locked ? (
                  <>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><Lock className="h-3 w-3" />Envoyé — Lecture seule</Badge>
                    <Button size="sm" variant="outline" onClick={duplicateAsNewVersion} disabled={saving} className="text-xs gap-1"><Copy className="h-3 w-3" />Nouvelle version</Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="gap-1"><Pencil className="h-3 w-3" />Brouillon v{version}</Badge>
                    <Button size="sm" onClick={saveQuote} disabled={saving} className="text-xs gap-1"><FileText className="h-3 w-3" />{saving ? "…" : "Sauvegarder"}</Button>
                    <Button size="sm" variant="outline" onClick={markSent} disabled={saving} className="text-xs gap-1"><Send className="h-3 w-3" />Marquer envoyé</Button>
                    <Button size="sm" variant="ghost" onClick={deleteDraft} disabled={saving} className="text-xs gap-1 text-destructive"><Trash2 className="h-3 w-3" />Supprimer</Button>
                  </>
                )}
              </div>
            )}

            {/* A — Contexte */}
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Contexte prospect</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nom du prospect *</Label>
                  <Input value={prospectName} onChange={e => setProspectName(e.target.value)} placeholder="Ex: Capgemini — DRH" className="h-9 text-sm" disabled={locked} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Segment *</Label>
                  <Select value={segment} onValueChange={setSegment} disabled={locked}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{activeSegments.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre d'utilisateurs total : {userCount}</Label>
                  <Slider value={[userCount]} onValueChange={v => setUserCount(v[0])} min={5} max={2000} step={5} disabled={locked} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Enjeux / contexte</Label>
                  <Textarea value={challenges} onChange={e => setChallenges(e.target.value)} placeholder="Ex: Montée en compétences IA de 200 managers..." rows={2} className="text-sm" disabled={locked} />
                </div>
              </CardContent>
            </Card>

            {/* B — Modèle de vente */}
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Modèle de vente</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {activeSaleModels.map(m => (
                    <button key={m.id} onClick={() => !locked && setSaleModelId(m.id)} disabled={locked}
                      className={`p-3 rounded-lg border text-left transition-all text-xs ${saleModelId === m.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card border-border hover:border-primary/30"} ${locked ? "opacity-70 cursor-not-allowed" : ""}`}>
                      <p className="font-semibold text-foreground">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                      <div className="flex gap-1 mt-1.5">
                        {m.includesSetup && <Badge variant="secondary" className="text-[9px]">Setup</Badge>}
                        {m.includesServices && <Badge variant="secondary" className="text-[9px]">Services</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* C — Rôles */}
            <Card className="border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Composition par rôle</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2 font-medium text-muted-foreground">Rôle</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Plan</th>
                        <th className="text-center p-2 font-medium text-muted-foreground">Nb users</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Prix/user</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Sous-total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleConfigs.map(rc => {
                        const role = activePricingRoles.find(r => r.id === rc.roleId)!;
                        const plan = role.plans.find(p => p.id === rc.planId)!;
                        const subtotal = plan.billing === "usage" ? 0 : plan.pricePerUser * rc.count;
                        return (
                          <tr key={rc.roleId} className="border-b border-border/30">
                            <td className="p-2">
                              <p className="font-medium text-foreground">{role.name}</p>
                              <Badge variant="outline" className="text-[9px]">{role.valueLevel}</Badge>
                            </td>
                            <td className="p-2">
                              <Select value={rc.planId} onValueChange={v => updateRoleConfig(rc.roleId, "planId", v)} disabled={locked}>
                                <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>{role.plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.pricePerUser}€</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 text-center">
                              <Input type="number" value={rc.count} onChange={e => updateRoleConfig(rc.roleId, "count", Number(e.target.value))} className="w-16 h-7 text-center text-xs mx-auto" min={0} disabled={locked} />
                            </td>
                            <td className="p-2 text-right font-medium text-foreground">{plan.pricePerUser}€/{plan.billing === "annual" ? "an" : plan.billing === "usage" ? "usage" : "mois"}</td>
                            <td className="p-2 text-right font-bold text-primary">{subtotal > 0 ? `${subtotal}€` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* D — Setup & Services */}
            {(saleModel.includesSetup || saleModel.includesServices) && (
              <Card className="border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Setup & Services</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {saleModel.includesSetup && (
                    <div>
                      <Label className="text-xs font-semibold text-foreground">Setup fees <Badge variant="outline" className="text-[9px] ml-1">One-shot Y1</Badge></Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {DEFAULT_SETUP_FEES.filter(f => f.maxPrice > 0).map(fee => (
                          <label key={fee.id} className={`flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer text-xs ${locked ? "opacity-70 pointer-events-none" : ""}`}>
                            <Checkbox checked={selectedSetupIds.includes(fee.id)} onCheckedChange={c => setSelectedSetupIds(prev => c ? [...prev, fee.id] : prev.filter(id => id !== fee.id))} className="mt-0.5" disabled={locked} />
                            <div>
                              <p className="font-medium text-foreground">{fee.name}</p>
                              <p className="text-[10px] text-muted-foreground">{fee.description}</p>
                              <Badge variant="outline" className="text-[9px] mt-1">{fee.minPrice.toLocaleString()}–{fee.maxPrice.toLocaleString()}€</Badge>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {saleModel.includesServices && (
                    <div>
                      <Label className="text-xs font-semibold text-foreground">Services</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {DEFAULT_SERVICES.map(svc => (
                          <label key={svc.id} className={`flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer text-xs ${locked ? "opacity-70 pointer-events-none" : ""}`}>
                            <Checkbox checked={selectedServiceIds.includes(svc.id)} onCheckedChange={c => setSelectedServiceIds(prev => c ? [...prev, svc.id] : prev.filter(id => id !== svc.id))} className="mt-0.5" disabled={locked} />
                            <div>
                              <p className="font-medium text-foreground">{svc.name}</p>
                              <p className="text-[10px] text-muted-foreground">{svc.description}</p>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-[9px]">{svc.priceRange}</Badge>
                                <Badge variant={svc.priceModel === "Mensuel" ? "default" : "secondary"} className="text-[9px]">
                                  {svc.priceModel === "Mensuel" ? "Récurrent" : "One-shot"}
                                </Badge>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Durée d'engagement : {engagementMonths} mois {engagementDiscount > 0 && <Badge variant="secondary" className="text-[9px] ml-1">-{Math.round(engagementDiscount * 100)}%</Badge>}</Label>
                    <div className="flex gap-2">
                      {[12, 24, 36].map(m => (
                        <Button key={m} size="sm" variant={engagementMonths === m ? "default" : "outline"} onClick={() => !locked && setEngagementMonths(m)} disabled={locked} className="text-xs h-7 px-3">{m} mois</Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — Summary + AI */}
          <div className="space-y-5">
            {/* E — Récap */}
            <Card className="border-border bg-card sticky top-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Récapitulatif</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-medium">Revenus récurrents</p>
                  {roleConfigs.filter(rc => rc.count > 0).map(rc => {
                    const role = activePricingRoles.find(r => r.id === rc.roleId)!;
                    const plan = role.plans.find(p => p.id === rc.planId)!;
                    const sub = plan.billing === "usage" ? 0 : plan.pricePerUser * rc.count;
                    if (sub <= 0) return null;
                    return <div key={rc.roleId} className="flex justify-between"><span>{role.name} ({rc.count}×{plan.pricePerUser}€)</span><span className="font-medium text-foreground">{sub}€/m</span></div>;
                  })}
                  {engagementDiscount > 0 && <div className="flex justify-between text-primary"><span>Remise engagement</span><span>-{Math.round(engagementDiscount * 100)}%</span></div>}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-foreground"><span>MRR</span><span>{totals.mrr.toLocaleString()}€</span></div>
                <div className="flex justify-between font-bold text-foreground"><span>ARR</span><span>{totals.arr.toLocaleString()}€</span></div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-muted-foreground font-medium">One-shot (Année 1)</p>
                  <div className="flex justify-between"><span>Setup fees</span><span className="font-medium text-foreground">{totals.setup.toLocaleString()}€</span></div>
                  <div className="flex justify-between"><span>Services one-shot</span><span className="font-medium text-foreground">{totals.servicesOneShot.toLocaleString()}€</span></div>
                </div>
                {totals.servicesMonthly > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground font-medium">Récurrent mensuel</p>
                      <div className="flex justify-between"><span>Services mensuels</span><span className="font-medium text-foreground">{totals.servicesMonthly.toLocaleString()}€/mois</span></div>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-primary"><span>Année 1</span><span>{totals.year1.toLocaleString()}€</span></div>
                {engYears >= 2 && <div className="flex justify-between font-bold text-foreground"><span>Année 2</span><span>{totals.year2.toLocaleString()}€</span></div>}
                {engYears >= 3 && <div className="flex justify-between font-bold text-foreground"><span>Année 3</span><span>{totals.year3.toLocaleString()}€</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary"><span>Total contrat</span><span>{totals.totalContract.toLocaleString()}€</span></div>
                <p className="text-[10px] text-muted-foreground text-center">Engagement {engagementMonths} mois · Marge {totals.margin}%</p>

                {!activeId && (
                  <>
                    <Separator />
                    <Button onClick={saveQuote} disabled={saving || !prospectName || !segment} className="w-full text-xs gap-1">
                      <FileText className="h-3.5 w-3.5" />{saving ? "Sauvegarde…" : "Sauvegarder le devis"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* F — Génération IA */}
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                {!locked && (
                  <Button onClick={generateQuote} disabled={generating} className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    {generating ? "Génération en cours…" : "Générer la proposition IA"}
                  </Button>
                )}
                {quoteMarkdown && (
                  <Button onClick={openPreview} variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />Voir le devis
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* ======================== SYNTHESIS TAB ======================== */}
      <TabsContent value="synthesis" className="space-y-6">
        {/* Pipeline KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pipeline MRR cumulé</p>
              <p className="text-2xl font-bold text-primary">{pipelineTotals.totalMRR.toLocaleString()}€</p>
              <p className="text-[10px] text-muted-foreground">{groupedByProspect.size} prospect{groupedByProspect.size > 1 ? "s" : ""} engagé{groupedByProspect.size > 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pipeline ARR cumulé</p>
              <p className="text-2xl font-bold text-foreground">{pipelineTotals.totalARR.toLocaleString()}€</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Valeur contrats totale</p>
              <p className="text-2xl font-bold text-foreground">{pipelineTotals.totalContract.toLocaleString()}€</p>
            </CardContent>
          </Card>
        </div>

        {/* Sent quotes table */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Devis envoyés par prospect</CardTitle>
          </CardHeader>
          <CardContent>
            {sentQuotes.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">Aucun devis envoyé pour le moment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-2 font-medium text-muted-foreground">Prospect</th>
                      <th className="text-center p-2 font-medium text-muted-foreground">Version</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Segment</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Date envoi</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">MRR</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">ARR</th>
                      <th className="text-right p-2 font-medium text-muted-foreground">Total contrat</th>
                      <th className="text-center p-2 font-medium text-muted-foreground">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentQuotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(q => {
                      const t = q.totals as Record<string, number>;
                      return (
                        <tr key={q.id} className="border-b border-border/30 hover:bg-muted/30 cursor-pointer" onClick={() => { loadQuote(q); }}>
                          <td className="p-2 font-semibold text-foreground">{q.prospect_name}</td>
                          <td className="p-2 text-center"><Badge variant="outline" className="text-[9px]">v{q.version}</Badge></td>
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
      </TabsContent>
    </Tabs>
  );
}
