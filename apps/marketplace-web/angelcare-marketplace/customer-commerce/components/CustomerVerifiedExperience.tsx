'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MailCheck, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import { customerAuthHref } from '../auth-navigation'
import { customerAccessCopy } from '../customer-access-copy'
import { establishCustomerFragmentSession } from '../customer-session-bridge'
import { CustomerAccessShell } from './CustomerAccessShell'
import { CustomerConfirmationResend } from './CustomerConfirmationResend'
import styles from '../customer-access.module.css'

export function CustomerVerifiedExperience({ locale, returnTo, state }: { locale: CatalogLocale; returnTo: string; state: 'confirmed' | 'invalid' | 'pending' }) {
  const t = customerAccessCopy(locale), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!window.location.hash) return
    setBusy(true)
    void establishCustomerFragmentSession().then(() => window.location.replace(customerAuthHref(locale, 'verified', returnTo))).catch(() => { setFailed(true); setBusy(false) })
  }, [locale, returnTo])
  const current = failed ? 'invalid' : state
  return <CustomerAccessShell locale={locale} mode="verified" returnTo={returnTo}><div className={styles.content}>
    <div className={styles.resultIcon} data-warning={current !== 'confirmed'}>{busy ? <span className={styles.spinner}/> : current === 'confirmed' ? <MailCheck size={34}/> : <ShieldAlert size={34}/>}</div>
    <span className={styles.eyebrow}>{t.access}</span><h2>{busy ? t.checking : t[current]}</h2><p className={styles.lead}>{busy ? t.secure : t[`${current}Lead`]}</p>
    <div className={styles.result}>{current === 'confirmed' && !busy ? <Link className={styles.submit} href={returnTo}>{t.continue}<ArrowRight size={16}/></Link> : <Link className={styles.submit} href={customerAuthHref(locale, 'login', returnTo)}>{t.tabLogin}<ArrowRight size={16}/></Link>}
      {current === 'invalid' && !busy ? <CustomerConfirmationResend locale={locale} returnTo={returnTo}/> : null}
    </div><div className={styles.footnote}><ShieldCheck size={13}/>{t.secure}</div>
  </div></CustomerAccessShell>
}
