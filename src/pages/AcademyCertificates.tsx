import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Download, Calendar, BookOpen, Trophy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export default function AcademyCertificates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["user-certificates", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*, academy_paths(name, description, difficulty, estimated_hours)")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-cert", user?.id],
    enabled: !!user?.id,
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
        {/* Header */}
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
              <p className="text-xs text-muted-foreground">{certificates.length} certificat{certificates.length > 1 ? "s" : ""} obtenu{certificates.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="font-semibold mb-1">Aucun certificat pour le moment</h3>
                <p className="text-sm text-muted-foreground mb-4">Complétez un parcours de formation pour obtenir votre premier certificat.</p>
                <Button onClick={() => navigate("/academy")} size="sm">
                  <BookOpen className="h-4 w-4 mr-2" /> Explorer les parcours
                </Button>
              </CardContent>
            </Card>
          ) : (
            certificates.map((cert: any, i: number) => {
              const path = cert.academy_paths;
              const gradient = difficultyColors[path?.difficulty || "intermediate"] || difficultyColors.intermediate;
              const certData = cert.certificate_data || {};

              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCert(cert)}>
                    <div className={cn("h-2 bg-gradient-to-r", gradient)} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient)}>
                          <Trophy className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate">{path?.name || "Parcours"}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path?.description || ""}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(cert.issued_at), "d MMMM yyyy", { locale: fr })}
                            </span>
                            {certData.score && (
                              <Badge variant="secondary" className="text-[10px]">Score: {certData.score}%</Badge>
                            )}
                            {path?.difficulty && (
                              <Badge variant="outline" className="text-[10px] capitalize">{path.difficulty}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Certificate Detail Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Certificat de réussite
            </DialogTitle>
          </DialogHeader>
          {selectedCert && (() => {
            const path = selectedCert.academy_paths;
            const certData = selectedCert.certificate_data || {};
            const gradient = difficultyColors[path?.difficulty || "intermediate"] || difficultyColors.intermediate;

            return (
              <div className="space-y-6">
                {/* Certificate visual */}
                <div className="relative rounded-2xl border-2 border-amber-300/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 text-center overflow-hidden">
                  {/* Decorative corners */}
                  <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-amber-400/40 rounded-tl-lg" />
                  <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-amber-400/40 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-amber-400/40 rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-amber-400/40 rounded-br-lg" />

                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>

                  <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-bold mb-2">Certificat de réussite</p>
                  <h2 className="font-display font-bold text-lg mb-1">{path?.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">Délivré à</p>
                  <p className="font-display font-bold text-xl text-foreground">{profile?.display_name || profile?.email || "Apprenant"}</p>

                  <div className="mt-6 pt-4 border-t border-amber-300/30 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <span>{format(new Date(selectedCert.issued_at), "d MMMM yyyy", { locale: fr })}</span>
                    {certData.score && <span>Score : {certData.score}%</span>}
                    {path?.estimated_hours && <span>{path.estimated_hours}h de formation</span>}
                  </div>
                </div>

                {/* Details */}
                {certData.modules_completed && (
                  <div className="text-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Modules complétés</p>
                    <p className="font-medium">{certData.modules_completed} modules</p>
                  </div>
                )}
                {certData.total_time_hours && (
                  <div className="text-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Temps total</p>
                    <p className="font-medium">{certData.total_time_hours}h</p>
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
