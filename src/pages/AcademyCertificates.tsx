import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Calendar, BookOpen, Trophy, Clock, FileText, HelpCircle, MessageSquare, Download, Copy, GraduationCap, BarChart3, Timer, Linkedin, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { CertificateDownload } from "@/components/academy/CertificateDownload";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import QRCode from "qrcode";

const moduleTypeIcons: Record<string, any> = { lesson: BookOpen, quiz: HelpCircle, exercise: FileText, practice: MessageSquare };
const moduleTypeLabels: Record<string, string> = { lesson: "Leçon", quiz: "Quiz", exercise: "Exercice", practice: "Pratique" };

function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 90 ? "hsl(var(--primary))" : score >= 70 ? "hsl(45, 90%, 50%)" : "hsl(0, 70%, 55%)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}%</span>
    </div>
  );
}

const VERIFY_BASE = "https://think-align-grow.lovable.app/verify";

export default function AcademyCertificates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["user-certificates", user?.id], enabled: !!user?.id,
    queryFn: async () => { const { data } = await supabase.from("academy_certificates").select("*, academy_paths(name, description, difficulty, estimated_hours, skills, aptitudes, professional_outcomes)").eq("user_id", user!.id).order("issued_at", { ascending: false }); return data || []; },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-cert", user?.id], enabled: !!user?.id,
    queryFn: async () => { const { data } = await supabase.from("profiles").select("display_name, email").eq("user_id", user!.id).single(); return data; },
  });

  useEffect(() => {
    if (selectedCert) {
      QRCode.toDataURL(`${VERIFY_BASE}/${selectedCert.id}`, { width: 150, margin: 1, color: { dark: "#D4AF37", light: "#FFFFFF" } }).then(setQrUrl);
    }
  }, [selectedCert]);

  const difficultyColors: Record<string, string> = { beginner: "from-emerald-500 to-teal-500", intermediate: "from-blue-500 to-indigo-500", advanced: "from-purple-500 to-pink-500" };
  const difficultyLabels: Record<string, string> = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" };

  const totalCerts = certificates.length;
  const avgScore = totalCerts > 0 ? Math.round(certificates.reduce((s: number, c: any) => s + (c.certificate_data?.score || 0), 0) / totalCerts) : 0;
  const totalHours = certificates.reduce((s: number, c: any) => s + (c.certificate_data?.total_time_hours || 0), 0);
  const totalModules = certificates.reduce((s: number, c: any) => s + (c.certificate_data?.modules_completed || 0), 0);

  const copyVerifyLink = (id: string) => {
    navigator.clipboard.writeText(`${VERIFY_BASE}/${id}`);
    toast.success("Lien de vérification copié !");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/academy")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Mes Certificats</h1>
              <p className="text-sm text-muted-foreground">Parcours complétés et certifications obtenues</p>
            </div>
          </div>

          {totalCerts > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { icon: Award, label: "Certificats", value: totalCerts, color: "text-amber-500" },
                { icon: BarChart3, label: "Score moyen", value: `${avgScore}%`, color: "text-primary" },
                { icon: Timer, label: "Heures", value: `${totalHours}h`, color: "text-blue-500" },
                { icon: BookOpen, label: "Modules", value: totalModules, color: "text-emerald-500" },
              ].map((kpi, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50">
                    <CardContent className="p-3 text-center">
                      <kpi.icon className={cn("h-4 w-4 mx-auto mb-1", kpi.color)} />
                      <p className="text-lg font-bold">{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>)}</div>
          ) : certificates.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4"><GraduationCap className="h-8 w-8 text-amber-500" /></div>
              <h3 className="font-semibold text-lg mb-1">Aucun certificat</h3>
              <p className="text-sm text-muted-foreground mb-4">Complétez un parcours pour obtenir votre premier certificat.</p>
              <Button onClick={() => navigate("/academy")} size="sm"><BookOpen className="h-4 w-4 mr-2" /> Explorer</Button>
            </CardContent></Card>
          ) : certificates.map((cert: any, i: number) => {
            const path = cert.academy_paths;
            const gradient = difficultyColors[path?.difficulty || "intermediate"] || difficultyColors.intermediate;
            const certData = cert.certificate_data || {};
            return (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(`/portal/certificates/${cert.id}`)}>
                  <div className={cn("h-1.5 bg-gradient-to-r", gradient)} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <ScoreGauge score={certData.score || 0} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate">{path?.name || "Parcours"}</h3>
                          {path?.difficulty && <Badge variant="outline" className="text-[10px] capitalize shrink-0">{difficultyLabels[path.difficulty] || path.difficulty}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{path?.description || ""}</p>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(cert.issued_at), "d MMM yyyy", { locale: fr })}</span>
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{certData.modules_completed || 0} modules</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{certData.total_time_hours || 0}h</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <CertificateDownload
                          holderName={certData.holder_name || profile?.display_name || "Apprenant"}
                          pathName={path?.name || "Parcours"}
                          issuedAt={cert.issued_at}
                          score={certData.score || 0}
                          modulesCompleted={certData.modules_completed || 0}
                          totalTimeHours={certData.total_time_hours || 0}
                          certificateId={cert.id}
                          difficulty={path?.difficulty}
                          modulesDetail={certData.modules_detail}
                          skills={path?.skills as any}
                          aptitudes={path?.aptitudes as any}
                          professionalOutcomes={path?.professional_outcomes as any}
                          pathDescription={path?.description}
                        />
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-amber-500" /> Certificat de réussite</DialogTitle></DialogHeader>
          {selectedCert && (() => {
            const path = selectedCert.academy_paths;
            const certData = selectedCert.certificate_data || {};
            const modulesDetail = certData.modules_detail || [];
            const certNum = selectedCert.id.slice(0, 8).toUpperCase();
            return (
              <div className="space-y-6">
                <div className="relative rounded-2xl border-2 border-amber-300/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 text-center overflow-hidden">
                  <div className="absolute top-2 left-2 h-8 w-8 border-t-2 border-l-2 border-amber-400/50 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 h-8 w-8 border-t-2 border-r-2 border-amber-400/50 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 h-8 w-8 border-b-2 border-l-2 border-amber-400/50 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 h-8 w-8 border-b-2 border-r-2 border-amber-400/50 rounded-br-lg" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-0.5">GROWTHINNOV</p>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-amber-600/60 font-medium mb-4">AI ACCELERATION</p>
                  <h2 className="text-lg font-bold tracking-wide text-amber-800 dark:text-amber-400 mb-4">CERTIFICAT DE RÉUSSITE</h2>
                  <p className="text-xs text-muted-foreground mb-1">Décerné à</p>
                  <p className="font-display font-bold text-2xl text-foreground mb-3">{certData.holder_name || profile?.display_name || "Apprenant"}</p>
                  <p className="text-xs text-muted-foreground mb-1">Pour avoir complété avec succès le parcours</p>
                  <p className="font-bold text-base text-amber-700 dark:text-amber-400 mb-4">« {path?.name} »</p>
                  <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-amber-100/40 dark:bg-amber-900/20 border border-amber-300/30">
                    <div className="text-center"><p className="text-lg font-bold text-foreground">{certData.score || 0}%</p><p className="text-[9px] text-muted-foreground">Score</p></div>
                    <div className="w-px h-8 bg-amber-300/40" />
                    <div className="text-center"><p className="text-lg font-bold text-foreground">{certData.modules_completed || 0}</p><p className="text-[9px] text-muted-foreground">Modules</p></div>
                    <div className="w-px h-8 bg-amber-300/40" />
                    <div className="text-center"><p className="text-lg font-bold text-foreground">{certData.total_time_hours || 0}h</p><p className="text-[9px] text-muted-foreground">Formation</p></div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-300/30 flex items-end justify-between">
                    <div className="text-left text-[10px] text-muted-foreground space-y-0.5">
                      <p>{format(new Date(selectedCert.issued_at), "d MMMM yyyy", { locale: fr })}</p>
                      <p className="font-mono">N° {certNum}</p>
                    </div>
                    {qrUrl && <img src={qrUrl} alt="QR vérification" className="h-16 w-16 rounded" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
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
                    skills={path?.skills as any}
                    aptitudes={path?.aptitudes as any}
                    professionalOutcomes={path?.professional_outcomes as any}
                    pathDescription={path?.description}
                  />
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyVerifyLink(selectedCert.id)}>
                    <Copy className="h-4 w-4" /> Copier le lien
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${VERIFY_BASE}/${selectedCert.id}`)}`, "_blank")}>
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </Button>
                  {navigator.share && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.share({ title: `Certificat GROWTHINNOV — ${path?.name}`, url: `${VERIFY_BASE}/${selectedCert.id}` })}>
                      <Share2 className="h-4 w-4" /> Partager
                    </Button>
                  )}
                </div>

                {modulesDetail.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Détail par module</h3>
                    <div className="space-y-2">
                      {modulesDetail.map((mod: any, idx: number) => {
                        const Icon = moduleTypeIcons[mod.type] || BookOpen;
                        const scoreColor = mod.score >= 90 ? "text-emerald-600" : mod.score >= 70 ? "text-amber-600" : "text-red-500";
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{mod.title}</p>
                                <Badge variant="secondary" className="text-[9px] shrink-0">{moduleTypeLabels[mod.type] || mod.type}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Progress value={mod.score} className="h-1.5 flex-1 max-w-[140px]" />
                                <span className={cn("text-xs font-bold", scoreColor)}>{mod.score}%</span>
                              </div>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" />{mod.time_minutes}min</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
