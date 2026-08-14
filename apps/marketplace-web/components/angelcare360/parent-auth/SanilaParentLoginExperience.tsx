'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpenText,
  CircleAlert,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type {
  Angelcare360CustomerBroadcastItem,
  Angelcare360CustomerBroadcastSnapshot,
} from '@/lib/angelcare360/customer-broadcasts'
import styles from './SanilaParentLoginExperience.module.css'

type LoginAction = (formData: FormData) => void | Promise<void>
type Props = {
  loginAction: LoginAction
  loginError: string | null
  safeNext: string
  initialBroadcasts: Angelcare360CustomerBroadcastSnapshot
}

const FOUR_HOURS = 4 * 60 * 60 * 1000
const REMEMBER_KEY = 'sanila.parent.login.identifier'

function brandSafe(value: string) {
  return value.replace(/AngelCare\s*360/gi, 'SANILA Operating System')
}

function BrowserClock() {
  const formatter = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }),
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
            : kind === 'release'
              ? Sparkles
              : kind === 'warning'
                ? CircleAlert
                : Info
  return <Icon aria-hidden="true" />
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
          headers: { 'If-None-Match': `W/"${versionRef.current}"` },
        })
        if (response.status === 200) {
          const next = (await response.json()) as Angelcare360CustomerBroadcastSnapshot
          if (!disposed && next.version && next.version !== versionRef.current) {
            versionRef.current = next.version
            setSnapshot(next)
          }
        }
      } catch {
        // Authentication remains fully independent from the information channel.
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
      if (document.visibilityState === 'visible' && Date.now() - loadedAtRef.current >= FOUR_HOURS) {
        void refresh()
      }
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
            <span className={styles.tickerItem} key={`a-${item.id}`}>
              <FeedIcon kind={item.kind} />
              <span>{brandSafe(item.text)}</span>
            </span>
          ))}
        </div>
        <div className={styles.tickerGroup} aria-hidden="true">
          {items.map((item) => (
            <span className={styles.tickerItem} key={`b-${item.id}`}>
              <FeedIcon kind={item.kind} />
              <span>{brandSafe(item.text)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function LiveBar({ initial }: { initial: Angelcare360CustomerBroadcastSnapshot }) {
  return (
    <header className={styles.liveBar}>
      <div className={styles.angelcareLogoSlot}>
        <Image
          src="/brand/angelcare-official-user-transparent.png"
          alt="AngelCare"
          width={214}
          height={54}
          priority
          className={styles.angelcareLogo}
        />
      </div>
      <BrowserClock />
      <div className={styles.liveBadge} aria-label="Canal d’information en direct">
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

function LoginCard({ loginAction, loginError, safeNext }: Pick<Props, 'loginAction' | 'loginError' | 'safeNext'>) {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [username, setUsername] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(REMEMBER_KEY) || ''
      if (remembered) {
        setUsername(remembered)
        setRemember(true)
      }
    } catch {
      // Local storage is convenience-only.
    }
  }, [])

  const persistIdentifier = () => {
    try {
      if (remember && username.trim()) window.localStorage.setItem(REMEMBER_KEY, username.trim())
      else window.localStorage.removeItem(REMEMBER_KEY)
    } catch {
      // Authentication must never depend on browser storage.
    }
  }

  return (
    <section className={styles.loginCard} aria-label="Connexion à l’espace Parent / Tuteur SANILA">
      <div className={styles.parentBadge} aria-hidden="true"><UsersRound /></div>
      <div className={styles.cardHeading}>
        <h2>Espace Parent / Tuteur</h2>
        <p>Votre accès famille sécurisé,<br />simple et directement relié à l’établissement.</p>
      </div>

      <form action={loginAction} className={styles.form} onSubmit={persistIdentifier}>
        <input type="hidden" name="next" value={safeNext} />

        {loginError ? (
          <div className={styles.errorNotice} role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{loginError}</span>
          </div>
        ) : null}

        <label className={styles.field}>
          <span className={styles.inputShell}>
            <UserRound aria-hidden="true" />
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Email ou identifiant"
              aria-label="Email ou identifiant"
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.inputShell}>
            <LockKeyhole aria-hidden="true" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Mot de passe"
              aria-label="Mot de passe"
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
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span>Se souvenir de moi</span>
          </label>
          <button
            type="button"
            className={styles.recoveryButton}
            onClick={() => setRecoveryOpen((current) => !current)}
            aria-expanded={recoveryOpen}
          >
            Mot de passe oublié ?
          </button>
        </div>

        {recoveryOpen ? (
          <div className={styles.recoveryNotice}>
            Utilisez le lien sécurisé transmis par votre établissement ou contactez son administration pour réinitialiser votre accès famille.
          </div>
        ) : null}

        <SubmitButton />

        <div className={styles.separator}><span />ou<span /></div>
        <Link className={styles.gatewayButton} href="/angelcare-360-access">
          <ShieldCheck aria-hidden="true" />
          <span>Retour au portail SANILA</span>
        </Link>
      </form>
    </section>
  )
}

export default function SanilaParentLoginExperience(props: Props) {
  return (
    <main className={styles.page}>
      <LiveBar initial={props.initialBroadcasts} />

      <section className={styles.stage}>
        <div className={styles.heroPanel}>
          <Image
            src="/sanila/parent-login/sanila-parent-morocco-approved.webp"
            alt="Mère marocaine utilisant son téléphone pour accéder à l’espace famille SANILA"
            fill
            priority
            sizes="(min-width: 981px) 52vw, 100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroEdge} aria-hidden="true" />
        </div>

        <div className={styles.authPanel}>
          <div className={styles.authInner}>
            <Image
              src="/brand/sanila-official-logo.png"
              alt="SANILA Operating System"
              width={441}
              height={181}
              priority
              className={styles.sanilaLogo}
            />

            <div className={styles.titleBlock}>
              <p>Votre espace dédié pour rester connecté à chaque moment clé :<br className={styles.desktopOnly} /> présence, scolarité, paiements, transport et échanges avec l’établissement.</p>
            </div>

            <LoginCard loginAction={props.loginAction} loginError={props.loginError} safeNext={props.safeNext} />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 SANILA Operating System. Tous droits réservés.</span>
        <span><Headphones aria-hidden="true" /> Support technique disponible 24/7</span>
        <Link href="/angelcare-360-access"><CircleHelp aria-hidden="true" /> Centre d’aide</Link>
      </footer>
    </main>
  )
}
