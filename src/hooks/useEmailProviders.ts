import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailProvider {
  id: string;
  code: string;
  name: string;
  description: string | null;
  config_schema: any;
  is_active: boolean;
}

export interface EmailProviderConfig {
  id: string;
  organization_id: string | null;
  provider_code: string;
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
  is_default: boolean;
  is_active: boolean;
  // credentials_encrypted is never read client-side
  created_at: string;
  updated_at: string;
}

export function useEmailProviders() {
  return useQuery({
    queryKey: ["email-providers-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_providers")
        .select("id, code, name, description, config_schema, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as EmailProvider[];
    },
  });
}

export function useEmailProviderConfigs(organizationId?: string | null) {
  return useQuery({
    queryKey: ["email-provider-configs", organizationId ?? "global"],
    queryFn: async () => {
      const query = supabase
        .from("email_provider_configs")
        .select("id, organization_id, provider_code, from_email, from_name, reply_to, is_default, is_active, created_at, updated_at")
        .order("organization_id", { ascending: true, nullsFirst: true })
        .order("provider_code");
      if (organizationId === null) {
        query.is("organization_id", null);
      } else if (organizationId) {
        query.eq("organization_id", organizationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailProviderConfig[];
    },
  });
}

export function useUpsertEmailProviderConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: string;
      organization_id: string | null;
      provider_code: string;
      from_email: string;
      from_name?: string;
      reply_to?: string;
      is_default?: boolean;
      is_active?: boolean;
      credentials?: Record<string, any>; // sent in clear; encrypted via RPC server-side
    }) => {
      // Encrypt credentials via RPC if provided
      let credentials_encrypted: string | null = null;
      if (params.credentials && Object.keys(params.credentials).length > 0) {
        const { data, error } = await (supabase.rpc as any)("encrypt_email_credentials_admin", {
          _plain: params.credentials,
        });
        if (error) throw error;
        credentials_encrypted = data as string;
      }

      const row: any = {
        organization_id: params.organization_id,
        provider_code: params.provider_code,
        from_email: params.from_email,
        from_name: params.from_name ?? null,
        reply_to: params.reply_to ?? null,
        is_default: params.is_default ?? false,
        is_active: params.is_active ?? true,
      };
      if (credentials_encrypted) row.credentials_encrypted = credentials_encrypted;

      if (params.id) {
        const { data, error } = await supabase
          .from("email_provider_configs")
          .update(row)
          .eq("id", params.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("email_provider_configs")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-provider-configs"] }),
  });
}

export function useDeleteEmailProviderConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_provider_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-provider-configs"] }),
  });
}
