'use client'

import Link from 'next/link'
import type { Angelcare360PeopleRowActionDefinition } from '@/types/angelcare360/people'

type Angelcare360PeopleTableProps = {
  columns: Array<{ key: string; label: string; kind?: 'text' | 'status' | 'date' | 'datetime' | 'number' | 'boolean' | 'chips'; width?: string }>
  rows: Array<Record<string, unknown>>
  actions?: Angelcare360PeopleRowActionDefinition[]
  onRowAction?: (action: Angelcare360PeopleRowActionDefinition, row: Record<string, unknown>) => void
  emptyFallback?: React.ReactNode
  detailHrefKey?: string
}

function formatValue(kind: Angelcare360PeopleTableProps['columns'][number]['kind'], value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (kind === 'boolean') return value ? 'Oui' : 'Non'
  if (kind === 'number') return typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value)
  if (kind === 'date' || kind === 'datetime') {
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: kind === 'datetime' ? 'short' : undefined,
    })
  }
  if (Array.isArray(value)) return value.map(String).join(' · ')
  return String(value)
}

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase()
  if (['active', 'actif', 'published', 'sent', 'open', 'completed', 'approved', 'enrolled', 'verified', 'read', 'delivered', 'recu', 'validé'].includes(normalized)) {
    return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
  }
  if (['planned', 'pending', 'draft', 'new', 'en cours', 'requis', 'notice'].includes(normalized)) {
    return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
  }
  if (['warning'].includes(normalized)) {
    return { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }
  }
  if (['inactive', 'archived', 'closed', 'suspended', 'cancelled', 'rejected', 'expired', 'expire', 'expired', 'critical'].includes(normalized)) {
    return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
  }
  return { background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }
}

export default function Angelcare360PeopleTable({
  columns,
  rows,
  actions = [],
  onRowAction,
  emptyFallback,
  detailHrefKey,
}: Angelcare360PeopleTableProps) {
  if (!rows.length) {
    return <>{emptyFallback}</>
  }

  const firstColumnKey = columns[0]?.key || null

  return (
    <div style={tableShellStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={thStyle}>
                {column.label}
              </th>
            ))}
            {actions.length > 0 ? <th style={thStyle}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id || row.code || JSON.stringify(row))} style={trStyle}>
              {columns.map((column) => {
                const value = row[column.key]
                if (column.kind === 'status' && typeof value === 'string') {
                  const statusStyle = getStatusStyle(value)
                  return (
                    <td key={column.key} style={tdStyle}>
                      <span style={{ ...pillStyle, ...statusStyle }}>{value}</span>
                    </td>
                  )
                }
                if (column.kind === 'chips' && Array.isArray(value)) {
                  return (
                    <td key={column.key} style={tdStyle}>
                      <div style={chipsStyle}>
                        {value.map((item) => (
                          <span key={String(item)} style={chipStyle}>
                            {String(item)}
                          </span>
                        ))}
                      </div>
                    </td>
                  )
                }
                const rawValue = formatValue(column.kind, value)
                const href = detailHrefKey ? String(row[detailHrefKey] || '') : ''
                const shouldLink = Boolean(href) && column.key === firstColumnKey && typeof rawValue === 'string'
                return (
                  <td key={column.key} style={tdStyle}>
                    {shouldLink ? (
                      <Link href={href} style={detailLinkStyle}>
                        {rawValue}
                      </Link>
                    ) : (
                      rawValue
                    )}
                  </td>
                )
              })}
              {actions.length > 0 ? (
                <td style={tdStyle}>
                  <div style={actionRowStyle}>
                    {actions.map((action) => {
                      const disabled = Boolean(action.disabledReason)
                      return (
                        <button
                          key={action.key}
                          type="button"
                          onClick={() => onRowAction?.(action, row)}
                          disabled={disabled}
                          title={action.disabledReason}
                          style={disabled ? disabledActionStyle : action.kind === 'danger' ? dangerActionStyle : action.kind === 'primary' ? primaryActionStyle : secondaryActionStyle}
                        >
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tableShellStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '15px 16px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#64748b',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '15px 16px',
  borderBottom: '1px solid #eef2f7',
  color: '#0f172a',
  fontSize: 14,
  verticalAlign: 'top',
}

const trStyle: React.CSSProperties = {
  background: '#fff',
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 900,
}

const chipsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '4px 8px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 800,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
}

const secondaryActionStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '8px 10px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const primaryActionStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 12,
  padding: '8px 10px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const dangerActionStyle: React.CSSProperties = {
  border: '1px solid #fecaca',
  borderRadius: 12,
  padding: '8px 10px',
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledActionStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 12,
  padding: '8px 10px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const detailLinkStyle: React.CSSProperties = {
  color: '#1d4ed8',
  fontWeight: 900,
  textDecoration: 'none',
}
