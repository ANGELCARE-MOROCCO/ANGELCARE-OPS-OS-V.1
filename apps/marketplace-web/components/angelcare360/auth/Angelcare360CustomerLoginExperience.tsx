'use client'

import Image from 'next/image'
import {
  ArrowRight,
  BookOpenText,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type {
  Angelcare360CustomerBroadcastItem,
  Angelcare360CustomerBroadcastSnapshot,
} from '@/lib/angelcare360/customer-broadcasts'
import styles from './Angelcare360CustomerLoginExperience.module.css'

type LoginAction = (formData: FormData) => void | Promise<void>

type Props = {
  loginAction: LoginAction
  loginError: string | null
  safeNext: string
  initialBroadcasts: Angelcare360CustomerBroadcastSnapshot
}

const FOUR_HOURS = 4 * 60 * 60 * 1000

function BrowserClock() {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [],
  )
  const [value, setValue] = useState('')

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const schedule = () => {
      const now = new Date()
      setValue(formatter.format(now))
      const delay = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 24
      timeout = setTimeout(() => {
        if (!cancelled) schedule()
      }, Math.max(250, delay))
    }

    schedule()
    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
    }
  }, [formatter])

  return (
    <time className={styles.clock} aria-label={value ? `Heure locale ${value}` : 'Heure locale'}>
      <Clock3 aria-hidden="true" />
      <span>{value || '—:—'}</span>
    </time>
  )
}

function FeedIcon({ kind }: { kind: Angelcare360CustomerBroadcastItem['kind'] }) {
  const Icon =
    kind === 'maintenance'
      ? Wrench
      : kind === 'guide'
        ? BookOpenText
        : kind === 'security'
          ? ShieldCheck
          : kind === 'support'
            ? Headphones
            : kind === 'warning'
              ? CircleAlert
              : kind === 'release'
                ? Sparkles
                : Info
  return <Icon aria-hidden="true" />
}

function TickerItem({ item }: { item: Angelcare360CustomerBroadcastItem }) {
  return (
    <span className={styles.tickerItem}>
      <FeedIcon kind={item.kind} />
      <span>{item.text}</span>
    </span>
  )
}

function BroadcastTicker({ initial }: { initial: Angelcare360CustomerBroadcastSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial)
  const loadedAtRef = useRef(Date.now())
  const versionRef = useRef(initial.version)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshingRef = useRef(false)

  useEffect(() => {
    versionRef.current = snapshot.version
  }, [snapshot.version])

  useEffect(() => {
    let disposed = false

    const refresh = async () => {
      if (disposed || refreshingRef.current) return
      refreshingRef.current = true
      try {
        const response = await fetch('/api/angelcare360/customer-broadcasts', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'If-None-Match': `W/\"${versionRef.current}\"` },
        })
        if (response.status === 200) {
          const next = (await response.json()) as Angelcare360CustomerBroadcastSnapshot
          if (!disposed && next.version && next.version !== versionRef.current) {
            versionRef.current = next.version
            setSnapshot(next)
          }
        }
      } catch {
        // The broadcast channel is decorative/supportive; authentication remains independent.
      } finally {
        loadedAtRef.current = Date.now()
        refreshingRef.current = false
        schedule()
      }
    }

    const schedule = () => {
      if (disposed) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const elapsed = Date.now() - loadedAtRef.current
      timeoutRef.current = setTimeout(refresh, Math.max(2_000, FOUR_HOURS - elapsed))
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - loadedAtRef.current >= FOUR_HOURS) void refresh()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const items = snapshot.items.length ? snapshot.items : initial.items

  return (
    <div className={styles.tickerViewport} aria-label="Informations clients SANILA">
      <div className={styles.tickerTrack}>
        <div className={styles.tickerGroup}>
          {items.map((item) => (
            <TickerItem key={`a-${item.id}`} item={item} />
          ))}
        </div>
        <div className={styles.tickerGroup} aria-hidden="true">
          {items.map((item) => (
            <TickerItem key={`b-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CustomerBroadcastBar({ initial }: { initial: Angelcare360CustomerBroadcastSnapshot }) {
  return (
    <header className={styles.broadcastBar}>
      <div className={styles.brandLockup}>
        <Image
          src="/sanila/sanila-operating-system-logo-white.png"
          alt="SANILA Operating System"
          width={188}
          height={66}
          priority
          className={styles.officialLogo}
        />
      </div>
      <BrowserClock />
      <div className={styles.liveBadge} aria-label="Canal d'information client en direct">
        <span aria-hidden="true" />
        LIVE
      </div>
      <BroadcastTicker initial={initial} />
    </header>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button className={styles.submitButton} type="submit" disabled={pending}>
      <span>{pending ? 'Connexion sécurisée…' : 'Se connecter'}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  )
}

function LoginForm({ loginAction, loginError, safeNext }: Pick<Props, 'loginAction' | 'loginError' | 'safeNext'>) {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [username, setUsername] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem('angelcare360.login.identifier') || ''
      if (remembered) {
        setUsername(remembered)
        setRemember(true)
      }
    } catch {
      // Browser storage can be disabled; login remains fully functional.
    }
  }, [])

  const onSubmit = () => {
    try {
      if (remember && username.trim()) window.localStorage.setItem('angelcare360.login.identifier', username.trim())
      else window.localStorage.removeItem('angelcare360.login.identifier')
    } catch {
      // Remembering the identifier is convenience-only and never blocks authentication.
    }
  }

  return (
    <form action={loginAction} className={styles.form} onSubmit={onSubmit}>
      <input type="hidden" name="next" value={safeNext} />

      {loginError ? (
        <div className={styles.errorNotice} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{loginError}</span>
        </div>
      ) : null}

      <label className={styles.field}>
        <span>IDENTIFIANT / EMAIL</span>
        <span className={styles.inputShell}>
          <UserRound aria-hidden="true" />
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Votre email professionnel"
          />
        </span>
      </label>

      <label className={styles.field}>
        <span>MOT DE PASSE</span>
        <span className={styles.inputShell}>
          <LockKeyhole aria-hidden="true" />
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Votre mot de passe"
          />
          <button
            type="button"
            className={styles.revealButton}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </span>
      </label>

      <div className={styles.formMeta}>
        <label className={styles.rememberControl}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Se souvenir de moi</span>
        </label>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setRecoveryOpen((current) => !current)}
          aria-expanded={recoveryOpen}
        >
          Mot de passe oublié ?
        </button>
      </div>

      {recoveryOpen ? (
        <div className={styles.recoveryNotice}>
          La réinitialisation sécurisée est déclenchée par un administrateur autorisé. Utilisez le lien reçu par e-mail ou contactez votre administrateur SANILA.
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}

function InvitationAccess() {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const raw = value.trim()
    if (!raw) {
      setError('Collez le lien sécurisé ou le jeton reçu dans votre invitation.')
      return
    }

    let token = raw
    try {
      const parsed = new URL(raw, window.location.origin)
      token = parsed.searchParams.get('token') || raw
    } catch {
      // Raw invitation tokens are accepted too.
    }

    if (!token || token.length < 12) {
      setError('Cette invitation ne semble pas valide.')
      return
    }

    window.location.assign(`/angelcare-360-access/activate?token=${encodeURIComponent(token)}&mode=invite`)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.inviteIntro}>
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Activation d’un accès invité</strong>
          <span>Utilisez le lien d’activation à usage unique transmis par AngelCare.</span>
        </div>
      </div>
      {error ? <div className={styles.errorNotice}>{error}</div> : null}
      <label className={styles.field}>
        <span>LIEN OU JETON D’INVITATION</span>
        <span className={styles.inputShell}>
          <LockKeyhole aria-hidden="true" />
          <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Collez votre invitation sécurisée" />
        </span>
      </label>
      <button className={styles.submitButton} type="submit">
        <span>Continuer l’activation</span>
        <ArrowRight aria-hidden="true" />
      </button>
    </form>
  )
}

function TrustRail() {
  return (
    <div className={styles.trustRail} aria-label="Engagements de service">
      <div>
        <ShieldCheck aria-hidden="true" />
        <span><strong>Sécurité</strong><small>Données protégées</small></span>
      </div>
      <div>
        <CircleCheckBig aria-hidden="true" />
        <span><strong>Fiable</strong><small>Continuité maîtrisée</small></span>
      </div>
      <div>
        <Sparkles aria-hidden="true" />
        <span><strong>Conçu pour l’excellence</strong><small>Pilotage professionnel</small></span>
      </div>
    </div>
  )
}

export default function Angelcare360CustomerLoginExperience(props: Props) {
  const [tab, setTab] = useState<'login' | 'invite'>('login')

  return (
    <main className={styles.page}>
      <CustomerBroadcastBar initial={props.initialBroadcasts} />

      <div className={styles.desktopStage}>
        <section className={styles.heroPanel} aria-label="Direction d’établissement scolaire SANILA">
          <Image
            src="/angelcare360/login/angelcare360-executive-morocco.webp"
            alt="Directrice d’établissement scolaire dans un environnement professionnel marocain"
            fill
            priority
            sizes="(min-width: 1200px) 55vw, 52vw"
            className={styles.heroImage}
          />
          <div className={styles.heroEdge} aria-hidden="true" />
        </section>

        <section className={styles.loginPanel}>
          <div className={styles.productBlock}>
            <div className={styles.sanilaLine}>
              <span>SANILA Operating System</span>
              <i aria-hidden="true" />
            </div>
            <h1>SANILA OS</h1>
            <h2>Pilotage établissement scolaire</h2>
            <p>Tout votre établissement. <strong>Sous contrôle.</strong> Vers l’excellence.</p>
          </div>

          <section className={styles.loginCard} aria-label="Connexion SANILA Operating System">
            <div className={styles.tabs} role="tablist" aria-label="Mode d’accès">
              <button
                role="tab"
                aria-selected={tab === 'login'}
                className={tab === 'login' ? styles.activeTab : ''}
                onClick={() => setTab('login')}
                type="button"
              >
                Connexion
              </button>
              <button
                role="tab"
                aria-selected={tab === 'invite'}
                className={tab === 'invite' ? styles.activeTab : ''}
                onClick={() => setTab('invite')}
                type="button"
              >
                Accès invité
              </button>
            </div>
            <div className={styles.cardBody}>
              {tab === 'login' ? (
                <LoginForm loginAction={props.loginAction} loginError={props.loginError} safeNext={props.safeNext} />
              ) : (
                <InvitationAccess />
              )}
            </div>
          </section>

          <TrustRail />
          <footer className={styles.footer}>© 2026 SANILA Operating System · by AngelCare.</footer>
        </section>
      </div>
    </main>
  )
}
