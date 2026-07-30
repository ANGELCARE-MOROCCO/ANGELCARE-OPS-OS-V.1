'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Inbox, LayoutGrid, Search, Table2 } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

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
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'table' | 'cards'>('table')

  const filteredRows = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return rows
    return rows.filter((row) => normalize(searchableRow(row)).includes(normalized))
  }, [query, rows])

  return (
    <section className={styles.dataCard}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelEyebrow}>Instrument de lecture</div>
          <h2 className={styles.panelTitle}>{title}</h2>
          {description ? <p className={styles.panelDescription}>{description}</p> : null}
        </div>
        <span className={styles.rowCount}>{filteredRows.length} / {rows.length}</span>
      </div>

      {rows.length ? (
        <div className={styles.tableToolbar}>
          <label className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Rechercher dans ${title.toLowerCase()}…`}
              aria-label={`Rechercher dans ${title}`}
            />
          </label>
          <div className={styles.viewControls} aria-label="Mode d’affichage">
            <button
              type="button"
              className={`${styles.viewButton} ${view === 'table' ? styles.viewButtonActive : ''}`}
              onClick={() => setView('table')}
              title="Vue tableau"
              aria-pressed={view === 'table'}
            >
              <Table2 size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.viewButton} ${view === 'cards' ? styles.viewButtonActive : ''}`}
              onClick={() => setView('cards')}
              title="Vue portefeuille"
              aria-pressed={view === 'cards'}
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="Aucun résultat dans cette vue" description="Modifiez la recherche pour réafficher les éléments disponibles." />
      ) : view === 'cards' ? (
        <div className={styles.cardGrid}>
          {filteredRows.map((row, index) => {
            const href = hrefKey?.(row) || null
            const id = rowKey?.(row) || stableKey(row, index)
            const firstCell = renderPrimitive(columns[0], row) || `Élément ${index + 1}`
            const content = (
              <>
                <div className={styles.entityCardTop}>
                  <span className={styles.entityCardTitle}>{firstCell}</span>
                  <span className={styles.entityCardIndex}>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className={styles.entityCardFields}>
                  {columns.slice(1, 4).map((column) => (
                    <div key={column.key} className={styles.entityField}>
                      <span className={styles.entityFieldLabel}>{column.label}</span>
                      <span className={styles.entityFieldValue}>{renderPrimitive(column, row) || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )
            return href ? (
              <Link key={id} href={href} className={styles.entityCard}>{content}</Link>
            ) : (
              <article key={id} className={styles.entityCard}>{content}</article>
            )
          })}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table} style={{ minWidth }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={styles.th} style={{ textAlign: column.align || 'left' }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const rowHref = hrefKey?.(row) || null
                const rowId = rowKey?.(row) || stableKey(row, index)
                return (
                  <tr key={rowId} className={styles.tr}>
                    {columns.map((column) => {
                      const cell = column.render(row)
                      return (
                        <td key={column.key} className={styles.td} style={{ textAlign: column.align || 'left' }}>
                          {rowHref && column.key === columns[0]?.key && (typeof cell === 'string' || typeof cell === 'number') ? (
                            <Link href={rowHref} className={styles.detailLink}>
                              {cell}<ArrowUpRight size={13} aria-hidden="true" />
                            </Link>
                          ) : cell}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.empty}>
      <div>
        <span className={styles.emptyIcon}><Inbox size={22} aria-hidden="true" /></span>
        <div className={styles.emptyTitle}>{title}</div>
        <div className={styles.emptyDescription}>{description}</div>
      </div>
    </div>
  )
}

function searchableRow(row: Record<string, unknown>) {
  try {
    return JSON.stringify(row, (_key, value) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
      if (value === null || value === undefined) return ''
      return value
    })
  } catch {
    return Object.values(row).map((value) => String(value ?? '')).join(' ')
  }
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function renderPrimitive(column: Angelcare360OperatorTableColumn, row: Record<string, unknown>) {
  const rendered = column.render(row)
  if (typeof rendered === 'string' || typeof rendered === 'number') return String(rendered)
  const raw = row[column.key]
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
  return null
}

function stableKey(row: Record<string, unknown>, index: number) {
  const id = row.id || row.code || row.slug || row.reference || row.invoice_number
  return id ? String(id) : `operator-row-${index}`
}
