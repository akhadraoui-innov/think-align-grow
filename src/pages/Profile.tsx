import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, LogIn, ArrowRight, BookOpen, Target, Sparkles, Trophy, Gamepad2,
  LogOut, Edit2, Save, Building2, Coins, Star, Camera, MapPin, Phone,
  Briefcase, Linkedin, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { PageTransition } from "@/components/ui/PageTransition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useActiveOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const benefits = [
  { icon: BookOpen, text: "Sauvegarder vos plans de jeu personnalisés", gradient: "accent" },
  { icon: Target, text: "Suivre votre radar de maturité stratégique", gradient: "thinking" },
  { icon: Sparkles, text: "Utiliser les générateurs IA (5 crédits gratuits)", gradient: "finance" },
  { icon: Gamepad2, text: "Participer aux défis hebdomadaires", gradient: "business" },
  { icon: Trophy, text: "Gagner des badges et monter en niveau", gradient: "impact" },
];

const HIERARCHY_LEVELS = ["Dirigeant", "Directeur", "Manager", "Chef de projet", "Expert", "Contributeur", "Stagiaire"];

function GuestProfile() {
  const navigate = useNavigate();
  return (
    <PageTransition><div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="relative mb-5">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
          </motion.div>
          <h1 className="font-display text-3xl font-bold mb-2 uppercase">Bienvenue</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">Connectez-vous pour sauvegarder vos projets, suivre votre progression et utiliser les outils IA.</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button size="lg" className="rounded-2xl bg-primary text-primary-foreground font-bold h-13 uppercase tracking-wide shadow-lg shadow-primary/20" onClick={() => navigate("/auth")}>
              <LogIn className="mr-2 h-4 w-4" /> Se connecter
            </Button>
            <Button variant="outline" size="lg" className="rounded-2xl font-bold border-border h-13 uppercase tracking-wide" onClick={() => navigate("/auth")}>
              Créer un compte <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      <div className="px-6 mt-4">
        <h2 className="font-display text-lg font-bold mb-4 uppercase tracking-tight">Avec un compte</h2>
        <div className="space-y-3">
          {benefits.map((b, i) => (
            <motion.div key={b.text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3.5">
              <GradientIcon icon={b.icon} gradient={b.gradient} size="sm" />
              <span className="text-sm text-foreground">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div></PageTransition>
  );
}

function AuthenticatedProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { balance } = useCredits();
  const { memberships } = useActiveOrg();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [form, setForm] = useState({
    display_name: "",
    job_title: "",
    department: "",
    service: "",
    pole: "",
    hierarchy_level: "",
    manager_name: "",
    bio: "",
    linkedin_url: "",
    location: "",
    phone: "",
    email: "",
  });

  const openEdit = () => {
    setForm({
      display_name: profile?.display_name || "",
      job_title: profile?.job_title || "",
      department: profile?.department || "",
      service: profile?.service || "",
      pole: profile?.pole || "",
      hierarchy_level: profile?.hierarchy_level || "",
      manager_name: profile?.manager_name || "",
      bio: profile?.bio || "",
      linkedin_url: profile?.linkedin_url || "",
      location: profile?.location || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
    });
    setEditOpen(true);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Stats
  const { data: quizCount } = useQuery({
    queryKey: ["quiz_count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase.from("quiz_results").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
  });

  const { data: cardsViewed } = useQuery({
    queryKey: ["cards_viewed", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase.from("user_card_progress").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_viewed", true);
      return count || 0;
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      toast.success("Avatar mis à jour");
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Profil mis à jour");
    setEditOpen(false);
    refreshProfile();
  };

  const stats = [
    { icon: Star, label: "XP", value: profile?.xp || 0, gradient: "accent" },
    { icon: Coins, label: "Crédits", value: balance, gradient: "finance" },
    { icon: BookOpen, label: "Cartes vues", value: cardsViewed || 0, gradient: "thinking" },
    { icon: Target, label: "Quiz", value: quizCount || 0, gradient: "business" },
  ];

  return (
    <PageTransition><div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          {/* Avatar with upload */}
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="relative mb-5">
            <Avatar className="h-24 w-24 rounded-3xl shadow-lg shadow-primary/20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} className="h-24 w-24 rounded-3xl object-cover" />}
              <AvatarFallback className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking text-primary-foreground text-3xl font-display font-bold">
                {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-lg bg-pillar-impact flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">{Math.floor((profile?.xp || 0) / 100) + 1}</span>
            </div>
          </motion.div>

          <h1 className="font-display text-2xl font-bold uppercase">{profile?.display_name || "Utilisateur"}</h1>
          {profile?.job_title && <p className="text-sm text-muted-foreground">{profile.job_title}</p>}
          {profile?.department && <p className="text-xs text-muted-foreground/60">{profile.department}</p>}
          {profile?.location && (
            <p className="text-xs text-muted-foreground/40 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {profile.location}
            </p>
          )}
          <p className="text-xs text-muted-foreground/40 mt-1">{user?.email}</p>

          {profile?.bio && (
            <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openEdit}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Modifier
            </Button>
            {profile?.linkedin_url && (
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-2xl bg-card border border-border p-3 text-center">
              <GradientIcon icon={s.icon} gradient={s.gradient} size="sm" className="mx-auto mb-1.5" />
              <p className="font-display font-bold text-lg">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Profile details */}
      {(profile?.service || profile?.pole || profile?.hierarchy_level || profile?.manager_name || profile?.phone) && (
        <div className="px-6 mb-6">
          <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Détails professionnels</h2>
          <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
            {profile?.service && <InfoRow label="Service" value={profile.service} />}
            {profile?.pole && <InfoRow label="Pôle" value={profile.pole} />}
            {profile?.hierarchy_level && <InfoRow label="Niveau" value={profile.hierarchy_level} />}
            {profile?.manager_name && <InfoRow label="Manager" value={profile.manager_name} />}
            {profile?.phone && <InfoRow label="Téléphone" value={profile.phone} />}
          </div>
        </div>
      )}

      {/* Organizations */}
      {memberships.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="font-display text-lg font-bold mb-3 uppercase tracking-tight">Organisations</h2>
          <div className="space-y-2">
            {memberships.map((m) => (
              <div key={m.organization_id} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3.5">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.org_name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="px-6">
        <Button variant="outline" className="w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
        </Button>
      </div>

      {/* Edit Dialog - Full profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold uppercase">Modifier le profil</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="identity" className="space-y-4">
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger value="identity" className="flex-1 text-xs">Identité</TabsTrigger>
              <TabsTrigger value="pro" className="flex-1 text-xs">Pro</TabsTrigger>
              <TabsTrigger value="contact" className="flex-1 text-xs">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-4">
              <Field label="Nom affiché" value={form.display_name} onChange={(v) => updateField("display_name", v)} />
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Bio</Label>
                <Textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} className="rounded-xl min-h-[80px]" placeholder="Quelques mots sur vous..." />
              </div>
              <Field label="LinkedIn" value={form.linkedin_url} onChange={(v) => updateField("linkedin_url", v)} placeholder="https://linkedin.com/in/..." />
              <Field label="Localisation" value={form.location} onChange={(v) => updateField("location", v)} placeholder="Paris, France" />
            </TabsContent>

            <TabsContent value="pro" className="space-y-4">
              <Field label="Poste" value={form.job_title} onChange={(v) => updateField("job_title", v)} placeholder="Product Manager" />
              <Field label="Département" value={form.department} onChange={(v) => updateField("department", v)} placeholder="Innovation" />
              <Field label="Service" value={form.service} onChange={(v) => updateField("service", v)} />
              <Field label="Pôle" value={form.pole} onChange={(v) => updateField("pole", v)} />
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Niveau hiérarchique</Label>
                <Select value={form.hierarchy_level} onValueChange={(v) => updateField("hierarchy_level", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {HIERARCHY_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Manager" value={form.manager_name} onChange={(v) => updateField("manager_name", v)} placeholder="Nom du manager" />
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Field label="Email secondaire" value={form.email} onChange={(v) => updateField("email", v)} placeholder="contact@..." />
              <Field label="Téléphone" value={form.phone} onChange={(v) => updateField("phone", v)} placeholder="+33 6 ..." />
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-bold uppercase mt-4">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </DialogContent>
      </Dialog>
    </div></PageTransition>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" placeholder={placeholder} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  return user ? <AuthenticatedProfile /> : <GuestProfile />;
}
