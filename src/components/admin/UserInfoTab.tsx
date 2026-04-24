import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Save, Plus, X, User, Briefcase, Globe,
  Target, Heart, ShieldAlert, Trash2,
} from "lucide-react";
import type { AdminUserDetail } from "@/hooks/useAdminUserDetail";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useDeleteUser, type DeleteMode } from "@/hooks/useDeleteUser";

interface Props {
  profile: AdminUserDetail;
  onSave: (updates: Record<string, any>) => Promise<void>;
  saving: boolean;
}

const HIERARCHY_LEVELS = ["Direction générale", "Directeur", "Responsable", "Manager", "Chef de projet", "Expert / Consultant", "Collaborateur", "Stagiaire / Alternant"];

export function UserInfoTab({ profile, onSave, saving }: Props) {
  const navigate = useNavigate();
  const { isAdmin: isSuperAdmin } = useAdminRole();
  const deleteUser = useDeleteUser();
  const [allUsers, setAllUsers] = useState<{ user_id: string; display_name: string | null }[]>([]);

  // Danger zone state
  const [dangerOpen, setDangerOpen] = useState(false);
  const [dangerStep, setDangerStep] = useState<1 | 2>(1);
  const [dangerMode, setDangerMode] = useState<DeleteMode>("anonymize");
  const [emailConfirm, setEmailConfirm] = useState("");

  const expectedEmail = (profile.email || "").trim().toLowerCase();
  const canConfirmDelete =
    !!expectedEmail && emailConfirm.trim().toLowerCase() === expectedEmail;

  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    email: (profile as any).email || "",
    phone: (profile as any).phone || "",
    job_title: (profile as any).job_title || "",
    department: (profile as any).department || "",
    service: (profile as any).service || "",
    pole: (profile as any).pole || "",
    hierarchy_level: (profile as any).hierarchy_level || "",
    manager_user_id: (profile as any).manager_user_id || "",
    manager_name: (profile as any).manager_name || "",
    bio: (profile as any).bio || "",
    linkedin_url: (profile as any).linkedin_url || "",
    location: (profile as any).location || "",
  });
  const [interests, setInterests] = useState<string[]>(
    Array.isArray((profile as any).interests) ? (profile as any).interests : []
  );
  const [objectives, setObjectives] = useState<string[]>(
    Array.isArray((profile as any).objectives) ? (profile as any).objectives : []
  );
  const [newInterest, setNewInterest] = useState("");
  const [newObjective, setNewObjective] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, display_name")
      .neq("user_id", profile.user_id)
      .order("display_name")
      .then(({ data }) => setAllUsers(data || []));
  }, [profile.user_id]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () =>
    onSave({
      ...form,
      display_name: form.display_name || null,
      email: form.email || null,
      phone: form.phone || null,
      job_title: form.job_title || null,
      department: form.department || null,
      service: form.service || null,
      pole: form.pole || null,
      hierarchy_level: form.hierarchy_level || null,
      manager_user_id: form.manager_user_id || null,
      manager_name: form.manager_name || null,
      bio: form.bio || null,
      linkedin_url: form.linkedin_url || null,
      location: form.location || null,
      interests,
      objectives,
    });

  return (
    <div className="space-y-6">
      {/* Identité */}
      <Section title="Identité" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom complet" value={form.display_name} onChange={(v) => set("display_name", v)} />
          <Field label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="utilisateur@email.com" />
          <Field label="Téléphone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+33 6 XX XX XX XX" />
          <Field label="Localisation" value={form.location} onChange={(v) => set("location", v)} placeholder="Paris, France" />
          <Field label="LinkedIn" value={form.linkedin_url} onChange={(v) => set("linkedin_url", v)} placeholder="https://linkedin.com/in/..." />
          <div className="md:col-span-2 space-y-2">
            <Label className="text-xs">Bio / Présentation</Label>
            <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Courte présentation…" className="min-h-[80px] text-sm" />
          </div>
        </div>
      </Section>

      {/* Poste & organisation */}
      <Section title="Poste & organisation" icon={Briefcase}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Fonction / Poste" value={form.job_title} onChange={(v) => set("job_title", v)} placeholder="Directeur de l'innovation" />
          <Field label="Pôle" value={form.pole} onChange={(v) => set("pole", v)} placeholder="Ex: Innovation" />
          <Field label="Direction" value={form.department} onChange={(v) => set("department", v)} placeholder="Ex: Direction Stratégie" />
          <Field label="Service" value={form.service} onChange={(v) => set("service", v)} placeholder="Ex: Transformation digitale" />
          <div className="space-y-2">
            <Label className="text-xs">Niveau hiérarchique</Label>
            <Select value={form.hierarchy_level || "__none__"} onValueChange={(v) => set("hierarchy_level", v === "__none__" ? "" : v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Non défini</SelectItem>
                {HIERARCHY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Manager direct</Label>
            <Select value={form.manager_user_id || "__none__"} onValueChange={(v) => set("manager_user_id", v === "__none__" ? "" : v)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun</SelectItem>
                {allUsers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.display_name || u.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={form.manager_name} onChange={(e) => set("manager_name", e.target.value)} placeholder="Ou saisie libre : Nom du manager" className="text-sm mt-1" />
          </div>
        </div>
      </Section>

      {/* Intérêts */}
      <Section title="Centres d'intérêt" icon={Heart}>
        <div className="flex flex-wrap gap-2 mb-3">
          {interests.map((item, i) => (
            <Badge key={i} variant="secondary" className="gap-1 text-xs">
              {item}
              <button onClick={() => setInterests((arr) => arr.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {interests.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun intérêt renseigné</p>}
        </div>
        <div className="flex gap-2">
          <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Ajouter un intérêt…" className="text-sm max-w-xs"
            onKeyDown={(e) => { if (e.key === "Enter" && newInterest.trim()) { setInterests((a) => [...a, newInterest.trim()]); setNewInterest(""); } }}
          />
          <Button variant="outline" size="sm" onClick={() => { if (newInterest.trim()) { setInterests((a) => [...a, newInterest.trim()]); setNewInterest(""); } }} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Ajouter
          </Button>
        </div>
      </Section>

      {/* Objectifs */}
      <Section title="Objectifs" icon={Target}>
        <div className="flex flex-wrap gap-2 mb-3">
          {objectives.map((item, i) => (
            <Badge key={i} variant="outline" className="gap-1 text-xs bg-primary/5 text-primary border-primary/20">
              {item}
              <button onClick={() => setObjectives((arr) => arr.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          {objectives.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun objectif renseigné</p>}
        </div>
        <div className="flex gap-2">
          <Input value={newObjective} onChange={(e) => setNewObjective(e.target.value)} placeholder="Ajouter un objectif…" className="text-sm max-w-xs"
            onKeyDown={(e) => { if (e.key === "Enter" && newObjective.trim()) { setObjectives((a) => [...a, newObjective.trim()]); setNewObjective(""); } }}
          />
          <Button variant="outline" size="sm" onClick={() => { if (newObjective.trim()) { setObjectives((a) => [...a, newObjective.trim()]); setNewObjective(""); } }} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Ajouter
          </Button>
        </div>
      </Section>

      {/* Metadata */}
      <Section title="Métadonnées" icon={Globe}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">User ID</p>
            <p className="font-mono text-xs text-foreground break-all">{profile.user_id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inscription</p>
            <p className="text-foreground">{new Date(profile.created_at).toLocaleDateString("fr-FR")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">XP</p>
            <p className="text-foreground font-mono">{profile.xp}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Statut</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={
                profile.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                : profile.status === "suspended" ? "bg-red-500/10 text-red-600 border-red-500/30 text-xs"
                : "text-xs"
              }>
                {profile.status === "active" ? "Actif" : profile.status === "suspended" ? "Suspendu" : profile.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px]"
                onClick={() => onSave({ status: profile.status === "active" ? "suspended" : "active" })}
                disabled={saving}
              >
                {profile.status === "active" ? "Suspendre" : "Réactiver"}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer toutes les modifications
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
