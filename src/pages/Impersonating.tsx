import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { setImpersonationState } from "@/hooks/useImpersonation";
import { supabase } from "@/integrations/supabase/client";

/**
 * Landing route after consuming the magic link.
 * The Supabase magic link redirect already created the session.
 * We mark the session as "impersonation" and redirect to the requested path.
 */
export default function Impersonating() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const path = params.get("path") || "/portal";

    (async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? undefined;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      setImpersonationState({
        active: true,
        targetEmail: email,
        startedAt: new Date().toISOString(),
        expiresAt,
      });
      navigate(path, { replace: true });
    })();
  }, [navigate, params]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        Activation du mode support…
      </div>
    </div>
  );
}
