import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Stage = {
  label: string
  count?: number | string
  tone?: 'info' | 'warning' | 'critical' | 'success'
}

type Props = {
  title: string
  stages: Stage[]
}

export default function Angelcare360OperatorPipeline({ title, stages }: Props) {
  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>Pipeline</div>
      <h2 style={titleStyle}>{title}</h2>
      <div style={gridStyle}>
        {stages.map((stage) => (
          <article key={stage.label} style={stageStyle(stage.tone)}>
            <div style={stageLabelStyle}>{stage.label}</div>
            <div style={stageCountStyle}>{stage.count ?? '—'}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

function stageStyle(tone?: Stage['tone']): React.CSSProperties {
  const palette = {
    info: { background: ANGELCARE360_OPERATOR_COLORS.blueSoft, border: ANGELCARE360_OPERATOR_COLORS.blueBorder },
    warning: { background: ANGELCARE360_OPERATOR_COLORS.amberSoft, border: ANGELCARE360_OPERATOR_COLORS.amberBorder },
    critical: { background: ANGELCARE360_OPERATOR_COLORS.redSoft, border: ANGELCARE360_OPERATOR_COLORS.redBorder },
    success: { background: ANGELCARE360_OPERATOR_COLORS.greenSoft, border: ANGELCARE360_OPERATOR_COLORS.greenBorder },
  }
  const selected = palette[tone || 'info']
  return { ...baseStageStyle, background: selected.background, borderColor: selected.border }
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
}

const baseStageStyle: React.CSSProperties = {
  borderRadius: 18,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.borderSoft,
  padding: 14,
  display: 'grid',
  gap: 8,
  boxShadow: '0 10px 24px rgba(15,23,42,.03)',
}

const stageLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontWeight: 900,
}

const stageCountStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 28,
  fontWeight: 950,
}
