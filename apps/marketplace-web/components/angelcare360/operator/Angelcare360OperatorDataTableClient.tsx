'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Inbox, LayoutGrid, Search, Table2 } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

export type Angelcare360OperatorPreparedColumn = {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

type PreparedCell = {
  key: string
  content: ReactNode
  primitive: string | null
  isPrimitive: boolean
}

export type Angelcare360OperatorPreparedRow = {
  id: string
  href: string | null
  searchText: string
  cells: PreparedCell[]
}

type Props = {
  title: string
  description?: string
  columns: Angelcare360OperatorPreparedColumn[]
  rows: Angelcare360OperatorPreparedRow[]
  emptyTitle: string
  emptyDescription: string
  minWidth?: number
}

export default function Angelcare360OperatorDataTableClient({
  title,
  description,
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  minWidth = 900,
}: Props) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'table' | 'cards'>('table')

  const filteredRows = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return rows
    return rows.filter((row) => normalize(row.searchText).includes(normalized))
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
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
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
            const firstCell = row.cells[0]?.primitive || `Élément ${index + 1}`
            const content = (
              <>
                <div className={styles.entityCardTop}>
                  <span className={styles.entityCardTitle}>{firstCell}</span>
                  <span className={styles.entityCardIndex}>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className={styles.entityCardFields}>
                  {columns.slice(1, 4).map((column) => {
                    const cell = findCell(row, column.key)
                    return (
                      <div key={column.key} className={styles.entityField}>
                        <span className={styles.entityFieldLabel}>{column.label}</span>
                        <span className={styles.entityFieldValue}>{cell?.primitive || '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )

            return row.href ? (
              <Link key={row.id} href={row.href} className={styles.entityCard}>{content}</Link>
            ) : (
              <article key={row.id} className={styles.entityCard}>{content}</article>
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
              {filteredRows.map((row) => (
                <tr key={row.id} className={styles.tr}>
                  {columns.map((column, columnIndex) => {
                    const cell = findCell(row, column.key)
                    const content = cell?.content ?? null
                    return (
                      <td key={column.key} className={styles.td} style={{ textAlign: column.align || 'left' }}>
                        {row.href && columnIndex === 0 && cell?.isPrimitive ? (
                          <Link href={row.href} className={styles.detailLink}>
                            {content}<ArrowUpRight size={13} aria-hidden="true" />
                          </Link>
                        ) : content}
                      </td>
                    )
                  })}
                </tr>
              ))}
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

function findCell(row: Angelcare360OperatorPreparedRow, key: string) {
  return row.cells.find((cell) => cell.key === key)
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
