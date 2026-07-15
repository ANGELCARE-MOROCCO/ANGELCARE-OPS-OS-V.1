export type Angelcare360EmailTemplateKey =
  | 'invoice'
  | 'receipt'
  | 'manual_reminder'
  | 'onboarding'
  | 'support_follow_up'

export interface Angelcare360EmailDraft {
  templateKey: Angelcare360EmailTemplateKey
  subject: string
  body: string
  toEmail: string
  replyTo?: string | null
  metadata?: Record<string, unknown> | null
}

export interface Angelcare360EmailSendResult {
  ok: boolean
  locked?: boolean
  mailbox: string
  provider: 'email-os'
  emailId?: string | null
  reason?: string | null
  error?: string | null
}

