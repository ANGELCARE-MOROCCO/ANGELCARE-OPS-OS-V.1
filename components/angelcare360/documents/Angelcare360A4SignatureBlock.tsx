import {
  ANGELCARE360_COLORS,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  label?: string
  name?: string
  title?: string
}

export default function Angelcare360A4SignatureBlock({ label = 'Signature', name = 'AngelCare 360', title = 'Équipe AngelCare' }: Props) {
  return (
    <div style={blockStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={lineStyle} />
      <div style={nameStyle}>{name}</div>
      <div style={titleStyle}>{title}</div>
    </div>
  )
}

const blockStyle: React.CSSProperties = {
  ...angelcare360SectionBackdropStyle,
  padding: 14,
  display: 'grid',
  gap: 8,
  maxWidth: 250,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: .8,
  fontWeight: 900,
  color: ANGELCARE360_COLORS.slateMuted,
}

const lineStyle: React.CSSProperties = {
  height: 1,
  background: ANGELCARE360_COLORS.borderSoft,
}

const nameStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.navy,
  fontSize: 13,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  color: ANGELCARE360_COLORS.slate,
  fontSize: 12,
  fontWeight: 700,
}

