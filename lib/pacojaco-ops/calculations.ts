import type {
  PacojacoDocumentItem,
  PacojacoDocumentRow,
  PacojacoDocumentStats,
  PacojacoDiscountType,
} from './types'

export function safeNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : fallback

  return Number.isFinite(parsed) ? parsed : fallback
}

export function round2(value: unknown) {
  return Math.round(safeNumber(value) * 100) / 100
}

export function clampNonNegative(value: unknown) {
  return Math.max(0, round2(value))
}

export function formatMoney(value: unknown, currency = 'MAD') {
  const amount = round2(value)

  try {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency || 'MAD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency || 'MAD'}`
  }
}

export function formatCompactMoney(value: unknown) {
  return round2(value).toFixed(2)
}

export function calculateItemTotal(item: Pick<PacojacoDocumentItem, 'quantity' | 'unit_price'>) {
  return clampNonNegative(safeNumber(item.quantity) * safeNumber(item.unit_price))
}

export function normalizeDocumentItems(items: Array<Partial<PacojacoDocumentItem> & { client_id?: string; clientId?: string }> = []) {
  return items
    .map((item, index) => {
      const designation = String(item.designation || '').trim()
      const total = calculateItemTotal(item as PacojacoDocumentItem)

      return {
        id: item.id ? String(item.id) : undefined,
        document_id: item.document_id ? String(item.document_id) : null,
        sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
        ref: String(item.ref || '').trim() || null,
        designation,
        description: String(item.description || '').trim() || null,
        category: String(item.category || '').trim() || 'SVC',
        unit_price: round2(item.unit_price),
        quantity: round2(item.quantity || 1),
        unit: String(item.unit || '').trim() || null,
        total,
      }
    })
    .filter((item) => item.designation.length > 0)
    .map((item, index) => ({ ...item, sort_order: index, total: calculateItemTotal(item) }))
}

export function calculateDocumentTotals(input: {
  items: Array<Pick<PacojacoDocumentItem, 'quantity' | 'unit_price'>>
  discountType?: PacojacoDiscountType | null
  discountValue?: unknown
  taxRate?: unknown
  advanceAmount?: unknown
}) {
  const subtotal = round2(
    input.items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  )
  const discountType = input.discountType || null
  const discountValue = clampNonNegative(input.discountValue)
  const discountTotal =
    discountType === 'percent'
      ? round2((subtotal * discountValue) / 100)
      : discountType === 'amount'
        ? Math.min(subtotal, round2(discountValue))
        : 0
  const taxableBase = Math.max(0, round2(subtotal - discountTotal))
  const taxRate = clampNonNegative(input.taxRate)
  const taxTotal = round2((taxableBase * taxRate) / 100)
  const totalTtc = round2(Math.max(0, taxableBase + taxTotal))
  const advanceAmount = clampNonNegative(input.advanceAmount)
  const remainingAmount = round2(Math.max(0, totalTtc - advanceAmount))

  return {
    subtotal,
    discount_total: discountTotal,
    tax_total: taxTotal,
    total_ttc: totalTtc,
    remaining_amount: remainingAmount,
    taxable_base: taxableBase,
    advance_amount: advanceAmount,
  }
}

export function calculatePacojacoStats(
  documents: Pick<PacojacoDocumentRow, 'document_type' | 'status' | 'total_ttc' | 'remaining_amount' | 'issue_date' | 'client_id'>[]
): PacojacoDocumentStats {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return documents.reduce<PacojacoDocumentStats>(
    (stats, doc) => {
      stats.totalDocuments += 1
      if (doc.document_type === 'invoice') stats.totalInvoices += 1
      if (doc.document_type === 'quote') stats.totalQuotes += 1
      if (doc.client_id) stats.documentsLinkedToClients += 1

      const statusKey = doc.status
      const statusMap: Record<string, keyof PacojacoDocumentStats> = {
        draft: 'draftDocuments',
        issued: 'issuedDocuments',
        sent: 'sentDocuments',
        accepted: 'acceptedDocuments',
        rejected: 'rejectedDocuments',
        paid: 'paidDocuments',
        partially_paid: 'partiallyPaidDocuments',
        cancelled: 'cancelledDocuments',
      }

      const statsKey = statusMap[statusKey]
      if (statsKey) {
        stats[statsKey] += 1
      }

      stats.totalBilledMad += safeNumber(doc.total_ttc)
      stats.totalRemainingMad += safeNumber(doc.remaining_amount)

      const issueDate = String(doc.issue_date || '')
      if (issueDate.startsWith(currentMonth)) {
        stats.thisMonthBilledMad += safeNumber(doc.total_ttc)
      }

      return stats
    },
    {
      totalDocuments: 0,
      totalInvoices: 0,
      totalQuotes: 0,
      totalClients: 0,
      documentsLinkedToClients: 0,
      draftDocuments: 0,
      issuedDocuments: 0,
      sentDocuments: 0,
      acceptedDocuments: 0,
      rejectedDocuments: 0,
      paidDocuments: 0,
      partiallyPaidDocuments: 0,
      cancelledDocuments: 0,
      totalBilledMad: 0,
      totalRemainingMad: 0,
      thisMonthBilledMad: 0,
    }
  )
}

export function displayStatusLabel(status: string) {
  return status.replace(/_/g, ' ')
}
