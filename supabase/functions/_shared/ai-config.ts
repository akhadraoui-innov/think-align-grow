// Shared helper to resolve AI config + decrypt api_key from Vault if needed.
// Falls back to legacy plaintext column for backward compat.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function resolveAIConfigWithKey(
  organizationId?: string | null,
): Promise<{ config: any; apiKey: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  let config: any = null;

  if (organizationId) {
    const { data } = await sb
      .from("ai_configurations")
      .select("*, ai_providers(*)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (data) config = data;
  }

  if (!config) {
    const { data } = await sb
      .from("ai_configurations")
      .select("*, ai_providers(*)")
      .is("organization_id", null)
      .eq("is_active", true)
      .maybeSingle();
    if (data) config = data;
  }

  let apiKey = "";

  // Priority 1: Vault-stored secret via RPC
  if (config?.id && config?.api_key_secret_id) {
    try {
      const { data: vaultKey } = await sb.rpc("get_ai_api_key", { _config_id: config.id });
      if (vaultKey) apiKey = vaultKey as string;
    } catch (e) {
      console.warn("[ai-config] Vault decrypt failed, falling back:", e);
    }
  }

  // Priority 2: Legacy plaintext column (rétro-compat)
  if (!apiKey && config?.api_key) {
    apiKey = config.api_key;
  }

  // Priority 3: Lovable AI Gateway fallback
  if (!apiKey) {
    apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  }

  return { config, apiKey };
}
