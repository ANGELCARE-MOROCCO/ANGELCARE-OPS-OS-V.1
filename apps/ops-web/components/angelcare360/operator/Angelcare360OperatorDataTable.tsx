import type { ReactNode } from 'react'
import Angelcare360OperatorDataTableClient, {
  type Angelcare360OperatorPreparedColumn,
  type Angelcare360OperatorPreparedRow,
} from './Angelcare360OperatorDataTableClient'

export type Angelcare360OperatorTableColumn = {
  key: string
  label: string
  render: (row: Record<string, unknown>) => ReactNode
  align?: 'left' | 'right' | 'center'
}

type Props = {
  title: string
  description?: string
  columns: Array<Angelcare360OperatorTableColumn>
  rows: any[]
  emptyTitle: string
  emptyDescription: string
  rowKey?: (row: any) => string
  hrefKey?: (row: any) => string | null
  minWidth?: number
}

/**
 * Server-side adapter for the interactive Operator data table.
 *
 * The route pages are Server Components and define render/rowKey/hrefKey
 * callbacks. Next.js cannot serialize those functions into a Client Component.
 * This adapter executes every callback on the server, then sends only prepared,
 * serializable columns, rows, links and React nodes to the client renderer.
 */
export default function Angelcare360OperatorDataTable({
  title,
  description,
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  rowKey,
  hrefKey,
  minWidth = 900,
}: Props) {
  const preparedColumns: Angelcare360OperatorPreparedColumn[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    align: column.align,
  }))

  const preparedRows: Angelcare360OperatorPreparedRow[] = rows.map((row, index) => {
    const record = toRecord(row)
    const id = rowKey?.(row) || stableKey(record, index)
    const href = hrefKey?.(row) || null

    return {
      id,
      href,
      searchText: searchableRow(record),
      cells: columns.map((column) => {
        const rendered = column.render(record)
        const content = sanitizeRenderedReference(rendered, column.label)
        const primitive = renderPrimitive(content, record[column.key])

        return {
          key: column.key,
          content,
          primitive,
          isPrimitive: typeof content === 'string' || typeof content === 'number',
        }
      }),
    }
  })

  return (
    <Angelcare360OperatorDataTableClient
      title={title}
      description={description}
      columns={preparedColumns}
      rows={preparedRows}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      minWidth={minWidth}
    />
  )
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return { value }
}

function searchableRow(row: Record<string, unknown>) {
  try {
    return JSON.stringify(row, (_key, value) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
      if (value === null || value === undefined) return ''
      if (typeof value === 'bigint') return value.toString()
      return value
    })
  } catch {
    return Object.values(row).map((value) => String(value ?? '')).join(' ')
  }
}

function renderPrimitive(content: ReactNode, raw: unknown) {
  if (typeof content === 'string' || typeof content === 'number') return String(content)
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return String(raw)
  }
  return null
}

function stableKey(row: Record<string, unknown>, index: number) {
  const id = row.id || row.code || row.slug || row.reference || row.invoice_number
  return id ? String(id) : `operator-row-${index}`
}


function sanitizeRenderedReference(content: ReactNode, label: string): ReactNode {
  if (typeof content !== 'string') return content
  if (!isTechnicalIdentifier(content)) return content
  const normalized = label.toLowerCase()
  if (normalized.includes('client')) return 'Client lié'
  if (normalized.includes('tenant')) return 'Tenant lié'
  if (normalized.includes('facture')) return 'Facture liée'
  if (normalized.includes('abonnement')) return 'Abonnement lié'
  if (normalized.includes('assign')) return 'Opérateur assigné'
  return 'Référence protégée'
}

function isTechnicalIdentifier(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
    || /^00000000-0000-0000-0000-[0-9a-f]{12}$/i.test(value.trim())
}
