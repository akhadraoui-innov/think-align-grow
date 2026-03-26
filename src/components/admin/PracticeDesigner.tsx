import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, FileText, Eye, AlertTriangle, Check, Copy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getModeDefinition, getAllUniverses, UNIVERSE_LABELS } from "@/components/simulator/config/modeRegistry";
import { getTemplatesForType, type PracticeTemplate } from "@/components/simulator/config/practiceTemplates";
import { OnboardingOverlay } from "@/components/simulator/widgets/OnboardingOverlay";

interface PracticeDesignerProps {
  open: boolean;
  onClose: () => void;
  onApply: (data: {
    title: string;
    scenario: string;
    system_prompt: string;
    max_exchanges: number;
    difficulty: string;
    practice_type: string;
    type_config: Record<string, unknown>;
    evaluation_rubric: { criterion: string; weight: number; description: string }[];
  }) => void;
}

export function PracticeDesigner({ open, onClose, onApply }: PracticeDesignerProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"templates" | "ai">("templates");
  const [selectedType, setSelectedType] = useState("conversation");
  const [aiBrief, setAiBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const templates = getTemplatesForType(selectedType);
  const modeDef = getModeDefinition(selectedType);

  const generateWithAI = useCallback(async () => {
    if (!aiBrief.trim() || !user) return;
    setIsGenerating(true);
    setGeneratedData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/academy-practice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            practice_id: "__persona_chat__",
            system_override: `Tu es un expert en conception pédagogique de simulations IA professionnelles.

L'utilisateur te donne un TYPE de simulation et un BRIEF. Tu dois générer une pratique complète.

CONSIGNES :
- Génère un JSON VALIDE dans un bloc \`\`\`json ... \`\`\`
- Le JSON doit contenir : title, scenario (3-5 paragraphes immersifs), system_prompt (instructions détaillées pour l'IA coach), max_exchanges (8-15), difficulty (beginner/intermediate/advanced/expert), type_config (objet avec les paramètres spécifiques au mode), evaluation_rubric (tableau de {criterion, weight: 1-3, description})
- Le scenario doit être IMMERSIF : contexte réaliste, données chiffrées, enjeux clairs
- Le system_prompt doit être PRÉCIS : rôle de l'IA, comportement attendu, critères d'évaluation
- La rubric doit avoir 3-5 critères pertinents

TYPE DE SIMULATION : ${modeDef?.label || selectedType} (${modeDef?.description || ""})
UNIVERS : ${modeDef ? UNIVERSE_LABELS[modeDef.universe] : "Général"}
DIMENSIONS D'ÉVALUATION DU MODE : ${modeDef?.evaluationDimensions.join(", ") || "à définir"}`,
            messages: [{ role: "user", content: `Brief : ${aiBrief}\n\nGénère la pratique complète en JSON.` }],
          }),
        }
      );

      if (!resp.ok) throw new Error("Erreur de génération");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch {}
        }
      }

      // Extract JSON
      const jsonMatch = fullContent.match(/```json\s*\n?([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        setGeneratedData(parsed);
        toast.success("Pratique générée avec succès !");
      } else {
        throw new Error("Pas de JSON dans la réponse");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération");
    } finally {
      setIsGenerating(false);
    }
  }, [aiBrief, user, selectedType, modeDef]);

  const applyTemplate = (template: PracticeTemplate) => {
    onApply({
      title: template.title,
      scenario: template.scenario,
      system_prompt: template.system_prompt,
      max_exchanges: template.max_exchanges,
      difficulty: template.difficulty,
      practice_type: selectedType,
      type_config: template.type_config,
      evaluation_rubric: template.evaluation_rubric,
    });
    onClose();
  };

  const applyGenerated = () => {
    if (!generatedData) return;
    onApply({
      title: generatedData.title || "Pratique générée",
      scenario: generatedData.scenario || "",
      system_prompt: generatedData.system_prompt || "",
      max_exchanges: generatedData.max_exchanges || 10,
      difficulty: generatedData.difficulty || "intermediate",
      practice_type: selectedType,
      type_config: generatedData.type_config || {},
      evaluation_rubric: generatedData.evaluation_rubric || [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-3.5 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Wand2 className="h-4 w-4 text-primary" />
            Practice Designer — Création assistée
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex">
          {/* Left: Designer */}
          <div className="flex-1 min-w-0 overflow-y-auto p-5 space-y-5">
            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type de simulation</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getAllUniverses().map(u => (
                    <div key={u.value}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{u.label}</div>
                      {u.modes.map(([key, def]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {def.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {modeDef && (
                <p className="text-[10px] text-muted-foreground">{modeDef.description}</p>
              )}
            </div>

            {/* Mode selector: Templates vs AI */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="templates" className="flex-1 text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Templates ({templates.length})
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 text-xs gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Générer avec l'IA
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-3 mt-3">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Pas de templates pour ce mode</p>
                    <p className="text-xs mt-1">Utilisez l'onglet "Générer avec l'IA" ou créez manuellement</p>
                  </div>
                ) : (
                  templates.map((tpl, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border bg-card p-4 space-y-2.5 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{tpl.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{tpl.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{tpl.difficulty}</Badge>
                          <Badge variant="outline" className="text-[10px]">{tpl.max_exchanges} éch.</Badge>
                        </div>
                      </div>

                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                          <ChevronDown className="h-3 w-3" />
                          Voir le détail
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1">Scénario</p>
                            <p className="text-xs leading-relaxed">{tpl.scenario}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1">Critères d'évaluation</p>
                            <div className="space-y-1">
                              {tpl.evaluation_rubric.map((r, j) => (
                                <div key={j} className="text-xs flex gap-2">
                                  <span className="font-medium">{r.criterion}</span>
                                  <span className="text-muted-foreground">(×{r.weight})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="flex justify-end">
                        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => applyTemplate(tpl)}>
                          <Check className="h-3 w-3" />
                          Utiliser ce template
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Décrivez la pratique souhaitée</Label>
                  <Textarea
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    placeholder="Ex: Une simulation de négociation commerciale où l'apprenant doit vendre une solution IA de cybersécurité à un RSSI sceptique. Budget 500K€, concurrence forte. Niveau avancé."
                    rows={4}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    Plus votre brief est précis (contexte, objectifs, contraintes), meilleure sera la génération.
                  </div>
                </div>

                <Button
                  onClick={generateWithAI}
                  disabled={!aiBrief.trim() || isGenerating}
                  className="gap-2 w-full"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Générer avec l'IA</>
                  )}
                </Button>

                {/* Generated result */}
                <AnimatePresence>
                  {generatedData && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Résultat généré</p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground">Titre</p>
                          <p className="text-sm font-medium">{generatedData.title}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground">Scénario</p>
                          <p className="text-xs leading-relaxed line-clamp-4">{generatedData.scenario}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px]">{generatedData.difficulty}</Badge>
                          <Badge variant="outline" className="text-[10px]">{generatedData.max_exchanges} échanges</Badge>
                        </div>
                        {generatedData.evaluation_rubric && (
                          <div className="flex flex-wrap gap-1.5">
                            {generatedData.evaluation_rubric.map((r: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[9px]">
                                {r.criterion} (×{r.weight})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setPreviewOpen(true)}>
                          <Eye className="h-3 w-3" /> Prévisualiser
                        </Button>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={applyGenerated}>
                          <Check className="h-3 w-3" /> Appliquer
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Live preview */}
          <div className="w-80 border-l bg-muted/10 flex flex-col shrink-0">
            <div className="px-4 py-2.5 border-b">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                Aperçu de l'expérience
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {modeDef ? (
                <OnboardingOverlay
                  modeDef={modeDef}
                  universeName={modeDef ? UNIVERSE_LABELS[modeDef.universe] : ""}
                  difficulty={generatedData?.difficulty || "intermediate"}
                  onStart={() => {}}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  Sélectionnez un type
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
