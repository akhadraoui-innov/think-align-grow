import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Save, Users, UsersRound, Presentation, Layers, CreditCard,
  Trash2, Copy, Plus, X, Building2, MapPin, Phone, Mail, Globe, FileText,
  UserCircle, Crown, Target,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Address {
  label: string;   // "Siège social", "Site de production", …
  street: string;
  city: string;
  zip: string;
  country: string;
}

interface Contact {
  name: string;
  role: string;       // Poste
  email: string;
  phone: string;
  decision_level: string; // "Décideur", "Prescripteur", "Influenceur", "Utilisateur"
  department: string;     // Direction, Service
  notes: string;
}

interface OrgStats {
  memberCount: number;
  teamCount: number;
  workshopCount: number;
  toolkitCount: number;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  sector?: string | null;
  group_name?: string | null;
  parent_organization_id?: string | null;
  siret?: string | null;
  tva_number?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  addresses?: Address[] | null;
  contacts?: Contact[] | null;
  notes?: string | null;
  is_platform_owner?: boolean;
}

interface Props {
  organization: Organization;
  stats: OrgStats;
}

const DECISION_LEVELS = ["Décideur", "Prescripteur", "Influenceur", "Utilisateur", "Sponsor"];
const ADDRESS_LABELS = ["Siège social", "Site de production", "Bureau commercial", "Autre"];

const emptyAddress = (): Address => ({ label: "Siège social", street: "", city: "", zip: "", country: "France" });
const emptyContact = (): Contact => ({ name: "", role: "", email: "", phone: "", decision_level: "Utilisateur", department: "", notes: "" });

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrgInfoTab({ organization, stats }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const permissions = usePermissions();
  const [saving, setSaving] = useState(false);
  const [allOrgs, setAllOrgs] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: organization.name,
    slug: organization.slug,
    primary_color: organization.primary_color || "#E8552D",
    logo_url: organization.logo_url || "",
    sector: (organization as any).sector || "",
    group_name: (organization as any).group_name || "",
    parent_organization_id: (organization as any).parent_organization_id || "",
    siret: (organization as any).siret || "",
    tva_number: (organization as any).tva_number || "",
    website: (organization as any).website || "",
    email: (organization as any).email || "",
    phone: (organization as any).phone || "",
    notes: (organization as any).notes || "",
  });

  const [addresses, setAddresses] = useState<Address[]>(
    Array.isArray((organization as any).addresses) && (organization as any).addresses.length > 0
      ? (organization as any).addresses
      : [emptyAddress()]
  );

  const [contacts, setContacts] = useState<Contact[]>(
    Array.isArray((organization as any).contacts) && (organization as any).contacts.length > 0
      ? (organization as any).contacts
      : []
  );

  // Fetch all orgs for parent picker (excluding self)
  useEffect(() => {
    supabase
      .from("organizations")
      .select("id, name")
      .neq("id", organization.id)
      .order("name")
      .then(({ data }) => setAllOrgs(data || []));
  }, [organization.id]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  /* ---- Save ---- */
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.name,
        slug: form.slug,
        primary_color: form.primary_color,
        logo_url: form.logo_url || null,
        sector: form.sector || null,
        group_name: form.group_name || null,
        parent_organization_id: form.parent_organization_id || null,
        siret: form.siret || null,
        tva_number: form.tva_number || null,
        website: form.website || null,
        email: form.email || null,
        phone: form.phone || null,
        addresses: addresses as any,
        contacts: contacts as any,
        notes: form.notes || null,
      } as any)
      .eq("id", organization.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organisation mise à jour" });
      qc.invalidateQueries({ queryKey: ["admin-organization", organization.id] });
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(organization.id);
    toast({ title: "ID copié" });
  };

  const parentOrg = allOrgs.find((o) => o.id === form.parent_organization_id);

  const statusLabel = stats.subscriptionStatus === "active" ? "Actif" : stats.subscriptionStatus === "trial" ? "Essai" : stats.subscriptionStatus || "Aucun";
  const statusColor = stats.subscriptionStatus === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : stats.subscriptionStatus === "trial" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted text-muted-foreground border-border";
  const createdAgo = formatDistanceToNow(new Date(organization.created_at), { addSuffix: true, locale: fr });

  /* ---- Helpers for addresses / contacts ---- */
  const updateAddress = (i: number, key: keyof Address, val: string) =>
    setAddresses((a) => a.map((addr, j) => (j === i ? { ...addr, [key]: val } : addr)));
  const removeAddress = (i: number) => setAddresses((a) => a.filter((_, j) => j !== i));

  const updateContact = (i: number, key: keyof Contact, val: string) =>
    setContacts((c) => c.map((ct, j) => (j === i ? { ...ct, [key]: val } : ct)));
  const removeContact = (i: number) => setContacts((c) => c.filter((_, j) => j !== i));

  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ---- Quick stats ---- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Membres", value: stats.memberCount, color: "text-blue-500" },
          { icon: UsersRound, label: "Équipes", value: stats.teamCount, color: "text-violet-500" },
          { icon: Presentation, label: "Workshops", value: stats.workshopCount, color: "text-orange-500" },
          { icon: Layers, label: "Toolkits", value: stats.toolkitCount, color: "text-emerald-500" },
          { icon: CreditCard, label: "Plan", value: stats.subscriptionPlan || "—", color: "text-primary", isBadge: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
            </div>
            {(s as any).isBadge ? (
              <Badge variant="outline" className={`w-fit text-xs mt-1 ${statusColor}`}>{typeof s.value === "string" ? s.value : statusLabel}</Badge>
            ) : (
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ---- Branding preview ---- */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Aperçu du branding</h3>
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: form.primary_color }}>
            {form.logo_url ? <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-xl object-contain" /> : form.name[0]?.toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground">{form.name}</p>
            <p className="text-sm text-muted-foreground">/{form.slug}</p>
            {form.sector && <Badge variant="secondary" className="text-[10px]">{form.sector}</Badge>}
            {(organization as any).is_platform_owner && (
              <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30" variant="outline">🏢 Éditeur SaaS</Badge>
            )}
          </div>
          <div className="ml-auto hidden md:flex flex-col gap-1">
            <div className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: form.primary_color }}>Bouton primaire</div>
            <div className="rounded-lg px-4 py-2 text-sm font-medium border" style={{ borderColor: form.primary_color, color: form.primary_color }}>Bouton secondaire</div>
          </div>
        </div>
      </div>

      {/* ---- Identité & branding ---- */}
      <Section title="Identité & branding" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de l'organisation" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="Slug (URL)" value={form.slug} onChange={(v) => set("slug", v)} />
          <div className="space-y-2">
            <Label className="text-xs">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-9 w-9 rounded-lg border border-border cursor-pointer" />
              <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="flex-1" />
            </div>
          </div>
          <Field label="URL du logo" value={form.logo_url} onChange={(v) => set("logo_url", v)} placeholder="https://..." />
        </div>
      </Section>

      {/* ---- Informations légales ---- */}
      <Section title="Informations légales" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="SIRET" value={form.siret} onChange={(v) => set("siret", v)} placeholder="XXX XXX XXX XXXXX" />
          <Field label="N° TVA intracommunautaire" value={form.tva_number} onChange={(v) => set("tva_number", v)} placeholder="FR XX XXX XXX XXX" />
          <Field label="Secteur d'activité" value={form.sector} onChange={(v) => set("sector", v)} placeholder="Ex: Tech, Industrie, Santé…" />
        </div>
      </Section>

      {/* ---- Structure (groupe / filiale) ---- */}
      <Section title="Structure & groupe" icon={Crown}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom du groupe" value={form.group_name} onChange={(v) => set("group_name", v)} placeholder="Ex: Groupe Bouygues" />
          <div className="space-y-2">
            <Label className="text-xs">Filiale de (organisation parente)</Label>
            <Select value={form.parent_organization_id || "__none__"} onValueChange={(v) => set("parent_organization_id", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucune (organisation racine)</SelectItem>
                {allOrgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ---- Coordonnées ---- */}
      <Section title="Coordonnées" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="contact@entreprise.com" />
          <Field label="Téléphone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+33 1 XX XX XX XX" />
          <Field label="Site web" value={form.website} onChange={(v) => set("website", v)} placeholder="https://…" />
        </div>
      </Section>

      {/* ---- Adresses ---- */}
      <Section title="Adresses" icon={MapPin}>
        <div className="space-y-4">
          {addresses.map((addr, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <Select value={addr.label} onValueChange={(v) => updateAddress(i, "label", v)}>
                  <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ADDRESS_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                {addresses.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeAddress(i)}><X className="h-3.5 w-3.5" /></Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input value={addr.street} onChange={(e) => updateAddress(i, "street", e.target.value)} placeholder="Rue" className="text-sm" />
                <div className="flex gap-2">
                  <Input value={addr.zip} onChange={(e) => updateAddress(i, "zip", e.target.value)} placeholder="CP" className="text-sm w-24" />
                  <Input value={addr.city} onChange={(e) => updateAddress(i, "city", e.target.value)} placeholder="Ville" className="text-sm flex-1" />
                </div>
              </div>
              <Input value={addr.country} onChange={(e) => updateAddress(i, "country", e.target.value)} placeholder="Pays" className="text-sm md:w-1/2" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setAddresses((a) => [...a, emptyAddress()])}>
            <Plus className="h-3.5 w-3.5" /> Ajouter une adresse
          </Button>
        </div>
      </Section>

      {/* ---- Contacts & mapping décisionnel ---- */}
      <Section title="Contacts & mapping décisionnel" icon={UserCircle}>
        <div className="space-y-4">
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Aucun contact renseigné.</p>
          )}
          {contacts.map((ct, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <Select value={ct.decision_level} onValueChange={(v) => updateContact(i, "decision_level", v)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DECISION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeContact(i)}><X className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input value={ct.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder="Nom complet" className="text-sm" />
                <Input value={ct.role} onChange={(e) => updateContact(i, "role", e.target.value)} placeholder="Poste / Fonction" className="text-sm" />
                <Input value={ct.department} onChange={(e) => updateContact(i, "department", e.target.value)} placeholder="Direction / Service" className="text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input value={ct.email} onChange={(e) => updateContact(i, "email", e.target.value)} placeholder="Email" className="text-sm" />
                <Input value={ct.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} placeholder="Téléphone" className="text-sm" />
              </div>
              <Textarea value={ct.notes} onChange={(e) => updateContact(i, "notes", e.target.value)} placeholder="Notes (contexte, préférences…)" className="text-sm min-h-[60px]" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setContacts((c) => [...c, emptyContact()])}>
            <Plus className="h-3.5 w-3.5" /> Ajouter un contact
          </Button>
        </div>
      </Section>

      {/* ---- Notes internes ---- */}
      <Section title="Notes internes" icon={FileText}>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Notes libres, remarques internes…"
          className="min-h-[100px] text-sm"
        />
      </Section>

      {/* ---- Save button (sticky) ---- */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer toutes les modifications
        </Button>
      </div>

      {/* ---- Metadata ---- */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Métadonnées</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ID</p>
            <div className="flex items-center gap-1">
              <p className="text-xs font-mono text-foreground truncate max-w-[140px]">{organization.id}</p>
              <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Créée le</p>
            <p className="text-sm text-foreground">{format(new Date(organization.created_at), "dd MMM yyyy", { locale: fr })}</p>
            <p className="text-[10px] text-muted-foreground">{createdAgo}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Dernière modification</p>
            <p className="text-sm text-foreground">{format(new Date(organization.updated_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Statut abonnement</p>
            <Badge variant="outline" className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
            {stats.subscriptionPlan && <p className="text-[10px] text-muted-foreground mt-1">Plan : {stats.subscriptionPlan}</p>}
          </div>
        </div>
      </div>

      {/* ---- Danger zone ---- */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="text-sm font-semibold text-destructive mb-2">Zone de danger</h3>
        <p className="text-xs text-muted-foreground mb-4">La suppression est irréversible. Toutes les données associées seront perdues.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" /> Supprimer l'organisation</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer « {organization.name} » ?</AlertDialogTitle>
              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                const { error } = await supabase.from("organizations").delete().eq("id", organization.id);
                if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
                else { toast({ title: "Organisation supprimée" }); window.location.href = "/admin/organizations"; }
              }}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

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
