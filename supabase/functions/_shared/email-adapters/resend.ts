import type { EmailAdapter, EmailSendInput, EmailSendResult } from "./types.ts";

export const resendAdapter: EmailAdapter = {
  code: "resend",
  async send(input: EmailSendInput, credentials: Record<string, any>): Promise<EmailSendResult> {
    const apiKey = credentials?.api_key;
    if (!apiKey) {
      return { success: false, error: "Missing Resend api_key", providerCode: "resend" };
    }

    const fromHeader = input.fromName
      ? `${input.fromName} <${input.from}>`
      : input.from;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo,
          headers: input.headers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.message || `HTTP ${res.status}`, providerCode: "resend" };
      }
      return { success: true, messageId: data?.id, providerCode: "resend" };
    } catch (e: any) {
      return { success: false, error: e?.message || String(e), providerCode: "resend" };
    }
  },
};
