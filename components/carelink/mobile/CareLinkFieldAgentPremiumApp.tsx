'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BellRing,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  Home,
  MapPin,
  MessageCircle,
  LifeBuoy,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  Star,
  UserRound,
  Wifi,
} from 'lucide-react'
import type { CareLinkMobileAlert, CareLinkMobileNotification, CareLinkMobilePaymentLine, CareLinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { useCareLinkOfflineQueue } from '@/lib/carelink/offline-queue'
import { useCareLinkRealtime } from '@/lib/carelink/realtime'
import type { MissionControlRecord, MissionDossier } from '@/lib/missions/types'

type CareLinkMobileView = 'home' | 'missions' | 'mission' | 'schedule' | 'calendar' | 'notifications' | 'alerts' | 'history' | 'payments' | 'readiness' | 'support' | 'messages' | 'profile' | 'safety'

type Props = {
  records: MissionControlRecord[]
  view?: CareLinkMobileView
  selectedId?: string | number
  dossier?: MissionDossier | null
  workspace?: CareLinkMobileWorkspace | null
}

type Toast = { tone: 'success' | 'error'; text: string } | null

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    assigned: 'Assignée',
    agent_notified: 'À confirmer',
    agent_accepted: 'Acceptée',
    confirmed: 'Confirmée',
    en_route: 'En route',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    report_pending: 'Rapport attendu',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident',
    cancelled: 'Annulée',
    closed: 'Clôturée',
    no_show: 'Absence',
  }
  return labels[status] || String(status || 'Mission').replaceAll('_', ' ').toUpperCase()
}

function statusTone(status: string) {
  if (['completed', 'report_submitted', 'agent_accepted', 'confirmed', 'closed'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (['in_progress', 'mission_started', 'en_route', 'arrival_confirmed'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-100'
  if (['incident', 'cancelled'].includes(status)) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['report_pending', 'agent_notified', 'draft'].includes(status)) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function riskTone(risk: string) {
  if (['critical', 'high', 'elevated'].includes(String(risk).toLowerCase())) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['watch', 'medium', 'warning'].includes(String(risk).toLowerCase())) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

function readinessLabel(status: string) {
  const labels: Record<string, string> = {
    ready: 'Prête',
    warning: 'Vigilance',
    blocked: 'Bloquée',
    pending: 'En attente',
  }
  return labels[status] || String(status || 'En attente').replaceAll('_', ' ').toUpperCase()
}

function formatHour(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatDay(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' }).format(date)
}

function currencyDh(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
}

function firstString(...values: unknown[]) {
  return String(values.find((value) => typeof value === 'string' && value.trim()) || '')
}

function firstText(...values: unknown[]) {
  return firstString(...values)
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    assigned: 'Mission assignée',
    agent_notified: 'Agent notifié',
    agent_accepted: 'Acceptée par l’agent',
    confirmed: 'Confirmée',
    confirmed_by_dispatch: 'Confirmée par la liaison opérationnelle',
    en_route: 'En route',
    arrived: 'Arrivée confirmée',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident signalé',
    incident_reported: 'Incident signalé',
    cancelled: 'Annulée',
    closed: 'Clôturée',
  }
  return labels[eventType] || eventType.replaceAll('_', ' ')
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function routeMeta(view: CareLinkMobileView, workspace: CareLinkMobileWorkspace | null) {
  const unread = safeArray<{ unread?: boolean }>(workspace?.messages).filter((message) => Boolean(message.unread)).length
  const criticalAlerts = safeArray<{ tone?: string }>(workspace?.alerts).filter((alert) => alert.tone === 'red').length
  const pendingNotifications = safeArray<{ unread?: boolean }>(workspace?.notifications).filter((item) => item.unread).length
  const pendingDisputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes).length
  const expiredDocuments = safeArray<{ expiresAt?: string | null }>(workspace?.documents).filter((document) => document.expiresAt && new Date(String(document.expiresAt)).getTime() < Date.now()).length

  const config: Record<CareLinkMobileView, { eyebrow: string; title: string; description: string; chips: string[] }> = {
    home: {
      eyebrow: 'Centre de commande terrain',
      title: 'CareLink Mobile',
      description: 'Vue consolidée des missions, de la liaison opérationnelle, de la sécurité, des paiements, de la préparation et de l’audit mobile.',
      chips: [`${unread} messages`, `${pendingNotifications} notifications`, `${criticalAlerts} alertes critiques`],
    },
    missions: {
      eyebrow: 'File de missions',
      title: 'Missions terrain',
      description: 'Missions du jour, confirmations, rapports, récurrences et risques dans un seul flux opérationnel.',
      chips: ['Confirmations', 'Contrôles', 'Rapports'],
    },
    mission: {
      eyebrow: 'Exécution mission',
      title: 'Détail opérationnel',
      description: 'Chronologie, checklist, rapport, transport, liaison opérationnelle, sécurité et audit de mission.',
      chips: ['Cycle', 'Contrôle', 'Audit'],
    },
    schedule: {
      eyebrow: 'Planning',
      title: 'Chronologie jour et semaine',
      description: 'Blocages, disponibilités, missions à venir et fenêtres de trajet dans le même planning.',
      chips: ['Jour', 'Semaine', 'Disponibilité'],
    },
    calendar: {
      eyebrow: 'Calendrier',
      title: 'Vue calendrier',
      description: 'Densité de mission, sessions récurrentes et navigation par période sans quitter le mobile.',
      chips: ['Mois', 'Semaine', 'Jour'],
    },
    notifications: {
      eyebrow: 'Notifications',
      title: 'Centre de notifications',
      description: 'Rappels, validations, paiements, conformité et mises à jour persistantes de liaison opérationnelle.',
      chips: [pendingNotifications ? `${pendingNotifications} non lues` : 'Aucune non lue', 'Priorités', 'Accusé de réception'],
    },
    alerts: {
      eyebrow: 'Alertes',
      title: 'Centre d’alertes',
      description: 'Alertes terrain, risques, incidents et escalades à traiter immédiatement.',
      chips: [criticalAlerts ? `${criticalAlerts} critiques` : 'Aucune critique', 'Sécurité', 'Opérations'],
    },
    history: {
      eyebrow: 'Audit terrain',
      title: 'Historique opérationnel',
      description: 'Journal des événements, rapports, incidents, corrections et conformité.',
      chips: ['Événements mission', 'Incidents', 'Conformité'],
    },
    payments: {
      eyebrow: 'Compensation',
      title: 'Paiements et indemnités',
      description: 'Montants validés, en attente, primes, transport et corrections en MAD / DH.',
      chips: [pendingDisputes ? `${pendingDisputes} litiges` : 'Aucun litige', 'MAD / DH', 'Finance'],
    },
    readiness: {
      eyebrow: 'Préparation',
      title: 'Centre de préparation',
      description: 'Blocages, documents expirés, conformité et actions de mise en conformité.',
      chips: [expiredDocuments ? `${expiredDocuments} expirés` : 'Conforme', 'Documents', 'Éligibilité'],
    },
    support: {
      eyebrow: 'Assistance',
      title: 'Liaison d’assistance',
      description: 'Liaison opérationnelle, finance, supervision et assistance technique avec escalade rapide.',
      chips: ['Liaison', 'Finance', 'Supervision'],
    },
    messages: {
      eyebrow: 'Liaison opérationnelle',
      title: 'Messages persistants',
      description: 'Fils mission, messages urgents, lecture, relance et envoi de localisation.',
      chips: ['Fils', 'Urgent', 'Localisation'],
    },
    profile: {
      eyebrow: 'Profil agent',
      title: 'Identité et conformité',
      description: 'Zones, compétences, langues, performance, disponibilité et documents.',
      chips: ['Zones', 'Compétences', 'Conformité'],
    },
    safety: {
      eyebrow: 'Sécurité',
      title: 'Centre SOS',
      description: 'Urgence, liaison opérationnelle, secours, incident et protocole terrain.',
      chips: ['SOS', 'Incident', 'Localisation'],
    },
  }

  return config[view]
}

export function CareLinkFieldAgentPremiumApp({ records, view = 'home', selectedId, dossier = null, workspace = null }: Props) {
  const [localRecords, setLocalRecords] = useState(records)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today')
  const [notificationFeed, setNotificationFeed] = useState(workspace?.notifications || [])
  const [alertFeed, setAlertFeed] = useState(workspace?.alerts || [])
  const [messageFeed, setMessageFeed] = useState(workspace?.messages || [])
  const { dispatch: dispatchQueue, pendingCount, syncing, isOnline } = useCareLinkOfflineQueue()
  const { workspace: liveWorkspace } = useCareLinkRealtime(workspace)
  const activeWorkspace = liveWorkspace || workspace

  useEffect(() => {
    setNotificationFeed(activeWorkspace?.notifications || [])
    setAlertFeed(activeWorkspace?.alerts || [])
    setMessageFeed(activeWorkspace?.messages || [])
  }, [activeWorkspace?.alerts, activeWorkspace?.dispatchThreads, activeWorkspace?.messages, activeWorkspace?.notifications])

  useEffect(() => {
    if (liveWorkspace?.records?.length) setLocalRecords(liveWorkspace.records)
  }, [liveWorkspace])

  const selected = useMemo(() => {
    if (dossier?.mission) return dossier.mission
    return localRecords.find((item) => String(item.id) === String(selectedId) || item.code === selectedId) || localRecords[0] || null
  }, [dossier, localRecords, selectedId])

  async function runAction(mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) {
    setBusy(`${mission.id}:${action}`)
    setToast(null)
    try {
      const body =
        typeof payload === 'string'
          ? { note: payload, source: 'carelink_mobile' }
          : { ...(payload || {}), source: 'carelink_mobile' }
      const response = await dispatchQueue({
        endpoint: `/api/carelink/missions/${mission.id}/${action}`,
        payload: body,
        missionId: mission.id,
        label: `${mission.code}:${action}`,
      })

      if (!response.ok) throw new Error('Échec de l’action')

      const statusMap: Record<string, string> = {
        accept: 'agent_accepted',
        decline: 'agent_declined',
        'confirm-readiness': 'confirmed',
        'en-route': 'en_route',
        delay: mission.status,
        arrive: 'arrival_confirmed',
        arrived: 'arrival_confirmed',
        'check-in': 'checked_in',
        start: 'mission_started',
        report: 'report_submitted',
        incident: 'incident',
        'request-replacement': mission.status,
        complete: 'completed',
      }

      if (response.queued) {
        if (!['checklist'].includes(action)) {
          const optimisticStatus = statusMap[action] || mission.status
          setLocalRecords((current) => current.map((item) => (item.id === mission.id ? { ...item, status: optimisticStatus, lifecycleStage: optimisticStatus } : item)))
        }
        setToast({ tone: 'success', text: 'Action enregistrée hors ligne. Synchronisation en attente.' })
        return
      }

      const result = response.data as any
      const missionData = result?.data?.mission || result?.mission || result?.data || result
      const newStatus = missionData?.status || statusMap[action] || mission.status
      if (!['checklist'].includes(action)) {
        setLocalRecords((current) => current.map((item) => (item.id === mission.id ? { ...item, status: newStatus, lifecycleStage: missionData?.lifecycle_stage || newStatus } : item)))
      }
      setToast({ tone: 'success', text: 'Mission synchronisée avec la liaison opérationnelle.' })
    } catch (error) {
      setToast({ tone: 'error', text: error instanceof Error ? error.message : 'Synchronisation impossible.' })
    } finally {
      setBusy(null)
    }
  }

  async function runCareLinkAction(endpoint: string, payload: Record<string, unknown>) {
    const response = await dispatchQueue({ endpoint, payload, label: endpoint })
    if (!response.ok) throw new Error('Synchronisation impossible')
    return response
  }

  return (
    <main className="min-h-dvh bg-[#f4f8ff] text-slate-950">
      <div className="mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f8fbff] shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
        {view !== 'mission' ? <TopBar records={localRecords} queuePending={pendingCount} syncing={syncing} online={isOnline} /> : null}
        {view === 'home' ? <HomeScreen records={localRecords} workspace={activeWorkspace} runAction={runAction} busy={busy} queuePending={pendingCount} syncing={syncing} online={isOnline} /> : null}
        {view === 'missions' ? <MissionsScreen records={localRecords} workspace={activeWorkspace} activeTab={activeTab} setActiveTab={setActiveTab} runAction={runAction} busy={busy} /> : null}
        {view === 'mission' ? <MissionDetailScreen mission={selected} dossier={dossier} workspace={activeWorkspace} runAction={runAction} busy={busy} /> : null}
        {view === 'schedule' ? <ScheduleScreen records={localRecords} /> : null}
        {view === 'calendar' ? <CalendarScreen workspace={activeWorkspace} records={localRecords} /> : null}
        {view === 'notifications' ? <NotificationsScreen workspace={activeWorkspace} records={localRecords} notifications={notificationFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'alerts' ? <AlertsScreen workspace={activeWorkspace} records={localRecords} alerts={alertFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'history' ? <HistoryScreen workspace={activeWorkspace} records={localRecords} /> : null}
        {view === 'payments' ? <PaymentsScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'readiness' ? <ReadinessScreen workspace={activeWorkspace} records={localRecords} /> : null}
        {view === 'support' ? <SupportScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'messages' ? <MessagesScreen records={localRecords} workspace={activeWorkspace} messages={messageFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'profile' ? <ProfileScreen records={localRecords} workspace={activeWorkspace} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'safety' ? <SafetyScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {toast ? <ToastMessage toast={toast} /> : null}
        <BottomNav active={view === 'mission' ? 'missions' : view} />
      </div>
    </main>
  )
}

function TopBar({ records, queuePending, syncing, online }: { records: MissionControlRecord[]; queuePending: number; syncing: boolean; online: boolean }) {
  const todayCount = records.filter((item) => item.dateLabel && item.dateLabel !== 'Non planifiée').length
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-black text-white shadow-lg shadow-blue-100">AC</div>
          <div>
            <p className="text-xs font-black tracking-tight text-slate-950">Bonjour</p>
            <p className="text-[11px] font-semibold text-slate-500">{todayCount} mission{todayCount > 1 ? 's' : ''} aujourd’hui</p>
          </div>
        </div>
        <button className="relative rounded-full bg-white p-3 text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.10)] ring-1 ring-slate-200" aria-label="Notifications">
          <Bell size={18} />
          <span className={cx('absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white', online ? 'bg-emerald-500' : 'bg-amber-500')} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
        <span>{online ? 'En ligne' : 'Hors ligne'}</span>
        <span>{syncing ? 'Synchronisation...' : queuePending ? `${queuePending} action${queuePending > 1 ? 's' : ''} en attente` : 'Synchronisé'}</span>
      </div>
    </header>
  )
}

function HomeScreen({
  records,
  workspace,
  runAction,
  busy,
  queuePending,
  syncing,
  online,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  runAction: (mission: MissionControlRecord, action: string) => void
  busy: string | null
  queuePending: number
  syncing: boolean
  online: boolean
}) {
  const meta = routeMeta('home', workspace)
  const next = records[0] || null
  const completed = records.filter((item) => ['completed', 'closed'].includes(item.status)).length
  const active = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(item.status)).length
  const alerts = records.filter((item) => ['incident', 'cancelled'].includes(item.status)).length
  const notifications = safeArray<CareLinkMobileNotification>(workspace?.notifications)
  const alertsFeed = safeArray<CareLinkMobileAlert>(workspace?.alerts)
  const messages = safeArray<{ id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>(workspace?.messages)
  const checklistItems = safeArray<Record<string, unknown>>(workspace?.checklistItems)
  const reports = safeArray<Record<string, unknown>>(workspace?.reports)
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const history = safeArray<Record<string, unknown>>(workspace?.history)
  const support = safeArray<Record<string, unknown>>(workspace?.support)
  const unreadMessages = messages.filter((message) => message.unread).length
  const pendingNotifications = notifications.filter((notification) => notification.unread).length
  const criticalAlerts = alertsFeed.filter((alert) => alert.tone === 'red').length
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length
  const checklistPending = checklistItems.filter((item) => !Boolean(item.completed)).length
  const reportsDue = reports.filter((report) => !['validated', 'submitted'].includes(String(report.status || report.validationStatus || '').toLowerCase())).length
  const complianceBlocks = documents.filter((document) => {
    const status = String(document.status || document.reviewStatus || '').toLowerCase()
    const expiresAt = document.expiresAt ? new Date(String(document.expiresAt)).getTime() : null
    return status === 'expired' || status === 'review_requested' || (expiresAt != null && expiresAt < Date.now())
  }).length

  return (
    <section className="space-y-5 px-5 pb-28 pt-5">
      <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.chips.map((chip) => (
            <span key={chip} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="LIAISON" value={unreadMessages} />
        <Metric label="NOTIF." value={pendingNotifications} />
        <Metric label="ALERTES" value={criticalAlerts || alerts} />
        <Metric label="AUDIT" value={history.length} />
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_24px_70px_rgba(29,78,216,0.14)] ring-1 ring-blue-100">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100 blur-2xl" />
        <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-cyan-100 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-600">Cockpit terrain</p>
          <h2 className="mt-3 max-w-xs text-3xl font-black leading-[0.98] tracking-tight text-slate-950">Votre terrain, sous contrôle.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">Tout ce qu’il faut pour exécuter les missions avec sécurité, discipline et traçabilité.</p>
          <div className="mt-5 grid grid-cols-4 gap-3">
            <Metric label="AUJ." value={records.length} />
            <Metric label="ACTIVES" value={active} />
            <Metric label="TERMINÉES" value={completed} />
            <Metric label="ALERTES" value={alerts} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            <span className={cx('rounded-full px-3 py-1', online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{online ? 'En ligne' : 'Hors ligne'}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-500">{syncing ? 'Synchronisation...' : queuePending ? `${queuePending} action${queuePending > 1 ? 's' : ''} en attente` : 'Synchronisé'}</span>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <QuickTile href="/carelink/messages" icon={<MessageCircle size={20} />} title="MESSAGES" subtitle={`${unreadMessages} non lus`} tone="amber" />
        <QuickTile href="/carelink/notifications" icon={<BellRing size={20} />} title="NOTIFICATIONS" subtitle={`${pendingNotifications} à traiter`} tone="blue" />
        <QuickTile href="/carelink/alerts" icon={<AlertTriangle size={20} />} title="ALERTES" subtitle={`${criticalAlerts} critiques`} tone="rose" />
          <QuickTile href="/carelink/readiness" icon={<ShieldCheck size={20} />} title="PRÉPARATION" subtitle="Conformité et blocages" tone="emerald" />
      </section>

      <SectionHeader title="Missions du jour" action="Tout voir" href="/carelink/missions" />
      <div className="space-y-3">
        {records.slice(0, 3).map((mission) => <MissionCard key={mission.id} mission={mission} runAction={runAction} busy={busy} />)}
        {!records.length ? <EmptyState title="Aucune mission chargée" body="Vos sous-missions assignées apparaîtront ici dès que la liaison opérationnelle les publiera." /> : null}
      </div>

      <Link href="/carelink/schedule" className="flex items-center justify-center gap-2 rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white shadow-[0_18px_42px_rgba(6,40,94,0.22)]">
        <CalendarDays size={18} /> Voir le planning complet
      </Link>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Mises à jour importantes</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Changements de trajet, consignes de liaison opérationnelle et mises à jour sécurité.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">Nouveau</span>
        </div>
      </div>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Modules entreprise</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">Centre mobile complet</h2>
          </div>
          <FileText className="text-slate-300" size={20} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <EnterpriseMiniModule href="/carelink/missions" label="Contrôles" value={`${checklistPending} en attente`} />
          <EnterpriseMiniModule href="/carelink/history" label="Rapports" value={`${reportsDue} à traiter`} />
          <EnterpriseMiniModule href="/carelink/payments" label="Finance" value={`${disputes.length} litiges`} />
          <EnterpriseMiniModule href="/carelink/readiness" label="Conformité" value={`${complianceBlocks} blocages`} />
          <EnterpriseMiniModule href="/carelink/support" label="Assistance" value={`${support.length} demandes`} />
          <EnterpriseMiniModule href="/carelink/history" label="Audit" value={`${history.length} lignes`} />
          <EnterpriseMiniModule href="/carelink/safety" label="Sécurité" value={alertsFeed.length ? `${alertsFeed.length} alertes` : 'Stabilité'} />
          <EnterpriseMiniModule href="/carelink" label="Synchronisation" value={online ? 'En direct' : 'File locale'} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Aperçu opérationnel</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">Notifications, alertes et audit</h2>
          </div>
          <FileText className="text-slate-300" size={20} />
        </div>
        <div className="mt-4 space-y-3">
          <PreviewList title="Notifications récentes" items={notifications.slice(0, 2).map((item) => `${item.title} · ${item.body}`)} empty="Aucune notification persistante" />
          <PreviewList title="Alertes récentes" items={alertsFeed.slice(0, 2).map((item) => `${item.title} · ${item.body}`)} empty="Aucune alerte critique" />
          <PreviewList title="Audit et assistance" items={[...history.slice(0, 1).map((item) => `${String(item.title || 'Audit')} · ${String(item.body || '')}`), ...support.slice(0, 1).map((item) => `${String(item.title || 'Assistance')} · ${String(item.body || '')}`)].filter(Boolean)} empty="Aucun événement d’audit ou d’assistance" />
        </div>
      </section>

      <DarkRoutePreview records={records} />
    </section>
  )
}

function MissionCard({ mission, runAction, busy }: { mission: MissionControlRecord; runAction: (mission: MissionControlRecord, action: string) => void; busy: string | null }) {
  const isBusy = busy?.startsWith(`${mission.id}:`)

  return (
    <article className="group rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
      <Link href={`/carelink/missions/${mission.id}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-blue-600">{missionTime(mission).split(' ')[0]}</span>
              <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black ring-1', statusTone(mission.status))}>{statusLabel(mission.status)}</span>
            </div>
            <h2 className="mt-3 text-base font-black leading-tight text-slate-950">{mission.familyName || 'Client'} · {mission.serviceType}</h2>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={13} /> {mission.zone}, {mission.city}</p>
          </div>
          <ChevronRight className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" size={20} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">Sous-mission {Math.max(1, mission.upcomingSubMissionCount || 1)} sur {Math.max(1, mission.subMissionCount || 1)}</span>
          <span className={cx('rounded-full px-3 py-1.5 text-[11px] font-black ring-1', riskTone(mission.riskLevel))}>{String(mission.riskLevel || 'normal').toUpperCase()}</span>
        </div>
      </Link>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button disabled={isBusy} onClick={() => runAction(mission, 'accept')} className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white disabled:opacity-50">Accepter</button>
        <button disabled={isBusy} onClick={() => runAction(mission, 'en-route')} className="rounded-2xl bg-blue-50 px-3 py-3 text-xs font-black text-blue-700 disabled:opacity-50">En route</button>
      </div>
    </article>
  )
}

function MissionsScreen({
  records,
  workspace,
  activeTab,
  setActiveTab,
  runAction,
  busy,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  activeTab: 'today' | 'upcoming' | 'completed'
  setActiveTab: (tab: 'today' | 'upcoming' | 'completed') => void
  runAction: (mission: MissionControlRecord, action: string) => void
  busy: string | null
}) {
  const meta = routeMeta('missions', workspace)
  const visible = activeTab === 'completed'
    ? records.filter((item) => ['completed', 'closed'].includes(item.status))
    : activeTab === 'upcoming'
      ? records.filter((item) => !['completed', 'closed', 'cancelled'].includes(item.status))
      : records
  const todayCount = records.filter((item) => item.dateLabel && item.dateLabel !== 'Non planifiée').length
  const activeCount = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(item.status)).length
  const confirmationCount = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length
  const reportCount = records.filter((item) => ['report_pending', 'completion_requested'].includes(item.status) || item.reportStatus === 'pending').length
  const checklistCount = safeArray<Record<string, unknown>>(workspace?.checklistItems).filter((item) => !Boolean(item.completed)).length
  const riskCount = records.filter((item) => ['incident', 'cancelled', 'no_show'].includes(item.status) || ['critical', 'high', 'elevated'].includes(String(item.riskLevel || '').toLowerCase())).length
  const recurringCount = records.filter((item) => item.missionKind === 'dossier' || item.subMissionCount > 0).length

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric label="AUJ." value={todayCount} />
          <Metric label="ACTIVES" value={activeCount} />
          <Metric label="CONFIRM." value={confirmationCount} />
          <Metric label="REPORTS" value={reportCount} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['today', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'today' | 'upcoming' | 'completed')}
              className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] ring-1', activeTab === tab ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}
            >
              {tab === 'today' ? 'Aujourd’hui' : tab === 'upcoming' ? 'À venir' : 'Terminées'}
            </button>
          ))}
          <span className="rounded-full bg-rose-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-700 ring-1 ring-rose-100">{riskCount} à risque</span>
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 ring-1 ring-emerald-100">{recurringCount} récurrentes</span>
          <span className="rounded-full bg-sky-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-sky-700 ring-1 ring-sky-100">{checklistCount} contrôles</span>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Synchronisation {workspace?.source === 'live-db' ? 'en direct' : 'de secours'} · {visible.length} mission(s) dans ce filtre · {confirmationCount} confirmation(s) en attente.
        </div>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {visible.map((mission) => <MissionCard key={mission.id} mission={mission} runAction={runAction} busy={busy} />)}
        {!visible.length ? (
          <EmptyState
            title="Aucune mission assignée"
            body={`La file terrain est vide pour ce filtre. Confirmations ${confirmationCount > 0 ? `(${confirmationCount})` : '0'}, rapports en attente ${reportCount}, synchronisation ${workspace?.source === 'live-db' ? 'active' : 'à rafraîchir'}.`}
          />
        ) : null}
      </div>
    </section>
  )
}

function MissionDetailScreen({
  mission,
  dossier,
  workspace,
  runAction,
  busy,
}: {
  mission: MissionControlRecord | null
  dossier: MissionDossier | null
  workspace: CareLinkMobileWorkspace | null
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const meta = routeMeta('mission', workspace)
  const [rating, setRating] = useState(5)
  const [summary, setSummary] = useState('')
  const [observations, setObservations] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [activities, setActivities] = useState('')
  const [incidentFlag, setIncidentFlag] = useState(false)

  if (!mission) {
    return (
      <section className="grid min-h-dvh place-items-center p-6">
        <div className="w-full space-y-4">
          <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          </div>
          <EmptyState title="Mission indisponible" body="La liaison opérationnelle n’a pas encore publié le détail de cette mission. Revenez au centre de missions ou consultez la file assignée pour continuer l’exécution terrain." />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/carelink/missions" className="rounded-2xl bg-slate-950 px-4 py-4 text-center text-sm font-black text-white">Retour missions</Link>
            <Link href="/carelink/support" className="rounded-2xl bg-blue-600 px-4 py-4 text-center text-sm font-black text-white">Contacter l’assistance</Link>
          </div>
        </div>
      </section>
    )
  }

  const routeRows = dossier?.routes || []
  const checklistItems = (dossier?.checklistItems || dossier?.subMissions || []) as Array<Record<string, any>>
  const events = dossier?.events || []
  const dispatchMessages = (dossier?.dispatchMessages || []) as Array<Record<string, any>>
  const reportData = dossier?.report || null
  const reports = safeArray<Record<string, unknown>>(workspace?.reports)
  const allowances = dossier?.allowances || null
  const programLines = (dossier?.programLines || []) as Array<Record<string, any>>
  const parameterDays = (dossier?.parameterDays || []) as Array<Record<string, any>>
  const notifications = (dossier?.notifications || []) as Array<Record<string, any>>
  const alerts = (dossier?.alerts || []) as Array<Record<string, any>>
  const disputes = (dossier?.paymentDisputes || []) as Array<Record<string, any>>
  const documents = (dossier?.documents || []) as Array<Record<string, any>>
  const checklistProgress = checklistItems.length ? Math.round((checklistItems.filter((item) => Boolean(item.completed)).length / checklistItems.length) * 100) : 0
  const nextAction = mission.status === 'assigned'
    ? 'Accepter la mission'
    : mission.status === 'confirmed'
      ? 'Confirmer la préparation puis démarrer le trajet'
      : mission.status === 'en_route'
        ? 'Confirmer l’arrivée proche et pointer'
        : mission.status === 'arrival_confirmed'
          ? 'Pointer l’arrivée puis démarrer la mission'
          : mission.status === 'in_progress'
            ? 'Finaliser les contrôles et préparer le rapport'
            : mission.status === 'report_pending'
              ? 'Soumettre le rapport final'
              : 'Consulter la prochaine étape de la liaison opérationnelle'
  const beneficiaryContext = firstText((dossier?.raw as any)?.beneficiary_name, (dossier?.raw as any)?.beneficiaries?.full_name, mission.familyName, 'Bénéficiaire')
  const familyContext = firstText((dossier?.raw as any)?.families?.full_name, mission.familyName, 'Famille')
  const serviceNotes = (dossier?.parameters ? Object.entries(dossier.parameters).map(([key, value]) => `${key}: ${String(value)}`) : []).slice(0, 4)

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <Link href="/carelink/missions" className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
          <ChevronLeft size={18} /> Retour
        </Link>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.chips.map((chip) => (
            <span key={chip} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{chip}</span>
          ))}
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Prochaine action: {nextAction}</span>
        </div>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">{mission.code}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{mission.serviceType}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{familyContext} · {mission.zone}, {mission.city}</p>
          </div>
          <span className={cx('rounded-full px-3 py-2 text-xs font-black ring-1', statusTone(mission.status))}>{statusLabel(mission.status)}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Risque" value={String(mission.riskLevel || 'normal').toUpperCase()} tone={riskTone(mission.riskLevel)} />
          <MiniStat label="Préparation" value={readinessLabel(mission.readinessStatus)} tone={statusTone(mission.readinessStatus)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Contrôles" value={`${checklistProgress}%`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Rapport" value={String(mission.reportStatus || 'not_required').toUpperCase()} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
        </div>
      </div>

      <div className="mx-5 mt-5 space-y-5">
        <DetailCard title="Informations">
          <InfoRow icon={<Clock3 size={18} />} label="Horaires" value={`${mission.dateLabel} · ${mission.timeLabel}`} />
          <InfoRow icon={<MapPin size={18} />} label="Zone" value={`${mission.city} · ${mission.zone}`} />
          <InfoRow icon={<UserRound size={18} />} label="Client" value={familyContext} />
          <InfoRow icon={<UserRound size={18} />} label="Bénéficiaire" value={beneficiaryContext} />
          <InfoRow icon={<Phone size={18} />} label="Code" value={mission.code} />
          <InfoRow icon={<Navigation size={18} />} label="Prochaine action" value={nextAction} />
        </DetailCard>

        <ActionGrid mission={mission} runAction={runAction} busyAction={busy} />

        <DetailCard title="Lifecycle de mission">
          <div className="space-y-3">
            {events.slice(0, 8).map((event, index) => (
              <div key={String(event.id || index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{eventLabel(String(event.event_type || 'event'))}</p>
                    <p className="mt-1 text-xs text-slate-500">{String(event.content || 'Événement terrain')}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-500">{String(event.created_at || '').slice(11, 16) || '—'}</span>
                </div>
              </div>
            ))}
            {!events.length ? <p className="text-sm font-semibold text-slate-500">Aucun événement auditable pour cette mission.</p> : null}
          </div>
        </DetailCard>

        <DetailCard title="Consignes opérationnelles">
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            {mission.title ? <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">{mission.title}</li> : null}
            <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">Respecter les consignes de la liaison opérationnelle et confirmer toute anomalie immédiatement.</li>
            <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">Maintenir la traçabilité du pointage, du trajet et du rapport final.</li>
            {serviceNotes.length ? serviceNotes.map((note) => <li key={note} className="rounded-2xl bg-sky-50 p-3 text-sky-950">{note}</li>) : null}
          </ul>
        </DetailCard>

        <DetailCard title="Service et programme">
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <InfoRow icon={<ClipboardCheck size={18} />} label="Type de service" value={`${mission.serviceType} · ${mission.serviceFamily}`} />
            <InfoRow icon={<Star size={18} />} label="Caractéristiques" value={`Préparation ${mission.readinessStatus} · Validation ${mission.validationStatus} · Risque ${mission.riskLevel}`} />
            <InfoRow icon={<Clock3 size={18} />} label="Séquence" value={`${parameterDays.length || 0} jour(s) paramétrés · ${programLines.length || 0} ligne(s) programme`} />
            <div className="space-y-2">
              {programLines.slice(0, 4).map((line, index) => (
                <div key={String(line.id || index)} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{String(line.label || line.title || line.name || `Ligne ${index + 1}`)}</p>
                  <p className="mt-1 text-xs text-slate-500">{String(line.description || line.note || line.value || 'Programme opérationnel')}</p>
                </div>
              ))}
              {!programLines.length ? <p className="text-sm text-slate-500">Aucune ligne programme enregistrée.</p> : null}
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Transport et itinéraire">
          <div className="space-y-2">
            {routeRows.slice(0, 3).map((row, index) => (
              <p key={index} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                {String((row as any).from || (row as any).origin || 'Départ')} → {String((row as any).to || (row as any).destination || 'Arrivée')}
              </p>
            ))}
            {!routeRows.length ? <p className="text-sm text-slate-500">Aucune donnée d’itinéraire pour cette mission.</p> : null}
            <InfoRow icon={<Navigation size={18} />} label="Transport" value={String(dossier?.transport ? (dossier.transport as any).mode || (dossier.transport as any).label || 'Disponible' : 'Non précisé')} />
            <InfoRow icon={<Route size={18} />} label="Circuit" value={String(dossier?.raw?.mission_scope || dossier?.raw?.service_family || mission.serviceFamily)} />
          </div>
        </DetailCard>

        <DetailCard title="Liste de contrôle opérationnelle">
          <div className="space-y-3">
            {checklistItems.length ? checklistItems.map((item) => (
              <label key={String(item.id)} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <input
                  type="checkbox"
                  checked={Boolean(item.completed)}
                  onChange={(event) => runAction(mission, 'checklist', { itemId: String(item.id), completed: event.target.checked, notes: `Contrôle ${String(item.label || item.title || item.code || 'terrain')}` })}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <span className="min-w-0">
                  <p className="font-black text-slate-950">{String(item.label || item.title || item.code || item.serviceType || 'Tâche')}</p>
                  <p className="mt-1 text-xs text-slate-500">{String(item.description || item.category || 'Contrôle opérationnel')}</p>
                </span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">{item.required ? 'Requis' : 'Optionnel'}</span>
              </label>
            )) : <p className="text-sm font-semibold text-slate-500">Aucune sous-mission disponible.</p>}
          </div>
        </DetailCard>

        <DetailCard title="Rapport structuré">
          <div className="space-y-3">
            {reportData ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Rapport existant: {String(reportData.status || 'submitted')} · {String(reportData.validation_status || 'ready')}</p> : null}
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Résumé de mission" />
            <textarea value={observations} onChange={(event) => setObservations(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Observations terrain" />
            <textarea value={activities} onChange={(event) => setActivities(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Activités réalisées, séparées par des virgules" />
            <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Recommandations / suite" />
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={incidentFlag} onChange={(event) => setIncidentFlag(event.target.checked)} className="h-4 w-4 accent-rose-600" />
              Incident signalé dans le rapport
            </label>
            <button
              disabled={busy === `${mission.id}:report`}
              onClick={() => runAction(mission, 'report', {
                summary: summary || reportData?.summary || '',
                observations: observations || reportData?.observations || '',
                activities: activities.split(',').map((item) => item.trim()).filter(Boolean).map((item) => ({ label: item })),
                checklistSnapshot: checklistItems.map((item) => ({ id: item.id, label: item.label || item.title || item.code, completed: Boolean(item.completed), required: Boolean(item.required) })),
                incidentFlag,
                recommendations: recommendations || reportData?.recommendations || '',
              })}
              className="w-full rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              Soumettre le rapport structuré
            </button>
          </div>
        </DetailCard>

        <DetailCard title="Liaison opérationnelle">
          <div className="space-y-3">
            {dispatchMessages.length ? dispatchMessages.map((message) => (
              <div key={String(message.id || message.created_at)} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{String(message.subject || message.sender_type || 'Liaison opérationnelle')}</p>
                <p className="mt-1 text-xs text-slate-500">{String(message.body || message.content || '')}</p>
              </div>
            )) : <p className="text-sm font-semibold text-slate-500">Aucun fil de liaison opérationnelle enregistré.</p>}
          </div>
        </DetailCard>

        <DetailCard title="Alertes et conformité">
          <div className="space-y-2">
            {alerts.length ? alerts.map((alert, index) => (
              <p key={String(alert.id || index)} className={cx('rounded-2xl p-3 text-sm font-semibold', index === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800')}>
                {String(alert.title || alert.type || 'Alerte')} · {String(alert.body || alert.description || 'Escalade terrain')}
              </p>
            )) : <p className="text-sm text-slate-500">Aucune alerte de mission active.</p>}
            {documents.length ? documents.map((document, index) => (
              <p key={String(document.id || index)} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                {String(document.document_type || document.documentType || 'Document')} · {String(document.status || document.reviewStatus || 'pending')}
              </p>
            )) : <p className="text-sm text-slate-500">Aucun document ou conformité à afficher.</p>}
          </div>
        </DetailCard>

        <DetailCard title="Paiement et validation">
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<CreditCard size={18} />} label="Indemnités" value={allowances ? 'Disponibles' : 'Aucune indemnité visible'} />
            <InfoRow icon={<ClipboardCheck size={18} />} label="Validation" value={String(mission.validationStatus || 'pending')} />
            <InfoRow icon={<BellRing size={18} />} label="Rapport" value={String(mission.reportStatus || 'not_required')} />
            <InfoRow icon={<FileText size={18} />} label="Règles" value={String(reportData?.status || 'Aucun rapport persistant')} />
            <InfoRow icon={<CreditCard size={18} />} label="Disputes" value={disputes.length ? `${disputes.length} correction(s) liée(s)` : 'Aucune correction'} />
            <InfoRow icon={<CreditCard size={18} />} label="Notifications" value={notifications.length ? `${notifications.length} liaison(s)` : 'Aucune notification mission'} />
          </div>
        </DetailCard>

        <DetailCard title="Journal d’événements">
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{eventLabel(event.event_type)}</p>
                <p className="mt-1 text-xs text-slate-500">{event.content}</p>
              </div>
            ))}
            {!events.length ? <p className="text-sm font-bold text-slate-400">Aucun événement en direct.</p> : null}
          </div>
        </DetailCard>

        <DetailCard title="Audit rapide">
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<FileText size={18} />} label="Rapport" value={reportData ? `${String(reportData.status || 'submitted')} · ${String(reportData.validation_status || 'ready')}` : 'Aucun rapport persistant'} />
            <InfoRow icon={<FileText size={18} />} label="Rapports liés" value={`${reports.length || 0}`} />
            <InfoRow icon={<FileText size={18} />} label="Contrôles" value={`${checklistItems.filter((item) => Boolean(item.required) && !Boolean(item.completed)).length} requis restants`} />
            <InfoRow icon={<FileText size={18} />} label="Chronologie" value={`${events.length} événements audités`} />
          </div>
        </DetailCard>

        <DetailCard title="Évaluation rapide">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Évaluation
              <input type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full" />
              <span className="mt-1 block text-xs font-semibold text-slate-500">{rating} / 5</span>
            </label>
            <button disabled={busy === `${mission.id}:report`} onClick={() => runAction(mission, 'report', { summary, observations, recommendations, activities, incidentFlag })} className="w-full rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white disabled:opacity-50">
              Mettre à jour le rapport
            </button>
          </div>
        </DetailCard>
      </div>
    </section>
  )
}

function ScheduleScreen({ records }: { records: MissionControlRecord[] }) {
  const meta = routeMeta('schedule', null)
  const days = Array.from(new Set(records.map((item) => item.dateLabel || 'Non planifiée')))
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length
  const routeWarnings = records.filter((item) => ['incident', 'cancelled', 'no_show'].includes(item.status) || ['critical', 'high'].includes(String(item.riskLevel || '').toLowerCase())).length
  const upcomingSessions = records.filter((item) => item.subMissionCount > 0 || item.missionKind === 'dossier').length

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric label="JOURS" value={days.length} />
          <Metric label="CONFIRM." value={pendingConfirmations} />
          <Metric label="SESSIONS" value={upcomingSessions} />
          <Metric label="ALERTES" value={routeWarnings} />
        </div>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-slate-950 p-4 text-white shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-200">Vue planning en direct</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">Blocages, disponibilités et sessions récurrentes sont affichés à partir des missions publiées. Si aucune plage n’existe, le système reste visible et prêt à recevoir la liaison opérationnelle.</p>
      </div>
      <div className="mt-5 space-y-5 px-5">
        {days.map((day) => (
          <div key={day}>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-blue-600">{day}</p>
            <div className="space-y-3">
              {records.filter((item) => (item.dateLabel || 'Non planifiée') === day).map((mission) => (
                <Link key={mission.id} href={`/carelink/missions/${mission.id}`} className="grid grid-cols-[64px_1fr] gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="relative text-sm font-black text-blue-600">
                    <span>{missionTime(mission).split(' ')[0]}</span>
                    <span className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-blue-100" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950">{mission.familyName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{mission.serviceType} · {mission.zone}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {!records.length ? <EmptyState title="Aucun planning chargé" body="Le système de planning est opérationnel. Les sessions publiées apparaîtront dans cette chronologie dès synchronisation." /> : null}
      </div>
    </section>
  )
}

function MessagesScreen({
  records,
  workspace,
  messages,
  runCareLinkAction,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  messages: Array<{ id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('normal')
  const threads = workspace?.dispatchThreads || []
  const meta = routeMeta('messages', workspace)
  const unreadCount = threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0)

  async function sendMessage() {
    if (!body.trim()) return
    try {
      const mission = records[0] || null
      await runCareLinkAction('/api/carelink/messages', {
        subject: subject.trim() || null,
        body: body.trim(),
        priority,
        missionId: mission?.id || null,
        caregiverId: workspace?.agent?.id ? Number(workspace.agent.id) : null,
        senderType: 'agent',
        recipientType: 'liaison_operationnelle',
        threadKey: mission ? `mission:${mission.id}` : 'global:liaison',
        metadata: { source: 'carelink_mobile', mission_code: mission?.code || null },
      })
      setBody('')
      setSubject('')
      setPriority('normal')
    } catch {
      // The offline queue will retry if the network fails.
    }
  }

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-xl shadow-amber-100">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-50">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="FILS" value={threads.length} />
            <Metric label="NON LUES" value={unreadCount} />
            <Metric label="MESSAGES" value={messages.length} />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Rédaction</p>
          <div className="mt-3 space-y-3">
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Objet court" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message à la liaison opérationnelle..." className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
            <div className="flex flex-wrap items-center gap-2">
              {(['normal', 'high', 'critical'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setPriority(value)} className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em]', priority === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600')}>
                  {value === 'normal' ? 'Normal' : value === 'high' ? 'Priorité' : 'Critique'}
                </button>
              ))}
              <button onClick={sendMessage} className="ml-auto rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white">Envoyer</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Pris en compte', 'En route', 'Besoin d’appui', 'Je transmets ma localisation'].map((quickReply) => (
                <button
                  key={quickReply}
                  type="button"
                  onClick={() => {
                    setBody(quickReply)
                    setPriority(quickReply.includes('localisation') ? 'high' : 'normal')
                  }}
                  className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 ring-1 ring-slate-200"
                >
                  {quickReply}
                </button>
              ))}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const mission = records[0] || null
                    await runCareLinkAction('/api/carelink/messages', {
                      subject: 'Localisation en direct',
                      body: 'Localisation terrain transmise depuis CareLink mobile.',
                      priority: 'high',
                      missionId: mission?.id || null,
                      caregiverId: workspace?.agent?.id ? Number(workspace.agent.id) : null,
                      senderType: 'agent',
                      recipientType: 'liaison_operationnelle',
                      threadKey: mission ? `mission:${mission.id}` : 'global:liaison',
                      metadata: { source: 'carelink_mobile', type: 'location' },
                    })
                  } catch {}
                }}
                className="rounded-full bg-sky-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100"
              >
                Envoyer localisation
              </button>
              <a href={workspace?.agent?.phone ? `tel:${workspace.agent.phone}` : '/carelink/safety'} className="rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                Appeler la liaison opérationnelle
              </a>
            </div>
          </div>
        </section>

        {threads.length ? threads.map((thread) => (
          <article key={thread.id} className={cx('rounded-[2rem] border p-4 shadow-sm', thread.priority === 'critical' ? 'border-rose-200 bg-rose-50' : thread.priority === 'high' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Fil mission</p>
                <h3 className="mt-1 text-base font-black text-slate-950">{thread.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{thread.lastMessage}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200">{thread.unreadCount} non lue{thread.unreadCount > 1 ? 's' : ''}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {thread.missionId ? <Link href={`/carelink/missions/${thread.missionId}`} className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Ouvrir la mission</Link> : <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">Fil global de liaison opérationnelle</span>}
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">{thread.priority === 'critical' ? 'Critique' : thread.priority === 'high' ? 'Prioritaire' : 'Normal'}</span>
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">{thread.status}</span>
            </div>
          </article>
        )) : <EmptyState title="Aucune liaison opérationnelle persistante" body="Les fils mission et le fil global apparaîtront ici dès qu’un message sera envoyé ou reçu." />}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Messages récents</p>
          <div className="mt-3 space-y-2">
            {messages.slice(0, 5).map((message) => (
              <div key={message.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{message.title}</p>
                <p className="mt-1 text-sm text-slate-600">{message.body}</p>
              </div>
            ))}
            {!messages.length ? <p className="text-sm text-slate-500">Aucun message enregistré.</p> : null}
          </div>
        </section>
      </div>
    </section>
  )
}

function ProfileScreen({
  records,
  workspace,
  runCareLinkAction,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const completed = records.filter((item) => ['completed', 'closed'].includes(item.status)).length
  const active = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(item.status)).length
  const alerts = records.filter((item) => ['incident', 'cancelled'].includes(item.status)).length
  const documents = (workspace?.documents || []) as Array<{ id: string; documentType: string; status: string; reviewStatus: string; expiresAt: string | null; fileUrl: string | null }>
  const agent = workspace?.agent || workspace?.profile || {}
  const meta = routeMeta('profile', workspace)
  const [documentType, setDocumentType] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const zones = Array.from(new Set(records.map((item) => item.zone).filter(Boolean)))
  const skills = safeArray<string>(agent.skills).length ? safeArray<string>(agent.skills) : safeArray<string>(agent.requiredSkills)
  const languages = safeArray<string>(agent.languages)
  const emergencyContacts = safeArray<Record<string, unknown>>(agent.emergencyContacts || agent.emergency_contacts)
  const reliability = Number(agent.reliabilityScore || agent.reliability_score || workspace?.stats?.reliabilityScore || 0)
  const performance = Number(agent.performanceScore || agent.performance_score || workspace?.stats?.performanceScore || 0)
  const serviceEligibility = safeArray<string>(agent.serviceEligibility || agent.services || []).length ? safeArray<string>(agent.serviceEligibility || agent.services || []) : Array.from(new Set(records.map((item) => item.serviceType)))

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-blue-600 text-2xl font-black text-white">{String(agent.avatarInitials || agent.initials || 'AC')}</div>
          <h1 className="mt-4 text-2xl font-black">{String(agent.fullName || agent.full_name || agent.name || 'Agent terrain')}</h1>
          <p className="mt-1 text-sm text-slate-500">{String(agent.role || agent.jobTitle || 'Spécialiste terrain')} · {String(agent.city || 'Ville en attente')}</p>
          <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Disponible</span>
        </div>
      </div>
      <div className="mt-5 space-y-5 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="ACTIVES" value={active} />
          <Metric label="TERMINÉES" value={completed} />
          <Metric label="ALERTES" value={alerts} />
          <Metric label="TOTAL" value={records.length} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Fiabilité" value={`${reliability}%`} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
          <MiniStat label="Performance" value={`${performance}%`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Zones" value={zones.length} tone="bg-indigo-50 text-indigo-700 ring-indigo-100" />
          <MiniStat label="Services" value={serviceEligibility.length} tone="bg-amber-50 text-amber-700 ring-amber-100" />
        </div>
        <DetailCard title="Identité et disponibilité" icon={<UserRound size={18} />}>
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<UserRound size={18} />} label="Statut" value={String(agent.status || agent.complianceStatus || 'actif')} />
            <InfoRow icon={<Phone size={18} />} label="Téléphone" value={String(agent.phone || agent.mobile || '—')} />
            <InfoRow icon={<Navigation size={18} />} label="Langues" value={languages.length ? languages.join(' · ') : '—'} />
            <InfoRow icon={<ShieldCheck size={18} />} label="Zones couvertes" value={zones.length ? zones.join(' · ') : '—'} />
          </div>
        </DetailCard>
        <DetailCard title="Zones de service" icon={<MapPin size={18} />}>
          <div className="flex flex-wrap gap-2">{zones.length ? zones.map((zone) => <span key={zone} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{zone}</span>) : <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Aucune zone publiée</span>}</div>
        </DetailCard>
        <DetailCard title="Compétences validées" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">
            {skills.length ? skills.map((skill) => <p key={skill} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{skill}</p>) : (
              <>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Conformité opérationnelle active</p>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Traçabilité des missions respectée</p>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Rapports et pointages prêts</p>
              </>
            )}
          </div>
        </DetailCard>
        <DetailCard title="Services éligibles" icon={<ClipboardCheck size={18} />}>
          <div className="flex flex-wrap gap-2">
            {serviceEligibility.length ? serviceEligibility.map((service) => <span key={service} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{service}</span>) : <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Aucun service déclaré</span>}
          </div>
        </DetailCard>
        <DetailCard title="Documents et conformité" icon={<FileText size={18} />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">Statut vérification : <b className="text-slate-950">VALIDÉ</b>. Conformité opérationnelle : <b className="text-slate-950">CONFORME</b>.</p>
            <div className="space-y-2">
              {documents.length ? documents.map((document) => (
                <div key={document.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{document.documentType}</p>
                  <p className="mt-1 text-xs text-slate-500">{document.status} · {document.reviewStatus}{document.expiresAt ? ` · Expire le ${document.expiresAt.slice(0, 10)}` : ''}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Aucun document actif détecté.</p>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Document / revue</p>
              <div className="mt-3 space-y-2">
                <input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Type de document" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <input value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="URL du document (si disponible)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (!documentType.trim()) return
                      try {
                        await runCareLinkAction('/api/carelink/profile/documents', {
                          documentType: documentType.trim(),
                          fileUrl: documentUrl.trim() || null,
                          expiresAt: expiresAt || null,
                        })
                        setDocumentType('')
                        setDocumentUrl('')
                        setExpiresAt('')
                      } catch {}
                    }}
                    className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={async () => {
                      if (!documentType.trim()) return
                      try {
                        await runCareLinkAction('/api/carelink/readiness/review-request', {
                          documentType: documentType.trim(),
                          note: reviewNote || 'Revue documentaire demandée depuis le profil CareLink mobile',
                        })
                      } catch {}
                    }}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white"
                  >
                    Demander revue
                  </button>
                </div>
                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Note de revue..." className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          </div>
        </DetailCard>
        <DetailCard title="Contacts d’urgence" icon={<Phone size={18} />}>
          <div className="space-y-2">
            {emergencyContacts.length ? emergencyContacts.map((contact, index) => (
              <div key={String(contact.id || index)} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{String(contact.name || contact.full_name || contact.label || `Contact ${index + 1}`)}</p>
                <p className="mt-1 text-xs text-slate-500">{String(contact.phone || contact.number || contact.value || '—')}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Aucun contact d’urgence disponible.</p>}
          </div>
        </DetailCard>
      </div>
    </section>
  )
}

function SafetyScreen({
  workspace,
  records,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const safetyRows = safeArray<{ label: string; value: string }>(workspace?.workspaces.safety)
  const meta = routeMeta('safety', workspace)
  const nextMission = records[0] || null
  const incidentHistory = safeArray<Record<string, unknown>>(workspace?.history).filter((item) => String(item.status || '').toLowerCase().includes('incident') || String(item.title || '').toLowerCase().includes('incident'))
  const emergencyPhone = firstString(workspace?.agent?.emergencyPhone, workspace?.agent?.emergency_phone, (workspace as any)?.emergencyPhone, (workspace as any)?.emergency_phone)
  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <Link href="/carelink" className="inline-flex items-center gap-2 text-sm font-black text-slate-500"><ChevronLeft size={18} /> Retour</Link>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-rose-500 text-4xl font-black text-white shadow-[0_22px_65px_rgba(244,63,94,0.28)]">SOS</div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.35em] text-rose-600">{meta.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{meta.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{meta.description}</p>
      </div>
      <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
        <a href={workspace?.agent?.phone ? `tel:${workspace.agent.phone}` : '/carelink/messages'} className="rounded-[1.7rem] bg-slate-950 px-4 py-4 text-center text-sm font-black text-white">Appeler la liaison opérationnelle</a>
        <a href={emergencyPhone ? `tel:${emergencyPhone}` : '/carelink/messages'} className="rounded-[1.7rem] bg-rose-700 px-4 py-4 text-center text-sm font-black text-white">Appeler urgence</a>
        <a href="/carelink/safety" className="rounded-[1.7rem] bg-rose-600 px-4 py-4 text-center text-sm font-black text-white">SOS</a>
        <button onClick={() => runCareLinkAction('/api/carelink/messages', { body: 'Localisation terrain envoyée depuis CareLink Safety', senderType: 'agent', recipientType: 'liaison_operationnelle', priority: 'high', metadata: { type: 'location' } })} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Envoyer la localisation</button>
        {nextMission ? <button onClick={() => { void runCareLinkAction(`/api/carelink/missions/${nextMission.id}/incident`, { note: 'Incident signalé depuis la page sécurité', source: 'carelink_mobile' }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-rose-700 ring-1 ring-rose-200">Déclarer incident</button> : null}
        {nextMission ? <button onClick={() => { void runCareLinkAction(`/api/carelink/missions/${nextMission.id}/request-replacement`, { note: 'Demande de remplacement depuis la page sécurité', source: 'carelink_mobile' }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Remplacement</button> : null}
        <button onClick={() => { void runCareLinkAction('/api/carelink/support', { note: 'Environnement jugé non sûr depuis CareLink Safety', category: 'safety', details: { source: 'carelink_mobile' } }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Zone non sûre</button>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {[
          ['Déclarer un incident', 'Documenter un incident'],
          ['Consignes de sécurité', 'Consulter les procédures de sécurité'],
          ['Contacts d’urgence', 'Appeler les contacts d’urgence'],
          ['Je suis en sécurité', 'Notifier la liaison opérationnelle'],
        ].map(([title, body]) => (
          <button key={title} className="flex w-full items-center justify-between rounded-[1.7rem] bg-white p-4 text-left shadow-sm ring-1 ring-slate-200">
            <span>
              <b className="block text-sm">{title}</b>
              <span className="text-xs text-slate-500">{body}</span>
            </span>
            <ChevronRight className="text-slate-300" />
          </button>
        ))}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Protocole d’urgence</p>
        <p className="mt-2 text-sm text-slate-600">1. Prévenir la liaison opérationnelle. 2. Appeler l’urgence si nécessaire. 3. Envoyer la localisation. 4. Déclarer l’incident. 5. Demander un remplacement si la mission ne peut pas continuer.</p>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Trajet du jour</p>
            <h2 className="mt-1 text-xl font-black">Itinéraire intelligent</h2>
          </div>
          <Wifi size={18} className="text-blue-300" />
        </div>
        <p className="text-sm text-slate-600">Gardez le pointage, le trajet et les confirmations à jour pour maintenir la traçabilité complète.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {safetyRows.map((item) => (
            <div key={String(item.label)} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">{item.label}</p>
              <p className="mt-1 text-sm font-black text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">{records.some((record) => record.status === 'incident') ? 'Un incident est actif dans la file de mission.' : 'Aucun incident actif dans votre file de mission.'}</p>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Historique sécurité</p>
        <div className="mt-3 space-y-2">
          {incidentHistory.length ? incidentHistory.slice(0, 4).map((item, index) => (
            <div key={String(item.id || index)} className="rounded-2xl bg-rose-50 p-3">
              <p className="text-sm font-black text-rose-800">{String(item.title || 'Incident')}</p>
              <p className="mt-1 text-xs text-rose-700">{String(item.body || '')}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Aucun incident récent visible dans l’audit sécurité.</p>}
        </div>
      </div>
    </section>
  )
}

function CalendarScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const meta = routeMeta('calendar', workspace)
  const days = workspace?.calendar.byDate || []
  const density = workspace?.calendar.density || 0
  const recurringSessions = records.filter((item) => item.subMissionCount > 0 || item.missionKind === 'dossier').length
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Mois', 'Semaine', 'Jour'].map((value) => <span key={value} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{value}</span>)}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Metric label="JOURS" value={days.length} />
            <Metric label="MISSIONS" value={records.length} />
            <Metric label="DENSITÉ" value={`${density}%`} />
            <Metric label="CONFIRM." value={pendingConfirmations} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            Sessions récurrentes visibles: {recurringSessions}. Les points de densité et les disponibilités sont dérivés des missions réelles synchronisées.
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">
        {days.length ? days.map((day) => (
          <div key={day.date} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">{day.date}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{day.count} mission{day.count > 1 ? 's' : ''}</h2>
              </div>
              <BellRing className="text-slate-300" size={18} />
            </div>
            <div className="mt-4 space-y-2">
              {day.missions.map((mission) => <MissionCard key={mission.id} mission={mission} runAction={() => {}} busy={null} />)}
            </div>
          </div>
        )) : <EmptyState title="Calendrier vide" body="La structure calendrier est active. Les missions et disponibilités apparaîtront ici dès synchronisation." />}
      </div>
    </section>
  )
}

function NotificationsScreen({
  workspace,
  records,
  notifications,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  notifications: CareLinkMobileNotification[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const meta = routeMeta('notifications', workspace)
  const unreadCount = localNotifications.filter((item) => item.unread).length
  const criticalCount = localNotifications.filter((item) => item.priority === 'critical').length

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="NON LUES" value={unreadCount} />
            <Metric label="CRITIQUES" value={criticalCount} />
            <Metric label="MISSIONS" value={records.length} />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {localNotifications.length ? localNotifications.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <span className={cx('rounded-full px-3 py-1 text-[10px] font-black ring-1', item.priority === 'critical' ? 'bg-rose-50 text-rose-700 ring-rose-100' : item.priority === 'high' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-sky-50 text-sky-700 ring-sky-100')}>
                {item.unread ? 'Non lue' : 'Lue'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <Link href={item.missionId ? `/carelink/missions/${item.missionId}` : '/carelink/missions'} className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Ouvrir la mission</Link>
              <button
                onClick={async () => {
                  try {
                    await runCareLinkAction(`/api/carelink/notifications/${item.id}/acknowledge`, { missionId: item.missionId || null, note: `Notification ${item.id} reconnue depuis CareLink mobile` })
                    setLocalNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)))
                  } catch {}
                }}
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
              >
                Accuser réception
              </button>
            </div>
          </article>
        )) : <EmptyState title="Aucune notification en attente" body="Les rappels de mission, validations, paiements et conformité apparaîtront ici dès qu’ils seront publiés." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-amber-50 p-4 ring-1 ring-amber-100">
        <p className="text-sm font-black text-amber-900">Rappels récents</p>
        <div className="mt-3 space-y-2">
          {records.slice(0, 3).map((record) => <p key={record.id} className="rounded-2xl bg-white p-3 text-sm font-semibold text-amber-800">{record.serviceType} · {record.status}</p>)}
        </div>
      </div>
    </section>
  )
}

function AlertsScreen({
  workspace,
  records,
  alerts,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  alerts: CareLinkMobileAlert[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const [localAlerts, setLocalAlerts] = useState(alerts)
  const meta = routeMeta('alerts', workspace)
  const criticalCount = localAlerts.filter((alert) => alert.tone === 'red').length
  const amberCount = localAlerts.filter((alert) => alert.tone === 'amber').length

  useEffect(() => {
    setLocalAlerts(alerts)
  }, [alerts])

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-rose-600 to-amber-500 p-5 text-white shadow-xl shadow-rose-100">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rose-50">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-rose-50">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="CRITIQUES" value={criticalCount} />
            <Metric label="AMBER" value={amberCount} />
            <Metric label="MISSIONS" value={records.length} />
          </div>
        </div>
      </div>
      {criticalCount ? (
        <div className="mx-5 mt-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <p className="text-sm font-black">Alerte critique active</p>
          <p className="mt-1 text-sm leading-6">Traitez les alertes rouges immédiatement. La liaison opérationnelle et la sécurité doivent être contactées sans délai.</p>
        </div>
      ) : null}
      <div className="mt-5 space-y-3 px-5">
        {localAlerts.length ? localAlerts.map((alert) => {
          const mission = records.find((item) => String(item.id) === String(alert.missionId))
          return (
            <article key={alert.id} className={cx('rounded-[2rem] border p-4 shadow-sm', alert.tone === 'red' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50')}>
              <h2 className="text-base font-black text-slate-950">{alert.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{alert.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mission ? <Link href={`/carelink/missions/${mission.id}`} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Ouvrir</Link> : null}
                {mission ? <button onClick={async () => {
                  try {
                    await runCareLinkAction(`/api/carelink/alerts/${alert.id}/acknowledge`, { missionId: mission.id, note: `Alerte ${alert.id} reconnue depuis CareLink mobile` })
                    setLocalAlerts((current) => current.map((entry) => (entry.id === alert.id ? { ...entry, tone: 'emerald' } : entry)))
                  } catch {}
                }} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Accuser réception</button> : null}
                {mission ? <button onClick={() => runCareLinkAction(`/api/carelink/missions/${mission.id}/incident`, { note: `Incident signalé depuis l’alerte ${alert.id}`, source: 'carelink_mobile' })} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white">Déclarer incident</button> : null}
                <Link href="/carelink/messages" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Contacter la liaison opérationnelle</Link>
              </div>
            </article>
          )
        }) : <EmptyState title="Aucune alerte critique" body="Le centre d’alertes reste actif. Les risques terrain, incidents et escalades apparaîtront ici dès qu’ils sont publiés." />}
      </div>
    </section>
  )
}

function HistoryScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const meta = routeMeta('history', workspace)
  const history = workspace?.history || []
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const filters = ['Tous', 'Missions', 'Incidents', 'Rapports', 'Finance', 'Conformité']

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => <span key={filter} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{filter}</span>)}
          </div>
        </div>
      </div>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <Metric label="ÉVÉNEMENTS" value={history.length} />
        <Metric label="DISPUTES" value={disputes.length} />
        <Metric label="DOCUMENTS" value={documents.length} />
        <Metric label="MISSIONS" value={records.length} />
      </div>
      <div className="mt-5 space-y-3 px-5">
        {history.length ? history.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{item.status}</span>
            </div>
            {item.missionId ? <Link href={`/carelink/missions/${item.missionId}`} className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Ouvrir la mission</Link> : null}
          </article>
        )) : <EmptyState title="Aucun élément d’audit" body="Le journal d’événements, les incidents, les rapports et les éléments conformité apparaîtront ici dès qu’ils seront synchronisés." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">{records.length} missions suivies · {history.length} lignes d’audit</p>
      </div>
    </section>
  )
}

function PaymentsScreen({
  workspace,
  records,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const payments = workspace?.payments
  const disputes = (workspace?.paymentDisputes || []) as Array<{ id: string; missionId: number | null; amountClaimed: number | null; reason: string; status: string; createdAt: string }>
  const meta = routeMeta('payments', workspace)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [missionId, setMissionId] = useState<string>('')

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="GAGNÉ" value={`${payments?.earned || 0} DH`} />
            <Metric label="EN ATTENTE" value={`${payments?.pendingValidation || 0} DH`} />
            <Metric label="PAYÉ" value={`${payments?.paid || 0} DH`} />
            <Metric label="PROCHAIN" value={`${payments?.upcomingPayment || 0} DH`} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <MiniStat label="Primes" value={`${payments?.bonuses || 0} DH`} tone="bg-indigo-50 text-indigo-700 ring-indigo-100" />
        <MiniStat label="Transport" value={`${payments?.transport || 0} DH`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
        <MiniStat label="Indemnités" value={`${payments?.allowances || 0} DH`} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
        <MiniStat label="Litiges" value={disputes.length} tone="bg-rose-50 text-rose-700 ring-rose-100" />
      </div>
      <div className="mt-5 space-y-3 px-5">
        {payments?.lines?.length ? payments.lines.map((line) => (
          <article key={line.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{line.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{line.kind} · {line.status}</p>
              </div>
              <p className="text-lg font-black text-slate-950">{line.amountMad} DH</p>
            </div>
          </article>
        )) : <EmptyState title="Aucune indemnité trouvée" body="Les montants apparaîtront ici dès qu’ils seront validés par finance et liés à une mission réelle." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Correction paiement</p>
        <div className="mt-3 space-y-3">
          <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400">
            <option value="">Mission liée (optionnel)</option>
            {records.map((record) => <option key={record.id} value={record.id}>{record.code} · {record.serviceType}</option>)}
          </select>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Montant contesté (MAD/DH)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif de la correction..." className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
          <button
            onClick={async () => {
              if (!reason.trim()) return
              try {
                await runCareLinkAction('/api/carelink/payments/disputes', {
                  missionId: missionId ? Number(missionId) : null,
                  amountClaimed: amount ? Number(amount) : null,
                  reason: reason.trim(),
                })
                setReason('')
                setAmount('')
                setMissionId('')
              } catch {}
            }}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Soumettre la correction
          </button>
        </div>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
        <p className="text-sm font-black text-emerald-900">Corrections en cours</p>
        <div className="mt-3 space-y-2">
          {disputes.length ? disputes.map((dispute) => (
            <div key={dispute.id} className="rounded-2xl bg-white p-3">
              <p className="text-sm font-black text-slate-950">{dispute.reason}</p>
              <p className="mt-1 text-xs text-slate-500">{dispute.status} · {dispute.amountClaimed ? `${currencyDh(dispute.amountClaimed)}` : 'Montant non précisé'}</p>
            </div>
          )) : <p className="text-sm text-slate-600">Aucune correction en cours.</p>}
        </div>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
        <p className="text-sm font-black text-emerald-900">Mission liées au paiement: {records.filter((record) => ['completed', 'report_pending', 'in_progress'].includes(record.status)).length}</p>
      </div>
    </section>
  )
}

function ReadinessScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const readiness = workspace?.readiness
  const meta = routeMeta('readiness', workspace)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const expiredDocuments = documents.filter((document) => {
    const expiresAt = document.expiresAt ? new Date(String(document.expiresAt)).getTime() : null
    return String(document.status || document.reviewStatus || '').toLowerCase() === 'expired' || String(document.reviewStatus || '').toLowerCase() === 'review_requested' || (expiresAt != null && expiresAt < Date.now())
  })
  const pendingReviewDocuments = documents.filter((document) => String(document.reviewStatus || '').toLowerCase() === 'review_requested' || String(document.reviewStatus || '').toLowerCase() === 'pending')
  const serviceEligibility = records.length ? Array.from(new Set(records.map((record) => record.serviceType))) : []
  const zoneEligibility = records.length ? Array.from(new Set(records.map((record) => record.zone))) : []
  const noBlockers = !(readiness?.blockers?.length || readiness?.warnings?.length || expiredDocuments.length || pendingReviewDocuments.length)

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
      </div>
      <div className="mt-5 px-5">
        <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-200">Score</p>
          <div className="mt-2 text-5xl font-black">{readiness?.score || 0}%</div>
          <p className="mt-2 text-sm leading-6 text-slate-200">{readiness?.nextAction || 'Agent prêt pour exécution terrain'}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">
        <DetailCard title="Blocages" icon={<AlertTriangle size={18} />}>
          {readiness?.blockers?.length ? readiness.blockers.map((blocker) => <p key={blocker} className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{blocker}</p>) : <p className="text-sm text-slate-500">Aucun blocage critique.</p>}
        </DetailCard>
        <DetailCard title="Documents" icon={<FileText size={18} />}>
          <div className="space-y-2">
            {expiredDocuments.length ? expiredDocuments.map((document) => <p key={String(document.id)} className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{String(document.documentType || document.document_type || 'Document')} · expiré ou à renouveler</p>) : <p className="text-sm text-slate-500">Aucun document expiré.</p>}
            {pendingReviewDocuments.length ? pendingReviewDocuments.map((document) => <p key={String(document.id)} className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{String(document.documentType || document.document_type || 'Document')} · revue en attente</p>) : <p className="text-sm text-slate-500">Aucune revue documentaire en attente.</p>}
          </div>
        </DetailCard>
        <DetailCard title="Points de vigilance" icon={<CheckCircle2 size={18} />}>
          {readiness?.warnings?.length ? readiness.warnings.map((warning) => <p key={warning} className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{warning}</p>) : <p className="text-sm text-slate-500">Aucune vigilance ouverte.</p>}
        </DetailCard>
        <DetailCard title="Éligibilité" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">
            <InfoRow icon={<ShieldCheck size={18} />} label="Services" value={serviceEligibility.length ? serviceEligibility.join(' · ') : 'Aucun service publié'} />
            <InfoRow icon={<MapPin size={18} />} label="Zones" value={zoneEligibility.length ? zoneEligibility.join(' · ') : 'Aucune zone publiée'} />
            <InfoRow icon={<ClipboardCheck size={18} />} label="Documents expirés" value={String(expiredDocuments.length)} />
            <InfoRow icon={<FileText size={18} />} label="Revue" value={String(pendingReviewDocuments.length)} />
          </div>
        </DetailCard>
        <DetailCard title="Actions conformité" icon={<CheckCircle2 size={18} />}>
          <div className="flex flex-wrap gap-2">
            <Link href="/carelink/profile" className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Mettre à jour le profil</Link>
            <Link href="/carelink/profile" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">Mettre à jour les documents</Link>
            <Link href="/carelink/support" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">Demander une revue</Link>
          </div>
        </DetailCard>
        <DetailCard title="Services visibles" icon={<ShieldCheck size={18} />}>
          <div className="flex flex-wrap gap-2">{records.slice(0, 6).map((record) => <span key={record.id} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">{record.serviceType}</span>)}</div>
        </DetailCard>
        {noBlockers ? <EmptyState title="Aucun blocage détecté" body="La préparation est visible et prête. Les documents, compétences et disponibilités sont suivis en temps réel." /> : null}
      </div>
    </section>
  )
}

function SupportScreen({
  workspace,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const support = workspace?.support || []
  const meta = routeMeta('support', workspace)
  const supportHistory = safeArray<Record<string, unknown>>(workspace?.history).filter((item) => String(item.status || '').toLowerCase().includes('support') || String(item.title || '').toLowerCase().includes('support'))
  const [note, setNote] = useState('')

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.chips.map((chip) => <span key={chip} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{chip}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {support.map((item) => (
          <Link key={item.id} href={item.href || '/carelink/messages'} className="block rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <LifeBuoy className="text-slate-300" size={18} />
            </div>
          </Link>
        ))}
      </div>
      <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
        <Metric label="Demandes" value={support.length} />
        <Metric label="Historique" value={supportHistory.length} />
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-sky-50 p-4 ring-1 ring-sky-100">
        <p className="text-sm font-black text-sky-900">Actions d’assistance rapides</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/carelink/messages" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Message à la liaison opérationnelle</Link>
          <Link href="/carelink/payments" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Paiements</Link>
          <Link href="/carelink/safety" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Sécurité</Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Liaison</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Finance</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Supervision</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Technique</span>
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Décrivez le besoin d’assistance..." className="mt-3 min-h-24 w-full rounded-2xl border border-sky-200 bg-white p-3 text-sm outline-none" />
        <button
          onClick={async () => {
            if (!note.trim()) return
            try {
              await runCareLinkAction('/api/carelink/support', {
                note: note.trim(),
                category: 'mobile_support',
                details: { source: 'carelink_mobile' },
              })
              setNote('')
            } catch {}
          }}
          className="mt-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
        >
          Créer une demande
        </button>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Historique d’assistance</p>
        <div className="mt-3 space-y-2">
          {supportHistory.length ? supportHistory.slice(0, 4).map((item, index) => (
            <div key={String(item.id || index)} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-950">{String(item.title || 'Assistance')}</p>
              <p className="mt-1 text-xs text-slate-500">{String(item.body || '')}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Aucune demande d’assistance antérieure n’est visible.</p>}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-black text-blue-600">{value}</p>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  )
}

function EnterpriseMiniModule({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </Link>
  )
}

function QuickTile({
  href,
  icon,
  title,
  subtitle,
  tone,
}: {
  href: string
  icon: ReactNode
  title: string
  subtitle: string
  tone: 'blue' | 'amber' | 'rose' | 'emerald'
}) {
  const toneClasses = tone === 'blue'
    ? 'bg-blue-50 text-blue-700 ring-blue-100'
    : tone === 'amber'
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
        : 'bg-rose-50 text-rose-700 ring-rose-100'

  return (
    <Link href={href} className={cx('rounded-[1.4rem] p-3 ring-1 shadow-sm transition active:scale-[0.99]', toneClasses)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{subtitle}</p>
        </div>
        <span className="rounded-full bg-white/80 p-2 text-current">{icon}</span>
      </div>
    </Link>
  )
}

function PreviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length ? items.map((item, index) => (
          <p key={`${title}-${index}`} className="rounded-2xl bg-white p-3 text-xs leading-5 text-slate-600 shadow-sm">
            {item}
          </p>
        )) : <p className="rounded-2xl bg-white p-3 text-xs leading-5 text-slate-500 shadow-sm">{empty}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title, action, href }: { title: string; action: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <Link href={href} className="text-sm font-black text-blue-600">{action}</Link>
    </div>
  )
}

function DarkRoutePreview({ records }: { records: MissionControlRecord[] }) {
  const next = records[0] || null
  return (
    <div className="rounded-[1.8rem] bg-slate-950 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">Trajet du jour</p>
          <h2 className="mt-1 text-xl font-black">{next ? next.serviceType : 'Aucune mission de trajet'}</h2>
        </div>
        <Wifi size={18} className="text-blue-300" />
      </div>
      <div className="grid gap-3">
        <div className="rounded-3xl bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Statut</p>
          <p className="mt-1 text-sm font-black">{next ? statusLabel(next.status) : 'En attente'}</p>
        </div>
        <div className="rounded-3xl bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Prochaine fenêtre</p>
          <p className="mt-1 text-sm font-black">{next ? `${next.dateLabel || '—'} · ${next.timeLabel || '—'}` : 'À planifier'}</p>
        </div>
      </div>
    </div>
  )
}

function missionTime(record: MissionControlRecord) {
  const raw = record.timeLabel || ''
  if (!raw || raw === '—') return 'À planifier'
  return raw
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={cx('rounded-2xl px-3 py-3 ring-1', tone)}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function DetailCard({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sky-600">
        {icon}
        <h2 className="text-sm font-black tracking-[0.18em] text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><div className="text-sky-600">{icon}</div><div><p className="text-[10px] font-black tracking-[0.25em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-950">{value}</p></div></div>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>
}

function ActionGrid({ mission, runAction, busyAction, compact = false }: { mission: MissionControlRecord; runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void; busyAction: string | null; compact?: boolean }) {
  const actions = compact
    ? [{ key: 'accept', label: 'Accepter', primary: true }, { key: 'decline', label: 'Refuser', primary: false }]
    : [
      { key: 'accept', label: 'Accepter', primary: true },
      { key: 'readiness', label: 'Préparation', primary: false },
      { key: 'en-route', label: 'En route', primary: true },
      { key: 'delay', label: 'Retard', primary: false },
      { key: 'arrived', label: 'Arrivée', primary: true },
      { key: 'check-in', label: 'Pointer', primary: false },
      { key: 'start', label: 'Démarrer', primary: true },
      { key: 'checklist', label: 'Contrôles', primary: false },
      { key: 'complete', label: 'Terminer', primary: true },
      { key: 'report', label: 'Rapport', primary: false },
      { key: 'incident', label: 'Incident', primary: false },
      { key: 'request-replacement', label: 'Remplacement', primary: false },
    ]

  return (
    <div className={cx('mt-4 grid gap-2', 'grid-cols-2')}>
      {actions.map((action) => (
        <button
          key={action.key}
          disabled={busyAction === `${mission.id}:${action.key}`}
          onClick={() => runAction(mission, action.key, { source: 'carelink_mobile' })}
          className={cx(
            'rounded-2xl px-3 py-3 text-xs font-black transition active:scale-[0.99]',
            action.primary ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-700',
            busyAction === `${mission.id}:${action.key}` && 'opacity-60',
          )}
        >
          {busyAction === `${mission.id}:${action.key}` ? 'Synchronisation...' : action.label}
        </button>
      ))}
    </div>
  )
}

function ToastMessage({ toast }: { toast: Exclude<Toast, null> }) {
  return <div className={cx('fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-full px-4 py-3 text-sm font-black shadow-xl', toast.tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}>{toast.text}</div>
}

function BottomNav({ active }: { active: CareLinkMobileView }) {
  const items = [
    { key: 'home', href: '/carelink', icon: <Home size={19} />, label: 'Accueil' },
    { key: 'missions', href: '/carelink/missions', icon: <ClipboardCheck size={19} />, label: 'Missions' },
    { key: 'schedule', href: '/carelink/schedule', icon: <CalendarDays size={19} />, label: 'Planning' },
    { key: 'messages', href: '/carelink/messages', icon: <MessageCircle size={19} />, label: 'Messages' },
    { key: 'profile', href: '/carelink/profile', icon: <UserRound size={19} />, label: 'Profil' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 shadow-[0_-18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <Link key={item.key} href={item.href} className={cx('flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-black transition', active === item.key ? 'bg-[#06285e] text-white' : 'text-slate-400')}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
