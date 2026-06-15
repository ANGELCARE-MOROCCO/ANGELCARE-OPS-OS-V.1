'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type {
  OpsAlertCard,
  OpsAuditCard,
  OpsCalendarSnapshot,
  OpsDocumentCard,
  OpsEnterpriseSnapshot,
  OpsIncidentCard,
  OpsMessageThread,
  OpsMissionCard,
  OpsNotificationCard,
  OpsPaymentLine,
  OpsQualitySnapshot,
  OpsReadinessSnapshot,
  OpsReplacementSnapshot,
  OpsReportCard,
  OpsScheduleSnapshot,
  OpsSettingsSnapshot,
  OpsServiceConfigSnapshot,
  OpsWorkforceSnapshot,
} from '@/lib/carelink/ops-enterprise'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'
type AnyRecord = Record<string, any>

export type CareLinkOpsViewKey =
  | 'control-room'
  | 'missions'
  | 'agents'
  | 'schedule'
  | 'calendar'
  | 'incidents'
  | 'reports'
  | 'compliance'
  | 'settings'
  | 'quality'
  | 'workforce'
  | 'payments'
  | 'notifications'
  | 'messages'
  | 'audit'
  | 'service-config'
  | 'readiness'
  | 'replacements'
  | 'performance'

const enterpriseNav = []

type Props = {
  view: CareLinkOpsViewKey
  title: string
  subtitle: string
  apiPath: string
  initialSnapshot: OpsEnterpriseSnapshot
}

function fmt(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function toneClass(status?: string | null, risk?: string | null) {
  const s = String(status || '').toLowerCase()
  const r = String(risk || '').toLowerCase()
  if (['critical', 'high', 'incident', 'escalated'].includes(s) || ['critical', 'high'].includes(r)) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (['warning', 'pending', 'review_requested', 'open'].includes(s) || ['watch', 'elevated', 'medium'].includes(r)) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (['validated', 'completed', 'ready', 'closed'].includes(s) || ['green', 'normal'].includes(r)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function missionTone(status?: string | null, risk?: string | null) {
  const s = String(status || '').toLowerCase()
  const r = String(risk || '').toLowerCase()
  if (['critical', 'high', 'incident', 'cancelled', 'no_show'].includes(s) || ['critical', 'high'].includes(r)) return 'rose'
  if (['warning', 'pending', 'review_requested', 'open', 'draft'].includes(s) || ['watch', 'elevated', 'medium'].includes(r)) return 'amber'
  if (['validated', 'completed', 'ready', 'closed'].includes(s) || ['green', 'normal'].includes(r)) return 'emerald'
  if (['assigned', 'in_progress', 'confirmed', 'en_route'].includes(s)) return 'blue'
  return 'slate'
}

function statTone(index: number) {
  return ['blue', 'emerald', 'amber', 'violet', 'cyan', 'rose'][index % 6]
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Badge({ tone = 'slate', children }: { tone?: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${map[tone] || map.slate}`}>{children}</span>
}

function Stat({ label, value, helper, tone = 'blue' }: { label: string; value: string | number; helper?: string; tone?: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    violet: 'text-violet-700 bg-violet-50 border-violet-100',
    cyan: 'text-cyan-700 bg-cyan-50 border-cyan-100',
    rose: 'text-rose-700 bg-rose-50 border-rose-100',
    slate: 'text-slate-700 bg-slate-50 border-slate-100',
  }
  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${colors[tone] || colors.blue}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.24em] opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      {helper ? <div className="mt-1 text-xs font-medium opacity-80">{helper}</div> : null}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="text-base font-black text-slate-700">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{body}</p>
    </div>
  )
}

export function CareLinkOpsEnterpriseWorkspace({ view, title, subtitle, apiPath, initialSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(initialSnapshot.missions[0]?.id || null)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(initialSnapshot.agents[0]?.id || null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialSnapshot.messages[0]?.id || null)
  const [draftMessage, setDraftMessage] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftReason, setDraftReason] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [draftSetting, setDraftSetting] = useState('')
  const [draftConfig, setDraftConfig] = useState('')

  const selectedMission = useMemo(() => (snapshot.missions || []).find((item) => item.id === selectedMissionId) || null, [snapshot.missions, selectedMissionId])
  const selectedAgent = useMemo(() => (snapshot.agents || []).find((item) => item.id === selectedAgentId) || null, [snapshot.agents, selectedAgentId])
  const selectedThread = useMemo(() => (snapshot.messages || []).find((item) => item.id === selectedThreadId) || null, [snapshot.messages, selectedThreadId])
  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.missions
    return (snapshot.missions || []).filter((item) => [resolvedMissionCode(item), item.code, item.familyName, item.caregiverName, item.city, item.zone, item.serviceType, item.status, item.lifecycleStage].join(' ').toLowerCase().includes(q))
  }, [snapshot.missions, query])
  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.agents
    return (snapshot.agents || []).filter((item) => [item.fullName, item.city, item.zone, item.status, item.skills.join(' '), item.serviceEligibility.join(' ')].join(' ').toLowerCase().includes(q))
  }, [snapshot.agents, query])
  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.messages
    return (snapshot.messages || []).filter((item) => [item.title, item.body].join(' ').toLowerCase().includes(q))
  }, [snapshot.messages, query])
  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.alerts
    return (snapshot.alerts || []).filter((item) => [item.title, item.body, item.type].join(' ').toLowerCase().includes(q))
  }, [snapshot.alerts, query])
  const filteredNotifications = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.notifications
    return (snapshot.notifications || []).filter((item) => [item.title, item.body, item.type].join(' ').toLowerCase().includes(q))
  }, [snapshot.notifications, query])
  const filteredIncidents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.incidents
    return (snapshot.incidents || []).filter((item) => [item.title, item.summary, item.city, item.zone, item.status].join(' ').toLowerCase().includes(q))
  }, [snapshot.incidents, query])
  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.reports
    return (snapshot.reports || []).filter((item) => [item.missionCode, item.serviceType, item.status, item.validationStatus].join(' ').toLowerCase().includes(q))
  }, [snapshot.reports, query])
  const filteredDocuments = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.documents
    return (snapshot.documents || []).filter((item) => [item.caregiverName, item.documentType, item.status, item.reviewStatus].join(' ').toLowerCase().includes(q))
  }, [snapshot.documents, query])
  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return (snapshot.payments?.lines || [])
    return (snapshot.payments?.lines || []).filter((item) => [item.label, item.kind, item.status].join(' ').toLowerCase().includes(q))
  }, [(snapshot.payments?.lines || []), query])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setInterval> | null = null
    async function refresh() {
      setLoading(true)
      try {
        const res = await fetch(apiPath, { cache: 'no-store', headers: { Accept: 'application/json' } })
        const json = await res.json().catch(() => null)
        if (!alive) return
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Impossible de rafraîchir les données Ops')
        setSnapshot(json)
        setError('')
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Erreur de synchronisation Ops')
      } finally {
        if (alive) setLoading(false)
      }
    }
    refresh()
    timer = setInterval(refresh, safeRefreshInterval(30000))
    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
  }, [apiPath])

  async function postJson(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.ok === false) throw new Error(json?.error || json?.message || 'Action failed')
    const refreshed = await fetch(apiPath, { cache: 'no-store', headers: { Accept: 'application/json' } })
    const next = await refreshed.json().catch(() => null)
    if (refreshed.ok && next?.ok) setSnapshot(next)
    return json
  }

  const lastSync = snapshot.live.lastEventAt || snapshot.live.lastDispatchMessageAt || snapshot.generatedAt

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <div className="min-h-screen">
        

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-8 py-5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">CareLink Ops Enterprise</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{title}</h2>
                <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">Mise à jour {fmt(snapshot.generatedAt)}</div>
                <button onClick={() => setQuery('')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50">Réinitialiser</button>
                <button onClick={() => postJson(apiPath, { action: 'refresh' }).catch(() => undefined)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">{loading ? 'Rafraîchissement…' : 'Rafraîchir'}</button>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto border-t border-slate-100 pt-3">
              {([] as any[]).map((item) => (
                <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-black ${item.key === view ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher missions, agents, incidents, rapports, documents…" className="min-w-[320px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-300 focus:bg-white" />
              <Badge tone={snapshot.summary.atRiskMissions ? 'rose' : 'emerald'}>{snapshot.summary.atRiskMissions ? `${snapshot.summary.atRiskMissions} à risque` : 'Aucun risque majeur'}</Badge>
              <Badge tone="blue">{snapshot.summary.messagesUnread} messages non lus</Badge>
              <Badge tone="amber">{snapshot.summary.paymentDisputes} litiges</Badge>
              <Badge tone="violet">{snapshot.summary.complianceBlockers} blocages conformité</Badge>
            </div>
          </header>

          <div className="space-y-5 px-8 py-6">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Stat label="Missions" value={snapshot.summary.missions} helper="Dossiers actifs et historiques" tone="blue" />
              <Stat label="Agents prêts" value={snapshot.summary.readyAgents} helper="Readiness opérationnel" tone="emerald" />
              <Stat label="Incidents" value={snapshot.summary.incidents} helper="Command center" tone="rose" />
              <Stat label="Rapports" value={snapshot.summary.reportsPending} helper="En attente de validation" tone="amber" />
              <Stat label="Messages" value={snapshot.summary.messagesUnread} helper="Dispatch & suivi" tone="cyan" />
              <Stat label="Conformité" value={snapshot.summary.complianceBlockers} helper="Docs / readiness blockers" tone="violet" />
            </section>

            {view === 'control-room' && <ControlRoom snapshot={snapshot} onOpenMission={setSelectedMissionId} onOpenAgent={setSelectedAgentId} onOpenThread={setSelectedThreadId} />}
            {view === 'missions' && <MissionsView snapshot={snapshot} query={query} selectedMission={selectedMission} onOpenMission={setSelectedMissionId} onAssign={async (mission, caregiverId) => { await postJson('/api/carelink/ops/missions/' + mission.id + '/assign', { caregiverId }).catch((e) => { throw e }) }} />}
            {view === 'agents' && <AgentsView snapshot={snapshot} query={query} selectedAgent={selectedAgent} onOpenAgent={setSelectedAgentId} onNotify={async (agent, missionId) => { await postJson('/api/carelink/ops/agents/' + agent.id + '/notify', { missionId, subject: 'CareLink Ops', body: 'Message de coordination Ops.' }) }} onRequestDocument={async (agent) => { await postJson('/api/carelink/ops/agents/' + agent.id + '/request-document', { documentType: 'document', note: 'Revue de conformité demandée' }) }} onRequestTraining={async (agent) => { await postJson('/api/carelink/ops/agents/' + agent.id + '/request-training', { note: 'Formation complémentaire demandée' }) }} />}
            {view === 'schedule' && <ScheduleView snapshot={snapshot} />}
            {view === 'calendar' && <CalendarView snapshot={snapshot} />}
            {view === 'incidents' && <IncidentsView snapshot={snapshot} query={query} onOpenIncident={() => undefined} onEscalate={(incident) => postJson('/api/carelink/ops/incidents/' + incident.id + '/escalate', { note: 'Escalade Ops' })} onResolve={(incident) => postJson('/api/carelink/ops/incidents/' + incident.id + '/resolve', { note: 'Résolution Ops' })} onCreateAlert={(incident) => postJson('/api/carelink/ops/missions/' + (incident.missionId || 0) + '/create-alert', { title: incident.title, body: incident.summary, priority: incident.severity })} />}
            {view === 'reports' && <ReportsView snapshot={snapshot} query={query} onValidate={(report) => postJson('/api/carelink/ops/reports/' + report.id + '/validate', { note: 'Validation Ops' })} onCorrect={(report) => postJson('/api/carelink/ops/reports/' + report.id + '/request-correction', { note: 'Correction demandée' })} />}
            {view === 'compliance' && <ComplianceView snapshot={snapshot} query={query} onRequestReview={(document) => postJson('/api/carelink/ops/agents/' + document.caregiverId + '/request-document', { documentType: document.documentType, note: 'Revue demandée' })} />}
            {view === 'settings' && <SettingsView snapshot={snapshot} draft={draftSetting} setDraft={setDraftSetting} onSave={(payload) => postJson('/api/carelink/ops/settings', payload)} />}
            {view === 'quality' && <QualityView snapshot={snapshot} />}
            {view === 'workforce' && <WorkforceView snapshot={snapshot} />}
            {view === 'payments' && <PaymentsView snapshot={snapshot} query={query} draftReason={draftReason} setDraftReason={setDraftReason} draftAmount={draftAmount} setDraftAmount={setDraftAmount} onCreateDispute={async (mission, caregiverId) => { await postJson('/api/carelink/ops/payments/disputes', { missionId: mission.id, caregiverId, amountClaimed: Number(draftAmount || 0), reason: draftReason || 'Correction demandée' }) }} onReview={async (dispute, status) => { await postJson('/api/carelink/ops/payments/disputes/' + dispute.id + '/review', { status, note: 'Revue finance Ops' }) }} />}
            {view === 'notifications' && <NotificationsView snapshot={snapshot} query={query} onAcknowledge={(item) => postJson('/api/carelink/ops/notifications/' + item.id + '/acknowledge', { missionId: item.missionId, note: 'Ack Ops' })} />}
            {view === 'messages' && <MessagesView snapshot={snapshot} query={query} selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} draftMessage={draftMessage} setDraftMessage={setDraftMessage} draftTitle={draftTitle} setDraftTitle={setDraftTitle} onSend={async () => { if (!draftMessage.trim()) return; await postJson('/api/carelink/ops/messages', { missionId: selectedThread?.missionId ?? null, subject: draftTitle || selectedThread?.title || 'Dispatch', body: draftMessage, priority: 'normal' }); setDraftMessage(''); setDraftTitle('') }} />}
            {view === 'audit' && <AuditView snapshot={snapshot} query={query} />}
            {view === 'service-config' && <ServiceConfigView snapshot={snapshot} draft={draftConfig} setDraft={setDraftConfig} onSave={async (payload) => { await postJson('/api/carelink/ops/service-config', payload) }} />}
            {view === 'readiness' && <ReadinessView snapshot={snapshot} />}
            {view === 'replacements' && <ReplacementsView snapshot={snapshot} />}
            {view === 'performance' && <PerformanceView snapshot={snapshot} />}
          </div>
        </section>
      </div>
    </main>
  )
}

function ControlRoom({ snapshot, onOpenMission, onOpenAgent, onOpenThread }: { snapshot: OpsEnterpriseSnapshot; onOpenMission: (id: number) => void; onOpenAgent: (id: number) => void; onOpenThread: (id: string) => void }) {
  const topMissions = snapshot.missionLanes.flatMap((lane) => lane.missions).slice(0, 8)
  const topAgents = (snapshot.agents || []).slice(0, 6)
  return (
    <div className="grid gap-5 xl:">
      <div className="space-y-5">
        <Panel title="Mission command board" subtitle="Dossiers, sub-missions, readiness, alerts, reports, and validation status.">
          {snapshot.missionLanes.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {snapshot.missionLanes.map((lane) => (
                <div key={lane.key} className={`rounded-3xl border p-4 ${toneClass(lane.label, lane.tone)}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">{lane.label}</p>
                    <Badge tone={lane.tone}>{lane.count}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {lane.missions.slice(0, 3).map((mission) => (
                      <button key={mission.id} onClick={() => onOpenMission(mission.id)} className="w-full rounded-2xl border border-white/60 bg-white p-3 text-left shadow-sm">
                        <p className="text-xs font-black text-blue-700">{resolvedMissionCode(mission)}</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{mission.familyName}</p>
                        <p className="mt-1 text-xs text-slate-500">{mission.city} · {mission.zone}</p>
                      </button>
                    ))}
                    {!lane.missions.length ? <EmptyState title="Aucune mission" body="Ce compartiment n’a pas encore de missions live." /> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="Aucune mission" body="Les missions live apparaîtront ici dès qu’elles sont créées dans le moteur existant." />}
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Urgent signals" subtitle="Alerts, notifications and escalations requiring immediate review.">
            <div className="space-y-3">
              {(snapshot.alerts || []).slice(0, 5).map((alert) => <AlertRow key={alert.id} alert={alert} onOpen={() => onOpenThread(alert.id)} />)}
              {!(snapshot.alerts || []).length ? <EmptyState title="Aucune alerte critique" body="Les alertes persistantes et les escalades apparaîtront ici." /> : null}
            </div>
          </Panel>
          <Panel title="Readiness blockers" subtitle="Documents, compliance, and mission preparation risks.">
            <div className="space-y-3">
              {snapshot.readiness.blockers.slice(0, 5).map((blocker) => <BlockRow key={blocker} title={blocker} tone="rose" />)}
              {snapshot.readiness.warnings.slice(0, 5).map((warning) => <BlockRow key={warning} title={warning} tone="amber" />)}
              {!snapshot.readiness.blockers.length && !snapshot.readiness.warnings.length ? <EmptyState title="Aucun blocage" body="Le centre readiness est stable et prêt pour l’exécution terrain." /> : null}
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-5">
        <Panel title="Live operation cockpit" subtitle="Sync, messages, reports, disputes, and document health.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Non lus" value={snapshot.summary.messagesUnread} tone="blue" />
            <Stat label="Disputes" value={snapshot.summary.paymentDisputes} tone="amber" />
            <Stat label="Docs expirés" value={snapshot.readiness.expiredDocuments} tone="rose" />
            <Stat label="Ready agents" value={snapshot.summary.readyAgents} tone="emerald" />
          </div>
          <div className="mt-4 space-y-3">
            {(snapshot.messages || []).slice(0, 4).map((thread) => (
              <button key={thread.id} onClick={() => onOpenThread(thread.id)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
                <p className="text-sm font-black text-slate-900">{thread.title}</p>
                <p className="mt-1 text-xs text-slate-500">{thread.body}</p>
              </button>
            ))}
            {!(snapshot.messages || []).length ? <EmptyState title="Aucun thread dispatch" body="Les messages persistants apparaîtront ici dès que le dispatch envoie des notes live." /> : null}
          </div>
        </Panel>

        <Panel title="Quick workforce view" subtitle="Agents online, availability, and field readiness.">
          <div className="space-y-3">
            {topAgents.map((agent) => <AgentRow key={agent.id} agent={agent} onOpen={() => onOpenAgent(agent.id)} />)}
            {!topAgents.length ? <EmptyState title="Aucun agent" body="Les caregivers et agents terrain apparaîtront ici dès qu’ils sont connectés." /> : null}
          </div>
        </Panel>

        <Panel title="Audit trail preview" subtitle="Mission events, dispatch actions, acknowledgements, and operational trace.">
          <div className="space-y-2">
            {snapshot.history.slice(0, 6).map((item) => <AuditRow key={item.id} item={item} />)}
            {!snapshot.history.length ? <EmptyState title="Aucun audit" body="Les événements et traces d’audit live s’afficheront ici." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function MissionsView({ snapshot, query, selectedMission, onOpenMission, onAssign }: { snapshot: OpsEnterpriseSnapshot; query: string; selectedMission: OpsMissionCard | null; onOpenMission: (id: number) => void; onAssign: (mission: OpsMissionCard, caregiverId: number | null) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Mission operations queue" subtitle="Today, active, recurring, at-risk, report-pending, checklist-pending and validation-pending missions.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.summary.missions ? (snapshot.missions || []).filter((mission) => [resolvedMissionCode(mission), mission.code, mission.familyName, mission.city, mission.zone, mission.serviceType, mission.status].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 18).map((mission) => (
            <button key={mission.id} onClick={() => onOpenMission(mission.id)} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{resolvedMissionCode(mission)}</p>
                  <h3 className="mt-1 text-base font-black text-slate-950">{mission.familyName}</h3>
                </div>
                <Badge tone={missionTone(mission.status, mission.riskLevel)}>{mission.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">{mission.serviceType} · {mission.city} · {mission.zone}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={mission.readinessStatus === 'blocked' ? 'rose' : mission.readinessStatus === 'warning' ? 'amber' : 'emerald'}>{mission.readinessStatus}</Badge>
                <Badge tone={mission.validationStatus === 'validated' ? 'emerald' : 'violet'}>{mission.validationStatus}</Badge>
                <Badge tone={mission.reportStatus === 'pending' ? 'amber' : 'slate'}>{mission.reportStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Sub" value={`${mission.subMissionCount}`} />
                <MiniStat label="Checklist" value={`${mission.checklistCompleted}/${mission.checklistTotal}`} />
                <MiniStat label="Risk" value={mission.riskLevel} />
              </div>
            </button>
          )) : null}
          {!(snapshot.missions || []).length ? <div className="col-span-full"><EmptyState title="Aucune mission assignée" body="Les missions live apparaîtront ici lorsque l’engine ANGELCARE les poussera sur CareLink Ops." /></div> : null}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Mission detail drawer" subtitle="Selected mission, lifecycle, and action center.">
          {(snapshot.missions || []).length ? (
            <div className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Selected mission</p>
                <p className="mt-2 text-lg font-black text-slate-950">{selectedMissionLabel(selectedMission || snapshot.missions[0])}</p>
              </div>
              {snapshot.missionLanes.slice(0, 4).map((lane) => <div key={lane.key} className="rounded-3xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="font-black">{lane.label}</p><Badge tone={lane.tone}>{lane.count}</Badge></div><p className="mt-2 text-sm text-slate-500">Compartiment de pilotage opérationnel.</p></div>)}
            </div>
          ) : <EmptyState title="Aucun détail" body="Sélectionnez une mission pour ouvrir le panneau de pilotage." />}
        </Panel>

        <Panel title="Action center" subtitle="Assignment, notification, alerting and payment readiness.">
          <div className="space-y-2">
            <button disabled={!snapshot.missions[0]} onClick={() => onAssign(snapshot.missions[0], selectedMission?.caregiverId || null).catch(() => undefined)} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">Assign selected mission</button>
            <button disabled={!snapshot.missions[0]} onClick={() => onAssign(snapshot.missions[0], null).catch(() => undefined)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black disabled:opacity-60">Unassign mission</button>
            <Link href="/carelink-ops/messages" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black">Open dispatch messages</Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function AgentsView({ snapshot, query, selectedAgent, onOpenAgent, onNotify, onRequestDocument, onRequestTraining }: { snapshot: OpsEnterpriseSnapshot; query: string; selectedAgent: OpsEnterpriseSnapshot['agents'][number] | null; onOpenAgent: (id: number) => void; onNotify: (agent: OpsEnterpriseSnapshot['agents'][number], missionId: number | null) => Promise<void>; onRequestDocument: (agent: OpsEnterpriseSnapshot['agents'][number]) => Promise<void>; onRequestTraining: (agent: OpsEnterpriseSnapshot['agents'][number]) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Caregiver command center" subtitle="Live status, readiness, zones, workload, compliance and sync state.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(snapshot.agents || []).filter((agent) => [agent.fullName, agent.city, agent.zone, agent.status, agent.skills.join(' '), agent.serviceEligibility.join(' ')].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 18).map((agent) => (
            <button key={agent.id} onClick={() => onOpenAgent(agent.id)} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{agent.fullName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{agent.city} · {agent.zone}</p>
                </div>
                <Badge tone={agent.online ? 'emerald' : 'slate'}>{agent.online ? 'online' : 'offline'}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Ready" value={`${agent.readinessScore}%`} />
                <MiniStat label="Reliability" value={`${agent.reliabilityScore}%`} />
                <MiniStat label="Load" value={`${agent.workload}`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.skills.slice(0, 3).map((skill) => <Badge key={skill} tone="slate">{skill}</Badge>)}
              </div>
            </button>
          ))}
          {!(snapshot.agents || []).length ? <div className="col-span-full"><EmptyState title="Aucun agent" body="Les caregivers et agents terrain live apparaîtront ici après synchronisation." /></div> : null}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Agent detail" subtitle="Mobile sync, last check-in, documents and compliance blockers.">
          {(snapshot.agents || []).length ? (
            <div className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Selected</p>
                <p className="mt-2 text-lg font-black text-slate-950">{selectedAgent?.fullName || snapshot.agents[0].fullName}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedAgent?.city || snapshot.agents[0].city} · {selectedAgent?.zone || snapshot.agents[0].zone}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Workload" value={selectedAgent?.workload ?? snapshot.agents[0].workload} tone="blue" />
                <Stat label="Performance" value={`${selectedAgent?.performanceScore ?? snapshot.agents[0].performanceScore}%`} tone="emerald" />
              </div>
              <div className="space-y-2">
                <button onClick={() => onNotify(selectedAgent || snapshot.agents[0], snapshot.missions[0]?.id || null).catch(() => undefined)} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Notify agent</button>
                <button onClick={() => onRequestDocument(selectedAgent || snapshot.agents[0]).catch(() => undefined)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Request document</button>
                <button onClick={() => onRequestTraining(selectedAgent || snapshot.agents[0]).catch(() => undefined)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Request training</button>
              </div>
            </div>
          ) : <EmptyState title="Aucun agent" body="Les profils et statuts agents apparaîtront ici dès disponibilité live." />}
        </Panel>

        <Panel title="Compliance blockers" subtitle="Expired documents, review requests and readiness notes.">
          <div className="space-y-2">
            {(snapshot.documents || []).filter((document) => document.blocker).slice(0, 5).map((document) => <BlockRow key={document.id} title={`${document.caregiverName} · ${document.documentType}`} tone="rose" />)}
            {!(snapshot.documents || []).filter((document) => document.blocker).length ? <EmptyState title="Aucun blocage" body="Les documents expirés et les revues en attente apparaîtront ici." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ScheduleView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Operational schedule" subtitle="Day timeline, workload, availability gaps and route-aware warnings.">
        <div className="space-y-3">
          {snapshot.schedule.byDate.slice(0, 8).map((day) => (
            <div key={day.date} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-950">{day.date}</p>
                <Badge tone={day.conflicts > 1 ? 'rose' : day.conflicts === 1 ? 'amber' : 'emerald'}>{day.workload} missions</Badge>
              </div>
              <div className="mt-2 text-sm text-slate-500">{day.conflicts ? `${day.conflicts} conflit(s) / garde` : 'Aucun conflit détecté'}</div>
            </div>
          ))}
          {!snapshot.schedule.byDate.length ? <EmptyState title="Planning vide" body="Le moteur de planning apparaîtra dès qu’il y a des missions à planifier." /> : null}
        </div>
      </Panel>
      <Panel title="Availability & replacement signals" subtitle="Gaps, pending confirmations and replacement needs.">
        <div className="space-y-2">
          {snapshot.replacements.requests.slice(0, 5).map((request) => <BlockRow key={request.id} title={`${request.title} · ${request.missionCode || 'Mission'}`} tone="amber" />)}
          {!snapshot.replacements.requests.length ? <EmptyState title="Aucun remplacement" body="Les demandes de remplacement, incidents et gaps de capacité apparaîtront ici." /> : null}
        </div>
      </Panel>
    </div>
  )
}

function CalendarView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Month calendar" subtitle="Density indicators, recurring sessions and date navigation.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {snapshot.calendar.byDate.slice(0, 12).map((day) => (
            <div key={day.date} className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">{day.date}</p>
              <p className="mt-1 text-xs text-slate-500">{day.count} mission(s)</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(8, day.density)}%` }} />
              </div>
            </div>
          ))}
          {!snapshot.calendar.byDate.length ? <div className="col-span-full"><EmptyState title="Calendrier vide" body="La vue calendrier s’alimente automatiquement depuis les missions live." /></div> : null}
        </div>
      </Panel>
      <Panel title="Recurring sessions" subtitle="Sub-missions and parent dossier flows.">
        <div className="space-y-2">
          {(snapshot.missions || []).filter((mission) => mission.recurringLabel !== 'single').slice(0, 8).map((mission) => <BlockRow key={mission.id} title={`${resolvedMissionCode(mission)} · ${mission.recurringLabel}`} tone="violet" />)}
          {!(snapshot.missions || []).filter((mission) => mission.recurringLabel !== 'single').length ? <EmptyState title="Aucune session récurrente" body="Les dossiers récurrents et sessions X/Y apparaîtront ici dès synchronisation." /> : null}
        </div>
      </Panel>
    </div>
  )
}

function IncidentsView({ snapshot, query, onEscalate, onResolve, onCreateAlert }: { snapshot: OpsEnterpriseSnapshot; query: string; onOpenIncident: (incident: OpsIncidentCard) => void; onEscalate: (incident: OpsIncidentCard) => Promise<void>; onResolve: (incident: OpsIncidentCard) => Promise<void>; onCreateAlert: (incident: OpsIncidentCard) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Incident command center" subtitle="Severity, mission linkage, dispatch notes and resolution state.">
        <div className="space-y-3">
          {(snapshot.incidents || []).filter((incident) => [incident.title, incident.summary, incident.city, incident.zone, incident.status, incident.severity].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 20).map((incident) => (
            <div key={incident.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{incident.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{incident.summary || 'No summary'} · {incident.city} · {incident.zone}</p>
                </div>
                <Badge tone={incident.severity === 'critical' ? 'rose' : incident.severity === 'high' ? 'amber' : 'slate'}>{incident.severity}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={incident.status === 'resolved' ? 'emerald' : 'rose'}>{incident.status}</Badge>
                {incident.missionCode ? <Badge tone="blue">{incident.missionCode}</Badge> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onEscalate(incident).catch(() => undefined)} className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">Escalate</button>
                <button onClick={() => onResolve(incident).catch(() => undefined)} className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Resolve</button>
                {incident.missionId ? <button onClick={() => onCreateAlert(incident).catch(() => undefined)} className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Create alert</button> : null}
              </div>
            </div>
          ))}
          {!(snapshot.incidents || []).length ? <EmptyState title="Aucun incident" body="Les incidents, escalades et suivis de sécurité apparaîtront ici." /> : null}
        </div>
      </Panel>
      <Panel title="Incident metrics" subtitle="Risk, follow-up and operational closure.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Open" value={(snapshot.incidents || []).filter((item) => ['open', 'triaged', 'escalated'].includes(item.status)).length} tone="rose" />
          <Stat label="Resolved" value={(snapshot.incidents || []).filter((item) => item.status === 'resolved').length} tone="emerald" />
        </div>
      </Panel>
    </div>
  )
}

function ReportsView({ snapshot, query, onValidate, onCorrect }: { snapshot: OpsEnterpriseSnapshot; query: string; onValidate: (report: OpsReportCard) => Promise<void>; onCorrect: (report: OpsReportCard) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Validation queue" subtitle="Submitted mission reports, quality scoring and approval workflow.">
        <div className="space-y-3">
          {(snapshot.reports || []).filter((report) => [report.missionCode, report.serviceType, report.status, report.validationStatus].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 20).map((report) => (
            <div key={report.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{report.missionCode}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{report.serviceType}</p>
                </div>
                <Badge tone={report.validationStatus === 'validated' ? 'emerald' : 'amber'}>{report.validationStatus}</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600">{report.observations || 'No observations'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={report.incidentFlag ? 'rose' : 'slate'}>{report.incidentFlag ? 'incident' : 'no incident'}</Badge>
                <Badge tone="blue">Quality {report.qualityScore}</Badge>
                <Badge tone="violet">{report.checklistCompletion}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onValidate(report).catch(() => undefined)} className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Approve</button>
                <button onClick={() => onCorrect(report).catch(() => undefined)} className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">Request correction</button>
              </div>
            </div>
          ))}
          {!(snapshot.reports || []).length ? <EmptyState title="Aucun rapport" body="Les rapports de mission soumis apparaîtront ici pour validation Ops." /> : null}
        </div>
      </Panel>
      <Panel title="Quality score" subtitle="Checklist completion, incident rate and report quality.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Quality" value={`${snapshot.quality.score}%`} tone="emerald" />
          <Stat label="Checklist" value={`${snapshot.quality.checklistCompletion}%`} tone="blue" />
          <Stat label="Incident rate" value={`${snapshot.quality.incidentRate}%`} tone="rose" />
          <Stat label="Report quality" value={`${snapshot.quality.reportQuality}%`} tone="violet" />
        </div>
      </Panel>
    </div>
  )
}

function ComplianceView({ snapshot, query, onRequestReview }: { snapshot: OpsEnterpriseSnapshot; query: string; onRequestReview: (document: OpsDocumentCard) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Compliance control" subtitle="Documents, blockers, readiness and service eligibility.">
        <div className="space-y-3">
          {(snapshot.documents || []).filter((document) => [document.caregiverName, document.documentType, document.status, document.reviewStatus].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 20).map((document) => (
            <div key={document.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{document.caregiverName}</p>
                  <p className="mt-1 text-sm text-slate-500">{document.documentType}</p>
                </div>
                <Badge tone={document.blocker ? 'rose' : document.reviewStatus === 'review_requested' ? 'amber' : 'emerald'}>{document.reviewStatus}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={document.blocker ? 'rose' : 'slate'}>{document.blocker ? 'expired' : 'active'}</Badge>
                {document.expiresAt ? <Badge tone="violet">{fmt(document.expiresAt)}</Badge> : null}
              </div>
              <button onClick={() => onRequestReview(document).catch(() => undefined)} className="mt-4 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Request review</button>
            </div>
          ))}
          {!(snapshot.documents || []).length ? <EmptyState title="Aucun document" body="Les documents agent et les revues apparaîtront ici." /> : null}
        </div>
      </Panel>
      <Panel title="Readiness blockers" subtitle="Agent readiness and service eligibility.">
        <div className="space-y-2">
          {snapshot.readiness.blockers.slice(0, 6).map((item) => <BlockRow key={item} title={item} tone="rose" />)}
          {snapshot.readiness.warnings.slice(0, 6).map((item) => <BlockRow key={item} title={item} tone="amber" />)}
          {!snapshot.readiness.blockers.length && !snapshot.readiness.warnings.length ? <EmptyState title="Aucun blocage" body="Le centre de conformité est propre et prêt." /> : null}
        </div>
      </Panel>
    </div>
  )
}

function SettingsView({ snapshot, draft, setDraft, onSave }: { snapshot: OpsEnterpriseSnapshot; draft: string; setDraft: (value: string) => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const [label, setLabel] = useState('Lifecycle policy')
  const [category, setCategory] = useState('lifecycle')
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Operational settings" subtitle="Lifecycle rules, thresholds and notification standards.">
        <div className="grid gap-3 md:grid-cols-2">
          {snapshot.settings.items.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-slate-950">{item.label}</p>
                <Badge tone={item.status === 'active' ? 'emerald' : 'slate'}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">{item.category}</p>
            </div>
          ))}
          {!snapshot.settings.items.length ? <div className="md:col-span-2"><EmptyState title="Aucun réglage persistant" body="Les réglages Ops seront enregistrés dans la nouvelle table complémentaire." /></div> : null}
        </div>
      </Panel>
      <Panel title="Edit setting" subtitle="Persistent ops settings, JSON payloads and standards.">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-600">Label<input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
          <label className="block text-sm font-bold text-slate-600">Category<input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
          <label className="block text-sm font-bold text-slate-600">JSON<textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none" placeholder='{"threshold":80}' /></label>
          <button onClick={() => onSave({ key: label.toLowerCase().replace(/\s+/g, '_'), label, category, value: safeJsonParse(draft) }).catch(() => undefined)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Save setting</button>
        </div>
      </Panel>
    </div>
  )
}

function QualityView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Quality scorecards" subtitle="Mission quality by city and service category.">
        <div className="space-y-2">
          {snapshot.quality.byCity.map((row) => <BlockRow key={row.city} title={`${row.city} · quality ${row.quality}%`} tone={row.incidents ? 'amber' : 'emerald'} />)}
        </div>
      </Panel>
      <Panel title="Service quality" subtitle="Service category trends and incident levels.">
        <div className="space-y-2">
          {snapshot.quality.byService.map((row) => <BlockRow key={row.serviceType} title={`${row.serviceType} · ${row.quality}%`} tone={row.incidents ? 'amber' : 'emerald'} />)}
        </div>
      </Panel>
    </div>
  )
}

function WorkforceView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Workforce coverage" subtitle="City and zone workload, online / offline and readiness.">
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.workforce.byCity.map((row) => <Stat key={row.city} label={row.city} value={`${row.missions} missions`} helper={`${row.agents} agents · ready ${row.readiness}%`} tone="blue" />)}
          {!snapshot.workforce.byCity.length ? <div className="sm:col-span-2"><EmptyState title="Aucune couverture" body="La couverture ville / zone apparaîtra ici quand les agents seront synchronisés." /></div> : null}
        </div>
      </Panel>
      <Panel title="Zone matrix" subtitle="Operational zones and readiness levels.">
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.workforce.byZone.map((row) => <Stat key={`${row.city}-${row.zone}`} label={row.zone} value={`${row.missions} missions`} helper={`${row.city} · ${row.agents} agents · ready ${row.readiness}%`} tone="emerald" />)}
        </div>
      </Panel>
    </div>
  )
}

function PaymentsView({ snapshot, query, draftReason, setDraftReason, draftAmount, setDraftAmount, onCreateDispute, onReview }: { snapshot: OpsEnterpriseSnapshot; query: string; draftReason: string; setDraftReason: (value: string) => void; draftAmount: string; setDraftAmount: (value: string) => void; onCreateDispute: (mission: OpsMissionCard, caregiverId: number | null) => Promise<void>; onReview: (dispute: OpsPaymentLine, status: string) => Promise<void> }) {
  const disputes = (snapshot.payments?.disputes || []) as AnyRecord[]
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Payments and allowances" subtitle="Total earned, pending validation, paid, bonuses, transport, meal and disputes.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Earned" value={`${(snapshot.payments as any)?.total || (snapshot.payments as any)?.earned || 0} DH`} tone="emerald" />
          <Stat label="Pending" value={`${(snapshot.payments as any)?.pending || 0} DH`} tone="amber" />
          <Stat label="Paid" value={`${(snapshot.payments?.paid || 0)} DH`} tone="blue" />
          <Stat label="Disputes" value={snapshot.summary.paymentDisputes} tone="rose" />
        </div>
        <div className="mt-4 space-y-2">
          {(snapshot.payments?.lines || []).filter((line) => [line.label, line.kind, line.status].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 12).map((line) => (
            <div key={line.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-black text-slate-950">{line.label}</p>
                <p className="text-xs text-slate-500">{line.kind} · {fmt(line.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-950">{line.amountMad} DH</p>
                <Badge tone={line.status === 'paid' ? 'emerald' : 'amber'}>{line.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Payment correction request" subtitle="Mission-linked dispute with MAD / DH amounts.">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-600">Reason<textarea value={draftReason} onChange={(event) => setDraftReason(event.target.value)} rows={4} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
            <label className="block text-sm font-bold text-slate-600">Amount (MAD / DH)<input value={draftAmount} onChange={(event) => setDraftAmount(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
            <button disabled={!snapshot.missions[0]} onClick={() => onCreateDispute(snapshot.missions[0], snapshot.missions[0]?.caregiverId || null).catch(() => undefined)} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">Create dispute</button>
          </div>
        </Panel>
        <Panel title="Dispute review queue" subtitle="Approve, reject or mark reviewed.">
          <div className="space-y-2">
            {disputes.slice(0, 6).map((dispute) => (
              <div key={String(dispute.id)} className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="font-black text-slate-950">{dispute.reason || 'Dispute'}</p>
                <p className="mt-1 text-xs text-slate-500">{dispute.amount_claimed || 0} DH · {dispute.status || 'pending'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onReview(dispute as any, 'reviewed').catch(() => undefined)} className="rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">Reviewed</button>
                  <button onClick={() => onReview(dispute as any, 'approved').catch(() => undefined)} className="rounded-2xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">Approved</button>
                  <button onClick={() => onReview(dispute as any, 'rejected').catch(() => undefined)} className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">Rejected</button>
                </div>
              </div>
            ))}
            {!disputes.length ? <EmptyState title="Aucun litige" body="Les demandes de correction paiement apparaîtront ici." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function NotificationsView({ snapshot, query, onAcknowledge }: { snapshot: OpsEnterpriseSnapshot; query: string; onAcknowledge: (item: OpsNotificationCard | OpsAlertCard) => Promise<void> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Persistent notifications" subtitle="Unread count, priority, mission link and acknowledge actions.">
        <div className="space-y-2">
          {(snapshot.notifications || []).filter((item) => [item.title, item.body, item.type].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.body}</p>
                </div>
                <Badge tone={item.status === 'unread' ? 'amber' : 'emerald'}>{item.status}</Badge>
              </div>
              <button onClick={() => onAcknowledge(item).catch(() => undefined)} className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Acknowledge</button>
            </div>
          ))}
          {!(snapshot.notifications || []).length ? <EmptyState title="Aucune notification" body="Les notifications persistantes apparaîtront ici." /> : null}
        </div>
      </Panel>
      <Panel title="Critical alerts" subtitle="Safety, SLA and compliance escalation messages.">
        <div className="space-y-2">
          {(snapshot.alerts || []).filter((item) => [item.title, item.body, item.type].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.body}</p>
                </div>
                <Badge tone={item.priority === 'critical' ? 'rose' : item.priority === 'high' ? 'amber' : 'slate'}>{item.priority}</Badge>
              </div>
              <button onClick={() => onAcknowledge(item).catch(() => undefined)} className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">Acknowledge</button>
            </div>
          ))}
          {!(snapshot.alerts || []).length ? <EmptyState title="Aucune alerte" body="Les alertes critiques et persistantes apparaîtront ici." /> : null}
        </div>
      </Panel>
    </div>
  )
}

function MessagesView({ snapshot, query, selectedThreadId, setSelectedThreadId, draftMessage, setDraftMessage, draftTitle, setDraftTitle, onSend }: { snapshot: OpsEnterpriseSnapshot; query: string; selectedThreadId: string | null; setSelectedThreadId: (id: string) => void; draftMessage: string; setDraftMessage: (value: string) => void; draftTitle: string; setDraftTitle: (value: string) => void; onSend: () => Promise<void> }) {
  const selectedThread = (snapshot.messages || []).find((thread) => thread.id === selectedThreadId) || snapshot.messages[0] || null
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Dispatch threads" subtitle="Persistent mission-linked and global communication threads.">
        <div className="space-y-2">
          {(snapshot.messages || []).filter((thread) => [thread.title, thread.body].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0, 16).map((thread) => (
            <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)} className={`w-full rounded-3xl border p-4 text-left shadow-sm ${thread.id === selectedThread?.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{thread.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{thread.body}</p>
                </div>
                <Badge tone={thread.unreadCount ? 'amber' : 'emerald'}>{thread.unreadCount} unread</Badge>
              </div>
            </button>
          ))}
          {!(snapshot.messages || []).length ? <EmptyState title="Aucun thread" body="Les threads dispatch persistants apparaîtront ici." /> : null}
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Thread detail" subtitle="Read status, mission link and reply composer.">
          {selectedThread ? (
            <div className="space-y-3">
              <p className="text-lg font-black text-slate-950">{selectedThread.title}</p>
              <p className="text-sm text-slate-500">{selectedThread.body}</p>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Messages</p>
                <div className="mt-3 space-y-2">
                  {selectedThread.messages.slice(0, 5).map((message: AnyRecord) => <MessageBubble key={String(message.id)} message={message} />)}
                </div>
              </div>
            </div>
          ) : <EmptyState title="Aucun thread sélectionné" body="Sélectionnez un thread pour afficher les messages de liaison." />}
        </Panel>
        <Panel title="Compose message" subtitle="Send dispatch message to agent or mission thread.">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-600">Subject<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
            <label className="block text-sm font-bold text-slate-600">Body<textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} rows={5} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
            <button onClick={() => onSend().catch(() => undefined)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Send message</button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function AuditView({ snapshot, query }: { snapshot: OpsEnterpriseSnapshot; query: string }) {
  const rows = snapshot.history.filter((item) => [item.action, item.actorName, item.entityType].join(' ').toLowerCase().includes(query.toLowerCase()))
  return (
    <Panel title="Audit center" subtitle="Mission events, acknowledgements, reports, incidents and finance reviews.">
      {rows.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Severity</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 24).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-500">{fmt(row.createdAt)}</td>
                  <td className="p-3 font-black text-slate-950">{row.action}</td>
                  <td className="p-3 text-slate-600">{row.entityType}</td>
                  <td className="p-3 text-slate-600">{row.actorName || 'System'}</td>
                  <td className="p-3"><Badge tone={row.severity === 'warning' ? 'amber' : 'slate'}>{row.severity}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Aucun audit" body="Les événements Ops, liaisons mobile et validations apparaîtront ici." />}
    </Panel>
  )
}

function ServiceConfigView({ snapshot, draft, setDraft, onSave }: { snapshot: OpsEnterpriseSnapshot; draft: string; setDraft: (value: string) => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const [serviceType, setServiceType] = useState(snapshot.serviceConfig.defaults[0]?.serviceType || '')
  const [serviceFamily, setServiceFamily] = useState(snapshot.serviceConfig.defaults[0]?.serviceFamily || 'general_service')
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Service configuration" subtitle="Templates, skills, checklist defaults, mission order logic and mobile field brief standards.">
        <div className="grid gap-3 md:grid-cols-2">
          {snapshot.serviceConfig.defaults.map((service) => (
            <div key={service.serviceType} className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="font-black text-slate-950">{service.serviceType}</p>
              <p className="mt-1 text-xs text-slate-500">{service.serviceFamily}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {service.requiredSkills.slice(0, 3).map((skill) => <Badge key={skill} tone="slate">{skill}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Edit config" subtitle="Persistent service configuration stored in the complementary ops table.">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-600">Service type<input value={serviceType} onChange={(event) => setServiceType(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
          <label className="block text-sm font-bold text-slate-600">Service family<input value={serviceFamily} onChange={(event) => setServiceFamily(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" /></label>
          <label className="block text-sm font-bold text-slate-600">JSON<textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none" /></label>
          <button onClick={() => onSave({ serviceType, serviceFamily, config: safeJsonParse(draft) }).catch(() => undefined)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Save config</button>
        </div>
      </Panel>
    </div>
  )
}

function ReadinessView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Readiness center" subtitle="Readiness score, blockers, expired documents and service eligibility.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Score" value={`${snapshot.readiness.score}%`} tone="emerald" />
          <Stat label="Expired docs" value={snapshot.readiness.expiredDocuments} tone="rose" />
        </div>
        <div className="mt-4 space-y-2">
          {snapshot.readiness.blockers.slice(0, 5).map((item) => <BlockRow key={item} title={item} tone="rose" />)}
          {snapshot.readiness.warnings.slice(0, 5).map((item) => <BlockRow key={item} title={item} tone="amber" />)}
          {!snapshot.readiness.blockers.length && !snapshot.readiness.warnings.length ? <EmptyState title="Aucun blocage" body="Les agents sont opérationnellement prêts." /> : null}
        </div>
      </Panel>
      <Panel title="Eligibility by service" subtitle="Readiness by service type and agent readiness distribution.">
        <div className="space-y-2">
          {snapshot.readiness.serviceEligibility.map((row) => <BlockRow key={row.serviceType} title={`${row.serviceType} · ready ${row.ready}`} tone={row.blocked ? 'amber' : 'emerald'} />)}
        </div>
      </Panel>
    </div>
  )
}

function ReplacementsView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:">
      <Panel title="Replacement command" subtitle="Incident-linked replacements and candidate matching.">
        <div className="space-y-2">
          {snapshot.replacements.requests.map((request) => <BlockRow key={request.id} title={`${request.title} · ${request.missionCode || 'Mission'}`} tone={request.severity === 'critical' ? 'rose' : 'amber'} />)}
          {!snapshot.replacements.requests.length ? <EmptyState title="Aucune demande de remplacement" body="Les remplacements et indisponibilités apparaîtront ici." /> : null}
        </div>
      </Panel>
      <Panel title="Replacement candidates" subtitle="Skill match, city and zone compatibility.">
        <div className="space-y-2">
          {snapshot.replacements.candidates.slice(0, 8).map((candidate) => <BlockRow key={candidate.caregiverId} title={`${candidate.fullName} · ${candidate.score}%`} tone={candidate.online ? 'emerald' : 'slate'} />)}
        </div>
      </Panel>
    </div>
  )
}

function PerformanceView({ snapshot }: { snapshot: OpsEnterpriseSnapshot }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Performance overview" subtitle="Mission quality, incident rate, no-show and cancellations.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Score" value={`${snapshot.quality.score}%`} tone="emerald" />
          <Stat label="Incidents" value={`${snapshot.quality.incidentRate}%`} tone="rose" />
          <Stat label="No-show" value={`${snapshot.quality.noShowRate}%`} tone="amber" />
          <Stat label="Cancel" value={`${snapshot.quality.cancellationRate}%`} tone="violet" />
        </div>
      </Panel>
      <Panel title="Workforce & readiness" subtitle="Online capacity, ready agents and live mission load.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Online" value={snapshot.workforce.online} tone="blue" />
          <Stat label="Ready now" value={snapshot.workforce.readyNow} tone="emerald" />
          <Stat label="Offline" value={snapshot.workforce.offline} tone="slate" />
          <Stat label="Events" value={snapshot.history.length} tone="violet" />
        </div>
      </Panel>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  )
}

function BlockRow({ title, tone }: { title: string; tone: 'rose' | 'amber' | 'emerald' | 'slate' | 'blue' | 'violet' }) {
  const map: Record<typeof tone, string> = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${map[tone]}`}>{title}</div>
}

function AlertRow({ alert, onOpen }: { alert: OpsAlertCard; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={`w-full rounded-3xl border p-4 text-left shadow-sm ${toneClass(alert.status, alert.priority)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{alert.title}</p>
          <p className="mt-1 text-sm opacity-80">{alert.body}</p>
        </div>
        <Badge tone={alert.priority === 'critical' ? 'rose' : alert.priority === 'high' ? 'amber' : 'slate'}>{alert.priority}</Badge>
      </div>
    </button>
  )
}

function AgentRow({ agent, onOpen }: { agent: OpsEnterpriseSnapshot['agents'][number]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={`w-full rounded-3xl border p-4 text-left shadow-sm ${toneClass(agent.status, agent.readinessScore < 80 ? 'warning' : 'ready')}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{agent.fullName}</p>
          <p className="mt-1 text-sm opacity-80">{agent.city} · {agent.zone}</p>
        </div>
        <Badge tone={agent.online ? 'emerald' : 'slate'}>{agent.online ? 'online' : 'offline'}</Badge>
      </div>
      <p className="mt-2 text-xs opacity-80">Readiness {agent.readinessScore}% · Reliability {agent.reliabilityScore}% · Performance {agent.performanceScore}%</p>
    </button>
  )
}

function AuditRow({ item }: { item: OpsAuditCard }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{item.action}</p>
          <p className="mt-1 text-xs text-slate-500">{item.entityType} · {item.actorName || 'System'} · {fmt(item.createdAt)}</p>
        </div>
        <Badge tone={item.severity === 'warning' ? 'amber' : 'slate'}>{item.severity}</Badge>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: AnyRecord }) {
  return (
    <div className={`rounded-2xl border p-3 ${toneClass(message.status || 'sent', message.priority || 'normal')}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.12em]">{message.sender_type || message.senderType || 'ops'}</p>
        <span className="text-[11px] font-medium opacity-80">{fmt(message.created_at || message.createdAt)}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{message.body || ''}</p>
    </div>
  )
}

function selectedMissionLabel(mission?: OpsMissionCard | null) {
  if (!mission) return 'Aucune mission'
  return `${resolvedMissionCode(mission)} · ${mission.familyName}`
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
