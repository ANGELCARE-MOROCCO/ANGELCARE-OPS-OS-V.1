
export const EMAIL_OS_REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const

export const EMAIL_OS_LIVE_PROVIDER_ENV = [
  "EMAIL_OS_SMTP_HOST",
  "EMAIL_OS_SMTP_PORT",
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_IMAP_HOST",
  "EMAIL_OS_IMAP_PORT",
  "EMAIL_OS_IMAP_USER",
  "EMAIL_OS_IMAP_PASSWORD",
  "EMAIL_OS_CRON_SECRET",
  "EMAIL_OS_ENCRYPTION_KEY"
] as const

export function getEmailOSEnvReport() {
  const requiredMissing = EMAIL_OS_REQUIRED_ENV.filter((key) => !process.env[key])
  const providerMissing = EMAIL_OS_LIVE_PROVIDER_ENV.filter((key) => !process.env[key])

  return {
    ok: requiredMissing.length === 0,
    requiredMissing,
    providerMissing,
    checkedAt: new Date().toISOString()
  }
}

export function requireEmailOSCronSecret(request: Request) {
  const expected = process.env.EMAIL_OS_CRON_SECRET
  if (!expected) return false
  const provided = request.headers.get("x-email-os-cron-secret")
  return provided === expected
}
