import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Gamepad2, ArrowUpRight,
  BookOpen, Target, Coins, Star, Presentation, Layers,
  TrendingUp, Building2, Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useActiveOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/ui/PageTransition";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* ─── GUEST LANDING ─── */
const valueProps = [
  { num: "01", title: "S'acculturer", subtitle: "200+ concepts stratégiques structurés en 10 piliers.", color: "hsl(var(--primary))", bg: "hsl(var(--pillar-business-light))", route: "/explore" },
  { num: "02", title: "Challenger", subtitle: "Quiz, défis et coaching IA qui confronte vos hypothèses.", color: "hsl(var(--pillar-thinking))", bg: "hsl(var(--pillar-thinking-light))", route: "/lab" },
  { num: "03", title: "Structurer", subtitle: "Livrables SWOT, BMC, Pitch Deck — prêts en minutes.", color: "hsl(var(--accent))", bg: "hsl(var(--pillar-innovation-light))", route: "/ai" },
];

const phases = [
  { name: "Fondations", color: "bg-accent text-accent-foreground" },
  { name: "Modèle", color: "bg-pillar-business text-white" },
  { name: "Croissance", color: "bg-pillar-finance text-white" },
  { name: "Exécution", color: "bg-pillar-thinking text-white" },
];

function GuestLanding() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">GROWTHINNOV</span>
        </div>
        <button onClick={() => navigate("/auth")} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          Connexion
        </button>
      </nav>

      <section className="px-5 pt-8 pb-0 relative">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 mb-6">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Serious Game Stratégique</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="font-display font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(3.8rem, 18vw, 7rem)', lineHeight: '0.86' }}>
            Structure<br />
            <span style={{ WebkitTextStroke: '2px hsl(var(--foreground))', WebkitTextFillColor: 'transparent', color: 'transparent' }}>le Chaos.</span>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs">
          Le toolkit qui transforme vos idées business en stratégies exécutables. 200+ cartes, 10 piliers, 4 phases.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="flex gap-3 mt-7">
          <button onClick={() => navigate("/explore")} className="flex items-center gap-2 bg-foreground text-background font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-elevated">
            Jouer maintenant <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate("/auth")} className="flex items-center gap-2 border-2 border-foreground/20 text-foreground font-bold text-sm uppercase tracking-wider px-5 py-3.5 rounded-2xl hover:border-foreground/50 active:scale-95 transition-all">
            S'inscrire
          </button>
        </motion.div>
      </section>

      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-5 mt-10 mb-0 h-1.5 bg-primary rounded-full origin-left" />

      <section className="px-5 pt-6 pb-0">
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {[{ val: "200+", lbl: "Cartes" }, { val: "10", lbl: "Piliers" }, { val: "4", lbl: "Phases" }, { val: "∞", lbl: "Combos" }].map((s, i) => (
            <motion.div key={s.lbl} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.06 }} className="flex-1 min-w-0 border-r border-border last:border-0 px-4 first:pl-0 last:pr-0 py-2">
              <div className="font-display font-black text-2xl leading-none text-foreground">{s.val}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{s.lbl}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display font-black text-xl uppercase tracking-tight">Pourquoi ?</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3 raisons</span>
        </div>
        <div className="space-y-3">
          {valueProps.map((vp, i) => (
            <motion.button key={vp.num} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }} onClick={() => navigate(vp.route)} className="w-full text-left group">
              <div className="rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform card-shadow" style={{ backgroundColor: vp.bg }}>
                <div className="font-display font-black text-4xl leading-none shrink-0 w-14" style={{ color: vp.color, opacity: 0.2 }}>{vp.num}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-base uppercase tracking-tight text-foreground mb-0.5">{vp.title}</div>
                  <div className="text-xs text-muted-foreground leading-snug">{vp.subtitle}</div>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" style={{ color: vp.color }} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-10">
        <h2 className="font-display font-black text-xl uppercase tracking-tight mb-5">4 Phases</h2>
        <div className="flex flex-wrap gap-2">
          {phases.map((p, i) => (
            <motion.button key={p.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.07, type: "spring", stiffness: 300 }} onClick={() => navigate("/explore")} className={`${p.color} font-display font-black text-sm uppercase tracking-wider px-5 py-2.5 rounded-2xl active:scale-95 transition-transform`}>
              {p.name}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-10">
        <h2 className="font-display font-black text-xl uppercase tracking-tight mb-6">Comment ?</h2>
        <div className="space-y-0">
          {[
            { num: "1", title: "Explorez les 10 piliers", sub: "200+ cartes stratégiques gratuites" },
            { num: "2", title: "Testez votre maturité", sub: "Diagnostic IA en 5 minutes" },
            { num: "3", title: "Générez vos livrables", sub: "SWOT, BMC, Pitch — prêts à présenter" },
          ].map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 + i * 0.1 }} className="flex items-start gap-5 py-5 border-b border-border last:border-0">
              <span className="font-display font-black text-5xl leading-none text-muted/60 shrink-0 w-10">{step.num}</span>
              <div className="pt-1">
                <div className="font-display font-bold text-base uppercase tracking-tight text-foreground">{step.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{step.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-10 pb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="rounded-3xl bg-foreground p-8 relative overflow-hidden">
          <div className="absolute inset-0 stripe-bg opacity-[0.04] rounded-3xl" />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 blur-2xl" style={{ background: 'hsl(var(--primary))' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-primary rounded-full px-3 py-1 mb-5">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">Coach IA inclus</span>
            </div>
            <h2 className="font-display font-black text-background leading-none mb-2" style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)', lineHeight: '0.9' }}>Prêt à jouer ?</h2>
            <p className="text-sm text-background/50 mb-7 mt-3">Lancez un diagnostic de votre maturité stratégique. Gratuit, sans CB.</p>
            <button onClick={() => navigate("/lab")} className="flex items-center gap-2 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider px-7 py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-primary-glow">
              Démarrer le diagnostic <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ─── AUTHENTICATED DASHBOARD ─── */
function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { balance } = useCredits();
  const { activeOrg } = useActiveOrg();

  const xp = profile?.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpProgress = xp % 100;

  const { data: recentWorkshops } = useQuery({
    queryKey: ["user-recent-workshops", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("workshop_participants").select("workshop_id, role, joined_at, workshops(id, name, code, status, created_at)").eq("user_id", user!.id).order("joined_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: cardsViewed } = useQuery({
    queryKey: ["user-cards-viewed", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase.from("user_card_progress").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_viewed", true);
      return count || 0;
    },
  });

  const { data: bookmarks } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase.from("user_card_progress").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_bookmarked", true);
      return count || 0;
    },
  });

  const { data: quizCount } = useQuery({
    queryKey: ["user-quiz-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase.from("quiz_results").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
  });

  // Org toolkit recommendation
  const { data: orgToolkit } = useQuery({
    queryKey: ["user-org-toolkit", activeOrg?.organization_id],
    enabled: !!activeOrg?.organization_id,
    queryFn: async () => {
      const { data } = await supabase.from("organization_toolkits").select("toolkit_id, toolkits(name, icon_emoji, slug)").eq("organization_id", activeOrg!.organization_id).eq("is_active", true).limit(1).maybeSingle();
      return data;
    },
  });

  const stats = [
    { icon: Star, label: "XP", value: xp, gradient: "accent" },
    { icon: Coins, label: "Crédits", value: balance, gradient: "finance" },
    { icon: BookOpen, label: "Cartes vues", value: cardsViewed || 0, gradient: "thinking" },
    { icon: Target, label: "Quiz", value: quizCount || 0, gradient: "business" },
  ];

  const quickActions = [
    { icon: Layers, label: "Explorer les cartes", route: "/explore", gradient: "accent" },
    { icon: Gamepad2, label: "Lancer un quiz", route: "/lab", gradient: "thinking" },
    { icon: Presentation, label: "Créer un workshop", route: "/workshop", gradient: "finance" },
    { icon: Sparkles, label: "Coach IA", route: "/ai", gradient: "business" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Bonjour</p>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
              {profile?.display_name || "Utilisateur"}
            </h1>
          </motion.div>
        </div>

        {/* XP Progression */}
        <div className="px-6 mb-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="font-display font-black text-xs text-primary-foreground">{level}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Niveau {level}</p>
                  <p className="text-[10px] text-muted-foreground">{xp} XP total</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">{xpProgress}/100 XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="px-6 mb-4">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                className="rounded-2xl bg-card border border-border p-3 text-center">
                <GradientIcon icon={s.icon} gradient={s.gradient} size="sm" className="mx-auto mb-1.5" />
                <p className="font-display font-bold text-lg">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Org context + toolkit recommendation */}
        {activeOrg && (
          <div className="px-6 mb-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{activeOrg.org_name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{activeOrg.role?.replace(/_/g, " ") || "Membre"}</p>
                </div>
                {orgToolkit && (
                  <button onClick={() => navigate("/explore")} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                    {(orgToolkit as any).toolkits?.icon_emoji} {(orgToolkit as any).toolkits?.name}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-6 mb-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a, i) => (
              <motion.button key={a.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.04 }}
                onClick={() => navigate(a.route)}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all">
                <GradientIcon icon={a.icon} gradient={a.gradient} size="sm" />
                <span className="text-sm font-semibold text-foreground">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent workshops */}
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Workshops récents</h2>
            <button onClick={() => navigate("/workshop")} className="text-xs font-bold text-primary hover:underline">Voir tout</button>
          </div>
          {recentWorkshops && recentWorkshops.length > 0 ? (
            <div className="space-y-2">
              {recentWorkshops.map((wp: any) => {
                const w = wp.workshops;
                if (!w) return null;
                return (
                  <motion.button key={wp.workshop_id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(`/workshop/${w.id}`)}
                    className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Presentation className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{w.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{wp.role}</span>
                        <span>·</span>
                        <span>{format(new Date(wp.joined_at), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${w.status === 'completed' ? 'bg-green-500/10 text-green-600' : w.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {w.status}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-6 text-center">
              <Presentation className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun workshop pour le moment</p>
              <button onClick={() => navigate("/workshop")} className="text-xs font-bold text-primary mt-2 hover:underline">Créer mon premier workshop</button>
            </div>
          )}
        </div>

        {/* Bookmarks summary */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-2">
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate("/explore")}
              className="rounded-2xl bg-card border border-border p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Favoris</span>
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{bookmarks || 0}</p>
            </motion.button>
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate("/explore")}
              className="rounded-2xl bg-card border border-border p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progression</span>
              </div>
              <p className="font-display font-bold text-2xl text-foreground">Niv. {level}</p>
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  return user ? <UserDashboard /> : <GuestLanding />;
}
