import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Loader2, Target, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/ui/PageTransition";
import { useSpendCredits } from "@/hooks/useSpendCredits";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReflectionPlan {
  summary: string;
  feasibility_score: number;
  steps: { title: string; description: string; kpi: string }[];
  risks: { risk: string; mitigation: string }[];
  next_action: string;
}

interface ReflectionToolProps {
  onBack: () => void;
  creditCost: number;
  organizationId?: string | null;
}

export function ReflectionTool({ onBack, creditCost, organizationId }: ReflectionToolProps) {
  const [step, setStep] = useState(0);
  const [context, setContext] = useState("");
  const [problem, setProblem] = useState("");
  const [objectives, setObjectives] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ReflectionPlan | null>(null);
  const { hasCredits, balance } = useCredits();
  const spendCredits = useSpendCredits();

  const steps = [
    { label: "Contexte", placeholder: "Décrivez votre situation actuelle, votre marché, votre entreprise...", value: context, setter: setContext },
    { label: "Problème", placeholder: "Quel est le problème ou le défi que vous cherchez à résoudre ?", value: problem, setter: setProblem },
    { label: "Objectifs", placeholder: "Quels sont vos objectifs à court et moyen terme ?", value: objectives, setter: setObjectives },
  ];

  const handleGenerate = async () => {
    if (!hasCredits(creditCost)) {
      toast.error(`Crédits insuffisants (${balance} disponibles, ${creditCost} requis)`);
      return;
    }
    setLoading(true);
    try {
      await spendCredits.mutateAsync({ amount: creditCost, description: "Générateur de Réflexion" });
      const { data, error } = await supabase.functions.invoke("ai-reflection", {
        body: { context, problem, objectives },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data.plan);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  if (plan && step === 3) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10 pb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-1">Plan de Jeu</h1>
            <p className="text-sm text-muted-foreground">{plan.summary}</p>
          </div>

          {/* Feasibility */}
          <div className="px-6 mb-4">
            <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold text-lg ${plan.feasibility_score >= 7 ? "bg-green-500/20 text-green-400" : plan.feasibility_score >= 4 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                {plan.feasibility_score}/10
              </div>
              <div>
                <p className="text-sm font-bold">Score de faisabilité</p>
                <p className="text-xs text-muted-foreground">Évaluation globale de votre projet</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 mb-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Étapes du plan</h2>
            <div className="space-y-3">
              {plan.steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1">{s.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Target className="h-3 w-3" /> {s.kpi}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="px-6 mb-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Risques identifiés</h2>
            <div className="space-y-2">
              {plan.risks.map((r, i) => (
                <div key={i} className="rounded-2xl bg-destructive/5 border border-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{r.risk}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">→ {r.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next action */}
          <div className="px-6">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Prochaine action</p>
                <p className="text-sm">{plan.next_action}</p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-10 pb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <Compass className="h-4 w-4 text-accent" />
            </div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight">Générateur de Réflexion</h1>
          </div>
          <p className="text-xs text-muted-foreground">Étape {step + 1}/3 — {steps[step].label}</p>
        </div>

        {/* Progress */}
        <div className="px-6 mb-6">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>

        <div className="px-6">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">{steps[step].label}</label>
          <Textarea
            value={steps[step].value}
            onChange={(e) => steps[step].setter(e.target.value)}
            placeholder={steps[step].placeholder}
            className="rounded-xl min-h-[140px] resize-none"
          />
        </div>

        <div className="px-6 mt-6 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl flex-1">
              <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!steps[step].value.trim()} className="rounded-xl flex-1">
              Suivant <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!steps[step].value.trim() || loading} className="rounded-xl flex-1">
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              {loading ? "Génération..." : `Générer (${creditCost} crédits)`}
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
