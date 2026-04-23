import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

interface InvitationInfo {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export default function Invitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_invitation_by_token", { _token: token });
      if (error) {
        setError("Invitation introuvable");
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("Invitation introuvable");
      } else {
        const inv = Array.isArray(data) ? data[0] : data;
        setInvitation(inv as InvitationInfo);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (result?.success) {
      toast.success("Invitation acceptée — bienvenue !");
      navigate("/portal");
    } else {
      const errorMessages: Record<string, string> = {
        not_authenticated: "Vous devez être connecté",
        invitation_not_found: "Invitation introuvable",
        already_accepted: "Invitation déjà acceptée",
        invitation_revoked: "Cette invitation a été révoquée",
        invitation_expired: "Cette invitation a expiré",
        email_mismatch: `L'email de votre compte ne correspond pas à l'invitation (attendu : ${result?.expected})`,
      };
      toast.error(errorMessages[result?.error] ?? "Erreur lors de l'acceptation");
    }
  };

  const isExpired = invitation && new Date(invitation.expires_at) < new Date();
  const isRevoked = invitation?.revoked_at;
  const isAccepted = invitation?.accepted_at;
  const emailMatches = invitation && user?.email && user.email.toLowerCase() === invitation.email.toLowerCase();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invitation introuvable</CardTitle>
            <CardDescription>Le lien d'invitation est invalide ou a été supprimé.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/"><Button variant="outline">Retour à l'accueil</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Invitation à rejoindre</CardTitle>
          <CardDescription className="text-base">
            <span className="font-semibold text-foreground">{invitation.organization_name}</span>
          </CardDescription>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="secondary" className="capitalize">{invitation.role}</Badge>
            <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />{invitation.email}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isAccepted && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm text-emerald-700 font-medium">Invitation déjà acceptée</p>
            </div>
          )}

          {isRevoked && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
              <p className="text-sm text-destructive font-medium">Invitation révoquée</p>
            </div>
          )}

          {isExpired && !isAccepted && !isRevoked && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
              <p className="text-sm text-amber-700 font-medium">Cette invitation a expiré</p>
            </div>
          )}

          {!isAccepted && !isRevoked && !isExpired && (
            <>
              {!user && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Connectez-vous ou créez un compte avec <strong>{invitation.email}</strong> pour accepter.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/auth?mode=signin&email=${encodeURIComponent(invitation.email)}&redirect=/invitation/${token}`}>
                      <Button variant="outline" className="w-full">Se connecter</Button>
                    </Link>
                    <Link to={`/auth?mode=signup&email=${encodeURIComponent(invitation.email)}&redirect=/invitation/${token}`}>
                      <Button className="w-full">Créer un compte</Button>
                    </Link>
                  </div>
                </div>
              )}

              {user && !emailMatches && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-700">
                  Vous êtes connecté avec <strong>{user.email}</strong>, mais l'invitation est destinée à <strong>{invitation.email}</strong>. Déconnectez-vous puis reconnectez-vous avec le bon compte.
                </div>
              )}

              {user && emailMatches && (
                <Button onClick={handleAccept} disabled={accepting} className="w-full" size="lg">
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Rejoindre {invitation.organization_name}
                </Button>
              )}
            </>
          )}

          <p className="text-[11px] text-center text-muted-foreground/70 pt-2">
            Expire le {new Date(invitation.expires_at).toLocaleDateString("fr-FR")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
