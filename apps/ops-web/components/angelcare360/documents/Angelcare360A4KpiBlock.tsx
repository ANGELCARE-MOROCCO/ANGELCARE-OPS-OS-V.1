import {
  ANGELCARE360_COLORS,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  label: string
  value: string
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

export default function Angelcare360A4KpiBlock({ label, value, tone = 'primary' }: Props) {
  return (
    <div style={{ ...blockStyle, ...toneMap[tone] }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

const blockStyle: React.CSSProperties = {
  ...angelcare360SectionBackdropStyle,
  padding: '10px 12px',
  minHeight: 62,
  display: 'grid',
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: .8,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.slateMuted,
}

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: ANGELCARE360_COLORS.navy,
}

const toneMap: Record<NonNullable<Props['tone']>, React.CSSProperties> = {
  primary: { borderColor: ANGELCARE360_COLORS.blueBorder, background: ANGELCARE360_COLORS.blueSoft },
  success: { borderColor: ANGELCARE360_COLORS.greenBorder, background: ANGELCARE360_COLORS.greenSoft },
  warning: { borderColor: ANGELCARE360_COLORS.amberBorder, background: ANGELCARE360_COLORS.amberSoft },
  danger: { borderColor: ANGELCARE360_COLORS.redBorder, background: ANGELCARE360_COLORS.redSoft },
  neutral: { borderColor: ANGELCARE360_COLORS.borderSoft, background: ANGELCARE360_COLORS.white },
}

