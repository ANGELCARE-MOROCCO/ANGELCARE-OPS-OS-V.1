'use client'

import Link from 'next/link'
import { useCareLinkRealtime } from '@/lib/carelink/realtime'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Siren,
  UserRound,
  WalletCards,
} from 'lucide-react'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function moneyDh(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
}

function firstText(...values: unknown[]) {
  return String(values.find((value) => typeof value === 'string' && value.trim()) || '')
}

function formatHour(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return 'Aujourd’hui'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function statusLabel(status: unknown) {
  const labels: Record<string, string> = {
    assigned: 'ASSIGNÉE',
    agent_notified: 'AGENT INFORMÉ',
    agent_accepted: 'ACCEPTÉE',
    confirmed_by_dispatch: 'CONFIRMÉE DISPATCH',
    en_route: 'EN ROUTE',
    arrived: 'ARRIVÉE',
    started: 'DÉMARRÉE',
    in_progress: 'EN COURS',
    report_pending: 'RAPPORT ATTENDU',
    report_submitted: 'RAPPORT SOUMIS',
    completed: 'TERMINÉE',
    incident: 'INCIDENT',
    cancelled: 'ANNULÉE',
  }
  return labels[String(status || '')] || String(status || 'MISSION').replaceAll('_', ' ').toUpperCase()
}

export function CareLinkMobileCommandHome({ initialDashboard }: { initialDashboard: any }) {
  const { workspace: liveDashboard, connected, source, lastSyncedAt } = useCareLinkRealtime(initialDashboard || null)
  const dashboard = liveDashboard || initialDashboard || {}
  const agent = dashboard.agent || dashboard.profile || {}
  const stats = dashboard.stats || {}
  const finance = dashboard.payments || dashboard.compensations || dashboard.finance || {}
  const today = Array.isArray(dashboard.todayMissions) ? dashboard.todayMissions : []
  const upcoming = Array.isArray(dashboard.upcomingMissions) ? dashboard.upcomingMissions : []
  const missions = [...today, ...upcoming].filter(Boolean)
  const nextMission = dashboard.nextMission || missions[0] || null
  const alerts = Array.isArray(dashboard.alerts) ? dashboard.alerts : []
  const messages = Array.isArray(dashboard.messages) ? dashboard.messages : []

  const dispatchPhone = firstText(nextMission?.dispatcherPhone, dashboard.dispatchPhone, dashboard.dispatcherPhone, agent.dispatchPhone)
  const emergencyPhone = firstText(dashboard.emergencyPhone, dashboard.emergencyServicesPhone, agent.emergencyPhone)

  const todayCount = Number(stats.todayMissions || today.length || 0)
  const weekHours = Number(stats.weekHours || 0)
  const reliability = Number(stats.reliabilityScore || agent.reliabilityScore || 0)
  const readinessStatus = String(agent.readinessStatus || dashboard.readiness?.status || 'ready')
  const readiness = readinessStatus === 'ready' ? 'PRÊTE' : readinessStatus === 'warning' ? 'VIGILANCE' : readinessStatus === 'blocked' ? 'BLOQUÉE' : readinessStatus.toUpperCase()

  return (
    <main className="min-h-dvh bg-[#f5f9ff] pb-28 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/88 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-sm font-black text-white shadow-lg shadow-sky-200">
              AC
            </div>
            <div>
              <p className="text-sm font-black">AngelCare CareLink</p>
              <p className="text-xs font-bold text-slate-500">Commande agent terrain</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cx('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]', connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
              {connected ? 'En direct' : source === 'polling' ? 'Synchronisation' : 'Initialisation'}
            </span>
            <Link href="/carelink/safety" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
              <Siren size={19} />
              {alerts.length ? <span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white">{alerts.length}</span> : null}
            </Link>
          </div>
        </div>
        {lastSyncedAt ? <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dernière synchronisation · {new Date(lastSyncedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p> : null}
      </header>

      <section className="mx-auto max-w-md px-5 pt-5">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-slate-950 p-5 text-white shadow-[0_28px_80px_rgba(15,23,42,0.30)]">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-sky-500/35 blur-3xl" />
          <div className="absolute -bottom-20 left-4 h-52 w-52 rounded-full bg-emerald-400/25 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-200">Contrôle terrain en direct</p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
                  Bonjour, {String(agent.fullName || agent.full_name || agent.name || 'Agent').split(' ')[0]}
                </h1>
                <p className="mt-3 max-w-[19rem] text-sm leading-6 text-slate-200">
                  Missions, présence, dispatch, urgence, reporting et compensations dans un seul cockpit terrain.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                <ShieldCheck size={24} className="text-emerald-300" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <HeroMetric label="MISSIONS" value={todayCount} />
              <HeroMetric label="HEURES" value={`${weekHours}H`} />
              <HeroMetric label="SCORE" value={`${reliability}%`} />
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
                    <p className="mt-1 text-[10px] font-bold text-slate-500">{dispatchPhone || 'Centre messages'}</p>
                  </div>
                </div>
              </a>

              <a
                href={emergencyPhone ? `tel:${emergencyPhone}` : '/carelink/safety'}
                className="rounded-3xl bg-rose-500 px-4 py-4 text-white shadow-xl shadow-rose-500/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-white/15 p-3"><AlertTriangle size={19} /></span>
                  <div>
                    <p className="text-xs font-black">URGENCE</p>
                    <p className="mt-1 text-[10px] font-bold text-rose-50">{emergencyPhone || 'Tableau sécurité'}</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <LiveBoardCard icon={<CheckCircle2 size={18} />} label="PRÉPARATION" value={readiness} helper="Disponibilité et conformité" tone="emerald" />
          <LiveBoardCard icon={<Navigation size={18} />} label="TRAJET" value={nextMission ? 'PRÊT' : '—'} helper="Prochain déplacement terrain" tone="sky" />
          <LiveBoardCard icon={<MessageCircle size={18} />} label="MESSAGES" value={messages.length} helper="Liaison avec le dispatch" tone="indigo" />
          <LiveBoardCard icon={<AlertTriangle size={18} />} label="ALERTES" value={alerts.length} helper="Risques opérationnels" tone="amber" />
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-5 px-5 pt-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-600">Prochaine mission</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{nextMission?.serviceType || nextMission?.service_type || 'Aucune mission active'}</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {nextMission ? `${formatDay(nextMission.scheduledStart || nextMission.mission_date)} · ${formatHour(nextMission.scheduledStart || nextMission.start_time)}` : 'En attente d’une affectation du dispatch'}
              </p>
            </div>

            <Link href={nextMission ? `/carelink/missions/${nextMission.id}` : '/carelink/missions'} className="rounded-2xl bg-sky-50 p-3 text-sky-600">
              <ChevronRight size={20} />
            </Link>
          </div>

          {nextMission ? (
            <div className="mt-4 rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{nextMission.code || nextMission.mission_code || `MISSION-${nextMission.id}`}</p>
                  <h3 className="mt-2 text-lg font-black">{nextMission.clientName || nextMission.client_name || nextMission.family_name || 'Mission client'}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">{nextMission.city || '—'} · {nextMission.zone || '—'}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  {statusLabel(nextMission.status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniInfo icon={<MapPin size={14} />} text={nextMission.addressHint || nextMission.address || 'Adresse en attente'} />
                <MiniInfo icon={<HeartPulse size={14} />} text={nextMission.beneficiaryName || nextMission.beneficiary_name || 'Bénéficiaire'} />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Aucune mission en direct chargée. Les missions assignées apparaîtront ici depuis les opérations.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Paiements et compensations</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{moneyDh(finance.totalDue || finance.monthTotal || finance.total || stats.compensationTotal)}</h2>
            </div>
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><WalletCards size={22} /></span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <FinanceMiniCard label="À PAYER" value={moneyDh(finance.pending || finance.toPay || finance.due)} />
            <FinanceMiniCard label="PAYÉ" value={moneyDh(finance.paid || finance.settled)} />
            <FinanceMiniCard label="PRIMES" value={moneyDh(finance.bonuses || finance.compensations)} />
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Montants synchronisés depuis missions validées, indemnités, transport et validations finance disponibles.
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <QuickTile href="/carelink/missions" icon={<ClipboardCheck size={20} />} title="MISSIONS" subtitle="Confirmations et suivi" tone="sky" />
          <QuickTile href="/carelink/schedule" icon={<CalendarDays size={20} />} title="PLANNING" subtitle="Agenda terrain" tone="emerald" />
          <QuickTile href="/carelink/messages" icon={<MessageCircle size={20} />} title="DISPATCH" subtitle="Liaison opérationnelle" tone="amber" />
          <QuickTile href="/carelink/profile" icon={<UserRound size={20} />} title="PROFIL" subtitle="Conformité et zones" tone="violet" />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600">Tableau des opérations en direct</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">Alertes, blocages et actions terrain</h2>
            </div>
            <FileText className="text-amber-500" size={20} />
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length ? alerts.map((alert: any) => (
              <div key={alert.id || alert.title} className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="shrink-0 text-amber-600" size={20} />
                  <div>
                    <p className="text-sm font-black text-amber-900">{alert.title || 'Alerte opérationnelle'}</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">{alert.body || alert.description || 'Vérifiez les consignes du dispatch.'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                Aucune alerte terrain critique. Continuez de surveiller votre tableau de mission et les messages du dispatch.
              </div>
            )}
          </div>
        </section>
      </section>

      <MobileBottomNav />
    </main>
  )
}

function HeroMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  )
}

function LiveBoardCard({ icon, label, value, helper, tone }: { icon: any; label: string; value: any; helper: string; tone: 'emerald' | 'sky' | 'amber' | 'indigo' }) {
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

function MiniInfo({ icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
      <span className="text-sky-600">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  )
}

function QuickTile({ href, icon, title, subtitle, tone }: { href: string; icon: any; title: string; subtitle: string; tone: 'sky' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  }

  return (
    <Link href={href} className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]">
      <span className={cx('inline-grid h-11 w-11 place-items-center rounded-2xl', tones[tone])}>{icon}</span>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{subtitle}</p>
    </Link>
  )
}

function MobileBottomNav() {
  const items = [
    { href: '/carelink', label: 'Accueil', icon: <Home size={18} /> },
    { href: '/carelink/missions', label: 'Missions', icon: <ClipboardCheck size={18} /> },
    { href: '/carelink/schedule', label: 'Planning', icon: <CalendarDays size={18} /> },
    { href: '/carelink/messages', label: 'Messages', icon: <MessageCircle size={18} /> },
    { href: '/carelink/profile', label: 'Profil', icon: <UserRound size={18} /> },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/92 px-3 pb-3 pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-black text-slate-500">
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
