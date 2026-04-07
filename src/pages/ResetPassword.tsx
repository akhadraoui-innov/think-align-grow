import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { DotPattern } from "@/components/ui/PatternBackground";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (link already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Erreur", description: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
      setSuccess(true);
      toast({ title: "Mot de passe mis à jour !", description: "Vous pouvez maintenant vous connecter." });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm">
          <div className="h-20 w-20 rounded-3xl bg-green-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Mot de passe mis à jour</h2>
          <p className="text-sm text-muted-foreground">Redirection vers la connexion…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-background">
      <DotPattern className="opacity-[0.04] absolute inset-0" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pillar-thinking shadow-lg shadow-primary/20 mb-3">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Nouveau mot de passe</h1>
        <p className="text-xs text-muted-foreground mt-1">Choisissez votre nouveau mot de passe</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        {!sessionReady ? (
          <div className="text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Vérification du lien en cours…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nouveau mot de passe
              </Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 bg-secondary border-border" required minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirm" type="password" placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="rounded-2xl h-12 bg-secondary border-border" required minLength={6}
              />
            </div>
            <Button type="submit" className="w-full rounded-2xl h-12 font-bold uppercase tracking-wide bg-primary text-primary-foreground shadow-lg shadow-primary/20" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mettre à jour
            </Button>
          </form>
        )}

        <div className="mt-5 text-center">
          <button type="button" className="text-xs text-primary font-semibold hover:underline" onClick={() => navigate("/auth")}>
            ← Retour à la connexion
          </button>
        </div>
      </motion.div>
    </div>
  );
}
