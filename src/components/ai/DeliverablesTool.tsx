import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, Sparkles, BarChart3, Layout, Presentation, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/ui/PageTransition";
import { useSpendCredits } from "@/hooks/useSpendCredits";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DELIVERABLE_TYPES = [
  { id: "swot", label: "SWOT", icon: BarChart3, description: "Forces, faiblesses, opportunités, menaces" },
  { id: "bmc", label: "Business Model Canvas", icon: Layout, description: "Les 9 blocs de votre modèle économique" },
  { id: "pitch_deck", label: "Pitch Deck", icon: Presentation, description: "Slides structurées pour votre présentation" },
  { id: "action_plan", label: "Plan d'action", icon: ListChecks, description: "Phases, jalons et métriques de succès" },
];

interface DeliverablesToolProps {
  onBack: () => void;
  creditCost: number;
}

export function DeliverablesTool({ onBack, creditCost }: DeliverablesToolProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultType, setResultType] = useState<string>("");
  const { hasCredits, balance } = useCredits();
  const spendCredits = useSpendCredits();

  const handleGenerate = async () => {
    if (!selectedType || !description.trim()) return;
    if (!hasCredits(creditCost)) {
      toast.error(`Crédits insuffisants (${balance} disponibles, ${creditCost} requis)`);
      return;
    }
    setLoading(true);
    try {
      await spendCredits.mutateAsync({ amount: creditCost, description: `Livrable – ${selectedType}` });
      const { data, error } = await supabase.functions.invoke("ai-deliverables", {
        body: { type: selectedType, description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.deliverable);
      setResultType(data.type);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-6 pt-10 pb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-1">{result.title || "Livrable"}</h1>
          </div>
          <div className="px-6">
            {resultType === "swot" && <SwotRender data={result} />}
            {resultType === "bmc" && <BmcRender data={result} />}
            {resultType === "pitch_deck" && <PitchRender data={result} />}
            {resultType === "action_plan" && <ActionPlanRender data={result} />}
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
            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight">Générateur de Livrables</h1>
          </div>
          <p className="text-xs text-muted-foreground">{creditCost} crédits par génération</p>
        </div>

        {/* Type selection */}
        <div className="px-6 mb-4">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Type de livrable</label>
          <div className="grid grid-cols-2 gap-2">
            {DELIVERABLE_TYPES.map((t) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedType(t.id)}
                className={`rounded-2xl border p-3 text-left transition-colors ${selectedType === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}
              >
                <t.icon className={`h-5 w-5 mb-1.5 ${selectedType === t.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-bold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="px-6 mb-6">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Description du projet</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre projet, votre marché cible, votre proposition de valeur..."
            className="rounded-xl min-h-[120px] resize-none"
          />
        </div>

        <div className="px-6">
          <Button onClick={handleGenerate} disabled={!selectedType || !description.trim() || loading} className="w-full rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            {loading ? "Génération..." : `Générer (${creditCost} crédits)`}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

function SwotRender({ data }: { data: any }) {
  const sections = [
    { label: "Forces", items: data.strengths, color: "text-green-400 bg-green-500/10 border-green-500/20" },
    { label: "Faiblesses", items: data.weaknesses, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    { label: "Opportunités", items: data.opportunities, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: "Menaces", items: data.threats, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {sections.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-3 ${s.color}`}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2">{s.label}</p>
            <ul className="space-y-1.5">
              {s.items?.map((item: string, i: number) => (
                <li key={i} className="text-xs text-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {data.recommendation && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Recommandation</p>
          <p className="text-sm">{data.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function BmcRender({ data }: { data: any }) {
  const blocks = [
    { label: "Partenaires clés", items: data.key_partners },
    { label: "Activités clés", items: data.key_activities },
    { label: "Ressources clés", items: data.key_resources },
    { label: "Proposition de valeur", items: data.value_propositions },
    { label: "Relations clients", items: data.customer_relationships },
    { label: "Canaux", items: data.channels },
    { label: "Segments clients", items: data.customer_segments },
    { label: "Structure de coûts", items: data.cost_structure },
    { label: "Sources de revenus", items: data.revenue_streams },
  ];
  return (
    <div className="space-y-3">
      {blocks.map((b) => (
        <div key={b.label} className="rounded-2xl bg-card border border-border p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{b.label}</p>
          <ul className="space-y-1">
            {b.items?.map((item: string, i: number) => (
              <li key={i} className="text-xs text-foreground">• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PitchRender({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.slides?.map((slide: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm font-bold">{slide.slide_title}</p>
          </div>
          <p className="text-xs text-foreground whitespace-pre-line">{slide.content}</p>
          {slide.speaker_notes && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">💡 {slide.speaker_notes}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ActionPlanRender({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.vision && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Vision</p>
          <p className="text-sm">{data.vision}</p>
        </div>
      )}
      {data.phases?.map((phase: any, i: number) => (
        <div key={i} className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold">{phase.phase_name}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{phase.duration}</span>
          </div>
          <ul className="space-y-1 mb-2">
            {phase.tasks?.map((task: string, j: number) => (
              <li key={j} className="text-xs text-foreground">• {task}</li>
            ))}
          </ul>
          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">🏁 {phase.milestone}</p>
        </div>
      ))}
      {data.success_metrics && (
        <div className="rounded-2xl bg-secondary/60 border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Métriques de succès</p>
          <ul className="space-y-1">
            {data.success_metrics.map((m: string, i: number) => (
              <li key={i} className="text-xs text-foreground">✓ {m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
