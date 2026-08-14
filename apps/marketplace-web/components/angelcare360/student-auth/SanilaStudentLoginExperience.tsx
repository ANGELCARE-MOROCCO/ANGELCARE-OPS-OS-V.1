'use client'

import Image from 'next/image'
import {
  BarChart3,
  BookOpen,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type {
  Angelcare360CustomerBroadcastItem,
  Angelcare360CustomerBroadcastSnapshot,
} from '@/lib/angelcare360/customer-broadcasts'
import styles from './SanilaStudentLoginExperience.module.css'

type LoginAction = (formData: FormData) => void | Promise<void>
type Props = {
  loginAction: LoginAction
  loginError: string | null
  safeNext: string
  initialBroadcasts: Angelcare360CustomerBroadcastSnapshot
}

const FOUR_HOURS = 4 * 60 * 60 * 1000
const REMEMBER_KEY = 'sanila.student.login.identifier'

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
        ? BookOpen
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

    const schedule = () => {
      if (disposed) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const elapsed = Date.now() - loadedAtRef.current
      timeoutRef.current = setTimeout(refresh, Math.max(2_000, FOUR_HOURS - elapsed))
    }

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
        // Student authentication remains completely independent from the information channel.
      } finally {
        loadedAtRef.current = Date.now()
        refreshingRef.current = false
        schedule()
      }
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
          alt="AngelCare Kindergarten & Preschool"
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
      <span className={styles.submitArrow} aria-hidden="true">›</span>
    </button>
  )
}

function FeatureRail() {
  return (
    <div className={styles.featureRail} aria-label="Fonctionnalités de l’espace élève">
      <span><BookOpen aria-hidden="true" />Cours</span>
      <span><FileText aria-hidden="true" />Devoirs</span>
      <span><Star aria-hidden="true" />Évaluations</span>
      <span><BarChart3 aria-hidden="true" />Résultats</span>
      <span><FolderOpen aria-hidden="true" />Documents</span>
    </div>
  )
}

function LoginCard({ loginAction, loginError, safeNext }: Pick<Props, 'loginAction' | 'loginError' | 'safeNext'>) {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [username, setUsername] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

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
      // Authentication never depends on browser storage.
    }
  }

  return (
    <section className={styles.loginCard} aria-label="Connexion à l’espace Élève SANILA">
      <div className={styles.studentBadge} aria-hidden="true"><GraduationCap /></div>
      <div className={styles.cardHeading}>
        <h2>Espace Élève</h2>
        <p>Connectez-vous pour accéder à votre espace personnel.</p>
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
            <Mail aria-hidden="true" />
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Adresse e-mail ou identifiant"
              aria-label="Adresse e-mail ou identifiant"
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
            Utilisez le lien sécurisé transmis par votre établissement ou contactez son administration pour réinitialiser votre accès élève.
          </div>
        ) : null}

        <SubmitButton />

        <div className={styles.helpRow}>
          <Headphones aria-hidden="true" />
          <span>Besoin d’aide ?</span>
          <button type="button" onClick={() => setHelpOpen((current) => !current)} aria-expanded={helpOpen}>Centre d’aide</button>
        </div>
        {helpOpen ? <div className={styles.helpNotice}>Pour votre accès, contactez l’administration de votre établissement. Le support SANILA reste disponible pour les incidents techniques de plateforme.</div> : null}
      </form>
    </section>
  )
}

export default function SanilaStudentLoginExperience(props: Props) {
  return (
    <main className={styles.page}>
      <LiveBar initial={props.initialBroadcasts} />

      <section className={styles.stage}>
        <div className={styles.heroPanel}>
          <Image
            src="/sanila/student-login/sanila-student-morocco-approved.webp"
            alt="Élève marocaine utilisant son téléphone dans un établissement scolaire moderne"
            fill
            priority
            sizes="(min-width: 981px) 52vw, 100vw"
            className={styles.heroImage}
          />
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
              <h1>Bienvenue dans votre espace</h1>
              <p>Tout votre parcours scolaire, à portée de main.</p>
            </div>

            <FeatureRail />
            <LoginCard loginAction={props.loginAction} loginError={props.loginError} safeNext={props.safeNext} />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 SANILA Operating System</span>
        <span><Headphones aria-hidden="true" /> Support technique disponible 24/7</span>
        <span><ShieldCheck aria-hidden="true" /> Politique de confidentialité</span>
        <span><FileText aria-hidden="true" /> Conditions d’utilisation</span>
      </footer>
    </main>
  )
}
