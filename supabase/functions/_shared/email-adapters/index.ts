import type { EmailAdapter } from "./types.ts";
import { lovableAdapter } from "./lovable.ts";
import { resendAdapter } from "./resend.ts";
import { sendgridAdapter } from "./sendgrid.ts";
import { smtpAdapter } from "./smtp.ts";

const ADAPTERS: Record<string, EmailAdapter> = {
  lovable: lovableAdapter,
  resend: resendAdapter,
  sendgrid: sendgridAdapter,
  smtp: smtpAdapter,
};

export function getAdapter(code: string): EmailAdapter {
  return ADAPTERS[code] || lovableAdapter;
}

export type { EmailAdapter, EmailSendInput, EmailSendResult } from "./types.ts";
