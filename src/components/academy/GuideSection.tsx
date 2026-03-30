import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText, Loader2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface GuideSectionProps {
  pathId: string;
  guideDocument: any;
  isCompleted: boolean;
  user: any;
}

export function GuideSection({ pathId, guideDocument, isCompleted, user }: GuideSectionProps) {
  const navigate = useNavigate();
  const [guide, setGuide] = useState<any>(guideDocument || null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const generateGuide = async () => {
    setLoading(true);
    try {
      const resp = await supabase.functions.invoke("academy-path-document", {
        body: { path_id: pathId, action: "generate" },
      });
      if (resp.data?.document) {
        setGuide(resp.data.document);
        toast.success("Livret de cours généré !");
      } else {
        toast.error("Erreur lors de la génération");
      }
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const sendByEmail = async () => {
    if (!user) return;
    setSendingEmail(true);
    try {
      await supabase.from("academy_document_sends").insert({
        user_id: user.id,
        path_id: pathId,
        email: user.email,
      } as any);
      toast.success("Demande d'envoi enregistrée !");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!guide && !isCompleted) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ScrollText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Livret de cours complet</h3>
                <p className="text-xs text-muted-foreground">
                  {guide ? `Généré le ${new Date(guide.generated_at).toLocaleDateString("fr-FR")}` : "Document pédagogique de référence du parcours"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {guide && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/portal/guide/${pathId}`)} className="gap-1.5 text-xs">
                    <ExternalLink className="h-3 w-3" /> Consulter le livret
                  </Button>
                  {user && (
                    <Button variant="outline" size="sm" onClick={sendByEmail} disabled={sendingEmail} className="gap-1.5 text-xs">
                      {sendingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                      Recevoir par email
                    </Button>
                  )}
                </>
              )}
              {!guide && (
                <Button size="sm" onClick={generateGuide} disabled={loading} className="gap-1.5 text-xs">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScrollText className="h-3 w-3" />}
                  {loading ? "Génération..." : "Générer le livret"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
