import type { EmailAdapter, EmailSendInput, EmailSendResult } from "./types.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export const smtpAdapter: EmailAdapter = {
  code: "smtp",
  async send(input: EmailSendInput, credentials: Record<string, any>): Promise<EmailSendResult> {
    const { host, port, username, password, secure } = credentials || {};
    if (!host || !port || !username || !password) {
      return { success: false, error: "Missing SMTP credentials (host/port/username/password)", providerCode: "smtp" };
    }

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port: Number(port),
        tls: !!secure,
        auth: { username, password },
      },
    });

    try {
      const fromHeader = input.fromName ? `${input.fromName} <${input.from}>` : input.from;
      await client.send({
        from: fromHeader,
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        content: input.text || "",
        html: input.html,
        headers: input.headers as any,
      });
      await client.close();
      return { success: true, messageId: crypto.randomUUID(), providerCode: "smtp" };
    } catch (e: any) {
      try { await client.close(); } catch (_) { /* noop */ }
      return { success: false, error: e?.message || String(e), providerCode: "smtp" };
    }
  },
};
