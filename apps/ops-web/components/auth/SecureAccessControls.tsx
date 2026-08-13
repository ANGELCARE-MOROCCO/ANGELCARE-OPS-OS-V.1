'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import styles from '@/app/login/login.module.css'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6 0 9.5 6 9.5 6a14.3 14.3 0 0 1-3 3.6" />
      <path d="M6.1 6.1C3.8 7.7 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 3.1-.5" />
    </svg>
  )
}

export function SecurePasswordField() {
  const [visible, setVisible] = useState(false)

  return (
    <label className={styles.fieldShell}>
      <span className={styles.srOnly}>Password</span>
      <span className={styles.fieldIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <input
        className={styles.fieldInput}
        name="password"
        type={visible ? 'text' : 'password'}
        placeholder="Password"
        autoComplete="current-password"
        aria-label="Password"
      />
      <button
        className={styles.visibilityButton}
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <EyeIcon open={visible} />
      </button>
    </label>
  )
}

export function SecureSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button className={styles.signInButton} type="submit" disabled={pending}>
      <span>{pending ? 'AUTHENTICATING' : 'SIGN IN'}</span>
      <span className={styles.signInArrow} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </button>
  )
}
