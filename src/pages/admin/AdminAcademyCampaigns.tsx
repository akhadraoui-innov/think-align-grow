import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone, Plus, ArrowLeft, Pencil, Trash2, Save, Calendar,
  Users, TrendingUp, Clock, Play, Pause, CheckCircle2, UserPlus,
  BarChart3, ChevronDown, ChevronUp, Eye, Sparkles, Loader2,
  FileText, MessageSquare, Route
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays, isAfter, isBefore, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { VersionHistory } from "@/components/admin/VersionHistory";

interface CampaignForm {
  name: string;
  description: string;
  path_id: string;
  organization_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

const emptyForm: CampaignForm = {
  name: "", description: "", path_id: "", organization_id: "",
  status: "draft", starts_at: new Date().toISOString().slice(0, 10), ends_at: "",
};

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  draft: { label: "Brouillon", color: "text-muted-foreground", icon: Clock, bg: "bg-muted" },
  active: { label: "Actif", color: "text-blue-700", icon: Play, bg: "bg-blue-500/10" },
  paused: { label: "Suspendu", color: "text-amber-700", icon: Pause, bg: "bg-amber-500/10" },
  completed: { label: "Terminé", color: "text-emerald-700", icon: CheckCircle2, bg: "bg-emerald-500/10" },
};

export default function AdminAcademyCampaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrollDialogCampaign, setEnrollDialogCampaign] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"guided" | "corporate" | "chat">("guided");
  const [aiForm, setAiForm] = useState({ name: "", description: "", organization_id: "", path_id: "", duration_weeks: 8, objectives: "" });
  const [aiChat, setAiChat] = useState("");
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);

  // --- Queries ---
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-academy-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_campaigns")
        .select("*, academy_paths(name, difficulty), organizations:organization_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: paths = [] } = useQuery({
    queryKey: ["admin-academy-paths-select"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_paths").select("id, name, status").order("name");
      return data || [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs-select"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["admin-campaign-enrollments"],
    queryFn: async () => {
      const { data } = await supabase.from("academy_enrollments").select("id, path_id, campaign_id, user_id, status, enrolled_at, completed_at");
      return data || [];
    },
  });

  const { data: orgMembers = [] } = useQuery({
    queryKey: ["admin-org-members-all"],
    queryFn: async () => {
      const { data } = await supabase.from("organization_members").select("user_id, organization_id");
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, email");
      return data || [];
    },
  });

  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.user_id, p])), [profiles]);

  // --- Mutations ---
  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name, description: form.description, path_id: form.path_id,
        organization_id: form.organization_id, status: form.status,
        starts_at: form.starts_at, ends_at: form.ends_at || null,
      };
      if (editId) {
        const { error } = await supabase.from("academy_campaigns").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_campaigns").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-campaigns"] });
      toast.success(editId ? "Campagne mise à jour" : "Campagne créée");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-campaigns"] });
      toast.success("Campagne supprimée");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const batchEnroll = useMutation({
    mutationFn: async ({ campaignId, pathId, orgId }: { campaignId: string; pathId: string; orgId: string }) => {
      const members = orgMembers.filter(m => m.organization_id === orgId);
      const existingUserIds = new Set(
        enrollments.filter(e => e.campaign_id === campaignId).map(e => e.user_id)
      );
      const toEnroll = members.filter(m => !existingUserIds.has(m.user_id));
      if (toEnroll.length === 0) {
        toast.info("Tous les membres sont déjà inscrits");
        return;
      }
      const rows = toEnroll.map(m => ({
        user_id: m.user_id, path_id: pathId, campaign_id: campaignId, status: "active",
      }));
      const { error } = await supabase.from("academy_enrollments").insert(rows);
      if (error) throw error;
      return toEnroll.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["admin-campaign-enrollments"] });
      if (count) toast.success(`${count} membres inscrits avec succès`);
      setEnrollDialogCampaign(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      name: c.name, description: c.description || "", path_id: c.path_id,
      organization_id: c.organization_id, status: c.status,
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : "", ends_at: c.ends_at ? c.ends_at.slice(0, 10) : "",
    });
    setOpen(true);
  }
  function closeDialog() { setOpen(false); setEditId(null); }

  // --- Stats ---
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
  const totalEnrolled = enrollments.filter(e => campaigns.some((c: any) => c.id === e.campaign_id)).length;
  const completedEnrolled = enrollments.filter(e => e.status === "completed" && campaigns.some((c: any) => c.id === e.campaign_id)).length;

  const filtered = campaigns.filter((c: any) => filterStatus === "all" || c.status === filterStatus);

  // --- Gantt helpers ---
  const ganttData = useMemo(() => {
    const now = new Date();
    const withDates = campaigns.filter((c: any) => c.starts_at);
    if (withDates.length === 0) return null;
    const allStarts = withDates.map((c: any) => new Date(c.starts_at));
    const allEnds = withDates.map((c: any) => c.ends_at ? new Date(c.ends_at) : new Date(new Date(c.starts_at).getTime() + 90 * 86400000));
    const minDate = new Date(Math.min(...allStarts.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allEnds.map(d => d.getTime()), now.getTime() + 30 * 86400000));
    const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);
    return { minDate, maxDate, totalDays, now };
  }, [campaigns]);

  function getCampaignStats(campaignId: string) {
    const ce = enrollments.filter(e => e.campaign_id === campaignId);
    const completed = ce.filter(e => e.status === "completed").length;
    return { enrolled: ce.length, completed, rate: ce.length > 0 ? Math.round((completed / ce.length) * 100) : 0 };
  }

  const stats = [
    { label: "Campagnes", value: `${totalCampaigns}`, icon: Megaphone, gradient: "from-violet-500 to-purple-500" },
    { label: "Actives", value: `${activeCampaigns}`, icon: Play, gradient: "from-blue-500 to-cyan-500" },
    { label: "Inscrits", value: `${totalEnrolled}`, icon: Users, gradient: "from-emerald-500 to-teal-500" },
    { label: "Complétés", value: `${completedEnrolled}`, icon: CheckCircle2, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-md">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Campagnes de formation</h1>
              <p className="text-xs text-muted-foreground">{totalCampaigns} campagnes · {totalEnrolled} inscrits</p>
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle campagne
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", s.gradient)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <AnimatedCounter value={s.value} label={s.label} className="text-left [&>div:first-child]:text-xl [&>div:last-child]:text-left" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gantt Timeline */}
        {ganttData && campaigns.filter((c: any) => c.starts_at).length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Timeline des campagnes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {/* Month markers */}
                <div className="relative h-6 text-[10px] text-muted-foreground">
                  {Array.from({ length: Math.ceil(ganttData.totalDays / 30) + 1 }, (_, i) => {
                    const d = new Date(ganttData.minDate.getTime() + i * 30 * 86400000);
                    const left = (differenceInDays(d, ganttData.minDate) / ganttData.totalDays) * 100;
                    if (left > 100) return null;
                    return (
                      <span key={i} className="absolute top-0 font-medium" style={{ left: `${left}%` }}>
                        {format(d, "MMM yy", { locale: fr })}
                      </span>
                    );
                  })}
                </div>
                {/* Bars */}
                {campaigns.filter((c: any) => c.starts_at).map((c: any) => {
                  const start = new Date(c.starts_at);
                  const end = c.ends_at ? new Date(c.ends_at) : new Date(start.getTime() + 90 * 86400000);
                  const leftPct = (differenceInDays(start, ganttData.minDate) / ganttData.totalDays) * 100;
                  const widthPct = Math.max((differenceInDays(end, start) / ganttData.totalDays) * 100, 2);
                  const sc = statusConfig[c.status] || statusConfig.draft;
                  const cStats = getCampaignStats(c.id);
                  return (
                    <div key={c.id} className="relative h-8 group">
                      <div className="absolute inset-0 bg-muted/30 rounded" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn("absolute h-full rounded cursor-pointer transition-opacity hover:opacity-80", sc.bg)}
                            style={{ left: `${Math.max(leftPct, 0)}%`, width: `${Math.min(widthPct, 100 - leftPct)}%` }}
                          >
                            <div className="px-2 h-full flex items-center gap-1.5 overflow-hidden">
                              <span className={cn("text-[10px] font-semibold truncate", sc.color)}>{c.name}</span>
                              {cStats.enrolled > 0 && (
                                <Badge variant="outline" className="h-4 text-[8px] shrink-0">{cStats.enrolled}</Badge>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(start, "d MMM", { locale: fr })} → {format(end, "d MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs">{cStats.enrolled} inscrits · {cStats.rate}% complétés</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Today marker */}
                      {(() => {
                        const todayPct = (differenceInDays(ganttData.now, ganttData.minDate) / ganttData.totalDays) * 100;
                        if (todayPct < 0 || todayPct > 100) return null;
                        return <div className="absolute top-0 bottom-0 w-px bg-destructive/50 z-10" style={{ left: `${todayPct}%` }} />;
                      })()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="paused">Suspendu</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} campagne{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {/* Campaign list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucune campagne créée.</p>
              <p className="text-xs mt-1">Déployez des parcours de formation ciblés vers vos organisations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => {
              const sc = statusConfig[c.status] || statusConfig.draft;
              const cStats = getCampaignStats(c.id);
              const isExpanded = expandedId === c.id;
              const campaignEnrollments = enrollments.filter(e => e.campaign_id === c.id);

              return (
                <motion.div key={c.id} layout>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-0">
                      {/* Main row */}
                      <div className="p-4 flex items-center gap-4">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sc.bg)}>
                          <sc.icon className={cn("h-4 w-4", sc.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{c.name}</p>
                            <Badge variant="outline" className={cn("text-[10px] shrink-0", sc.bg, sc.color)}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                            <span>{(c as any).academy_paths?.name || "—"}</span>
                            <span>·</span>
                            <span>{(c as any).organizations?.name || "—"}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {c.starts_at ? format(new Date(c.starts_at), "d MMM", { locale: fr }) : "—"}
                              {c.ends_at && ` → ${format(new Date(c.ends_at), "d MMM yy", { locale: fr })}`}
                            </span>
                          </div>
                          {/* Mini progress */}
                          {cStats.enrolled > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Progress value={cStats.rate} className="h-1.5 flex-1 max-w-[200px]" />
                              <span className="text-[10px] text-muted-foreground">{cStats.enrolled} inscrits · {cStats.rate}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEnrollDialogCampaign(c)}>
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Inscrire tous les membres</TooltipContent>
                          </Tooltip>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t"
                          >
                            <div className="p-4 bg-muted/20 space-y-3">
                              {c.description && (
                                <p className="text-xs text-muted-foreground">{c.description}</p>
                              )}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-card border p-3 text-center">
                                  <p className="font-bold text-lg">{cStats.enrolled}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inscrits</p>
                                </div>
                                <div className="rounded-xl bg-card border p-3 text-center">
                                  <p className="font-bold text-lg">{cStats.completed}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complétés</p>
                                </div>
                                <div className="rounded-xl bg-card border p-3 text-center">
                                  <p className="font-bold text-lg">{cStats.rate}%</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taux</p>
                                </div>
                              </div>
                              {/* Enrolled users */}
                              {campaignEnrollments.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground">Apprenants inscrits</p>
                                  <div className="max-h-40 overflow-y-auto space-y-1">
                                    {campaignEnrollments.map((e: any) => {
                                      const p = profileMap[e.user_id];
                                      return (
                                        <div key={e.id} className="flex items-center gap-2 rounded-lg bg-card border px-3 py-1.5">
                                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                            {(p?.display_name || p?.email || "U")[0].toUpperCase()}
                                          </div>
                                          <span className="text-xs flex-1 truncate">{p?.display_name || p?.email || "Utilisateur"}</span>
                                          <Badge variant="outline" className={cn("text-[9px]",
                                            e.status === "completed" ? "bg-emerald-500/10 text-emerald-700" :
                                            e.status === "active" ? "bg-blue-500/10 text-blue-700" : ""
                                          )}>
                                            {e.status === "completed" ? "Terminé" : "En cours"}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <VersionHistory assetType="campaign" assetId={c.id} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de la campagne</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Formation IA Q1 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Parcours de formation</Label>
              <Select value={form.path_id || "none"} onValueChange={v => setForm({ ...form, path_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un parcours" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Choisir —</SelectItem>
                  {paths.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.status !== "published" && `(${p.status})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Organisation</Label>
              <Select value={form.organization_id || "none"} onValueChange={v => setForm({ ...form, organization_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choisir une organisation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Choisir —</SelectItem>
                  {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de début</Label>
                <Input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin (optionnel)</Label>
                <Input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">Suspendu</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || !form.path_id || !form.organization_id || upsert.isPending}>
                <Save className="h-4 w-4 mr-2" /> {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Enroll Dialog */}
      <Dialog open={!!enrollDialogCampaign} onOpenChange={() => setEnrollDialogCampaign(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Inscription batch
            </DialogTitle>
          </DialogHeader>
          {enrollDialogCampaign && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Inscrire tous les membres de <strong>{(enrollDialogCampaign as any).organizations?.name}</strong> au
                parcours <strong>{(enrollDialogCampaign as any).academy_paths?.name}</strong> ?
              </p>
              <p className="text-xs text-muted-foreground">
                Les membres déjà inscrits ne seront pas dupliqués.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEnrollDialogCampaign(null)}>Annuler</Button>
                <Button
                  size="sm"
                  disabled={batchEnroll.isPending}
                  onClick={() => batchEnroll.mutate({
                    campaignId: enrollDialogCampaign.id,
                    pathId: enrollDialogCampaign.path_id,
                    orgId: enrollDialogCampaign.organization_id,
                  })}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  {batchEnroll.isPending ? "Inscription…" : "Inscrire tous les membres"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
