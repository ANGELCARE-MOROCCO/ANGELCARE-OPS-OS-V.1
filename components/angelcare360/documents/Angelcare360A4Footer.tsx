import type { Angelcare360A4DocumentModel } from '@/types/angelcare360/documents'
import {
  ANGELCARE360_COLORS,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  model: Angelcare360A4DocumentModel
}

export default function Angelcare360A4Footer({ model }: Props) {
  return (
    <footer style={footerStyle}>
      <div style={footerLeftStyle}>
        <strong>AngelCare 360</strong>
        <span>{model.footerNote || 'Document A4 prêt à l’impression.'}</span>
      </div>
      <div style={footerRightStyle}>
        <span>{model.referenceCode}</span>
        <span>Confidentialité: {model.confidentiality}</span>
      </div>
    </footer>
  )
}

const footerStyle: React.CSSProperties = {
  ...angelcare360SectionBackdropStyle,
  margin: '0 14mm 14mm',
  padding: '10px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  fontSize: 11,
  color: ANGELCARE360_COLORS.slate,
}

const footerLeftStyle: React.CSSProperties = {
  display: 'grid',
  gap: 2,
}

const footerRightStyle: React.CSSProperties = {
  display: 'grid',
  gap: 2,
  textAlign: 'right',
  fontWeight: 700,
}

