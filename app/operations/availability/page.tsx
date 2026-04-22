import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Caregiver = {
  id: number
  full_name: string | null
  city: string | null
  zone?: string | null
  status: string | null
  current_status?: string | null
  phone?: string | null
  reliability_score?: number | null
  skill_tags?: string[] | null
  language_tags?: string[] | null
  special_needs_capable?: boolean | null
}

type Mission = {
  id: number
  service_type: string | null
  status: string | null
  urgency: string | null
  mission_date: string | null
  start_time: string | null
  end_time: string | null
  caregiver_id: number | null
  family_id: number | null
  city?: string | null
  zone?: string | null
}

type CaregiverCheckin = {
  id: number
  caregiver_id: number
  mission_id: number | null
  city: string | null
  zone: string | null
  event_type: 'check_in' | 'check_out'
  event_time: string
  notes: string | null
}

type Incident = {
  id: number
  incident_title?: string | null
  incident_type?: string | null
  severity: string | null
  status: string | null
  caregiver_id?: number | null
  created_at: string
}

const STATUS_COLUMNS = [
  { key: 'available', label: 'Disponibles' },
  { key: 'assigned', label: 'Assignées' },
  { key: 'in_mission', label: 'En mission' },
  { key: 'absent', label: 'Absentes' },
  { key: 'blocked', label: 'Bloquées' },
] as const

export default async function AvailabilityBoardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [caregiversRes, missionsRes, checkinsRes, incidentsRes] = await Promise.all([
    supabase.from('caregivers').select('*').order('full_name', { ascending: true }),
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }),
    supabase.from('incidents').select('*').order('created_at', { ascending: false }),
  ])

  const caregivers = (caregiversRes.data || []) as Caregiver[]
  const missions = (missionsRes.data || []) as Mission[]
  const checkins = (checkinsRes.data || []) as CaregiverCheckin[]
  const incidents = (incidentsRes.data || []) as Incident[]

  const latestCheckinByCaregiver = new Map<number, CaregiverCheckin>()
  for (const checkin of checkins) {
    if (!latestCheckinByCaregiver.has(checkin.caregiver_id)) {
      latestCheckinByCaregiver.set(checkin.caregiver_id, checkin)
    }
  }

  const activeCheckins = Array.from(latestCheckinByCaregiver.values()).filter(
    (item) => item.event_type === 'check_in'
  )

  const todayMissions = missions.filter((m) => m.mission_date === today)
  const caregiverMissionMap = new Map<number, Mission[]>()
  for (const mission of todayMissions) {
    if (!mission.caregiver_id) continue
    if (!caregiverMissionMap.has(mission.caregiver_id)) caregiverMissionMap.set(mission.caregiver_id, [])
    caregiverMissionMap.get(mission.caregiver_id)!.push(mission)
  }

  const caregiverIncidentMap = new Map<number, Incident[]>()
  for (const incident of incidents) {
    if (!incident.caregiver_id) continue
    if (!caregiverIncidentMap.has(incident.caregiver_id)) caregiverIncidentMap.set(incident.caregiver_id, [])
    caregiverIncidentMap.get(incident.caregiver_id)!.push(incident)
  }

  const statusBuckets = {
    available: [] as Caregiver[],
    assigned: [] as Caregiver[],
    in_mission: [] as Caregiver[],
    absent: [] as Caregiver[],
    blocked: [] as Caregiver[],
  }

  caregivers.forEach((caregiver) => {
    const status = ((caregiver.current_status || caregiver.status || 'available') as string).toLowerCase()
    if (status in statusBuckets) {
      statusBuckets[status as keyof typeof statusBuckets].push(caregiver)
    } else {
      statusBuckets.available.push(caregiver)
    }
  })

  const cityStats = Array.from(
    caregivers.reduce((map, caregiver) => {
      const city = caregiver.city || 'Ville non définie'
      if (!map.has(city)) {
        map.set(city, { city, total: 0, available: 0, assigned: 0, inMission: 0 })
      }
      const row = map.get(city)!
      row.total += 1
      const status = (caregiver.current_status || caregiver.status || 'available').toLowerCase()
      if (status === 'available') row.available += 1
      if (status === 'assigned') row.assigned += 1
      if (status === 'in_mission') row.inMission += 1
      return map
    }, new Map<string, { city: string; total: number; available: number; assigned: number; inMission: number }>()).values()
  )

  const skillDistribution = Array.from(
    caregivers.reduce((map, caregiver) => {
      const tags = Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []
      tags.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1))
      return map
    }, new Map<string, number>()).entries()
  ).sort((a, b) => b[1] - a[1])

  const replacementShortlist = caregivers
    .filter((caregiver) => (caregiver.current_status || caregiver.status || '').toLowerCase() === 'available')
    .map((caregiver) => {
      const reliability = Number(caregiver.reliability_score || 0)
      const skills = Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags.length : 0
      const languages = Array.isArray(caregiver.language_tags) ? caregiver.language_tags.length : 0
      const score = reliability + skills * 12 + languages * 5 + (caregiver.special_needs_capable ? 10 : 0)
      return { caregiver, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  const noMissionToday = caregivers.filter((caregiver) => !caregiverMissionMap.has(caregiver.id))
  const riskyProfiles = caregivers
    .map((caregiver) => {
      const openIssues = (caregiverIncidentMap.get(caregiver.id) || []).filter((i) => {
        const status = (i.status || '').toLowerCase()
        return status === 'open' || status === 'in_progress'
      }).length
      const reliability = Number(caregiver.reliability_score || 0)
      const status = (caregiver.current_status || caregiver.status || '').toLowerCase()
      const riskScore = openIssues * 30 + (status === 'absent' ? 20 : 0) + (status === 'blocked' ? 40 : 0) + (reliability < 50 ? 20 : 0)
      return { caregiver, openIssues, riskScore }
    })
    .filter((item) => item.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Workforce Command</div>
          <h1 style={titleStyle}>Availability & Dispatch Board</h1>
          <p style={subtitleStyle}>
            Vue opérationnelle des intervenantes, couverture du jour, remplacements et profils à risque.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/caregivers" style={secondaryButtonStyle}>Caregivers</Link>
          <Link href="/missions" style={secondaryButtonStyle}>Missions</Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <KpiCard label="Disponibles" value={statusBuckets.available.length} />
        <KpiCard label="Assignées" value={statusBuckets.assigned.length} />
        <KpiCard label="En mission" value={statusBuckets.in_mission.length} />
        <KpiCard label="Absentes" value={statusBuckets.absent.length} />
        <KpiCard label="Bloquées" value={statusBuckets.blocked.length} />
        <KpiCard label="Sans mission aujourd’hui" value={noMissionToday.length} />
      </section>

      <div style={boardGridStyle}>
        {STATUS_COLUMNS.map((column) => {
          const list = statusBuckets[column.key]
          return (
            <section key={column.key} style={columnStyle}>
              <div style={columnHeaderStyle}>
                <h2 style={columnTitleStyle}>{column.label}</h2>
                <span style={countPillStyle}>{list.length}</span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {list.length > 0 ? (
                  list.map((caregiver) => {
                    const missionsForCaregiver = caregiverMissionMap.get(caregiver.id) || []
                    const latestCheckin = latestCheckinByCaregiver.get(caregiver.id)
                    return (
                      <div key={caregiver.id} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <div style={nameStyle}>{caregiver.full_name || `Caregiver #${caregiver.id}`}</div>
                            <div style={metaStyle}>{caregiver.city || 'Ville non définie'}{caregiver.zone ? ` • ${caregiver.zone}` : ''}</div>
                          </div>
                          <span style={statusBadgeStyle(column.key)}>{column.key}</span>
                        </div>

                        <div style={miniMetaGridStyle}>
                          <span>📞 {caregiver.phone || 'Sans téléphone'}</span>
                          <span>⭐ {caregiver.reliability_score ?? 0}</span>
                        </div>

                        {Array.isArray(caregiver.skill_tags) && caregiver.skill_tags.length > 0 ? (
                          <div style={tagWrapStyle}>
                            {caregiver.skill_tags.slice(0, 4).map((tag) => (
                              <span key={tag} style={tagStyle}>{tag}</span>
                            ))}
                          </div>
                        ) : null}

                        {missionsForCaregiver.length > 0 ? (
                          <div style={missionLinkedStyle}>
                            Aujourd’hui: {missionsForCaregiver.length} mission(s)
                          </div>
                        ) : (
                          <div style={missionUnlinkedStyle}>Aucune mission aujourd’hui</div>
                        )}

                        {latestCheckin ? (
                          <div style={checkinStyle}>
                            Dernier pointage: {latestCheckin.event_type === 'check_in' ? 'Check-in' : 'Check-out'} • {new Date(latestCheckin.event_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 12 }}>
                          <Link href={`/caregivers/${caregiver.id}`} style={linkButtonStyle}>Voir profil</Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={emptyStyle}>Aucune intervenante dans cette colonne.</div>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <section style={widgetsGridStyle}>
        <Panel title="🧭 Couverture par ville">
          <div style={{ display: 'grid', gap: 10 }}>
            {cityStats.map((row) => (
              <div key={row.city} style={rowCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{row.city}</strong>
                  <span style={row.available > 0 ? okPillStyle : warningPillStyle}>
                    {row.available > 0 ? 'Couverture OK' : 'Sous tension'}
                  </span>
                </div>
                <div style={rowStatsStyle}>
                  <span>Total: {row.total}</span>
                  <span>Disponibles: {row.available}</span>
                  <span>Assignées: {row.assigned}</span>
                  <span>En mission: {row.inMission}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="⚡ Meilleurs remplaçants immédiats">
          <div style={{ display: 'grid', gap: 10 }}>
            {replacementShortlist.length > 0 ? replacementShortlist.map(({ caregiver, score }) => (
              <div key={caregiver.id} style={rowCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{caregiver.full_name || `Caregiver #${caregiver.id}`}</strong>
                  <span style={okPillStyle}>Score {score}</span>
                </div>
                <div style={metaStyle}>{caregiver.city || 'Ville non définie'}</div>
                <div style={metaStyle}>Skills: {Array.isArray(caregiver.skill_tags) && caregiver.skill_tags.length > 0 ? caregiver.skill_tags.join(', ') : 'Non définies'}</div>
              </div>
            )) : <div style={emptyStyle}>Aucun remplaçant disponible.</div>}
          </div>
        </Panel>
      </section>

      <section style={widgetsGridStyle}>
        <Panel title="📚 Distribution des compétences">
          <div style={skillBoardStyle}>
            {skillDistribution.length > 0 ? skillDistribution.map(([skill, count]) => (
              <div key={skill} style={skillCardStyle}>
                <div style={skillCodeStyle}>{skill}</div>
                <div style={skillCountStyle}>{count}</div>
              </div>
            )) : <div style={emptyStyle}>Aucune compétence codée.</div>}
          </div>
        </Panel>

        <Panel title="⚠️ Profils à risque">
          <div style={{ display: 'grid', gap: 10 }}>
            {riskyProfiles.length > 0 ? riskyProfiles.map(({ caregiver, openIssues, riskScore }) => (
              <div key={caregiver.id} style={rowCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{caregiver.full_name || `Caregiver #${caregiver.id}`}</strong>
                  <span style={warningPillStyle}>Risque {riskScore}</span>
                </div>
                <div style={metaStyle}>Incidents ouverts: {openIssues}</div>
                <div style={metaStyle}>Statut: {(caregiver.current_status || caregiver.status || 'available')}</div>
              </div>
            )) : <div style={emptyStyle}>Aucun profil à risque détecté.</div>}
          </div>
        </Panel>
      </section>
    </main>
  )
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>{label}</div>
      <div style={kpiValueStyle}>{value}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={panelTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    available: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    assigned: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    in_mission: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    absent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    blocked: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
  }
  const color = map[status] || map.available
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
    fontSize: 12,
    fontWeight: 800,
  }
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial, sans-serif',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  minHeight: '100vh',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 24,
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#334155',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 18,
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  padding: '12px 16px',
  borderRadius: 12,
  textDecoration: 'none',
  fontWeight: 800,
  border: '1px solid #cbd5e1',
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
}

const kpiCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  marginBottom: 8,
}

const kpiValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#0f172a',
}

const boardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 24,
}

const columnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 20,
  padding: 16,
  border: '1px solid #dbe3ee',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
  alignSelf: 'start',
}

const columnHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
}

const columnTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 800,
}

const countPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 28,
  height: 28,
  padding: '0 10px',
  borderRadius: 999,
  background: '#0f172a',
  color: 'white',
  fontSize: 12,
  fontWeight: 800,
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const nameStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 16,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginTop: 4,
}

const miniMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  color: '#475569',
  fontSize: 13,
  marginTop: 10,
}

const tagWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 10,
}

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#ede9fe',
  color: '#6d28d9',
  border: '1px solid #ddd6fe',
  fontSize: 12,
  fontWeight: 800,
}

const missionLinkedStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#166534',
  fontSize: 13,
  fontWeight: 700,
}

const missionUnlinkedStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#92400e',
  fontSize: 13,
  fontWeight: 700,
}

const checkinStyle: React.CSSProperties = {
  marginTop: 8,
  color: '#334155',
  fontSize: 12,
}

const linkButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}

const emptyStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  padding: 12,
  borderRadius: 12,
  border: '1px dashed #cbd5e1',
  background: '#fff',
}

const widgetsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
}

const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const rowCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const rowStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginTop: 10,
  color: '#475569',
  fontSize: 13,
}

const okPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  fontSize: 12,
  fontWeight: 800,
}

const warningPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#fef3c7',
  color: '#92400e',
  border: '1px solid #fde68a',
  fontSize: 12,
  fontWeight: 800,
}

const skillBoardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
}

const skillCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
  textAlign: 'center',
}

const skillCodeStyle: React.CSSProperties = {
  color: '#6d28d9',
  fontWeight: 800,
  fontSize: 18,
  marginBottom: 8,
}

const skillCountStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}
