import { useState } from "react";
import { motion } from "framer-motion";
import { User, LogIn, ArrowRight, BookOpen, Target, Sparkles, Trophy, Gamepad2, LogOut, Edit2, Save, Building2, Coins, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { PageTransition } from "@/components/ui/PageTransition";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { user, profile, signOut } = useAuth();
  const { balance } = useCredits();
  const { memberships } = useActiveOrg();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.display_name || "");
  const [editTitle, setEditTitle] = useState(profile?.job_title || "");
  const [editDept, setEditDept] = useState(profile?.department || "");
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: editName,
      job_title: editTitle,
      department: editDept,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Profil mis à jour");
    setEditOpen(false);
    // Force reload profile
    window.location.reload();
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
          {/* Avatar */}
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="relative mb-5">
            <Avatar className="h-24 w-24 rounded-3xl shadow-lg shadow-primary/20">
              <AvatarFallback className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking text-primary-foreground text-3xl font-display font-bold">
                {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-pillar-impact flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">{Math.floor((profile?.xp || 0) / 100) + 1}</span>
            </div>
          </motion.div>

          <h1 className="font-display text-2xl font-bold uppercase">{profile?.display_name || "Utilisateur"}</h1>
          {profile?.job_title && <p className="text-sm text-muted-foreground">{profile.job_title}</p>}
          {profile?.department && <p className="text-xs text-muted-foreground/60">{profile.department}</p>}
          <p className="text-xs text-muted-foreground/40 mt-1">{user?.email}</p>

          <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => { setEditName(profile?.display_name || ""); setEditTitle(profile?.job_title || ""); setEditDept(profile?.department || ""); setEditOpen(true); }}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Modifier le profil
          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-bold uppercase">Modifier le profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Nom affiché</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Poste</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded-xl" placeholder="Ex: Product Manager" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Département</label>
              <Input value={editDept} onChange={(e) => setEditDept(e.target.value)} className="rounded-xl" placeholder="Ex: Innovation" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-bold uppercase">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Sauvegarde..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div></PageTransition>
  );
}

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;

  return user ? <AuthenticatedProfile /> : <GuestProfile />;
}
