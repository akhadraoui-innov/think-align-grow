import { motion } from "framer-motion";
import { User, LogIn, ArrowRight, BookOpen, Target, Sparkles, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { useNavigate } from "react-router-dom";

const benefits = [
  { icon: BookOpen, text: "Sauvegarder vos plans de jeu personnalisés", gradient: "accent" },
  { icon: Target, text: "Suivre votre radar de maturité stratégique", gradient: "thinking" },
  { icon: Sparkles, text: "Utiliser les générateurs IA (5 crédits gratuits)", gradient: "finance" },
  { icon: Gamepad2, text: "Participer aux défis hebdomadaires", gradient: "business" },
  { icon: Trophy, text: "Gagner des badges et monter en niveau", gradient: "impact" },
];

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative mb-5"
          >
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-pillar-thinking flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-pillar-impact flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">1</span>
            </div>
          </motion.div>

          <h1 className="font-display text-3xl font-bold mb-2 uppercase">Bienvenue</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Connectez-vous pour sauvegarder vos projets, suivre votre progression et utiliser les outils IA.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              size="lg"
              className="rounded-2xl bg-primary text-primary-foreground font-bold h-13 uppercase tracking-wide shadow-lg shadow-primary/20"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Se connecter
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl font-bold border-border h-13 uppercase tracking-wide"
              onClick={() => navigate("/auth")}
            >
              Créer un compte
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Benefits */}
      <div className="px-6 mt-4">
        <h2 className="font-display text-lg font-bold mb-4 uppercase tracking-tight">Avec un compte</h2>
        <div className="space-y-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3.5"
            >
              <GradientIcon icon={b.icon} gradient={b.gradient} size="sm" />
              <span className="text-sm text-foreground">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
