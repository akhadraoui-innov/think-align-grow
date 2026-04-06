import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2, BarChart3, Target } from "lucide-react";
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

const SECTIONS = [
  {
    title: "Situation actuelle",
    icon: Building2,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/5",
    fields: [
      { key: "situation", label: "Description de la situation", placeholder: "Décrivez la situation actuelle de ce cas d'usage…", type: "textarea" },
      { key: "tools", label: "Outils utilisés", placeholder: "CRM, Excel, Teams, SAP…", type: "input" },
      { key: "team", label: "Équipe concernée", placeholder: "Taille, rôles, compétences…", type: "input" },
    ],
  },
  {
    title: "Volumétrie & Enjeux",
    icon: BarChart3,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/5",
    fields: [
      { key: "volumes", label: "Volumes traités", placeholder: "Nombre de transactions, fréquence…", type: "textarea" },
      { key: "pain_points", label: "Points de douleur", placeholder: "Perte de temps, erreurs, insatisfaction…", type: "textarea" },
    ],
  },
  {
    title: "Objectifs & Contraintes",
    icon: Target,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/5",
    fields: [
      { key: "objectives", label: "Objectifs visés", placeholder: "Réduction de X%, automatisation de Y…", type: "textarea" },
      { key: "constraints", label: "Contraintes", placeholder: "Budget, réglementation, intégration legacy…", type: "textarea" },
    ],
  },
] as const;

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

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
      ALL_KEYS.forEach((key) => { f[key] = (existing as any)[key] || ""; });
      setForm(f);
    } else {
      setForm({});
    }
  }, [existing]);

  const filledCount = ALL_KEYS.filter((k) => (form[k] || "").trim()).length;

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { use_case_id: useCaseId, organization_id: organizationId, ...form };
      if (existing) {
        const { error } = await supabase.from("ucm_uc_contexts").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ucm_uc_contexts").insert([payload]);
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
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{filledCount}/{ALL_KEYS.length} champs</Badge>
          </div>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {SECTIONS.map((section, si) => {
            const Icon = section.icon;
            return (
              <div key={si}>
                {si > 0 && <Separator className="mb-5" />}
                <div className={`rounded-lg p-4 ${section.bgColor}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${section.iconColor}`} />
                    <span className="text-sm font-semibold">{section.title}</span>
                  </div>
                  <div className="space-y-3">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}</Label>
                        {field.type === "input" ? (
                          <Input
                            value={form[field.key] || ""}
                            onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="mt-1"
                          />
                        ) : (
                          <Textarea
                            value={form[field.key] || ""}
                            onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={2}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
