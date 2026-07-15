import type { ReactNode } from 'react'
import Link from 'next/link'
import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

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
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Tableau opérateur</div>
          <h2 style={titleStyle}>{title}</h2>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={emptyStyle}>
          <div style={emptyTitleStyle}>{emptyTitle}</div>
          <div style={emptyDescriptionStyle}>{emptyDescription}</div>
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={{ ...tableStyle, minWidth }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={{ ...thStyle, textAlign: column.align || 'left' }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowHref = hrefKey?.(row) || null
                const rowId = rowKey?.(row) || JSON.stringify(row)
                return (
                  <tr key={rowId} style={rowStyle}>
                    {columns.map((column) => {
                      const cell = column.render(row)
                      return (
                        <td key={column.key} style={{ ...tdStyle, textAlign: column.align || 'left' }}>
                          {rowHref && column.key === columns[0]?.key && typeof cell === 'string' ? (
                            <Link href={rowHref} style={detailLinkStyle}>
                              {cell}
                            </Link>
                          ) : (
                            cell
                          )}
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

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 20,
  borderRadius: 24,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.97) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 20,
  fontWeight: 950,
}

const descriptionStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.65,
  fontWeight: 600,
}

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 20,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.white,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '13px 14px',
  background:
    'linear-gradient(180deg, rgba(248,250,252,.98) 0%, rgba(241,245,249,.98) 100%)',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
  borderBottom: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  position: 'sticky',
  top: 0,
  zIndex: 1,
}

const tdStyle: React.CSSProperties = {
  padding: '13px 14px',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  verticalAlign: 'top',
  borderBottom: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  fontWeight: 600,
}

const rowStyle: React.CSSProperties = {
  background: ANGELCARE360_OPERATOR_COLORS.white,
  transition: 'background-color .15s ease, box-shadow .15s ease',
}

const emptyStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background:
    'linear-gradient(180deg, rgba(240,253,244,.96) 0%, rgba(255,255,255,.96) 100%)',
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.greenBorder}`,
  display: 'grid',
  gap: 8,
}

const emptyTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.green,
  fontWeight: 900,
}

const emptyDescriptionStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.green,
  lineHeight: 1.6,
  fontWeight: 600,
}

const detailLinkStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blueDeep,
  fontWeight: 900,
  textDecoration: 'none',
}
