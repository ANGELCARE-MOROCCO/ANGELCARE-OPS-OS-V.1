
import { ImapFlow } from "imapflow"

export function createEmailOSImapClient() {
  const host = process.env.EMAIL_OS_IMAP_HOST
  const port = Number(process.env.EMAIL_OS_IMAP_PORT || 993)
  const user = process.env.EMAIL_OS_IMAP_USER
  const pass = process.env.EMAIL_OS_IMAP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error("Missing EMAIL_OS_IMAP_HOST / USER / PASSWORD")
  }

  return new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass }
  })
}

export async function testEmailOSImapConnection() {
  const client = createEmailOSImapClient()
  await client.connect()
  const mailbox = await client.mailboxOpen("INBOX")
  await client.logout()

  return {
    ok: true,
    exists: mailbox.exists,
    path: mailbox.path
  }
}
