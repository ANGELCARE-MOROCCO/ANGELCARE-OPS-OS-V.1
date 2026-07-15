export function normalizeMailboxDisplay(mailbox: any) {
  const email =
    mailbox?.email_address ||
    mailbox?.address ||
    mailbox?.from_email ||
    mailbox?.username ||
    ""

  const rawName =
    mailbox?.name ||
    mailbox?.display_name ||
    mailbox?.label ||
    ""

  const badNames = new Set([
    "SERVICE CLIENTS",
    "Service Clients",
    "service clients",
    "Executable workflow item #1",
    "Executable workflow item #2",
    "Executable workflow item #3"
  ])

  const name = rawName && !badNames.has(rawName)
    ? rawName
    : email
      ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (m: string) => m.toUpperCase())
      : "Mailbox"

  return {
    id: mailbox?.id,
    name,
    email,
    owner: mailbox?.owner || mailbox?.owner_team || mailbox?.team_key || "operations",
    provider: mailbox?.provider || mailbox?.provider_mode || "smtp_imap",
    status: mailbox?.status || "active"
  }
}
