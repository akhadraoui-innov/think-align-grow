import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, FileText, Compass, Zap, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { MeshGradient } from "@/components/ui/PatternBackground";
import { PageTransition } from "@/components/ui/PageTransition";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { ReflectionTool } from "@/components/ai/ReflectionTool";
import { DeliverablesTool } from "@/components/ai/DeliverablesTool";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

const aiTools = [
  { id: "reflection", title: "Générateur de Réflexion", description: "Décrivez votre situation → l'IA propose un plan de jeu personnalisé", icon: Compass, credits: 2, gradient: "accent" },
  { id: "livrables", title: "Générateur de Livrables", description: "Pitch deck, SWOT, BMC, plan d'action — générés sur mesure", icon: FileText, credits: 5, gradient: "finance" },
  { id: "coach", title: "Coach IA Stratégique", description: "Un chatbot qui challenge vos hypothèses avec le framework H&S", icon: MessageSquare, credits: 1, gradient: "marketing" },
];

export default function AI() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { balance, isLoading: creditsLoading, hasCredits } = useCredits();
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();

  const handleToolLaunch = (toolId: string, credits: number) => {
    if (!user) {
      toast.error("Connectez-vous pour utiliser les outils IA");
      return;
    }
    if (!hasCredits(credits)) {
      toast.error(`Crédits insuffisants (${balance} disponibles, ${credits} requis)`);
      return;
    }
    setActiveTool(toolId);
  };

  if (activeTool === "coach") {
    return (
      <PageTransition>
        <div className="flex flex-col h-screen bg-background">
          <div className="px-6 pt-10 pb-3 border-b border-border">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
              <Compass className="h-4 w-4" /> Retour
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold uppercase tracking-tight">Coach IA</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">1 crédit par message</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 border border-border">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold">{balance}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden pb-20">
            <ChatInterface creditCost={1} organizationId={activeOrgId} />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (activeTool === "reflection") {
    return <ReflectionTool onBack={() => setActiveTool(null)} creditCost={2} organizationId={activeOrgId} />;
  }

  if (activeTool === "livrables") {
    return <DeliverablesTool onBack={() => setActiveTool(null)} creditCost={5} />;
  }

  return (
    <PageTransition>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-r from-pillar-impact/20 to-pillar-business/20 p-4 border border-pillar-impact/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pillar-impact/20">
                  <Zap className="h-5 w-5 text-pillar-impact" />
                </div>
                <div>
                  <p className="text-sm font-bold">{creditsLoading ? "..." : `${balance} crédit${balance !== 1 ? "s" : ""}`}</p>
                  <p className="text-xs text-muted-foreground">Solde disponible</p>
                </div>
              </div>
              {balance === 0 && !creditsLoading && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> Épuisé
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* AI Tools */}
        <div className="px-6 space-y-3">
          {aiTools.map((tool, i) => {
            const canAfford = hasCredits(tool.credits);
            return (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                onClick={() => handleToolLaunch(tool.id, tool.credits)}
                className={`rounded-3xl bg-card border border-border p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 relative overflow-hidden group active:scale-[0.98] ${!canAfford ? "opacity-60" : ""}`}>
                <MeshGradient className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-start gap-4">
                  <GradientIcon icon={tool.icon} gradient={tool.gradient} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">{tool.title}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${canAfford ? "bg-secondary text-muted-foreground border-border" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                        <Sparkles className="h-2.5 w-2.5" />{tool.credits}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wider">
                      {canAfford ? "Lancer" : "Crédits insuffisants"} <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Chat preview */}
        <div className="px-6 mt-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={() => handleToolLaunch("coach", 1)}
            className="rounded-3xl bg-secondary/60 border border-border p-5 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99]">
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
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-3 text-primary text-xs font-bold uppercase tracking-wider">
              Ouvrir le chat <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
