import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  project: any;
  projectId: string;
}

export function UCMContextStep({ project, projectId }: Props) {
  const qc = useQueryClient();

  const updateProject = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("ucm_projects").update(updates).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ucm-project", projectId] }),
  });

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
              onBlur={(e) => updateProject.mutate({ immersion: e.target.value })}
              rows={5}
              placeholder="Organisation, enjeux stratégiques, maturité digitale…"
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
