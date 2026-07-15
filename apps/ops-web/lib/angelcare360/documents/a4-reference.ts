import type { Angelcare360DocumentConfidentiality } from '@/types/angelcare360/documents'

export function cleanAngelcare360ReferenceCode(value: string) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildAngelcare360A4Reference(prefix: string, id?: string | null) {
  const cleanPrefix = cleanAngelcare360ReferenceCode(prefix) || 'AC360'
  const cleanId = String(id || '')
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
  return cleanId ? `${cleanPrefix}-${cleanId}` : `${cleanPrefix}-${new Date().getTime().toString(36).toUpperCase()}`
}

export function getAngelcare360ConfidentialityLabel(value: Angelcare360DocumentConfidentiality) {
  switch (value) {
    case 'public':
      return 'Public'
    case 'internal':
      return 'Interne'
    case 'confidential':
      return 'Confidentiel'
    case 'strictly_confidential':
      return 'Strictement confidentiel'
    default:
      return 'Confidentiel'
  }
}

export function formatAngelcare360A4Date(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

