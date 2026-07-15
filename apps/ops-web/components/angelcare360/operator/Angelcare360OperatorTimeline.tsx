import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Item = {
  title: string
  detail?: string
  timestamp?: string
  tone?: 'info' | 'warning' | 'critical' | 'success'
}

type Props = {
  title: string
  items: Item[]
}

export default function Angelcare360OperatorTimeline({ title, items }: Props) {
  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>Chronologie</div>
      <h2 style={titleStyle}>{title}</h2>
      <div style={listStyle}>
        {items.map((item) => (
          <article key={`${item.title}-${item.timestamp || 'time'}`} style={itemStyle}>
            <div style={dotStyle(item.tone)} />
            <div style={contentStyle}>
              <div style={itemTitleStyle}>{item.title}</div>
              {item.detail ? <div style={itemDetailStyle}>{item.detail}</div> : null}
              {item.timestamp ? <div style={timestampStyle}>{item.timestamp}</div> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function dotStyle(tone?: Item['tone']): React.CSSProperties {
  const palette = {
    info: ANGELCARE360_OPERATOR_COLORS.blue,
    warning: ANGELCARE360_OPERATOR_COLORS.amber,
    critical: ANGELCARE360_OPERATOR_COLORS.red,
    success: ANGELCARE360_OPERATOR_COLORS.green,
  }
  return { width: 12, height: 12, borderRadius: 999, background: palette[tone || 'info'], marginTop: 6, flexShrink: 0 }
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
  display: 'grid',
  gap: 14,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 18,
  fontWeight: 950,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'start',
  padding: 12,
  borderRadius: 16,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
}

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const itemTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
}

const itemDetailStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}

const timestampStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 12,
  fontWeight: 700,
}
