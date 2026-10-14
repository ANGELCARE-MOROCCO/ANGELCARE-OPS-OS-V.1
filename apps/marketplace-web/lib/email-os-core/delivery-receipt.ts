export class EmailDeliveryUnconfirmedError extends Error {
  constructor() {
    super('EMAIL_RECIPIENT_ACCEPTANCE_UNCONFIRMED')
    this.name = 'EmailDeliveryUnconfirmedError'
  }
}

export function assertEmailRecipientAcceptance(
  receipt: { accepted: unknown[]; rejected: unknown[] }, recipients: string[],
): void {
  const accepted = new Set(receipt.accepted.map(value => {
    const address = value && typeof value === 'object' && 'address' in value ? value.address : value
    return String(address || '').trim().toLowerCase()
  }))
  if (!recipients.length || receipt.rejected.length || recipients.some(value => !accepted.has(value.trim().toLowerCase()))) {
    throw new EmailDeliveryUnconfirmedError()
  }
}
