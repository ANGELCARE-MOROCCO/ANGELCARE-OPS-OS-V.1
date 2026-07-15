import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_COLORS } from '../Angelcare360OperatorVisualSystem'

type Props = {
  id?: string
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Angelcare360OperatorDossierSection({
  id,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: Props) {
  return (
    <section id={id} style={sectionStyle}>
      <header style={headerStyle}>
        <div style={headingStyle}>
          {eyebrow ? <div style={eyebrowStyle}>{eyebrow}</div> : null}
          <div style={titleRowStyle}>
            <h2 style={titleStyle}>{title}</h2>
            {actions ? <div style={actionsStyle}>{actions}</div> : null}
          </div>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>
      </header>
      <div style={bodyStyle}>{children}</div>
    </section>
  )
}

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  borderRadius: 28,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.97) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const headingStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 11,
  fontWeight: 900,
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
  alignItems: 'center',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 20,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.65,
  fontWeight: 600,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const bodyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}
