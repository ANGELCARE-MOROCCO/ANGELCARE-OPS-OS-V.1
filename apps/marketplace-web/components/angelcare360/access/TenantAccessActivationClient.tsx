'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type { BrandRuntime } from '@/types/angelcare360/operator/branding'
import styles from './TenantAccessActivationClient.module.css'

type TokenState = {
  ok: boolean
  tokenType?: 'invitation' | 'password_reset'
  invitation?: { email?: string; full_name?: string; expires_at?: string; tenant_id?: string; client_id?: string }
  reset?: { expires_at?: string }
  account?: { email?: string; full_name?: string; role_template?: string; security_policy?: Record<string, unknown> }
  tenant?: { tenant_slug?: string }
  client?: { display_name?: string; legal_name?: string }
  existingIdentity?: boolean
  brandRuntime?: BrandRuntime | null
  error?: string
}

export default function TenantAccessActivationClient() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const requestedMode = params.get('mode') === 'reset' ? 'reset' : 'invite'
  const [state, setState] = useState<TokenState | null>(() => token ? null : { ok: false, error: 'Lien d’activation incomplet.' })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; otpauthUri: string; recoveryCodes: string[] } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/angelcare360/access/activate?token=${encodeURIComponent(token)}&mode=${requestedMode}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.ok) throw new Error(result.error || 'Lien invalide ou expiré.')
        setState(result)
      })
      .catch((reason) => setState({ ok: false, error: reason instanceof Error ? reason.message : 'Lien invalide.' }))
  }, [requestedMode, token])

  useEffect(() => {
    if (!completed) return
    window.history.replaceState(null, '', '/angelcare-360-access/activate?status=completed')
    const redirectTimer = window.setTimeout(() => window.location.replace('/angelcare-360-access/login?activation=success'), 1400)
    return () => window.clearTimeout(redirectTimer)
  }, [completed])

  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 12) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!state?.existingIdentity || isReset) {
      if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
      if (strength < 5) { setError('Utilisez au moins 12 caractères, avec majuscule, minuscule, chiffre et caractère spécial.'); return }
    }
    setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/access/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, mode: state?.tokenType === 'password_reset' ? 'reset' : 'invite', password, passwordConfirmation: confirm }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Activation impossible.')
      if (result.mfaRequired) setMfaSetup({ secret: String(result.mfaSecret || ''), otpauthUri: String(result.otpauthUri || ''), recoveryCodes: Array.isArray(result.recoveryCodes) ? result.recoveryCodes.map(String) : [] })
      else setCompleted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Activation impossible.')
    } finally { setBusy(false) }
  }

  async function confirmMfa() {
    setError(null); setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/access/activate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'mfa.confirm', token, code: mfaCode }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Validation MFA impossible.')
      setCompleted(true); setMfaSetup(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Validation MFA impossible.') }
    finally { setBusy(false) }
  }

  const organization = String(state?.client?.display_name || state?.client?.legal_name || 'Votre établissement')
  const person = String(state?.account?.full_name || state?.invitation?.full_name || '')
  const email = String(state?.account?.email || state?.invitation?.email || '')
  const isReset = state?.tokenType === 'password_reset'

  return <main className={styles.page}>
    <section className={styles.brandPanel}>
      <div className={styles.brandMark}><SanilaLogo variant="white" width={188} height={66} priority /></div>
      <div className={styles.brandCopy}><small>SANILA OPERATING SYSTEM · BY ANGELCARE</small><h1>Accès administrateur sécurisé</h1><p>Votre identité, votre rôle, votre établissement et les modules contractés sont gouvernés séparément. AngelCare ne connaît et ne conserve jamais votre mot de passe en clair.</p></div>
      <div className={styles.securityList}>
        <div><ShieldCheck size={20}/><span><strong>Activation privée</strong><small>Lien unique, limité dans le temps.</small></span></div>
        <div><LockKeyhole size={20}/><span><strong>Mot de passe confidentiel</strong><small>Défini uniquement par vous.</small></span></div>
        <div><BadgeCheck size={20}/><span><strong>Accès contractuel</strong><small>Rôle + périmètre + entitlements produit.</small></span></div>
      </div>
    </section>

    <section className={styles.formPanel}>
      {!state ? <div className={styles.loading}><span/><h2>Validation du lien sécurisé…</h2></div> : null}
      {state && !state.ok ? <div className={styles.invalid}><LockKeyhole size={34}/><h2>Lien indisponible</h2><p>{state.error}</p><a href="/angelcare-360-access/login">Retour à la connexion</a></div> : null}
      {state?.ok && mfaSetup && !completed ? <div className={styles.form}>
        <div className={styles.formHeader}><small>MFA OBLIGATOIRE</small><h2>Protégez votre compte avec Authenticator</h2><p>Ajoutez le compte manuellement dans Google Authenticator, Microsoft Authenticator, 1Password ou une application TOTP compatible.</p></div>
        <div className={styles.identityCard}><div><span>Clé secrète</span><strong>{mfaSetup.secret}</strong></div><div><span>Standard</span><strong>TOTP · 6 chiffres · 30 sec</strong></div></div>
        <button className={styles.copyAction} type="button" onClick={() => navigator.clipboard.writeText(mfaSetup.otpauthUri)}>Copier le lien Authenticator</button>
        <label><span>Code affiché dans votre application</span><div className={styles.passwordField}><ShieldCheck size={18}/><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ''))} placeholder="000000"/></div></label>
        <div className={styles.recovery}><strong>Codes de récupération — à conserver maintenant</strong><div>{mfaSetup.recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div><button type="button" onClick={() => navigator.clipboard.writeText(mfaSetup.recoveryCodes.join('\n'))}>Copier les codes</button></div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className={styles.submit} type="button" disabled={busy || mfaCode.length !== 6} onClick={confirmMfa}>{busy ? 'Vérification…' : 'Vérifier et activer mon compte'}<ArrowRight size={18}/></button>
      </div> : null}
      {state?.ok && completed ? <div className={styles.success}><CheckCircle2 size={44}/><small>ACCÈS ACTIVÉ</small><h2>{isReset ? 'Mot de passe renouvelé' : 'Compte administrateur prêt'}</h2><p>Votre accès à {organization} est sécurisé. Redirection vers la connexion avec <strong>{email}</strong>.</p><a href="/angelcare-360-access/login?activation=success">Accéder à la connexion <ArrowRight size={17}/></a></div> : null}
      {state?.ok && !completed && !mfaSetup ? <form onSubmit={submit} className={styles.form}>
        <div className={styles.formHeader}><small>{isReset ? 'RÉCUPÉRATION SÉCURISÉE' : 'INVITATION ADMINISTRATEUR'}</small><h2>{isReset ? 'Choisissez un nouveau mot de passe' : `Bienvenue${person ? `, ${person}` : ''}`}</h2><p>{organization}{state.tenant?.tenant_slug ? ` · ${state.tenant.tenant_slug}` : ''}</p></div>
        <div className={styles.identityCard}><div><span>Compte</span><strong>{email}</strong></div><div><span>Rôle</span><strong>{String(state.account?.role_template || 'Administrateur tenant').replaceAll('_', ' ')}</strong></div></div>
        {state.existingIdentity && !isReset ? <div className={styles.mfa}><BadgeCheck size={18}/><p><strong>Identité AngelCare existante détectée</strong><small>Votre mot de passe actuel reste inchangé. Cette invitation ajoute uniquement le nouveau tenant, le rôle et le périmètre autorisé.</small></p></div> : <>
        <label><span>{isReset ? 'Nouveau mot de passe' : 'Créer votre mot de passe'}</span><div className={styles.passwordField}><KeyRound size={18}/><input autoComplete="new-password" type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="12 caractères minimum" required/><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        <div className={styles.strength} data-score={strength}><div>{[1,2,3,4,5].map((step) => <span key={step} data-on={strength >= step}/>)}</div><small>{strength < 3 ? 'À renforcer' : strength < 5 ? 'Solide' : 'Très solide'}</small></div>
        <label><span>Confirmer le mot de passe</span><div className={styles.passwordField}><LockKeyhole size={18}/><input autoComplete="new-password" type={visible ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} required/></div></label>
        <div className={styles.requirements}><span>12+ caractères</span><span>Majuscule et minuscule</span><span>Chiffre</span><span>Caractère spécial</span></div></>}
        {Boolean(state.account?.security_policy?.require_mfa) ? <div className={styles.mfa}><ShieldCheck size={18}/><p><strong>MFA requis</strong><small>L’enrôlement Authenticator sera exigé immédiatement avant l’activation finale du compte.</small></p></div> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className={styles.submit} type="submit" disabled={busy}>{busy ? 'Sécurisation…' : isReset ? 'Enregistrer le nouveau mot de passe' : state.existingIdentity ? 'Lier mon identité et activer' : 'Activer mon accès'}<ArrowRight size={18}/></button>
        <p className={styles.disclaimer}>En continuant, vous confirmez être la personne invitée et acceptez que les actions administratives soient journalisées pour la sécurité de votre établissement.</p>
      </form> : null}
    </section>
  </main>
}
