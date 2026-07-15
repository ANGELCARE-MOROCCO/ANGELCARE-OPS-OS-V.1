import {
  ANGELCARE360_COLORS,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  headers: string[]
  rows: string[][]
}

export default function Angelcare360A4Table({ headers, rows }: Props) {
  return (
    <section style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={thStyle}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={`${index}-${row.join('|')}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} style={tdStyle}>{cell}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} style={emptyCellStyle}>Aucune ligne disponible.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}

const tableWrapStyle: React.CSSProperties = {
  ...angelcare360SectionBackdropStyle,
  overflow: 'hidden',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: ANGELCARE360_COLORS.backgroundAlt,
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: .7,
  color: ANGELCARE360_COLORS.navy,
  borderBottom: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: `1px solid ${ANGELCARE360_COLORS.borderMuted}`,
  color: ANGELCARE360_COLORS.slate,
  fontSize: 12,
  fontWeight: 600,
  verticalAlign: 'top',
}

const emptyCellStyle: React.CSSProperties = {
  padding: 14,
  color: ANGELCARE360_COLORS.slateMuted,
  fontWeight: 700,
}

