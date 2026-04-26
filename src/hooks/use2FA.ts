import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
  created_at: string;
};

export type EnrollResult = {
  factorId: string;
  qrCode: string; // SVG data URI
  secret: string; // base32 secret (manual entry)
  uri: string; // otpauth:// URI
};

export function use2FA() {
  const { user } = useAuth();
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setFactors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp ?? []) as MfaFactor[];
      setFactors(totp);
    } catch (e: any) {
      setError(e?.message ?? "list_factors_failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasVerifiedTotp = factors.some(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );

  const enroll = useCallback(async (friendlyName?: string): Promise<EnrollResult> => {
    // Clean unverified factors first to avoid clutter
    try {
      const list = await supabase.auth.mfa.listFactors();
      const stale = (list.data?.totp ?? []).filter((f) => f.status !== "verified");
      for (const f of stale) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    } catch {
      /* best-effort cleanup */
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: friendlyName ?? `Heeplab ${new Date().toLocaleDateString()}`,
    });
    if (error || !data) throw new Error(error?.message ?? "enroll_failed");
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  }, []);

  const verify = useCallback(async (factorId: string, code: string) => {
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !challenge) throw new Error(cErr?.message ?? "challenge_failed");
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (vErr) throw new Error(vErr.message ?? "verify_failed");
    await refresh();
  }, [refresh]);

  const unenroll = useCallback(async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message ?? "unenroll_failed");
    await refresh();
  }, [refresh]);

  return {
    factors,
    hasVerifiedTotp,
    loading,
    error,
    refresh,
    enroll,
    verify,
    unenroll,
  };
}
