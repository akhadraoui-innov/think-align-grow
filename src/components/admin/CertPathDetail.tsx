import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Award, BookOpen, Brain, Clock, GraduationCap, Save, Settings, Target, Trophy, Users, FileText, HelpCircle, Cpu, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODULE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof BookOpen; bg: string }> = {
  lesson: { label: "Cours", color: "text-blue-600", icon: BookOpen, bg: "bg-blue-500" },
  quiz: { label: "Quiz", color: "text-violet-600", icon: HelpCircle, bg: "bg-violet-500" },
  exercise: { label: "Exercice", color: "text-orange-600", icon: FileText, bg: "bg-orange-500" },
  practice: { label: "Pratique IA", color: "text-emerald-600", icon: MessageSquare, bg: "bg-emerald-500" },
};

interface CertPathDetailProps {
  pathId: string;
  paths: any[];
  certConfigs: any[];
  profiles: any[];
  onBack: () => void;
}

export function CertPathDetail({ pathId, paths, certConfigs, profiles, onBack }: CertPathDetailProps) {
  const qc = useQueryClient();
  const path = paths.find((p: any) => p.id === pathId);
  const config = certConfigs.find((c: any) => c.path_id === pathId);

  const [certEnabled, setCertEnabled] = useState(path?.certificate_enabled ?? false);
  const [minScore, setMinScore] = useState(config?.min_score ?? 70);
  const [templateKey, setTemplateKey] = useState(config?.template_key ?? "premium_gold");
  const [customSignature, setCustomSignature] = useState(config?.custom_signature ?? "");

  const { data: modules = [] } = useQuery({
    queryKey: ["cert-path-modules", pathId],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_path_modules")
        .select("*, academy_modules(*)")
        .eq("path_id", pathId)
        .order("sort_order");
      return data || [];
    },
  });

  const { data: pathCerts = [] } = useQuery({
    queryKey: ["cert-path-certs", pathId],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*")
        .eq("path_id", pathId)
        .order("issued_at", { ascending: false });
      return data || [];
    },
  });

  const { data: pathProgress = [] } = useQuery({
    queryKey: ["cert-path-progress", pathId],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_progress")
        .select("*")
        .in("module_id", modules.map((m: any) => m.module_id));
      return data || [];
    },
    enabled: modules.length > 0,
  });

  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

  const saveMut = useMutation({
    mutationFn: async () => {
      await supabase.from("academy_paths").update({ certificate_enabled: certEnabled }).eq("id", pathId);
      const configData = { min_score: minScore, template_key: templateKey, custom_signature: customSignature || null, path_id: pathId };
      if (config) {
        await supabase.from("academy_certificate_config").update(configData).eq("id", config.id);
      } else {
        await supabase.from("academy_certificate_config").insert(configData);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-paths-cert-config"] });
      qc.invalidateQueries({ queryKey: ["admin-cert-configs"] });
      toast.success("Configuration sauvegardée");
    },
  });

  const activeCerts = pathCerts.filter((c: any) => c.status === "active");
  const avgScore = activeCerts.length > 0 ? Math.round(activeCerts.reduce((s: number, c: any) => s + ((c.certificate_data as any)?.score || 0), 0) / activeCerts.length) : 0;
  const avgTime = activeCerts.length > 0 ? Math.round(activeCerts.reduce((s: number, c: any) => s + ((c.certificate_data as any)?.total_time_hours || 0), 0) / activeCerts.length * 10) / 10 : 0;
  const lastCert = activeCerts[0];

  if (!path) return null;

  const pathTags = Array.isArray(path.tags) ? path.tags : (typeof path.tags === "string" ? JSON.parse(path.tags) : []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{path.name}</h2>
            <Badge variant="outline" className="capitalize">{path.difficulty || "Intermédiaire"}</Badge>
            {certEnabled && <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">Certifiant</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{path.description}</p>
        </div>
      </div>

      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="gap-1.5"><Settings className="h-4 w-4" /> Paramétrage</TabsTrigger>
          <TabsTrigger value="certified" className="gap-1.5"><Trophy className="h-4 w-4" /> Certifiés</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5"><Brain className="h-4 w-4" /> Connaissances</TabsTrigger>
          <TabsTrigger value="flow" className="gap-1.5"><Target className="h-4 w-4" /> Parcours</TabsTrigger>
        </TabsList>

        {/* Config */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Configuration de la certification</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                <div>
                  <Label className="font-medium">Parcours certifiant</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Activer la délivrance de certificats pour ce parcours</p>
                </div>
                <Switch checked={certEnabled} onCheckedChange={setCertEnabled} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Score minimum requis (%)</Label>
                  <Input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">L'apprenant doit obtenir au moins ce score pour être certifié</p>
                </div>
                <div className="space-y-2">
                  <Label>Template du certificat</Label>
                  <Select value={templateKey} onValueChange={setTemplateKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium_gold">Premium Or</SelectItem>
                      <SelectItem value="classic_blue">Classique Bleu</SelectItem>
                      <SelectItem value="modern_dark">Moderne Sombre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Signature personnalisée</Label>
                <Input value={customSignature} onChange={e => setCustomSignature(e.target.value)} placeholder="Ex: Dr. Ammar Khadraoui, Directeur Pédagogique" />
              </div>

              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certified */}
        <TabsContent value="certified" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: GraduationCap, label: "Certifiés", value: activeCerts.length, color: "text-amber-500" },
              { icon: Trophy, label: "Score moyen", value: `${avgScore}%`, color: "text-emerald-500" },
              { icon: Clock, label: "Temps moyen", value: `${avgTime}h`, color: "text-blue-500" },
              { icon: Award, label: "Dernière certification", value: lastCert ? format(new Date(lastCert.issued_at), "d MMM yy", { locale: fr }) : "—", color: "text-primary" },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Apprenants certifiés</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apprenant</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Temps passé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pathCerts.map((c: any) => {
                    const p = profileMap.get(c.user_id);
                    const cd = c.certificate_data as any || {};
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{p?.display_name || "Inconnu"}</TableCell>
                        <TableCell><span className="font-bold">{cd.score || 0}%</span></TableCell>
                        <TableCell>{cd.total_time_hours || 0}h</TableCell>
                        <TableCell>{format(new Date(c.issued_at), "d MMM yyyy", { locale: fr })}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : "destructive"} className="text-xs">
                            {c.status === "active" ? "Actif" : "Révoqué"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pathCerts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun certifié pour ce parcours</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4" /> Objectifs pédagogiques</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((pm: any) => {
                  const mod = pm.academy_modules;
                  if (!mod) return null;
                  const objectives = Array.isArray(mod.objectives) ? mod.objectives : [];
                  const typeConf = MODULE_TYPE_CONFIG[mod.module_type] || MODULE_TYPE_CONFIG.lesson;
                  return (
                    <div key={pm.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-xs text-white", typeConf.bg)}>{typeConf.label}</Badge>
                        <span className="text-sm font-medium">{mod.title}</span>
                      </div>
                      {objectives.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {objectives.map((obj: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">{obj}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Aucun objectif défini</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {pathTags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Compétences visées</h4>
                  <div className="flex flex-wrap gap-2">
                    {pathTags.map((tag: string, i: number) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-primary/30">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow */}
        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Parcours pédagogique</CardTitle>
              <p className="text-xs text-muted-foreground">{modules.length} modules · {path.estimated_hours || 0}h estimées</p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

                <div className="space-y-0">
                  {modules.map((pm: any, idx: number) => {
                    const mod = pm.academy_modules;
                    if (!mod) return null;
                    const typeConf = MODULE_TYPE_CONFIG[mod.module_type] || MODULE_TYPE_CONFIG.lesson;
                    const Icon = typeConf.icon;
                    const isLast = idx === modules.length - 1;

                    return (
                      <div key={pm.id} className="relative flex gap-4 pb-8">
                        {/* Node */}
                        <div className="relative z-10 shrink-0">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-background",
                            typeConf.bg
                          )}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        </div>

                        {/* Content card */}
                        <div className={cn(
                          "flex-1 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow",
                          "border-border/50"
                        )}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn("text-xs", typeConf.color)}>{typeConf.label}</Badge>
                                <span className="text-xs text-muted-foreground">Étape {idx + 1}</span>
                              </div>
                              <h4 className="text-sm font-semibold">{mod.title}</h4>
                              {mod.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>}
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              {mod.estimated_minutes && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {mod.estimated_minutes} min
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs mt-1 capitalize">{mod.status}</Badge>
                            </div>
                          </div>

                          {/* Objectives inline */}
                          {Array.isArray(mod.objectives) && mod.objectives.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/30">
                              {(mod.objectives as string[]).slice(0, 3).map((obj, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{obj}</span>
                              ))}
                              {(mod.objectives as string[]).length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{(mod.objectives as string[]).length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* End node */}
                  {modules.length > 0 && (
                    <div className="relative flex gap-4">
                      <div className="relative z-10 shrink-0">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-background bg-amber-500">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Certification</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Score requis : {minScore}% · Template : {templateKey}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
