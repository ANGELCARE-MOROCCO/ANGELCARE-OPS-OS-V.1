'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  FileSearch,
  Gauge,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react'
import type { ChangeEvent, MouseEvent, ReactNode } from 'react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import type { Wave1Decision, Wave1ExecutiveData, Wave1Lens, Wave1Signal, Wave1Tone } from './Wave1ExecutiveTypes'
import styles from './Wave1ExecutiveExperience.module.css'

export function Wave1Hero({
  domain,
  eyebrow,
  title,
  accent,
  subtitle,
  data,
  primary,
  secondary,
}: {
  domain: string
  eyebrow: string
  title: string
  accent: string
  subtitle: string
  data: Wave1ExecutiveData
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.heroTopline}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={styles.liveChip} data-state={data.sourceHealth.state}><span className={styles.liveDot} />{data.sourceHealth.state === 'complete' ? 'Intelligence déterministe · sources vérifiées' : data.sourceHealth.state === 'partial' ? `Lecture partielle · ${data.sourceHealth.availableSources}/${data.sourceHealth.totalSources} sources` : 'Sources exécutives indisponibles'}</span>
        </div>
        <h1 className={styles.heroTitle}>{title} <span className={styles.heroTitleAccent}>{accent}</span></h1>
        <p className={styles.heroSubtitle}>{subtitle}</p>
        <div className={styles.heroActions}>
          {primary ? <Link href={primary.href} className={styles.primaryButton}>{primary.label}<ArrowRight size={14} /></Link> : null}
          {secondary ? <Link href={secondary.href} className={styles.secondaryButton}>{secondary.label}<FileSearch size={14} /></Link> : null}
        </div>
      </div>
      <aside className={styles.heroSituation}>
        <div>
          <div className={styles.situationLabel}>Narration exécutive actuelle</div>
          <h2 className={styles.situationHeadline}>{data.narrative.headline}</h2>
          <p className={styles.situationBody}>{data.narrative.body}</p>
        </div>
        <div className={styles.evidenceLinks}>
          {data.narrative.evidence.map((item) => <Link key={item.href} className={styles.evidenceLink} href={item.href}>{item.label}<ChevronRight size={11} /></Link>)}
        </div>
        {data.sourceHealth.failures.length ? <div className={styles.sourceWarning}><CircleAlert size={14} /><span><strong>Données partielles.</strong> {data.sourceHealth.failures.map((source) => source.key).join(', ')} indisponible(s). Les zéros dépendants ne doivent pas être interprétés comme une absence de risque.</span></div> : null}
        <div className={styles.generatedAt}>
          <span>Période · {data.periodLabel}</span>
          <span>Actualisé {new Date(data.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </aside>
    </section>
  )
}

export function ExecutiveRibbon({ signals }: { signals: Wave1Signal[] }) {
  return (
    <nav className={styles.ribbon} aria-label="Ruban d’intelligence exécutive">
      {signals.map((signal) => (
        <Link key={signal.id} href={signal.href || '#'} className={styles.ribbonItem} data-tone={signal.tone}>
          <span className={styles.ribbonLabel}>{signal.label}</span>
          <span className={styles.ribbonValue}>{signal.value}</span>
          <span className={styles.ribbonDetail}>{signal.detail}</span>
        </Link>
      ))}
    </nav>
  )
}

export function SectionHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionCopy}>
        <div className={styles.sectionEyebrow}>{eyebrow}</div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
      {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
    </div>
  )
}

export function MetricCard({ label, value, detail, href, icon = 'target' }: { label: string; value: string; detail: string; href: string; icon?: 'target' | 'money' | 'users' | 'risk' | 'calendar' | 'gauge' }) {
  const Icon = icon === 'money' ? CircleDollarSign : icon === 'users' ? Users : icon === 'risk' ? ShieldAlert : icon === 'calendar' ? CalendarClock : icon === 'gauge' ? Gauge : Target
  return (
    <Link href={href} className={styles.metric}>
      <div className={styles.metricTop}><span className={styles.metricLabel}>{label}</span><span className={styles.metricIcon}><Icon size={17} /></span></div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricDetail}>{detail}</div>
    </Link>
  )
}

export function LensSwitcher({ value, onChange, options }: { value: Wave1Lens; onChange: (value: Wave1Lens) => void; options: Array<{ value: Wave1Lens; label: string }> }) {
  return (
    <div className={styles.lensBar} role="tablist" aria-label="Lentilles de management">
      {options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} className={`${styles.lensButton} ${value === option.value ? styles.lensButtonActive : ''}`} onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>
  )
}

export function SearchControl({ value, onChange, count, placeholder }: { value: string; onChange: (value: string) => void; count: number; placeholder: string }) {
  return (
    <label className={styles.searchBar}>
      <Search size={15} color="#64748b" />
      <input className={styles.searchInput} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} placeholder={placeholder} />
      <span className={styles.searchCount}>{count} résultat(s)</span>
    </label>
  )
}

export function EmptyExecutiveState({ title, text }: { title: string; text: string }) {
  return <div className={styles.emptyState}><div><div className={styles.emptyIcon}><CheckCircle2 size={24} /></div><div className={styles.emptyTitle}>{title}</div><p className={styles.emptyText}>{text}</p></div></div>
}

export function ExecutiveDrawer({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  stats,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  subtitle: string
  stats: Array<{ label: string; value: string }>
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])
  if (!open) return null
  return (
    <OperatorOverlayPortal>
      <div className={styles.drawerOverlay} role="presentation" onMouseDown={onClose}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <div><div className={styles.drawerEyebrow}>{eyebrow}</div><h2 className={styles.drawerTitle}>{title}</h2><p className={styles.drawerSubtitle}>{subtitle}</p></div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>
        <div className={styles.drawerRibbon}>{stats.slice(0, 4).map((stat) => <div key={stat.label} className={styles.drawerStat}><div className={styles.drawerStatLabel}>{stat.label}</div><div className={styles.drawerStatValue}>{stat.value}</div></div>)}</div>
        <div className={styles.drawerBody}>{children}</div>
        <footer className={styles.drawerFooter}>{footer || <button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button>}</footer>
      </aside>
      </div>
    </OperatorOverlayPortal>
  )
}

export function EvidenceDrawer({
  open,
  onClose,
  eyebrow,
  title,
  value,
  explanation,
  source,
  href,
}: {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  value: string
  explanation: string
  source: string
  href: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])
  if (!open) return null
  return (
    <OperatorOverlayPortal>
      <div className={styles.evidenceOverlay} role="presentation" onMouseDown={onClose}>
      <aside className={styles.evidenceDrawer} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <div><div className={styles.drawerEyebrow}>{eyebrow}</div><h3 className={styles.evidenceTitle}>{title}</h3><p className={styles.drawerSubtitle}>Deuxième niveau d’investigation · contexte principal conservé</p></div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Revenir au dossier"><X size={18} /></button>
        </header>
        <div className={styles.evidenceValueBand}><span>Valeur observée</span><strong>{value}</strong></div>
        <div className={styles.evidenceBody}>
          <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Explication déterministe</span></div><div className={styles.drawerSectionText}>{explanation}</div></section>
          <section className={styles.drawerSection}><div className={styles.drawerSectionTitle}><span>Registre source</span><span className={styles.categoryChip}>{source}</span></div><div className={styles.drawerSectionText}>Cette lecture est reliée au registre opérationnel existant. Ouvrez-le pour contrôler la preuve détaillée, les permissions et les actions métier.</div></section>
        </div>
        <footer className={styles.drawerFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Retour au dossier</button><Link href={href} className={styles.primaryButton}>Ouvrir la preuve complète<ArrowRight size={13} /></Link></footer>
      </aside>
      </div>
    </OperatorOverlayPortal>
  )
}

export function DecisionChamber({ decision, open, onClose }: { decision: Wave1Decision | null; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])
  if (!open || !decision) return null
  return (
    <OperatorOverlayPortal>
      <div className={styles.chamberOverlay} role="presentation" onMouseDown={onClose}>
      <section className={styles.chamber} role="dialog" aria-modal="true" aria-label={decision.title} onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
        <header className={styles.chamberHeader}>
          <div><div className={styles.drawerEyebrow}>Chambre de décision · {decision.authority}</div><h2 className={styles.chamberTitle}>{decision.title}</h2><p className={styles.drawerSubtitle}>{decision.customerName} · {decision.entityLabel}</p></div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>
        <div className={styles.chamberBody}>
          <div className={styles.chamberMain}>
            <ChamberSection label="Situation" text={decision.situation} />
            <ChamberSection label="Recommandation déterministe" text={decision.recommendation} />
            <ChamberSection label="Alternative" text={decision.alternative} />
            <ChamberSection label="Risque de non-action" text={decision.riskOfNoAction} />
          </div>
          <aside className={styles.chamberSide}>
            <div className={styles.chamberSection}><div className={styles.chamberSectionLabel}>Impact financier exposé</div><div className={styles.chamberImpactValue}>{formatDh(decision.financialImpactDh)}</div><div className={styles.chamberSectionText}>{decision.operationalImpact}</div></div>
            <div className={styles.chamberSection}><div className={styles.chamberSectionLabel}>Responsabilité</div><div className={styles.chamberSectionText}>Propriétaire · {decision.owner}<br />Autorité · {decision.authority}<br />Échéance · {decision.deadline ? new Date(decision.deadline).toLocaleDateString('fr-FR') : 'À fixer'}</div></div>
            <div className={styles.chamberSection}><div className={styles.chamberSectionLabel}>Preuves liées</div>{decision.evidence.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} className={styles.drawerEvidenceLink}><strong>{item.label}</strong><span>{item.value}</span></Link>)}</div>
          </aside>
        </div>
        <footer className={styles.chamberFooter}>
          <div className={styles.chamberNotice}>Cette chambre expose les conséquences et les preuves. La mutation finale reste exécutée dans l’espace opérationnel existant afin de préserver les contrôles métier, permissions et journaux d’audit.</div>
          <div className={styles.chamberActions}><button type="button" className={styles.chamberButton} onClick={onClose}>Revenir</button><Link href={decision.executionHref} className={`${styles.chamberButton} ${styles.chamberButtonPrimary}`}>Ouvrir l’exécution<ArrowRight size={13} /></Link></div>
        </footer>
      </section>
      </div>
    </OperatorOverlayPortal>
  )
}

export function useFiltered<T>(items: T[], query: string, selector: (item: T) => string) {
  return useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return items
    return items.filter((item) => normalize(selector(item)).includes(normalized))
  }, [items, query, selector])
}

export function toneIcon(tone: Wave1Tone) {
  return tone === 'critical' ? <CircleAlert size={17} /> : tone === 'warning' ? <ShieldAlert size={17} /> : tone === 'success' ? <CheckCircle2 size={17} /> : <Sparkles size={17} />
}

function ChamberSection({ label, text }: { label: string; text: string }) {
  return <div className={styles.chamberSection}><div className={styles.chamberSectionLabel}>{label}</div><div className={styles.chamberSectionText}>{text}</div></div>
}
function formatDh(value: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} Dh` }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }
