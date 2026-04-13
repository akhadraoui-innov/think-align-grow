import { useState, useMemo } from "react";
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
import {
  DEFAULT_PRICING_ROLES, DEFAULT_SALE_MODELS, DEFAULT_SEGMENTS,
  DEFAULT_SETUP_FEES, DEFAULT_SERVICES,
  type PricingRole, type SaleModel, type SetupFee, type ServiceConfig, type QuoteRoleConfig,
} from "./businessConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, FileText, Calculator } from "lucide-react";

export function BusinessQuoteTab() {
  // A — Context
  const [prospectName, setProspectName] = useState("");
  const [segment, setSegment] = useState("");
  const [userCount, setUserCount] = useState(50);
  const [challenges, setChallenges] = useState("");

  // B — Sale model
  const [saleModelId, setSaleModelId] = useState("saas-conseil");
  const saleModel = DEFAULT_SALE_MODELS.find(m => m.id === saleModelId)!;

  // C — Roles
  const [roleConfigs, setRoleConfigs] = useState<QuoteRoleConfig[]>(
    DEFAULT_PRICING_ROLES.map(r => ({ roleId: r.id, planId: r.defaultPlanId, count: r.valueLevel === "strategic" ? 2 : r.valueLevel === "operational" ? 5 : 20 }))
  );

  // D — Setup & Services
  const [selectedSetupIds, setSelectedSetupIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [engagementMonths, setEngagementMonths] = useState(12);

  // F — AI
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);

  const engagementDiscount = engagementMonths === 24 ? 0.10 : engagementMonths === 36 ? 0.15 : 0;

  // Totals
  const totals = useMemo(() => {
    let mrr = 0;
    roleConfigs.forEach(rc => {
      const role = DEFAULT_PRICING_ROLES.find(r => r.id === rc.roleId);
      const plan = role?.plans.find(p => p.id === rc.planId);
      if (!plan || rc.count <= 0) return;
      if (plan.billing === "usage") return; // no base MRR
      const monthly = plan.billing === "annual" ? plan.pricePerUser : plan.pricePerUser;
      mrr += monthly * rc.count;
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

  const updateRoleConfig = (roleId: string, field: keyof QuoteRoleConfig, value: string | number) => {
    setRoleConfigs(prev => prev.map(rc => rc.roleId === roleId ? { ...rc, [field]: value } : rc));
  };

  const generateQuote = async () => {
    if (!prospectName || !segment) {
      toast.error("Renseignez le nom du prospect et le segment");
      return;
    }
    setLoading(true);
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
          engagement: engagementMonths,
          totals,
        },
      });
      if (error) throw error;
      setQuote(data.quote || "Erreur de génération");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Configurateur de devis IA</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Composez un deal multi-modèle et générez une proposition commerciale assistée par IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Config */}
        <div className="lg:col-span-2 space-y-5">
          {/* A — Contexte */}
          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Contexte prospect</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom du prospect *</Label>
                <Input value={prospectName} onChange={e => setProspectName(e.target.value)} placeholder="Ex: Capgemini — DRH" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Segment *</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{DEFAULT_SEGMENTS.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre d'utilisateurs total : {userCount}</Label>
                <Slider value={[userCount]} onValueChange={v => setUserCount(v[0])} min={5} max={2000} step={5} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Enjeux / contexte</Label>
                <Textarea value={challenges} onChange={e => setChallenges(e.target.value)} placeholder="Ex: Montée en compétences IA de 200 managers..." rows={2} className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* B — Modèle de vente */}
          <Card className="border-border">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Modèle de vente</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {DEFAULT_SALE_MODELS.map(m => (
                  <button key={m.id} onClick={() => setSaleModelId(m.id)}
                    className={`p-3 rounded-lg border text-left transition-all text-xs ${saleModelId === m.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-card border-border hover:border-primary/30"}`}>
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
                            <Select value={rc.planId} onValueChange={v => updateRoleConfig(rc.roleId, "planId", v)}>
                              <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>{role.plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.pricePerUser}€</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-center">
                            <Input type="number" value={rc.count} onChange={e => updateRoleConfig(rc.roleId, "count", Number(e.target.value))} className="w-16 h-7 text-center text-xs mx-auto" min={0} />
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
                        <label key={fee.id} className="flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer text-xs">
                          <Checkbox checked={selectedSetupIds.includes(fee.id)} onCheckedChange={c => setSelectedSetupIds(prev => c ? [...prev, fee.id] : prev.filter(id => id !== fee.id))} className="mt-0.5" />
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
                        <label key={svc.id} className="flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer text-xs">
                          <Checkbox checked={selectedServiceIds.includes(svc.id)} onCheckedChange={c => setSelectedServiceIds(prev => c ? [...prev, svc.id] : prev.filter(id => id !== svc.id))} className="mt-0.5" />
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
                      <Button key={m} size="sm" variant={engagementMonths === m ? "default" : "outline"} onClick={() => setEngagementMonths(m)} className="text-xs h-7 px-3">{m} mois</Button>
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
            </CardContent>
          </Card>

          {/* F — Génération IA */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <Button onClick={generateQuote} disabled={loading} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                {loading ? "Génération en cours…" : "Générer la proposition IA"}
              </Button>
              {quote && (
                <>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { navigator.clipboard.writeText(quote); toast.success("Copié !"); }}>
                      <Copy className="h-3 w-3" />Copier
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={generateQuote} disabled={loading}>
                      <RefreshCw className="h-3 w-3" />Régénérer
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none text-xs border border-border rounded-lg p-4 bg-muted/20 max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                    {quote}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
