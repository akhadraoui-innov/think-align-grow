import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget wrapper around the `append_audit_log` RPC for client-side
 * admin actions (bulk operations, exports, saved-view changes).
 *
 * Never throws — audit logging must not block business operations.
 */
export async function appendAuditLog(params: {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  organizationId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.rpc("append_audit_log", {
      _action: params.action,
      _entity_type: params.entityType ?? null,
      _entity_id: params.entityId ?? null,
      _organization_id: params.organizationId ?? null,
      _payload: (params.payload ?? {}) as never,
    } as never);
  } catch (e) {
    console.warn("[auditClient] append_audit_log failed:", e);
  }
}
