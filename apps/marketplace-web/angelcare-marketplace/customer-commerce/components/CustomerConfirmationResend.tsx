'use client'
import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import { customerAccessCopy } from '../customer-access-copy'
import styles from '../customer-access.module.css'

export function CustomerConfirmationResend({ locale, returnTo }: { locale: CatalogLocale; returnTo: string }) {
  const t = customerAccessCopy(locale), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [sent, setSent] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || sent) return
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/angelcare-marketplace/customer/auth/resend', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, locale, returnTo }), signal: AbortSignal.timeout(40000) })
      if (!response.ok) throw new Error('Send failed')
      setSent(true); setMessage(t.sent)
    } catch { setMessage(t.error) } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className={styles.form} aria-busy={busy}>
    <label className={styles.field}><span>{t.email}</span><input name="email" type="email" autoComplete="email" dir="ltr" required maxLength={320}/></label>
    <button className={styles.secondary} disabled={busy || sent}><Mail size={15}/>{busy ? t.sending : t.resend}</button>
    {message ? <p className={styles.smallLead} role="status">{message}</p> : null}
  </form>
}
