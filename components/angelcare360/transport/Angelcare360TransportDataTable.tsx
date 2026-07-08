import type { ReactNode } from 'react'

export type Angelcare360TransportTableColumn<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
}

type Angelcare360TransportDataTableProps<T> = {
  title: string
  description?: string
  columns: Array<Angelcare360TransportTableColumn<T>>
  rows: T[]
  emptyTitle: string
  emptyDescription: string
}

export default function Angelcare360TransportDataTable<T>({
  title,
  description,
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: Angelcare360TransportDataTableProps<T>) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
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
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={{ ...thStyle, textAlign: column.align || 'left' }}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={rowStyle}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ ...tdStyle, textAlign: column.align || 'left' }}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
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
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
  letterSpacing: -0.2,
}

const descriptionStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 18,
  border: '1px solid #e2e8f0',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 760,
}

const thStyle: React.CSSProperties = {
  padding: '13px 14px',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
  borderBottom: '1px solid #e2e8f0',
}

const tdStyle: React.CSSProperties = {
  padding: '13px 14px',
  color: '#334155',
  verticalAlign: 'top',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: 600,
}

const rowStyle: React.CSSProperties = {
  background: '#fff',
}

const emptyStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: '#f0fdf4',
  display: 'grid',
  gap: 8,
}

const emptyTitleStyle: React.CSSProperties = {
  color: '#166534',
  fontWeight: 900,
}

const emptyDescriptionStyle: React.CSSProperties = {
  color: '#166534',
  lineHeight: 1.6,
  fontWeight: 600,
}
