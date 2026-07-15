import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function Angelcare360OperatorRightPanel({ title, subtitle, children }: Props) {
  return (
    <aside style={cardStyle}>
      <div>
        <div style={eyebrowStyle}>Intelligence</div>
        <h2 style={titleStyle}>{title}</h2>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </aside>
  )
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

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 18,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.6,
  fontWeight: 600,
}
