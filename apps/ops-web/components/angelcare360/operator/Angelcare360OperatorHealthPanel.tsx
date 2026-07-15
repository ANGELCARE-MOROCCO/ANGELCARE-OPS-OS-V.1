import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'
import type { Angelcare360OperatorHealthDashboard } from '@/types/angelcare360/operator'
import Angelcare360OperatorStatusBadge from './Angelcare360OperatorStatusBadge'

type Props = {
  health: Angelcare360OperatorHealthDashboard
}

export default function Angelcare360OperatorHealthPanel({ health }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Santé client</div>
          <h2 style={titleStyle}>{health.scoreLabel}</h2>
          <p style={subtitleStyle}>{health.summary}</p>
        </div>
        <div style={scoreStyle}>
          <div style={scoreLabelStyle}>Score</div>
          <div style={scoreValueStyle}>{health.scoreValue === null ? '—' : `${health.scoreValue}/100`}</div>
        </div>
      </div>
      <div style={factorGridStyle}>
        {health.factors.map((factor) => (
          <article key={factor.label} style={factorStyle}>
            <div style={factorLabelStyle}>{factor.label}</div>
            <div style={factorValueStyle}>
              <Angelcare360OperatorStatusBadge status={factor.status} />
              {factor.value !== undefined && factor.value !== null ? <span>{String(factor.value)}</span> : null}
            </div>
            {factor.detail ? <div style={factorDetailStyle}>{factor.detail}</div> : null}
          </article>
        ))}
      </div>
    </section>
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

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
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

const scoreStyle: React.CSSProperties = {
  borderRadius: 20,
  padding: '12px 14px',
  background:
    'linear-gradient(180deg, rgba(239,246,255,.98) 0%, rgba(255,255,255,.98) 100%)',
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  fontWeight: 950,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}`,
  minWidth: 110,
  display: 'grid',
  gap: 2,
  justifyItems: 'end',
}

const scoreLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const scoreValueStyle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 950,
}

const factorGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10,
}

const factorStyle: React.CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  padding: 14,
  display: 'grid',
  gap: 8,
  boxShadow: '0 10px 24px rgba(15,23,42,.03)',
}

const factorLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
}

const factorValueStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  fontWeight: 700,
}

const factorDetailStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  lineHeight: 1.55,
  fontWeight: 600,
}
