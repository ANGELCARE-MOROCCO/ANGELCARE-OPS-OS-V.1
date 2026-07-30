'use client'

import { ArrowRight, LockKeyhole, ShieldAlert } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  label: string
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  disabledReason?: string | null
  onClick?: () => void
  type?: 'button' | 'submit'
}

export default function Angelcare360OperatorActionButton({
  label,
  tone = 'primary',
  disabled,
  disabledReason,
  onClick,
  type = 'button',
}: Props) {
  const toneClass = disabled
    ? styles.actionDisabled
    : tone === 'secondary'
      ? styles.actionSecondary
      : tone === 'ghost'
        ? styles.actionGhost
        : tone === 'danger'
          ? styles.actionDanger
          : styles.actionPrimary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason || label : label}
      aria-disabled={disabled || undefined}
      className={`${styles.actionButton} ${toneClass}`}
    >
      {disabled ? <LockKeyhole size={13} aria-hidden="true" /> : tone === 'danger' ? <ShieldAlert size={13} aria-hidden="true" /> : null}
      <span>{label}</span>
      {!disabled && tone !== 'danger' ? <ArrowRight size={13} aria-hidden="true" /> : null}
    </button>
  )
}
