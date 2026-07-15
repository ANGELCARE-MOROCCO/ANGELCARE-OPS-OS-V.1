import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'
import {
  ANGELCARE360_COLORS,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'
import { formatAngelcare360A4Date } from '@/lib/angelcare360/documents/a4-reference'

type Props = {
  model: Angelcare360A4DocumentModel
}

export default function Angelcare360A4Header({ model }: Props) {
  return (
    <header style={headerStyle}>
      <div style={brandStyle}>
        <div style={brandMarkStyle}>ANGELCARE 360</div>
        <div style={brandCopyStyle}>
          <div style={titleStyle}>{model.title}</div>
          <div style={subtitleStyle}>{model.family}</div>
        </div>
      </div>
      <div style={metaStyle}>
        <Meta label="Référence" value={model.referenceCode} />
        <Meta label="Version" value={model.version} />
        <Meta label="Date" value={formatAngelcare360A4Date(model.issueDate)} />
        <Meta label="Préparé par" value={model.preparedBy} />
      </div>
    </header>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={metaItemStyle}>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  ...angelcare360SectionBackdropStyle,
  margin: '14mm 14mm 0',
  padding: '14px 16px',
  display: 'grid',
  gap: 12,
}

const brandStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const brandMarkStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1.2,
  color: ANGELCARE360_COLORS.blueDeep,
}

const brandCopyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  textAlign: 'right',
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  color: ANGELCARE360_COLORS.navy,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: ANGELCARE360_COLORS.slate,
}

const metaStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 8,
}

const metaItemStyle: React.CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.white,
  padding: '10px 12px',
}

const metaLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: .7,
  color: ANGELCARE360_COLORS.slateMuted,
  textTransform: 'uppercase',
}

const metaValueStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  fontWeight: 800,
  color: ANGELCARE360_COLORS.navy,
  lineHeight: 1.45,
}

