import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Module-level cache: avoids re-running the RPC (and showing a full-screen
// spinner) on every AdminGuard remount during navigation.
const adminCache = new Map<string, boolean>();

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const cached = user ? adminCache.get(user.id) : undefined;
  const [isAdmin, setIsAdmin] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState<boolean>(cached === undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const known = adminCache.get(user.id);
    if (known !== undefined) {
      setIsAdmin(known);
      setLoading(false);
    }

    supabase
      .rpc("is_saas_team", { _user_id: user.id })
      .then(({ data }) => {
        const value = !!data;
        adminCache.set(user.id, value);
        setIsAdmin(value);
        setLoading(false);
      });
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
