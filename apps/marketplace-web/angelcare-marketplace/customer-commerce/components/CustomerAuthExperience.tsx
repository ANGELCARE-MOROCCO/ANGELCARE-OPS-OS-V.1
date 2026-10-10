'use client'
import {careOrbitLocation} from '@/angelcare-marketplace/navigation-care-orbit/client-controller'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { ArrowRight, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Route, ShieldCheck } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import { customerAuthHref, customerReturnTo, passwordChecks, type CustomerAuthMode } from '../auth-navigation'
import { customerAccessCopy } from '../customer-access-copy'
import { CustomerAccessShell } from './CustomerAccessShell'
import { establishCustomerFragmentSession } from '../customer-session-bridge'
import styles from '../customer-access.module.css'

type AuthResult = { verificationRequired?: boolean; authenticated?: boolean; updated?: boolean }
class AccessRequestError extends Error {
  constructor(readonly code: string, readonly reference: string, readonly fields?: Record<string, string[]>) { super(code) }
}
function visitorReference(): string {
  const key = 'ac_marketplace_visitor'
  const current = document.cookie.split('; ').find(value => value.startsWith(`${key}=`))?.split('=')[1]
  if (current) { try { return decodeURIComponent(current) } catch { /* replace malformed cookie */ } }
  const value = crypto.randomUUID()
  document.cookie = `${key}=${value}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
  return value
}
async function requestAccess(url: string, body?: Record<string, unknown>, method = 'POST'): Promise<AuthResult> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 40000)
  try {
    const response = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const payload = await response.json() as { data?: AuthResult; error?: { code?: string; fieldErrors?: Record<string, string[]> }; requestId?: string }
    if (!response.ok || !payload.data) throw new AccessRequestError(payload.error?.code || 'INTERNAL_ERROR', payload.requestId || '', payload.error?.fieldErrors)
    return payload.data
  } catch (error) {
    if (error instanceof AccessRequestError) throw error
    throw new AccessRequestError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR', '')
  } finally { clearTimeout(timer) }
}

export function CustomerAuthExperience({ locale, mode, returnTo, initialError }: { locale: CatalogLocale; mode: CustomerAuthMode; returnTo?: string; initialError?: boolean }) {
  const t = customerAccessCopy(locale)
  const destination = customerReturnTo(returnTo, locale)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '', accountKind: 'family' })
  const [accepted, setAccepted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError ? t.invalidLead : '')
  const [reference, setReference] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [result, setResult] = useState<'signup' | 'recovery' | 'magic' | 'password' | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resetReady, setResetReady] = useState(mode !== 'reset')
  const [checking, setChecking] = useState(mode === 'reset')
  const busyRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const newPassword = mode === 'register' || mode === 'reset'
  const checks = passwordChecks(form.password)
  const continueJourney = destination !== `/angelcare-marketplace/${locale}/account`

  useEffect(() => {
    let active = true
    if (mode !== 'reset') {
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      if (!fragment.has('access_token') && !fragment.has('error')) return
      setChecking(true)
      void establishCustomerFragmentSession().then(() => careOrbitLocation.replace(mode === 'recover' ? customerAuthHref(locale, 'reset', destination) : destination)).catch(() => { if (active) { setError(t.invalidLead); setChecking(false) } })
      return () => { active = false }
    }
    void establishCustomerFragmentSession().then(() => requestAccess('/api/angelcare-marketplace/customer/me', undefined, 'GET')).then(data => {
      if (active) { setResetReady(Boolean(data.authenticated)); setError(data.authenticated ? '' : t.sessionMissing) }
    }).catch(() => { if (active) setError(t.sessionMissing) }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [mode, locale, destination, t.sessionMissing, t.invalidLead])
  useEffect(() => { if (!cooldown) return; const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000); return () => clearTimeout(timer) }, [cooldown])

  function update(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })); setFields(current => ({ ...current, [key]: '' })) }
  function validate(kind: 'primary' | 'magic' | 'resend') {
    const next: Record<string, string> = {}
    if (mode !== 'reset' || kind !== 'primary') { if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = t.invalidEmail }
    if (kind === 'primary') {
      if (mode === 'register' && !form.fullName.trim()) next.fullName = t.requiredName
      if (mode === 'register' && form.phone.trim()) { const phone = form.phone.replace(/[^+\d]/g, ''); if (phone.length < 8 || phone.length > 18) next.phone = t.invalidPhone }
      if (mode === 'login' && !form.password) next.password = t.requiredPassword
      if (newPassword && !checks.every(Boolean)) next.password = t.invalidPassword
      if (newPassword && form.password !== form.confirm) next.confirm = t.mismatch
      if (mode === 'register' && !accepted) next.accepted = t.requiredConsent
    }
    setFields(next)
    const first = Object.keys(next)[0]
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
    return !first
  }
  async function execute(kind: 'primary' | 'magic' | 'resend') {
    if (busyRef.current || (kind !== 'primary' && cooldown > 0) || !validate(kind)) return
    busyRef.current = true; setBusy(true); setError(''); setReference('')
    try {
      const endpoint = kind === 'magic' ? 'magic-link' : kind === 'resend' ? 'resend' : mode === 'reset' ? 'password' : mode
      const body = kind !== 'primary' || mode === 'recover' ? { email: form.email.trim(), locale, returnTo: destination } : mode === 'reset' ? { password: form.password } : { ...form, email: form.email.trim(), locale, returnTo: destination, accepted, visitorReference: visitorReference() }
      const data = await requestAccess(`/api/angelcare-marketplace/customer/auth/${endpoint}`, body, mode === 'reset' && kind === 'primary' ? 'PATCH' : 'POST')
      if (kind === 'magic') { setResult('magic'); setCooldown(45) }
      else if (kind === 'resend') { setResult('signup'); setCooldown(45) }
      else if (mode === 'recover') { setResult('recovery'); setCooldown(45) }
      else if (mode === 'register' && data.verificationRequired) { setResult('signup'); setCooldown(45) }
      else if (mode === 'reset') { setResult('password'); setForm(current => ({ ...current, password: '', confirm: '' })) }
      else careOrbitLocation.assign(destination)
    } catch (reason) {
      const problem = reason instanceof AccessRequestError ? reason : new AccessRequestError('INTERNAL_ERROR', '')
      setReference(problem.reference)
      setError(problem.code === 'TIMEOUT' || problem.code === 'NETWORK_ERROR' ? t.timeout : problem.code === 'RATE_LIMITED' ? t.rateLimited : problem.code === 'AUTHENTICATION_REQUIRED' ? mode === 'reset' ? t.sessionMissing : t.loginError : problem.code === 'PERMISSION_DENIED' || problem.code === 'CONFIGURATION_ERROR' ? t.unavailable : t.error)
      if (problem.fields) setFields(Object.fromEntries(Object.keys(problem.fields).map(key => [key, key === 'password' ? t.invalidPassword : key === 'email' ? t.invalidEmail : key === 'fullName' ? t.requiredName : t.error])))
    } finally { busyRef.current = false; setBusy(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void execute('primary') }
  function fieldError(key: string) { return fields[key] ? <span id={`error-${key}`} className={styles.fieldError}>{fields[key]}</span> : null }
  const passwordField = (confirm = false) => {
    const name = confirm ? 'confirm' : 'password'
    return <label className={styles.field}><span>{confirm ? t.confirm : newPassword ? t.newPassword : t.password}{!newPassword ? <Link className={styles.link} href={customerAuthHref(locale, 'recover', destination)}>{t.forgot}</Link> : null}</span>
      <div className={styles.passwordWrap}><input disabled={busy} name={name} value={form[name]} onChange={event => update(name, event.target.value)} onKeyUp={event => setCaps(event.getModifierState('CapsLock'))} type={visible ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'} required maxLength={128} aria-invalid={Boolean(fields[name])} aria-describedby={fields[name] ? `error-${name}` : newPassword && !confirm ? 'password-rules' : undefined}/><button type="button" className={styles.eye} onClick={() => setVisible(current => !current)} aria-label={visible ? t.hide : t.show} aria-pressed={visible}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{fieldError(name)}{caps && !confirm ? <small role="status">{t.caps}</small> : null}</label>
  }
  return <CustomerAccessShell locale={locale} mode={mode} returnTo={destination}><div className={styles.content}>
    <span className={styles.eyebrow}>{t.access}</span><h2 aria-live="polite">{result === 'password' ? t.fresh : result ? t.inbox : t[mode]}</h2><p className={styles.lead}>{result ? result === 'password' ? t.freshLead : result === 'signup' ? t.signupSent : t.sent : t[`${mode}Lead`]}</p>
    {!result && (mode === 'login' || mode === 'register') ? <nav className={styles.tabs} aria-label={t.access}><Link href={customerAuthHref(locale, 'login', destination)} aria-current={mode === 'login' ? 'page' : undefined}>{t.tabLogin}</Link><Link href={customerAuthHref(locale, 'register', destination)} aria-current={mode === 'register' ? 'page' : undefined}>{t.tabRegister}</Link></nav> : null}
    {continueJourney ? <div className={styles.continuation}><Route size={19}/><div><strong>{t.continuation}</strong><p>{t.continueLead}</p></div></div> : null}
    {error ? <div className={styles.message} role="alert" tabIndex={-1}>{error}{reference ? <small>{t.reference}: {reference}</small> : null}</div> : null}
    {result ? <div className={styles.result}><div className={styles.resultIcon}>{result === 'password' ? <ShieldCheck size={32}/> : <Mail size={32}/>}</div>{result !== 'password' ? <p><strong dir="ltr">{form.email}</strong></p> : null}
      {result === 'signup' ? <button className={styles.secondary} disabled={busy || cooldown > 0} onClick={() => void execute('resend')}>{busy ? t.sending : t.resend}{cooldown > 0 ? ` · ${cooldown}s` : ''}</button> : null}
      {result !== 'password' && result !== 'signup' ? <button className={styles.secondary} disabled={busy || cooldown > 0} onClick={() => void execute(result === 'magic' ? 'magic' : 'primary')}>{busy ? t.sending : mode === 'recover' ? t.submitRecover : t.magic}{cooldown > 0 ? ` · ${cooldown}s` : ''}</button> : null}
      <Link className={styles.submit} href={customerAuthHref(locale, 'login', destination)}>{t.tabLogin}<ArrowRight size={16}/></Link>{result !== 'password' ? <button className={styles.secondary} onClick={() => { setResult(null); setError('') }}>{t.editEmail}</button> : null}
    </div> : <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-busy={busy || checking}>
      {mode === 'register' ? <><label className={styles.field}><span>{t.name}</span><input disabled={busy} name="fullName" autoComplete="name" value={form.fullName} onChange={event => update('fullName', event.target.value)} required maxLength={180} aria-invalid={Boolean(fields.fullName)} aria-describedby={fields.fullName ? 'error-fullName' : undefined}/>{fieldError('fullName')}</label><div className={styles.pair}><label className={styles.field}><span>{t.phone}</span><input disabled={busy} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} maxLength={30} aria-invalid={Boolean(fields.phone)} aria-describedby={fields.phone ? 'error-phone' : undefined}/>{fieldError('phone')}</label><label className={styles.field}><span>{t.kind}</span><select disabled={busy} name="accountKind" value={form.accountKind} onChange={event => update('accountKind', event.target.value)}><option value="family">{t.family}</option><option value="organization">{t.organization}</option></select></label></div><p className={styles.smallLead}>{t.phoneNote}</p></> : null}
      {mode !== 'reset' ? <label className={styles.field}><span>{t.email}</span><input disabled={busy} name="email" type="email" autoComplete="email" inputMode="email" dir="ltr" value={form.email} onChange={event => update('email', event.target.value)} placeholder="vous@exemple.com" required maxLength={320} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'error-email' : undefined}/>{fieldError('email')}</label> : null}
      {mode !== 'recover' ? passwordField() : null}
      {newPassword ? <><div className={styles.rules} id="password-rules" aria-label={t.rules}>{(['length', 'upper', 'lower', 'number'] as const).map((key, index) => <span key={key} data-pass={checks[index]}>{checks[index] ? <Check size={10}/> : null}{t[key]}</span>)}</div>{passwordField(true)}</> : null}
      {mode === 'register' ? <div><label className={styles.consent}><input name="accepted" type="checkbox" checked={accepted} onChange={event => { setAccepted(event.target.checked); setFields(current => ({ ...current, accepted: '' })) }} required aria-invalid={Boolean(fields.accepted)}/><span>{t.consent}</span></label>{fieldError('accepted')}<p className={styles.smallLead}>{t.consentNote}</p></div> : null}
      <button className={styles.submit} type="submit" disabled={busy || checking || !resetReady}>{busy || checking ? <><span className={styles.spinner}/>{checking ? t.checking : mode === 'recover' ? t.sending : t.saving}</> : <>{t[mode === 'login' ? 'submitLogin' : mode === 'register' ? 'submitRegister' : mode === 'recover' ? 'submitRecover' : 'submitReset']}<ArrowRight size={16}/></>}</button>
      {mode === 'reset' && !resetReady && !checking ? <Link className={styles.secondary} href={customerAuthHref(locale, 'recover', destination)}>{t.submitRecover}</Link> : null}
      {mode === 'login' ? <><div className={styles.separator}>{t.or}</div><button type="button" className={styles.secondary} disabled={busy || cooldown > 0} onClick={() => void execute('magic')}><Mail size={16}/>{t.magic}</button><p className={styles.smallLead}>{t.magicLead}</p></> : null}
      {mode === 'recover' || mode === 'reset' ? <Link className={styles.secondary} href={customerAuthHref(locale, 'login', destination)}><KeyRound size={15}/>{t.tabLogin}</Link> : null}
    </form>}
    <div className={styles.footnote}><LockKeyhole size={12}/>{t.secure} · {t.private}</div>
  </div></CustomerAccessShell>
}
