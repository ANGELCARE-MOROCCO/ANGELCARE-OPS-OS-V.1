import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardLiveClient from './DashboardLiveClient'

function low(v: unknown) {
  return String(v || '').toLowerCase()
}

function timeToMinutes(v: unknown) {
  const t = String(v || '')
  if (!t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function percent(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

function statusStyle(label: string): React.CSSProperties {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
    assigned: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    confirmed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    in_progress: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    completed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    incident: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    cancelled: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    normal: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
    active: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    paused: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
    vip: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  }
  const c = map[label] || { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
  }
}

function Chip({ label }: { label: string }) {
  return <span style={statusStyle(low(label))}>{label}</span>
}

function Widget({
  title,
  value,
  subtitle,
  icon,
  accent = '#0f172a',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  accent?: string
}) {
  return (
    <section style={widgetStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div>
          <div style={widgetLabelStyle}>{title}</div>
          <div style={{ ...widgetValueStyle, color: accent }}>{value}</div>
          {subtitle ? <div style={widgetSubStyle}>{subtitle}</div> : null}
        </div>
        <div style={widgetIconStyle}>{icon}</div>
      </div>
    </section>
  )
}

function Panel({
  title,
  subtitle,
  children,
  right,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <h2 style={panelTitleStyle}>{title}</h2>
          {subtitle ? <div style={panelSubStyle}>{subtitle}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function MiniRow({ title, meta, right }: { title: string; meta: string; right?: React.ReactNode }) {
  return (
    <div style={miniRowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={miniRowTitleStyle}>{title}</div>
        <div style={miniRowMetaStyle}>{meta}</div>
      </div>
      {right}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

function CheckRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div style={checkRowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={positive ? okDotStyle : warnDotStyle} />
        <span style={{ fontWeight: 700, color: '#1e293b' }}>{label}</span>
      </div>
      <div style={{ fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

function NavCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: string }) {
  return (
    <Link href={href} style={navCardStyle}>
      <div style={navCardIconStyle}>{icon}</div>
      <div>
        <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 15 }}>{title}</div>
        <div style={miniRowMetaStyle}>{subtitle}</div>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const soonMax = nowMin + 120

  const [missionsRes, incidentsRes, contractsRes, caregiversRes, familiesRes, leadsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }),
    supabase.from('incidents').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('caregivers').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('families').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }),
  ])

  const missions = missionsRes.data || []
  const incidents = incidentsRes.data || []
  const contracts = contractsRes.data || []
  const caregivers = caregiversRes.data || []
  const families = familiesRes.data || []
  const leads = leadsRes.data || []

  const missionsToday = missions.filter((m: any) => m.mission_date === today)
  const inProgress = missions.filter((m: any) => low(m.status) === 'in_progress')
  const completedToday = missionsToday.filter((m: any) => low(m.status) === 'completed')
  const confirmedToday = missionsToday.filter((m: any) => low(m.status) === 'confirmed')
  const assignedToday = missionsToday.filter((m: any) => low(m.status) === 'assigned')
  const incidentMissions = missions.filter((m: any) => low(m.status) === 'incident')
  const cancelledMissions = missions.filter((m: any) => low(m.status) === 'cancelled')
  const urgentMissions = missions.filter((m: any) => low(m.urgency) === 'urgent' && !['completed', 'cancelled'].includes(low(m.status)))
  const unassigned = missions.filter((m: any) => !m.caregiver_id && !['completed', 'cancelled'].includes(low(m.status)))
  const startsSoon = missionsToday.filter((m: any) => {
    const mins = timeToMinutes(m.start_time)
    return mins !== null && mins >= nowMin && mins <= soonMax && !['completed', 'cancelled'].includes(low(m.status))
  })
  const overdueLaunch = missionsToday.filter((m: any) => {
    const mins = timeToMinutes(m.start_time)
    return mins !== null && mins < nowMin && ['draft', 'assigned', 'confirmed'].includes(low(m.status))
  })

  const activeIncidents = incidents.filter((i: any) => !['resolved', 'closed', 'archived'].includes(low(i.status)))
  const severeIncidents = incidents.filter((i: any) => ['high', 'critical', 'urgent'].includes(low(i.severity)))
  const activeContracts = contracts.filter((c: any) => low(c.status) === 'active')
  const pausedContracts = contracts.filter((c: any) => low(c.status) === 'paused')
  const contractsLow = contracts.filter((c: any) => {
    const rem = Number(c.total_sessions || 0) - Number(c.sessions_used || 0)
    return Number(c.total_sessions || 0) > 0 && rem <= 2
  })
  const contractRemaining = contracts.reduce((sum: number, c: any) => sum + Math.max(0, Number(c.total_sessions || 0) - Number(c.sessions_used || 0)), 0)

  const availableCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'available')
  const assignedCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'assigned')
  const blockedCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'blocked')
  const absentCaregivers = caregivers.filter((c: any) => low(c.current_status || c.status) === 'absent')

  const vipFamilies = families.filter((f: any) => low(f.status) === 'vip')
  const pendingLeads = leads.filter((l: any) => ['new', 'pending'].includes(low(l.status)))
  const totalTodayHours = missionsToday.reduce((sum: number, m: any) => sum + Number(m.duration_hours || 0), 0)

  const feedItems = [
    ...urgentMissions.slice(0, 5).map((m: any) => `ALERTE OPS • ${m.mission_code || `#${m.id}`} • mission urgente • ${m.city || 'ville n/a'}`),
    ...startsSoon.slice(0, 5).map((m: any) => `DÉPART PROCHE • ${m.mission_code || `#${m.id}`} • ${m.start_time || '--:--'}`),
    ...overdueLaunch.slice(0, 5).map((m: any) => `RETARD LANCEMENT • ${m.mission_code || `#${m.id}`} • intervention non démarrée`),
    ...contractsLow.slice(0, 5).map((c: any) => `CONTRAT BAS • ${c.contract_reference || `Contract #${c.id}`} • ${Math.max(0, Number(c.total_sessions || 0) - Number(c.sessions_used || 0))} session(s) restante(s)`),
    ...activeIncidents.slice(0, 5).map((i: any) => `INCIDENT OUVERT • ${i.incident_title || i.incident_type || `Incident #${i.id}`}`),
  ]

  return (
    <main style={pageStyle}>
      <DashboardLiveClient feedItems={feedItems} />

      <section style={heroStyle}>
        <div style={{ maxWidth: 840 }}>
          <div style={eyebrowStyle}>AngelCare • Ops Control Tower</div>
          <h1 style={heroTitleStyle}>Operations Command Center</h1>
          <p style={heroSubStyle}>
            Tableau de bord premium style contrôle des opérations pour piloter missions, incidents, contrats,
            capacité terrain et exécution journalière avec lisibilité renforcée et navigation rapide.
          </p>
        </div>

        <div style={heroActionsStyle}>
          <Link href="/missions/new" style={darkButtonStyle}>+ Mission</Link>
          <Link href="/contracts/new" style={lightButtonStyle}>+ Contrat</Link>
          <Link href="/incidents/new" style={lightButtonStyle}>+ Incident</Link>
          <DashboardLiveClient mode="clock" />
        </div>
      </section>

      <section style={quickNavSectionStyle}>
        <div style={quickNavHeaderStyle}>
          <div>
            <div style={sectionMiniLabelStyle}>Navigation principale</div>
            <h2 style={quickNavTitleStyle}>Accès direct aux modules actifs</h2>
          </div>
          <div style={quickNavBadgeStyle}>Live Modules</div>
        </div>

        <div style={topButtonsGridStyle}>
          <TopActionButton href="/caregivers" title="Caregivers" subtitle="Force terrain" icon="👩‍👧" />
          <TopActionButton href="/leads" title="Leads" subtitle="Pipeline entrant" icon="📈" />
          <TopActionButton href="/missions" title="Missions" subtitle="Pilotage live" icon="🛫" />
          <TopActionButton href="/contracts" title="Contracts" subtitle="Sessions & packages" icon="📦" />
          <TopActionButton href="/families" title="Families" subtitle="CRM clients" icon="🏡" />
          <TopActionButton href="/incidents" title="Incidents" subtitle="Risque & qualité" icon="🚨" />
          <TopActionButton href="/pointage" title="Pointage" subtitle="Présence & suivi terrain" icon="🕒" />
        </div>
      </section>

      <section style={widgetGridStyle}>
        <Widget title="Missions aujourd'hui" value={missionsToday.length} subtitle={`${totalTodayHours} heures planifiées`} icon="✈️" />
        <Widget title="Missions en cours" value={inProgress.length} subtitle="Exécution terrain active" icon="🟢" accent="#166534" />
        <Widget title="Démarrages proches" value={startsSoon.length} subtitle="Dans les 120 prochaines minutes" icon="⏱️" accent="#92400e" />
        <Widget title="Missions non assignées" value={unassigned.length} subtitle="Action dispatch prioritaire" icon="⚠️" accent="#9a3412" />
        <Widget title="Incidents ouverts" value={activeIncidents.length} subtitle={`${severeIncidents.length} de niveau élevé`} icon="🚨" accent="#991b1b" />
        <Widget title="Contrats actifs" value={activeContracts.length} subtitle={`${contractsLow.length} à faible solde`} icon="📦" accent="#1d4ed8" />
        <Widget title="Sessions restantes" value={contractRemaining} subtitle="Capacité portefeuille" icon="🎯" accent="#3730a3" />
        <Widget title="Caregivers disponibles" value={availableCaregivers.length} subtitle={`${assignedCaregivers.length} déjà engagées`} icon="👩‍👧" accent="#166534" />
        <Widget title="Leads en attente" value={pendingLeads.length} subtitle={`${leads.length} leads au total`} icon="📞" accent="#7c3aed" />
        <Widget title="Familles VIP" value={vipFamilies.length} subtitle={`${families.length} familles CRM`} icon="⭐" accent="#a21caf" />
        <Widget title="Missions confirmées" value={confirmedToday.length} subtitle={`${percent(confirmedToday.length, missionsToday.length)} du plan jour`} icon="✅" accent="#166534" />
        <Widget title="Missions assignées" value={assignedToday.length} subtitle="Prêtes pour confirmation" icon="🧭" accent="#6d28d9" />
        <Widget title="Missions terminées" value={completedToday.length} subtitle="Livraison du jour" icon="🏁" accent="#166534" />
        <Widget title="Missions incidentées" value={incidentMissions.length} subtitle="Risque opérationnel" icon="🛑" accent="#991b1b" />
        <Widget title="Missions annulées" value={cancelledMissions.length} subtitle="Perte de production" icon="✖" accent="#475569" />
        <Widget title="Caregivers bloquées" value={blockedCaregivers.length} subtitle="Surveillance RH/ops" icon="⛔" accent="#991b1b" />
        <Widget title="Caregivers absentes" value={absentCaregivers.length} subtitle="Impact capacité" icon="🕳️" accent="#9a3412" />
        <Widget title="Contrats en pause" value={pausedContracts.length} subtitle="Pipeline temporairement gelé" icon="⏸️" accent="#92400e" />
        <Widget title="Urgences actives" value={urgentMissions.length} subtitle="Priorité supervision" icon="🔥" accent="#991b1b" />
        <Widget title="Missions en retard" value={overdueLaunch.length} subtitle="Lancement en dépassement" icon="📡" accent="#b45309" />
      </section>

      <div style={mainGridStyle}>
        <Panel title="Live Operations Board" subtitle="Pilotage live multi-flux style control tower" right={<div style={boardPillStyle}>High Visibility</div>}>
          <div style={boardGridStyle}>
            <div style={boardColumnStyle}>
              <div style={boardHeaderStyle}><span>Urgent / Critical</span><span style={statusStyle('urgent')}>urgent</span></div>
              <div style={columnListStyle}>
                {urgentMissions.slice(0, 6).map((m: any) => <MiniRow key={`u-${m.id}`} title={m.mission_code || `Mission #${m.id}`} meta={`${m.service_type || 'Service'} • ${m.city || 'Ville n/a'} • ${m.start_time || '--:--'}`} right={<Chip label={m.status || 'draft'} />} />)}
                {urgentMissions.length === 0 ? <Empty text="Aucune mission urgente." /> : null}
              </div>
            </div>

            <div style={boardColumnStyle}>
              <div style={boardHeaderStyle}><span>Starting Soon</span><span style={statusStyle('normal')}>soon</span></div>
              <div style={columnListStyle}>
                {startsSoon.slice(0, 6).map((m: any) => <MiniRow key={`s-${m.id}`} title={m.mission_code || `Mission #${m.id}`} meta={`${m.city || 'Ville n/a'} • ${m.start_time || '--:--'} → ${m.end_time || '--:--'}`} right={<Chip label={m.status || 'draft'} />} />)}
                {startsSoon.length === 0 ? <Empty text="Aucun départ proche." /> : null}
              </div>
            </div>

            <div style={boardColumnStyle}>
              <div style={boardHeaderStyle}><span>Unassigned</span><span style={statusStyle('paused')}>dispatch</span></div>
              <div style={columnListStyle}>
                {unassigned.slice(0, 6).map((m: any) => <MiniRow key={`a-${m.id}`} title={m.mission_code || `Mission #${m.id}`} meta={`${m.service_type || 'Service'} • ${m.city || 'Ville n/a'}`} right={<Chip label={m.status || 'draft'} />} />)}
                {unassigned.length === 0 ? <Empty text="Toutes les missions sont assignées." /> : null}
              </div>
            </div>

            <div style={boardColumnStyle}>
              <div style={boardHeaderStyle}><span>Incidents / Alerts</span><span style={statusStyle('incident')}>risk</span></div>
              <div style={columnListStyle}>
                {activeIncidents.slice(0, 6).map((i: any) => <MiniRow key={`i-${i.id}`} title={i.incident_title || i.incident_type || `Incident #${i.id}`} meta={`${i.severity || 'severity n/a'} • ${i.status || 'status n/a'}`} />)}
                {activeIncidents.length === 0 ? <Empty text="Aucun incident ouvert." /> : null}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Morning Opening Widget" subtitle="Checklist d’ouverture quotidienne">
          <CheckRow label="Missions du jour chargées" value={`${missionsToday.length}`} positive={missionsToday.length > 0} />
          <CheckRow label="Missions non assignées" value={`${unassigned.length}`} positive={unassigned.length === 0} />
          <CheckRow label="Urgences actives" value={`${urgentMissions.length}`} positive={urgentMissions.length === 0} />
          <CheckRow label="Caregivers disponibles" value={`${availableCaregivers.length}`} positive={availableCaregivers.length > 0} />
          <CheckRow label="Incidents ouverts" value={`${activeIncidents.length}`} positive={activeIncidents.length === 0} />
        </Panel>

        <Panel title="Day Closing Widget" subtitle="Clôture, qualité d’exécution et risques restants">
          <CheckRow label="Missions terminées aujourd'hui" value={`${completedToday.length}`} positive={completedToday.length >= 0} />
          <CheckRow label="Missions encore en cours" value={`${inProgress.length}`} positive={inProgress.length === 0} />
          <CheckRow label="Retards non résolus" value={`${overdueLaunch.length}`} positive={overdueLaunch.length === 0} />
          <CheckRow label="Incidents encore ouverts" value={`${activeIncidents.length}`} positive={activeIncidents.length === 0} />
          <CheckRow label="Taux de complétion jour" value={percent(completedToday.length, missionsToday.length)} positive={missionsToday.length === 0 || completedToday.length / missionsToday.length >= 0.7} />
        </Panel>

        <Panel title="Priority Alerts" subtitle="Signalisation stratégique prioritaire">
          <div style={columnListStyle}>
            {[...urgentMissions.slice(0, 4), ...overdueLaunch.slice(0, 4)].map((m: any) => (
              <div key={`alert-${m.id}`} style={alertCardStyle}>
                <div style={{ fontWeight: 900, color: '#991b1b' }}>{m.mission_code || `Mission #${m.id}`}</div>
                <div style={miniRowMetaStyle}>{m.service_type || 'Service'} • {m.city || 'Ville n/a'} • {m.start_time || '--:--'}</div>
              </div>
            ))}
            {urgentMissions.length + overdueLaunch.length === 0 ? <Empty text="Aucune alerte prioritaire active." /> : null}
          </div>
        </Panel>

        <Panel title="Upcoming Mission Sequence" subtitle="File de départ du jour">
          <div style={columnListStyle}>
            {missionsToday.slice(0, 8).map((m: any) => (
              <div key={`seq-${m.id}`} style={sequenceRowStyle}>
                <div>
                  <div style={miniRowTitleStyle}>{m.mission_code || `Mission #${m.id}`}</div>
                  <div style={miniRowMetaStyle}>{m.service_type || 'Service'} • {m.city || 'Ville n/a'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip label={m.status || 'draft'} />
                  <span style={timeTagStyle}>{m.start_time || '--:--'} → {m.end_time || '--:--'}</span>
                </div>
              </div>
            ))}
            {missionsToday.length === 0 ? <Empty text="Aucune mission planifiée aujourd’hui." /> : null}
          </div>
        </Panel>

        <Panel title="Contract Capacity Radar" subtitle="Suivi portefeuille et consommation sessions">
          <div style={columnListStyle}>
            {contracts.slice(0, 8).map((c: any) => {
              const total = Number(c.total_sessions || 0)
              const used = Number(c.sessions_used || 0)
              const rem = Math.max(0, total - used)
              const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0
              return (
                <div key={`c-${c.id}`} style={contractRowStyle}>
                  <div style={{ minWidth: 0 }}>
                    <div style={miniRowTitleStyle}>{c.contract_reference || `Contract #${c.id}`}</div>
                    <div style={miniRowMetaStyle}>{c.service_type || 'Service'} • {rem} session(s) restante(s)</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={progressTrackStyle}><div style={{ ...progressFillStyle, width: `${pct}%` }} /></div>
                  </div>
                  <Chip label={c.status || 'draft'} />
                </div>
              )
            })}
            {contracts.length === 0 ? <Empty text="Aucun contrat actif." /> : null}
          </div>
        </Panel>

        <Panel title="Workforce Readiness" subtitle="Capacité terrain et statuts caregivers">
          <div style={miniStatsGridStyle}>
            <Widget title="Available" value={availableCaregivers.length} icon="🟢" accent="#166534" />
            <Widget title="Assigned" value={assignedCaregivers.length} icon="🧭" accent="#6d28d9" />
            <Widget title="Blocked" value={blockedCaregivers.length} icon="⛔" accent="#991b1b" />
            <Widget title="Absent" value={absentCaregivers.length} icon="🕳️" accent="#9a3412" />
          </div>
        </Panel>

        <Panel title="CRM & Demand Intake" subtitle="Vision commerciale et flux entrant">
          <div style={miniStatsGridStyle}>
            <Widget title="Leads total" value={leads.length} icon="📈" accent="#7c3aed" />
            <Widget title="Pending leads" value={pendingLeads.length} icon="📬" accent="#92400e" />
            <Widget title="Families active" value={families.length} icon="🏡" accent="#1d4ed8" />
            <Widget title="VIP families" value={vipFamilies.length} icon="💎" accent="#a21caf" />
          </div>
        </Panel>

        <Panel title="Fast Navigation" subtitle="Modules cœur du cockpit" right={<span style={quickNavBadgeStyle}>OPS READY</span>}>
          <div style={navGridStyle}>
            <NavCard href="/missions" title="Missions" subtitle="Pilotage terrain" icon="🛫" />
            <NavCard href="/contracts" title="Contracts" subtitle="Packages & sessions" icon="📦" />
            <NavCard href="/caregivers" title="Caregivers" subtitle="Force terrain" icon="👩‍👧" />
            <NavCard href="/families" title="Families" subtitle="CRM clients" icon="🏡" />
            <NavCard href="/incidents" title="Incidents" subtitle="Risque & qualité" icon="🚨" />
            <NavCard href="/leads" title="Leads" subtitle="Pipeline" icon="📈" />
          </div>
        </Panel>
      </div>
    </main>
  )
}

function TopActionButton({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string
  title: string
  subtitle: string
  icon: string
}) {
  return (
    <Link href={href} style={topActionButtonStyle}>
      <div style={topActionIconStyle}>{icon}</div>
      <div>
        <div style={topActionTitleStyle}>{title}</div>
        <div style={topActionSubStyle}>{subtitle}</div>
      </div>
    </Link>
  )
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  background: 'linear-gradient(180deg, #07111f 0%, #0f172a 16%, #edf2f7 16%, #eef2f7 100%)',
  minHeight: '100vh',
}
const heroStyle: React.CSSProperties = {
  marginTop: 60,
  marginBottom: 18,
  borderRadius: 30,
  padding: 30,
  background: 'linear-gradient(135deg, #0b1220 0%, #17243a 45%, #22395d 100%)',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 24,
  flexWrap: 'wrap',
  boxShadow: '0 28px 80px rgba(15, 23, 42, 0.36)',
  border: '1px solid rgba(255,255,255,0.08)',
}
const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '7px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  color: '#dbe7ff',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
  letterSpacing: 0.7,
}
const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 48,
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: -1.2,
  color: '#f8fafc',
textShadow: '0 2px 12px rgba(0,0,0,0.4)',
}
const heroSubStyle: React.CSSProperties = { color: '#d2def0', margin: '14px 0 0 0', fontSize: 17, maxWidth: 780, lineHeight: 1.7 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }
const darkButtonStyle: React.CSSProperties = { background: '#ffffff', color: '#07111f', padding: '12px 18px', borderRadius: 14, textDecoration: 'none', fontWeight: 900, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 10px 26px rgba(255,255,255,0.08)' }
const lightButtonStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.10)', color: '#ffffff', padding: '12px 18px', borderRadius: 14, textDecoration: 'none', fontWeight: 900, border: '1px solid rgba(255,255,255,0.16)' }

const quickNavSectionStyle: React.CSSProperties = {
  marginBottom: 20,
  borderRadius: 24,
  padding: 22,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
  border: '1px solid #dbe3ee',
  boxShadow: '0 18px 38px rgba(15, 23, 42, 0.07)',
}
const quickNavHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }
const sectionMiniLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 800, marginBottom: 6, letterSpacing: 0.4 }
const quickNavTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 900 }
const quickNavBadgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd', fontSize: 12, fontWeight: 900 }
const topButtonsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12 }
const topActionButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, boxShadow: '0 12px 26px rgba(15, 23, 42, 0.05)' }
const topActionIconStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 22 }
const topActionTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 15, fontWeight: 900 }
const topActionSubStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: 600 }

const widgetGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, marginBottom: 20 }
const widgetStyle: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)', borderRadius: 22, padding: 18, border: '1px solid #dbe3ee', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.07)' }
const widgetLabelStyle: React.CSSProperties = { color: '#5b6b83', fontSize: 13, fontWeight: 800, marginBottom: 8, letterSpacing: 0.2 }
const widgetValueStyle: React.CSSProperties = { fontSize: 34, lineHeight: 1, fontWeight: 900, letterSpacing: -1 }
const widgetSubStyle: React.CSSProperties = { color: '#46566e', fontSize: 13, marginTop: 9, lineHeight: 1.55, fontWeight: 600 }
const widgetIconStyle: React.CSSProperties = { width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', fontSize: 24, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }

const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }
const panelStyle: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,252,255,0.99) 100%)', borderRadius: 24, padding: 22, border: '1px solid #dbe3ee', boxShadow: '0 18px 38px rgba(15, 23, 42, 0.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 25, fontWeight: 900, letterSpacing: -0.4 }
const panelSubStyle: React.CSSProperties = { color: '#64748b', marginTop: 6, fontSize: 13, fontWeight: 600 }

const boardPillStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc', fontSize: 12, fontWeight: 900 }
const boardGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }
const boardColumnStyle: React.CSSProperties = { background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderRadius: 18, padding: 14, border: '1px solid #e2e8f0' }
const boardHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, fontWeight: 900, color: '#0f172a' }
const columnListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const miniRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, borderRadius: 14, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12, boxShadow: '0 6px 14px rgba(15, 23, 42, 0.03)' }
const miniRowTitleStyle: React.CSSProperties = { fontWeight: 900, color: '#0f172a', fontSize: 14 }
const miniRowMetaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 4, lineHeight: 1.5, fontWeight: 600 }
const emptyStyle: React.CSSProperties = { padding: 14, borderRadius: 14, border: '1px dashed #cbd5e1', background: '#ffffff', color: '#64748b', fontSize: 13, fontWeight: 600 }

const checkRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #edf2f7' }
const okDotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 4px rgba(22,163,74,0.12)' }
const warnDotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, background: '#dc2626', display: 'inline-block', boxShadow: '0 0 0 4px rgba(220,38,38,0.10)' }

const alertCardStyle: React.CSSProperties = { borderRadius: 16, background: 'linear-gradient(180deg, #fff7f7 0%, #ffffff 100%)', border: '1px solid #fecaca', padding: 12 }
const sequenceRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12 }
const timeTagStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 800 }
const contractRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff', padding: 12 }
const progressTrackStyle: React.CSSProperties = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: React.CSSProperties = { height: 10, borderRadius: 999, background: 'linear-gradient(90deg, #0f172a 0%, #2563eb 100%)' }
const miniStatsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }

const navGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const navCardStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', borderRadius: 18, border: '1px solid #e2e8f0', background: '#ffffff', padding: 14, textDecoration: 'none', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }
const navCardIconStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 22 }