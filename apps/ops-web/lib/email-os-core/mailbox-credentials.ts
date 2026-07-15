import { listEmailOSMultiMailboxes } from "@/lib/email-os-core/multi-mailbox-resolver"

export function getEmailOSMailboxCredentials() {
  return listEmailOSMultiMailboxes().map((m) => ({
    key: m.key,
    label: m.label,
    email: m.email,
    smtp: { host: m.smtp.host, port: m.smtp.port, secure: m.smtp.secure, user: m.smtp.user, passwordConfigured: Boolean(m.smtp.pass) },
    imap: { protocol: m.incoming.protocol, host: m.incoming.host, port: m.incoming.port, secure: m.incoming.secure, user: m.incoming.user, passwordConfigured: Boolean(m.incoming.pass) },
    incoming: { protocol: m.incoming.protocol, host: m.incoming.host, port: m.incoming.port, secure: m.incoming.secure, user: m.incoming.user, passwordConfigured: Boolean(m.incoming.pass) },
    rawPassword: m.password || m.smtp.pass || m.incoming.pass
  }))
}

export function getEmailOSMailboxCredentialByKey(key: string) {
  return getEmailOSMailboxCredentials().find((item) => item.key === key)
}
