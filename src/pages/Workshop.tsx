import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogIn, Users, Zap, ArrowRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCreateWorkshop, useJoinWorkshop } from "@/hooks/useWorkshop";

export default function Workshop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [workshopName, setWorkshopName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const { create, loading: creating } = useCreateWorkshop();
  const { join, loading: joining } = useJoinWorkshop();

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-5 gap-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display font-black text-2xl uppercase tracking-tight mb-2">Workshop</h1>
            <p className="text-sm text-muted-foreground">Connectez-vous pour créer ou rejoindre un workshop.</p>
          </div>
          <Button onClick={() => navigate("/auth")} className="font-bold uppercase tracking-wider">
            Se connecter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pt-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Mode Collaboratif
            </span>
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none">
            Workshop
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Animez un atelier stratégique en temps réel avec votre équipe.
          </p>
        </motion.div>

        {mode === "choice" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Create Workshop */}
            <button
              onClick={() => setMode("create")}
              className="w-full text-left group"
            >
              <div className="rounded-2xl bg-foreground p-6 card-shadow relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl" style={{ background: "hsl(var(--primary))" }} />
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-black text-lg uppercase tracking-tight text-background">
                      Créer un Workshop
                    </div>
                    <div className="text-xs text-background/50 mt-0.5">
                      Animez et projetez les cartes stratégiques
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-background/40 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Join Workshop */}
            <button
              onClick={() => setMode("join")}
              className="w-full text-left group"
            >
              <div className="rounded-2xl border-2 border-border p-6 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <LogIn className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                      Rejoindre
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Entrez le code à 6 caractères de la room
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-6"
            >
              <h3 className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Fonctionnalités</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🎯", label: "Cartes projetées", sub: "Sync temps réel" },
                  { icon: "⏱️", label: "Timer intégré", sub: "Rythme garanti" },
                  { icon: "🗳️", label: "Votes & réponses", sub: "Collecte live" },
                  { icon: "📊", label: "4 livrables", sub: "SWOT, BMC, Pitch, Plan" },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl bg-card border border-border p-4">
                    <span className="text-xl">{f.icon}</span>
                    <div className="font-display font-bold text-xs uppercase tracking-tight mt-2">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{f.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {mode === "create" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setMode("choice")}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>

            <div>
              <label className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Nom du workshop
              </label>
              <Input
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                placeholder="Ex: Stratégie Q1 2026"
                className="rounded-xl bg-secondary border-border text-base"
              />
            </div>

            <Button
              onClick={() => create(workshopName)}
              disabled={!workshopName.trim() || creating}
              className="w-full font-black uppercase tracking-wider rounded-xl h-12"
            >
              {creating ? "Création..." : "Lancer le workshop"}
              <Zap className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setMode("choice")}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>

            <div>
              <label className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                Code de la room
              </label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="EX: A3K7M2"
                maxLength={6}
                className="rounded-xl bg-secondary border-border text-2xl text-center font-display font-black tracking-[0.3em] uppercase h-14"
              />
            </div>

            <Button
              onClick={() => join(joinCode)}
              disabled={joinCode.length !== 6 || joining}
              className="w-full font-black uppercase tracking-wider rounded-xl h-12"
            >
              {joining ? "Connexion..." : "Rejoindre"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
