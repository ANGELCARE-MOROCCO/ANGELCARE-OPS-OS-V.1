import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Library,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SanilaCommandCenterSnapshot, SanilaMetric } from '@/lib/angelcare360/server/command-center-experience'
import styles from './TenantExecutiveCommandCenter.module.css'

type Props = {
  snapshot: SanilaCommandCenterSnapshot
  viewerName?: string | null
}

function metricValue(metric: SanilaMetric, options?: { suffix?: string }) {
  if (metric.value == null) return '—'
  return `${new Intl.NumberFormat('fr-FR').format(metric.value)}${options?.suffix || ''}`
}

function stateLabel(metric: SanilaMetric) {
  if (metric.state === 'synced') return 'Synchronisé'
  if (metric.state === 'partial') return 'Partiel'
  if (metric.state === 'restricted') return 'Accès restreint'
  return 'Source indisponible'
}

function LineChart({ points, secondary = false }: { points: Array<{ label: string; primary: number; secondary?: number }>; secondary?: boolean }) {
  const width = 620
  const height = 155
  const values = points.flatMap((point) => secondary ? [point.primary, point.secondary || 0] : [point.primary])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const makePath = (key: 'primary' | 'secondary') => points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : 8 + (index / Math.max(points.length - 1, 1)) * (width - 16)
    const raw = key === 'primary' ? point.primary : point.secondary || 0
    const y = height - 12 - ((raw - min) / range) * (height - 28)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
  return <div className={styles.lineChart}><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><path className={styles.gridLine} d={`M 0 ${height * .25} H ${width} M 0 ${height * .5} H ${width} M 0 ${height * .75} H ${width}`}/><path className={styles.linePrimary} d={makePath('primary')}/>{secondary ? <path className={styles.lineSecondary} d={makePath('secondary')}/> : null}</svg><div className={styles.axisLabels}>{points.map((point) => <span key={point.label}>{point.label}</span>)}</div></div>
}

function Kpi({ icon: Icon, label, metric, note, href, tone = 'blue' }: { icon: LucideIcon; label: string; metric: SanilaMetric; note: string; href: string; tone?: string }) {
  return <Link href={href} className={`${styles.kpi} ${styles[`tone_${tone}`] || ''}`}><div className={styles.kpiHeader}><span><Icon size={18}/></span><small className={`${styles.syncState} ${metric.state !== 'synced' ? styles.syncWarning : ''}`}>{stateLabel(metric)}</small></div><strong>{metricValue(metric)}</strong><h3>{label}</h3><p>{metric.state === 'unavailable' ? 'La source n’a pas répondu. SANILA n’affiche pas de valeur artificielle.' : metric.state === 'restricted' ? 'Cet indicateur suit les droits associés à votre rôle.' : note}</p><div className={styles.kpiLink}>Ouvrir <ChevronRight size={14}/></div></Link>
}

function DomainRestricted({ title, detail }: { title: string; detail: string }) {
  return <div className={styles.restrictedPanel}><ShieldCheck size={21}/><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export default function TenantExecutiveCommandCenter({ snapshot, viewerName }: Props) {
  const attendanceRate = snapshot.metrics.attendanceToday.value
    ? Math.round((((snapshot.metrics.attendanceToday.value || 0) - (snapshot.metrics.absencesToday.value || 0)) / Math.max(snapshot.metrics.attendanceToday.value || 1, 1)) * 1000) / 10
    : null
  const displayName = viewerName?.trim().split(' ')[0] || 'Direction'
  const stateCopy = snapshot.sourceState === 'synced'
    ? 'Les indicateurs autorisés pour votre rôle ont répondu correctement.'
    : snapshot.sourceState === 'partial'
      ? 'Certaines sources autorisées ne répondent pas. Les zones concernées sont signalées, sans valeur inventée.'
      : snapshot.sourceState === 'restricted'
        ? 'Le cockpit adapte chaque indicateur aux droits associés à votre rôle.'
        : 'Les principales sources sont momentanément indisponibles. Les accès opérationnels restent disponibles.'

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}><div className={styles.contextPills}><span><Building2 size={13}/>{snapshot.school.name}</span><span><CalendarDays size={13}/>{snapshot.school.academicYearLabel || 'Année scolaire active'}</span><span><Clock3 size={13}/>{snapshot.businessTimeLabel}</span></div><div className={`${styles.sourcePill} ${styles[`source_${snapshot.sourceState}`]}`}><span/>{snapshot.sourceState === 'synced' ? 'Données synchronisées' : snapshot.sourceState === 'partial' ? 'Synchronisation partielle' : snapshot.sourceState === 'restricted' ? 'Vue adaptée à vos droits' : 'Sources indisponibles'}</div></div>
        <div className={styles.heroMain}><div><div className={styles.eyebrow}><Sparkles size={15}/> SANILA EXECUTIVE COMMAND CENTER</div><h1>Bonjour {displayName}.<br/><span>Voici la situation de votre établissement.</span></h1><p>{stateCopy}</p></div><div className={styles.heroActions}><Link href="/angelcare-360-command-center/direction"><BarChart3 size={17}/>Ouvrir le cockpit de Direction</Link><Link href="/angelcare-360-command-center/notifications"><AlertCircle size={17}/>Centre d’alertes</Link></div></div>
      </section>

      <section className={styles.kpiGrid} aria-label="Indicateurs exécutifs">
        <Kpi icon={Users} label="Élèves actifs" metric={snapshot.metrics.students} note="Population scolaire active dans votre établissement." href="/angelcare-360-command-center/personnes/eleves" tone="navy"/>
        <Kpi icon={ClipboardCheck} label="Présences aujourd’hui" metric={snapshot.metrics.attendanceToday} note={attendanceRate == null ? 'Aucune présence exploitable aujourd’hui.' : `${attendanceRate}% de présence / arrivée enregistrée.`} href="/angelcare-360-command-center/presences/jour" tone="green"/>
        <Kpi icon={WalletCards} label="Factures actives" metric={snapshot.metrics.invoices} note={`${metricValue(snapshot.metrics.overdueInvoices)} échue(s) · ${metricValue(snapshot.metrics.partialInvoices)} partielle(s).`} href="/angelcare-360-command-center/finance" tone="gold"/>
        <Kpi icon={BriefcaseBusiness} label="Personnel actif" metric={snapshot.metrics.staff} note={`${metricValue(snapshot.metrics.teachers)} enseignant(s) dans l’effectif actif.`} href="/angelcare-360-command-center/personnes/personnel" tone="violet"/>
        <Kpi icon={Bus} label="Circuits transport" metric={snapshot.metrics.transportRoutes} note="Circuits actifs résolus dans le périmètre de l’établissement." href="/angelcare-360-command-center/transport" tone="blue"/>
        <Kpi icon={ShieldCheck} label="Qualité à traiter" metric={snapshot.metrics.complaints} note="Réclamations ou dossiers qualité encore ouverts." href="/angelcare-360-command-center/reclamations" tone="orange"/>
      </section>

      <section className={styles.mainGrid}>
        <article className={`${styles.panel} ${styles.attendancePanel}`}>
          <div className={styles.panelHeader}><div><span>VIE QUOTIDIENNE</span><h2>Présence sur 7 jours</h2></div><Link href="/angelcare-360-command-center/presences">Voir les présences<ArrowRight size={15}/></Link></div>
          {snapshot.domainStates.attendance === 'restricted'
            ? <DomainRestricted title="Présences protégées" detail="Votre rôle ne permet pas d’afficher la synthèse des présences depuis ce cockpit."/>
            : <><div className={styles.attendanceHeadline}><strong>{attendanceRate == null ? '—' : `${attendanceRate}%`}</strong><div><span>Taux d’arrivée aujourd’hui</span><small>{metricValue(snapshot.metrics.absencesToday)} absence(s) · {metricValue(snapshot.metrics.latesToday)} retard(s)</small></div></div><LineChart points={snapshot.attendanceTrend}/></>}
        </article>

        <article className={`${styles.panel} ${styles.actionPanel}`}>
          <div className={styles.panelHeader}><div><span>ACTION CENTER</span><h2>À traiter maintenant</h2></div><CheckCircle2 size={19}/></div>
          <div className={styles.actionList}>{snapshot.actions.map((action) => <Link href={action.href} key={action.id} className={`${styles.actionItem} ${styles[`action_${action.tone}`]}`}><div className={styles.actionSignal}/><div><strong>{action.label}</strong><p>{action.detail}</p></div><ChevronRight size={16}/></Link>)}</div>
          <Link className={styles.actionFooter} href="/angelcare-360-command-center/direction">Consolider dans le cockpit<ArrowRight size={15}/></Link>
        </article>
      </section>

      <section className={styles.analyticsGrid}>
        <article className={`${styles.panel} ${styles.financePanel}`}>
          <div className={styles.panelHeader}><div><span>FINANCE · 6 MOIS</span><h2>Facturation & encaissement</h2></div><CircleDollarSign size={20}/></div>
          {snapshot.domainStates.finance === 'restricted'
            ? <DomainRestricted title="Finance protégée" detail="Les indicateurs financiers sensibles restent réservés aux rôles autorisés."/>
            : <><div className={styles.chartLegend}><span><i/>Facturé</span><span><b/>Encaissé</span></div><LineChart points={snapshot.financeTrend.map((point) => ({ label: point.label, primary: point.primary, secondary: point.secondary }))} secondary/><div className={styles.financeStats}><div><small>Factures échues</small><strong>{metricValue(snapshot.metrics.overdueInvoices)}</strong></div><div><small>Paiements enregistrés</small><strong>{metricValue(snapshot.metrics.payments)}</strong></div><div><small>Factures partielles</small><strong>{metricValue(snapshot.metrics.partialInvoices)}</strong></div></div><Link className={styles.panelLink} href="/angelcare-360-command-center/finance">Piloter la finance<ArrowRight size={15}/></Link></>}
        </article>

        <article className={`${styles.panel} ${styles.admissionsPanel}`}>
          <div className={styles.panelHeader}><div><span>ADMISSIONS</span><h2>Pipeline d’inscription</h2></div><UserRoundCheck size={20}/></div>
          {snapshot.domainStates.admissions === 'restricted'
            ? <DomainRestricted title="Admissions protégées" detail="Le pipeline d’inscription est masqué pour ce rôle."/>
            : <><div className={styles.funnel}>{snapshot.admissionsFunnel.map((point) => { const max = Math.max(...snapshot.admissionsFunnel.map((item) => item.primary), 1); return <div key={point.key}><div><span>{point.label}</span><strong>{point.primary}</strong></div><p><i style={{ width: `${Math.max(4, (point.primary / max) * 100)}%` }}/></p></div> })}</div><Link className={styles.panelLink} href="/angelcare-360-command-center/admissions">Ouvrir les admissions<ArrowRight size={15}/></Link></>}
        </article>
      </section>

      <section className={styles.operationsGrid}>
        {[
          { icon: GraduationCap, label: 'Académique', value: metricValue(snapshot.metrics.assignments), detail: 'devoirs structurés', second: `${metricValue(snapshot.metrics.exams)} évaluations`, href: '/angelcare-360-command-center/academique', state: snapshot.domainStates.academic },
          { icon: CircleDollarSign, label: 'Paie', value: metricValue(snapshot.metrics.payrollRecords), detail: 'dossiers de paie', second: `${metricValue(snapshot.metrics.staff)} collaborateurs`, href: '/angelcare-360-command-center/paie', state: snapshot.domainStates.payroll },
          { icon: Library, label: 'Bibliothèque', value: metricValue(snapshot.metrics.libraryLoans), detail: 'prêts dans l’historique', second: 'circulation & retards', href: '/angelcare-360-command-center/bibliotheque', state: snapshot.domainStates.library },
          { icon: Boxes, label: 'Inventaire', value: metricValue(snapshot.metrics.inventoryMovements), detail: 'mouvements enregistrés', second: 'stock & responsabilités', href: '/angelcare-360-command-center/inventaire', state: snapshot.domainStates.inventory },
          { icon: CalendarDays, label: 'Calendrier', value: metricValue(snapshot.metrics.calendarEvents), detail: 'événements structurés', second: 'échéances & rendez-vous', href: '/angelcare-360-command-center/administration/calendrier', state: 'synced' as const },
          { icon: MessageSquareText, label: 'Qualité', value: metricValue(snapshot.metrics.complaints), detail: 'sujets qualité ouverts', second: 'engagement & suivi', href: '/angelcare-360-command-center/reclamations', state: snapshot.domainStates.quality },
        ].map((item) => { const Icon = item.icon; const restricted = item.state === 'restricted'; return <Link className={`${styles.operationCard} ${restricted ? styles.operationRestricted : ''}`} href={item.href} key={item.label}><div><Icon size={19}/><span>{item.label}</span></div><strong>{restricted ? '—' : item.value}</strong><p>{restricted ? 'Accès selon votre rôle' : item.detail}</p><small>{restricted ? 'Données protégées' : item.second}</small><ArrowRight size={15}/></Link> })}
      </section>

      {snapshot.sourceWarnings.length ? <section className={styles.syncNotice}><AlertCircle size={19}/><div><strong>Synchronisation partielle détectée</strong><p>SANILA n’a pas remplacé les sources indisponibles par des zéros. Les modules restent accessibles pendant le diagnostic.</p><details><summary>Voir les sources concernées</summary><ul>{snapshot.sourceWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details></div></section> : null}

      <section className={styles.quickGrid}>
        <Link href="/angelcare-360-command-center/academique"><GraduationCap/><span><strong>Gestion académique</strong><small>Emploi du temps, devoirs, examens, notes</small></span><ArrowRight/></Link>
        <Link href="/angelcare-360-command-center/finance"><WalletCards/><span><strong>Finance scolaire</strong><small>Facturation, encaissements, recouvrement</small></span><ArrowRight/></Link>
        <Link href="/angelcare-360-command-center/transport"><Bus/><span><strong>Transport & sécurité</strong><small>Circuits, véhicules, exécution</small></span><ArrowRight/></Link>
        <Link href="/angelcare-360-command-center/rapports"><TrendingUp/><span><strong>Intelligence & documents</strong><small>Rapports, documents, conformité</small></span><ArrowRight/></Link>
      </section>
    </div>
  )
}
