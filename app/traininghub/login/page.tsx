'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clearTrainingHubBrowserSession, getTrainingHubBrowserClient } from '@/lib/traininghub/browser-client'

type EntryRouteResponse = {
  ok?: boolean
  entryRoute?: string
  redirectTo?: string
  route?: string
  href?: string
  destination?: string
  portal?: string
  kind?: string
  error?: string
  message?: string
}

function routeFromPayload(payload: EntryRouteResponse) {
  return String(
    payload?.entryRoute ||
    payload?.redirectTo ||
    payload?.route ||
    payload?.href ||
    payload?.destination ||
    '',
  ).trim()
}

function messageFromError(code: string | null) {
  if (!code) return ''
  if (code === 'missing_credentials') return 'Email et mot de passe obligatoires.'
  if (code === 'session_required') return 'Session TrainingHub absente ou expirée. Connectez-vous ici.'
  if (code === 'account_not_bound') return 'Compte authentifié, mais aucun profil TrainingHub actif n’est lié.'
  if (code === 'invalid_credentials') return 'Identifiants invalides.'
  if (code === 'forbidden_experience') return 'Ce compte n’a pas accès à cet espace TrainingHub.'
  return code.replaceAll('_', ' ')
}

export default function TrainingHubUnifiedLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(messageFromError(searchParams.get('error')))

  async function resolveAndRedirect(authUserId: string, userEmail: string, accessToken: string) {
    const response = await fetch('/api/traininghub/auth/entry-route', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ authUserId, email: userEmail }),
    })

    const payload = (await response.json().catch(() => ({}))) as EntryRouteResponse

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || payload?.error || 'Impossible de déterminer le workspace TrainingHub.')
    }

    const route = routeFromPayload(payload)

    if (!route || route.includes('/login')) {
      throw new Error(payload?.message || payload?.error || 'Compte non lié à un workspace TrainingHub actif.')
    }

    localStorage.setItem('traininghub_entry_route', route)
    localStorage.setItem('traininghub_portal_kind', String(payload.kind || payload.portal || ''))

    // Full navigation intentionally used so server components read the fresh SSR auth cookie.
    window.location.assign(route)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password

    if (!cleanEmail || !cleanPassword) {
      setMessage('Email et mot de passe obligatoires.')
      return
    }

    setBusy(true)

    try {
      const supabase = getTrainingHubBrowserClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error || !data?.user?.id || !data?.session?.access_token) {
        throw new Error(error?.message || 'Identifiants invalides.')
      }

      // Let @supabase/ssr write cookies before loading the server-rendered workspace.
      await new Promise((resolve) => setTimeout(resolve, 250))

      await resolveAndRedirect(
        data.user.id,
        data.user.email || cleanEmail,
        data.session.access_token,
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Connexion impossible.'
      setMessage(msg)
      setBusy(false)
    }
  }

  async function resetStuckSession() {
    setBusy(true)
    setMessage('')
    await clearTrainingHubBrowserSession()
    setBusy(false)
    setEmail('')
    setPassword('')
    setMessage('Session locale nettoyée. Entrez vos identifiants puis reconnectez-vous.')
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.kicker}>ANGELCARE TRAININGHUB</div>
        <h1 style={styles.title}>Connexion unique TrainingHub.</h1>
        <p style={styles.copy}>
          Un seul accès. Le système détecte automatiquement le rôle et ouvre le bon espace: backoffice admin ou portail partenaire.
        </p>
        <div style={styles.tiles}>
          <div style={styles.tile}><strong>Admin</strong><span>Backoffice TrainingHub</span></div>
          <div style={styles.tile}><strong>Partenaire</strong><span>Portail client école</span></div>
          <div style={styles.tile}><strong>Session</strong><span>Cookies SSR synchronisés</span></div>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.logoBox}>ANGEL CARE</div>
          <div>
            <strong>TrainingHub</strong>
            <span style={styles.blueText}>SECURE UNIFIED GATEWAY</span>
          </div>
        </div>

        <h2 style={styles.cardTitle}>Connexion TrainingHub</h2>
        <p style={styles.cardCopy}>Admin interne ou partenaire école. La redirection se fait après authentification.</p>

        {message ? <div style={styles.errorBox}>{message}</div> : null}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Email TrainingHub
            <input
              style={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ex: traininghub.admin@angelcare.ma"
              type="email"
              autoComplete="email"
              disabled={busy}
            />
          </label>

          <label style={styles.label}>
            Mot de passe
            <input
              style={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={busy}
            />
          </label>

          <button style={styles.button} type="submit" disabled={busy}>
            {busy ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <button type="button" style={styles.resetButton} onClick={resetStuckSession} disabled={busy}>
          Nettoyer session bloquée
        </button>

        <div style={styles.notice}>
          Cette page ne redirige jamais automatiquement au chargement. Elle attend votre clic sur “Se connecter”.
        </div>
      </section>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.25fr 0.75fr',
    gap: 56,
    alignItems: 'center',
    padding: '7vh 9vw',
    background: 'radial-gradient(circle at 18% 15%, #eaf4ff 0, transparent 34%), linear-gradient(135deg, #f8fbff 0%, #eef7ff 48%, #f8fbff 100%)',
    color: '#0f1b33',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: { maxWidth: 760 },
  kicker: {
    display: 'inline-flex',
    padding: '10px 18px',
    border: '1px solid #d6e6ff',
    borderRadius: 999,
    background: 'rgba(255,255,255,.75)',
    color: '#1557ff',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 1.8,
  },
  title: { margin: '28px 0 18px', fontSize: 64, lineHeight: 0.96, letterSpacing: -3.5, fontWeight: 950 },
  copy: { maxWidth: 720, color: '#53627a', fontSize: 22, lineHeight: 1.55, fontWeight: 700 },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 36 },
  tile: {
    display: 'grid',
    gap: 8,
    padding: 22,
    borderRadius: 24,
    background: 'rgba(255,255,255,.86)',
    border: '1px solid #dbe8f8',
    boxShadow: '0 18px 60px rgba(18, 69, 143, .08)',
  },
  card: {
    padding: 34,
    borderRadius: 34,
    background: 'rgba(255,255,255,.92)',
    border: '1px solid #dbe8f8',
    boxShadow: '0 30px 90px rgba(15, 44, 91, .16)',
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: 18, marginBottom: 36 },
  logoBox: {
    width: 112,
    height: 48,
    borderRadius: 16,
    border: '1px solid #dbe8f8',
    display: 'grid',
    placeItems: 'center',
    color: '#1557ff',
    fontWeight: 950,
    background: '#fff',
    fontSize: 13,
  },
  blueText: { display: 'block', marginTop: 4, color: '#0b5cff', fontWeight: 950, fontSize: 13, letterSpacing: 1.5 },
  cardTitle: { fontSize: 34, lineHeight: 1.05, margin: 0, letterSpacing: -1.2, fontWeight: 950 },
  cardCopy: { color: '#66748c', fontWeight: 800, lineHeight: 1.55, fontSize: 17 },
  errorBox: {
    margin: '20px 0',
    padding: 16,
    borderRadius: 18,
    background: '#fff1f1',
    border: '1px solid #ffcaca',
    color: '#b91c1c',
    fontWeight: 850,
  },
  form: { display: 'grid', gap: 16, marginTop: 22 },
  label: { display: 'grid', gap: 8, color: '#33445f', fontWeight: 900, fontSize: 14 },
  input: {
    height: 58,
    borderRadius: 18,
    border: '1px solid #cfdaeb',
    background: '#f8fbff',
    padding: '0 18px',
    fontSize: 16,
    outline: 'none',
    color: '#0f1b33',
  },
  button: {
    height: 62,
    borderRadius: 18,
    border: 'none',
    background: 'linear-gradient(135deg, #0d1b3d, #2457d6)',
    color: '#fff',
    fontWeight: 950,
    fontSize: 16,
    boxShadow: '0 18px 44px rgba(36, 87, 214, .28)',
    cursor: 'pointer',
  },
  resetButton: {
    marginTop: 14,
    width: '100%',
    height: 48,
    borderRadius: 16,
    border: '1px solid #dbe8f8',
    background: '#fff',
    color: '#2457d6',
    fontWeight: 900,
    cursor: 'pointer',
  },
  notice: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    background: '#f8fbff',
    border: '1px solid #dbe8f8',
    color: '#4e5f78',
    fontWeight: 850,
  },
}
