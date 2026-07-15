import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  label: string
  value: string
  detail?: string
}

export default function Angelcare360OperatorKpiCard({ label, value, detail }: Props) {
  return (
    <article style={cardStyle}>
      <div style={accentStyle} />
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
      {detail ? <p style={detailStyle}>{detail}</p> : null}
    </article>
  )
}

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.98) 100%)',
  padding: 16,
  boxShadow: '0 18px 48px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 6,
  position: 'relative',
  overflow: 'hidden',
}

const accentStyle: React.CSSProperties = {
  width: 56,
  height: 4,
  borderRadius: 999,
  background: `linear-gradient(90deg, ${ANGELCARE360_OPERATOR_COLORS.blue} 0%, ${ANGELCARE360_OPERATOR_COLORS.blueBorderActive} 100%)`,
}

const labelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const valueStyle: React.CSSProperties = {
  marginTop: 4,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 28,
  fontWeight: 950,
}

const detailStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}
