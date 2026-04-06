import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lightbulb, Building2, Loader2, FolderOpen } from "lucide-react";
import { useUCMProjects, useCreateUCMProject } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageTransition } from "@/components/ui/PageTransition";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  analyzed: "bg-green-500/10 text-green-600",
  archived: "bg-muted text-muted-foreground",
};

export default function PortalUCM() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useUCMProjects();
  const createProject = useCreateUCMProject();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");

  const handleCreate = async () => {
    if (!company.trim()) return;
    try {
      const project = await createProject.mutateAsync({ company, context });
      setOpen(false);
      setCompany("");
      setContext("");
      navigate(`/portal/ucm/${project.id}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
      <PageTransition>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                AI Value Builder
              </h1>
              <p className="text-muted-foreground mt-1">Générez et analysez des use cases IA pour transformer votre entreprise</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Nouveau projet</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau projet UCM</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium">Nom de l'entreprise *</label>
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Société Générale" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contexte (optionnel)</label>
                    <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Décrivez le contexte de transformation..." rows={3} />
                  </div>
                  <Button onClick={handleCreate} disabled={!company.trim() || createProject.isPending} className="w-full">
                    {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Créer le projet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !projects?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucun projet</h3>
                <p className="text-muted-foreground mt-1">Créez votre premier projet pour commencer l'analyse IA</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p: any) => (
                <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/portal/ucm/${p.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {p.company || "Sans nom"}
                      </CardTitle>
                      <Badge className={statusColors[p.status] || ""} variant="secondary">{p.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {p.sector_label && <p className="text-sm text-muted-foreground">{(p as any).ucm_sectors?.icon} {p.sector_label}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(p.created_at), "d MMM yyyy", { locale: fr })}
                      {p.ucm_use_cases?.[0]?.count ? ` • ${p.ucm_use_cases[0].count} UC` : ""}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
  );
}
