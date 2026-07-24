import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileText,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import styles from './families-sanila.module.css'

export type ToneName = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet'

const tones: Record<ToneName, { bg: string; fg: string; border: string; accent: string }> = {
  blue: { bg: '#eaf5ff', fg: '#0c5ebd', border: '#bddbf7', accent: '#1878ed' },
  green: { bg: '#edf9f4', fg: '#08775a', border: '#bde3d5', accent: '#0a8f65' },
  amber: { bg: '#fff8e8', fg: '#9a5a05', border: '#efd49c', accent: '#d28a16' },
  red: { bg: '#fff0f2', fg: '#ad2734', border: '#efbcc2', accent: '#cf3947' },
  slate: { bg: '#f3f6f9', fg: '#53677f', border: '#d8e1ea', accent: '#70839a' },
  violet: { bg: '#f3efff', fg: '#6542aa', border: '#d7c9f7', accent: '#7c5ac8' },
}

export function text(value: unknown, fallback = 'Non renseigné') {
  return value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
}

export function formatDate(value: unknown, withTime = false) {
  if (!value) return 'Non programmée'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return text(value)
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date)
}

export function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function isActiveStatus(value: unknown) {
  return ['active', 'actif', 'confirmed', 'planned', 'in_progress', 'en cours', 'ongoing'].includes(normalize(value))
}

export function isSensitiveStatus(value: unknown) {
  return ['high', 'critical', 'urgent', 'incident', 'blocked', 'overdue', 'critique', 'élevé', 'eleve'].some((token) => normalize(value).includes(token))
}

export function statusTone(value: unknown): ToneName {
  const status = normalize(value)
  if (status.includes('vip') || status.includes('premium')) return 'violet'
  if (['active', 'actif', 'confirmed', 'planned', 'in_progress', 'completed', 'paid', 'signed'].some((item) => status.includes(item))) return 'green'
  if (['high', 'critical', 'urgent', 'blocked', 'incident', 'suspended'].some((item) => status.includes(item))) return 'red'
  if (['pending', 'review', 'draft', 'waiting', 'due'].some((item) => status.includes(item))) return 'amber'
  return 'slate'
}

export function familyMonogram(familyName: unknown, parentName?: unknown) {
  const source = text(familyName, text(parentName, 'Famille'))
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function BrandLockup() {
  return (
    <div className={styles.brandRow}>
      <div className={styles.logoPlate}>
        <Image src="/logo.png" alt="ANGELCARE" width={220} height={92} className={styles.logoImage} priority />
      </div>
      <div className={styles.brandCopy}>
        <strong>ANGELCARE SANILA OS</strong>
        <span>Families 360° · Relationship & Care Continuity</span>
      </div>
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className={styles.eyebrow}><Sparkles size={14} strokeWidth={2.4} />{children}</div>
}

export function KpiCard({ label, value, sub, tone = 'blue' }: { label: string; value: ReactNode; sub: string; tone?: ToneName }) {
  const t = tones[tone]
  return (
    <div className={styles.kpiCard} style={{ '--accent': t.accent } as CSSProperties}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <small className={styles.kpiSub}>{sub}</small>
    </div>
  )
}

export function StatusBadge({ value, label, tone }: { value?: unknown; label?: string; tone?: ToneName }) {
  const resolvedTone = tone || statusTone(value)
  const t = tones[resolvedTone]
  return (
    <span
      className={styles.statusBadge}
      style={{ '--badge-bg': t.bg, '--badge-fg': t.fg, '--badge-border': t.border } as CSSProperties}
    >
      <CircleDot size={10} fill="currentColor" />
      {label || text(value, 'Standard')}
    </span>
  )
}

export function Monogram({ familyName, parentName, large = false }: { familyName: unknown; parentName?: unknown; large?: boolean }) {
  return <div className={large ? styles.largeMonogram : styles.monogram}>{familyMonogram(familyName, parentName)}</div>
}

export function MetaBox({ label, value }: { label: string; value: ReactNode }) {
  return <div className={styles.metaBox}><span>{label}</span><strong>{value}</strong></div>
}

export function InfoBox({ label, value }: { label: string; value: ReactNode }) {
  return <div className={styles.infoBox}><span>{label}</span><strong>{value}</strong></div>
}

export function PanelHeader({ title, text: description, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={styles.panelHeader}>
      <div>
        <h2 className={styles.panelTitle}>{title}</h2>
        {description ? <p className={styles.panelText}>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, text: description, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <div>
        <HeartHandshake size={28} />
        <strong>{title}</strong>
        <p>{description}</p>
        {action ? <div className={styles.actionRow} style={{ justifyContent: 'center', marginTop: 14 }}>{action}</div> : null}
      </div>
    </div>
  )
}

export function ContinuityItem({ label, value, tone = 'slate' }: { label: string; value: ReactNode; tone?: ToneName }) {
  const t = tones[tone]
  return (
    <div className={styles.continuityItem} style={{ borderColor: t.border, background: t.bg }}>
      <span style={{ color: t.fg }}>{label}</span>
      <strong style={{ color: t.fg }}>{value}</strong>
    </div>
  )
}

export function ManagerAlert({ title, text: description, tone = 'blue' }: { title: string; text: string; tone?: ToneName }) {
  const t = tones[tone]
  const Icon = tone === 'red' ? AlertTriangle : tone === 'amber' ? CalendarClock : tone === 'green' ? CheckCircle2 : ShieldCheck
  return (
    <div className={styles.alertItem}>
      <span className={styles.alertIcon} style={{ '--alert-bg': t.bg, '--alert-fg': t.fg } as CSSProperties}><Icon size={17} /></span>
      <div><strong>{title}</strong><p>{description}</p></div>
    </div>
  )
}

export function RelatedItem({ href, title, status, date, meta }: { href: string; title: string; status?: unknown; date?: unknown; meta?: string }) {
  return (
    <Link href={href} className={styles.relatedItem} style={{ textDecoration: 'none', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
      <div><strong>{title}</strong><p>{meta || formatDate(date, true)}</p></div>
      <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
        <StatusBadge value={status} />
        <ArrowRight size={15} color="#58708a" />
      </div>
    </Link>
  )
}

export function HeroMetric({ type, value, label }: { type: 'families' | 'trust' | 'review' | 'contracts'; value: ReactNode; label: string }) {
  const Icon = type === 'families' ? UsersRound : type === 'trust' ? ShieldCheck : type === 'review' ? CalendarClock : FileText
  return (
    <div className={styles.heroMetric}>
      <span className={styles.heroMetricIcon}><Icon size={21} /></span>
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  )
}

export function LocationLine({ city, zone }: { city?: unknown; zone?: unknown }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={12} />{[text(city, ''), text(zone, '')].filter(Boolean).join(' · ') || 'Localisation non renseignée'}</span>
}

export function RelationshipIcon({ kind }: { kind: 'family' | 'contract' | 'mission' | 'care' }) {
  const Icon = kind === 'family' ? UsersRound : kind === 'contract' ? FileText : kind === 'mission' ? Building2 : HeartHandshake
  return <Icon size={18} />
}
