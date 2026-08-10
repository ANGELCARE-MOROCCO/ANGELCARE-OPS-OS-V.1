import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'

type Row = Record<string, unknown>

function text(value: unknown, fallback = '—') {
  const rendered = value === null || value === undefined ? '' : String(value).trim()
  return rendered || fallback
}

function money(value: unknown, currency = 'Dh') {
  const parsed = Number(value || 0)
  return `${Number.isFinite(parsed) ? parsed.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} ${currency}`
}

export function buildCustomerFinanceDocumentModel(input: {
  kind: 'invoice' | 'receipt' | 'statement' | 'credit_note' | 'refund' | 'collection_notice' | 'financial_summary'
  schoolName: string
  referenceCode: string
  source: Row
  lines?: Row[]
  movements?: Row[]
  currency?: string
}): Angelcare360A4DocumentModel {
  const currency = input.currency || 'Dh'
  const source = input.source
  const lines = input.lines || []
  const movements = input.movements || []
  const titles: Record<typeof input.kind, string> = {
    invoice: 'Facture établissement',
    receipt: 'Reçu de paiement',
    statement: 'État de compte',
    credit_note: 'Avoir financier',
    refund: 'Confirmation de remboursement',
    collection_notice: 'Avis de recouvrement',
    financial_summary: 'Synthèse financière',
  }
  const family = input.kind === 'statement' || input.kind === 'financial_summary' ? 'Reporting financier' : 'Finance établissement'
  const total = source.total_amount ?? source.amount ?? source.closing_balance ?? source.balance_due ?? 0
  const paid = source.amount_paid ?? source.allocated_amount ?? source.paid_amount ?? 0
  const balance = source.balance_due ?? source.remaining_amount ?? Number(total || 0) - Number(paid || 0)
  return {
    templateKey: `customer-finance-${input.kind}`,
    title: titles[input.kind],
    family,
    owner: 'customer',
    referenceCode: input.referenceCode,
    version: text(source.document_version || source.version || 'v1.0'),
    issueDate: text(source.issue_date || source.invoice_date || source.payment_date || source.created_at || new Date().toISOString().slice(0, 10)),
    confidentiality: 'confidential',
    preparedBy: 'AngelCare 360 · Finance établissement',
    subject: text(source.label || source.invoice_number || source.payment_number || source.account_name || source.title || input.referenceCode),
    clientName: text(source.payer_name || source.student_name || source.family_name || source.vendor_name || 'Compte financier'),
    tenantName: input.schoolName,
    schoolName: input.schoolName,
    statusLabel: text(source.status || 'generated'),
    summaryLines: [
      `Référence: ${input.referenceCode}`,
      `Statut: ${text(source.status || '—')}`,
      `Montant: ${money(total, currency)}`,
      `Solde: ${money(balance, currency)}`,
    ],
    metadataLines: [
      { label: 'Établissement', value: input.schoolName },
      { label: 'Compte / payeur', value: text(source.payer_name || source.student_name || source.family_name || '—') },
      { label: 'Date', value: text(source.issue_date || source.invoice_date || source.payment_date || source.created_at || '—') },
      { label: 'Méthode', value: text(source.method || source.payment_method || '—') },
    ],
    metrics: [
      { label: 'Montant', value: money(total, currency), tone: 'primary' },
      { label: 'Payé / affecté', value: money(paid, currency), tone: 'success' },
      { label: 'Solde', value: money(balance, currency), tone: Number(balance || 0) > 0 ? 'warning' : 'success' },
      { label: 'Statut', value: text(source.status || '—'), tone: 'neutral' },
    ],
    sections: movements.length ? [{
      title: 'Chronologie du compte',
      lines: movements.slice(0, 14).map((movement) => `${text(movement.movement_date || movement.date)} · ${text(movement.label || movement.movement_type)} · ${money(movement.amount, currency)}`),
    }] : undefined,
    table: lines.length ? {
      headers: ['Libellé', 'Quantité', 'Montant unitaire', 'Total'],
      rows: lines.slice(0, 18).map((line) => [
        text(line.label || line.description),
        text(line.quantity || 1),
        money(line.unit_amount || line.amount, currency),
        money(line.line_total || line.total || line.amount, currency),
      ]),
    } : null,
    footerNote: 'Document financier généré depuis les données autoritatives du tenant et conservé avec sa version et son empreinte.',
    signatureLabel: 'Validation finance',
    signatureName: 'Établissement client · AngelCare 360',
  }
}
