'use client'

import AngelCareLogo from "@/components/brand/AngelCareLogo";
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { CareLinkMobileGate } from './CareLinkMobileGate'
import type { CareLinkDashboard, CareLinkMission, CareLinkStatus } from '@/lib/carelink/types'

type View = 'home' | 'missions' | 'mission' | 'schedule' | 'messages' | 'profile'

type Props = {
  initialDashboard: CareLinkDashboard
  view?: View
  missionId?: string
}

const statusLabel: Partial<Record<CareLinkStatus, string>> = {
  assigned: 'NOUVELLE MISSION',
  agent_notified: 'À CONFIRMER',
  agent_accepted: 'ACCEPTÉE',
  agent_declined: 'REFUSÉE',
  confirmed_by_dispatch: 'CONFIRMÉE DISPATCH',
  en_route: 'EN ROUTE',
  arrived: 'ARRIVÉ(E)',
  started: 'DÉMARRÉE',
  in_progress: 'EN COURS',
  completed: 'TERMINÉE',
  client_validated: 'VALIDÉE CLIENT',
  incident_reported: 'INCIDENT SIGNALÉ',
  cancelled: 'ANNULÉE',
  no_show: 'ABSENCE',
  closed: 'CLÔTURÉE',
}

const statusTone: Partial<Record<CareLinkStatus, string>> = {
  assigned: 'bg-sky-50 text-sky-700 ring-sky-100',
  agent_notified: 'bg-amber-50 text-amber-700 ring-amber-100',
  agent_accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  confirmed_by_dispatch: 'bg-blue-50 text-blue-700 ring-blue-100',
  en_route: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  arrived: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  started: 'bg-violet-50 text-violet-700 ring-violet-100',
  in_progress: 'bg-violet-50 text-violet-700 ring-violet-100',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
  incident_reported: 'bg-rose-50 text-rose-700 ring-rose-100',
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(value)).toUpperCase()
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function CareLinkMobileClient({ initialDashboard, view = 'home', missionId }: Props) {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const selectedMission = useMemo(() => {
    return (dashboard.upcomingMissions || []).find((mission) => mission.id === missionId || mission.code === missionId) || dashboard.nextMission || (dashboard.upcomingMissions || [])[0] || null
  }, [dashboard.upcomingMissions, dashboard.nextMission, missionId])

  async function runAction(mission: CareLinkMission, action: string, payload: Record<string, any> = {}) {
    setBusyAction(`${mission.id}:${action}`)
    try {
      const response = await fetch(`/api/carelink/missions/${mission.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => null)
      if (json?.ok && json.status) {
        setDashboard((current) => ({
          ...current,
          upcomingMissions: (current.upcomingMissions || []).map((item) => item.id === mission.id ? { ...item, status: json.status, lastEventAt: new Date().toISOString() } : item),
          todayMissions: (current.todayMissions || []).map((item) => item.id === mission.id ? { ...item, status: json.status, lastEventAt: new Date().toISOString() } : item),
          nextMission: current.nextMission?.id === mission.id ? { ...current.nextMission, status: json.status, lastEventAt: new Date().toISOString() } : current.nextMission,
        }))
      }
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <CareLinkMobileGate>
      <main className="min-h-dvh bg-[#f7fbff] pb-28 text-slate-950">
        {view === 'home' && <HomeView dashboard={dashboard} runAction={runAction} busyAction={busyAction} />}
        {view === 'missions' && <MissionsView missions={dashboard.upcomingMissions || []} runAction={runAction} busyAction={busyAction} />}
        {view === 'mission' && selectedMission && <MissionDetailView mission={selectedMission} runAction={runAction} busyAction={busyAction} />}
        {view === 'schedule' && <ScheduleView missions={dashboard.upcomingMissions || []} />}
        {view === 'messages' && <MessagesView dashboard={dashboard} />}
        {view === 'profile' && <ProfileView dashboard={dashboard} />}
        <BottomNav active={view === 'mission' ? 'missions' : view} />
      </main>
    </CareLinkMobileGate>
  )
}

function AppHeader({ dashboard, compact = false }: { dashboard: CareLinkDashboard; compact?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <Link href="/carelink" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-100 ring-1 ring-slate-100"><AngelCareLogo size="sm" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-600">CareLink</p>
            <p className="text-sm font-black text-slate-950">{compact ? 'PORTAIL TERRAIN' : String((dashboard.agent as any)?.name || (dashboard.agent as any)?.full_name || 'ANGELCARE FIELD AGENT')}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">Disponible</span>
          <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm" aria-label="Notifications"><Bell size={18} /></button>
        </div>
      </div>
    </header>
  )
}


function moneyDh(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
}

function firstPhone(...values: unknown[]) {
  const raw = values.find((value) => typeof value === 'string' && value.trim().length > 0)
  return String(raw || '')
}

function HomeView({
  dashboard,
  runAction,
  busyAction,
}: {
  dashboard: CareLinkDashboard
  runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void
  busyAction: string | null
}) {
  const mission = dashboard.nextMission || (dashboard.upcomingMissions || [])[0] || null
  const agent = (dashboard.agent || {}) as any
  const stats = (dashboard.stats || {}) as any
  const finance = ((dashboard as any).payments || (dashboard as any).compensations || (dashboard as any).finance || {}) as any
  const alerts = (((dashboard.alerts as any[]) || []))
  const dispatchPhone = firstPhone((mission as any)?.dispatcherPhone, (dashboard as any).dispatchPhone, (dashboard as any).dispatcherPhone, agent.dispatchPhone)
  const emergencyPhone = firstPhone((dashboard as any).emergencyPhone, (dashboard as any).emergencyServicesPhone, agent.emergencyPhone, '15')
  const todayMissions = Number(stats.todayMissions || (dashboard.todayMissions || []).length || 0)
  const weekHours = Number(stats.weekHours || 0)
  const reliability = Number(stats.reliabilityScore || agent.reliabilityScore || 0)
  const readinessStatus = String(agent.readinessStatus || (dashboard.readiness as any)?.status || 'ready')
  const readiness = readinessStatus === 'ready' ? 'PRÊTE' : readinessStatus === 'warning' ? 'VIGILANCE' : readinessStatus === 'blocked' ? 'BLOQUÉE' : readinessStatus.toUpperCase()
  const missionStatus = mission ? (statusLabel[mission.status] || String(mission.status || '').replaceAll('_', ' ').toUpperCase()) : 'AUCUNE MISSION EN DIRECT'

  return (
    <>
      <AppHeader dashboard={dashboard} />

      <section className="mx-auto max-w-md px-5 pt-5">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-slate-950 p-5 text-white shadow-[0_22px_70px_rgba(15,23,42,0.28)]">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-500/30 blur-2xl" />
          <div className="absolute -bottom-20 left-6 h-44 w-44 rounded-full bg-emerald-400/25 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-200">Commande agent terrain</p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
                  BONJOUR, {String(agent.fullName || agent.full_name || agent.name || 'AngelCare').split(' ')[0]}
                </h1>
                <p className="mt-3 max-w-[18rem] text-sm leading-6 text-slate-200">
                  Centre terrain complet pour missions, présence, urgences, paiements et liaison dispatch.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                <ShieldCheck size={24} className="text-emerald-300" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MetricCard label="MISSIONS" value={todayMissions} />
              <MetricCard label="HEURES" value={`${weekHours}H`} />
              <MetricCard label="SCORE" value={`${reliability}%`} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={dispatchPhone ? `tel:${dispatchPhone}` : '/carelink/messages'}
                className="rounded-3xl bg-white px-4 py-4 text-slate-950 shadow-xl shadow-slate-950/10 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-sky-50 p-3 text-sky-700"><Phone size={19} /></span>
                  <div>
                    <p className="text-xs font-black">APPELER LE DISPATCH</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500">Coordination en direct</p>
                  </div>
                </div>
              </a>

              <a
                href={`tel:${emergencyPhone}`}
                className="rounded-3xl bg-rose-500 px-4 py-4 text-white shadow-xl shadow-rose-500/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-white/15 p-3"><AlertTriangle size={19} /></span>
                  <div>
                    <p className="text-xs font-black">URGENCE</p>
                    <p className="mt-1 text-[10px] font-bold text-rose-50">Aide immédiate</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <LiveBoardCard icon={<CheckCircle2 size={18} />} label="PRÉPARATION" value={readiness} helper="Conformité et disponibilité" tone="emerald" />
          <LiveBoardCard icon={<Clock3 size={18} />} label="STATUT SUIVANT" value={missionStatus} helper="Cycle de vie de la mission" tone="sky" />
          <LiveBoardCard icon={<AlertTriangle size={18} />} label="ALERTES" value={alerts.length} helper="Nécessite une attention" tone="amber" />
          <LiveBoardCard icon={<Navigation size={18} />} label="TRAJET" value={mission ? 'PRÊT' : '—'} helper="Tableau des trajets terrain" tone="indigo" />
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-5 px-5 pt-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">PROCHAINE MISSION</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{mission?.serviceType || 'AUCUNE MISSION ACTIVE'}</h2>
              {mission ? (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatDay(String((mission as any).scheduledStart || new Date().toISOString()))} · {formatHour(String((mission as any).scheduledStart || new Date().toISOString()))}
                </p>
              ) : null}
            </div>

            <Link href={mission ? `/carelink/missions/${mission.id}` : '/carelink/missions'} className="rounded-2xl bg-sky-50 p-3 text-sky-600">
              <ChevronRight size={20} />
            </Link>
          </div>

          {mission ? (
            <MissionCompactCard mission={mission} runAction={runAction} busyAction={busyAction} />
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Aucune mission live chargée. Les missions assignées apparaîtront ici depuis le dispatch.
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">PAYMENTS & COMPENSATIONS</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{moneyDh(finance.totalDue || finance.monthTotal || finance.total || stats.compensationTotal)}</h2>
            </div>
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FileText size={20} /></span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <FinanceMiniCard label="À PAYER" value={moneyDh(finance.pending || finance.toPay || finance.due)} />
            <FinanceMiniCard label="PAYÉ" value={moneyDh(finance.paid || finance.settled)} />
            <FinanceMiniCard label="PRIMES" value={moneyDh(finance.bonuses || finance.compensations)} />
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Les montants sont synchronisés depuis les missions, indemnités, transport et validations finance lorsqu’ils sont disponibles.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <QuickTile href="/carelink/missions" icon={<ClipboardCheck size={20} />} title="MISSIONS" subtitle="File active & confirmations" tone="sky" />
          <QuickTile href="/carelink/schedule" icon={<CalendarDays size={20} />} title="PLANNING" subtitle="Agenda et disponibilité" tone="emerald" />
          <QuickTile href="/carelink/messages" icon={<MessageCircle size={20} />} title="DISPATCH" subtitle="Urgences et liaison" tone="amber" />
          <QuickTile href="/carelink/profile" icon={<ShieldCheck size={20} />} title="PROFIL" subtitle="Conformité et zones" tone="violet" />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600">LIVE OPERATIONS BOARD</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">Actions et alertes terrain</h2>
            </div>
            <Sparkles className="text-amber-500" size={20} />
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length ? alerts.map((alert: any) => (
              <div key={alert.id || alert.title} className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="shrink-0 text-amber-600" size={20} />
                  <div>
                    <p className="text-sm font-black text-amber-900">{alert.title || 'Operational alert'}</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">{alert.body || alert.description || 'Vérifiez les consignes du dispatch.'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                Aucune alerte terrain critique. Continuez à surveiller votre tableau de mission et les messages du dispatch.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function LiveBoardCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  helper: string
  tone: 'emerald' | 'sky' | 'amber' | 'indigo'
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={cx('rounded-2xl p-2 ring-1', tones[tone])}>{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      </div>
      <p className="mt-3 truncate text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{helper}</p>
    </div>
  )
}

function FinanceMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}


function MissionsView({ missions, runAction, busyAction }: { missions: CareLinkMission[]; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null }) {
  return (
    <>
      <section className="mx-auto max-w-md px-5 pt-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-xl shadow-sky-100">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-100">File de mission</p>
          <h1 className="mt-2 text-3xl font-black">MES MISSIONS</h1>
          <p className="mt-2 text-sm leading-6 text-sky-50">Priorisez les confirmations, préparez les départs et gardez chaque intervention traçable.</p>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs font-black">
          {['AUJOURD’HUI', 'À VENIR', 'À CONFIRMER', 'TERMINÉES'].map((filter, index) => (
            <span key={filter} className={cx('shrink-0 rounded-full px-4 py-2 ring-1', index === 0 ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>{filter}</span>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-md space-y-4 px-5 pt-5">
        {missions.map((mission) => <MissionCompactCard key={mission.id} mission={mission} runAction={runAction} busyAction={busyAction} expanded />)}
      </section>
    </>
  )
}

function MissionDetailView({ mission, runAction, busyAction }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null }) {
  const timeline = ['ACCEPTATION', 'EN ROUTE', 'ARRIVÉE', 'DÉMARRAGE', 'CLÔTURE']
  return (
    <>
      <section className="mx-auto max-w-md px-5 pt-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[3rem] bg-gradient-to-br from-sky-100 to-emerald-100" />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-600">{mission.code}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950">{mission.serviceType}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <StatusBadge status={mission.status} />
              <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">{mission.zone}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">{String((mission as any).hoursEstimate || (mission as any).hours_estimate || 0)}H</span>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {timeline.map((step, index) => <div key={step} className="text-center"><div className={cx('mx-auto h-2 rounded-full', index <= 1 ? 'bg-sky-500' : 'bg-slate-200')} /><p className="mt-2 text-[8px] font-black text-slate-500">{step}</p></div>)}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-md space-y-5 px-5 pt-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <InfoRow icon={<Clock3 size={18} />} label="HORAIRES" value={`${formatDay((mission as any).scheduledStart)} · ${formatHour((mission as any).scheduledStart)} — ${formatHour((mission as any).scheduledEnd)}`} />
          <InfoRow icon={<MapPin size={18} />} label="ZONE" value={`${mission.city} · ${mission.zone} · ${(mission as any).addressHint}`} />
          <InfoRow icon={<UserRound size={18} />} label="CLIENT" value={`${(mission as any).clientName} · ${(mission as any).beneficiaryName}${(mission as any).beneficiaryAge ? ` · ${(mission as any).beneficiaryAge}` : ''}`} />
          <InfoRow icon={<Phone size={18} />} label="DISPATCH" value={`${(mission as any).dispatcherName} · ${(mission as any).dispatcherPhone}`} />
        </div>

        <ActionGrid mission={mission} runAction={runAction} busyAction={busyAction} />

        <Panel title="CONSIGNES OPÉRATIONNELLES" icon={<Sparkles size={18} />}>
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            {mission.instructions.map((item) => <li key={item} className="rounded-2xl bg-sky-50 p-3 text-sky-950">{item}</li>)}
          </ul>
        </Panel>

        <Panel title="CHECKLIST TERRAIN" icon={<ClipboardCheck size={18} />}>
          <div className="space-y-3">
            {mission.checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <input type="checkbox" defaultChecked={Boolean((item as any).completed)} className="h-5 w-5 accent-sky-600" />
                <span className="text-sm font-bold text-slate-800">{String((item as any).label || (item as any).title || (item as any).name || (item as any).description || 'Checklist item')}</span>
                {Boolean((item as any).required) ? <span className="ml-auto rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">OBLIGATOIRE</span> : null}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="SÉCURITÉ & INCIDENT" icon={<AlertTriangle size={18} />}>
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            {(((mission as any).safetyNotes || []) as any[]).map((item: any) => <p key={item} className="rounded-2xl bg-amber-50 p-3 text-amber-900">{item}</p>)}
            <button onClick={() => runAction(mission, 'incident', { title: 'Incident terrain signalé', severity: 'medium' })} className="w-full rounded-2xl bg-rose-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-rose-100">SIGNALER UN INCIDENT</button>
          </div>
        </Panel>
      </section>
    </>
  )
}

function ScheduleView({ missions }: { missions: CareLinkMission[] }) {
  return (
    <>
      <section className="mx-auto max-w-md px-5 pt-6">
        <div className="rounded-[2rem] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">Planning mobile</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">SEMAINE TERRAIN</h1>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {['M', 'M', 'J', 'V', 'S', 'D', 'L'].map((day, index) => <div key={`${day}-${index}`} className={cx('rounded-2xl py-3 text-center text-xs font-black', index < 4 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>{day}<br /><span className="text-[10px]">{9 + index}</span></div>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-md space-y-4 px-5 pt-5">
        {missions.map((mission, index) => (
          <div key={mission.id} className="grid grid-cols-[64px_1fr] gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-3xl bg-slate-950 p-3 text-center text-white">
              <p className="text-2xl font-black">{index + 9}</p>
              <p className="text-[10px] font-black text-sky-200">JUIN</p>
            </div>
            <div>
              <p className="text-xs font-black text-sky-600">{formatHour((mission as any).scheduledStart)} — {formatHour((mission as any).scheduledEnd)}</p>
              <h2 className="mt-1 font-black text-slate-950">{mission.serviceType}</h2>
              <p className="mt-1 text-xs text-slate-500">{mission.zone} · {statusLabel[mission.status]}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

function MessagesView({ dashboard }: { dashboard: CareLinkDashboard }) {
  return (
    <>
      <section className="mx-auto max-w-md px-5 pt-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-xl shadow-amber-100">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-50">Liaison dispatch</p>
          <h1 className="mt-2 text-3xl font-black">MESSAGES</h1>
          <p className="mt-2 text-sm leading-6 text-amber-50">Un canal clair pour les urgences, clarifications de mission et décisions terrain.</p>
        </div>
      </section>
      <section className="mx-auto max-w-md space-y-4 px-5 pt-5">
        {((dashboard.messages as any[]) || []).map((message: any) => (
          <article key={message.id} className={cx('rounded-[2rem] border p-4 shadow-sm', message.urgent ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white')}>
            <div className="flex items-start gap-3">
              <span className={cx('rounded-2xl p-3', message.urgent ? 'bg-amber-100 text-amber-700' : 'bg-sky-50 text-sky-700')}><MessageCircle size={20} /></span>
              <div>
                <p className="text-sm font-black text-slate-950">{message.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{message.sender}</p>
              </div>
            </div>
          </article>
        ))}
        <button className="w-full rounded-3xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-200">NOUVEAU MESSAGE DISPATCH</button>
      </section>
    </>
  )
}

function ProfileView({ dashboard }: { dashboard: CareLinkDashboard }) {
  const agent = (dashboard.agent || {}) as any
  return (
    <>
      <section className="mx-auto max-w-md px-5 pt-6">
        <div className="rounded-[2rem] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-sky-500 text-2xl font-black text-white shadow-lg shadow-emerald-100">{agent.fullName.slice(0, 2)}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">{agent.agentCode}</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">{agent.fullName}</h1>
              <p className="text-sm text-slate-500">{agent.role.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-md space-y-5 px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="NOTE" value={agent.ratingScore} />
          <MetricCard label="FIABILITÉ" value={`${agent.reliabilityScore}%`} />
          <MetricCard label="DOCS" value={agent.documentsDue} />
          <MetricCard label="STATUT" value="OK" />
        </div>
        <Panel title="ZONES DE SERVICE" icon={<MapPin size={18} />}>
          <div className="flex flex-wrap gap-2">{(((agent as any).zones || []) as string[]).map((zone: string) => <span key={zone} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{zone}</span>)}</div>
        </Panel>
        <Panel title="COMPÉTENCES VALIDÉES" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">{(((agent as any).skills || []) as string[]).map((skill: string) => <p key={skill} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{skill}</p>)}</div>
        </Panel>
        <Panel title="DOCUMENTS & CONFORMITÉ" icon={<FileText size={18} />}>
          <p className="text-sm leading-6 text-slate-600">Statut vérification : <b className="text-slate-950">{agent.verificationStatus.toUpperCase()}</b>. Conformité opérationnelle : <b className="text-slate-950">{agent.complianceStatus.toUpperCase()}</b>.</p>
        </Panel>
      </section>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-3 text-center shadow-sm"><p className="text-[10px] font-black tracking-[0.25em] text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p></div>
}

function QuickTile({ href, icon, title, subtitle, tone }: { href: string; icon: ReactNode; title: string; subtitle: string; tone: 'sky' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  }
  return <Link href={href} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"><div className={cx('inline-flex rounded-2xl p-3 ring-1', tones[tone])}>{icon}</div><p className="mt-4 text-sm font-black text-slate-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p></Link>
}

function MissionCompactCard({ mission, runAction, busyAction, expanded = false }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null; expanded?: boolean }) {
  return (
    <article className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <Link href={`/carelink/missions/${mission.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600">{mission.code}</p>
            <h3 className="mt-2 text-lg font-black leading-tight text-slate-950">{mission.serviceType}</h3>
          </div>
          <ChevronRight className="text-slate-400" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
          <InfoPill icon={<Clock3 size={14} />} text={`${formatHour((mission as any).scheduledStart)} — ${formatHour((mission as any).scheduledEnd)}`} />
          <InfoPill icon={<MapPin size={14} />} text={`${mission.city} · ${mission.zone}`} />
          <InfoPill icon={<UserRound size={14} />} text={(mission as any).clientName} />
          <InfoPill icon={<CheckCircle2 size={14} />} text={statusLabel[mission.status] || String(mission.status || '').replaceAll('_', ' ').toUpperCase()} />
        </div>
      </Link>
      {expanded ? <p className="mt-4 text-sm leading-6 text-slate-600">{mission.instructions[0]}</p> : null}
      <ActionGrid mission={mission} runAction={runAction} busyAction={busyAction} compact />
    </article>
  )
}

function StatusBadge({ status }: { status: CareLinkStatus }) {
  return <span className={cx('rounded-full px-3 py-2 ring-1', statusTone[status] || 'bg-slate-100 text-slate-700 ring-slate-200')}>{statusLabel[status]}</span>
}

function ActionGrid({ mission, runAction, busyAction, compact = false }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null; compact?: boolean }) {
  const actions = compact
    ? [{ key: 'accept', label: 'ACCEPTER', primary: true }, { key: 'decline', label: 'REFUSER', primary: false }]
    : [
      { key: 'accept', label: 'ACCEPTER', primary: true },
      { key: 'en-route', label: 'EN ROUTE', primary: true },
      { key: 'arrived', label: 'ARRIVÉ(E)', primary: true },
      { key: 'start', label: 'DÉMARRER', primary: true },
      { key: 'complete', label: 'TERMINER', primary: true },
      { key: 'report', label: 'RAPPORT', primary: false },
    ]
  return (
    <div className={cx('mt-4 grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-2')}>
      {actions.map((action) => (
        <button key={action.key} disabled={busyAction === `${mission.id}:${action.key}`} onClick={() => runAction(mission, action.key, { source: 'carelink_mobile' })} className={cx('rounded-2xl px-3 py-3 text-xs font-black transition active:scale-[0.99]', action.primary ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-700', busyAction === `${mission.id}:${action.key}` && 'opacity-60')}>
          {busyAction === `${mission.id}:${action.key}` ? 'SYNC...' : action.label}
        </button>
      ))}
    </div>
  )
}

function InfoPill({ icon, text }: { icon: ReactNode; text: string }) {
  return <span className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-slate-100">{icon}{text}</span>
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><div className="text-sky-600">{icon}</div><div><p className="text-[10px] font-black tracking-[0.25em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-950">{value}</p></div></div>
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center gap-2 text-sky-600">{icon}<h2 className="text-sm font-black tracking-[0.18em] text-slate-950">{title}</h2></div>{children}</section>
}

function BottomNav({ active }: { active: View }) {
  const items = [
    { key: 'home', href: '/carelink', icon: <Home size={19} />, label: 'ACCUEIL' },
    { key: 'missions', href: '/carelink/missions', icon: <ClipboardCheck size={19} />, label: 'MISSIONS' },
    { key: 'schedule', href: '/carelink/schedule', icon: <CalendarDays size={19} />, label: 'PLANNING' },
    { key: 'messages', href: '/carelink/messages', icon: <MessageCircle size={19} />, label: 'DISPATCH' },
    { key: 'profile', href: '/carelink/profile', icon: <UserRound size={19} />, label: 'PROFIL' },
  ]
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white/95 px-2 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => <Link key={item.key} href={item.href} className={cx('flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-black transition', active === item.key ? 'bg-slate-950 text-white' : 'text-slate-400')}>{item.icon}<span>{String((item as any).label || (item as any).title || (item as any).name || (item as any).description || 'Checklist item')}</span></Link>)}
      </div>
    </nav>
  )
}
