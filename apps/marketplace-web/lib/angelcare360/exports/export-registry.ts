import type { Angelcare360ExportDefinition } from '@/types/angelcare360/exports'

const XLSX_LOCK = 'XLSX verrouillé : moteur tableur requis.'

const exportDefinitions: Angelcare360ExportDefinition[] = [
  {
    exportKey: 'operator-clients-csv',
    title: 'Clients opérateur',
    scope: 'operator',
    kind: 'clients',
    format: 'csv',
    supportedFormats: ['csv', 'json'],
    lockedReason: null,
    csvAvailable: true,
    xlsxAvailable: false,
    pdfAvailable: false,
  },
  {
    exportKey: 'operator-invoices-csv',
    title: 'Factures opérateur',
    scope: 'operator',
    kind: 'invoices',
    format: 'csv',
    supportedFormats: ['csv', 'json', 'pdf_a4'],
    lockedReason: null,
    csvAvailable: true,
    xlsxAvailable: false,
    pdfAvailable: true,
  },
  {
    exportKey: 'operator-payments-csv',
    title: 'Paiements opérateur',
    scope: 'operator',
    kind: 'payments',
    format: 'csv',
    supportedFormats: ['csv', 'json', 'pdf_a4'],
    lockedReason: null,
    csvAvailable: true,
    xlsxAvailable: false,
    pdfAvailable: true,
  },
  {
    exportKey: 'customer-students-csv',
    title: 'Élèves établissement',
    scope: 'customer',
    kind: 'students',
    format: 'csv',
    supportedFormats: ['csv', 'pdf_a4', 'json'],
    lockedReason: null,
    csvAvailable: true,
    xlsxAvailable: false,
    pdfAvailable: true,
  },
  {
    exportKey: 'customer-attendance-csv',
    title: 'Présences mensuelles',
    scope: 'customer',
    kind: 'attendance',
    format: 'csv',
    supportedFormats: ['csv', 'pdf_a4', 'json'],
    lockedReason: 'L’export des présences détaillées nécessite un moteur de requête horaire.',
    csvAvailable: false,
    xlsxAvailable: false,
    pdfAvailable: false,
  },
]

export function listAngelcare360ExportDefinitions() {
  return exportDefinitions.slice()
}

export function getAngelcare360ExportDefinition(exportKey: string) {
  return exportDefinitions.find((definition) => definition.exportKey === exportKey) || null
}

export function getAngelcare360XlsxLockedReason() {
  return XLSX_LOCK
}

