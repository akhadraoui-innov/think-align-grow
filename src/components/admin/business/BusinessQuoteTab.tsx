import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  DEFAULT_PRICING_ROLES, DEFAULT_SALE_MODELS, DEFAULT_SEGMENTS,
  DEFAULT_SETUP_FEES, DEFAULT_SERVICES,
  type QuoteRoleConfig,
} from "./businessConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, FileText, Calculator, Plus, Send, Lock, Eye, Pencil, History, Trash2 } from "lucide-react";
import { EnrichedMarkdown } from "@/components/academy/EnrichedMarkdown";
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

const defaultRoleConfigs = (): QuoteRoleConfig[] =>
  DEFAULT_PRICING_ROLES.map(r => ({
    roleId: r.id,
    planId: r.defaultPlanId,
    count: r.valueLevel === "strategic" ? 2 : r.valueLevel === "operational" ? 5 : 20,
  }));

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
  const [roleConfigs, setRoleConfigs] = useState<QuoteRoleConfig[]>(defaultRoleConfigs());
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
  const [editMode, setEditMode] = useState(false);

  const saleModel = DEFAULT_SALE_MODELS.find(m => m.id === saleModelId)!;
  const locked = status === "sent";
  const engagementDiscount = engagementMonths === 24 ? 0.10 : engagementMonths === 36 ? 0.15 : 0;

  /* ---------- totals ---------- */
  const totals = useMemo(() => {
    let mrr = 0;
    roleConfigs.forEach(rc => {
      const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId);
      const plan = role?.plans.find(p => p.id === rc.planId);
      if (!plan || rc.count <= 0 || plan.billing === "usage") return;
      mrr += plan.pricePerUser * rc.count;
    });
    mrr = mrr * (1 - engagementDiscount);
    const arr = mrr * 12;
    const setup = selectedSetupIds.reduce((s, id) => {
      const fee = DEFAULT_SETUP_FEES.find(f => f.id === id);
      return s + (fee ? (fee.minPrice + fee.maxPrice) / 2 : 0);
    }, 0);
    const services = selectedServiceIds.reduce((s, id) => {
      const svc = DEFAULT_SERVICES.find(sv => sv.id === id);
      if (!svc) return s;
      const match = svc.priceRange.match(/[\d\s]+/g);
      const avg = match ? match.reduce((a, n) => a + parseInt(n.replace(/\s/g, ""), 10), 0) / match.length : 0;
      return s + avg;
    }, 0);
    const year1 = arr + setup + services;
    const margin = year1 > 0 ? Math.round(((year1 - year1 * 0.3) / year1) * 100) : 0;
    return { mrr: Math.round(mrr), arr: Math.round(arr), setup: Math.round(setup), services: Math.round(services), year1: Math.round(year1), margin };
  }, [roleConfigs, selectedSetupIds, selectedServiceIds, engagementDiscount]);

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
    setEditMode(false);
  };

  /* ---------- new quote ---------- */
  const resetForm = () => {
    setActiveId(null);
    setProspectName("");
    setSegment("");
    setUserCount(50);
    setChallenges("");
    setSaleModelId("saas-conseil");
    setRoleConfigs(defaultRoleConfigs());
    setSelectedSetupIds([]);
    setSelectedServiceIds([]);
    setEngagementMonths(12);
    setQuoteMarkdown("");
    setStatus("draft");
    setVersion(1);
    setParentQuoteId(null);
    setEditMode(false);
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
      const rolesPayload = roleConfigs.filter(rc => rc.count > 0).map(rc => {
        const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId)!;
        const plan = role.plans.find(p => p.id === rc.planId)!;
        return { roleName: role.name, planName: plan.name, count: rc.count, price: plan.pricePerUser, billing: plan.billing };
      });
      const { data, error } = await supabase.functions.invoke("business-quote", {
        body: {
          prospectName, segment, userCount, challenges,
          saleModel: { label: saleModel.label, description: saleModel.description },
          roles: rolesPayload,
          setupFees: selectedSetupIds.map(id => DEFAULT_SETUP_FEES.find(f => f.id === id)).filter(Boolean),
          services: selectedServiceIds.map(id => DEFAULT_SERVICES.find(s => s.id === id)).filter(Boolean),
          engagement: engagementMonths, totals,
        },
      });
      if (error) throw error;
      setQuoteMarkdown(data.quote || "Erreur de génération");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally { setGenerating(false); }
  };

  const updateRoleConfig = (roleId: string, field: keyof QuoteRoleConfig, value: string | number) => {
    setRoleConfigs(prev => prev.map(rc => rc.roleId === roleId ? { ...rc, [field]: value } : rc));
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Configurateur de devis IA</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Composez, historisez et versionnez vos propositions commerciales</p>
        </div>
        <Button onClick={resetForm} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nouveau devis</Button>
      </div>

      {/* ---- History bar ---- */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" />Historique des devis ({quotes.length})</CardTitle>
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
                  <SelectContent>{DEFAULT_SEGMENTS.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
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
                {DEFAULT_SALE_MODELS.map(m => (
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
                      const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId)!;
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
                    <Label className="text-xs font-semibold text-foreground">Setup fees</Label>
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
                            <Badge variant="outline" className="text-[9px] mt-1">{svc.priceRange}</Badge>
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

        {/* Right column — Summary + AI + Preview */}
        <div className="space-y-5">
          {/* E — Récap */}
          <Card className="border-border bg-card sticky top-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Récapitulatif</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="text-muted-foreground font-medium">Revenus récurrents</p>
                {roleConfigs.filter(rc => rc.count > 0).map(rc => {
                  const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId)!;
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
                <p className="text-muted-foreground font-medium">One-shot</p>
                <div className="flex justify-between"><span>Setup fees</span><span className="font-medium text-foreground">{totals.setup.toLocaleString()}€</span></div>
                <div className="flex justify-between"><span>Services</span><span className="font-medium text-foreground">{totals.services.toLocaleString()}€</span></div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg text-primary"><span>Total année 1</span><span>{totals.year1.toLocaleString()}€</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Marge estimée</span><span>{totals.margin}%</span></div>

              {/* Save buttons for new quotes */}
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

          {/* F — Génération IA + Preview */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              {!locked && (
                <Button onClick={generateQuote} disabled={generating} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  {generating ? "Génération en cours…" : "Générer la proposition IA"}
                </Button>
              )}
              {quoteMarkdown && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { navigator.clipboard.writeText(quoteMarkdown); toast.success("Copié !"); }}>
                      <Copy className="h-3 w-3" />Copier
                    </Button>
                    {!locked && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={generateQuote} disabled={generating}>
                          <RefreshCw className="h-3 w-3" />Régénérer
                        </Button>
                        <Button size="sm" variant={editMode ? "default" : "outline"} className="text-xs gap-1" onClick={() => setEditMode(!editMode)}>
                          {editMode ? <><Eye className="h-3 w-3" />Aperçu</> : <><Pencil className="h-3 w-3" />Éditer</>}
                        </Button>
                      </>
                    )}
                  </div>
                  {editMode && !locked ? (
                    <Textarea value={quoteMarkdown} onChange={e => setQuoteMarkdown(e.target.value)}
                      className="font-mono text-xs min-h-[400px] border-border" />
                  ) : (
                    <div className="border border-border rounded-lg p-5 bg-card max-h-[600px] overflow-y-auto">
                      <EnrichedMarkdown content={quoteMarkdown} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
