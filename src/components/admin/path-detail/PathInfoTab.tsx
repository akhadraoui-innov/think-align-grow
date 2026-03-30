import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, Save, Loader2, FileText, Settings, Target,
  Award, Database, X, Tag, CheckCircle2, Building2, Users, GraduationCap,
  Sparkles, BookOpen, Briefcase, Lightbulb
} from "lucide-react";
import { VersionHistory } from "@/components/admin/VersionHistory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PathInfoTabProps {
  path: any;
  id: string;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  infoForm: any;
  setInfoForm: (v: any) => void;
  updatePathInfo: { mutate: (vars: any, opts?: any) => void; isPending: boolean };
  personae: any[];
  functions: any[];
  organizations: any[];
  tagInput: string;
  setTagInput: (v: string) => void;
  initInfoForm: (p: any) => any;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

export function PathInfoTab({
  path, id, isEditing, setIsEditing, infoForm, setInfoForm,
  updatePathInfo, personae, functions, organizations,
  tagInput, setTagInput, initInfoForm,
}: PathInfoTabProps) {
  const funcData = (path as any).academy_functions;
  const personaData = (path as any).academy_personae;
  const orgData = (path as any).organizations;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {isEditing ? "Modification en cours" : "Informations du parcours"}
        </h2>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => { if (path && !infoForm) setInfoForm(initInfoForm(path)); setIsEditing(true); }} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setInfoForm(initInfoForm(path)); setIsEditing(false); }}>Annuler</Button>
            <Button size="sm" onClick={() => updatePathInfo.mutate(undefined, { onSuccess: () => setIsEditing(false) })} disabled={updatePathInfo.isPending} className="gap-1.5">
              {updatePathInfo.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* ── READ MODE ── */}
      {!isEditing && (
        <>
          {/* Section A — Identité */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Identité</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                <div className="md:col-span-2">
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Nom</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{path.name}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Difficulté</span>
                  <p className="text-sm text-foreground mt-1">{difficultyLabels[path.difficulty] || path.difficulty || "—"}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Statut</span>
                  <Badge variant={path.status === "published" ? "default" : "secondary"} className="text-xs mt-1">{path.status}</Badge>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Durée estimée</span>
                  <p className="text-sm text-foreground mt-1">{path.estimated_hours || 0}h</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Mode</span>
                  <p className="text-sm text-foreground mt-1">{path.generation_mode || "manual"}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(path.tags) && path.tags.length > 0 ? path.tags.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    )) : <span className="text-xs text-muted-foreground/50">Aucun tag</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B — Ciblage */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Ciblage</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Fonction</span>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    {funcData ? (
                      <><Target className="h-3.5 w-3.5 text-primary" /> {funcData.name}{funcData.department ? ` (${funcData.department})` : ""}</>
                    ) : <span className="text-muted-foreground/50">Non définie</span>}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Persona</span>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    {personaData ? (
                      <><Users className="h-3.5 w-3.5 text-primary" /> {personaData.name}</>
                    ) : <span className="text-muted-foreground/50">Non défini</span>}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Organisation</span>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    {orgData ? (
                      <><Building2 className="h-3.5 w-3.5 text-primary" /> {orgData.name}</>
                    ) : <span className="text-muted-foreground/50">Global</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section C — Description */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Description</h3>
            </div>
            <div className="p-5">
              {path.description ? (
                <div className="rounded-lg bg-muted/20 p-4">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{path.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Aucune description</p>
              )}
            </div>
          </div>

          {/* Section D — Compétences clés (read-only summary) */}
          {Array.isArray(path.skills) && path.skills.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground tracking-tight">Compétences clés</h3>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(path.skills as any[]).slice(0, 8).map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs px-2.5 py-1 gap-1">
                      <Sparkles className="h-3 w-3 text-primary" /> {s.name}
                    </Badge>
                  ))}
                  {(path.skills as any[]).length > 8 && (
                    <Badge variant="secondary" className="text-[10px]">+{(path.skills as any[]).length - 8}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section E — Prérequis */}
          {Array.isArray(path.prerequisites) && path.prerequisites.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground tracking-tight">Prérequis</h3>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(path.prerequisites as string[]).map((p: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section F — Débouchés */}
          {Array.isArray(path.professional_outcomes) && path.professional_outcomes.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground tracking-tight">Débouchés professionnels</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(path.professional_outcomes as string[]).map((o: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/20">
                      <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section G — Options */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Options</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                {path.certificate_enabled ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="font-medium">Certificat activé</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <X className="h-3.5 w-3.5" />
                    </div>
                    <span>Certificat désactivé</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section E — Métadonnées */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
              <Database className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground tracking-tight">Métadonnées</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">ID</span>
                  <p className="font-mono text-xs text-foreground mt-1">{path.id}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Créé le</span>
                  <p className="text-xs text-foreground mt-1">{format(new Date(path.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Mis à jour</span>
                  <p className="text-xs text-foreground mt-1">{format(new Date(path.updated_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Créé par</span>
                  <p className="font-mono text-xs text-foreground mt-1">{path.created_by?.slice(0, 8)}…</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section F — Historique */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="p-5">
              <VersionHistory assetType="path" assetId={id} />
            </div>
          </div>
        </>
      )}

      {/* ── EDIT MODE ── */}
      {isEditing && infoForm && (() => {
        const set = (key: string, value: any) => setInfoForm((f: any) => ({ ...f, [key]: value }));
        const addTag = () => {
          const t = tagInput.trim();
          if (t && !infoForm.tags.includes(t)) {
            set("tags", [...infoForm.tags, t]);
            setTagInput("");
          }
        };
        const removeTag = (tag: string) => set("tags", infoForm.tags.filter((t: string) => t !== tag));

        return (
          <>
            {/* Section A — Identité */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Identité</h3>
                  <p className="text-[11px] text-muted-foreground/60">Informations principales du parcours</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Nom du parcours</Label>
                    <Input value={infoForm.name} onChange={e => set("name", e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Difficulté</Label>
                    <Select value={infoForm.difficulty} onValueChange={v => set("difficulty", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Débutant</SelectItem>
                        <SelectItem value="intermediate">Intermédiaire</SelectItem>
                        <SelectItem value="advanced">Avancé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Statut</Label>
                    <Select value={infoForm.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Durée estimée (heures)</Label>
                    <Input type="number" min={0} value={infoForm.estimated_hours} onChange={e => set("estimated_hours", Number(e.target.value))} className="h-9" />
                  </div>
                </div>
                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {infoForm.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Ajouter un tag…" className="h-8 text-xs flex-1"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                    <Button type="button" size="sm" variant="outline" onClick={addTag} className="h-8 px-3 text-xs"><Tag className="h-3 w-3 mr-1" /> Ajouter</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B — Ciblage */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Ciblage</h3>
                  <p className="text-[11px] text-muted-foreground/60">Fonction, persona et organisation</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fonction cible</Label>
                    <Select value={infoForm.function_id || "none"} onValueChange={v => set("function_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Aucune" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        {functions.map((f: any) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}{f.department ? ` (${f.department})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Persona cible</Label>
                    <Select value={infoForm.persona_id || "none"} onValueChange={v => set("persona_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {personae.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Organisation</Label>
                    <Select value={infoForm.organization_id || "none"} onValueChange={v => set("organization_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Aucune" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune (global)</SelectItem>
                        {organizations.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section C — Description */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Description</h3>
                  <p className="text-[11px] text-muted-foreground/60">Objectifs et contenu du parcours</p>
                </div>
              </div>
              <div className="p-5">
                <Textarea value={infoForm.description} onChange={e => set("description", e.target.value)} rows={4} className="resize-none" placeholder="Description détaillée du parcours..." />
              </div>
            </div>

            {/* Section D — Options */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-muted/20 border-b border-border/30 flex items-center gap-2.5">
                <Award className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Options</h3>
                  <p className="text-[11px] text-muted-foreground/60">Certification et paramètres</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Certificat activé</Label>
                    <p className="text-[11px] text-muted-foreground">Délivre un certificat à la complétion du parcours</p>
                  </div>
                  <Switch checked={infoForm.certificate_enabled} onCheckedChange={v => set("certificate_enabled", v)} />
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
