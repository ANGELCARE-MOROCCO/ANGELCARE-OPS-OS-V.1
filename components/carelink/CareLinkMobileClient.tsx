'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, FileText, Home, MapPin, MessageCircle, Navigation, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { CareLinkMobileGate } from './CareLinkMobileGate'
import type { CareLinkDashboard, CareLinkMission, CareLinkStatus } from '@/lib/carelink/types'

type View = 'home' | 'missions' | 'mission' | 'schedule' | 'messages' | 'profile'

type Props = {
  initialDashboard: CareLinkDashboard
  view?: View
  missionId?: string
}

const statusLabel: Record<CareLinkStatus, string> = {
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
    return dashboard.upcomingMissions.find((mission) => mission.id === missionId || mission.code === missionId) || dashboard.nextMission || dashboard.upcomingMissions[0]
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
          upcomingMissions: current.upcomingMissions.map((item) => item.id === mission.id ? { ...item, status: json.status, lastEventAt: new Date().toISOString() } : item),
          todayMissions: current.todayMissions.map((item) => item.id === mission.id ? { ...item, status: json.status, lastEventAt: new Date().toISOString() } : item),
          nextMission: current.nextMission?.id === mission.id ? { ...current.nextMission, status: json.status, lastEventAt: new Date().toISOString() } : current.nextMission,
        }))
      }
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <CareLinkMobileGate>
      <main className="min-h-screen bg-[#06101d] pb-28 text-white">
        {view === 'home' && <HomeView dashboard={dashboard} runAction={runAction} busyAction={busyAction} />}
        {view === 'missions' && <MissionsView missions={dashboard.upcomingMissions} runAction={runAction} busyAction={busyAction} />}
        {view === 'mission' && selectedMission && <MissionDetailView mission={selectedMission} runAction={runAction} busyAction={busyAction} />}
        {view === 'schedule' && <ScheduleView missions={dashboard.upcomingMissions} />}
        {view === 'messages' && <MessagesView dashboard={dashboard} />}
        {view === 'profile' && <ProfileView dashboard={dashboard} />}
        <BottomNav active={view === 'mission' ? 'missions' : view} />
      </main>
    </CareLinkMobileGate>
  )
}

function HeroShell({ children, eyebrow, title, subtitle }: { children: React.ReactNode; eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[radial-gradient(circle_at_20%_0%,#22d3ee_0%,#155e75_24%,#0f172a_62%,#06101d_100%)] px-5 pb-6 pt-7 shadow-2xl">
      <div className="absolute -right-16 top-4 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-100/80">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-cyan-50/85">{subtitle}</p>
        {children}
      </div>
    </section>
  )
}

function HomeView({ dashboard, runAction, busyAction }: { dashboard: CareLinkDashboard; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null }) {
  const mission = dashboard.nextMission
  return (
    <>
      <HeroShell eyebrow="AngelCare CareLink" title={`BONJOUR, ${dashboard.agent.fullName.split(' ')[0]}`} subtitle="Votre portail mobile terrain pour missions planifiées, présence, checklists, incidents et liaison dispatch.">
        <div className="mt-5 grid grid-cols-3 gap-3">
          <MetricCard label="MISSIONS" value={dashboard.stats.todayMissions} />
          <MetricCard label="HEURES" value={`${dashboard.stats.weekHours}H`} />
          <MetricCard label="FIABILITÉ" value={`${dashboard.stats.reliabilityScore}%`} />
        </div>
      </HeroShell>

      <section className="space-y-5 px-5 pt-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">PROCHAINE MISSION</p>
              <h2 className="mt-2 text-xl font-black">{mission?.serviceType || 'AUCUNE MISSION'}</h2>
            </div>
            <Bell className="text-cyan-200" />
          </div>
          {mission ? <MissionCompactCard mission={mission} runAction={runAction} busyAction={busyAction} /> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <QuickTile href="/carelink/missions" icon={<ClipboardCheck size={20} />} title="MISSIONS" subtitle="Accepter, suivre, clôturer" />
          <QuickTile href="/carelink/schedule" icon={<CalendarDays size={20} />} title="PLANNING" subtitle="Semaine & disponibilité" />
          <QuickTile href="/carelink/messages" icon={<MessageCircle size={20} />} title="DISPATCH" subtitle="Messages & alertes" />
          <QuickTile href="/carelink/profile" icon={<ShieldCheck size={20} />} title="PROFIL" subtitle="Documents & score" />
        </div>

        <div className="space-y-3">
          {dashboard.alerts.map((alert) => (
            <div key={alert.id} className="rounded-3xl border border-amber-200/20 bg-amber-300/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="shrink-0 text-amber-200" size={20} />
                <div>
                  <p className="text-sm font-black text-amber-100">{alert.title}</p>
                  <p className="mt-1 text-xs leading-5 text-amber-50/80">{alert.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function MissionsView({ missions, runAction, busyAction }: { missions: CareLinkMission[]; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null }) {
  return (
    <>
      <section className="bg-[#0b1424] px-5 pb-5 pt-7">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-black">MES MISSIONS</h1>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 text-xs font-black">
          {['AUJOURD’HUI', 'À VENIR', 'À CONFIRMER', 'TERMINÉES'].map((filter) => <span key={filter} className="shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2">{filter}</span>)}
        </div>
      </section>
      <section className="space-y-4 px-5 pt-5">
        {missions.map((mission) => <MissionCompactCard key={mission.id} mission={mission} runAction={runAction} busyAction={busyAction} expanded />)}
      </section>
    </>
  )
}

function MissionDetailView({ mission, runAction, busyAction }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(140deg,#0f172a,#172554,#083344)] px-5 pb-7 pt-7">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-200">{mission.code}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">{mission.serviceType}</h1>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-cyan-300 px-3 py-2 text-slate-950">{statusLabel[mission.status]}</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-white">{mission.zone}</span>
          <span className="rounded-full bg-white/10 px-3 py-2 text-white">{mission.hoursEstimate}H</span>
        </div>
      </section>
      <section className="space-y-5 px-5 pt-5">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
          <InfoRow icon={<Clock3 size={18} />} label="HORAIRES" value={`${formatDay(mission.scheduledStart)} · ${formatHour(mission.scheduledStart)} — ${formatHour(mission.scheduledEnd)}`} />
          <InfoRow icon={<MapPin size={18} />} label="ZONE" value={`${mission.city} · ${mission.zone} · ${mission.addressHint}`} />
          <InfoRow icon={<UserRound size={18} />} label="CLIENT" value={`${mission.clientName} · ${mission.beneficiaryName}${mission.beneficiaryAge ? ` · ${mission.beneficiaryAge}` : ''}`} />
        </div>

        <ActionGrid mission={mission} runAction={runAction} busyAction={busyAction} />

        <Panel title="CONSIGNES OPÉRATIONNELLES" icon={<Sparkles size={18} />}>
          <ul className="space-y-3 text-sm leading-6 text-slate-200">
            {mission.instructions.map((item) => <li key={item} className="rounded-2xl bg-white/5 p-3">{item}</li>)}
          </ul>
        </Panel>

        <Panel title="CHECKLIST TERRAIN" icon={<ClipboardCheck size={18} />}>
          <div className="space-y-3">
            {mission.checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <input type="checkbox" defaultChecked={item.completed} className="h-5 w-5 accent-cyan-300" />
                <span className="text-sm font-bold text-slate-100">{item.label}</span>
                {item.required ? <span className="ml-auto rounded-full bg-rose-400/20 px-2 py-1 text-[10px] font-black text-rose-100">OBLIGATOIRE</span> : null}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="SÉCURITÉ & INCIDENT" icon={<AlertTriangle size={18} />}>
          <div className="space-y-3 text-sm leading-6 text-slate-200">
            {mission.safetyNotes.map((item) => <p key={item} className="rounded-2xl bg-amber-300/10 p-3 text-amber-50">{item}</p>)}
            <button onClick={() => runAction(mission, 'incident', { title: 'Incident terrain signalé', severity: 'medium' })} className="w-full rounded-2xl bg-rose-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-rose-950/30">SIGNALER UN INCIDENT</button>
          </div>
        </Panel>
      </section>
    </>
  )
}

function ScheduleView({ missions }: { missions: CareLinkMission[] }) {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#312e81,#06101d)] px-5 pb-8 pt-7">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-200">Planning mobile</p>
        <h1 className="mt-2 text-3xl font-black">SEMAINE TERRAIN</h1>
        <div className="mt-6 rounded-[2rem] bg-white/10 p-4">
          <p className="text-sm leading-6 text-violet-50">Disponibilité active. Les missions programmées apparaissent avec heure, zone et niveau de priorité.</p>
        </div>
      </section>
      <section className="space-y-4 px-5 pt-5">
        {missions.map((mission, index) => (
          <div key={mission.id} className="grid grid-cols-[64px_1fr] gap-4 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4">
            <div className="rounded-3xl bg-white/10 p-3 text-center">
              <p className="text-2xl font-black">{index + 9}</p>
              <p className="text-[10px] font-black text-cyan-200">JUIN</p>
            </div>
            <div>
              <p className="text-xs font-black text-cyan-200">{formatHour(mission.scheduledStart)} — {formatHour(mission.scheduledEnd)}</p>
              <h2 className="mt-1 font-black">{mission.serviceType}</h2>
              <p className="mt-1 text-xs text-slate-300">{mission.zone} · {statusLabel[mission.status]}</p>
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
      <section className="bg-[radial-gradient(circle_at_top_right,#f59e0b,#0f172a_48%,#06101d)] px-5 pb-8 pt-7">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-100">Liaison dispatch</p>
        <h1 className="mt-2 text-3xl font-black">MESSAGES</h1>
      </section>
      <section className="space-y-4 px-5 pt-5">
        {dashboard.messages.map((message) => (
          <article key={message.id} className={cx('rounded-[2rem] border p-4', message.urgent ? 'border-amber-300/30 bg-amber-300/10' : 'border-white/10 bg-white/[0.07]')}>
            <div className="flex items-start gap-3">
              <MessageCircle className={message.urgent ? 'text-amber-200' : 'text-cyan-200'} size={20} />
              <div>
                <p className="text-sm font-black">{message.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{message.body}</p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{message.sender}</p>
              </div>
            </div>
          </article>
        ))}
        <button className="w-full rounded-3xl bg-cyan-300 px-4 py-4 text-sm font-black text-slate-950">NOUVEAU MESSAGE DISPATCH</button>
      </section>
    </>
  )
}

function ProfileView({ dashboard }: { dashboard: CareLinkDashboard }) {
  const agent = dashboard.agent
  return (
    <>
      <section className="bg-[linear-gradient(145deg,#064e3b,#0f172a_55%,#06101d)] px-5 pb-8 pt-7">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-300 text-2xl font-black text-emerald-950">{agent.fullName.slice(0, 2)}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100">{agent.agentCode}</p>
            <h1 className="mt-1 text-2xl font-black">{agent.fullName}</h1>
            <p className="text-sm text-emerald-50/80">{agent.role.replace(/_/g, ' ').toUpperCase()}</p>
          </div>
        </div>
      </section>
      <section className="space-y-5 px-5 pt-5">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="NOTE" value={agent.ratingScore} />
          <MetricCard label="FIABILITÉ" value={`${agent.reliabilityScore}%`} />
          <MetricCard label="DOCS" value={agent.documentsDue} />
          <MetricCard label="STATUT" value="OK" />
        </div>
        <Panel title="ZONES DE SERVICE" icon={<MapPin size={18} />}>
          <div className="flex flex-wrap gap-2">{agent.zones.map((zone) => <span key={zone} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">{zone}</span>)}</div>
        </Panel>
        <Panel title="COMPÉTENCES VALIDÉES" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">{agent.skills.map((skill) => <p key={skill} className="rounded-2xl bg-white/5 p-3 text-sm font-bold">{skill}</p>)}</div>
        </Panel>
        <Panel title="DOCUMENTS & CONFORMITÉ" icon={<FileText size={18} />}>
          <p className="text-sm leading-6 text-slate-200">Statut vérification : <b>{agent.verificationStatus.toUpperCase()}</b>. Conformité opérationnelle : <b>{agent.complianceStatus.toUpperCase()}</b>.</p>
        </Panel>
      </section>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-3xl border border-white/10 bg-white/10 p-3 text-center"><p className="text-[10px] font-black tracking-[0.25em] text-slate-300">{label}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>
}

function QuickTile({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return <Link href={href} className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-xl"><div className="text-cyan-200">{icon}</div><p className="mt-4 text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p></Link>
}

function MissionCompactCard({ mission, runAction, busyAction, expanded = false }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null; expanded?: boolean }) {
  return (
    <article className="mt-4 rounded-[2rem] border border-white/10 bg-[#101c2f] p-4 shadow-xl">
      <Link href={`/carelink/missions/${mission.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">{mission.code}</p>
            <h3 className="mt-2 text-lg font-black leading-tight">{mission.serviceType}</h3>
          </div>
          <ChevronRight className="text-slate-500" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
          <InfoPill icon={<Clock3 size={14} />} text={`${formatHour(mission.scheduledStart)} — ${formatHour(mission.scheduledEnd)}`} />
          <InfoPill icon={<MapPin size={14} />} text={`${mission.city} · ${mission.zone}`} />
          <InfoPill icon={<UserRound size={14} />} text={mission.clientName} />
          <InfoPill icon={<CheckCircle2 size={14} />} text={statusLabel[mission.status]} />
        </div>
      </Link>
      {expanded ? <p className="mt-4 text-sm leading-6 text-slate-300">{mission.instructions[0]}</p> : null}
      <ActionGrid mission={mission} runAction={runAction} busyAction={busyAction} compact />
    </article>
  )
}

function ActionGrid({ mission, runAction, busyAction, compact = false }: { mission: CareLinkMission; runAction: (mission: CareLinkMission, action: string, payload?: Record<string, any>) => void; busyAction: string | null; compact?: boolean }) {
  const actions = compact
    ? [{ key: 'accept', label: 'ACCEPTER' }, { key: 'decline', label: 'REFUSER' }]
    : [
      { key: 'accept', label: 'ACCEPTER' },
      { key: 'en-route', label: 'EN ROUTE' },
      { key: 'arrived', label: 'ARRIVÉ(E)' },
      { key: 'start', label: 'DÉMARRER' },
      { key: 'complete', label: 'TERMINER' },
      { key: 'report', label: 'RAPPORT' },
    ]
  return (
    <div className={cx('mt-4 grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-2')}>
      {actions.map((action) => (
        <button key={action.key} disabled={busyAction === `${mission.id}:${action.key}`} onClick={() => runAction(mission, action.key, { source: 'carelink_mobile' })} className={cx('rounded-2xl px-3 py-3 text-xs font-black transition', action.key === 'decline' ? 'bg-white/10 text-slate-100' : 'bg-cyan-300 text-slate-950', busyAction === `${mission.id}:${action.key}` && 'opacity-60')}>
          {busyAction === `${mission.id}:${action.key}` ? 'SYNC...' : action.label}
        </button>
      ))}
    </div>
  )
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">{icon}{text}</span>
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex gap-3 border-b border-white/10 py-3 last:border-0"><div className="text-cyan-200">{icon}</div><div><p className="text-[10px] font-black tracking-[0.25em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold leading-6 text-white">{value}</p></div></div>
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4"><div className="mb-4 flex items-center gap-2 text-cyan-200">{icon}<h2 className="text-sm font-black tracking-[0.18em] text-white">{title}</h2></div>{children}</section>
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
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[2rem] border border-white/10 bg-[#07111f]/95 px-2 py-2 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => <Link key={item.key} href={item.href} className={cx('flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-black', active === item.key ? 'bg-cyan-300 text-slate-950' : 'text-slate-400')}>{item.icon}<span>{item.label}</span></Link>)}
      </div>
    </nav>
  )
}
