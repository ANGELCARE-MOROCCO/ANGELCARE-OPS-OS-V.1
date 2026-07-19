'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  GraduationCap,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Send,
  UserRoundPlus,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import type {
  AcademicAlertItem,
  AcademicChecklistItem,
  AcademicDeadlineItem,
  AcademicMilestoneItem,
  AcademicTermRecord,
  AcademicYearRecord,
  Angelcare360AcademicYearsOverviewData
} from '@/lib/angelcare360/server/academic-years-overview'
import Angelcare360EntityDrawer from '@/components/angelcare360/administration/Angelcare360EntityDrawer'

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate'
type DrawerKind = 'year-create' | 'year-edit' | 'term-create' | 'term-edit' | null
type EventKind = 'enrollment' | 'closure' | null

type Props = {
  data: Angelcare360AcademicYearsOverviewData
  schoolId: string
  schoolName: string
  yearConfig: Angelcare360AdminEntityConfig
  termConfig: Angelcare360AdminEntityConfig
  canCreateYear: boolean
  canUpdateYear: boolean
  canManageTerms: boolean
  canCreateCalendar: boolean
  canUpdateCalendar: boolean
}

type EventFormState = {
  title: string
  description: string
  startsOn: string
  endsOn: string
  audience: string
  status: 'planned' | 'published'
}

function initialEventForm(kind: EventKind): EventFormState {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)
  if (kind === 'enrollment') end.setDate(end.getDate() + 30)
  if (kind === 'closure') {
    start.setDate(start.getDate() + 14)
    end.setDate(start.getDate())
  }
  return {
    title: kind === 'enrollment' ? 'Fenêtre d’inscription' : 'Clôture de période',
    description: '',
    startsOn: start.toISOString().slice(0, 10),
    endsOn: end.toISOString().slice(0, 10),
    audience: kind === 'enrollment' ? 'parents' : 'staff',
    status: kind === 'enrollment' ? 'published' : 'planned',
  }
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Date à définir'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', options || { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatRange(startsOn: string, endsOn: string) {
  return `${formatDate(startsOn, { day: '2-digit', month: 'short' })} – ${formatDate(endsOn, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function durationLabel(startsOn: string, endsOn: string) {
  const start = new Date(`${startsOn}T12:00:00`)
  const end = new Date(`${endsOn}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Durée à vérifier'
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  if (days < 14) return `${days} jour${days > 1 ? 's' : ''}`
  const weeks = Math.max(1, Math.round(days / 7))
  return `${weeks} semaine${weeks > 1 ? 's' : ''}`
}

function statusLabel(status: string) {
  if (status === 'active') return 'En cours'
  if (status === 'closed') return 'Terminée'
  if (status === 'archived') return 'Archivée'
  return 'À venir'
}

function statusTone(status: string): Tone {
  if (status === 'active') return 'green'
  if (status === 'closed') return 'slate'
  if (status === 'archived') return 'red'
  return 'blue'
}

function toneColor(tone: Tone) {
  return {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#7c3aed',
    slate: '#64748b',
  }[tone]
}

function toneSoft(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' },
    green: { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' },
    orange: { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' },
    red: { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' },
    purple: { background: '#faf5ff', color: '#7c3aed', borderColor: '#e9d5ff' },
    slate: { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' },
  }[tone]
}

function yearRow(year: AcademicYearRecord) {
  return {
    id: year.id,
    school_id: year.schoolId,
    year_code: year.yearCode,
    label: year.label,
    starts_on: year.startsOn,
    ends_on: year.endsOn,
    is_current: year.isCurrent,
    status: year.status,
  }
}

function termRow(term: AcademicTermRecord) {
  return {
    id: term.id,
    school_id: term.schoolId,
    academic_year_id: term.academicYearId,
    term_code: term.termCode,
    label: term.label,
    term_type: term.termType || 'trimestre',
    starts_on: term.startsOn,
    ends_on: term.endsOn,
    order_index: term.orderIndex,
    status: term.status,
  }
}

export default function Angelcare360AcademicYearsOverview({
  data,
  schoolId,
  schoolName,
  yearConfig,
  termConfig,
  canCreateYear,
  canUpdateYear,
  canManageTerms,
  canCreateCalendar,
  canUpdateCalendar,
}: Props) {
  const router = useRouter()
  const [drawerKind, setDrawerKind] = useState<DrawerKind>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown>>({})
  const [eventKind, setEventKind] = useState<EventKind>(null)
  const [eventForm, setEventForm] = useState<EventFormState>(() => initialEventForm(null))
  const [moreOpen, setMoreOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeYear = data.activeYear
  const drawerConfig = drawerKind?.startsWith('year') ? yearConfig : termConfig
  const drawerMode = drawerKind?.endsWith('edit') ? 'edit' : 'create'
  const canOpenDrawer = drawerKind?.startsWith('year') ? (drawerMode === 'create' ? canCreateYear : canUpdateYear) : canManageTerms
  const unpublishedCount = data.calendar.unpublishedEvents.length

  const openYearDrawer = (year?: AcademicYearRecord) => {
    if (year && !canUpdateYear) return
    if (!year && !canCreateYear) return
    setSelectedRecord(year ? yearRow(year) : {})
    setDrawerKind(year ? 'year-edit' : 'year-create')
  }

  const openTermDrawer = (term?: AcademicTermRecord) => {
    if (!canManageTerms || !activeYear) return
    setSelectedRecord(term ? termRow(term) : {})
    setDrawerKind(term ? 'term-edit' : 'term-create')
  }

  const openEventModal = (kind: Exclude<EventKind, null>) => {
    if (!canCreateCalendar || !activeYear) return
    setEventKind(kind)
    setEventForm(initialEventForm(kind))
  }

  const callAdministration = (entity: string, operation: string, payload: Record<string, unknown>, id?: string) => {
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/administration', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ entity, operation, id, payload }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) throw new Error(result?.error || 'L’action administrative a échoué.')
        setFeedback('Action exécutée avec succès.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const activateYear = (year: AcademicYearRecord) => {
    if (!canUpdateYear || year.isCurrent) return
    callAdministration('annees-scolaires', 'activate', { school_id: schoolId, id: year.id }, year.id)
  }

  const submitEvent = () => {
    if (!eventKind || !activeYear || !canCreateCalendar) return
    startTransition(async () => {
      setFeedback(null)
      try {
        const prefix = eventKind === 'enrollment' ? 'INSCRIPTIONS' : 'CLOTURE'
        const eventCode = `${prefix}-${eventForm.startsOn.replaceAll('-', '')}-${Date.now().toString().slice(-5)}`
        const response = await fetch('/api/angelcare360/timetable', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'calendar-event',
            operation: 'create',
            payload: {
              schoolId,
              academicYearId: activeYear.id,
              eventCode,
              title: eventForm.title,
              description: eventForm.description || null,
              eventType: eventKind === 'enrollment' ? 'inscription' : 'clôture',
              startsOn: eventForm.startsOn,
              endsOn: eventForm.endsOn,
              allDay: true,
              audience: eventForm.audience,
              status: eventForm.status,
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) throw new Error(result?.error || 'La création du jalon a échoué.')
        setEventKind(null)
        setFeedback(result.warning || 'Jalon institutionnel enregistré.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const publishCalendar = () => {
    if (!canUpdateCalendar || !activeYear || !data.calendar.unpublishedEvents.length) {
      setFeedback(data.calendar.unpublishedEvents.length ? 'La publication est verrouillée pour votre rôle.' : 'Aucun évènement planifié à publier.')
      return
    }
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/academic-years', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            operation: 'publish-calendar',
            schoolId,
            academicYearId: activeYear.id,
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) throw new Error(result?.error || 'La publication du calendrier a échoué.')
        setFeedback(result.warning || result.message || 'Calendrier publié avec succès.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'La publication du calendrier a échoué.')
      }
    })
  }

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <h1 style={pageTitleStyle}>Années scolaires & périodes</h1>
          <p style={pageSubtitleStyle}>Calendrier institutionnel, périodes académiques et jalons administratifs.</p>
          <div style={contextRowStyle}>
            <span style={contextPillStyle}>{schoolName}</span>
            <span style={contextPillStyle}>{activeYear?.label || 'Année active à définir'}</span>
            {data.queryWarnings.length ? <span style={{ ...contextPillStyle, ...toneSoft('orange') }}>Sources partielles</span> : null}
          </div>
        </div>
        <span style={datePillStyle}><CalendarDays size={15} /> {formatDate(new Date().toISOString().slice(0, 10), { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </section>

      <nav style={tabsStyle} aria-label="Navigation années scolaires">
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/annees-scolaires'],
          ['Années', '#annees'],
          ['Trimestres', '#periodes'],
          ['Calendrier', '/angelcare-360-command-center/emploi-du-temps/calendrier'],
          ['Échéances', '#echeances'],
          ['Clôtures', '#checklist'],
        ].map(([label, href], index) => <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : {}) }}>{label}</Link>)}
      </nav>

      <section style={kpiGridStyle}>
        <KpiCard icon={CalendarRange} label="Année active" value={activeYear?.label || 'À définir'} note={activeYear ? statusLabel(activeYear.status) : 'Configuration requise'} tone={activeYear ? 'green' : 'orange'} />
        <KpiCard icon={BookOpenCheck} label="Périodes ouvertes" value={String(data.kpis.openPeriods)} note={`Sur ${data.terms.length} période(s)`} tone="blue" />
        <KpiCard icon={Clock3} label="Échéances cette semaine" value={String(data.kpis.deadlinesThisWeek)} note="Dans les 7 prochains jours" tone={data.kpis.deadlinesThisWeek ? 'orange' : 'green'} />
        <KpiCard icon={LockKeyhole} label="Clôtures planifiées" value={String(data.kpis.plannedClosures)} note="Dans les 30 prochains jours" tone={data.kpis.plannedClosures ? 'red' : 'green'} />
        <KpiCard icon={UsersRound} label="Fenêtres d’inscription" value={String(data.kpis.openEnrollmentWindows)} note={data.kpis.openEnrollmentWindows ? 'Ouverte actuellement' : 'Aucune fenêtre ouverte'} tone={data.kpis.openEnrollmentWindows ? 'purple' : 'slate'} />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={() => openYearDrawer()} disabled={!canCreateYear} style={canCreateYear ? primaryButtonStyle : disabledButtonStyle}><Plus size={16} /> Créer année</button>
        <button type="button" onClick={() => openTermDrawer()} disabled={!canManageTerms || !activeYear} style={canManageTerms && activeYear ? secondaryButtonStyle : disabledButtonStyle}><Plus size={16} /> Ajouter période</button>
        <button type="button" onClick={() => openEventModal('enrollment')} disabled={!canCreateCalendar || !activeYear} style={canCreateCalendar && activeYear ? secondaryButtonStyle : disabledButtonStyle}><UserRoundPlus size={16} /> Ouvrir inscriptions</button>
        <button type="button" onClick={() => openEventModal('closure')} disabled={!canCreateCalendar || !activeYear} style={canCreateCalendar && activeYear ? secondaryButtonStyle : disabledButtonStyle}><CalendarDays size={16} /> Planifier clôture</button>
        <button type="button" onClick={publishCalendar} disabled={!canUpdateCalendar || !activeYear || !unpublishedCount} style={canUpdateCalendar && activeYear && unpublishedCount ? secondaryButtonStyle : disabledButtonStyle}><Send size={16} /> Publier calendrier {unpublishedCount ? `(${unpublishedCount})` : ''}</button>
        <div style={moreWrapStyle}>
          <button type="button" onClick={() => setMoreOpen((value) => !value)} style={moreButtonStyle}>Plus d’actions <ChevronDown size={15} /></button>
          {moreOpen ? (
            <div style={moreMenuStyle}>
              <Link href="/angelcare-360-command-center/administration/annees-scolaires" style={menuLinkStyle}>Gérer toutes les années</Link>
              <Link href="/angelcare-360-command-center/administration/periodes" style={menuLinkStyle}>Gérer toutes les périodes</Link>
              <Link href="/angelcare-360-command-center/emploi-du-temps/calendrier" style={menuLinkStyle}>Ouvrir le calendrier complet</Link>
            </div>
          ) : null}
        </div>
      </section>

      {feedback ? <div style={feedbackStyle}>{isPending ? 'Traitement en cours — ' : ''}{feedback}</div> : null}

      {!activeYear ? (
        <section style={activationStyle}>
          <div style={activationIconStyle}><GraduationCap size={28} /></div>
          <div>
            <div style={eyebrowStyle}>Activation du cycle académique</div>
            <h2 style={activationTitleStyle}>Créez puis activez une année scolaire pour alimenter le cockpit.</h2>
            <p style={activationTextStyle}>Les périodes, échéances, inscriptions, clôtures et contrôles resteront volontairement vides jusqu’à la création d’un cycle réel.</p>
          </div>
          <button type="button" onClick={() => openYearDrawer()} disabled={!canCreateYear} style={canCreateYear ? primaryButtonStyle : disabledButtonStyle}>Créer la première année</button>
        </section>
      ) : null}

      <section style={cockpitGridStyle}>
        <article id="annees" style={timelinePanelStyle}>
          <PanelHeader eyebrow={`Timeline de l’année scolaire ${activeYear?.label || ''}`} title="Cycle institutionnel" href="/angelcare-360-command-center/administration/annees-scolaires" />
          {data.timeline.length ? <Timeline items={data.timeline} /> : <EmptyState title="Aucune période configurée" detail="Ajoutez les trimestres, semestres ou périodes personnalisées de l’année active." actionLabel="Ajouter une période" onAction={activeYear && canManageTerms ? () => openTermDrawer() : undefined} />}
        </article>

        <article id="echeances" style={deadlinePanelStyle}>
          <PanelHeader eyebrow="Échéances clés cette semaine" title="7 prochains jours" href="/angelcare-360-command-center/emploi-du-temps/calendrier" />
          {data.deadlinesThisWeek.length ? <DeadlineList items={data.deadlinesThisWeek} /> : <EmptyState title="Aucune échéance critique" detail="Les évènements, examens et factures à venir apparaîtront ici." compact />}
        </article>

        <aside style={milestonePanelStyle}>
          <PanelHeader eyebrow="Prochains jalons" title="À venir" href="/angelcare-360-command-center/emploi-du-temps/calendrier" />
          {data.milestones.length ? <MilestoneList items={data.milestones} /> : <EmptyState title="Aucun jalon planifié" detail="Publiez les évènements institutionnels du calendrier." compact />}
        </aside>

        <article id="periodes" style={periodPanelStyle}>
          <PanelHeader eyebrow="Périodes / Trimestres" title={`${data.terms.length} période(s)`} href="/angelcare-360-command-center/administration/periodes" />
          {data.terms.length ? (
            <div style={tableWrapStyle}>
              <div style={tableHeaderStyle}><span>Période</span><span>Durée</span><span>Dates</span><span>Statut</span><span>Inscriptions</span><span>Actions</span></div>
              {data.terms.map((term) => (
                <div key={term.id} style={tableRowStyle}>
                  <span style={periodNameStyle}><span style={{ ...statusDotStyle, background: toneColor(statusTone(term.status)) }} /> <strong>{term.label}</strong><small>{term.termType || 'Période académique'}</small></span>
                  <span>{durationLabel(term.startsOn, term.endsOn)}</span>
                  <span>{formatRange(term.startsOn, term.endsOn)}</span>
                  <span style={{ ...statusBadgeStyle, ...toneSoft(statusTone(term.status)) }}>{statusLabel(term.status)}</span>
                  <span style={enrollmentCellStyle}>
                    {data.enrollment.capacity ? <><strong>{data.enrollment.activeCount} / {data.enrollment.capacity}</strong><small>{data.enrollment.occupancyRate === null ? '—' : `${data.enrollment.occupancyRate.toLocaleString('fr-FR')} %`}</small></> : <small>Capacité non configurée</small>}
                  </span>
                  <span><button type="button" onClick={() => openTermDrawer(term)} disabled={!canManageTerms} style={miniActionStyle}><MoreHorizontal size={16} /></button></span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Périodes à construire" detail="La timeline et les contrôles de clôture s’activeront dès la première période réelle." actionLabel="Ajouter une période" onAction={activeYear && canManageTerms ? () => openTermDrawer() : undefined} />}
        </article>

        <article id="checklist" style={checklistPanelStyle}>
          <PanelHeader eyebrow="Checklist opérationnelle" title={data.checklist.title} href="/angelcare-360-command-center/academique" />
          <ChecklistProgress label={data.checklist.subtitle} progress={data.checklist.progress} completed={data.checklist.completedItems} total={data.checklist.totalItems} />
          <div style={checklistListStyle}>{data.checklist.items.map((item) => <ChecklistRow key={item.id} item={item} />)}</div>
          <div style={reopeningStyle}>
            <div style={reopeningHeaderStyle}><strong>{data.checklist.reopeningTitle}</strong><span>{data.checklist.reopeningProgress === null ? '—' : `${data.checklist.reopeningProgress}%`}</span></div>
            <div style={checklistListStyle}>{data.checklist.reopeningItems.map((item) => <ChecklistRow key={item.id} item={item} compact />)}</div>
          </div>
        </article>

        <aside style={alertsPanelStyle}>
          <PanelHeader eyebrow="Alertes" title="Points de vigilance" href="/angelcare-360-command-center" />
          {data.alerts.length ? <AlertList items={data.alerts} /> : <EmptyState title="Aucune alerte critique" detail="Les blocages finance, admissions et transport apparaîtront ici." compact />}
        </aside>
      </section>

      <section style={yearRegistryStyle}>
        <PanelHeader eyebrow="Historique des années" title="Cycles disponibles" href="/angelcare-360-command-center/administration/annees-scolaires" />
        <div style={yearCardsStyle}>
          {data.years.length ? data.years.map((year) => (
            <div key={year.id} style={{ ...yearCardStyle, ...(year.isCurrent ? activeYearCardStyle : {}) }}>
              <div style={yearCardHeaderStyle}><span style={{ ...yearIconStyle, ...toneSoft(year.isCurrent ? 'green' : statusTone(year.status)) }}><CalendarRange size={18} /></span><span style={rowCopyStyle}><strong>{year.label}</strong><small>{formatRange(year.startsOn, year.endsOn)}</small></span></div>
              <div style={yearActionsStyle}>
                <span style={{ ...statusBadgeStyle, ...toneSoft(year.isCurrent ? 'green' : statusTone(year.status)) }}>{year.isCurrent ? 'Active' : statusLabel(year.status)}</span>
                <button type="button" onClick={() => openYearDrawer(year)} disabled={!canUpdateYear} style={textActionStyle}>Modifier</button>
                {!year.isCurrent ? <button type="button" onClick={() => activateYear(year)} disabled={!canUpdateYear || isPending} style={textActionStyle}>Activer</button> : null}
              </div>
            </div>
          )) : <EmptyState title="Aucune année scolaire" detail="Créez un cycle pour démarrer la gouvernance académique." actionLabel="Créer une année" onAction={canCreateYear ? () => openYearDrawer() : undefined} />}
        </div>
      </section>

      <Angelcare360EntityDrawer
        open={drawerKind !== null && canOpenDrawer}
        mode={drawerMode}
        config={drawerConfig}
        initialValues={selectedRecord}
        title={drawerKind?.startsWith('year') ? (drawerMode === 'create' ? 'Créer une année scolaire' : 'Modifier l’année scolaire') : (drawerMode === 'create' ? 'Ajouter une période' : 'Modifier la période')}
        onClose={() => setDrawerKind(null)}
        onSaved={() => {
          setDrawerKind(null)
          setFeedback('Enregistrement effectué avec succès.')
          router.refresh()
        }}
      />

      {eventKind ? (
        <EventModal kind={eventKind} form={eventForm} onChange={setEventForm} onClose={() => setEventKind(null)} onSubmit={submitEvent} submitting={isPending} />
      ) : null}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string; note: string; tone: Tone }) {
  return (
    <div style={kpiCardStyle}>
      <span style={{ ...kpiIconStyle, ...toneSoft(tone) }}><Icon size={22} /></span>
      <span style={kpiCopyStyle}><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
      <span style={sparkStyle}>{[14, 22, 18, 29, 25].map((height, index) => <i key={index} style={{ ...sparkBarStyle, height, background: toneColor(tone) }} />)}</span>
    </div>
  )
}

function PanelHeader({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return <div style={panelHeaderStyle}><div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div><Link href={href} style={panelLinkStyle}>Voir tout <ChevronRight size={14} /></Link></div>
}

function Timeline({ items }: { items: Angelcare360AcademicYearsOverviewData['timeline'] }) {
  return (
    <div style={timelineStyle}>
      <div style={timelineLineStyle} />
      {items.map((item) => {
        const tone: Tone = item.status === 'active' ? 'green' : item.status === 'completed' ? 'slate' : item.status === 'attention' ? 'red' : item.status === 'closed' ? 'red' : 'blue'
        return (
          <div key={item.id} style={timelineItemStyle}>
            <span style={{ ...timelineNodeStyle, borderColor: toneColor(tone), background: toneColor(tone) }}>{item.status === 'completed' || item.status === 'active' ? <CheckCircle2 size={14} /> : item.status === 'attention' ? <AlertTriangle size={14} /> : <Flag size={13} />}</span>
            <strong>{item.label}</strong>
            <small>{formatRange(item.startsOn, item.endsOn)}</small>
            <em style={{ color: toneColor(tone) }}>{item.statusLabel}</em>
          </div>
        )
      })}
    </div>
  )
}

function DeadlineList({ items }: { items: AcademicDeadlineItem[] }) {
  return <div style={stackStyle}>{items.map((item) => <Link key={item.id} href={item.href} style={deadlineRowStyle}><DateTile date={item.date} tone={item.tone} /><span style={rowCopyStyle}><strong>{item.title}</strong><small>{item.detail}</small></span><span style={deadlineMetaStyle}>{item.timeLabel || item.amountLabel || formatDate(item.date, { day: '2-digit', month: 'short' })}</span></Link>)}</div>
}

function MilestoneList({ items }: { items: AcademicMilestoneItem[] }) {
  return <div style={stackStyle}>{items.map((item) => <Link key={item.id} href={item.href} style={milestoneRowStyle}><DateTile date={item.date} tone={item.tone} /><span style={rowCopyStyle}><strong>{item.title}</strong><small>{item.detail}</small></span><span style={{ ...daysBadgeStyle, ...toneSoft(item.tone) }}>Dans {item.daysLeft} j</span></Link>)}</div>
}

function AlertList({ items }: { items: AcademicAlertItem[] }) {
  return <div style={stackStyle}>{items.map((item) => <Link key={item.id} href={item.href} style={{ ...alertRowStyle, ...toneSoft(item.tone) }}><span style={alertIconStyle}>{item.tone === 'red' ? <AlertTriangle size={18} /> : item.tone === 'orange' ? <Clock3 size={18} /> : <Circle size={18} />}</span><span style={rowCopyStyle}><strong>{item.title}</strong><small>{item.detail}</small></span><em>{item.label}</em></Link>)}</div>
}

function DateTile({ date, tone }: { date: string; tone: Tone }) {
  const parsed = new Date(`${date}T12:00:00`)
  const day = Number.isNaN(parsed.getTime()) ? '--' : new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(parsed)
  const month = Number.isNaN(parsed.getTime()) ? '---' : new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(parsed).replace('.', '').toUpperCase()
  return <span style={{ ...dateTileStyle, ...toneSoft(tone) }}><strong>{day}</strong><small>{month}</small></span>
}

function ChecklistProgress({ label, progress, completed, total }: { label: string; progress: number | null; completed: number; total: number }) {
  return <div style={progressShellStyle}><div style={progressHeaderStyle}><span>{label}</span><strong>{completed} / {total}</strong></div><div style={progressTrackStyle}><span style={{ ...progressFillStyle, width: `${progress || 0}%` }} /></div></div>
}

function ChecklistRow({ item, compact }: { item: AcademicChecklistItem; compact?: boolean }) {
  const tone: Tone = item.state === 'complete' ? 'green' : item.state === 'partial' ? 'blue' : item.state === 'blocked' ? 'red' : 'slate'
  return <Link href={item.href} style={{ ...checkRowStyle, ...(compact ? { paddingBlock: 5 } : {}) }}><span style={{ color: toneColor(tone) }}>{item.state === 'complete' ? <CheckCircle2 size={16} /> : item.state === 'not_applicable' ? <Circle size={16} /> : <Clock3 size={16} />}</span><span>{item.label}</span><strong>{item.progress === null ? '—' : `${item.progress}%`}</strong></Link>
}

function EmptyState({ title, detail, actionLabel, onAction, compact }: { title: string; detail: string; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  return <div style={{ ...emptyStyle, ...(compact ? { padding: 12 } : {}) }}><span style={emptyIconStyle}><Archive size={18} /></span><strong>{title}</strong><p>{detail}</p>{actionLabel && onAction ? <button type="button" onClick={onAction} style={emptyActionStyle}>{actionLabel}</button> : null}</div>
}

function EventModal({ kind, form, onChange, onClose, onSubmit, submitting }: { kind: Exclude<EventKind, null>; form: EventFormState; onChange: (value: EventFormState) => void; onClose: () => void; onSubmit: () => void; submitting: boolean }) {
  return (
    <div style={modalOverlayStyle} onClick={onClose} role="presentation">
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}><div><div style={eyebrowStyle}>{kind === 'enrollment' ? 'Fenêtre d’inscription' : 'Clôture institutionnelle'}</div><h3 style={modalTitleStyle}>{kind === 'enrollment' ? 'Ouvrir les inscriptions' : 'Planifier une clôture'}</h3></div><button type="button" onClick={onClose} style={closeButtonStyle}><X size={18} /></button></div>
        <div style={modalGridStyle}>
          <label style={fieldStyle}><span>Titre</span><input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Audience</span><select value={form.audience} onChange={(event) => onChange({ ...form, audience: event.target.value })} style={inputStyle}><option value="all">Tous</option><option value="parents">Parents</option><option value="staff">Personnel</option><option value="students">Élèves</option></select></label>
          <label style={fieldStyle}><span>Date de début</span><input type="date" value={form.startsOn} onChange={(event) => onChange({ ...form, startsOn: event.target.value })} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Date de fin</span><input type="date" value={form.endsOn} onChange={(event) => onChange({ ...form, endsOn: event.target.value })} style={inputStyle} /></label>
          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}><span>Description</span><textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }} /></label>
          <label style={fieldStyle}><span>Statut</span><select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as EventFormState['status'] })} style={inputStyle}><option value="planned">Planifié</option><option value="published">Publié</option></select></label>
        </div>
        <div style={modalFooterStyle}><button type="button" onClick={onClose} style={secondaryButtonStyle}>Annuler</button><button type="button" onClick={onSubmit} disabled={submitting || !form.title || !form.startsOn || !form.endsOn} style={submitting ? disabledButtonStyle : primaryButtonStyle}>{submitting ? 'Enregistrement…' : 'Enregistrer le jalon'}</button></div>
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = { display: 'grid', gap: 14, width: '100%', minWidth: 0, paddingBottom: 8 }
const heroStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, minWidth: 0 }
const heroCopyStyle: CSSProperties = { minWidth: 0 }
const pageTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 'clamp(34px, 2.7vw, 44px)', lineHeight: 1.03, letterSpacing: -1.1, fontWeight: 950 }
const pageSubtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }
const contextRowStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }
const contextPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid #dbe4ef', borderRadius: 999, background: '#fff', color: '#475569', padding: '6px 10px', fontSize: 11, fontWeight: 900 }
const datePillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 14, border: '1px solid #dbe4ef', background: '#fff', padding: '10px 13px', color: '#0f172a', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 28, borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }
const tabStyle: CSSProperties = { color: '#64748b', textDecoration: 'none', padding: '0 0 12px', borderBottom: '3px solid transparent', fontSize: 13, fontWeight: 850, whiteSpace: 'nowrap' }
const activeTabStyle: CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }
const kpiCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) 42px', gap: 11, alignItems: 'center', minHeight: 104, padding: 14, borderRadius: 20, border: '1px solid #dbe4ef', background: 'linear-gradient(180deg,#fff 0%,#fbfdff 100%)', boxShadow: '0 14px 34px rgba(15,23,42,.05)', minWidth: 0 }
const kpiIconStyle: CSSProperties = { width: 46, height: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 15, border: '1px solid transparent' }
const kpiCopyStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, color: '#0f172a' }
const sparkStyle: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: 3, height: 34 }
const sparkBarStyle: CSSProperties = { display: 'block', width: 4, borderRadius: 999, opacity: .72 }
const commandBarStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 10, border: '1px solid #dbe4ef', borderRadius: 18, background: '#fff', boxShadow: '0 10px 26px rgba(15,23,42,.04)' }
const primaryButtonStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #2563eb', borderRadius: 12, background: '#2563eb', color: '#fff', padding: '0 15px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 24px rgba(37,99,235,.18)' }
const secondaryButtonStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #dbe4ef', borderRadius: 12, background: '#fff', color: '#0f172a', padding: '0 14px', fontWeight: 850, cursor: 'pointer' }
const disabledButtonStyle: CSSProperties = { ...secondaryButtonStyle, color: '#94a3b8', background: '#f8fafc', borderStyle: 'dashed', cursor: 'not-allowed' }
const moreWrapStyle: CSSProperties = { position: 'relative', marginLeft: 'auto' }
const moreButtonStyle: CSSProperties = { ...secondaryButtonStyle, minWidth: 132 }
const moreMenuStyle: CSSProperties = { position: 'absolute', right: 0, top: 46, zIndex: 20, minWidth: 230, display: 'grid', gap: 4, padding: 8, borderRadius: 14, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 20px 48px rgba(15,23,42,.14)' }
const menuLinkStyle: CSSProperties = { padding: '10px 11px', borderRadius: 10, color: '#0f172a', textDecoration: 'none', fontSize: 12, fontWeight: 800 }
const feedbackStyle: CSSProperties = { borderRadius: 14, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', padding: '10px 13px', fontSize: 12, fontWeight: 800 }
const activationStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '54px minmax(0,1fr) auto', alignItems: 'center', gap: 14, borderRadius: 22, border: '1px solid #bfdbfe', background: 'radial-gradient(circle at 10% 20%,rgba(37,99,235,.09),transparent 32%),#fff', padding: 16, boxShadow: '0 16px 36px rgba(37,99,235,.06)' }
const activationIconStyle: CSSProperties = { width: 52, height: 52, borderRadius: 17, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#2563eb' }
const activationTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const activationTextStyle: CSSProperties = { margin: '5px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.5, fontWeight: 700 }
const cockpitGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 14, minWidth: 0 }
const panelBase: CSSProperties = { minWidth: 0, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 14px 36px rgba(15,23,42,.052)', padding: 14, overflow: 'hidden' }
const timelinePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 7' }
const deadlinePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const milestonePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 2' }
const periodPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 7' }
const checklistPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const alertsPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 2' }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 13 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 10.5, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 17, lineHeight: 1.12, fontWeight: 950 }
const panelLinkStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', color: '#2563eb', textDecoration: 'none', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }
const timelineStyle: CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, padding: '24px 8px 8px' }
const timelineLineStyle: CSSProperties = { position: 'absolute', top: 39, left: '5%', right: '5%', height: 3, background: 'linear-gradient(90deg,#64748b,#16a34a,#2563eb,#ef4444)', borderRadius: 999, opacity: .72 }
const timelineItemStyle: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 6, color: '#0f172a', fontSize: 12 }
const timelineNodeStyle: CSSProperties = { width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 999, color: '#fff', border: '4px solid', boxShadow: '0 0 0 5px #fff' }
const stackStyle: CSSProperties = { display: 'grid', gap: 8 }
const deadlineRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) auto', gap: 9, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eef2f7', color: '#0f172a', textDecoration: 'none' }
const milestoneRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 9, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eef2f7', color: '#0f172a', textDecoration: 'none' }
const dateTileStyle: CSSProperties = { width: 42, height: 42, display: 'grid', placeItems: 'center', alignContent: 'center', borderRadius: 13, border: '1px solid transparent', lineHeight: 1 }
const rowCopyStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0, color: '#0f172a' }
const deadlineMetaStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }
const daysBadgeStyle: CSSProperties = { gridColumn: '2', width: 'fit-content', borderRadius: 999, border: '1px solid transparent', padding: '4px 7px', fontSize: 9.5, fontWeight: 900 }
const tableWrapStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .7fr 1.05fr .72fr .85fr 46px', gap: 8, padding: '10px 11px', background: '#f8fafc', color: '#475569', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .7fr 1.05fr .72fr .85fr 46px', gap: 8, alignItems: 'center', padding: '10px 11px', borderTop: '1px solid #eef2f7', color: '#334155', fontSize: 11.5 }
const periodNameStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '9px minmax(0,1fr)', gap: '2px 7px', alignItems: 'center', color: '#0f172a' }
const statusDotStyle: CSSProperties = { width: 7, height: 7, borderRadius: 999 }
const statusBadgeStyle: CSSProperties = { display: 'inline-flex', justifySelf: 'start', border: '1px solid transparent', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950 }
const enrollmentCellStyle: CSSProperties = { display: 'grid', gap: 2, color: '#0f172a' }
const miniActionStyle: CSSProperties = { width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 10, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', cursor: 'pointer' }
const progressShellStyle: CSSProperties = { display: 'grid', gap: 7, marginBottom: 10 }
const progressHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#334155', fontSize: 11, fontWeight: 850 }
const progressTrackStyle: CSSProperties = { height: 7, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#16a34a)' }
const checklistListStyle: CSSProperties = { display: 'grid', gap: 1 }
const checkRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '20px minmax(0,1fr) 42px', gap: 7, alignItems: 'center', padding: '7px 0', color: '#334155', textDecoration: 'none', fontSize: 11, borderBottom: '1px solid #f1f5f9' }
const reopeningStyle: CSSProperties = { marginTop: 12, paddingTop: 11, borderTop: '1px solid #dbe4ef' }
const reopeningHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontSize: 11, marginBottom: 5 }
const alertRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 9, alignItems: 'center', border: '1px solid transparent', borderRadius: 15, padding: 10, textDecoration: 'none' }
const alertIconStyle: CSSProperties = { width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 11, background: 'rgba(255,255,255,.68)' }
const emptyStyle: CSSProperties = { display: 'grid', justifyItems: 'start', gap: 6, border: '1px dashed #cbd5e1', borderRadius: 16, background: '#f8fafc', padding: 16, color: '#64748b' }
const emptyIconStyle: CSSProperties = { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#eff6ff', color: '#2563eb' }
const emptyActionStyle: CSSProperties = { marginTop: 4, border: 0, borderRadius: 10, background: '#2563eb', color: '#fff', padding: '8px 10px', fontWeight: 900, cursor: 'pointer' }
const yearRegistryStyle: CSSProperties = { ...panelBase }
const yearCardsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }
const yearCardStyle: CSSProperties = { display: 'grid', gap: 12, border: '1px solid #dbe4ef', borderRadius: 17, padding: 12, background: '#fff' }
const activeYearCardStyle: CSSProperties = { borderColor: '#86efac', boxShadow: '0 12px 28px rgba(22,163,74,.09)' }
const yearCardHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
const yearIconStyle: CSSProperties = { width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 13, border: '1px solid transparent' }
const yearActionsStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }
const textActionStyle: CSSProperties = { border: 0, background: 'transparent', color: '#2563eb', fontSize: 11, fontWeight: 900, cursor: 'pointer' }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 18, background: 'rgba(15,23,42,.42)', backdropFilter: 'blur(8px)' }
const modalStyle: CSSProperties = { width: 'min(720px,100%)', display: 'grid', gap: 16, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', padding: 20, boxShadow: '0 34px 100px rgba(15,23,42,.24)' }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }
const modalTitleStyle: CSSProperties = { margin: '5px 0 0', color: '#0f172a', fontSize: 22, fontWeight: 950 }
const closeButtonStyle: CSSProperties = { width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 12, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', cursor: 'pointer' }
const modalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, color: '#475569', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em' }
const inputStyle: CSSProperties = { width: '100%', minHeight: 42, borderRadius: 12, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '9px 11px', fontSize: 13, fontWeight: 700, outline: 'none', textTransform: 'none', letterSpacing: 0, boxSizing: 'border-box' }
const modalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 8 }
