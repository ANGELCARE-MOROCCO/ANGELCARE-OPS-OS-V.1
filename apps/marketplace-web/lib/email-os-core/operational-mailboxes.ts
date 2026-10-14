/** Sender ownership for the two automated AngelCare email lanes. */
export const CUSTOMER_OPERATIONS_MAILBOX = 'supports@angelcarehub.ma'
export const SANILA_OPERATIONS_MAILBOX = 'it.support@angelcarehub.ma'

export function authOperationsMailbox(destination: URL, marketplaceOrigin: string): string {
  const sanilaPath = /^\/(?:sanila|angelcare360|angelcare-360-access)(?:\/|$)/.test(destination.pathname)
  return destination.origin === marketplaceOrigin && !sanilaPath
    ? CUSTOMER_OPERATIONS_MAILBOX
    : SANILA_OPERATIONS_MAILBOX
}

export function selectSanilaOperationsMailbox<T extends { email: string }>(mailboxes: T[]): T | undefined {
  return mailboxes.find(mailbox => mailbox.email.trim().toLowerCase() === SANILA_OPERATIONS_MAILBOX)
}
