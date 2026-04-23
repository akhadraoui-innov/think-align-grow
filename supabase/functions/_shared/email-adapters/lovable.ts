import type { EmailAdapter, EmailSendInput, EmailSendResult } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Lovable Email adapter: enqueues into the managed pgmq `transactional_emails` queue.
 * The `process-email-queue` cron drains it and delivers via Lovable Email.
 */
export const lovableAdapter: EmailAdapter = {
  code: "lovable",
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const messageId = crypto.randomUUID();
    const payload = {
      to: input.to,
      from: input.from,
      from_name: input.fromName,
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
      message_id: messageId,
      template_name: "growthinnov_email",
      purpose: "transactional",
    };

    const { error } = await supabase.rpc("enqueue_email", {
      _queue_name: "transactional_emails",
      _payload: payload,
    });

    if (error) {
      return { success: false, error: error.message, providerCode: "lovable" };
    }
    return { success: true, messageId, providerCode: "lovable" };
  },
};
