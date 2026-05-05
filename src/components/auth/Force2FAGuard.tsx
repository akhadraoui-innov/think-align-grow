import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

/**
 * Force-redirects SaaS Team users without an active TOTP factor to the
 * 2FA setup page before they can access any admin route.
 *
 * Mount inside AdminGuard (after auth + admin role check).
 */
// Module-level cache: prevents the full-screen spinner flash on every
// remount of AdminGuard during navigation.
const twoFaCache = new Map<string, boolean>();

export function Force2FAGuard({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cached = user ? twoFaCache.get(user.id) : undefined;
  const [checking, setChecking] = useState<boolean>(cached === undefined);
  const [needs2fa, setNeeds2fa] = useState<boolean>(cached ?? false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    const known = twoFaCache.get(user.id);
    if (known !== undefined) {
      setNeeds2fa(known);
      setChecking(false);
      if (known && !location.pathname.startsWith("/account/security")) {
        navigate("/account/security?setup=1", { replace: true });
      }
    }
    let cancelled = false;
    supabase
      .rpc("requires_2fa", { _user_id: user.id })
      .then(({ data }) => {
        if (cancelled) return;
        const required = !!data;
        twoFaCache.set(user.id, required);
        setNeeds2fa(required);
        setChecking(false);
        if (required && !location.pathname.startsWith("/account/security")) {
          navigate("/account/security?setup=1", { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, location.pathname, navigate]);

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (needs2fa) return null;

  return <>{children}</>;
}
