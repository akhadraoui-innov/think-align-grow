
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Pencil, Trash2, Save, Sparkles, Loader2, MessageSquare, Wand2, Building2, ArrowRight, Lightbulb, UserCheck, Brain, Heart, Zap, RefreshCw, Eye, Copy, Filter, Globe, Users as UsersIcon, HandshakeIcon, ShieldCheck, BarChart3, Ear } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VersionHistory } from "@/components/admin/VersionHistory";

// ─── Types ───────────────────────────────────────────────────────────

interface BehavioralTraits {
  digital_maturity: number; ai_apprehension: number; experimentation_level: number;
  initiative_level: number; change_appetite: number;
  collaboration_preference: number; autonomy_level: number; risk_tolerance: number;
  data_literacy: number; feedback_receptivity: number;
  learning_style: string; time_availability: string; preferred_format: string;
  motivation_drivers: string[]; resistance_patterns: string[];
  habits: string[]; communication_style: string[]; decision_patterns: string[];
  tech_relationship: string[]; objections_type: string[]; engagement_triggers: string[]; blockers: string[];
  typical_day: string; ai_relationship_summary: string; ideal_learning_journey: string;
  coaching_approach: string; success_indicators: string;
}

const defaultTraits: BehavioralTraits = {
  digital_maturity: 3, ai_apprehension: 3, experimentation_level: 3,
  initiative_level: 3, change_appetite: 3, collaboration_preference: 3,
  autonomy_level: 3, risk_tolerance: 3, data_literacy: 3, feedback_receptivity: 3,
  learning_style: "doing", time_availability: "short", preferred_format: "guidé",
  motivation_drivers: [], resistance_patterns: [],
  habits: [], communication_style: [], decision_patterns: [],
  tech_relationship: [], objections_type: [], engagement_triggers: [], blockers: [],
  typical_day: "", ai_relationship_summary: "", ideal_learning_journey: "",
  coaching_approach: "", success_indicators: "",
};

type CreationMode = "guided" | "corporate" | "chat";

const modes: { id: CreationMode; label: string; desc: string; icon: any; gradient: string }[] = [
  { id: "guided", label: "Archétypes IA", desc: "Choisissez des traits comportementaux, l'IA crée le persona", icon: Wand2, gradient: "from-violet-500/10 to-blue-500/10" },
  { id: "corporate", label: "Brief Comportemental", desc: "Décrivez les comportements observés — l'IA structure le persona", icon: Building2, gradient: "from-blue-500/10 to-emerald-500/10" },
  { id: "chat", label: "Chat avec l'IA", desc: "Dialoguez pour co-construire le profil comportemental", icon: MessageSquare, gradient: "from-amber-500/10 to-rose-500/10" },
];

const traitLabels = [
  { key: "digital_maturity", label: "Maturité digitale", icon: Zap, low: "Novice", high: "Expert", short: "MATU" },
  { key: "ai_apprehension", label: "Appréhension IA", icon: Brain, low: "Serein", high: "Anxieux", short: "APPR" },
  { key: "experimentation_level", label: "Expérimentation", icon: RefreshCw, low: "Prudent", high: "Aventurier", short: "EXPE" },
  { key: "initiative_level", label: "Initiative", icon: Lightbulb, low: "Suiveur", high: "Autonome", short: "INIT" },
  { key: "change_appetite", label: "Appétence changement", icon: Heart, low: "Conservateur", high: "Transformateur", short: "CHAN" },
  { key: "collaboration_preference", label: "Collaboration", icon: HandshakeIcon, low: "Solo", high: "Collectif", short: "COLL" },
  { key: "autonomy_level", label: "Autonomie", icon: UserCheck, low: "Encadré", high: "Autonome", short: "AUTO" },
  { key: "risk_tolerance", label: "Tolérance risque", icon: ShieldCheck, low: "Aversion", high: "Preneur", short: "RISK" },
  { key: "data_literacy", label: "Littératie data", icon: BarChart3, low: "Aucune", high: "Data-driven", short: "DATA" },
  { key: "feedback_receptivity", label: "Réceptivité feedback", icon: Ear, low: "Défensif", high: "Demandeur", short: "FEED" },
];

// ─── Radar 10 axes ───────────────────────────────────────────────────

function TraitRadar({ traits, size = 140 }: { traits: BehavioralTraits; size?: number }) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.36;
  const n = traitLabels.length;
  const getPoint = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (v / 5) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const pts = traitLabels.map((t, i) => getPoint(i, (traits as any)[t.key] || 3));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 2, 3, 4, 5].map(v => (
        <polygon key={v} points={Array.from({ length: n }, (_, i) => { const p = getPoint(i, v); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.3} />
      ))}
      {traitLabels.map((_, i) => {
        const p = getPoint(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.3" opacity={0.2} />;
      })}
      <motion.path d={path} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="1.5" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--primary))" />)}
      {traitLabels.map((t, i) => {
        const p = getPoint(i, 6.5);
        return <text key={t.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize="6" fontWeight="600">{t.short}</text>;
      })}
    </svg>
  );
}

// ─── Tags chip editor ────────────────────────────────────────────────

function TagsEditor({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(""); } };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {tags.map((t, i) => (
          <Badge key={i} variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onChange(tags.filter((_, j) => j !== i))}>{t} ×</Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Ajouter..." className="h-7 text-xs flex-1" />
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={add}>+</Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function AdminAcademyPersonae() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; status: string; tags: string[]; characteristics: BehavioralTraits }>({ name: "", description: "", status: "draft", tags: [], characteristics: { ...defaultTraits } });
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreationMode | null>(null);
  const [filter, setFilter] = useState<"all" | "generic" | "org">("all");
  const [deriveOpen, setDeriveOpen] = useState(false);
  const [deriveParentId, setDeriveParentId] = useState<string | null>(null);
  const [deriveOrgId, setDeriveOrgId] = useState("");
  const [isDeriving, setIsDeriving] = useState(false);

  const { data: personae = [], isLoading } = useQuery({
    queryKey: ["admin-academy-personae"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academy_personae").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs-list"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return data || [];
    },
  });

  const filteredPersonae = personae.filter((p: any) => {
    if (filter === "generic") return !p.organization_id;
    if (filter === "org") return !!p.organization_id;
    return true;
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, description: form.description, status: form.status, characteristics: form.characteristics as any, tags: form.tags as any };
      if (editId) {
        const { error } = await supabase.from("academy_personae").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academy_personae").insert({ ...payload, created_by: user!.id, generation_mode: "manual" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-personae"] }); toast.success(editId ? "Persona mis à jour" : "Persona créé"); setEditOpen(false); setEditId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("academy_personae").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-academy-personae"] }); toast.success("Persona supprimé"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDerive = async () => {
    if (!deriveParentId || !deriveOrgId) return;
    setIsDeriving(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "derive-persona", parent_persona_id: deriveParentId, organization_id: deriveOrgId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona décliné : "${data.persona.name}"`);
      qc.invalidateQueries({ queryKey: ["admin-academy-personae"] });
      setDeriveOpen(false);
    } catch (e: any) { toast.error(e.message); } finally { setIsDeriving(false); }
  };

  function openEdit(p: any) {
    setEditId(p.id);
    const chars = p.characteristics || {};
    setForm({
      name: p.name, description: p.description || "", status: p.status,
      tags: (p as any).tags || [],
      characteristics: { ...defaultTraits, ...chars },
    });
    setEditOpen(true);
  }

  const updateTrait = (key: string, value: any) => setForm(f => ({ ...f, characteristics: { ...f.characteristics, [key]: value } }));

  return (
    
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/portal/academie")}><ArrowLeft className="h-4 w-4" /></Button>
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-bold">Personae comportementaux</h1>
            <Badge variant="secondary">{filteredPersonae.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {([["all", "Tous"], ["generic", "Génériques"], ["org", "Par org"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} className={cn("px-3 py-1 text-xs rounded-md transition-all", filter === v ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
            <Button size="sm" onClick={() => { setCreateMode(null); setCreateOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nouveau persona</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-32 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : filteredPersonae.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium">Aucun persona comportemental</p>
            <p className="text-xs mt-1 max-w-md mx-auto">Les personae décrivent comment les apprenants réagissent, apprennent et s'adaptent — pas leur poste.</p>
            <Button size="sm" className="mt-4 gap-2" onClick={() => { setCreateMode(null); setCreateOpen(true); }}><Sparkles className="h-4 w-4" /> Créer un persona</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPersonae.map((p: any) => {
              const chars = { ...defaultTraits, ...(p.characteristics || {}) };
              const orgName = p.organization_id ? orgs.find((o: any) => o.id === p.organization_id)?.name : null;
              const pTags: string[] = (p as any).tags || [];
              return (
                <Card key={p.id} className="hover:shadow-md transition-all group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{p.name}</p>
                          {p.parent_persona_id && <Badge variant="outline" className="text-[9px]"><Copy className="h-2.5 w-2.5 mr-0.5" />Déclinaison</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        {!p.organization_id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Décliner pour une org" onClick={() => { setDeriveParentId(p.id); setDeriveOrgId(""); setDeriveOpen(true); }}><Copy className="h-3.5 w-3.5" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TraitRadar traits={chars} size={110} />
                      <div className="flex-1 space-y-0.5">
                        {traitLabels.slice(0, 6).map(t => (
                          <div key={t.key} className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground w-10 truncate">{t.short}</span>
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((chars as any)[t.key] / 5) * 100}%` }} />
                            </div>
                            <span className="text-[9px] font-semibold w-3 text-right">{(chars as any)[t.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {orgName ? <Badge variant="outline" className="text-[9px] gap-1"><Building2 className="h-2.5 w-2.5" />{orgName}</Badge> : <Badge variant="outline" className="text-[9px] gap-1"><Globe className="h-2.5 w-2.5" />Générique</Badge>}
                      {chars.learning_style && <Badge variant="outline" className="text-[9px]">🎯 {chars.learning_style}</Badge>}
                      {chars.preferred_format && <Badge variant="outline" className="text-[9px]">📐 {chars.preferred_format}</Badge>}
                      <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-[9px]">{p.status}</Badge>
                      {pTags.slice(0, 3).map((t: string) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                    </div>
                    <VersionHistory assetType="persona" assetId={p.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreatePersonaDialog open={createOpen} onOpenChange={setCreateOpen} mode={createMode} onModeChange={setCreateMode} userId={user?.id || ""} onSuccess={() => { qc.invalidateQueries({ queryKey: ["admin-academy-personae"] }); setCreateOpen(false); }} />

      {/* Derive Dialog */}
      <Dialog open={deriveOpen} onOpenChange={setDeriveOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Copy className="h-4 w-4 text-primary" /> Décliner pour une organisation</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">L'IA adaptera les habitudes, objections et déclencheurs au contexte de l'organisation.</p>
          <Select value={deriveOrgId} onValueChange={setDeriveOrgId}>
            <SelectTrigger><SelectValue placeholder="Choisir une organisation" /></SelectTrigger>
            <SelectContent>{orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeriveOpen(false)}>Annuler</Button>
            <Button onClick={handleDerive} disabled={!deriveOrgId || isDeriving} className="gap-1.5">{isDeriving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Décliner</>}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4 text-primary" /> Modifier le persona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nom</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Traits comportementaux (10 axes)</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {traitLabels.map(t => (
                  <div key={t.key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] flex items-center gap-1"><t.icon className="h-3 w-3" /> {t.label}</Label>
                      <span className="text-[11px] font-semibold">{(form.characteristics as any)[t.key]}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-14">{t.low}</span>
                      <Slider value={[(form.characteristics as any)[t.key]]} onValueChange={([v]) => updateTrait(t.key, v)} min={1} max={5} step={1} className="flex-1" />
                      <span className="text-[9px] text-muted-foreground w-16 text-right">{t.high}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Style d'apprentissage</Label>
                <Select value={form.characteristics.learning_style || "doing"} onValueChange={v => updateTrait("learning_style", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="visual">Visuel</SelectItem><SelectItem value="reading">Lecture</SelectItem><SelectItem value="doing">Pratique</SelectItem><SelectItem value="discussing">Discussion</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Disponibilité</Label>
                <Select value={form.characteristics.time_availability || "short"} onValueChange={v => updateTrait("time_availability", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="micro">Micro (15min)</SelectItem><SelectItem value="short">Court (30min)</SelectItem><SelectItem value="medium">Moyen (1h)</SelectItem><SelectItem value="intensive">Intensif (2h+)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Format préféré</Label>
                <Select value={form.characteristics.preferred_format || "guidé"} onValueChange={v => updateTrait("preferred_format", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="autonome">Autonome</SelectItem><SelectItem value="guidé">Guidé</SelectItem><SelectItem value="coaching">Coaching</SelectItem><SelectItem value="groupe">Groupe</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags comportementaux</p>
              <div className="grid grid-cols-2 gap-3">
                <TagsEditor label="Habitudes" tags={form.characteristics.habits || []} onChange={v => updateTrait("habits", v)} />
                <TagsEditor label="Style de communication" tags={form.characteristics.communication_style || []} onChange={v => updateTrait("communication_style", v)} />
                <TagsEditor label="Patterns de décision" tags={form.characteristics.decision_patterns || []} onChange={v => updateTrait("decision_patterns", v)} />
                <TagsEditor label="Relation à la tech" tags={form.characteristics.tech_relationship || []} onChange={v => updateTrait("tech_relationship", v)} />
                <TagsEditor label="Types d'objections" tags={form.characteristics.objections_type || []} onChange={v => updateTrait("objections_type", v)} />
                <TagsEditor label="Déclencheurs d'engagement" tags={form.characteristics.engagement_triggers || []} onChange={v => updateTrait("engagement_triggers", v)} />
                <TagsEditor label="Blockers" tags={form.characteristics.blockers || []} onChange={v => updateTrait("blockers", v)} />
                <TagsEditor label="Motivations" tags={form.characteristics.motivation_drivers || []} onChange={v => updateTrait("motivation_drivers", v)} />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contextes textuels</p>
              <div className="space-y-2">
                <div className="space-y-1"><Label className="text-xs">Journée type</Label><Textarea value={form.characteristics.typical_day || ""} onChange={e => updateTrait("typical_day", e.target.value)} rows={2} className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Approche coaching recommandée</Label><Textarea value={form.characteristics.coaching_approach || ""} onChange={e => updateTrait("coaching_approach", e.target.value)} rows={2} className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Indicateurs de succès</Label><Textarea value={form.characteristics.success_indicators || ""} onChange={e => updateTrait("success_indicators", e.target.value)} rows={2} className="text-xs" /></div>
              </div>
            </div>

            <TagsEditor label="Tags de catégorisation" tags={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} />

            <div className="space-y-1.5"><Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="published">Publié</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}><Save className="h-4 w-4 mr-2" /> Mettre à jour</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    
  );
}

// ─── Create Dialog ───────────────────────────────────────────────────

function CreatePersonaDialog({ open, onOpenChange, mode, onModeChange, userId, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; mode: CreationMode | null; onModeChange: (m: CreationMode | null) => void; userId: string; onSuccess: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onModeChange(null); onOpenChange(v); }}>
      <DialogContent className="p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] max-w-2xl">
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <GradientIcon icon={Brain} gradient="primary" size="sm" />
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{mode ? modes.find(m => m.id === mode)?.label : "Créer un Persona"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{mode ? modes.find(m => m.id === mode)?.desc : "Profil comportemental d'apprentissage"}</p>
            </div>
          </div>
        </div>
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {!mode ? (
              <motion.div key="sel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 space-y-3">
                {modes.map(m => (
                  <button key={m.id} onClick={() => onModeChange(m.id)} className={cn("w-full flex items-center gap-4 p-5 rounded-xl border transition-all text-left hover:shadow-md hover:border-primary/30 hover:scale-[1.01]", `bg-gradient-to-r ${m.gradient}`)}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm border shrink-0"><m.icon className="h-6 w-6 text-primary" /></div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{m.label}</p><p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p></div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </motion.div>
            ) : mode === "guided" ? (
              <GuidedPersonaMode key="guided" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : mode === "corporate" ? (
              <CorporatePersonaMode key="corp" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            ) : (
              <ChatPersonaMode key="chat" userId={userId} onSuccess={onSuccess} onBack={() => onModeChange(null)} />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Guided Mode (corporate archetypes) ──────────────────────────────

const archetypes = [
  { id: "precursor", label: "🚀 Le Précurseur Digital", desc: "Early adopter enthousiaste, teste et évangélise les outils IA", traits: { digital_maturity: 5, ai_apprehension: 1, experimentation_level: 5, initiative_level: 5, change_appetite: 5, collaboration_preference: 4, autonomy_level: 5, risk_tolerance: 5, data_literacy: 4, feedback_receptivity: 4, learning_style: "doing", preferred_format: "autonome" } },
  { id: "results", label: "🎯 Le Décideur Orienté Résultats", desc: "Pragmatique, veut du ROI mesurable, pas de gadget", traits: { digital_maturity: 3, ai_apprehension: 2, experimentation_level: 3, initiative_level: 4, change_appetite: 3, collaboration_preference: 3, autonomy_level: 4, risk_tolerance: 3, data_literacy: 4, feedback_receptivity: 4, learning_style: "doing", preferred_format: "guidé" } },
  { id: "methodical", label: "📋 Le Méthodique Structuré", desc: "Prudent, veut des preuves et un cadre clair avant d'avancer", traits: { digital_maturity: 2, ai_apprehension: 4, experimentation_level: 2, initiative_level: 2, change_appetite: 2, collaboration_preference: 3, autonomy_level: 2, risk_tolerance: 2, data_literacy: 3, feedback_receptivity: 3, learning_style: "reading", preferred_format: "guidé" } },
  { id: "observer", label: "👁️ Le Profil en Observation", desc: "Attend de voir, réticent mais pas hostile, besoin de réassurance", traits: { digital_maturity: 1, ai_apprehension: 5, experimentation_level: 1, initiative_level: 1, change_appetite: 1, collaboration_preference: 4, autonomy_level: 1, risk_tolerance: 1, data_literacy: 1, feedback_receptivity: 2, learning_style: "discussing", preferred_format: "groupe" } },
  { id: "leader", label: "💎 Le Leader Transformationnel", desc: "Voit l'IA comme levier stratégique, porte la vision", traits: { digital_maturity: 4, ai_apprehension: 1, experimentation_level: 4, initiative_level: 5, change_appetite: 5, collaboration_preference: 5, autonomy_level: 4, risk_tolerance: 4, data_literacy: 4, feedback_receptivity: 5, learning_style: "visual", preferred_format: "coaching" } },
  { id: "constrained", label: "⏳ Le Professionnel sous Contrainte", desc: "Pas le temps, surchargé, veut de l'immédiat et du concret", traits: { digital_maturity: 2, ai_apprehension: 3, experimentation_level: 2, initiative_level: 3, change_appetite: 3, collaboration_preference: 2, autonomy_level: 3, risk_tolerance: 2, data_literacy: 2, feedback_receptivity: 3, learning_style: "doing", preferred_format: "guidé" } },
];

function GuidedPersonaMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [traits, setTraits] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelect = (id: string) => { setSelected(id); setTraits({ ...archetypes.find(a => a.id === id)!.traits }); };

  const handleGenerate = async () => {
    if (!selected || !traits) return;
    setIsGenerating(true);
    try {
      const arch = archetypes.find(a => a.id === selected)!;
      const traitLines = traitLabels.map(t => `- ${t.label} : ${traits[t.key]}/5`).join("\n");
      const brief = `Archétype : ${arch.label}\nDescription : ${arch.desc}\nTraits :\n${traitLines}\n- Style : ${traits.learning_style}\n- Format : ${traits.preferred_format}\n\nCrée un persona COMPORTEMENTAL corporate. Nom professionnel (pas familier). Inclus habitudes, objections, déclencheurs, journée type, approche coaching.`;
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-persona", brief, mode: "guided" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona "${data.persona.name}" créé !`);
      onSuccess();
    } catch (e: any) { toast.error(e.message || "Erreur"); } finally { setIsGenerating(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="px-6 py-4 space-y-4 max-h-[500px] overflow-y-auto">
        {!customizing ? (
          <>
            <p className="text-xs text-muted-foreground">Choisissez un archétype comportemental comme point de départ :</p>
            <div className="grid grid-cols-2 gap-3">
              {archetypes.map(a => (
                <button key={a.id} onClick={() => handleSelect(a.id)} className={cn("p-4 rounded-xl border text-left transition-all", selected === a.id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/30")}>
                  <p className="font-semibold text-sm">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{a.desc}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ajustez les 10 traits</p>
            {traitLabels.map(t => (
              <div key={t.key} className="space-y-0.5">
                <div className="flex items-center justify-between"><Label className="text-[11px]">{t.label}</Label><span className="text-[11px] font-semibold">{traits[t.key]}/5</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-14">{t.low}</span>
                  <Slider value={[traits[t.key]]} onValueChange={([v]) => setTraits({ ...traits, [t.key]: v })} min={1} max={5} step={1} className="flex-1" />
                  <span className="text-[9px] text-muted-foreground w-16 text-right">{t.high}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={customizing ? () => setCustomizing(false) : onBack} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> {customizing ? "Archétypes" : "Retour"}</Button>
        {!customizing ? (
          <div className="flex gap-2">
            {selected && <Button variant="outline" size="sm" onClick={() => setCustomizing(true)}>Personnaliser</Button>}
            <Button size="sm" onClick={handleGenerate} disabled={!selected || isGenerating} className="gap-1.5 min-w-[160px]">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Générer le persona</>}</Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-1.5 min-w-[160px]">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Générer</>}</Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Corporate Mode ──────────────────────────────────────────────────

function CorporatePersonaMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-persona", brief: `Crée un persona COMPORTEMENTAL corporate :\n\n${brief.trim()}\n\nFocus : 10 traits numériques, habitudes, objections, déclencheurs, journée type, approche coaching. Nom professionnel.`, mode: "corporate" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Persona "${data.persona.name}" créé !`);
      onSuccess();
    } catch (e: any) { toast.error(e.message || "Erreur"); } finally { setIsGenerating(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <div className="px-6 py-6 space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border space-y-2">
          <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">Brief Comportemental</span></div>
          <p className="text-xs text-muted-foreground">Décrivez les comportements observés. L'IA créera un profil comportemental structuré avec 10 traits, des tags et des textes de contexte.</p>
        </div>
        <Textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder={`Exemple :\n\nDans notre direction commerciale, on observe un groupe de managers (40-50 ans) qui :\n- Utilisent encore Excel pour tout\n- Sont compétents mais méfiants envers l'IA\n- Disent "ça ne marchera jamais pour notre métier"\n- Préfèrent les formations en présentiel avec des cas concrets`} className="min-h-[260px] resize-y text-sm" disabled={isGenerating} />
      </div>
      <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Retour</Button>
        <Button size="sm" onClick={handleGenerate} disabled={brief.trim().length < 30 || isGenerating} className="gap-1.5 min-w-[160px]">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" /> Analyser et créer</>}</Button>
      </div>
    </motion.div>
  );
}

// ─── Chat Mode ───────────────────────────────────────────────────────

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }

function ChatPersonaMode({ userId, onSuccess, onBack }: { userId: string; onSuccess: () => void; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    id: "welcome", role: "assistant",
    content: `👋 Bonjour ! Je vais vous aider à définir un **persona comportemental corporate**.\n\nUn persona, ce n'est pas un poste — c'est un **profil d'apprentissage** :\n- Comment réagit-il face à la nouveauté ?\n- Quel est son rapport au digital et à l'IA ?\n- Qu'est-ce qui le motive ou le freine ?\n\nDécrivez-moi les **comportements** que vous observez. 🎯`
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
          practice_id: "__persona_chat__",
          messages: allMsgs.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content })),
          evaluate: false,
          system_override: `Tu es un expert en psychologie organisationnelle et en adoption de l'IA.
Tu aides à créer des PERSONAE COMPORTEMENTAUX CORPORATE (pas des fiches de poste).
Pose des questions sur : maturité digitale, appréhension IA, style d'apprentissage, habitudes, objections, déclencheurs.
Après 3-4 échanges, propose un profil structuré. Si validé, réponds avec :
\`\`\`persona_brief
[description comportementale complète avec traits, habitudes, objections, déclencheurs]
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

      const briefMatch = content.match(/```persona_brief\s*\n?([\s\S]*?)```/);
      if (briefMatch) {
        const { data, error } = await supabase.functions.invoke("academy-generate", { body: { action: "generate-persona", brief: `Crée un persona COMPORTEMENTAL corporate :\n\n${briefMatch[1].trim()}`, mode: "chat" } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Persona "${data.persona.name}" créé !`);
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
              {m.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div> : m.content}
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
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Décrivez les comportements observés..." className="flex-1" disabled={isStreaming} />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </motion.div>
  );
}
