import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { use2FA, type EnrollResult } from "@/hooks/use2FA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function AccountSecurityInner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get("setup") === "1";
  const { user } = useAuth();
  const { factors, hasVerifiedTotp, loading, enroll, verify, unenroll, refresh } = use2FA();
  const [enrollment, setEnrollment] = useState<EnrollResult | null>(null);
  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);
  const [requires2fa, setRequires2fa] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("requires_2fa", { _user_id: user.id }).then(({ data }) => {
      setRequires2fa(!!data);
    });
  }, [user, factors]);

  const verifiedFactor = useMemo(
    () => factors.find((f) => f.factor_type === "totp" && f.status === "verified"),
    [factors],
  );

  async function handleStartEnroll() {
    setWorking(true);
    try {
      const r = await enroll();
      setEnrollment(r);
      setCode("");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'enrôlement");
    } finally {
      setWorking(false);
    }
  }

  async function handleVerify() {
    if (!enrollment || code.length !== 6) return;
    setWorking(true);
    try {
      await verify(enrollment.factorId, code);
      toast.success("Authentification à deux facteurs activée.");
      setEnrollment(null);
      setCode("");
      await refresh();
      // If user came from a forced-2FA redirect, send them back to admin
      if (isSetup) navigate("/admin", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Code incorrect. Réessayez.");
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable(factorId: string) {
    setWorking(true);
    try {
      await unenroll(factorId);
      toast.success("2FA désactivée.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la désactivation");
    } finally {
      setWorking(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copié`),
      () => toast.error("Copie impossible"),
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sécurité du compte</h1>
        <p className="text-sm text-muted-foreground">
          Renforcez votre compte avec une authentification à deux facteurs (TOTP).
        </p>
      </div>

      {requires2fa && !hasVerifiedTotp && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <ShieldAlert className="h-4 w-4" /> Activation requise
            </CardTitle>
            <CardDescription>
              En tant que membre de l'équipe SaaS, l'authentification à deux facteurs est
              obligatoire pour accéder à l'administration.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Authentification à deux facteurs
            {hasVerifiedTotp && <Badge variant="default" className="ml-2">Activée</Badge>}
            {!hasVerifiedTotp && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
          </CardTitle>
          <CardDescription>
            Utilisez Google Authenticator, 1Password, Authy ou tout client TOTP compatible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasVerifiedTotp && verifiedFactor && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="text-sm">
                <div className="font-medium">{verifiedFactor.friendly_name || "TOTP"}</div>
                <div className="text-xs text-muted-foreground">
                  Activée le {new Date(verifiedFactor.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={working || requires2fa}
                onClick={() => handleDisable(verifiedFactor.id)}
                title={requires2fa ? "Désactivation impossible : 2FA requise pour votre rôle" : ""}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Désactiver
              </Button>
            </div>
          )}

          {!hasVerifiedTotp && !enrollment && (
            <Button onClick={handleStartEnroll} disabled={working}>
              {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Activer la 2FA
            </Button>
          )}

          {enrollment && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4 flex flex-col items-center gap-3">
                <img
                  src={enrollment.qrCode}
                  alt="QR code 2FA"
                  className="h-48 w-48 rounded-md border bg-white p-2"
                />
                <div className="text-xs text-muted-foreground text-center">
                  Scannez ce QR code avec votre application d'authentification.
                </div>
                <div className="w-full">
                  <div className="text-xs text-muted-foreground mb-1">
                    Ou saisissez ce secret manuellement :
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-muted px-2 py-1.5 text-xs font-mono break-all">
                      {enrollment.secret}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copy(enrollment.secret, "Secret")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Saisissez le code à 6 chiffres généré par votre application
                </label>
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleVerify} disabled={working || code.length !== 6}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Vérifier et activer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnrollment(null);
                    setCode("");
                  }}
                  disabled={working}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountSecurity() {
  return (
    <AuthGuard>
      <AccountSecurityInner />
    </AuthGuard>
  );
}
