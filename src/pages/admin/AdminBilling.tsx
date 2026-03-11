import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, CreditCard, Building2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const QUOTA_KEYS = [
  { key: "max_workshops_per_month", label: "Workshops / mois" },
  { key: "max_toolkits", label: "Toolkits max" },
  { key: "max_participants_per_workshop", label: "Participants / workshop" },
  { key: "ai_credits_per_month", label: "Crédits IA / mois" },
];

const FEATURE_KEYS = [
  { key: "custom_branding", label: "Branding personnalisé" },
  { key: "api_access", label: "Accès API" },
  { key: "priority_support", label: "Support prioritaire" },
  { key: "export_pdf", label: "Export PDF" },
];

const SUB_STATUSES = ["trial", "active", "expired", "cancelled"];

export default function AdminBilling() {
  const {
    plans, plansLoading, createPlan, updatePlan, deletePlan,
    subscriptions, subscriptionsLoading, createSubscription, updateSubscription,
    creditStats, creditStatsLoading, orgs,
    monthlyCredits, monthlyCreditsLoading,
    orgCredits, orgCreditsLoading,
  } = useAdminBilling();

  // Plan dialog
  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "", price_monthly: 0, price_yearly: 0, is_active: true, sort_order: 0,
    quotas: {} as Record<string, number>,
    features: {} as Record<string, boolean>,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Subscription dialog
  const [subDialog, setSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [subForm, setSubForm] = useState({
    organization_id: "", plan_id: "", status: "trial",
    started_at: new Date().toISOString().slice(0, 10), expires_at: "",
  });

  const openPlanDialog = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name, price_monthly: plan.price_monthly ?? 0,
        price_yearly: plan.price_yearly ?? 0, is_active: plan.is_active,
        sort_order: plan.sort_order,
        quotas: (plan.quotas as Record<string, number>) ?? {},
        features: (plan.features as Record<string, boolean>) ?? {},
      });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: "", price_monthly: 0, price_yearly: 0, is_active: true, sort_order: 0, quotas: {}, features: {} });
    }
    setPlanDialog(true);
  };

  const savePlan = () => {
    const payload = {
      name: planForm.name,
      price_monthly: planForm.price_monthly,
      price_yearly: planForm.price_yearly,
      is_active: planForm.is_active,
      sort_order: planForm.sort_order,
      quotas: planForm.quotas,
      features: planForm.features,
    };
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, ...payload }, { onSuccess: () => setPlanDialog(false) });
    } else {
      createPlan.mutate(payload, { onSuccess: () => setPlanDialog(false) });
    }
  };

  const openSubDialog = (sub?: any) => {
    if (sub) {
      setEditingSub(sub);
      setSubForm({
        organization_id: sub.organization_id,
        plan_id: sub.plan_id,
        status: sub.status,
        started_at: sub.started_at?.slice(0, 10) ?? "",
        expires_at: sub.expires_at?.slice(0, 10) ?? "",
      });
    } else {
      setEditingSub(null);
      setSubForm({ organization_id: "", plan_id: "", status: "trial", started_at: new Date().toISOString().slice(0, 10), expires_at: "" });
    }
    setSubDialog(true);
  };

  const saveSub = () => {
    const payload = {
      organization_id: subForm.organization_id,
      plan_id: subForm.plan_id,
      status: subForm.status,
      started_at: subForm.started_at,
      expires_at: subForm.expires_at || null,
    };
    if (editingSub) {
      updateSubscription.mutate({ id: editingSub.id, ...payload }, { onSuccess: () => setSubDialog(false) });
    } else {
      createSubscription.mutate(payload, { onSuccess: () => setSubDialog(false) });
    }
  };

  const planColumns = [
    { key: "name", label: "Nom", sortable: true },
    { key: "price_monthly", label: "Mensuel", sortable: true, render: (r: any) => r.price_monthly != null ? `${r.price_monthly} €` : "—" },
    { key: "price_yearly", label: "Annuel", sortable: true, render: (r: any) => r.price_yearly != null ? `${r.price_yearly} €` : "—" },
    { key: "is_active", label: "Statut", render: (r: any) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Actif" : "Inactif"}</Badge> },
    { key: "sort_order", label: "Ordre", sortable: true },
    {
      key: "actions", label: "", render: (r: any) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPlanDialog(r)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const subColumns = [
    { key: "org_name", label: "Organisation", sortable: true, render: (r: any) => (r as any).organizations?.name ?? "—" },
    { key: "plan_name", label: "Plan", sortable: true, render: (r: any) => (r as any).subscription_plans?.name ?? "—" },
    { key: "status", label: "Statut", render: (r: any) => {
      const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = { active: "default", trial: "outline", expired: "destructive", cancelled: "secondary" };
      return <Badge variant={colors[r.status] ?? "secondary"}>{r.status}</Badge>;
    }},
    { key: "started_at", label: "Début", sortable: true, render: (r: any) => r.started_at ? format(new Date(r.started_at), "dd MMM yyyy", { locale: fr }) : "—" },
    { key: "expires_at", label: "Expiration", sortable: true, render: (r: any) => r.expires_at ? format(new Date(r.expires_at), "dd MMM yyyy", { locale: fr }) : "—" },
    {
      key: "actions", label: "", render: (r: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openSubDialog(r)}><Pencil className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Crédits & Abonnements</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérer les plans, abonnements et crédits</p>
        </div>

        {/* Credit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Crédits distribués", value: creditStats?.totalEarned ?? 0, icon: TrendingUp, color: "text-emerald-500" },
            { label: "Crédits dépensés", value: creditStats?.totalSpent ?? 0, icon: CreditCard, color: "text-orange-500" },
            { label: "Solde global", value: creditStats?.balance ?? 0, icon: Building2, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{creditStatsLoading ? "…" : s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Credits Chart */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Consommation de crédits (6 derniers mois)</h2>
          {monthlyCreditsLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyCredits} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="earned" name="Distribués" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Dépensés" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Plans d'abonnement</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements actifs</TabsTrigger>
            <TabsTrigger value="org-credits">Crédits par organisation</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <DataTable
              data={plans}
              columns={planColumns}
              searchKey="name"
              searchPlaceholder="Rechercher un plan..."
              actions={<Button size="sm" onClick={() => openPlanDialog()}><Plus className="h-4 w-4 mr-1" />Nouveau plan</Button>}
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <DataTable
              data={subscriptions}
              columns={subColumns}
              searchKey="org_name"
              searchPlaceholder="Rechercher..."
              actions={<Button size="sm" onClick={() => openSubDialog()}><Plus className="h-4 w-4 mr-1" />Nouvel abonnement</Button>}
            />
          </TabsContent>

          <TabsContent value="org-credits">
            <div className="rounded-xl border border-border/40 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 border-b border-border/40">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">Organisation</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 text-right">Distribués</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 text-right">Dépensés</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80 text-right">Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgCreditsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">Chargement…</TableCell></TableRow>
                  ) : orgCredits.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">Aucune donnée</TableCell></TableRow>
                  ) : orgCredits.map((o) => (
                    <TableRow key={o.id} className="border-b border-border/20 hover:bg-muted/20">
                      <TableCell className="py-2.5 text-sm font-medium text-foreground">{o.name}</TableCell>
                      <TableCell className="py-2.5 text-sm text-emerald-500 tabular-nums text-right">{o.earned.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-sm text-orange-500 tabular-nums text-right">{o.spent.toLocaleString()}</TableCell>
                      <TableCell className="py-2.5 text-sm font-semibold text-foreground tabular-nums text-right">{o.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Modifier le plan" : "Nouveau plan"}</DialogTitle>
            <DialogDescription>Configurez les détails du plan d'abonnement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nom</label>
              <Input value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Prix mensuel (€)</label>
                <Input type="number" value={planForm.price_monthly} onChange={(e) => setPlanForm((f) => ({ ...f, price_monthly: +e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Prix annuel (€)</label>
                <Input type="number" value={planForm.price_yearly} onChange={(e) => setPlanForm((f) => ({ ...f, price_yearly: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Ordre</label>
                <Input type="number" value={planForm.sort_order} onChange={(e) => setPlanForm((f) => ({ ...f, sort_order: +e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={planForm.is_active} onCheckedChange={(v) => setPlanForm((f) => ({ ...f, is_active: v }))} />
                <span className="text-sm text-foreground">Actif</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Quotas</label>
              <div className="space-y-2">
                {QUOTA_KEYS.map((q) => (
                  <div key={q.key} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-48">{q.label}</span>
                    <Input
                      type="number"
                      className="w-24 h-8 text-sm"
                      value={planForm.quotas[q.key] ?? ""}
                      onChange={(e) => setPlanForm((f) => ({
                        ...f, quotas: { ...f.quotas, [q.key]: e.target.value ? +e.target.value : undefined },
                      }))}
                      placeholder="∞"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Fonctionnalités</label>
              <div className="space-y-2">
                {FEATURE_KEYS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <Switch
                      checked={!!planForm.features[f.key]}
                      onCheckedChange={(v) => setPlanForm((prev) => ({
                        ...prev, features: { ...prev.features, [f.key]: v },
                      }))}
                    />
                    <span className="text-sm text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(false)}>Annuler</Button>
            <Button onClick={savePlan} disabled={!planForm.name || createPlan.isPending || updatePlan.isPending}>
              {editingPlan ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSub ? "Modifier l'abonnement" : "Nouvel abonnement"}</DialogTitle>
            <DialogDescription>Attribuez un plan à une organisation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Organisation</label>
              <Select value={subForm.organization_id} onValueChange={(v) => setSubForm((f) => ({ ...f, organization_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Plan</label>
              <Select value={subForm.plan_id} onValueChange={(v) => setSubForm((f) => ({ ...f, plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Statut</label>
              <Select value={subForm.status} onValueChange={(v) => setSubForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Début</label>
                <Input type="date" value={subForm.started_at} onChange={(e) => setSubForm((f) => ({ ...f, started_at: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Expiration</label>
                <Input type="date" value={subForm.expires_at} onChange={(e) => setSubForm((f) => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog(false)}>Annuler</Button>
            <Button onClick={saveSub} disabled={!subForm.organization_id || !subForm.plan_id || createSubscription.isPending || updateSubscription.isPending}>
              {editingSub ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Les abonnements existants ne seront pas affectés.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deletePlan.mutate(deleteId); setDeleteId(null); }}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
