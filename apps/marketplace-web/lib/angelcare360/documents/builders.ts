import { buildAngelcare360A4Reference } from './a4-reference'
import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'

type DocumentRecord = Record<string, unknown>

function record(value: unknown): DocumentRecord {
  return value && typeof value === 'object' ? (value as DocumentRecord) : {}
}

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function money(value: unknown) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

function sectionLines(...pairs: Array<[string, string | null | undefined]>) {
  return pairs.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '').map(([label, value]) => `${label}: ${String(value)}`)
}

function metadataLines(...pairs: Array<[string, unknown]>) {
  return pairs
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([label, value]) => ({ label, value: text(value) }))
}

function summaryLines(title: string, lines: string[]) {
  return [title, ...lines.filter(Boolean)]
}

export function buildOperatorInvoiceA4Model(input: {
  invoice?: unknown
  client?: unknown
  billingAccount?: unknown
  subscription?: unknown
}): Angelcare360A4DocumentModel {
  const invoice = record(input.invoice)
  const client = record(input.client)
  const billingAccount = record(input.billingAccount)
  const subscription = record(input.subscription)
  return {
    templateKey: 'operator-saas-invoice',
    title: 'Facture SaaS AngelCare 360',
    family: 'Facturation opérateur',
    owner: 'operator',
    referenceCode: buildAngelcare360A4Reference('INV', text(invoice.id || invoice.invoice_number || '')),
    version: 'v1.0',
    issueDate: text(invoice.issue_date || new Date().toISOString().slice(0, 10)),
    confidentiality: 'confidential',
    preparedBy: 'AngelCare 360 · Backoffice opérateur',
    subject: text(invoice.invoice_number || invoice.id || ''),
    clientName: text(client.display_name || client.legal_name || 'Client'),
    tenantName: text(subscription.tenant_id || invoice.subscription_id || '—'),
    schoolName: null,
    summaryLines: summaryLines('Résumé facturation', [
      `Facture ${text(invoice.invoice_number || invoice.id)}`,
      `Montant total: ${money(invoice.total_mad)}`,
      `Montant payé: ${money(invoice.amount_paid_mad)}`,
      `Solde dû: ${money(invoice.balance_due_mad)}`,
      `Échéance: ${text(invoice.due_date || '—')}`,
    ]),
    metadataLines: metadataLines(
      ['Client', client.display_name || client.client_code || client.id || '—'],
      ['Raison sociale', client.legal_name || '—'],
      ['Compte facturation', billingAccount.billing_name || '—'],
      ['Cycle', subscription.billing_cycle || '—'],
      ['Statut', invoice.status || '—'],
    ),
    metrics: [
      { label: 'Total', value: money(invoice.total_mad), tone: 'primary' },
      { label: 'Payé', value: money(invoice.amount_paid_mad), tone: 'success' },
      { label: 'Solde', value: money(invoice.balance_due_mad), tone: 'warning' },
      { label: 'Statut', value: text(invoice.status || '—'), tone: 'neutral' },
    ],
    sections: [
      {
        title: 'Données de facturation',
        lines: sectionLines(
          ['Numéro', text(invoice.invoice_number || invoice.id)],
          ['Émission', text(invoice.issue_date || '—')],
          ['Échéance', text(invoice.due_date || '—')],
          ['Période', `${text(invoice.period_start || '—')} → ${text(invoice.period_end || '—')}`],
          ['Compte', text(billingAccount.billing_name || '—')],
          ['Email facture', text(billingAccount.billing_email || client.primary_contact_email || '—')],
        ),
      },
    ],
    table: {
      headers: ['Rubrique', 'Valeur'],
      rows: [
        ['Client', text(client.display_name || client.legal_name || '—')],
        ['Abonnement', text(subscription.subscription_code || invoice.subscription_id || '—')],
        ['Total', money(invoice.total_mad)],
        ['Payé', money(invoice.amount_paid_mad)],
        ['Solde dû', money(invoice.balance_due_mad)],
      ],
    },
    footerNote: 'Facture opérateur A4 prête à l’impression navigateur ou à la génération PDF serveur.',
    statusLabel: text(invoice.status || '—'),
    signatureLabel: 'Validation opérateur',
    signatureName: 'Équipe AngelCare 360',
  }
}

export function buildOperatorReceiptA4Model(input: {
  payment?: unknown
  client?: unknown
  invoice?: unknown
}): Angelcare360A4DocumentModel {
  const payment = record(input.payment)
  const client = record(input.client)
  const invoice = record(input.invoice)
  return {
    templateKey: 'operator-payment-receipt',
    title: 'Reçu de paiement SaaS',
    family: 'Facturation opérateur',
    owner: 'operator',
    referenceCode: buildAngelcare360A4Reference('RCP', text(payment.id || payment.payment_reference || '')),
    version: 'v1.0',
    issueDate: text(payment.payment_date || new Date().toISOString().slice(0, 10)),
    confidentiality: 'confidential',
    preparedBy: 'AngelCare 360 · Backoffice opérateur',
    subject: text(payment.payment_reference || payment.id || ''),
    clientName: text(client.display_name || client.legal_name || 'Client'),
    tenantName: text(invoice.subscription_id || '—'),
    schoolName: null,
    summaryLines: summaryLines('Résumé reçu', [
      `Référence paiement: ${text(payment.payment_reference || payment.id)}`,
      `Montant: ${money(payment.amount_mad)}`,
      `Méthode: ${text(payment.method || '—')}`,
      `Statut: ${text(payment.status || '—')}`,
    ]),
    metadataLines: metadataLines(
      ['Client', client.display_name || client.client_code || client.id || '—'],
      ['Facture liée', invoice.invoice_number || payment.invoice_id || '—'],
      ['Date paiement', payment.payment_date || '—'],
      ['Réception', payment.received_by || '—'],
    ),
    metrics: [
      { label: 'Montant', value: money(payment.amount_mad), tone: 'success' },
      { label: 'Statut', value: text(payment.status || '—'), tone: 'primary' },
      { label: 'Référence', value: text(payment.payment_reference || payment.id || '—'), tone: 'neutral' },
    ],
    sections: [
      {
        title: 'Informations paiement',
        lines: sectionLines(
          ['Référence', text(payment.payment_reference || payment.id)],
          ['Date', text(payment.payment_date || '—')],
          ['Méthode', text(payment.method || '—')],
          ['Facture', text(invoice.invoice_number || payment.invoice_id || '—')],
        ),
      },
    ],
    table: {
      headers: ['Rubrique', 'Valeur'],
      rows: [
        ['Client', text(client.display_name || client.legal_name || '—')],
        ['Montant', money(payment.amount_mad)],
        ['État', text(payment.status || '—')],
      ],
    },
    footerNote: 'Reçu A4 prêt à l’impression navigateur ou à la génération PDF serveur.',
    statusLabel: text(payment.status || '—'),
    signatureLabel: 'Validation opérateur',
    signatureName: 'Équipe AngelCare 360',
  }
}

export function buildOperatorStatementA4Model(input: {
  client?: unknown
  invoices?: unknown[]
  payments?: unknown[]
}): Angelcare360A4DocumentModel {
  const client = record(input.client)
  const invoices = (input.invoices || []).map(record)
  const payments = (input.payments || []).map(record)
  const dueMad = invoices.reduce((sum, item) => sum + Number(item.balance_due_mad || 0), 0)
  const paidMad = payments.filter((payment) => String(payment.status) === 'confirmed').reduce((sum, item) => sum + Number(item.amount_mad || 0), 0)
  return {
    templateKey: 'operator-client-statement',
    title: 'État de compte client',
    family: 'Facturation opérateur',
    owner: 'operator',
    referenceCode: buildAngelcare360A4Reference('STM', text(client.id || client.client_code || '')),
    version: 'v1.0',
    issueDate: new Date().toISOString().slice(0, 10),
    confidentiality: 'confidential',
    preparedBy: 'AngelCare 360 · Backoffice opérateur',
    clientName: text(client.display_name || client.legal_name || 'Client'),
    tenantName: text(client.client_code || '—'),
    schoolName: null,
    summaryLines: summaryLines('Résumé compte', [
      `Factures: ${invoices.length}`,
      `Paiements confirmés: ${payments.filter((payment) => String(payment.status) === 'confirmed').length}`,
      `Total encaissé: ${money(paidMad)}`,
      `Solde dû: ${money(dueMad)}`,
    ]),
    metadataLines: metadataLines(
      ['Client', client.display_name || client.client_code || '—'],
      ['Statut client', client.status || '—'],
      ['Cycle', client.lifecycle_stage || '—'],
    ),
    metrics: [
      { label: 'Factures', value: text(invoices.length), tone: 'primary' },
      { label: 'Paiements', value: text(payments.length), tone: 'success' },
      { label: 'Encaissé', value: money(paidMad), tone: 'success' },
      { label: 'Solde dû', value: money(dueMad), tone: 'warning' },
    ],
    sections: [
      { title: 'Vue factures', lines: invoices.slice(0, 5).map((invoice) => `${text(invoice.invoice_number || invoice.id)} · ${text(invoice.status || '—')} · ${money(invoice.balance_due_mad)}`) },
      { title: 'Vue paiements', lines: payments.slice(0, 5).map((payment) => `${text(payment.payment_reference || payment.id)} · ${text(payment.status || '—')} · ${money(payment.amount_mad)}`) },
    ],
    table: {
      headers: ['Facture', 'Statut', 'Solde dû'],
      rows: invoices.slice(0, 8).map((invoice) => [
        text(invoice.invoice_number || invoice.id),
        text(invoice.status || '—'),
        money(invoice.balance_due_mad),
      ]),
    },
    footerNote: 'État de compte A4 prêt à l’impression navigateur ou à la génération PDF serveur.',
    statusLabel: text(client.status || '—'),
    signatureLabel: 'Validation opérateur',
    signatureName: 'Équipe AngelCare 360',
  }
}

export function buildCustomerGeneratedDocumentA4Model(input: unknown): Angelcare360A4DocumentModel {
  const document = record(input)
  const metadata = record(document.metadata_json)
  return {
    templateKey: 'customer-student-list',
    title: text(document.title || 'Document généré'),
    family: text(document.category || 'Documents établissement'),
    owner: 'customer',
    referenceCode: buildAngelcare360A4Reference('DOC', text(document.id || document.document_code || '')),
    version: 'v1.0',
    issueDate: text(document.created_at || new Date().toISOString().slice(0, 10)),
    confidentiality: 'internal',
    preparedBy: 'AngelCare 360 · Command Center',
    clientName: text(document.file_name || document.title || 'Document'),
    tenantName: text(document.storage_provider || '—'),
    schoolName: null,
    summaryLines: summaryLines('Résumé documentaire', [
      `Code document: ${text(document.document_code || document.id || '—')}`,
      `Statut: ${text(document.status || '—')}`,
      `Visibilité: ${text(document.visibility || '—')}`,
    ]),
    metadataLines: metadataLines(
      ['Chemin', document.file_path || '—'],
      ['Stockage', document.storage_provider || '—'],
      ['Poids', document.file_size_bytes ? `${Number(document.file_size_bytes).toLocaleString('fr-FR')} octets` : 'Inconnu'],
    ),
    metrics: [
      { label: 'Statut', value: text(document.status || '—'), tone: 'primary' },
      { label: 'Visibilité', value: text(document.visibility || '—'), tone: 'neutral' },
    ],
    sections: [
      { title: 'Métadonnées', lines: sectionLines(['Titre', text(document.title || '—')], ['Fichier', text(document.file_name || '—')], ['Chemin', text(document.file_path || '—')]) },
    ],
    footerNote: 'Document A4 de gouvernance prêt à l’impression navigateur ou à la génération PDF serveur.',
    statusLabel: text(document.status || '—'),
  }
}

export function buildCustomerExportFileA4Model(input: unknown): Angelcare360A4DocumentModel {
  const file = record(input)
  const metadata = record(file.metadata_json)
  return {
    templateKey: 'customer-audit-extract',
    title: text(file.file_name || 'Export établissement'),
    family: text(file.export_format || 'Exports établissement'),
    owner: 'customer',
    referenceCode: buildAngelcare360A4Reference('EXP', text(file.id || file.export_code || '')),
    version: 'v1.0',
    issueDate: text(file.created_at || new Date().toISOString().slice(0, 10)),
    confidentiality: 'internal',
    preparedBy: 'AngelCare 360 · Command Center',
    clientName: text(file.report_label || file.report_code || 'Export'),
    tenantName: text(file.storage_provider || '—'),
    schoolName: null,
    summaryLines: summaryLines('Résumé export', [
      `Format: ${text(file.export_format || '—')}`,
      `Statut: ${text(file.status || '—')}`,
      `Poids: ${file.file_size_bytes ? `${Number(file.file_size_bytes).toLocaleString('fr-FR')} octets` : 'Inconnu'}`,
    ]),
    metadataLines: metadataLines(
      ['Fichier', file.file_name || '—'],
      ['Chemin', file.file_path || '—'],
      ['Stockage', file.storage_provider || '—'],
    ),
    metrics: [
      { label: 'Format', value: text(file.export_format || '—'), tone: 'primary' },
      { label: 'Statut', value: text(file.status || '—'), tone: 'neutral' },
    ],
    sections: [
      { title: 'Détails export', lines: sectionLines(['Code export', text(file.export_code || '—')], ['Document lié', text(file.file_code || '—')]) },
    ],
    footerNote: 'Export A4 prêt à l’impression navigateur ou à la génération PDF serveur.',
    statusLabel: text(file.status || '—'),
  }
}
