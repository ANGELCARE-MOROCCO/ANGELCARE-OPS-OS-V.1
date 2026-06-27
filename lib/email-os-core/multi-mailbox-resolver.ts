export type ResolvedEmailOSMailbox = {
  key: string
  mailboxId: string
  label: string
  email: string
  password: string
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
  incoming: {
    protocol: "pop3"
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  diagnostics: Record<string, string>
}

const MAILBOXES = [
  ["SUPPORTS", "Supports", ["SUPPORTS"]],
  ["OPS", "Ops", ["OPS"]],
  ["RH", "RH", ["RH", "HR"]],
  ["COMMERCIAL", "Commercial", ["COMMERCIAL"]],
  ["ACADEMY", "Academy", ["ACADEMY"]],
  ["MONTESSORI", "Montessori", ["MONTESSORI"]],
  ["FLASHCARTES", "Flashcartes", ["FLASHCARTES", "FLASHCARDS"]],
  ["IT_SUPPORT", "IT Support", ["IT_SUPPORT"]],
  ["HOMESERVICE", "Homeservice", ["HOMESERVICE", "HOME_SERVICE"]],
  ["EVENTS", "Events", ["EVENTS"]],
  ["EXCURSIONS", "Exursions", ["EXCURSIONS", "EXCURSIONS"]],
  ["B2B", "B2B", ["B2B"]],
  ["PARTENAIRES", "Partenaires", ["PARTENAIRES", "PARTNERS"]]
] as const

function env(name: string) {
  return process.env[name] || ""
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = env(name)
    if (value) return { value, source: name }
  }
  return { value: "", source: "" }
}

function toBool(value: string | undefined, fallback: boolean) {
  const text = String(value || "").trim().toLowerCase()
  if (!text) return fallback
  if (["true", "1", "yes"].includes(text)) return true
  if (["false", "0", "no"].includes(text)) return false
  return fallback
}

function toNumber(value: string | undefined, fallback: number) {
  const text = String(value || "").trim()
  if (!text) return fallback
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function normalize(value: any) {
  return String(value || "").trim().toLowerCase()
}

function namesFor(aliases: readonly string[], suffix: string) {
  return aliases.flatMap((alias) => [`${alias}_${suffix}`, `MAILBOX_${alias}_${suffix}`])
}

export function mailboxIdFromEmail(email: string) {
  return `mbx_${String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`
}

export function listEmailOSMultiMailboxes(): ResolvedEmailOSMailbox[] {
  const globalSmtpHost =
    env("GLOBAL_SMTP_HOST") ||
    env("EMAIL_OS_SMTP_HOST") ||
    env("MENARA_SMTP_HOST") ||
    "smtp-out9.menara.ma"

  const globalSmtpPort = toNumber(
    env("GLOBAL_SMTP_PORT") || env("EMAIL_OS_SMTP_PORT") || env("MENARA_SMTP_PORT"),
    587
  )

  const globalSmtpSecure = toBool(
    env("GLOBAL_SMTP_SECURE") || env("EMAIL_OS_SMTP_SECURE") || env("MENARA_SMTP_SECURE"),
    false
  )

  const globalPopHost =
    env("GLOBAL_POP_HOST") ||
    env("EMAIL_OS_POP_HOST") ||
    env("MENARA_POP_HOST") ||
    "mail.angelcare.ma"

  const globalPopPort = toNumber(
    env("GLOBAL_POP_PORT") || env("EMAIL_OS_POP_PORT") || env("MENARA_POP_PORT"),
    110
  )

  const globalPopSecure = toBool(
    env("GLOBAL_POP_SECURE") || env("EMAIL_OS_POP_SECURE") || env("MENARA_POP_SECURE"),
    false
  )

  return MAILBOXES.map<ResolvedEmailOSMailbox>(([key, label, aliases]) => {
    const emailMatch = firstEnv([
      ...namesFor(aliases, "EMAIL"),
      ...namesFor(aliases, "SMTP_USER"),
      ...namesFor(aliases, "POP_USER")
    ])

    const passMatch = firstEnv([
      ...namesFor(aliases, "PASSWORD"),
      ...namesFor(aliases, "SMTP_PASSWORD"),
      ...namesFor(aliases, "POP_PASSWORD")
    ])

    const smtpUser = firstEnv(namesFor(aliases, "SMTP_USER"))
    const smtpPass = firstEnv(namesFor(aliases, "SMTP_PASSWORD"))
    const smtpFrom = firstEnv(namesFor(aliases, "SMTP_FROM"))
    const smtpHost = firstEnv(namesFor(aliases, "SMTP_HOST"))
    const smtpPort = firstEnv(namesFor(aliases, "SMTP_PORT"))
    const smtpSecure = firstEnv(namesFor(aliases, "SMTP_SECURE"))

    const popUser = firstEnv(namesFor(aliases, "POP_USER"))
    const popPass = firstEnv(namesFor(aliases, "POP_PASSWORD"))
    const popHost = firstEnv(namesFor(aliases, "POP_HOST"))
    const popPort = firstEnv(namesFor(aliases, "POP_PORT"))
    const popSecure = firstEnv(namesFor(aliases, "POP_SECURE"))

    const email = emailMatch.value.toLowerCase()
    const password = passMatch.value

    return {
      key,
      label,
      mailboxId: mailboxIdFromEmail(email),
      email,
      password,
      smtp: {
        host: smtpHost.value || globalSmtpHost,
        port: toNumber(smtpPort.value, globalSmtpPort),
        secure: toBool(smtpSecure.value, globalSmtpSecure),
        user: smtpUser.value || email,
        pass: smtpPass.value || password,
        from: smtpFrom.value || email
      },
      incoming: {
        protocol: "pop3" as const,
        host: popHost.value || globalPopHost,
        port: toNumber(popPort.value, globalPopPort),
        secure: toBool(popSecure.value, globalPopSecure),
        user: popUser.value || email,
        pass: popPass.value || password
      },
      diagnostics: {
        emailSource: emailMatch.source,
        passwordSource: passMatch.source,
        incomingProtocol: "pop3",
        incomingHost: popHost.value || globalPopHost
      }
    }
  }).filter((mailbox) => Boolean(mailbox.email))
}

export function resolveEmailOSMailboxIdentity(input: {
  mailboxId?: string | null
  fromEmail?: string | null
  selectedEmail?: string | null
}) {
  const mailboxId = normalize(input.mailboxId)
  const fromEmail = normalize(input.fromEmail)
  const selectedEmail = normalize(input.selectedEmail)

  return (
    listEmailOSMultiMailboxes().find(
      (mailbox) =>
        normalize(mailbox.mailboxId) === mailboxId ||
        normalize(mailbox.key) === mailboxId ||
        normalize(mailbox.email) === fromEmail ||
        normalize(mailbox.email) === selectedEmail
    ) || null
  )
}
