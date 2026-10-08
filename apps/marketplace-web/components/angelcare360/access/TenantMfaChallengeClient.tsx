'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SanilaLogo from '@/components/brand/SanilaLogo'

type ChallengeState = {
  ok: boolean
  alreadyVerified?: boolean
  account?: { fullName?: string; email?: string; client?: { display_name?: string }; tenant?: { tenant_slug?: string } }
  error?: string
}

export default function TenantMfaChallengeClient() {
  const router = useRouter()
  const [state, setState] = useState<ChallengeState | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/angelcare360/access/mfa', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as ChallengeState
        if (!response.ok || !result.ok) throw new Error(result.error || 'Challenge MFA indisponible.')
        if (result.alreadyVerified) router.replace('/angelcare-360-command-center')
        else setState(result)
      })
      .catch((reason) => setState({ ok: false, error: reason instanceof Error ? reason.message : 'Challenge MFA indisponible.' }))
  }, [router])

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/access/mfa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error || 'Code MFA invalide.')
      router.replace('/angelcare-360-command-center')
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Code MFA invalide.')
    } finally {
      setBusy(false)
    }
  }

  return <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(420px,.8fr)', background: '#f4f7fa', color: '#14283e', fontFamily: 'Inter,system-ui,sans-serif' }}>
    <section style={{ padding: 'clamp(40px,7vw,92px)', background: 'linear-gradient(145deg,#173f63,#0d2942)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <SanilaLogo variant="white" width={180} height={64} priority />
      <div><div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.14em', opacity: .72 }}>VÉRIFICATION MULTIFACTEUR</div><h1 style={{ fontSize: 'clamp(38px,5vw,64px)', lineHeight: .98, letterSpacing: '-.045em', margin: '18px 0' }}>Une dernière preuve.<br/>Puis votre tenant.</h1><p style={{ maxWidth: 560, opacity: .8, lineHeight: 1.7 }}>Le code Authenticator ou un code de récupération valide est exigé avant d’ouvrir le Command Center.</p></div>
      <small style={{ opacity: .65 }}>SANILA · Tenant Identity Security</small>
    </section>
    <section style={{ display: 'grid', placeItems: 'center', padding: 28 }}>
      {!state ? <div>Chargement du challenge sécurisé…</div> : !state.ok ? <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #e0e7ee', borderRadius: 22, padding: 30 }}><h2>Challenge indisponible</h2><p>{state.error}</p><a href="/angelcare-360-access/login">Retour à la connexion</a></div> : <form onSubmit={verify} style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #dce5ed', borderRadius: 24, padding: 32, boxShadow: '0 28px 90px rgba(24,47,71,.12)' }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', color: '#718096' }}>MFA OBLIGATOIRE</div>
        <h2 style={{ fontSize: 28, margin: '12px 0 7px' }}>Confirmer votre identité</h2>
        <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.6 }}>{state.account?.fullName || state.account?.email || 'Compte administrateur'} · {state.account?.client?.display_name || state.account?.tenant?.tenant_slug || 'SANILA'}</p>
        {error ? <div style={{ background: '#fff5f5', border: '1px solid #eccaca', color: '#9a3232', borderRadius: 12, padding: 11, fontSize: 11, margin: '16px 0' }}>{error}</div> : null}
        <label style={{ display: 'grid', gap: 7, marginTop: 22 }}><span style={{ fontSize: 10, fontWeight: 850 }}>Code Authenticator ou code de récupération</span><input value={code} onChange={(event) => setCode(event.target.value.trim())} required autoComplete="one-time-code" inputMode="numeric" style={{ height: 52, border: '1px solid #d5e0e8', borderRadius: 12, padding: '0 13px', fontSize: 18, letterSpacing: '.12em' }} /></label>
        <button disabled={busy || !code} style={{ marginTop: 18, height: 50, width: '100%', border: 0, borderRadius: 12, background: '#173f63', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{busy ? 'Vérification…' : 'Vérifier et ouvrir SANILA'}</button>
      </form>}
    </section>
  </main>
}
