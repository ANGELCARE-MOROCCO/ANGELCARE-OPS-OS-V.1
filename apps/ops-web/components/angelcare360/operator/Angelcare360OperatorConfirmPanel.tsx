'use client'

import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  busy?: boolean
  tone?: 'warning' | 'danger'
}

export default function Angelcare360OperatorConfirmPanel({ title, message, confirmLabel = 'Confirmer', onConfirm, busy, tone = 'warning' }: Props) {
  const style = tone === 'danger' ? dangerStyle : warningStyle
  return (
    <div style={style}>
      <div style={eyebrowStyle}>{tone === 'danger' ? 'Action sensible' : 'Vérification requise'}</div>
      <div style={titleStyle}>{title}</div>
      <div style={messageStyle}>{message}</div>
      <div style={footerStyle}>
        <Angelcare360OperatorActionButton label={confirmLabel} tone={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy} />
      </div>
    </div>
  )
}

const warningStyle: React.CSSProperties = {
  borderRadius: 20,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.amberBorder,
  background:
    'linear-gradient(180deg, rgba(255,247,237,.98) 0%, rgba(255,251,245,.98) 100%)',
  padding: 16,
  display: 'grid',
  gap: 10,
}

const dangerStyle: React.CSSProperties = {
  ...warningStyle,
  borderColor: ANGELCARE360_OPERATOR_COLORS.redBorder,
  background:
    'linear-gradient(180deg, rgba(254,242,242,.98) 0%, rgba(255,248,248,.98) 100%)',
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.amber,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
  fontSize: 15,
}

const messageStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.65,
  fontWeight: 600,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'end',
}
