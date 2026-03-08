import { motion } from "framer-motion";
import { User, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary border border-border mb-4">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2 uppercase">Bienvenue</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Connectez-vous pour sauvegarder vos projets, suivre votre progression et utiliser les outils IA.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              size="lg"
              className="rounded-2xl bg-primary text-primary-foreground font-bold h-13 uppercase tracking-wide"
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

      {/* Features */}
      <div className="px-6 mt-8">
        <h2 className="font-display text-lg font-bold mb-4 uppercase">Avec un compte :</h2>
        {[
          "Sauvegarder vos plans de jeu personnalisés",
          "Suivre votre radar de maturité stratégique",
          "Utiliser les générateurs IA (5 crédits gratuits)",
          "Participer aux défis hebdomadaires",
          "Gagner des badges et monter en niveau",
        ].map((feature, i) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-center gap-3 py-3 border-b border-border last:border-0"
          >
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="text-sm">{feature}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
