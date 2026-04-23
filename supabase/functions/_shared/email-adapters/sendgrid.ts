import type { EmailAdapter, EmailSendInput, EmailSendResult } from "./types.ts";

export const sendgridAdapter: EmailAdapter = {
  code: "sendgrid",
  async send(input: EmailSendInput, credentials: Record<string, any>): Promise<EmailSendResult> {
    const apiKey = credentials?.api_key;
    if (!apiKey) {
      return { success: false, error: "Missing SendGrid api_key", providerCode: "sendgrid" };
    }

    try {
      const body = {
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: input.from, name: input.fromName },
        reply_to: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        content: [
          ...(input.text ? [{ type: "text/plain", value: input.text }] : []),
          { type: "text/html", value: input.html },
        ],
        headers: input.headers,
      };
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `HTTP ${res.status}: ${errText}`, providerCode: "sendgrid" };
      }
      const messageId = res.headers.get("x-message-id") || undefined;
      return { success: true, messageId, providerCode: "sendgrid" };
    } catch (e: any) {
      return { success: false, error: e?.message || String(e), providerCode: "sendgrid" };
    }
  },
};
