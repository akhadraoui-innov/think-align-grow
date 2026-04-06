import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCaseId: string;
  useCaseName: string;
  organizationId: string;
}

const FIELDS = [
  { key: "situation", label: "Situation actuelle", placeholder: "Décrivez la situation actuelle de ce cas d'usage…" },
  { key: "tools", label: "Outils utilisés", placeholder: "CRM, Excel, Teams, SAP…" },
  { key: "team", label: "Équipe concernée", placeholder: "Taille, rôles, compétences…" },
  { key: "volumes", label: "Volumes traités", placeholder: "Nombre de transactions, fréquence…" },
  { key: "pain_points", label: "Points de douleur", placeholder: "Perte de temps, erreurs, insatisfaction…" },
  { key: "objectives", label: "Objectifs visés", placeholder: "Réduction de X%, automatisation de Y…" },
  { key: "constraints", label: "Contraintes", placeholder: "Budget, réglementation, intégration legacy…" },
] as const;

export function UCMContextForm({ open, onOpenChange, useCaseId, useCaseName, organizationId }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: existing } = useQuery({
    queryKey: ["ucm-context", useCaseId],
    enabled: open && !!useCaseId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ucm_uc_contexts")
        .select("*")
        .eq("use_case_id", useCaseId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      const f: Record<string, string> = {};
      FIELDS.forEach(({ key }) => { f[key] = (existing as any)[key] || ""; });
      setForm(f);
    } else {
      setForm({});
    }
  }, [existing]);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { use_case_id: useCaseId, ...form };
      if (existing) {
        const { error } = await supabase.from("ucm_uc_contexts").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ucm_uc_contexts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Contexte sauvegardé");
      qc.invalidateQueries({ queryKey: ["ucm-context", useCaseId] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contexte : {useCaseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              {key === "tools" || key === "team" ? (
                <Input
                  value={form[key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              ) : (
                <Textarea
                  value={form[key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={2}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
