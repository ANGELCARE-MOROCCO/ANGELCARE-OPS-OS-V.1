'use client'

import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  kind: 'idle' | 'loading' | 'success' | 'error'
  message?: string | null
}

export default function Angelcare360OperatorMutationBanner({ kind, message }: Props) {
  if (!message || kind === 'idle') return null

  const style =
    kind === 'success'
      ? successStyle
      : kind === 'error'
        ? errorStyle
        : loadingStyle

  return (
    <div style={style} role="status" aria-live="polite">
      <span style={pillStyle(kind)}>{getLabel(kind)}</span>
      <span>{message}</span>
    </div>
  )
}

const baseStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: '12px 14px',
  fontWeight: 700,
  lineHeight: 1.55,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  boxShadow: '0 14px 30px rgba(15,23,42,.04)',
}

const successStyle: React.CSSProperties = {
  ...baseStyle,
  background: ANGELCARE360_OPERATOR_COLORS.greenSoft,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.greenBorder}`,
  color: ANGELCARE360_OPERATOR_COLORS.green,
}

const errorStyle: React.CSSProperties = {
  ...baseStyle,
  background: ANGELCARE360_OPERATOR_COLORS.redSoft,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.redBorder}`,
  color: ANGELCARE360_OPERATOR_COLORS.red,
}

const loadingStyle: React.CSSProperties = {
  ...baseStyle,
  background: ANGELCARE360_OPERATOR_COLORS.blueSoft,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}`,
  color: ANGELCARE360_OPERATOR_COLORS.blue,
}

function pillStyle(kind: Props['kind']): React.CSSProperties {
  const palette =
    kind === 'success'
      ? { background: ANGELCARE360_OPERATOR_COLORS.greenSoft, color: ANGELCARE360_OPERATOR_COLORS.green }
      : kind === 'error'
        ? { background: ANGELCARE360_OPERATOR_COLORS.redSoft, color: ANGELCARE360_OPERATOR_COLORS.red }
        : { background: ANGELCARE360_OPERATOR_COLORS.blueSoft, color: ANGELCARE360_OPERATOR_COLORS.blue }
  return {
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    ...palette,
  }
}

function getLabel(kind: Props['kind']) {
  switch (kind) {
    case 'success':
      return 'Succès'
    case 'error':
      return 'Erreur'
    case 'loading':
      return 'Traitement'
    default:
      return 'Statut'
  }
}
