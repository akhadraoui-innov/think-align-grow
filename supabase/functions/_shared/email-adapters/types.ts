// Shared interface for all email provider adapters
export interface EmailSendInput {
  to: string;
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  providerCode: string;
}

export interface EmailAdapter {
  code: string;
  send(input: EmailSendInput, credentials: Record<string, any>): Promise<EmailSendResult>;
}
