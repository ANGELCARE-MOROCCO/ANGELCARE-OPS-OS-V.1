export type ValidationResult<T> = {
  ok: boolean
  data?: T
  errors?: string[]
}

export function requireString(value: unknown, label: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${label} is required`)
    return ""
  }
  return value.trim()
}

export function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function validateEmail(value: unknown, label: string, errors: string[]) {
  const text = requireString(value, label, errors)
  if (text && !/^\S+@\S+\.\S+$/.test(text)) {
    errors.push(`${label} must be a valid email`)
  }
  return text
}

export function validateComposePayload(input: any): ValidationResult<{
  toEmail: string
  subject: string
  body: string
}> {
  const errors: string[] = []

  const toEmail = validateEmail(input?.toEmail, "Recipient email", errors)
  const subject = requireString(input?.subject, "Subject", errors)
  const body = requireString(input?.body, "Body", errors)

  if (subject.length > 300) errors.push("Subject must be under 300 characters")
  if (body.length > 50000) errors.push("Body must be under 50,000 characters")

  return errors.length ? { ok: false, errors } : { ok: true, data: { toEmail, subject, body } }
}

export function validateMailboxPayload(input: any): ValidationResult<{
  name: string
  address: string
  provider: string
  status: string
  owner: string
}> {
  const errors: string[] = []

  const name = requireString(input?.name, "Mailbox name", errors)
  const address = validateEmail(input?.address, "Mailbox address", errors)
  const provider = optionalString(input?.provider) || "smtp_imap"
  const status = optionalString(input?.status) || "active"
  const owner = optionalString(input?.owner) || "operations"

  return errors.length ? { ok: false, errors } : { ok: true, data: { name, address, provider, status, owner } }
}
