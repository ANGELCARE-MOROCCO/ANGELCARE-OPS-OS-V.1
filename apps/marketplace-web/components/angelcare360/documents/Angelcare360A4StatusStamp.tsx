import {
  ANGELCARE360_COLORS,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

export default function Angelcare360A4StatusStamp({ label, tone = 'neutral' }: Props) {
  return <span style={{ ...stampStyle, ...toneMap[tone] }}>{label}</span>
}

const stampStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: .8,
}

const toneMap: Record<NonNullable<Props['tone']>, React.CSSProperties> = {
  success: { background: ANGELCARE360_COLORS.greenSoft, color: ANGELCARE360_COLORS.green },
  warning: { background: ANGELCARE360_COLORS.amberSoft, color: ANGELCARE360_COLORS.amber },
  danger: { background: ANGELCARE360_COLORS.redSoft, color: ANGELCARE360_COLORS.red },
  neutral: { background: ANGELCARE360_COLORS.blueSoft, color: ANGELCARE360_COLORS.blueDeep },
}

