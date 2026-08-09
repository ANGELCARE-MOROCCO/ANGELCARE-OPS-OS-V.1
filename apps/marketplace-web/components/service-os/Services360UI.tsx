import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCog,
  Gauge,
  Layers3,
  MapPinned,
  Network,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import styles from './Services360.module.css'
import { CommandHeader, CommercialCoreBar, WorkspaceNav } from '@/components/commercial-core/CommercialCoreShell'

export type ProvenanceTone = 'live' | 'configured' | 'fallback' | 'simulation' | 'legacy' | 'unavailable'

export function SourceBadge({ label, tone = 'live' }: { label: ReactNode; tone?: ProvenanceTone }) {
  return (
    <span className={styles.sourceBadge} data-tone={tone}>
      <span className={styles.sourceDot} />
      {label}
    </span>
  )
}

export function Services360Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  briefTitle = 'Executive service brief',
  briefRows = [],
  provenance = [],
}: {
  eyebrow: string
  title: ReactNode
  subtitle: ReactNode
  actions?: ReactNode
  briefTitle?: ReactNode
  briefRows?: Array<{ label: ReactNode; value: ReactNode }>
  provenance?: Array<{ label: ReactNode; tone?: ProvenanceTone }>
}) {
  const source = provenance.length ? (
    <div className={styles.sourceStrip}>
      {provenance.map((item, index) => <SourceBadge key={index} label={item.label} tone={item.tone} />)}
    </div>
  ) : 'Source présentée selon son état réel : catalogue, ServiceOS, configuration, simulation ou fallback.'

  const aside = briefRows.length ? (
    <div>
      <div className={styles.briefLabel}>Service governance</div>
      <h3 className={styles.briefTitle}>{briefTitle}</h3>
      <div className={styles.briefList}>
        {briefRows.map((row, index) => (
          <div className={styles.briefRow} key={index}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  ) : null

  return (
    <>
      <CommercialCoreBar active="services" />
      <CommandHeader
        eyebrow={eyebrow}
        title={title}
        description={subtitle}
        actions={actions}
        aside={aside}
        source={source}
      />
    </>
  )
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <section className={styles.kpiGrid}>{children}</section>
}

export function Kpi({ label, value, helper }: { label: ReactNode; value: ReactNode; helper?: ReactNode }) {
  return (
    <article className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {helper ? <div className={styles.kpiHelper}>{helper}</div> : null}
    </article>
  )
}

export function Services360Nav({ items: _items }: { items: Array<{ label: string; href: string }> }) {
  const items = [
    { href: '/services', label: 'Portfolio', description: 'Offres & préparation' },
    { href: '/services/blueprints', label: 'Blueprints', description: 'Architecture de livraison' },
    { href: '/services/pricing-engine', label: 'Tarification', description: 'Prix & simulations' },
    { href: '/services/operations', label: 'Delivery readiness', description: 'Exécution & capacité' },
    { href: '/services/configuration', label: 'Gouvernance', description: 'Modules, règles & conformité' },
    { href: '/services/enterprise', label: 'Executive', description: 'Santé du portefeuille' },
  ]
  return <WorkspaceNav items={items} />
}

export function LifecycleRibbon({ items }: { items: Array<{ label: ReactNode; value: ReactNode }> }) {
  return (
    <section className={styles.lifecycle}>
      {items.map((item, index) => (
        <div className={styles.lifeNode} key={index}>
          <span className={styles.lifeLabel}>{item.label}</span>
          <span className={styles.lifeValue}>{item.value}</span>
        </div>
      ))}
    </section>
  )
}

export function Panel({ eyebrow, title, text, actions, children, id }: { eyebrow?: ReactNode; title: ReactNode; text?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className={`${styles.panel} ${styles.stage}`} id={id}>
      <div className={styles.panelHead}>
        <div>
          {eyebrow ? <div className={styles.panelEyebrow}>{eyebrow}</div> : null}
          <h3 className={styles.panelTitle}>{title}</h3>
          {text ? <div className={styles.panelText}>{text}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

export function StatPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'risk' }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>
}

export function MiniStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className={styles.miniStat}><div className={styles.miniLabel}>{label}</div><div className={styles.miniValue}>{value}</div></div>
}

export function ServiceCard({
  code,
  title,
  text,
  status,
  pills = [],
  stats = [],
  href,
  footer,
}: {
  code?: ReactNode
  title: ReactNode
  text?: ReactNode
  status?: ReactNode
  pills?: Array<{ label: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'risk' }>
  stats?: Array<{ label: ReactNode; value: ReactNode }>
  href?: string
  footer?: ReactNode
}) {
  const card = (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          {code ? <div className={styles.cardCode}>{code}</div> : null}
          <h4 className={styles.cardTitle}>{title}</h4>
        </div>
        {status}
      </div>
      {text ? <div className={styles.cardText}>{text}</div> : null}
      {pills.length ? <div className={styles.pills}>{pills.map((pill, index) => <StatPill key={index} tone={pill.tone}>{pill.label}</StatPill>)}</div> : null}
      {stats.length ? <div className={styles.cardStats}>{stats.map((stat, index) => <MiniStat key={index} label={stat.label} value={stat.value} />)}</div> : null}
      <div className={styles.cardFooter}>
        {href ? <span className={styles.textLink}>Ouvrir le dossier <ArrowRight size={13} style={{ verticalAlign: 'middle' }} /></span> : <span />}
        {footer ? <span className={styles.muted}>{footer}</span> : null}
      </div>
    </article>
  )
  return href ? <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{card}</Link> : card
}

export function CommandRail({ children }: { children: ReactNode }) {
  return <aside className={styles.commandRail}>{children}</aside>
}

export function DarkRailCard({ title, text, alerts = [] }: { title: ReactNode; text?: ReactNode; alerts?: Array<{ title: ReactNode; text: ReactNode }> }) {
  return (
    <section className={styles.railCard}>
      <h4 className={styles.railTitle}>{title}</h4>
      {text ? <div className={styles.railText}>{text}</div> : null}
      {alerts.length ? <div className={styles.alertList}>{alerts.map((alert, index) => <div className={styles.alert} key={index}><div className={styles.alertTitle}>{alert.title}</div><div className={styles.alertText}>{alert.text}</div></div>)}</div> : null}
    </section>
  )
}

export function LightRailCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <section className={styles.railCardLight}><h4 className={styles.railTitle}>{title}</h4><div className={styles.reviewList}>{children}</div></section>
}

export function ReviewRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className={styles.reviewRow}><span>{label}</span><strong>{value}</strong></div>
}

export function EmptyState({ title, text, action }: { title: ReactNode; text: ReactNode; action?: ReactNode }) {
  return <div className={styles.empty}><div className={styles.emptyTitle}>{title}</div><div className={styles.emptyText}>{text}</div>{action ? <div className={styles.actions} style={{ justifyContent: 'center' }}>{action}</div> : null}</div>
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <Link className={styles.primaryAction} href={href}>{children}</Link>
}
export function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <Link className={styles.secondaryAction} href={href}>{children}</Link>
}
export function DangerAction({ href, children }: { href: string; children: ReactNode }) {
  return <Link className={styles.dangerAction} href={href}>{children}</Link>
}

export function ServiceStateIcon({ kind }: { kind: 'portfolio' | 'pricing' | 'capacity' | 'governance' | 'commercial' | 'delivery' | 'quality' | 'ai' }) {
  const props = { size: 18, strokeWidth: 2.2 }
  if (kind === 'portfolio') return <Boxes {...props} />
  if (kind === 'pricing') return <CircleDollarSign {...props} />
  if (kind === 'capacity') return <MapPinned {...props} />
  if (kind === 'governance') return <ShieldCheck {...props} />
  if (kind === 'commercial') return <Building2 {...props} />
  if (kind === 'delivery') return <Network {...props} />
  if (kind === 'quality') return <BadgeCheck {...props} />
  return <Sparkles {...props} />
}

export const serviceWorkspaceNav = [
  { label: 'Portfolio', href: '/services' },
  { label: 'Blueprints', href: '/services/blueprints' },
  { label: 'Configuration', href: '/services/configuration' },
  { label: 'Règles', href: '/services/rules' },
  { label: 'Tarification', href: '/services/pricing-engine' },
  { label: 'Opérations', href: '/services/operations' },
  { label: 'Live Ops', href: '/services/live-ops' },
  { label: 'Capacité', href: '/services/capacity' },
  { label: 'Commercial', href: '/services/commercial' },
  { label: 'Expansion', href: '/services/expansion' },
  { label: 'IA & stratégie', href: '/services/ai-strategy' },
]

export const serviceRelationshipNodes = [
  { label: 'Catalogue', value: 'Operational source' },
  { label: 'Variations', value: 'Offers & packages' },
  { label: 'Pricing', value: 'Rules & simulation' },
  { label: 'Sales', value: 'Terminal connected' },
  { label: 'Contracts', value: 'Partial mapping' },
  { label: 'Missions', value: 'Service code inherited' },
  { label: 'CareLink', value: 'Semantic checklists' },
  { label: 'Capacity', value: 'Configured layer' },
  { label: 'Market', value: 'Internal intelligence' },
]

export const qualityIcons = {
  verified: <CheckCircle2 size={14} />,
  warning: <TriangleAlert size={14} />,
  readiness: <Gauge size={14} />,
  architecture: <Layers3 size={14} />,
  people: <UsersRound size={14} />,
  configuration: <FileCog size={14} />,
}

export { styles }
