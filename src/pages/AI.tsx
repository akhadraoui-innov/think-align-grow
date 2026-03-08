import { motion } from "framer-motion";
import { Sparkles, MessageSquare, FileText, Compass, CreditCard, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { MeshGradient } from "@/components/ui/PatternBackground";
import { useNavigate } from "react-router-dom";

const aiTools = [
  {
    title: "Générateur de Réflexion",
    description: "Décrivez votre situation → l'IA propose un plan de jeu personnalisé",
    icon: Compass,
    credits: 2,
    gradient: "accent",
  },
  {
    title: "Générateur de Livrables",
    description: "Pitch deck, SWOT, BMC, plan d'action — générés sur mesure",
    icon: FileText,
    credits: 5,
    gradient: "finance",
  },
  {
    title: "Coach IA Stratégique",
    description: "Un chatbot qui challenge vos hypothèses avec le framework H&S",
    icon: MessageSquare,
    credits: 1,
    gradient: "marketing",
  },
];

export default function AI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 mb-4 border border-border">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alimenté par l'IA</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-1 uppercase tracking-tight">Outils IA</h1>
          <p className="text-sm text-muted-foreground">Générateurs intelligents pour vos réflexions</p>
        </motion.div>
      </div>

      {/* Credits */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-r from-pillar-impact/20 to-pillar-business/20 p-4 border border-pillar-impact/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pillar-impact/20">
                <Zap className="h-5 w-5 text-pillar-impact" />
              </div>
              <div>
                <p className="text-sm font-bold">5 crédits gratuits</p>
                <p className="text-xs text-muted-foreground">Connectez-vous pour commencer</p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
              onClick={() => navigate("/auth")}
            >
              Obtenir
            </Button>
          </div>
        </motion.div>
      </div>

      {/* AI Tools */}
      <div className="px-6 space-y-3">
        {aiTools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 relative overflow-hidden group"
          >
            <MeshGradient className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start gap-4">
              <GradientIcon icon={tool.icon} gradient={tool.gradient} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
                    {tool.title}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                    <Sparkles className="h-2.5 w-2.5" />
                    {tool.credits}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wider">
                  Lancer <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chat preview */}
      <div className="px-6 mt-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-3xl bg-secondary/60 border border-border p-5"
        >
          <h3 className="font-display font-bold text-sm uppercase tracking-wide mb-4">Aperçu Coach IA</h3>
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-primary/15 px-4 py-2.5 max-w-[80%]">
                <p className="text-xs text-foreground">Je veux lancer une marketplace B2B</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-2.5 max-w-[85%]">
                <p className="text-xs text-muted-foreground">
                  Intéressant ! Avez-vous validé votre <span className="text-primary font-semibold">Problem-Solution Fit</span> ? 
                  Je vous suggère de commencer par les cartes du pilier <span className="text-primary font-semibold">Thinking</span>…
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
