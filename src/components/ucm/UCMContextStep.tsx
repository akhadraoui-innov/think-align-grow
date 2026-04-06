import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UCMPageHeader } from "./UCMPageHeader";
import { FileText, Building2 } from "lucide-react";

interface Props {
  project: any;
  projectId: string;
}

function charFeedback(len: number) {
  if (len >= 500) return { label: "Excellent contexte", color: "text-emerald-600", bg: "bg-emerald-500" };
  if (len >= 200) return { label: "Bon début — enrichissez pour de meilleurs résultats", color: "text-amber-600", bg: "bg-amber-500" };
  if (len > 0) return { label: "Trop court — ajoutez plus de détails", color: "text-red-500", bg: "bg-red-500" };
  return { label: "", color: "text-muted-foreground", bg: "bg-muted" };
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
  const pct = Math.min((immersionLen / 500) * 100, 100);

  return (
    <div className="p-6 overflow-auto flex-1">
      <div className="max-w-4xl mx-auto space-y-6">
        <UCMPageHeader
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Contexte & Immersion"
          subtitle="Décrivez l'entreprise et son contexte de transformation IA"
        />

        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-semibold mb-1.5 block text-foreground flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Entreprise
              </label>
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
                className="bg-background border-accent/40 focus:border-accent"
              />
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className={cn("text-xs font-medium", feedback.color)}>{feedback.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{immersionLen} / 500+ car.</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", feedback.bg)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
