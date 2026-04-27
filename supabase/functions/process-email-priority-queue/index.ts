// Edge Function: process-email-priority-queue
// Drains the 3 GROWTHINNOV priority lanes in strict order:
//   transactional → marketing → bulk
// Triggered by pg_cron every 30s (or invoked manually for testing).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAdapter } from "../_shared/email-adapters/index.ts";
import { sanitizeEmailHtml } from "../_shared/email-security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRIORITIES = ["transactional", "marketing", "bulk"] as const;
const BATCH_SIZE_BY_PRIORITY: Record<string, number> = {
  transactional: 20,
  marketing: 50,
  bulk: 100,
};
const VT_SECONDS = 60;
const MAX_RETRIES = 5;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const stats: Record<string, { read: number; sent: number; failed: number; dlq: number }> = {};

  for (const priority of PRIORITIES) {
    stats[priority] = { read: 0, sent: 0, failed: 0, dlq: 0 };

    const { data: messages, error: readErr } = await supabase.rpc("read_priority_email_batch", {
      _priority: priority,
      _batch_size: BATCH_SIZE_BY_PRIORITY[priority],
      _vt: VT_SECONDS,
    });

    if (readErr) {
      console.error("[priority-queue] read error", { priority, readErr });
      continue;
    }
    if (!messages?.length) continue;
    stats[priority].read = messages.length;

    for (const msg of messages as any[]) {
      const payload = msg.message || {};

      // Max retries → DLQ
      if ((msg.read_ct ?? 0) > MAX_RETRIES) {
        await supabase.from("email_send_log").insert({
          message_id: payload.message_id || crypto.randomUUID(),
          template_name: payload.label || `priority:${priority}`,
          recipient_email: payload.to,
          status: "dlq",
          error_message: `max_retries_exceeded (${msg.read_ct})`,
          metadata: { priority, msg_id: msg.msg_id },
        });
        await supabase.rpc("delete_priority_email", { _priority: priority, _msg_id: msg.msg_id });
        stats[priority].dlq++;
        continue;
      }

      try {
        // Resolve provider for this org (fallback to global)
        let provCfg: any = null;
        if (payload.organization_id) {
          const { data: orgCfg } = await supabase
            .from("email_provider_configs")
            .select("id, provider_code, credentials, from_email, from_name, reply_to")
            .eq("organization_id", payload.organization_id)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();
          provCfg = orgCfg;
        }
        if (!provCfg) {
          const { data: g } = await supabase
            .from("email_provider_configs")
            .select("id, provider_code, credentials, from_email, from_name, reply_to")
            .is("organization_id", null)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle();
          provCfg = g;
        }
        if (!provCfg) throw new Error("no_active_provider");

        // Resolve credentials: JSONB column first, Vault fallback
        let credentials: Record<string, any> = (provCfg.credentials as any) || {};
        if (!credentials || Object.keys(credentials).length === 0) {
          try {
            const { data: vaultCreds } = await supabase.rpc("get_email_provider_credentials", {
              _config_id: provCfg.id,
            });
            if (vaultCreds) credentials = vaultCreds as Record<string, any>;
          } catch (e) {
            console.warn("[process-email-priority-queue] vault decrypt failed", e);
          }
        }

        const adapter = getAdapter(provCfg.provider_code);
        const sanitized = payload.html ? sanitizeEmailHtml(payload.html) : "";

        const sendRes = await adapter.send({
          to: payload.to,
          from: provCfg.from_email || "noreply@growthinnov.com",
          fromName: provCfg.from_name || "GROWTHINNOV",
          replyTo: provCfg.reply_to || undefined,
          subject: payload.subject || "(no subject)",
          html: sanitized,
          text: payload.text,
          headers: payload.extra_headers || {},
        }, credentials);

        await supabase.from("email_send_log").insert({
          message_id: payload.message_id || crypto.randomUUID(),
          template_name: payload.label || `priority:${priority}`,
          recipient_email: payload.to,
          status: "sent",
          metadata: {
            priority,
            provider: provCfg.provider_code,
            provider_message_id: sendRes?.messageId,
          },
        });

        // Track provider message id on automation run if linked
        if (payload.run_id && sendRes?.messageId) {
          await supabase
            .from("email_automation_runs")
            .update({ provider_message_id: sendRes.messageId, sent_at: new Date().toISOString() })
            .eq("id", payload.run_id);
        }

        await supabase.rpc("delete_priority_email", { _priority: priority, _msg_id: msg.msg_id });
        stats[priority].sent++;
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("[priority-queue] send failed", { priority, msg_id: msg.msg_id, errMsg });
        await supabase.from("email_send_log").insert({
          message_id: payload.message_id || crypto.randomUUID(),
          template_name: payload.label || `priority:${priority}`,
          recipient_email: payload.to,
          status: "failed",
          error_message: errMsg.slice(0, 1000),
          metadata: { priority, attempt: msg.read_ct },
        });
        stats[priority].failed++;
        // Message stays invisible until VT expires → automatic retry
      }
    }
  }

  return json({ ok: true, stats });
});
