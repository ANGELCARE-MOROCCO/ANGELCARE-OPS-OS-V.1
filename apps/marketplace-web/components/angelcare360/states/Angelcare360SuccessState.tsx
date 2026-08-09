import {
  ANGELCARE360_COLORS,
  angelcare360SuccessCardStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360SuccessStateProps = {
  title: string
  description: string
}

export default function Angelcare360SuccessState({ title, description }: Angelcare360SuccessStateProps) {
  return (
    <section style={shellStyle} aria-live="polite">
      <div style={cardStyle}>
        <div style={badgeStyle}>Prêt</div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  padding: 4,
}

const cardStyle: React.CSSProperties = {
  ...angelcare360SuccessCardStyle,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: ANGELCARE360_COLORS.greenSoft,
  color: ANGELCARE360_COLORS.green,
  fontWeight: 900,
  fontSize: 12,
  padding: '6px 10px',
}

const titleStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: ANGELCARE360_COLORS.navy,
  fontSize: 20,
  fontWeight: 900,
}

const descriptionStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: ANGELCARE360_COLORS.slate,
  lineHeight: 1.6,
  fontWeight: 600,
}
