'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import BrandRuntimeLockup from '@/components/brand/BrandRuntimeLockup'
import styles from '@/components/angelcare360/access/TenantAccessActivationClient.module.css'

export default function TenantMfaChallengePage() {
  const [state, setState] = useState<any>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/angelcare360/access/mfa', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Challenge MFA indisponible.')
      if (result.alreadyVerified) window.location.href = '/angelcare-360-command-center'
      else setState(result)
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Challenge MFA indisponible.'))
  }, [])

  async function verify() {
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/angelcare360/access/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Code invalide.')
      window.location.href = '/angelcare-360-command-center'
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Code invalide.') }
    finally { setBusy(false) }
  }

  return <main className={styles.page}>
    <section className={styles.brandPanel}><div className={styles.brandMark}><BrandRuntimeLockup runtime={state?.brandRuntime || null} priority /></div><div className={styles.brandCopy}><small>ANGELCARE · SANILA OS</small><h1>Vérification de sécurité</h1><p>Cette étape protège les données de votre établissement avant d’ouvrir le Command Center.</p></div><div className={styles.securityList}><div><ShieldCheck size={20}/><span><strong>Session identifiée</strong><small>Le challenge est lié à votre connexion actuelle.</small></span></div><div><KeyRound size={20}/><span><strong>Code limité dans le temps</strong><small>Utilisez Authenticator ou un code de récupération.</small></span></div></div></section>
    <section className={styles.formPanel}><div className={styles.form}><div className={styles.formHeader}><small>AUTHENTIFICATION RENFORCÉE</small><h2>Confirmez votre identité</h2><p>{state?.account?.client?.display_name || state?.account?.tenant?.tenant_slug || state?.account?.email || 'Compte administrateur'}</p></div><label><span>Code à 6 chiffres ou code de récupération</span><div className={styles.passwordField}><ShieldCheck size={18}/><input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.trim())} onKeyDown={(event) => { if (event.key === 'Enter' && code.length >= 6) verify() }} placeholder="000000"/></div></label>{error ? <p className={styles.error}>{error}</p> : null}<button className={styles.submit} type="button" onClick={verify} disabled={busy || code.length < 6}>{busy ? 'Vérification…' : 'Ouvrir le Command Center'}<ArrowRight size={18}/></button><p className={styles.disclaimer}>Les tentatives échouées, validations et codes de récupération utilisés sont audités.</p></div></section>
  </main>
}
