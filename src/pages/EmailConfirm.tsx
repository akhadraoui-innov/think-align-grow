import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "success" | "error";

export default function EmailConfirm() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [info, setInfo] = useState<{ email?: string; category?: string; error?: string }>({});

  useEffect(() => {
    if (!token) {
      setState("error");
      setInfo({ error: "Lien de confirmation invalide." });
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("confirm_email_opt_in", { _token: token });
      if (error) {
        setState("error");
        setInfo({ error: error.message });
        return;
      }
      const result = data as { ok: boolean; email?: string; category?: string; error?: string };
      if (result?.ok) {
        setState("success");
        setInfo({ email: result.email, category: result.category });
      } else {
        setState("error");
        setInfo({ error: result?.error === "invalid_or_expired" ? "Lien expiré ou déjà utilisé." : "Erreur inconnue" });
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Confirmation d'abonnement</CardTitle>
          <CardDescription>Double opt-in</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === "loading" && (
            <div className="py-6 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Confirmation en cours…</p>
            </div>
          )}
          {state === "success" && (
            <div className="py-4 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <div>
                <p className="font-semibold">Abonnement confirmé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {info.email} est maintenant inscrit{info.category ? ` à la catégorie « ${info.category} »` : ""}.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link to="/portal/preferences">Gérer mes préférences</Link>
              </Button>
            </div>
          )}
          {state === "error" && (
            <div className="py-4 space-y-3">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <p className="font-semibold">Confirmation impossible</p>
                <p className="text-sm text-muted-foreground mt-1">{info.error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
