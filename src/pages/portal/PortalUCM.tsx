import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Lightbulb, Building2, Loader2, FolderOpen, Layers, BarChart3, Sparkles } from "lucide-react";
import { useUCMProjects, useCreateUCMProject } from "@/hooks/useUCMProject";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageTransition } from "@/components/ui/PageTransition";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; dot: string }> = {
  draft: { label: "Brouillon", dot: "bg-muted-foreground" },
  in_progress: { label: "En cours", dot: "bg-primary animate-pulse" },
  analyzed: { label: "Analysé", dot: "bg-emerald-500" },
  archived: { label: "Archivé", dot: "bg-muted-foreground" },
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
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/[0.06] via-background to-accent/[0.04] border p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                AI Value Builder
              </h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-lg">
                Générez et analysez des use cases IA pour transformer votre entreprise en une organisation AI-first.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" /> Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Nouveau projet
                  </DialogTitle>
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

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <AnimatedCounter value={String(totalProjects)} label="Projets" />
            <AnimatedCounter value={String(totalUC)} label="Use Cases" />
            <AnimatedCounter value={String(inProgress)} label="En cours" />
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !projects?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Aucun projet</h3>
              <p className="text-muted-foreground mt-1 text-sm">Créez votre premier projet pour commencer</p>
              <Button onClick={() => setOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Créer un projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p: any, i: number) => {
              const ucCount = p.ucm_use_cases?.[0]?.count || 0;
              const st = statusConfig[p.status] || statusConfig.draft;
              return (
                <Card
                  key={p.id}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  onClick={() => navigate(`/portal/ucm/${p.id}`)}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{(p as any).ucm_sectors?.icon || "🏢"}</span>
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {p.company || "Sans nom"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", st.dot)} />
                        <span className="text-[10px] text-muted-foreground font-medium">{st.label}</span>
                      </div>
                    </div>

                    {p.sector_label && (
                      <p className="text-xs text-muted-foreground mb-3">{p.sector_label}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{ucCount} UC</span>
                      <span>{format(new Date(p.created_at), "d MMM yyyy", { locale: fr })}</span>
                    </div>
                    {ucCount > 0 && (
                      <Progress value={Math.min((ucCount / 10) * 100, 100)} className="h-1 mt-3" />
                    )}
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
