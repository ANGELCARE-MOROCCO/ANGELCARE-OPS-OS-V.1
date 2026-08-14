'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpenText,
  Building2,
  CircleAlert,
  CircleHelp,
  Clock3,
  GraduationCap,
  Headphones,
  Info,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Angelcare360CustomerBroadcastItem,
  Angelcare360CustomerBroadcastSnapshot,
} from '@/lib/angelcare360/customer-broadcasts'
import styles from './SanilaMasterGateway.module.css'

const FOUR_HOURS = 4 * 60 * 60 * 1000

type GatewayDoor = {
  key: 'administration' | 'teacher' | 'staff' | 'parent' | 'student'
  eyebrow: string
  title: string
  description: string
  image: string
  href: string
  icon: typeof Building2
  featured?: boolean
}

const DOORS: GatewayDoor[] = [
  {
    key: 'administration',
    eyebrow: 'PILOTAGE',
    title: 'Établissement / Administration',
    description: "Pilotage stratégique et gestion de l’établissement.",
    image: '/sanila/gateway/sanila-gateway-admin.webp',
    href: '/angelcare-360-access/login',
    icon: Building2,
    featured: true,
  },
  {
    key: 'teacher',
    eyebrow: 'PÉDAGOGIE',
    title: 'Espace Enseignant',
    description: 'Enseigner, planifier et suivre les apprentissages.',
    image: '/sanila/gateway/sanila-gateway-teacher.webp',
    href: '/angelcare-360-teacher/login',
    icon: BookOpenText,
  },
  {
    key: 'staff',
    eyebrow: 'ÉQUIPE',
    title: 'Espace Équipe',
    description: 'Collaborer, organiser et assurer le suivi.',
    image: '/sanila/gateway/sanila-gateway-staff.webp',
    href: '/angelcare-360-staff/login',
    icon: UsersRound,
  },
  {
    key: 'parent',
    eyebrow: 'FAMILLE',
    title: 'Espace Parent / Tuteur',
    description: 'Suivre, accompagner et rester informé.',
    image: '/sanila/gateway/sanila-gateway-parent.webp',
    href: '/angelcare-360-parent/login',
    icon: UsersRound,
  },
  {
    key: 'student',
    eyebrow: 'APPRENTISSAGE',
    title: 'Espace Élève',
    description: 'Apprendre, progresser et réussir.',
    image: '/sanila/gateway/sanila-gateway-student.webp',
    href: '/angelcare-360-student/login',
    icon: GraduationCap,
  },
]

function brandSafe(value: string) {
  return value.replace(/AngelCare\s*360/gi, 'SANILA Operating System')
}

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
      <span>{brandSafe(item.text)}</span>
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
        // The public gateway remains fully usable if the customer broadcast source is unavailable.
      } finally {
        loadedAtRef.current = Date.now()
        refreshingRef.current = false
        schedule()
      }
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

function LiveBar({ initial }: { initial: Angelcare360CustomerBroadcastSnapshot }) {
  return (
    <header className={styles.liveBar}>
      <div className={styles.logoSlot}>
        <Image
          src="/brand/angelcare-official-user-transparent.png"
          alt="AngelCare"
          width={214}
          height={54}
          priority
          className={styles.officialLogo}
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

function DoorCard({ door }: { door: GatewayDoor }) {
  const Icon = door.icon
  return (
    <article className={`${styles.doorCard} ${door.featured ? styles.featuredDoor : ''}`}>
      <div className={styles.doorCrown} aria-hidden="true">
        <span><Icon /></span>
      </div>
      <div className={styles.doorCopy}>
        <span className={styles.doorEyebrow}>{door.eyebrow}</span>
        <h2>{door.title}</h2>
        <i aria-hidden="true" />
        <p>{door.description}</p>
      </div>
      <div className={styles.portraitFrame}>
        <Image
          src={door.image}
          alt=""
          fill
          sizes={door.featured ? '(max-width: 720px) 90vw, 320px' : '(max-width: 720px) 42vw, 230px'}
          className={styles.portrait}
          priority={door.featured}
        />
        <div className={styles.portraitVignette} aria-hidden="true" />
      </div>
      <Link className={styles.accessButton} href={door.href} aria-label={`Accéder à ${door.title}`}>
        <span>Accéder</span>
        <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  )
}

export function SanilaMasterGateway({
  initialBroadcasts,
}: {
  initialBroadcasts: Angelcare360CustomerBroadcastSnapshot
}) {
  return (
    <main className={styles.page}>
      <LiveBar initial={initialBroadcasts} />

      <section className={styles.gatewayStage}>
        <div className={styles.architectureLeft} aria-hidden="true" />
        <div className={styles.architectureRight} aria-hidden="true" />

        <header className={styles.heroCopy}>
          <div className={styles.sanilaKicker}>PILOTAGE ÉTABLISSEMENT SCOLAIRE</div>
          <h1>SANILA <span>Operating System</span></h1>
          <div className={styles.heroDivider} aria-hidden="true"><i /><b>✦</b><i /></div>
          <h2>Choisissez votre espace</h2>
          <p>Une seule porte d’entrée. Des accès dédiés selon votre rôle dans l’établissement.</p>
        </header>

        <section className={styles.doorsGrid} aria-label="Choisissez votre espace SANILA">
          {DOORS.map((door) => (
            <DoorCard key={door.key} door={door} />
          ))}
        </section>

        <footer className={styles.footer}>
          <span>© 2026 SANILA Operating System. Tous droits réservés.</span>
          <span className={styles.support}><Headphones aria-hidden="true" /> Support technique disponible 24/7</span>
          <Link href="/angelcare-360-access/login" className={styles.helpLink}>
            <CircleHelp aria-hidden="true" /> Centre d’aide
          </Link>
        </footer>
      </section>
    </main>
  )
}
