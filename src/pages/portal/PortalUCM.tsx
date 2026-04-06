import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Lightbulb, Building2, Loader2, FolderOpen, Layers, BarChart3 } from "lucide-react";
import { useUCMProjects, useCreateUCMProject } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageTransition } from "@/components/ui/PageTransition";

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", class: "bg-primary/10 text-primary" },
  analyzed: { label: "Analysé", class: "bg-emerald-500/10 text-emerald-600" },
  archived: { label: "Archivé", class: "bg-muted text-muted-foreground" },
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

  const totalProjects = projects?.length || 0;
  const totalUC = projects?.reduce((sum: number, p: any) => sum + (p.ucm_use_cases?.[0]?.count || 0), 0) || 0;
  const inProgress = projects?.filter((p: any) => p.status === "in_progress").length || 0;

  return (
    <PageTransition>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
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
                <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Nouveau projet</DialogTitle>
              </DialogHeader>
              <Separator />
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nom de l'entreprise *</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Société Générale" className="mt-1.5" />
                </div>
                <div>
                  <Label>Contexte de transformation (optionnel)</Label>
                  <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Décrivez les enjeux de transformation IA…" rows={3} className="mt-1.5" />
                </div>
                <Button onClick={handleCreate} disabled={!company.trim() || createProject.isPending} className="w-full">
                  {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Créer le projet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProjects}</p>
                <p className="text-xs text-muted-foreground">Projets</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUC}</p>
                <p className="text-xs text-muted-foreground">Use Cases générés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgress}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
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
            {projects.map((p: any) => {
              const ucCount = p.ucm_use_cases?.[0]?.count || 0;
              const st = statusConfig[p.status] || statusConfig.draft;
              return (
                <Card key={p.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group" onClick={() => navigate(`/portal/ucm/${p.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-lg">{(p as any).ucm_sectors?.icon || "🏢"}</span>
                        {p.company || "Sans nom"}
                      </CardTitle>
                      <Badge className={st.class} variant="secondary">{st.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {p.sector_label && <p className="text-sm text-muted-foreground">{p.sector_label}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ucCount} UC</span>
                      <span>{format(new Date(p.created_at), "d MMM yyyy", { locale: fr })}</span>
                    </div>
                    {ucCount > 0 && <Progress value={Math.min((ucCount / 10) * 100, 100)} className="h-1.5" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
