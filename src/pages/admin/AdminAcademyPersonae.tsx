import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowLeft, Pencil, Trash2, Save, Sparkles, Loader2, MessageSquare, Wand2, Building2, Target, AlertTriangle, Briefcase, GraduationCap, Lightbulb, UserCheck, ArrowRight, Check } from "lucide-react";
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

// ─── Types ───────────────────────────────────────────────────────────

interface PersonaForm {
  name: string;
  description: string;
  status: string;
  characteristics: {
    seniority: string;
    department: string;
    goals: string[];
    pain_points: string[];
    scenarios?: string[];
    prerequisites?: string[];
    learning_format?: string;
    success_metrics?: string[];
    industry?: string;
    company_size?: string;
  };
}

const emptyForm: PersonaForm = {
  name: "",
  description: "",
  status: "draft",
  characteristics: { seniority: "", department: "", goals: [], pain_points: [] },
};

type CreationMode = "guided" | "corporate" | "chat";

// ─── Main Component ──────────────────────────────────────────────────

export default function AdminAcademyPersonae() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  
  // Edit dialog (simple)
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [goalsText, setGoalsText] = useState("");
  const [painText, setPainText] = useState("");
  
  // Create dialog (3 modes)
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreationMode | null>(null);

  const { data: personae = [], isLoading } = useQuery({
    queryKey: ["admin-academy-personae"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_personae")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const chars = {
        ...form.characteristics,
        goals: goalsText.split("\n").map(s => s.trim()).filter(Boolean),
        pain_points: painText.split("\n").map(s => s.trim()).filter(Boolean),
      };
      if (editId) {
        const { error } = await supabase
          .from("academy_personae")
          .update({ name: form.name, description: form.description, status: form.status, characteristics: chars })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academy_personae")
          .insert({ name: form.name, description: form.description, status: form.status, characteristics: chars, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
      toast.success(editId ? "Persona mis à jour" : "Persona créé");
      closeEdit();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_personae").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
      toast.success("Persona supprimé");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(p: any) {
    setEditId(p.id);
    const chars = p.characteristics || {};
    setForm({
      name: p.name,
      description: p.description || "",
      status: p.status,
      characteristics: { seniority: chars.seniority || "", department: chars.department || "", goals: chars.goals || [], pain_points: chars.pain_points || [], ...chars },
    });
    setGoalsText((chars.goals || []).join("\n"));
    setPainText((chars.pain_points || []).join("\n"));
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditId(null);
  }

  function openCreate() {
    setCreateMode(null);
    setCreateOpen(true);
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Personae</h1>
            <Badge variant="secondary">{personae.length}</Badge>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau persona
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5"><div className="h-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : personae.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">Aucun persona créé</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">Créez des profils cibles pour personnaliser vos parcours de formation. L'IA peut vous aider à les concevoir.</p>
              <Button size="sm" className="mt-4 gap-2" onClick={openCreate}>
                <Sparkles className="h-4 w-4" /> Créer un persona
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personae.map((p: any) => {
              const chars = p.characteristics || {};
              return (
                <Card key={p.id} className="hover:shadow-md transition-all group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {chars.seniority && <Badge variant="outline" className="text-[10px]">{chars.seniority}</Badge>}
                      {chars.department && <Badge variant="outline" className="text-[10px]">{chars.department}</Badge>}
                      {chars.industry && <Badge variant="outline" className="text-[10px]">{chars.industry}</Badge>}
                      <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {p.generation_mode === "ai" ? <><Sparkles className="h-2.5 w-2.5" /> IA</> : "Manuel"}
                      </Badge>
                    </div>
                    {(chars.goals?.length > 0 || chars.pain_points?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {chars.goals?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Objectifs</p>
                            <ul className="space-y-0.5">
                              {chars.goals.slice(0, 3).map((g: string, i: number) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                                  <Target className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                                  <span className="line-clamp-1">{g}</span>
                                </li>
                              ))}
                              {chars.goals.length > 3 && <li className="text-[10px] text-muted-foreground/60">+{chars.goals.length - 3} autres</li>}
                            </ul>
                          </div>
                        )}
                        {chars.pain_points?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Frustrations</p>
                            <ul className="space-y-0.5">
                              {chars.pain_points.slice(0, 3).map((p: string, i: number) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                                  <span className="line-clamp-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Create Dialog with 3 Modes ─── */}
      <CreatePersonaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode={createMode}
        onModeChange={setCreateMode}
        userId={user?.id || ""}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
          setCreateOpen(false);
        }}
      />

      {/* ─── Edit Dialog (simple form) ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Modifier le persona
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Directeur Commercial PME" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Profil type, contexte, enjeux..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Séniorité</Label>
                <Input value={form.characteristics.seniority} onChange={e => setForm({ ...form, characteristics: { ...form.characteristics, seniority: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label>Département</Label>
                <Input value={form.characteristics.department} onChange={e => setForm({ ...form, characteristics: { ...form.characteristics, department: e.target.value } })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Objectifs (un par ligne)</Label>
              <Textarea value={goalsText} onChange={e => setGoalsText(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Points de douleur (un par ligne)</Label>
              <Textarea value={painText} onChange={e => setPainText(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeEdit}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>
                <Save className="h-4 w-4 mr-2" /> Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

// ─── Create Persona Dialog ───────────────────────────────────────────

interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: CreationMode | null;
  onModeChange: (m: CreationMode | null) => void;
  userId: string;
  onSuccess: () => void;
}

const modes: { id: CreationMode; label: string; desc: string; icon: any; gradient: string }[] = [
  { id: "guided", label: "Guidé par l'IA", desc: "Répondez à quelques questions, l'IA crée le persona complet", icon: Wand2, gradient: "from-violet-500/10 to-blue-500/10" },
  { id: "corporate", label: "Brief Corporate", desc: "Collez un brief, une fiche de poste, ou une description — l'IA structure le persona", icon: Building2, gradient: "from-blue-500/10 to-emerald-500/10" },
  { id: "chat", label: "Chat avec l'IA", desc: "Dialoguez librement avec l'IA pour co-construire le persona idéal", icon: MessageSquare, gradient: "from-amber-500/10 to-rose-500/10" },
];

function CreatePersonaDialog({ open, onOpenChange, mode, onModeChange, userId, onSuccess }: CreatePersonaDialogProps) {
  const handleOpenChange = (v: boolean) => {
    if (!v) onModeChange(null);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <GradientIcon icon={Users} gradient="primary" size="sm" />
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">
                {mode ? modes.find(m => m.id === mode)?.label : "Créer un Persona"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode ? modes.find(m => m.id === mode)?.desc : "Choisissez votre méthode de création"}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div
                key="mode-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-3"
              >
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => onModeChange(m.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left",
                      "hover:shadow-md hover:border-primary/30 hover:scale-[1.01]",
                      `bg-gradient-to-r ${m.gradient}`
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm border shrink-0">
                      <m.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </motion.div>
            ) : mode === "guided" ? (
              <GuidedMode key="guided" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : mode === "corporate" ? (
              <CorporateMode key="corporate" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : (
              <ChatMode key="chat" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Guided Mode (step-by-step) ──────────────────────────────────────

const seniorityOptions = ["Junior", "Confirmé", "Senior", "Expert", "C-Level"];
const departmentOptions = ["Commercial", "Marketing", "RH", "Finance", "Tech / IT", "Opérations", "Direction Générale", "Juridique", "R&D", "Autre"];
const formatOptions = ["Micro-learning (5-15 min)", "Sessions courtes (30 min)", "Formation immersive (2-4h)", "Parcours hybride", "Coaching individuel"];

function GuidedMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [seniority, setSeniority] = useState("");
  const [department, setDepartment] = useState("");
  const [context, setContext] = useState("");
  const [format, setFormat] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { title: "Rôle & Industrie", icon: Briefcase },
    { title: "Profil & Contexte", icon: UserCheck },
    { title: "Format", icon: GraduationCap },
  ];

  const canProceed = step === 0 ? !!role : step === 1 ? !!seniority : !!format;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const brief = `Rôle : ${role}
Industrie : ${industry}
Séniorité : ${seniority}
Département : ${department}
Contexte : ${context}
Format préféré : ${format}`;

      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-persona", brief, mode: "guided" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona "${data.persona.name}" créé par l'IA !`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      {/* Steps indicator */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-all shrink-0",
                i < step && "bg-primary text-primary-foreground cursor-pointer",
                i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                i > step && "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className="flex-1 mx-1.5">
                <div className={cn("h-0.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 pb-2">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Étape {step + 1} · {steps[step].title}
        </p>
      </div>

      <div className="px-6 pb-4 min-h-[250px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Quel est le rôle cible ? *</Label>
                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Responsable de la transformation digitale" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Dans quelle industrie ?</Label>
                <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Ex: Assurance, Agroalimentaire, SaaS..." className="h-11" />
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Niveau de séniorité *</Label>
                <div className="flex flex-wrap gap-2">
                  {seniorityOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => setSeniority(s)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-all",
                        seniority === s ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Département</Label>
                <div className="flex flex-wrap gap-2">
                  {departmentOptions.map(d => (
                    <button
                      key={d}
                      onClick={() => setDepartment(d)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs transition-all",
                        department === d ? "border-primary bg-primary/10 text-primary font-medium" : "hover:border-primary/30"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contexte ou enjeux spécifiques</Label>
                <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Ex: Migration vers l'IA, restructuration d'équipe..." rows={2} />
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Format d'apprentissage préféré *</Label>
                <div className="space-y-2">
                  {formatOptions.map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm",
                        format === f ? "border-primary bg-primary/10 text-primary font-medium shadow-sm" : "hover:border-primary/30"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-dashed">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold">Récapitulatif</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>{role}</strong> {industry && `dans le secteur ${industry}`}, niveau <strong>{seniority}</strong>
                  {department && ` en ${department}`}. Format : <strong>{format}</strong>.
                  {context && ` Contexte : ${context}`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={step === 0 ? onBack : () => setStep(s => s - 1)} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? "Retour" : "Précédent"}
        </Button>
        {step < 2 ? (
          <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="gap-1.5 min-w-[120px]">
            Suivant <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={!canProceed || isGenerating} className="gap-1.5 min-w-[160px]">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Générer le persona</>}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Corporate Mode (paste brief) ────────────────────────────────────

function CorporateMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-persona", brief: brief.trim(), mode: "corporate" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona "${data.persona.name}" créé par l'IA !`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="px-6 py-6 space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Brief Corporate</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Collez ici une fiche de poste, un brief de formation, un extrait de cahier des charges, 
            ou décrivez librement le profil cible. L'IA analysera et structurera le persona automatiquement.
          </p>
        </div>

        <Textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder={`Exemple :\n\nNous cherchons à former les managers commerciaux de notre division B2B SaaS (environ 40 personnes, 5-15 ans d'expérience) à l'utilisation de l'IA générative dans leur cycle de vente.\n\nIls doivent pouvoir :\n- Qualifier les leads avec l'aide de l'IA\n- Personnaliser les propositions commerciales\n- Analyser les objections récurrentes\n\nContraintes : disponibles 2h/semaine max, besoin de résultats mesurables sous 3 mois.`}
          className="min-h-[260px] resize-y text-sm"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{brief.length} caractères</span>
          <span>Minimum recommandé : 100 caractères</span>
        </div>
      </div>

      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour
        </Button>
        <Button size="sm" onClick={handleGenerate} disabled={brief.trim().length < 20 || isGenerating} className="gap-1.5 min-w-[160px]">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Analyser et créer</>}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Chat Mode ───────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function ChatMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Bonjour ! Je suis votre assistant pédagogique.

Je vais vous aider à concevoir un persona de formation sur-mesure. 

Pour commencer, parlez-moi du **profil que vous souhaitez cibler** :
- Quel est leur rôle ?
- Dans quel secteur travaillent-ils ?
- Quels sont leurs enjeux actuels ?

Vous pouvez aussi me donner un brief libre et je poserai les bonnes questions. 🎯`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsStreaming(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          practice_id: "__persona_chat__",
          messages: allMsgs.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content })),
          evaluate: false,
          system_override: `Tu es un expert en ingénierie pédagogique qui aide à concevoir des personae de formation.
Tu poses des questions pertinentes pour comprendre le profil cible.
Après 3-4 échanges, propose une synthèse structurée du persona.
Sois conversationnel, professionnel, et synthétique. Utilise du markdown.
Si l'utilisateur dit "crée-le" ou valide, réponds avec le bloc suivant :
\`\`\`persona_brief
[résumé structuré du brief complet]
\`\`\``,
        }),
      });

      if (!resp.ok) throw new Error("Erreur de communication");
      if (!resp.body) throw new Error("No body");

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
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id.startsWith("a-")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
                }
                return [...prev, { id: `a-${Date.now()}`, role: "assistant", content }];
              });
            }
          } catch {}
        }
      }

      // Check if AI produced a persona_brief block
      const briefMatch = content.match(/```persona_brief\s*\n?([\s\S]*?)```/);
      if (briefMatch) {
        // Auto-create the persona
        setIsCreating(true);
        const { data, error } = await supabase.functions.invoke("academy-generate", {
          body: { action: "generate-persona", brief: briefMatch[1].trim(), mode: "chat" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Persona "${data.persona.name}" créé !`);
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setIsStreaming(false);
      setIsCreating(false);
    }
  };

  const handleCreateFromChat = async () => {
    // Compile all messages into a brief
    setIsCreating(true);
    try {
      const brief = messages
        .filter(m => m.id !== "welcome")
        .map(m => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke("academy-generate", {
        body: { action: "generate-persona", brief: `Voici une conversation avec un expert pédagogique. Crée le persona à partir de cette discussion :\n\n${brief}`, mode: "chat" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona "${data.persona.name}" créé !`);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col h-[500px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.replace(/```persona_brief[\s\S]*?```/g, "✅ *Persona prêt à être créé...*")}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t bg-muted/20 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Décrivez le profil cible..."
            className="min-h-[44px] max-h-[80px] resize-none text-sm"
            disabled={isStreaming || isCreating}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming || isCreating} className="shrink-0 h-11 w-11">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground text-xs">
            <ArrowLeft className="h-3 w-3" /> Retour
          </Button>
          {messages.filter(m => m.role === "user").length >= 2 && (
            <Button size="sm" variant="secondary" onClick={handleCreateFromChat} disabled={isCreating} className="gap-1.5 text-xs">
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Créer le persona</>}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
