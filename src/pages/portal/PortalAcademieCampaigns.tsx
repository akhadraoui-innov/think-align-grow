
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone, Plus, ArrowLeft, Pencil, Trash2, Save, Calendar,
  Users, TrendingUp, Clock, Play, Pause, CheckCircle2, UserPlus,
  BarChart3, ChevronDown, ChevronUp, Eye, Sparkles, Loader2,
  FileText, MessageSquare, Route, Search, Target, BookOpen, Building2,
  Rows3, AlignJustify, List, ZoomIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useMemo, SVGProps } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { addMonths, format, differenceInDays, isAfter, isBefore, isWithinInterval, startOfMonth, eachMonthOfInterval } from "date-fns";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrgId, setFilterOrgId] = useState("all");
  const [filterPathId, setFilterPathId] = useState("all");

  // Timeline local state
  const [tlOpen, setTlOpen] = useState(true);
  const [tlStatus, setTlStatus] = useState("all");
  const [tlOrgId, setTlOrgId] = useState("all");
  const [tlZoom, setTlZoom] = useState<"3m" | "6m" | "1y" | "all">("all");
  const [tlDensity, setTlDensity] = useState<"compact" | "normal" | "detailed">("normal");

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

  const generateAI = useMutation({
    mutationFn: async () => {
      const body: any = {
        action: "generate-campaign",
        name: aiForm.name,
        description: aiMode === "chat" ? aiChat : aiForm.description,
        organization_id: aiForm.organization_id || null,
        path_id: aiForm.path_id || null,
        duration_weeks: aiForm.duration_weeks,
        objectives: aiForm.objectives,
        mode: aiMode,
      };
      const { data, error } = await supabase.functions.invoke("academy-generate", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-academy-campaigns"] });
      if (data.deployment_strategy) {
        setAiStrategy(data.deployment_strategy);
      }
      toast.success("Campagne générée avec succès");
      setAiOpen(false);
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: campaigns.length, draft: 0, active: 0, paused: 0, completed: 0 };
    campaigns.forEach((c: any) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return campaigns.filter((c: any) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterOrgId !== "all" && c.organization_id !== filterOrgId) return false;
      if (filterPathId !== "all" && c.path_id !== filterPathId) return false;
      if (q) {
        const haystack = [c.name, c.description, (c as any).academy_paths?.name, (c as any).organizations?.name]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, filterStatus, filterOrgId, filterPathId, searchQuery]);

  // --- Gantt helpers ---
  const tlFilteredCampaigns = useMemo(() => {
    return campaigns.filter((c: any) => {
      if (!c.starts_at) return false;
      if (tlStatus !== "all" && c.status !== tlStatus) return false;
      if (tlOrgId !== "all" && c.organization_id !== tlOrgId) return false;
      return true;
    });
  }, [campaigns, tlStatus, tlOrgId]);

  const ganttData = useMemo(() => {
    const now = new Date();
    if (tlFilteredCampaigns.length === 0) return null;

    let minDate: Date, maxDate: Date;

    if (tlZoom === "all") {
      const allStarts = tlFilteredCampaigns.map((c: any) => new Date(c.starts_at));
      const allEnds = tlFilteredCampaigns.map((c: any) => c.ends_at ? new Date(c.ends_at) : new Date(new Date(c.starts_at).getTime() + 90 * 86400000));
      minDate = new Date(Math.min(...allStarts.map(d => d.getTime())));
      maxDate = new Date(Math.max(...allEnds.map(d => d.getTime()), now.getTime() + 30 * 86400000));
    } else {
      const monthsMap = { "3m": 3, "6m": 6, "1y": 12 } as const;
      const months = monthsMap[tlZoom];
      minDate = startOfMonth(addMonths(now, -Math.floor(months / 3)));
      maxDate = addMonths(minDate, months);
    }

    const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);
    const monthMarkers = eachMonthOfInterval({ start: minDate, end: maxDate });
    return { minDate, maxDate, totalDays, now, monthMarkers };
  }, [tlFilteredCampaigns, tlZoom]);

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
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/academie")}>
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setAiOpen(true); setAiMode("guided"); setAiForm({ name: "", description: "", organization_id: "", path_id: "", duration_weeks: 8, objectives: "" }); setAiChat(""); }}>
              <Sparkles className="h-4 w-4 mr-1" /> Générer par IA
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Nouvelle campagne
            </Button>
          </div>
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

        {/* Gantt Timeline — Collapsible */}
        <Collapsible open={tlOpen} onOpenChange={setTlOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="px-5 py-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Timeline des campagnes
                    <Badge variant="secondary" className="text-[10px] ml-1">{tlFilteredCampaigns.length}</Badge>
                  </CardTitle>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", tlOpen && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Timeline Toolbar */}
              <div className="px-5 pb-3 space-y-2 border-t pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status pills */}
                  <div className="flex items-center gap-1">
                    {[
                      { key: "all", label: "Tous" },
                      { key: "draft", label: "Brouillon" },
                      { key: "active", label: "Actif" },
                      { key: "paused", label: "Suspendu" },
                      { key: "completed", label: "Terminé" },
                    ].map(s => (
                      <button
                        key={s.key}
                        onClick={() => setTlStatus(s.key)}
                        className={cn(
                          "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                          tlStatus === s.key
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-border" />

                  {/* Org filter */}
                  <Select value={tlOrgId} onValueChange={setTlOrgId}>
                    <SelectTrigger className="h-7 w-[150px] text-[10px]">
                      <Building2 className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder="Organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="h-4 w-px bg-border" />

                  {/* Zoom */}
                  <div className="flex items-center gap-1">
                    <ZoomIn className="h-3 w-3 text-muted-foreground" />
                    <ToggleGroup type="single" value={tlZoom} onValueChange={(v) => v && setTlZoom(v as any)} size="sm" className="gap-0">
                      {[
                        { value: "3m", label: "3M" },
                        { value: "6m", label: "6M" },
                        { value: "1y", label: "1A" },
                        { value: "all", label: "Tout" },
                      ].map(z => (
                        <ToggleGroupItem key={z.value} value={z.value} className="h-6 px-2 text-[10px] rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                          {z.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  <div className="h-4 w-px bg-border" />

                  {/* Density */}
                  <ToggleGroup type="single" value={tlDensity} onValueChange={(v) => v && setTlDensity(v as any)} size="sm" className="gap-0">
                    <ToggleGroupItem value="compact" className="h-6 px-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <Tooltip><TooltipTrigger asChild><List className="h-3 w-3" /></TooltipTrigger><TooltipContent>Compact</TooltipContent></Tooltip>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="normal" className="h-6 px-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <Tooltip><TooltipTrigger asChild><Rows3 className="h-3 w-3" /></TooltipTrigger><TooltipContent>Normal</TooltipContent></Tooltip>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="detailed" className="h-6 px-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <Tooltip><TooltipTrigger asChild><AlignJustify className="h-3 w-3" /></TooltipTrigger><TooltipContent>Détaillé</TooltipContent></Tooltip>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Gantt Chart */}
              <CardContent className="px-5 pb-5 pt-0">
                {ganttData && tlFilteredCampaigns.length > 0 ? (
                  <div className="space-y-0 relative">
                    {/* Month grid lines + labels */}
                    <div className="relative h-6 text-[10px] text-muted-foreground">
                      {ganttData.monthMarkers.map((d, i) => {
                        const left = (differenceInDays(d, ganttData.minDate) / ganttData.totalDays) * 100;
                        if (left < 0 || left > 100) return null;
                        return (
                          <span key={i} className="absolute top-0 font-medium" style={{ left: `${left}%` }}>
                            {format(d, "MMM yy", { locale: fr })}
                          </span>
                        );
                      })}
                    </div>

                    {/* Grid bg lines */}
                    <div className="absolute inset-0 top-6 pointer-events-none">
                      {ganttData.monthMarkers.map((d, i) => {
                        const left = (differenceInDays(d, ganttData.minDate) / ganttData.totalDays) * 100;
                        if (left <= 0 || left >= 100) return null;
                        return <div key={i} className="absolute top-0 bottom-0 w-px bg-border/40" style={{ left: `${left}%` }} />;
                      })}
                    </div>

                    {/* Today marker */}
                    {(() => {
                      const todayPct = (differenceInDays(ganttData.now, ganttData.minDate) / ganttData.totalDays) * 100;
                      if (todayPct < 0 || todayPct > 100) return null;
                      return (
                        <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${todayPct}%` }}>
                          <div className="w-px h-full bg-destructive/60" />
                          <span className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-bold text-destructive bg-background px-1 rounded">
                            Auj.
                          </span>
                        </div>
                      );
                    })()}

                    {/* Bars */}
                    <div className="space-y-px">
                      {tlFilteredCampaigns.map((c: any) => {
                        const start = new Date(c.starts_at);
                        const end = c.ends_at ? new Date(c.ends_at) : new Date(start.getTime() + 90 * 86400000);
                        const leftPct = Math.max((differenceInDays(start, ganttData.minDate) / ganttData.totalDays) * 100, 0);
                        const widthPct = Math.max(Math.min((differenceInDays(end, start) / ganttData.totalDays) * 100, 100 - leftPct), 1.5);
                        const sc = statusConfig[c.status] || statusConfig.draft;
                        const cStats = getCampaignStats(c.id);

                        const barH = tlDensity === "compact" ? "h-5" : tlDensity === "detailed" ? "h-10" : "h-7";
                        const statusGradient: Record<string, string> = {
                          draft: "from-muted-foreground/20 to-muted-foreground/10",
                          active: "from-primary/30 to-primary/15",
                          paused: "from-amber-500/25 to-amber-500/10",
                          completed: "from-emerald-500/25 to-emerald-500/10",
                        };

                        return (
                          <div key={c.id} className={cn("relative group", barH)}>
                            <div className="absolute inset-0 bg-muted/20 rounded-sm" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute rounded-sm cursor-pointer transition-all hover:brightness-90 bg-gradient-to-r border border-transparent hover:border-primary/20",
                                    barH,
                                    statusGradient[c.status] || statusGradient.draft
                                  )}
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                >
                                  {tlDensity !== "compact" && (
                                    <div className="px-1.5 h-full flex items-center gap-1 overflow-hidden">
                                      <span className={cn("font-semibold truncate", sc.color, tlDensity === "detailed" ? "text-[11px]" : "text-[10px]")}>{c.name}</span>
                                      {tlDensity === "detailed" && cStats.enrolled > 0 && (
                                        <>
                                          <Badge variant="outline" className="h-4 text-[8px] shrink-0 border-primary/30">{cStats.enrolled}</Badge>
                                          <div className="h-1 w-10 bg-muted rounded-full shrink-0 overflow-hidden">
                                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${cStats.rate}%` }} />
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune campagne à afficher sur la timeline.</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Filter bar */}
        <Card>
          <CardContent className="p-3 space-y-3">
            {/* Search + selects row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher nom, parcours, organisation…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={filterOrgId} onValueChange={setFilterOrgId}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <Building2 className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les orgs</SelectItem>
                  {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPathId} onValueChange={setFilterPathId}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <BookOpen className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Parcours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les parcours</SelectItem>
                  {paths.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Status pills row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "all", label: "Tous" },
                { key: "draft", label: "Brouillon" },
                { key: "active", label: "Actif" },
                { key: "paused", label: "Suspendu" },
                { key: "completed", label: "Terminé" },
              ].map(s => {
                const isActive = filterStatus === s.key;
                const sc = s.key !== "all" ? statusConfig[s.key] : null;
                return (
                  <button
                    key={s.key}
                    onClick={() => setFilterStatus(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {sc && <sc.icon className="h-3 w-3" />}
                    {s.label}
                    <span className={cn("ml-0.5 tabular-nums", isActive ? "text-primary-foreground/80" : "text-muted-foreground/60")}>
                      {statusCounts[s.key] || 0}
                    </span>
                  </button>
                );
              })}
              <span className="ml-auto text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
            </div>
          </CardContent>
        </Card>

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
                  <Card className="hover:shadow-md transition-all border-border/60">
                    <CardContent className="p-0">
                      {/* Main row */}
                      <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sc.bg)}>
                          <sc.icon className={cn("h-4 w-4", sc.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{c.name}</p>
                            <Badge variant="outline" className={cn("text-[10px] shrink-0", sc.bg, sc.color)}>{sc.label}</Badge>
                            {c.description && c.description.length > 100 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>Stratégie IA disponible</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{(c as any).academy_paths?.name || "—"}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{(c as any).organizations?.name || "—"}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {c.starts_at ? format(new Date(c.starts_at), "d MMM", { locale: fr }) : "—"}
                              {c.ends_at && ` → ${format(new Date(c.ends_at), "d MMM yy", { locale: fr })}`}
                            </span>
                            {(() => {
                              if (!c.starts_at) return null;
                              const now = new Date();
                              const start = new Date(c.starts_at);
                              const end = c.ends_at ? new Date(c.ends_at) : null;
                              if (c.status === "completed" && end) {
                                const d = differenceInDays(now, end);
                                return <span className="text-emerald-600 font-medium">terminé il y a {d}j</span>;
                              }
                              if (end && isBefore(now, end) && isAfter(now, start)) {
                                const d = differenceInDays(end, now);
                                return <span className="text-primary font-medium">{d}j restants</span>;
                              }
                              if (isBefore(now, start)) {
                                const d = differenceInDays(start, now);
                                return <span className="font-medium">dans {d}j</span>;
                              }
                              return null;
                            })()}
                          </div>
                          {/* Mini progress in collapsed row */}
                          {cStats.enrolled > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Progress value={cStats.rate} className="h-1.5 flex-1 max-w-[200px]" />
                              <span className="text-[10px] text-muted-foreground">{cStats.enrolled} inscrits · {cStats.rate}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
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
                          <div className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-transform", isExpanded && "rotate-180")}>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      {/* ═══ Enriched Expanded Detail ═══ */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t"
                          >
                            <div className="p-5 bg-card space-y-5">
                              {/* Section A — Description + Strategy */}
                              <div className="grid gap-4 md:grid-cols-2">
                                {c.description && (
                                  <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                      <FileText className="h-3 w-3" /> Description
                                    </p>
                                    <p className="text-xs text-foreground leading-relaxed">{c.description}</p>
                                  </div>
                                )}
                                {c.description && c.description.length > 100 && (
                                  <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                      <Sparkles className="h-3 w-3 text-primary" /> Stratégie de déploiement
                                    </p>
                                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                                        {c.description.length > 300 ? c.description.slice(0, 300) + "…" : c.description}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Section B — KPIs */}
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { label: "Inscrits", value: cStats.enrolled, icon: Users, pct: null },
                                  { label: "Complétés", value: cStats.completed, icon: CheckCircle2, pct: null },
                                  { label: "Taux de complétion", value: `${cStats.rate}%`, icon: TrendingUp, pct: cStats.rate },
                                ].map((kpi) => (
                                  <div key={kpi.label} className="flex items-center gap-3 rounded-xl bg-background border p-3">
                                    <div className="relative h-10 w-10 shrink-0">
                                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                                        <circle
                                          cx="18" cy="18" r="15" fill="none"
                                          stroke="hsl(var(--primary))"
                                          strokeWidth="3"
                                          strokeDasharray={`${(kpi.pct ?? (cStats.enrolled > 0 ? (typeof kpi.value === "number" ? (kpi.value / Math.max(cStats.enrolled, 1)) * 100 : 0) : 0)) * 0.94} 94`}
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <kpi.icon className="h-3.5 w-3.5 text-primary" />
                                      </div>
                                    </div>
                                    <div>
                                      <p className="font-bold text-lg leading-none">{kpi.value}</p>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Section C — Learners (max 5) */}
                              {campaignEnrollments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Users className="h-3 w-3" /> Apprenants ({campaignEnrollments.length})
                                  </p>
                                  <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b bg-muted/30">
                                          <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Apprenant</th>
                                          <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Inscrit le</th>
                                          <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Statut</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {campaignEnrollments.slice(0, 5).map((e: any) => {
                                          const p = profileMap[e.user_id];
                                          return (
                                            <tr key={e.id} className="border-b last:border-0">
                                              <td className="px-3 py-2 flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                  {(p?.display_name || p?.email || "U")[0].toUpperCase()}
                                                </div>
                                                <span className="truncate">{p?.display_name || p?.email || "Utilisateur"}</span>
                                              </td>
                                              <td className="px-3 py-2 text-muted-foreground">
                                                {e.enrolled_at ? format(new Date(e.enrolled_at), "d MMM yy", { locale: fr }) : "—"}
                                              </td>
                                              <td className="px-3 py-2 text-right">
                                                <Badge variant="outline" className={cn("text-[9px]",
                                                  e.status === "completed" ? "bg-emerald-500/10 text-emerald-700" :
                                                  e.status === "active" ? "bg-blue-500/10 text-blue-700" : ""
                                                )}>
                                                  {e.status === "completed" ? "Terminé" : "En cours"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    {campaignEnrollments.length > 5 && (
                                      <div className="px-3 py-2 border-t bg-muted/20 text-center">
                                        <button className="text-[11px] text-primary font-medium hover:underline">
                                          Voir les {campaignEnrollments.length - 5} autres apprenants
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Section D — Version History */}
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

      {/* ═══ AI GENERATION DIALOG — 3 MODES ═══ */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Générer une campagne par IA
            </DialogTitle>
          </DialogHeader>

          <Tabs value={aiMode} onValueChange={(v) => setAiMode(v as any)} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="guided" className="gap-1.5">
                <Route className="h-3.5 w-3.5" /> Guidé
              </TabsTrigger>
              <TabsTrigger value="corporate" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Brief corporate
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Chat libre
              </TabsTrigger>
            </TabsList>

            {/* GUIDED */}
            <TabsContent value="guided" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>🎯 Nom de la campagne</Label>
                  <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Ex: Déploiement IA Managers Q2 2026" />
                </div>
                <div className="space-y-1.5">
                  <Label>🏢 Organisation</Label>
                  <Select value={aiForm.organization_id || "none"} onValueChange={v => setAiForm({ ...aiForm, organization_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Choisir —</SelectItem>
                      {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>📚 Parcours cible (optionnel — l'IA peut recommander)</Label>
                  <Select value={aiForm.path_id || "none"} onValueChange={v => setAiForm({ ...aiForm, path_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="L'IA recommandera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">L'IA recommandera</SelectItem>
                      {paths.filter((p: any) => p.status === "published").map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>⏱️ Durée souhaitée (semaines)</Label>
                  <Input type="number" min={1} max={52} value={aiForm.duration_weeks} onChange={e => setAiForm({ ...aiForm, duration_weeks: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>🎯 Objectifs de déploiement</Label>
                <Textarea value={aiForm.objectives} onChange={e => setAiForm({ ...aiForm, objectives: e.target.value })} rows={4} placeholder="Décrivez les objectifs : montée en compétences IA de 200 managers, adoption d'outils, KPIs attendus..." />
              </div>
            </TabsContent>

            {/* CORPORATE */}
            <TabsContent value="corporate" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nom de la campagne</Label>
                  <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Titre de la campagne" />
                </div>
                <div className="space-y-1.5">
                  <Label>Organisation</Label>
                  <Select value={aiForm.organization_id || "none"} onValueChange={v => setAiForm({ ...aiForm, organization_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Choisir —</SelectItem>
                      {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Brief complet</Label>
                <Textarea
                  value={aiForm.description}
                  onChange={e => setAiForm({ ...aiForm, description: e.target.value })}
                  rows={10}
                  placeholder={"Collez ici votre brief de déploiement complet :\n\n• Contexte business et enjeux stratégiques\n• Objectifs RH et de transformation\n• Population cible (effectifs, fonctions, niveaux)\n• Contraintes calendaires\n• Budget et ressources disponibles\n• KPIs de succès attendus\n• Parcours ou compétences visées"}
                />
              </div>
            </TabsContent>

            {/* CHAT */}
            <TabsContent value="chat" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nom de la campagne</Label>
                  <Input value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Titre" />
                </div>
                <div className="space-y-1.5">
                  <Label>Organisation</Label>
                  <Select value={aiForm.organization_id || "none"} onValueChange={v => setAiForm({ ...aiForm, organization_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Décrivez librement votre campagne</Label>
                <Textarea
                  value={aiChat}
                  onChange={e => setAiChat(e.target.value)}
                  rows={8}
                  placeholder={"Décrivez en langage naturel la campagne que vous voulez déployer.\n\nExemple : \"Je veux former 150 managers à l'IA générative sur 3 mois. Ils n'ont aucune expérience. Il faut un rythme de 2h par semaine max, avec des relances hebdomadaires. L'objectif est que 80% aient complété le parcours avant septembre.\""}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setAiOpen(false)}>Annuler</Button>
            <Button
              onClick={() => generateAI.mutate()}
              disabled={!aiForm.name || !aiForm.organization_id || (aiMode === "chat" ? !aiChat : (aiMode === "corporate" ? !aiForm.description : !aiForm.objectives)) || generateAI.isPending}
            >
              {generateAI.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {generateAI.isPending ? "Génération..." : "Générer la campagne"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Strategy Result Dialog */}
      <Dialog open={!!aiStrategy} onOpenChange={() => setAiStrategy(null)}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Stratégie de déploiement
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
            {aiStrategy}
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setAiStrategy(null)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
