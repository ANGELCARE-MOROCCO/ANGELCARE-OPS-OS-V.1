'use client'

import { operatorButtonBase, operatorButtonDanger, operatorButtonDisabled, operatorButtonGhost, operatorButtonSecondary } from './Angelcare360OperatorVisualSystem'

type Props = {
  label: string
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  disabledReason?: string | null
  onClick?: () => void
  type?: 'button' | 'submit'
}

export default function Angelcare360OperatorActionButton({ label, tone = 'primary', disabled, disabledReason, onClick, type = 'button' }: Props) {
  const style = disabled
    ? operatorButtonDisabled
    : tone === 'secondary'
      ? operatorButtonSecondary
      : tone === 'ghost'
        ? operatorButtonGhost
        : tone === 'danger'
          ? operatorButtonDanger
          : operatorButtonBase

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason || label : label}
      aria-disabled={disabled || undefined}
      style={style}
    >
      {label}
    </button>
  )
}
