import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Item = {
  title: string
  detail?: string
  tone?: 'info' | 'warning' | 'critical'
  action?: ReactNode
}

type Props = {
  title: string
  items: Item[]
}

export default function Angelcare360OperatorActionQueue({ title, items }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>File opérateur</div>
          <h2 style={titleStyle}>{title}</h2>
        </div>
      </div>
      <div style={listStyle}>
        {items.map((item) => (
          <article key={`${item.title}-${item.detail || 'item'}`} style={itemStyle(item.tone)}>
            <div style={itemHeadingStyle}>{item.title}</div>
            {item.detail ? <div style={itemDetailStyle}>{item.detail}</div> : null}
            {item.action ? <div style={actionStyle}>{item.action}</div> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function itemStyle(tone?: Item['tone']): React.CSSProperties {
  if (tone === 'critical') {
    return { ...baseItemStyle, borderColor: ANGELCARE360_OPERATOR_COLORS.redBorder, background: ANGELCARE360_OPERATOR_COLORS.redSoft }
  }
  if (tone === 'warning') {
    return { ...baseItemStyle, borderColor: ANGELCARE360_OPERATOR_COLORS.amberBorder, background: ANGELCARE360_OPERATOR_COLORS.amberSoft }
  }
  return baseItemStyle
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

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
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
  marginBottom: 6,
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const baseItemStyle: React.CSSProperties = {
  borderRadius: 18,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.borderSoft,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  padding: 14,
  display: 'grid',
  gap: 6,
  boxShadow: '0 10px 24px rgba(15,23,42,.03)',
}

const itemHeadingStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
}

const itemDetailStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}

const actionStyle: React.CSSProperties = {
  marginTop: 4,
}
