export type NotificationDraft = {
  channel: 'email' | 'whatsapp' | 'internal'
  recipient: string
  subject: string
  body: string
  priority: 'normal' | 'urgent'
}

export function buildPaymentReminder(input: { name: string; phone?: string; email?: string; amount?: number }): NotificationDraft {
  return {
    channel: input.phone ? 'whatsapp' : 'email',
    recipient: input.phone || input.email || 'missing-recipient',
    subject: 'Rappel paiement formation AngelCare Academy',
    body: `Bonjour ${input.name}, nous vous rappelons qu'un paiement de formation reste à régulariser${input.amount ? ` (${input.amount} MAD)` : ''}. Merci de contacter AngelCare Academy.`,
    priority: 'urgent',
  }
}

export function buildEligibilityReminder(input: { name: string; phone?: string; email?: string }): NotificationDraft {
  return {
    channel: input.phone ? 'whatsapp' : 'email',
    recipient: input.phone || input.email || 'missing-recipient',
    subject: 'Complément dossier AngelCare Academy',
    body: `Bonjour ${input.name}, votre dossier Academy nécessite une validation d'éligibilité. Merci de compléter les éléments demandés.`,
    priority: 'normal',
  }
}
