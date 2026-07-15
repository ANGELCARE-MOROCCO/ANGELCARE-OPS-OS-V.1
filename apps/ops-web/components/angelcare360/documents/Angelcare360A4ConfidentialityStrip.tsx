import {
  ANGELCARE360_COLORS,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'
import { getAngelcare360ConfidentialityLabel } from '@/lib/angelcare360/documents/a4-reference'
import type { Angelcare360DocumentConfidentiality } from '@/types/angelcare360/documents'

type Props = {
  confidentiality: Angelcare360DocumentConfidentiality
}

export default function Angelcare360A4ConfidentialityStrip({ confidentiality }: Props) {
  return (
    <div style={stripStyle}>
      {getAngelcare360ConfidentialityLabel(confidentiality)}
    </div>
  )
}

const stripStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: '6px 14mm',
  background: ANGELCARE360_COLORS.navy,
  color: ANGELCARE360_COLORS.white,
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  textAlign: 'center',
}

