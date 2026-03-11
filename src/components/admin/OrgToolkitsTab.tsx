import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Layers, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  toolkits: any[];
  organizationId: string;
}

export function OrgToolkitsTab({ toolkits, organizationId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggle = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("organization_toolkits")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-org-toolkits", organizationId] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{toolkits.length} toolkit{toolkits.length > 1 ? "s" : ""} assigné{toolkits.length > 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" className="gap-2" disabled>
          <Layers className="h-4 w-4" />
          Assigner un toolkit
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/30">
        {toolkits.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun toolkit assigné à cette organisation.
          </div>
        ) : (
          toolkits.map((t: any) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-lg">
                {t.toolkits?.icon_emoji || "🚀"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.toolkits?.name || "Toolkit"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Max {t.max_members ?? "∞"} membres</span>
                  <span>·</span>
                  <span>Assigné le {format(new Date(t.created_at), "dd MMM yyyy", { locale: fr })}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={t.toolkits?.status === "published" ? "default" : "secondary"} className="text-xs">
                  {t.toolkits?.status || "draft"}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.is_active ? "Actif" : "Inactif"}</span>
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={() => handleToggle(t.id, t.is_active)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
