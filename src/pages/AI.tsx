import { motion } from "framer-motion";
import { Sparkles, MessageSquare, FileText, Compass, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const aiTools = [
  {
    title: "Générateur de Réflexion",
    description: "Décrivez votre situation et l'IA propose un plan de jeu personnalisé avec les cartes pertinentes",
    icon: Compass,
    credits: 2,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    title: "Générateur de Livrables",
    description: "Pitch deck, SWOT, Business Model Canvas, plan d'action — générés à partir de vos réponses",
    icon: FileText,
    credits: 5,
    color: "bg-pillar-finance/10 text-pillar-finance border-pillar-finance/20",
  },
  {
    title: "Coach IA Stratégique",
    description: "Un chatbot qui challenge vos hypothèses en utilisant le framework Hack & Show",
    icon: MessageSquare,
    credits: 1,
    color: "bg-pillar-innovation/10 text-pillar-innovation border-pillar-innovation/20",
  },
];

export default function AI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-accent-foreground">Alimenté par l'IA</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-1">Outils IA</h1>
          <p className="text-sm text-muted-foreground">Des générateurs intelligents pour vos réflexions stratégiques</p>
        </motion.div>
      </div>

      {/* Credits banner */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 card-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pillar-impact/10">
              <CreditCard className="h-5 w-5 text-pillar-impact" />
            </div>
            <div>
              <p className="text-sm font-semibold">5 crédits gratuits</p>
              <p className="text-xs text-muted-foreground">Connectez-vous pour commencer</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/auth")}
          >
            Obtenir
          </Button>
        </motion.div>
      </div>

      {/* AI Tools */}
      <div className="px-6 space-y-4">
        {aiTools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`rounded-2xl border ${tool.color} bg-card p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  <Sparkles className="h-3 w-3" />
                  {tool.credits} crédit{tool.credits > 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{tool.title}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
