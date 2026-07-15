type Angelcare360AdministrationContextRowProps = {
  items: Array<{ label: string; value: string }>
}

export default function Angelcare360AdministrationContextRow({ items }: Angelcare360AdministrationContextRowProps) {
  return (
    <div style={rowStyle}>
      {items.map((item) => (
        <div key={item.label} style={chipStyle}>
          <span style={labelStyle}>{item.label}</span>
          <span style={valueStyle}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const chipStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: '10px 12px',
  minWidth: 160,
}

const labelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const valueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 800,
}

