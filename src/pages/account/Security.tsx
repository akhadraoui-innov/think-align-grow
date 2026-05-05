import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { use2FA, type EnrollResult } from "@/hooks/use2FA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, Copy, Trash2, Smartphone, Apple, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [verifyError, setVerifyError] = useState<string | null>(null);

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
    setVerifyError(null);
    try {
      await verify(enrollment.factorId, code);
      toast.success("Authentification à deux facteurs activée.");
      setEnrollment(null);
      setCode("");
      await refresh();
      // If user came from a forced-2FA redirect, send them back to admin
      if (isSetup) navigate("/admin", { replace: true });
    } catch (e: any) {
      const msg = e?.message ?? "Code incorrect. Réessayez.";
      setVerifyError(msg);
      toast.error(msg);
    } finally {
      setWorking(false);
    }
  }

  function parseOtpAuthUri(uri: string): { account: string; issuer: string } {
    try {
      const u = new URL(uri);
      const label = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
      const issuerParam = u.searchParams.get("issuer") ?? "";
      const [issuerFromLabel, account] = label.includes(":")
        ? label.split(":")
        : ["", label];
      return {
        account: account || label,
        issuer: issuerParam || issuerFromLabel || "Heeplab",
      };
    } catch {
      return { account: "", issuer: "Heeplab" };
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

          {enrollment && (() => {
            const { account, issuer } = parseOtpAuthUri(enrollment.uri);
            return (
            <div className="space-y-5">
              <Alert className="border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-semibold">
                  Le QR code se scanne depuis une <u>application d'authentification</u>, pas l'appareil photo
                </AlertTitle>
                <AlertDescription className="text-xs space-y-2 mt-1">
                  <p>
                    Si vous ouvrez l'appareil photo natif de votre téléphone, vous verrez seulement
                    une longue URL (<code className="text-[10px]">otpauth://…</code>) — c'est normal.
                    Installez d'abord une app TOTP :
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://apps.apple.com/app/google-authenticator/id388497605"
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                    >
                      <Apple className="h-3 w-3" /> Google Authenticator (iOS)
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                    >
                      <Smartphone className="h-3 w-3" /> Google Authenticator (Android)
                    </a>
                    <a
                      href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                    >
                      <Smartphone className="h-3 w-3" /> Microsoft Authenticator
                    </a>
                  </div>
                  <p className="text-muted-foreground">
                    Compatibles aussi : Authy, 1Password, Bitwarden, Proton Pass.
                  </p>
                </AlertDescription>
              </Alert>

              <ol className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
                  <div>
                    <div className="font-medium">Ouvrez votre app d'authentification</div>
                    <div className="text-xs text-muted-foreground">
                      Cherchez "Ajouter un compte" ou l'icône <strong>+</strong>, puis choisissez « Scanner un QR code ».
                    </div>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">2</span>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="font-medium">Scannez le QR code ci-dessous</div>
                      <div className="text-xs text-muted-foreground">
                        Compte enregistré : <strong>{issuer}</strong>{account ? <> — {account}</> : null}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-4 flex flex-col items-center gap-3">
                      <img
                        src={enrollment.qrCode}
                        alt="QR code 2FA"
                        className="h-48 w-48 rounded-md border bg-white p-2"
                      />
                      <a
                        href={enrollment.uri}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline md:hidden"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        Ouvrir directement dans mon app (mobile)
                      </a>
                      <div className="w-full pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">
                          Impossible de scanner ? Saisissez ce secret manuellement :
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
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</span>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="font-medium">Saisissez le code à 6 chiffres affiché par l'app</div>
                      <div className="text-xs text-muted-foreground">
                        Le code change toutes les 30 secondes.
                      </div>
                    </div>
                    <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setVerifyError(null); }}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    {verifyError && (
                      <Alert variant="destructive" className="py-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {verifyError}. Vérifiez que l'heure de votre téléphone est réglée sur
                          « automatique » — les codes TOTP dépendent de l'horloge.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </li>
              </ol>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleVerify} disabled={working || code.length !== 6}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Vérifier et activer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEnrollment(null);
                    setCode("");
                    setVerifyError(null);
                  }}
                  disabled={working}
                >
                  Annuler
                </Button>
              </div>
            </div>
            );
          })()}
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
