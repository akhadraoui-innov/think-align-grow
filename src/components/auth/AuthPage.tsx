import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DotPattern } from "@/components/ui/PatternBackground";

type Mode = "login" | "signup" | "forgot";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/explore");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSent(true);
        toast({ title: "Vérifiez votre email !", description: "Un lien de confirmation vous a été envoyé." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
        toast({ title: "Email envoyé !", description: "Vérifiez votre boîte mail." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/explore`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate("/explore");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur Google";
      toast({ variant: "destructive", title: "Erreur", description: message });
      setLoading(false);
    }
  }

  if (sent && mode === "signup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm">
          <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2 uppercase">Vérifiez votre email</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte et recevoir vos 10 crédits gratuits.
          </p>
          <Button variant="outline" className="rounded-2xl" onClick={() => { setSent(false); setMode("login"); }}>
            Retour à la connexion
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden bg-background">
      <DotPattern className="opacity-[0.04] absolute inset-0" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pillar-thinking shadow-lg shadow-primary/20 mb-3">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">GROWTHINNOV</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "login" ? "Bon retour !" : mode === "signup" ? "Créer votre compte stratégique" : "Réinitialiser le mot de passe"}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        {/* Google OAuth */}
        {mode !== "forgot" && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl h-12 font-semibold border-border mb-4"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </Button>

            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nom complet
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl h-12 bg-secondary border-border"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl h-12 bg-secondary border-border"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 bg-secondary border-border"
                required
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl h-12 font-bold uppercase tracking-wide bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
          </Button>
        </form>

        <div className="mt-5 text-center space-y-2">
          {mode === "login" && (
            <>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors block w-full"
                onClick={() => setMode("forgot")}
              >
                Mot de passe oublié ?
              </button>
              <p className="text-xs text-muted-foreground">
                Pas de compte ?{" "}
                <button type="button" className="text-primary font-semibold hover:underline" onClick={() => setMode("signup")}>
                  S'inscrire
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <>
              <p className="text-xs text-muted-foreground/60 px-4">
                En vous inscrivant, vous recevez <strong>10 crédits gratuits</strong> pour essayer le Coach IA.
              </p>
              <p className="text-xs text-muted-foreground">
                Déjà un compte ?{" "}
                <button type="button" className="text-primary font-semibold hover:underline" onClick={() => setMode("login")}>
                  Se connecter
                </button>
              </p>
            </>
          )}
          {mode === "forgot" && (
            <button type="button" className="text-xs text-primary font-semibold hover:underline" onClick={() => setMode("login")}>
              ← Retour à la connexion
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
