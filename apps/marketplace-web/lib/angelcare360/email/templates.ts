import type { Angelcare360EmailDraft, Angelcare360EmailTemplateKey } from '@/types/angelcare360/email'

function bodyToText(lines: string[]) {
  return lines.join('\n')
}

export function buildAngelcare360InvoiceEmailDraft(input: {
  clientName: string
  recipientEmail: string
  invoiceNumber: string
  amountMad: string
  dueDate: string
  printHref?: string | null
}) : Angelcare360EmailDraft {
  const subject = `Facture AngelCare 360 — ${input.invoiceNumber}`
  return {
    templateKey: 'invoice',
    subject,
    toEmail: input.recipientEmail,
    body: bodyToText([
      `Bonjour ${input.clientName},`,
      '',
      `Veuillez trouver votre facture AngelCare 360 relative à votre abonnement.`,
      `Facture : ${input.invoiceNumber}`,
      `Montant : ${input.amountMad} MAD`,
      `Échéance : ${input.dueDate}`,
      input.printHref ? `Lien d’impression : ${input.printHref}` : '',
      '',
      'Cordialement,',
      'Équipe AngelCare 360',
    ].filter(Boolean)),
    metadata: {
      invoiceNumber: input.invoiceNumber,
      printHref: input.printHref || null,
      templateKey: 'invoice',
    },
  }
}

export function buildAngelcare360ReceiptEmailDraft(input: {
  clientName: string
  recipientEmail: string
  paymentReference: string
  amountMad: string
  printHref?: string | null
}): Angelcare360EmailDraft {
  const subject = `Reçu de paiement AngelCare 360 — ${input.paymentReference}`
  return {
    templateKey: 'receipt',
    subject,
    toEmail: input.recipientEmail,
    body: bodyToText([
      `Bonjour ${input.clientName},`,
      '',
      `Votre paiement a bien été enregistré par AngelCare 360.`,
      `Référence : ${input.paymentReference}`,
      `Montant : ${input.amountMad} MAD`,
      input.printHref ? `Lien d’impression : ${input.printHref}` : '',
      '',
      'Cordialement,',
      'Équipe AngelCare 360',
    ].filter(Boolean)),
    metadata: {
      paymentReference: input.paymentReference,
      printHref: input.printHref || null,
      templateKey: 'receipt',
    },
  }
}

export function buildAngelcare360ReminderEmailDraft(input: {
  clientName: string
  recipientEmail: string
  invoiceNumber: string
  amountMad: string
  dueDate: string
}): Angelcare360EmailDraft {
  const subject = `Relance manuelle AngelCare 360 — ${input.invoiceNumber}`
  return {
    templateKey: 'manual_reminder',
    subject,
    toEmail: input.recipientEmail,
    body: bodyToText([
      `Bonjour ${input.clientName},`,
      '',
      `Nous vous contactons au sujet de la facture AngelCare 360 ${input.invoiceNumber}.`,
      `Montant : ${input.amountMad} MAD`,
      `Échéance : ${input.dueDate}`,
      '',
      'Cette relance a été préparée par l’équipe AngelCare.',
      '',
      'Cordialement,',
      'Équipe AngelCare 360',
    ]),
    metadata: {
      invoiceNumber: input.invoiceNumber,
      templateKey: 'manual_reminder',
    },
  }
}

export function buildAngelcare360OnboardingEmailDraft(input: {
  clientName: string
  recipientEmail: string
  subjectHint?: string | null
  bodyHint?: string | null
}): Angelcare360EmailDraft {
  return {
    templateKey: 'onboarding',
    subject: input.subjectHint || `Onboarding AngelCare 360 — ${input.clientName}`,
    toEmail: input.recipientEmail,
    body: bodyToText([
      `Bonjour ${input.clientName},`,
      '',
      input.bodyHint || 'Le suivi d’onboarding AngelCare 360 a été mis à jour.',
      '',
      'Cordialement,',
      'Équipe AngelCare 360',
    ]),
    metadata: { templateKey: 'onboarding' },
  }
}

export function buildAngelcare360SupportFollowUpEmailDraft(input: {
  clientName: string
  recipientEmail: string
  subjectHint?: string | null
  bodyHint?: string | null
}): Angelcare360EmailDraft {
  return {
    templateKey: 'support_follow_up',
    subject: input.subjectHint || `Suivi support AngelCare 360 — ${input.clientName}`,
    toEmail: input.recipientEmail,
    body: bodyToText([
      `Bonjour ${input.clientName},`,
      '',
      input.bodyHint || 'Votre demande support AngelCare 360 fait l’objet d’un suivi.',
      '',
      'Cordialement,',
      'Équipe AngelCare 360',
    ]),
    metadata: { templateKey: 'support_follow_up' },
  }
}

export function isAngelcare360EmailTemplateKey(value: string): value is Angelcare360EmailTemplateKey {
  return ['invoice', 'receipt', 'manual_reminder', 'onboarding', 'support_follow_up'].includes(value)
}

