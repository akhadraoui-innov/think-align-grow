import { motion } from "framer-motion";
import { Sparkles, MessageSquare, FileText, Compass, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const aiTools = [
  {
    title: "GÉNÉRATEUR DE RÉFLEXION",
    description: "Décrivez votre situation → l'IA propose un plan de jeu personnalisé",
    icon: Compass,
    credits: 2,
    bg: "bg-accent",
  },
  {
    title: "GÉNÉRATEUR DE LIVRABLES",
    description: "Pitch deck, SWOT, BMC, plan d'action — générés sur mesure",
    icon: FileText,
    credits: 5,
    bg: "bg-pillar-finance",
  },
  {
    title: "COACH IA STRATÉGIQUE",
    description: "Un chatbot qui challenge vos hypothèses avec le framework H&S",
    icon: MessageSquare,
    credits: 1,
    bg: "bg-pillar-marketing",
  },
];

export default function AI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 pb-6">
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
          className="flex items-center justify-between rounded-2xl bg-secondary p-4 border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pillar-impact">
              <CreditCard className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">5 crédits gratuits</p>
              <p className="text-xs text-muted-foreground">Connectez-vous pour commencer</p>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground font-bold"
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
              className={`rounded-3xl ${tool.bg} p-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden`}
            >
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-foreground/5" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <Icon className="h-7 w-7 text-foreground" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                    <Sparkles className="h-3 w-3" />
                    {tool.credits} crédit{tool.credits > 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1 tracking-tight">{tool.title}</h3>
                <p className="text-sm text-foreground/60">{tool.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-foreground/50 uppercase tracking-wider">
                  Lancer <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
