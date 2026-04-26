import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KEY = "heeplab.impersonation";

export type ImpersonationState = {
  active: boolean;
  targetEmail?: string;
  startedAt?: string;
  expiresAt?: string;
};

function read(): ImpersonationState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { active: false };
    const parsed = JSON.parse(raw) as ImpersonationState;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      sessionStorage.removeItem(KEY);
      return { active: false };
    }
    return parsed;
  } catch {
    return { active: false };
  }
}

export function setImpersonationState(state: ImpersonationState) {
  try {
    if (state.active) {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(KEY);
    }
    window.dispatchEvent(new Event("heeplab:impersonation-changed"));
  } catch {
    /* ignore */
  }
}

export function useImpersonation() {
  const [state, setState] = useState<ImpersonationState>(() => read());

  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener("heeplab:impersonation-changed", sync);
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 30_000); // expiry check
    return () => {
      window.removeEventListener("heeplab:impersonation-changed", sync);
      window.removeEventListener("storage", sync);
      clearInterval(interval);
    };
  }, []);

  const start = useCallback(
    async (params: { user_id: string; reason?: string; redirect_path?: string }) => {
      const { data, error } = await supabase.functions.invoke("impersonate-user", {
        body: params,
      });
      if (error) throw new Error(error.message ?? "impersonation_failed");
      const result = data as {
        success?: boolean;
        action_link?: string;
        target_email?: string;
        expires_at?: string;
        error?: string;
      };
      if (!result?.success || !result.action_link) {
        throw new Error(result?.error ?? "impersonation_failed");
      }
      // Open in a new tab — preserves admin session in original tab.
      window.open(result.action_link, "_blank", "noopener");
      toast.success(`Lien d'impersonation généré pour ${result.target_email}`);
      return result;
    },
    [],
  );

  const exit = useCallback(async (notify = true) => {
    const wasActive = read().active;
    setImpersonationState({ active: false });
    await supabase.auth.signOut();
    if (notify && wasActive) toast.info("Mode support quitté.");
    window.location.href = "/auth";
  }, []);

  return { ...state, start, exit };
}
