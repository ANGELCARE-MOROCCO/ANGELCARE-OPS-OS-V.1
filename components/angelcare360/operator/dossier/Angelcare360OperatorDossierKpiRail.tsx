import Angelcare360OperatorKpiCard from '../Angelcare360OperatorKpiCard'
import { ANGELCARE360_OPERATOR_COLORS } from '../Angelcare360OperatorVisualSystem'

type Kpi = {
  label: string
  value: string
  detail?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'neutral'
}

type Props = {
  items: Kpi[]
}

export default function Angelcare360OperatorDossierKpiRail({ items }: Props) {
  return (
    <section style={railStyle}>
      {items.map((item) => (
        <div key={item.label} style={toneStyle(item.tone)}>
          <Angelcare360OperatorKpiCard label={item.label} value={item.value} detail={item.detail} />
        </div>
      ))}
    </section>
  )
}

function toneStyle(tone: Kpi['tone'] = 'neutral'): React.CSSProperties {
  const palette = {
    blue: { border: ANGELCARE360_OPERATOR_COLORS.blueBorder },
    green: { border: ANGELCARE360_OPERATOR_COLORS.greenBorder },
    amber: { border: ANGELCARE360_OPERATOR_COLORS.amberBorder },
    red: { border: ANGELCARE360_OPERATOR_COLORS.redBorder },
    neutral: { border: ANGELCARE360_OPERATOR_COLORS.border },
  }[tone]
  return {
    borderRadius: 24,
    padding: 1,
    background: 'transparent',
    boxShadow: `0 0 0 1px ${palette.border} inset`,
  }
}

const railStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}
