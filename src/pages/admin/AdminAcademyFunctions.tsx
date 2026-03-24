import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, ArrowLeft, Pencil, Trash2, Save, Sparkles, Loader2, MessageSquare, Wand2, Building2, Target, ArrowRight, Check, Lightbulb, UserCheck, GraduationCap, Cpu, BarChart3, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CreationMode = "guided" | "corporate" | "chat";

const modes: { id: CreationMode; label: string; desc: string; icon: any; gradient: string }[] = [
  { id: "guided", label: "Guidé par l'IA", desc: "Répondez à quelques questions, l'IA crée la fiche fonction complète", icon: Wand2, gradient: "from-violet-500/10 to-blue-500/10" },
  { id: "corporate", label: "Brief Corporate", desc: "Collez une fiche de poste ou un brief — l'IA structure la fonction", icon: Building2, gradient: "from-blue-500/10 to-emerald-500/10" },
  { id: "chat", label: "Chat avec l'IA", desc: "Dialoguez librement pour co-construire la fiche fonction", icon: MessageSquare, gradient: "from-amber-500/10 to-rose-500/10" },
];

export default function AdminAcademyFunctions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ name: "", description: "", department: "", seniority: "", industry: "", company_size: "", status: "draft", responsibilities: [], tools_used: [], kpis: [], ai_use_cases: [] });
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreationMode | null>(null);

  const { data: functions = [], isLoading } = useQuery({
    queryKey: ["admin-academy-functions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_functions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (editId) {
        const { error } = await supabase.from("academy_functions" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_functions" as any).insert({ ...payload, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-functions"] }); toast.success(editId ? "Fonction mise à jour" : "Fonction créée"); setEditOpen(false); setEditId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("academy_functions" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-functions"] }); toast.success("Fonction supprimée"); },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(f: any) {
    setEditId(f.id);
    setForm({ name: f.name, description: f.description || "", department: f.department || "", seniority: f.seniority || "", industry: f.industry || "", company_size: f.company_size || "", status: f.status, responsibilities: f.responsibilities || [], tools_used: f.tools_used || [], kpis: f.kpis || [], ai_use_cases: f.ai_use_cases || [] });
    setEditOpen(true);
  }

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = [...new Set(functions.map((f: any) => f.department).filter(Boolean))];
  const filtered = functions.filter((f: any) => {
    if (searchTerm && !f.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (deptFilter !== "all" && f.department !== deptFilter) return false;
    return true;
  });

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">Fonctions</h1>
              <p className="text-xs text-muted-foreground">{functions.length} rôles organisationnels</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setCreateMode(null); setCreateOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nouvelle fonction</Button>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher…" className="pl-8 h-8 text-xs" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Département" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous départements</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex bg-muted rounded-lg p-0.5 ml-auto">
            <button onClick={() => setViewMode("grid")} className={cn("px-2.5 py-1 text-xs rounded-md transition-all", viewMode === "grid" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("table")} className={cn("px-2.5 py-1 text-xs rounded-md transition-all", viewMode === "table" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-20 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium">Aucune fonction trouvée</p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => { setCreateMode(null); setCreateOpen(true); }}><Sparkles className="h-4 w-4" /> Créer une fonction</Button>
          </CardContent></Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f: any) => (
              <Card key={f.id} className="hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate(`/admin/academy/functions/${f.id}`)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0"><Briefcase className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); remove.mutate(f.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.department && <Badge variant="outline" className="text-[10px]">{f.department}</Badge>}
                    {f.seniority && <Badge variant="outline" className="text-[10px]">{f.seniority}</Badge>}
                    <Badge variant={f.status === "published" ? "default" : "secondary"} className="text-[10px]">{f.status}</Badge>
                  </div>
                  {(f.ai_use_cases as string[])?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Cpu className="h-3 w-3 text-violet-500" />
                      <span>{(f.ai_use_cases as string[]).length} cas d'usage IA</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Nom</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Département</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Séniorité</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((f: any) => (
                      <tr key={f.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/admin/academy/functions/${f.id}`)}>
                        <td className="p-3">
                          <p className="font-medium">{f.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{f.description}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">{f.department || "—"}</td>
                        <td className="p-3 text-muted-foreground">{f.seniority || "—"}</td>
                        <td className="p-3"><Badge variant={f.status === "published" ? "default" : "secondary"} className="text-[10px]">{f.status}</Badge></td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); remove.mutate(f.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <CreateFunctionDialog open={createOpen} onOpenChange={setCreateOpen} mode={createMode} onModeChange={setCreateMode} userId={user?.id || ""} onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin-academy-functions"] }); setCreateOpen(false); }} />
    </AdminShell>
  );
}

// ─── Create Function Dialog ──────────────────────────────────────────

function CreateFunctionDialog({ open, onOpenChange, mode, onModeChange, userId, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; mode: CreationMode | null; onModeChange: (m: CreationMode | null) => void; userId: string; onSuccess: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onModeChange(null); onOpenChange(v); }}>
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] max-w-2xl">
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <GradientIcon icon={Briefcase} gradient="primary" size="sm" />
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{mode ? modes.find(m => m.id === mode)?.label : "Créer une Fonction"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{mode ? modes.find(m => m.id === mode)?.desc : "Choisissez votre méthode de création"}</p>
            </div>
          </div>
        </div>
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div key="mode-select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 space-y-3">
                {modes.map(m => (
                  <button key={m.id} onClick={() => onModeChange(m.id)} className={cn("w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left hover:shadow-md hover:border-primary/30 hover:scale-[1.01]", `bg-gradient-to-r ${m.gradient}`)}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm border shrink-0"><m.icon className="h-6 w-6 text-primary" /></div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{m.label}</p><p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p></div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </motion.div>
            ) : mode === "guided" ? (
              <GuidedFunctionMode key="guided" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : mode === "corporate" ? (
              <CorporateFunctionMode key="corporate" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : (
              <ChatFunctionMode key="chat" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Guided Mode ─────────────────────────────────────────────────────

const seniorityOpts = ["Junior", "Confirmé", "Senior", "Expert", "C-Level"];
const departmentOpts = ["Commercial", "Marketing", "RH", "Finance", "Tech / IT", "Opérations", "Direction Générale", "Juridique", "R&D", "Supply Chain", "Qualité"];
const industryOpts = ["Tech / SaaS", "Industrie", "Banque / Assurance", "Santé / Pharma", "Énergie", "Retail", "Média", "Services professionnels", "Autre"];

function GuidedFunctionMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [department, setDepartment] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [{ title: "Rôle & Industrie", icon: Briefcase }, { title: "Profil", icon: UserCheck }, { title: "Contexte", icon: Lightbulb }];
  const canProceed = step === 0 ? !!role : step === 1 ? !!seniority : true;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const brief = `Rôle : ${role}\nIndustrie : ${industry}\nSéniorité : ${seniority}\nDépartement : ${department}\nTaille entreprise : ${companySize}\nContexte : ${context}`;
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-function", brief, mode: "guided" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Fonction "${data.function_record.name}" créée par l'IA !`);
      onSuccess();
    } catch (e: any) { toast.error(e.message || "Erreur"); } finally { setIsGenerating(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="px-6 pt-4 pb-2 flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => { if (i < step) setStep(i); }} className={cn("flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-all shrink-0", i < step && "bg-primary text-primary-foreground cursor-pointer", i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20", i > step && "bg-muted text-muted-foreground")}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            {i < steps.length - 1 && <div className="flex-1 mx-1.5"><div className={cn("h-0.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} /></div>}
          </div>
        ))}
      </div>
      <div className="px-6 pb-2"><p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Étape {step + 1} · {steps[step].title}</p></div>
      <div className="px-6 pb-4 min-h-[250px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5"><Label>Quel est le poste cible ? *</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Directeur des Opérations" className="h-11" /></div>
              <div className="space-y-1.5"><Label>Industrie</Label>
                <div className="flex flex-wrap gap-2">{industryOpts.map(i => <button key={i} onClick={() => setIndustry(i)} className={cn("px-3 py-1.5 rounded-lg border text-xs transition-all", industry === i ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30")}>{i}</button>)}</div>
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5"><Label>Séniorité *</Label>
                <div className="flex flex-wrap gap-2">{seniorityOpts.map(s => <button key={s} onClick={() => setSeniority(s)} className={cn("px-3 py-2 rounded-lg border text-sm transition-all", seniority === s ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30")}>{s}</button>)}</div>
              </div>
              <div className="space-y-1.5"><Label>Département</Label>
                <div className="flex flex-wrap gap-2">{departmentOpts.map(d => <button key={d} onClick={() => setDepartment(d)} className={cn("px-3 py-1.5 rounded-lg border text-xs transition-all", department === d ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30")}>{d}</button>)}</div>
              </div>
              <div className="space-y-1.5"><Label>Taille d'entreprise</Label>
                <div className="flex flex-wrap gap-2">{["PME (<250)", "ETI (250-5000)", "Grand groupe (5000+)"].map(s => <button key={s} onClick={() => setCompanySize(s)} className={cn("px-3 py-1.5 rounded-lg border text-xs transition-all", companySize === s ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30")}>{s}</button>)}</div>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5"><Label>Contexte, enjeux, défis spécifiques</Label><Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Ex: Transformation digitale, intégration IA dans les processus, gestion du changement..." rows={4} /></div>
              <div className="p-4 rounded-xl bg-muted/50 border border-dashed">
                <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold">Récapitulatif</span></div>
                <p className="text-xs text-muted-foreground"><strong>{role}</strong> {industry && `— ${industry}`}, <strong>{seniority}</strong> {department && `en ${department}`}{companySize && `, ${companySize}`}. {context && `Contexte : ${context}`}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={step === 0 ? onBack : () => setStep(s => s - 1)} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? "Retour" : "Précédent"}</Button>
        {step < 2 ? (
          <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="gap-1.5 min-w-[120px]">Suivant <ArrowRight className="h-3.5 w-3.5" /></Button>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={!role || !seniority || isGenerating} className="gap-1.5 min-w-[160px]">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Générer la fonction</>}</Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Corporate Mode ──────────────────────────────────────────────────

function CorporateFunctionMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-function", brief: brief.trim(), mode: "corporate" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Fonction "${data.function_record.name}" créée par l'IA !`);
      onSuccess();
    } catch (e: any) { toast.error(e.message || "Erreur"); } finally { setIsGenerating(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="px-6 py-6 space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border space-y-2">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">Brief Corporate</span></div>
          <p className="text-xs text-muted-foreground">Collez une fiche de poste, un organigramme, un brief RH ou décrivez le rôle. L'IA extraira les responsabilités, outils, KPIs et cas d'usage IA.</p>
        </div>
        <Textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder={`Exemple :\n\nDirecteur des Opérations Industrielles — Groupe agroalimentaire (8 usines, 3000 collaborateurs)\n\nMissions :\n- Piloter la performance industrielle\n- Optimiser la supply chain\n- Déployer l'industrie 4.0\n- Manager 8 directeurs d'usine\n\nOutils : SAP, Power BI, MES\nKPIs : TRS, coûts de production, taux de service`} className="min-h-[260px] resize-y text-sm" disabled={isGenerating} />
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{brief.length} caractères</span><span>Min. recommandé : 100</span></div>
      </div>
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Retour</Button>
        <Button size="sm" onClick={handleGenerate} disabled={brief.trim().length < 20 || isGenerating} className="gap-1.5 min-w-[160px]">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Analyser et créer</>}</Button>
      </div>
    </motion.div>
  );
}

// ─── Chat Mode ───────────────────────────────────────────────────────

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }

function ChatFunctionMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    id: "welcome", role: "assistant",
    content: `👋 Bonjour ! Je vais vous aider à définir une **fiche fonction** complète.\n\nParlez-moi du **poste** que vous souhaitez décrire :\n- Quel rôle ? Quel département ?\n- Dans quel type d'entreprise ?\n- Quels sont les enjeux actuels de ce poste face à l'IA ?\n\nJe vous poserai les bonnes questions pour structurer la fiche. 🎯`
  }]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: input.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsStreaming(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          practice_id: "__function_chat__",
          messages: allMsgs.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content })),
          evaluate: false,
          system_override: `Tu es un expert RH et en design organisationnel qui aide à créer des fiches de fonction pour un LMS.
Tu poses des questions pour comprendre : le rôle, les responsabilités, les outils, les KPIs, les cas d'usage IA pertinents.
Après 3-4 échanges, propose une synthèse. Si l'utilisateur valide, réponds avec :
\`\`\`function_brief
[résumé structuré complet]
\`\`\``
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("Erreur");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl); buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const delta = JSON.parse(json).choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id.startsWith("a-")) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
                return [...prev, { id: `a-${Date.now()}`, role: "assistant", content }];
              });
            }
          } catch {}
        }
      }

      const briefMatch = content.match(/```function_brief\s*\n?([\s\S]*?)```/);
      if (briefMatch) {
        const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-function", brief: briefMatch[1].trim(), mode: "chat" } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Fonction "${data.function_record.name}" créée !`);
        onSuccess();
      }
    } catch (e: any) { toast.error(e.message || "Erreur"); } finally { setIsStreaming(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col h-[500px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md")}>
              {m.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div> : m.content}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start"><div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>
        )}
      </div>
      <div className="px-6 py-4 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Décrivez le poste..." className="flex-1" disabled={isStreaming} />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </motion.div>
  );
}
