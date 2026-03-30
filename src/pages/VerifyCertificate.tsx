import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, CheckCircle2, XCircle, Clock, BookOpen, BarChart3, Calendar, Building2, ShieldCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-certificate", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-certificate?id=${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">GROWTHINNOV</span>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vérification de certificat</p>
      </motion.div>

      {isLoading ? (
        <Card className="w-full max-w-lg animate-pulse">
          <CardContent className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </CardContent>
        </Card>
      ) : error || !data ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="w-full max-w-lg border-red-200 dark:border-red-900">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Certificat introuvable</h2>
              <p className="text-sm text-muted-foreground">Ce certificat n'existe pas ou le lien est invalide.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          {data.revoked && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Certificat révoqué</p>
                {data.revoked_reason && <p className="text-xs text-red-600/80">{data.revoked_reason}</p>}
              </div>
            </div>
          )}

          <Card className={cn("overflow-hidden", data.revoked ? "border-red-300 dark:border-red-800 opacity-75" : "border-amber-300/50")}>
            {/* Gold bar */}
            <div className={cn("h-2", data.revoked ? "bg-red-500" : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500")} />
            <CardContent className="p-8">
              {/* Status badge */}
              <div className="flex justify-center mb-6">
                {data.valid ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 gap-1.5 px-3 py-1">
                    <ShieldCheck className="h-4 w-4" /> Certificat vérifié et valide
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1.5 px-3 py-1">
                    <XCircle className="h-4 w-4" /> Certificat invalide
                  </Badge>
                )}
              </div>

              {/* Certificate content */}
              <div className="text-center space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold mb-1">CERTIFICAT DE RÉUSSITE</p>
                  <h2 className="text-2xl font-bold">{data.holder_name}</h2>
                  {data.holder_title && <p className="text-sm text-muted-foreground">{data.holder_title}</p>}
                  {data.organization_name && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <Building2 className="h-3.5 w-3.5" /> {data.organization_name}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">a complété avec succès le parcours</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">« {data.path_name} »</p>
                  {data.difficulty && (
                    <Badge variant="outline" className="mt-1 capitalize text-xs">
                      {data.difficulty === "beginner" ? "Débutant" : data.difficulty === "advanced" ? "Avancé" : "Intermédiaire"}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 px-6 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                  <div className="text-center">
                    <BarChart3 className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                    <p className="text-xl font-bold">{data.score}%</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center">
                    <BookOpen className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                    <p className="text-xl font-bold">{data.modules_completed}</p>
                    <p className="text-[10px] text-muted-foreground">Modules</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                    <p className="text-xl font-bold">{data.total_time_hours}h</p>
                    <p className="text-[10px] text-muted-foreground">Formation</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(data.issued_at), "d MMMM yyyy", { locale: fr })}
                  </div>
                  <span className="font-mono text-[10px]">ID: {id?.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Vérifié par la plateforme GROWTHINNOV — <a href="https://think-align-grow.lovable.app" className="underline hover:text-foreground">think-align-grow.lovable.app</a>
          </p>
        </motion.div>
      )}
    </div>
  );
}
