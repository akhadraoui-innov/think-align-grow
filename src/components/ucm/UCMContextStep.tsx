import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  project: any;
  projectId: string;
}

function charFeedback(len: number) {
  if (len >= 500) return { label: "Excellent contexte", color: "text-emerald-600" };
  if (len >= 200) return { label: "Bon début — enrichissez pour de meilleurs résultats", color: "text-amber-600" };
  if (len > 0) return { label: "Trop court — ajoutez plus de détails", color: "text-red-500" };
  return { label: "", color: "text-muted-foreground" };
}

export function UCMContextStep({ project, projectId }: Props) {
  const qc = useQueryClient();
  const [immersionLen, setImmersionLen] = useState((project.immersion || "").length);

  const updateProject = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("ucm_projects").update(updates).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-project", projectId] }),
  });

  const feedback = charFeedback(immersionLen);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Contexte & Immersion</h2>
        <p className="text-sm text-muted-foreground mt-1">Décrivez l'entreprise et son contexte de transformation IA</p>
      </div>

      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-foreground">Entreprise</label>
            <Input
              defaultValue={project.company}
              onBlur={(e) => updateProject.mutate({ company: e.target.value })}
              className="text-base bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-foreground">Contexte général</label>
            <Textarea
              defaultValue={project.context || ""}
              onBlur={(e) => updateProject.mutate({ context: e.target.value })}
              rows={3}
              placeholder="Décrivez le contexte de transformation IA…"
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-foreground">Immersion détaillée</label>
            <Textarea
              defaultValue={project.immersion || ""}
              onChange={(e) => setImmersionLen(e.target.value.length)}
              onBlur={(e) => updateProject.mutate({ immersion: e.target.value })}
              rows={8}
              placeholder="Organisation, enjeux stratégiques, maturité digitale, SI existant, défis clés, culture d'entreprise…"
              className="bg-background border-primary/30"
            />
            <div className="flex justify-between items-center mt-1.5">
              <span className={cn("text-xs", feedback.color)}>{feedback.label}</span>
              <span className="text-xs text-muted-foreground">{immersionLen} caractères</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
