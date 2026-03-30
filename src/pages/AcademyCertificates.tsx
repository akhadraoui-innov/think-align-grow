import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Calendar, BookOpen, Trophy, Clock, FileText, HelpCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CertificateDownload } from "@/components/academy/CertificateDownload";
import { Progress } from "@/components/ui/progress";

const moduleTypeIcons: Record<string, any> = { lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare };

export default function AcademyCertificates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["user-certificates", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_certificates").select("*, academy_paths(name, description, difficulty, estimated_hours)").eq("user_id", user!.id).order("issued_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-cert", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, email").eq("user_id", user!.id).single();
      return data;
    },
  });

  const difficultyColors: Record<string, string> = {
    beginner: "from-emerald-500 to-teal-500",
    intermediate: "from-blue-500 to-indigo-500",
    advanced: "from-purple-500 to-pink-500",
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Mes certificats</h1>
              <p className="text-xs text-muted-foreground">{certificates.length} certificat{certificates.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>)}</div>
          ) : certificates.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4"><Award className="h-8 w-8 text-amber-500" /></div>
              <h3 className="font-semibold mb-1">Aucun certificat</h3>
              <p className="text-sm text-muted-foreground mb-4">Complétez un parcours pour obtenir votre premier certificat.</p>
              <Button onClick={() => navigate("/academy")} size="sm"><BookOpen className="h-4 w-4 mr-2" /> Explorer</Button>
            </CardContent></Card>
          ) : certificates.map((cert: any, i: number) => {
            const path = cert.academy_paths;
            const gradient = difficultyColors[path?.difficulty || "intermediate"] || difficultyColors.intermediate;
            const certData = cert.certificate_data || {};
            return (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCert(cert)}>
                  <div className={cn("h-2 bg-gradient-to-r", gradient)} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient)}><Trophy className="h-7 w-7" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{path?.name || "Parcours"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path?.description || ""}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(cert.issued_at), "d MMMM yyyy", { locale: fr })}</span>
                          {certData.score && <Badge variant="secondary" className="text-[10px]">Score: {certData.score}%</Badge>}
                          {path?.difficulty && <Badge variant="outline" className="text-[10px] capitalize">{path.difficulty}</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" /> Certificat de réussite</DialogTitle>
          </DialogHeader>
          {selectedCert && (() => {
            const path = selectedCert.academy_paths;
            const certData = selectedCert.certificate_data || {};
            const gradient = difficultyColors[path?.difficulty || "intermediate"] || difficultyColors.intermediate;
            const modulesDetail = certData.modules_detail || [];

            return (
              <div className="space-y-6">
                {/* Certificate visual */}
                <div className="relative rounded-2xl border-2 border-amber-300/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 text-center overflow-hidden">
                  <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-amber-400/40 rounded-tl-lg" />
                  <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-amber-400/40 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-amber-400/40 rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-amber-400/40 rounded-br-lg" />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg"><Trophy className="h-6 w-6 text-white" /></div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-1">GROWTHINNOV</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 font-medium mb-3">Certificat de réussite</p>
                  <h2 className="font-display font-bold text-lg mb-1">{path?.name}</h2>
                  <p className="text-sm text-muted-foreground mb-3">Délivré à</p>
                  <p className="font-display font-bold text-xl text-foreground">{certData.holder_name || profile?.display_name || "Apprenant"}</p>
                  <div className="mt-6 pt-4 border-t border-amber-300/30 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <span>{format(new Date(selectedCert.issued_at), "d MMMM yyyy", { locale: fr })}</span>
                    {certData.score && <span>Score : {certData.score}%</span>}
                    {certData.total_time_hours && <span>{certData.total_time_hours}h</span>}
                  </div>
                </div>

                {/* Modules breakdown */}
                {modulesDetail.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Détail par module</h3>
                    <div className="space-y-2">
                      {modulesDetail.map((mod: any, idx: number) => {
                        const Icon = moduleTypeIcons[mod.type] || BookOpen;
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{mod.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={mod.score} className="h-1 flex-1 max-w-[100px]" />
                                <span className="text-[10px] font-semibold text-primary">{mod.score}%</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />{mod.time_minutes}min
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Download */}
                <div className="flex justify-end">
                  <CertificateDownload
                    holderName={certData.holder_name || profile?.display_name || "Apprenant"}
                    pathName={path?.name || "Parcours"}
                    issuedAt={selectedCert.issued_at}
                    score={certData.score || 0}
                    modulesCompleted={certData.modules_completed || 0}
                    totalTimeHours={certData.total_time_hours || 0}
                    certificateId={selectedCert.id}
                    difficulty={path?.difficulty}
                    modulesDetail={modulesDetail}
                  />
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
