import { useState } from "react";
import { Sparkles, Wand2, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopilot, type AdminPractice } from "@/hooks/useAdminPractices";
import { toast } from "sonner";

interface Action {
  key: string;
  label: string;
  description: string;
  tabs: string[];
  apply: (result: any, current: AdminPractice) => Partial<AdminPractice> | null;
}

const ACTIONS: Action[] = [
  {
    key: "suggest_titles",
    label: "Suggérer 5 titres",
    description: "Propositions alternatives accrocheuses.",
    tabs: ["identity"],
    apply: () => null, // Show titles, user picks one manually
  },
  {
    key: "improve_scenario",
    label: "Améliorer le brief",
    description: "Renforce réalisme, enjeux, contraintes.",
    tabs: ["scenario"],
    apply: (r) => r?.scenario ? { scenario: r.scenario } : null,
  },
  {
    key: "generate_objectives",
    label: "Générer 3 objectifs SMART",
    description: "Spécifiques, mesurables, atteignables.",
    tabs: ["scenario"],
    apply: (r) => Array.isArray(r?.objectives) ? { objectives: r.objectives } : null,
  },
  {
    key: "reinforce_prompt",
    label: "Renforcer le system prompt",
    description: "Posture, ton, persona, mécaniques.",
    tabs: ["ai"],
    apply: (r) => r?.system_prompt ? { system_prompt: r.system_prompt } : null,
  },
  {
    key: "generate_guardrails",
    label: "Générer 5 garde-fous",
    description: "Interdictions strictes pour l'IA.",
    tabs: ["ai"],
    apply: (r) => Array.isArray(r?.guardrails) ? { guardrails: r.guardrails } : null,
  },
  {
    key: "generate_rubric",
    label: "Générer une rubric pondérée",
    description: "5 dimensions, somme = 100%.",
    tabs: ["evaluation"],
    apply: (r) => Array.isArray(r?.evaluation_dimensions) ? { evaluation_dimensions: r.evaluation_dimensions } : null,
  },
  {
    key: "challenge_criteria",
    label: "Challenger mes critères",
    description: "Critique + version améliorée.",
    tabs: ["evaluation"],
    apply: (r) => Array.isArray(r?.evaluation_dimensions) ? { evaluation_dimensions: r.evaluation_dimensions } : null,
  },
  {
    key: "generate_hints",
    label: "Générer 5 indices progressifs",
    description: "Du plus subtil au plus directif.",
    tabs: ["coaching"],
    apply: (r) => Array.isArray(r?.hints) ? { hints: r.hints } : null,
  },
  {
    key: "generate_variants",
    label: "Générer 2 variantes opposées",
    description: "Directif vs Socratique.",
    tabs: ["variants"],
    apply: () => null, // Insertion via separate mutation in tab
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  practice: AdminPractice | null;
  currentTab: string;
  onApply: (patch: Partial<AdminPractice>) => void;
  onVariantsGenerated?: (variants: Array<{ variant_label: string; system_prompt: string }>) => void;
}

export function AICopilot({ open, onOpenChange, practice, currentTab, onApply, onVariantsGenerated }: Props) {
  const copilot = useCopilot();
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ action: Action; data: any } | null>(null);

  const contextual = ACTIONS.filter(a => a.tabs.includes(currentTab));
  const others = ACTIONS.filter(a => !a.tabs.includes(currentTab));

  const run = async (action: Action) => {
    if (!practice) return;
    setPending(action.key);
    setResult(null);
    try {
      const data = await copilot.mutateAsync({ action: action.key, context: practice });
      setResult({ action, data });
    } finally {
      setPending(null);
    }
  };

  const apply = () => {
    if (!result || !practice) return;
    if (result.action.key === "generate_variants") {
      const variants = result.data?.variants ?? [];
      onVariantsGenerated?.(variants);
      toast.success(`${variants.length} variantes générées`);
    } else {
      const patch = result.action.apply(result.data, practice);
      if (patch) {
        onApply(patch);
        toast.success("Suggestion appliquée");
      } else {
        toast.info("Suggestion à appliquer manuellement");
      }
    }
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            AI Co-pilote
          </SheetTitle>
          <SheetDescription>
            Suggestions contextuelles. L'admin valide avant d'appliquer.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px]"><Sparkles className="h-3 w-3 mr-1" />Aperçu</Badge>
                <span className="text-xs font-medium">{result.action.label}</span>
              </div>
              <pre className="text-[11px] bg-muted/40 p-3 rounded-lg whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button size="sm" onClick={apply} className="flex-1">
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Appliquer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Rejeter
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {contextual.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pour cet onglet</p>
                  <div className="space-y-1.5">
                    {contextual.map(a => <ActionRow key={a.key} action={a} loading={pending === a.key} onClick={() => run(a)} />)}
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Autres actions</p>
                  <div className="space-y-1.5">
                    {others.map(a => <ActionRow key={a.key} action={a} loading={pending === a.key} onClick={() => run(a)} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ActionRow({ action, loading, onClick }: { action: Action; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left rounded-lg border border-border/60 hover:border-primary/40 hover:bg-secondary/40 p-3 transition-all disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium">{action.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
        </div>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 mt-0.5" /> : <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
      </div>
    </button>
  );
}
