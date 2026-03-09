import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, Compass, Gamepad2, Brain, Zap,
  ChevronRight, BookOpen, Target, FileText, Layers, Eye, Rocket, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const valueProps = [
  {
    num: "01",
    title: "S'acculturer",
    subtitle: "200+ concepts stratégiques structurés en 10 piliers.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--pillar-business-light))",
    route: "/explore",
  },
  {
    num: "02",
    title: "Challenger",
    subtitle: "Quiz, défis et coaching IA qui confronte vos hypothèses.",
    color: "hsl(var(--pillar-thinking))",
    bg: "hsl(var(--pillar-thinking-light))",
    route: "/lab",
  },
  {
    num: "03",
    title: "Structurer",
    subtitle: "Livrables SWOT, BMC, Pitch Deck — prêts en minutes.",
    color: "hsl(var(--accent))",
    bg: "hsl(var(--pillar-innovation-light))",
    route: "/ai",
  },
];

const phases = [
  { name: "Fondations", color: "bg-accent text-accent-foreground" },
  { name: "Modèle", color: "bg-pillar-business text-white" },
  { name: "Croissance", color: "bg-pillar-finance text-white" },
  { name: "Exécution", color: "bg-pillar-thinking text-white" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      
      {/* ─── NAV ─── */}
      <nav className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="font-display text-xs font-black text-background">H</span>
          </div>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Hack & Show</span>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Connexion
        </button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="px-5 pt-8 pb-0 relative">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Serious Game Stratégique
          </span>
        </motion.div>

        {/* Headline ultra-bold */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display font-black uppercase leading-none tracking-tight" style={{ fontSize: 'clamp(3.8rem, 18vw, 7rem)', lineHeight: '0.86' }}>
            Structure
            <br />
            <span
              style={{
                WebkitTextStroke: '2px hsl(var(--foreground))',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              le Chaos.
            </span>
          </h1>
        </motion.div>

        {/* Sous-titre */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs"
        >
          Le toolkit qui transforme vos idées business en stratégies exécutables. 
          200+ cartes, 10 piliers, 4 phases.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex gap-3 mt-7"
        >
          <button
            onClick={() => navigate("/explore")}
            className="flex items-center gap-2 bg-foreground text-background font-black text-sm uppercase tracking-wider px-6 py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-elevated"
          >
            Jouer maintenant
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 border-2 border-foreground/20 text-foreground font-bold text-sm uppercase tracking-wider px-5 py-3.5 rounded-2xl hover:border-foreground/50 active:scale-95 transition-all"
          >
            S'inscrire
          </button>
        </motion.div>
      </section>

      {/* ─── BANDE ORANGE COUPER ─── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-5 mt-10 mb-0 h-1.5 bg-primary rounded-full origin-left"
      />

      {/* ─── STATS ─── */}
      <section className="px-5 pt-6 pb-0">
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {[
            { val: "200+", lbl: "Cartes" },
            { val: "10", lbl: "Piliers" },
            { val: "4", lbl: "Phases" },
            { val: "∞", lbl: "Combos" },
          ].map((s, i) => (
            <motion.div
              key={s.lbl}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.06 }}
              className="flex-1 min-w-0 border-r border-border last:border-0 px-4 first:pl-0 last:pr-0 py-2"
            >
              <div className="font-display font-black text-2xl leading-none text-foreground">{s.val}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{s.lbl}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 3 PROPOSITIONS ─── */}
      <section className="px-5 pt-10">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display font-black text-xl uppercase tracking-tight">Pourquoi ?</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">3 raisons</span>
        </div>

        <div className="space-y-3">
          {valueProps.map((vp, i) => (
            <motion.button
              key={vp.num}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              onClick={() => navigate(vp.route)}
              className="w-full text-left group"
            >
              <div
                className="rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform card-shadow"
                style={{ backgroundColor: vp.bg }}
              >
                <div
                  className="font-display font-black text-4xl leading-none shrink-0 w-14"
                  style={{ color: vp.color, opacity: 0.2 }}
                >
                  {vp.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-base uppercase tracking-tight text-foreground mb-0.5">
                    {vp.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">{vp.subtitle}</div>
                </div>
                <ArrowUpRight
                  className="h-5 w-5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  style={{ color: vp.color }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── PHASES PILLS ─── */}
      <section className="px-5 pt-10">
        <h2 className="font-display font-black text-xl uppercase tracking-tight mb-5">4 Phases</h2>
        <div className="flex flex-wrap gap-2">
          {phases.map((p, i) => (
            <motion.button
              key={p.name}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.07, type: "spring", stiffness: 300 }}
              onClick={() => navigate("/explore")}
              className={`${p.color} font-display font-black text-sm uppercase tracking-wider px-5 py-2.5 rounded-2xl active:scale-95 transition-transform`}
            >
              {p.name}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─── */}
      <section className="px-5 pt-10">
        <h2 className="font-display font-black text-xl uppercase tracking-tight mb-6">Comment ?</h2>
        <div className="space-y-0">
          {[
            { num: "1", title: "Explorez les 10 piliers", sub: "200+ cartes stratégiques gratuites" },
            { num: "2", title: "Testez votre maturité", sub: "Diagnostic IA en 5 minutes" },
            { num: "3", title: "Générez vos livrables", sub: "SWOT, BMC, Pitch — prêts à présenter" },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.1 }}
              className="flex items-start gap-5 py-5 border-b border-border last:border-0"
            >
              <span className="font-display font-black text-5xl leading-none text-muted/60 shrink-0 w-10">
                {step.num}
              </span>
              <div className="pt-1">
                <div className="font-display font-bold text-base uppercase tracking-tight text-foreground">
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{step.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL — bloc noir total ─── */}
      <section className="px-5 pt-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-foreground p-8 relative overflow-hidden"
        >
          {/* Texture stripe */}
          <div className="absolute inset-0 stripe-bg opacity-[0.04] rounded-3xl" />
          
          {/* Accent spot */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 blur-2xl"
            style={{ background: 'hsl(var(--primary))' }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-primary rounded-full px-3 py-1 mb-5">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">Coach IA inclus</span>
            </div>

            <h2 className="font-display font-black text-background leading-none mb-2" style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)', lineHeight: '0.9' }}>
              Prêt à jouer ?
            </h2>
            <p className="text-sm text-background/50 mb-7 mt-3">
              Lancez un diagnostic de votre maturité stratégique. Gratuit, sans CB.
            </p>
            <button
              onClick={() => navigate("/lab")}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider px-7 py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-primary-glow"
            >
              Démarrer le diagnostic
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
