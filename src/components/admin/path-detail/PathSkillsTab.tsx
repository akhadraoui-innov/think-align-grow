import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, Star, Plus, X, Save, Pencil, Loader2,
  Target, Briefcase, BookOpen, Layers, Users, Dumbbell,
  Award, Link2, GraduationCap, Lightbulb, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Skill {
  name: string;
  category: "technique" | "transversale" | "métier";
  level: number;
}

interface PathSkillsTabProps {
  path: any;
  id: string;
}

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
  technique: { label: "Technique", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", icon: Layers },
  transversale: { label: "Transversale", color: "text-purple-600 bg-purple-500/10 border-purple-500/20", icon: Users },
  métier: { label: "Métier", color: "text-amber-600 bg-amber-500/10 border-amber-500/20", icon: Briefcase },
};

function StarRating({ level, onChange }: { level: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)} disabled={!onChange}
          className={onChange ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}>
          <Star className={`h-3.5 w-3.5 ${i <= level ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export function PathSkillsTab({ path, id }: PathSkillsTabProps) {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [aptitudes, setAptitudes] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillCat, setNewSkillCat] = useState<"technique" | "transversale" | "métier">("technique");
  const [newPrereq, setNewPrereq] = useState("");
  const [newAptitude, setNewAptitude] = useState("");
  const [newOutcome, setNewOutcome] = useState("");

  const pathSkills: Skill[] = Array.isArray(path.skills) ? path.skills : [];
  const pathPrereqs: string[] = Array.isArray(path.prerequisites) ? path.prerequisites : [];
  const pathAptitudes: string[] = Array.isArray(path.aptitudes) ? path.aptitudes : [];
  const pathOutcomes: string[] = Array.isArray(path.professional_outcomes) ? path.professional_outcomes : [];

  // Related practices
  const { data: relatedPractices = [] } = useQuery({
    queryKey: ["path-related-practices", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: pms } = await supabase.from("academy_path_modules").select("module_id").eq("path_id", id);
      if (!pms?.length) return [];
      const moduleIds = pms.map(pm => pm.module_id);
      const { data } = await supabase.from("academy_practices").select("id, title, practice_type, difficulty").in("module_id", moduleIds);
      return data || [];
    },
  });

  // Related paths (same tags or function)
  const { data: relatedPaths = [] } = useQuery({
    queryKey: ["path-related-paths", id, path.function_id],
    enabled: !!id,
    queryFn: async () => {
      let q = supabase.from("academy_paths").select("id, name, difficulty, status").neq("id", id).eq("status", "published").limit(5);
      if (path.function_id) q = q.eq("function_id", path.function_id);
      const { data } = await q;
      return data || [];
    },
  });

  const startEditing = () => {
    setSkills([...pathSkills]);
    setPrerequisites([...pathPrereqs]);
    setAptitudes([...pathAptitudes]);
    setOutcomes([...pathOutcomes]);
    setIsEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_paths").update({
        skills: skills as any,
        prerequisites: prerequisites as any,
        aptitudes: aptitudes as any,
        professional_outcomes: outcomes as any,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-academy-path", id] });
      toast.success("Compétences mises à jour");
      setIsEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { name: newSkill.trim(), category: newSkillCat, level: 3 }]);
      setNewSkill("");
    }
  };

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  // ── READ MODE ──
  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Compétences & Aptitudes
          </h2>
          <Button size="sm" variant="outline" onClick={startEditing} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Button>
        </div>

        {/* Compétences */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Compétences développées</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">{pathSkills.length}</Badge>
          </div>
          <div className="p-5">
            {pathSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 italic">Aucune compétence définie</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pathSkills.map((skill, i) => {
                  const cat = categoryConfig[skill.category] || categoryConfig.technique;
                  const CatIcon = cat.icon;
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cat.color}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80">
                        <CatIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{skill.name}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.label}</p>
                      </div>
                      <StarRating level={skill.level} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Prérequis */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Prérequis</h3>
          </div>
          <div className="p-5">
            {pathPrereqs.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 italic">Aucun prérequis</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pathPrereqs.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-3 py-1.5 gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aptitudes */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Aptitudes professionnelles</h3>
          </div>
          <div className="p-5">
            {pathAptitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 italic">Aucune aptitude définie</p>
            ) : (
              <ul className="space-y-2">
                {pathAptitudes.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Débouchés professionnels */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Débouchés professionnels</h3>
          </div>
          <div className="p-5">
            {pathOutcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 italic">Aucun débouché défini</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pathOutcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-sm">{o}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ressources liées */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Ressources liées</h3>
          </div>
          <div className="p-5 space-y-4">
            {relatedPractices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pratiques IA ({relatedPractices.length})</p>
                <div className="flex flex-wrap gap-2">
                  {relatedPractices.map((p: any) => (
                    <Badge key={p.id} variant="secondary" className="text-xs gap-1">
                      <Dumbbell className="h-3 w-3" /> {p.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {relatedPaths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parcours liés ({relatedPaths.length})</p>
                <div className="flex flex-wrap gap-2">
                  {relatedPaths.map((p: any) => (
                    <Badge key={p.id} variant="outline" className="text-xs gap-1">
                      <Award className="h-3 w-3" /> {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {relatedPractices.length === 0 && relatedPaths.length === 0 && (
              <p className="text-sm text-muted-foreground/50 italic">Aucune ressource liée trouvée</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT MODE ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Modification des compétences
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Skills editor */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Compétences</h3>
        </div>
        <div className="p-5 space-y-3">
          {skills.map((skill, i) => {
            const cat = categoryConfig[skill.category] || categoryConfig.technique;
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <Badge variant="outline" className="text-[10px] shrink-0">{cat.label}</Badge>
                <span className="text-sm flex-1">{skill.name}</span>
                <StarRating level={skill.level} onChange={(v) => {
                  const updated = [...skills];
                  updated[i] = { ...updated[i], level: v };
                  setSkills(updated);
                }} />
                <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <div className="flex gap-2">
            <select value={newSkillCat} onChange={e => setNewSkillCat(e.target.value as any)} className="h-8 text-xs border rounded px-2 bg-background">
              <option value="technique">Technique</option>
              <option value="transversale">Transversale</option>
              <option value="métier">Métier</option>
            </select>
            <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Nouvelle compétence…" className="h-8 text-xs flex-1"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
            <Button type="button" size="sm" variant="outline" onClick={addSkill} className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Prerequisites editor */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Prérequis</h3>
        </div>
        <div className="p-5 space-y-2">
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                {p}
                <button onClick={() => setPrerequisites(prerequisites.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newPrereq} onChange={e => setNewPrereq(e.target.value)} placeholder="Nouveau prérequis…" className="h-8 text-xs flex-1"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(prerequisites, setPrerequisites, newPrereq, setNewPrereq); } }} />
            <Button type="button" size="sm" variant="outline" onClick={() => addItem(prerequisites, setPrerequisites, newPrereq, setNewPrereq)} className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Aptitudes editor */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Aptitudes professionnelles</h3>
        </div>
        <div className="p-5 space-y-2">
          {aptitudes.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{a}</span>
              <button onClick={() => setAptitudes(aptitudes.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newAptitude} onChange={e => setNewAptitude(e.target.value)} placeholder="Nouvelle aptitude…" className="h-8 text-xs flex-1"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(aptitudes, setAptitudes, newAptitude, setNewAptitude); } }} />
            <Button type="button" size="sm" variant="outline" onClick={() => addItem(aptitudes, setAptitudes, newAptitude, setNewAptitude)} className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Outcomes editor */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Débouchés professionnels</h3>
        </div>
        <div className="p-5 space-y-2">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{o}</span>
              <button onClick={() => setOutcomes(outcomes.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newOutcome} onChange={e => setNewOutcome(e.target.value)} placeholder="Nouveau débouché…" className="h-8 text-xs flex-1"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(outcomes, setOutcomes, newOutcome, setNewOutcome); } }} />
            <Button type="button" size="sm" variant="outline" onClick={() => addItem(outcomes, setOutcomes, newOutcome, setNewOutcome)} className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
