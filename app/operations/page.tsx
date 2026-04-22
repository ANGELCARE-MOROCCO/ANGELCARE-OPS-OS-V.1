import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Lead = {
  id: number
  parent_name: string | null
  phone: string | null
  city: string | null
  source: string | null
  service_needed: string | null
  service_interests: string[] | null
  urgency: string | null
  status: string | null
  created_at: string
}

type Caregiver = {
  id: number
  full_name: string | null
  city: string | null
  zone?: string | null
  status: string | null
  current_status?: string | null
  reliability_score?: number | null
  skill_tags?: string[] | null
  language_tags?: string[] | null
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
  notes: string | null
  created_at?: string | null
}

type Family = {
  id: number
  family_name: string | null
  parent_name: string | null
  city: string | null
  status: string | null
  created_at?: string | null
}

type Incident = {
  id: number
  incident_title?: string | null
  incident_type?: string | null
  severity: string | null
  status: string | null
  created_at: string
  resolved_at?: string | null
}

type LeadTask = {
  id: number
  lead_id: number
  task_type: string
  status: string | null
  due_at: string | null
  created_at: string
}

type LeadReminder = {
  id: number
  lead_id: number
  reason: string
  status: string | null
  remind_at: string
  created_at: string
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

const OPERATING_CITIES = ['Casablanca', 'Rabat', 'Kénitra', 'Marrakech', 'Tanger', 'Mohammédia']

const CITY_MAP_POINTS: Record<string, { x: number; y: number }> = {
  Tanger: { x: 196, y: 78 },
  Rabat: { x: 172, y: 170 },
  Mohammédia: { x: 186, y: 190 },
  Casablanca: { x: 177, y: 208 },
  Kénitra: { x: 165, y: 150 },
  Marrakech: { x: 154, y: 292 },
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const selectedDay = resolvedSearchParams?.day
  const supabase = await createClient()

  const [
    leadsRes,
    caregiversRes,
    missionsRes,
    incidentsRes,
    tasksRes,
    remindersRes,
    checkinsRes,
    familiesRes,
  ] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('caregivers').select('*').order('id', { ascending: true }),
    supabase.from('missions').select('*').order('mission_date', { ascending: true }),
    supabase.from('incidents').select('*').order('created_at', { ascending: false }),
    supabase.from('lead_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('lead_reminders').select('*').order('created_at', { ascending: false }),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }),
    supabase.from('families').select('*').order('created_at', { ascending: false }),
  ])

  const leads = (leadsRes.data || []) as Lead[]
  const caregivers = (caregiversRes.data || []) as Caregiver[]
  const missions = (missionsRes.data || []) as Mission[]
  const incidents = (incidentsRes.data || []) as Incident[]
  const tasks = (tasksRes.data || []) as LeadTask[]
  const reminders = (remindersRes.data || []) as LeadReminder[]
  const checkins = (checkinsRes.data || []) as CaregiverCheckin[]
  const families = (familiesRes.data || []) as Family[]

  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const tomorrowISO = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)
  const currentDateLong = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const currentTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const latestCheckinByCaregiver = new Map<number, CaregiverCheckin>()
  for (const checkin of checkins) {
    if (!latestCheckinByCaregiver.has(checkin.caregiver_id)) {
      latestCheckinByCaregiver.set(checkin.caregiver_id, checkin)
    }
  }

  const activeDeployments = Array.from(latestCheckinByCaregiver.values()).filter(
    (checkin) => checkin.event_type === 'check_in'
  )
  const activeCaregiverIds = new Set(activeDeployments.map((d) => d.caregiver_id))

  const todayMissionsList = missions.filter((m) => m.mission_date === todayISO)
  const filteredMissions = missions.filter((m) =>
    selectedDay ? m.mission_date === selectedDay : m.mission_date === todayISO
  )
  const activeDay = selectedDay || todayISO

  const missionDays = Array.from(new Set(missions.map((m) => m.mission_date).filter(Boolean))) as string[]

  const totalLeads = leads.length
  const urgentLeads = leads.filter((l) => isUrgent(l.urgency)).length
  const totalCaregivers = caregivers.length
  const availableCaregivers = caregivers.filter((c) => isAvailable(c)).length
  const deployedCaregivers = activeDeployments.length
  const totalMissions = missions.length
  const todayMissions = todayMissionsList.length
  const openIncidents = incidents.filter((i) => isOpenIncident(i.status)).length
  const todayReminders = reminders.filter((r) => String(r.remind_at).slice(0, 10) === todayISO && isPending(r.status)).length

  const cityCoverage = OPERATING_CITIES.map((city) => {
    const caregiversInCity = caregivers.filter((c) => normalizeCity(c.city) === normalizeCity(city))
    const activeInCity = activeDeployments.filter((d) => normalizeCity(d.city) === normalizeCity(city))
    const availableInCity = caregiversInCity.filter((c) => isAvailable(c)).length
    const leadsInCity = leads.filter((l) => normalizeCity(l.city) === normalizeCity(city)).length
    const familiesInCity = families.filter((f) => normalizeCity(f.city) === normalizeCity(city)).length
    const missionsInCity = missions.filter((m) => normalizeCity(m.city) === normalizeCity(city) && m.mission_date === todayISO).length

    return {
      city,
      deployed: activeInCity.length,
      available: availableInCity,
      totalCaregivers: caregiversInCity.length,
      leads: leadsInCity,
      families: familiesInCity,
      missionsToday: missionsInCity,
      point: CITY_MAP_POINTS[city],
      activeZones: activeInCity.map((d) => d.zone).filter(Boolean) as string[],
    }
  })

  const missionsTodayWithoutCheckin = missions.filter(
    (mission) => mission.mission_date === todayISO && mission.caregiver_id && !activeCaregiverIds.has(mission.caregiver_id)
  )
  const missionsWithoutCaregiverToday = todayMissionsList.filter((m) => !m.caregiver_id)
  const urgentDraftMissions = missions.filter((m) => isUrgent(m.urgency) && (m.status || '').toLowerCase() === 'draft')
  const orphanCheckins = activeDeployments.filter((deployment) => !deployment.mission_id)
  const overdueReminders = reminders.filter((reminder) => isPending(reminder.status) && new Date(reminder.remind_at) < now)
  const urgentUntreatedLeads = leads.filter((lead) => isUrgent(lead.urgency) && ['new', 'contacted'].includes((lead.status || 'new').toLowerCase()))
  const criticalOpenIncidents = incidents.filter((i) => (i.severity || '').toLowerCase() === 'critical' && isOpenIncident(i.status))

  const todayUpcomingWindow = todayMissionsList.filter((mission) => {
    if (!mission.start_time) return false
    const [hours, minutes] = mission.start_time.split(':').map(Number)
    const missionStart = new Date(now)
    missionStart.setHours(hours || 0, minutes || 0, 0, 0)
    const diff = missionStart.getTime() - now.getTime()
    return diff >= 0 && diff <= 2 * 60 * 60 * 1000
  })

  const missionsTomorrow = missions.filter((m) => m.mission_date === tomorrowISO)
  const groupedUpcoming = groupByCategory(missions.filter((m) => m.mission_date && m.mission_date >= todayISO))

  const completedToday = todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'completed').length
  const inProgressToday = todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'in_progress').length
  const assignedToday = todayMissionsList.filter((m) => !!m.caregiver_id).length
  const incidentsToday = incidents.filter((i) => String(i.created_at || '').slice(0, 10) === todayISO).length

  const caregiversAssigned = caregivers.filter((c) => (c.current_status || c.status || '').toLowerCase() === 'assigned').length
  const caregiversInMission = caregivers.filter((c) => (c.current_status || c.status || '').toLowerCase() === 'in_mission').length
  const caregiversAbsent = caregivers.filter((c) => (c.current_status || c.status || '').toLowerCase() === 'absent').length
  const caregiversBlocked = caregivers.filter((c) => (c.current_status || c.status || '').toLowerCase() === 'blocked').length

  const unresolvedOver24h = incidents.filter((i) => {
    if (!isOpenIncident(i.status)) return false
    return now.getTime() - new Date(i.created_at).getTime() > 24 * 60 * 60 * 1000
  }).length

  const leadPipeline = {
    new: leads.filter((l) => (l.status || '').toLowerCase() === 'new').length,
    contacted: leads.filter((l) => (l.status || '').toLowerCase() === 'contacted').length,
    qualified: leads.filter((l) => (l.status || '').toLowerCase() === 'qualified').length,
    converted: leads.filter((l) => (l.status || '').toLowerCase() === 'converted').length,
  }

  const tasksDueToday = tasks.filter((t) => t.due_at && String(t.due_at).slice(0, 10) === todayISO).length
  const tasksPending = tasks.filter((t) => (t.status || '').toLowerCase() !== 'done').length
  const vipFamilies = families.filter((f) => (f.status || '').toLowerCase() === 'vip').length
  const todaysMissionCoverage = todayMissions === 0 ? 100 : Math.round((assignedToday / todayMissions) * 100)
  const openIncidentRate = totalMissions === 0 ? 0 : Math.round((openIncidents / totalMissions) * 100)

  const totalCriticalAlerts =
    missionsTodayWithoutCheckin.length +
    orphanCheckins.length +
    overdueReminders.length +
    urgentUntreatedLeads.length +
    criticalOpenIncidents.length +
    missionsWithoutCaregiverToday.length

  const topPriorityItems = [
    ...missionsWithoutCaregiverToday.slice(0, 3).map((m) => ({
      label: `Assigner mission #${m.id}`,
      meta: `${m.service_type || 'Mission'} • ${m.city || 'Ville non définie'}`,
      tone: 'urgent',
    })),
    ...criticalOpenIncidents.slice(0, 2).map((i) => ({
      label: `Traiter incident critique #${i.id}`,
      meta: i.incident_title || i.incident_type || 'Incident critique',
      tone: 'danger',
    })),
    ...todayUpcomingWindow.slice(0, 2).map((m) => ({
      label: `Mission imminente #${m.id}`,
      meta: `${formatMissionTime(m.start_time, m.end_time)} • ${m.service_type || 'Mission'}`,
      tone: 'normal',
    })),
  ].slice(0, 6)

  const readinessScore = Math.max(
    0,
    Math.min(100, 100 - Math.min(35, missionsWithoutCaregiverToday.length * 6) - totalCriticalAlerts * 3 - caregiversAbsent * 2)
  )

  const dashboardHealth =
    totalCriticalAlerts > 5 ? '⚠️ Sous tension' : totalCriticalAlerts > 0 ? '🟠 Surveillance' : '✅ Stable'

  const liveBoardColumns = [
    {
      key: 'a_confirmer',
      title: 'À confirmer',
      items: todayMissionsList.filter((m) => ['draft', 'new'].includes((m.status || '').toLowerCase())),
    },
    {
      key: 'assignees',
      title: 'Assignées',
      items: todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'assigned'),
    },
    {
      key: 'imminentes',
      title: 'À démarrer',
      items: todayUpcomingWindow,
    },
    {
      key: 'encours',
      title: 'En cours',
      items: todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'in_progress'),
    },
    {
      key: 'terminees',
      title: 'Terminées',
      items: todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'completed'),
    },
    {
      key: 'incident',
      title: 'Incident',
      items: todayMissionsList.filter((m) => (m.status || '').toLowerCase() === 'incident'),
    },
  ]

  const missionCategoriesToday = groupByCategory(todayMissionsList)
  const lowCoverageCities = cityCoverage.filter((city) => city.missionsToday > 0 && city.available === 0)
  const topAvailableCaregivers = caregivers
    .filter((c) => isAvailable(c))
    .sort((a, b) => Number(b.reliability_score || 0) - Number(a.reliability_score || 0))
    .slice(0, 5)

  return (
    <main style={pageStyle}>
      <div style={topbarStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Operations Control Center</div>
          <h1 style={titleStyle}>Global Operations Monitoring</h1>
          <p style={subtitleStyle}>Pilotage temps réel des opérations AngelCare</p>
        </div>

        <div style={topRightClusterStyle}>
          <div style={dateTimeWidgetStyle}>
            <div style={dateTimeLabelStyle}>Date & heure</div>
            <div style={dateTimeValueStyle}>{currentTime}</div>
            <div style={dateTimeSubStyle}>{capitalizeFirst(currentDateLong)}</div>
          </div>

          <div style={healthWidgetStyle}>
            <div style={dateTimeLabelStyle}>Santé opérationnelle</div>
            <div style={dateTimeValueStyle}>{readinessScore}/100</div>
            <div style={dateTimeSubStyle}>{dashboardHealth}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link href="/leads" style={secondaryButtonStyle}>Leads</Link>
        <Link href="/families" style={secondaryButtonStyle}>Familles</Link>
        <Link href="/missions" style={secondaryButtonStyle}>Missions</Link>
        <Link href="/caregivers" style={secondaryButtonStyle}>Caregivers</Link>
        <Link href="/incidents" style={secondaryButtonStyle}>Incidents</Link>
        <Link href="/pointage" style={secondaryButtonStyle}>Pointage terrain</Link>
        <Link href="/leads/new" style={buttonStyle}>+ Nouveau lead</Link>
      </div>

      <section style={kpiGridStyle}>
        <MetricCard label="Leads totaux" value={`🔥 ${totalLeads}`} hint="Pipeline global" />
        <MetricCard label="Leads urgents" value={`🚨 ${urgentLeads}`} hint="Priorité chaude" />
        <MetricCard label="Intervenantes totales" value={`👩‍👧 ${totalCaregivers}`} hint="Ressources terrain" />
        <MetricCard label="Disponibles" value={`✅ ${availableCaregivers}`} hint="Prêtes à être déployées" />
        <MetricCard label="Flotte déployée" value={`🛰️ ${deployedCaregivers}`} hint="Check-in actif" />
        <MetricCard label="Missions aujourd’hui" value={`📅 ${todayMissions}`} hint="Programme du jour" />
        <MetricCard label="Incidents ouverts" value={`⚠️ ${openIncidents}`} hint="Centre de risque" />
        <MetricCard label="Rappels du jour" value={`⏰ ${todayReminders}`} hint="CRM & suivi" />
      </section>

      <section style={executiveRibbonStyle}>
        <MiniExecutiveCard label="A traiter maintenant" value={totalCriticalAlerts} color="danger" />
        <MiniExecutiveCard label="Missions demain" value={missionsTomorrow.length} color="info" />
        <MiniExecutiveCard label="Sans assignation aujourd’hui" value={missionsWithoutCaregiverToday.length} color="warning" />
        <MiniExecutiveCard label="Incidents > 24h" value={unresolvedOver24h} color="danger" />
        <MiniExecutiveCard label="Disponibilité workforce" value={`${availableCaregivers}/${totalCaregivers}`} color="success" />
      </section>

      <section style={{ marginBottom: 24 }}>
        <Panel
          title="Alertes automatiques • anomalies opérationnelles"
          rightContent={
            <span style={badgeStyle(totalCriticalAlerts > 0 ? 'urgent' : 'active')}>
              {totalCriticalAlerts > 0 ? `${totalCriticalAlerts} alerte(s) à traiter` : 'Aucune alerte critique'}
            </span>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={panelInnerStyle}>
              <h3 style={alertTitleStyle}>🚨 Missions du jour sans check-in</h3>
              {missionsTodayWithoutCheckin.length > 0 ? (
                missionsTodayWithoutCheckin.slice(0, 5).map((mission) => (
                  <div key={mission.id} style={alertRowStyle}>
                    <strong>Mission #{mission.id}</strong>
                    <div style={metaStyle}>{mission.service_type || 'Mission'} • Intervenante ID: {mission.caregiver_id}</div>
                  </div>
                ))
              ) : (
                <p style={metaStyle}>Aucune anomalie.</p>
              )}
            </div>

            <div style={panelInnerStyle}>
              <h3 style={alertTitleStyle}>🛰️ Check-ins sans mission liée</h3>
              {orphanCheckins.length > 0 ? (
                orphanCheckins.slice(0, 5).map((checkin) => (
                  <div key={checkin.id} style={alertRowStyle}>
                    <strong>Intervenante ID: {checkin.caregiver_id}</strong>
                    <div style={metaStyle}>{checkin.city || 'Ville non définie'} • {checkin.zone || 'Zone non définie'}</div>
                  </div>
                ))
              ) : (
                <p style={metaStyle}>Aucune anomalie.</p>
              )}
            </div>

            <div style={panelInnerStyle}>
              <h3 style={alertTitleStyle}>⏰ Rappels en retard</h3>
              {overdueReminders.length > 0 ? (
                overdueReminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} style={alertRowStyle}>
                    <strong>{reminder.reason}</strong>
                    <div style={metaStyle}>Lead ID: {reminder.lead_id} • {new Date(reminder.remind_at).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p style={metaStyle}>Aucun retard.</p>
              )}
            </div>

            <div style={panelInnerStyle}>
              <h3 style={alertTitleStyle}>🔥 Leads urgents non stabilisés</h3>
              {urgentUntreatedLeads.length > 0 ? (
                urgentUntreatedLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} style={alertRowStyle}>
                    <strong>{lead.parent_name || 'Sans nom'}</strong>
                    <div style={metaStyle}>{lead.city || 'Ville non définie'} • {lead.phone || 'Sans téléphone'}</div>
                  </div>
                ))
              ) : (
                <p style={metaStyle}>Aucun lead urgent en attente.</p>
              )}
            </div>
          </div>
        </Panel>
      </section>

      <section style={newWidgetsGridStyle}>
        <Panel title="🌅 Ouverture des opérations">
          <div style={widgetMetricListStyle}>
            <div>Total missions du jour: <strong>{todayMissions}</strong></div>
            <div>Assignées: <strong>{assignedToday}</strong></div>
            <div>Non assignées: <strong>{missionsWithoutCaregiverToday.length}</strong></div>
            <div>Urgentes: <strong>{todayMissionsList.filter((m) => isUrgent(m.urgency)).length}</strong></div>
            <div>Missions dans les 2h: <strong>{todayUpcomingWindow.length}</strong></div>
          </div>
          <div style={statusFooterStyle}>
            Ouverture: <strong>{missionsWithoutCaregiverToday.length > 0 || criticalOpenIncidents.length > 0 ? '⚠️ Attention' : '✅ OK'}</strong>
          </div>
        </Panel>

        <Panel title="🌙 Clôture des opérations">
          <div style={widgetMetricListStyle}>
            <div>Terminées: <strong>{completedToday}</strong></div>
            <div>En cours: <strong>{inProgressToday}</strong></div>
            <div>Incidents du jour: <strong>{incidentsToday}</strong></div>
            <div>Tâches du jour: <strong>{tasksDueToday}</strong></div>
            <div>Couverture du jour: <strong>{todaysMissionCoverage}%</strong></div>
          </div>
          <div style={statusFooterStyle}>
            Clôture: <strong>{inProgressToday > 0 ? '⚠️ Incomplète' : '✅ OK'}</strong>
          </div>
        </Panel>

        <Panel title="👩‍👧 Readiness des intervenantes">
          <div style={quadGridStyle}>
            <SmallStatCard label="Disponibles" value={availableCaregivers} />
            <SmallStatCard label="Assignées" value={caregiversAssigned} />
            <SmallStatCard label="En mission" value={caregiversInMission} />
            <SmallStatCard label="Absentes / bloquées" value={caregiversAbsent + caregiversBlocked} />
          </div>
        </Panel>

        <Panel title="📈 Pipeline CRM">
          <div style={quadGridStyle}>
            <SmallStatCard label="Nouveaux leads" value={leadPipeline.new} />
            <SmallStatCard label="Contactés" value={leadPipeline.contacted} />
            <SmallStatCard label="Qualifiés" value={leadPipeline.qualified} />
            <SmallStatCard label="Convertis" value={leadPipeline.converted} />
          </div>
        </Panel>
      </section>

      <section style={heroGridStyle}>
        <Panel title="Carte Maroc • flotte active">
          <div style={mapPanelGridStyle}>
            <div style={mapWrapStyle}>
              <MoroccoOperationsMap cityCoverage={cityCoverage} />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {cityCoverage.map((city) => (
                <div key={city.city} style={cityCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{city.city}</strong>
                    <span style={badgeStyle(city.deployed > 0 ? 'active' : 'normal')}>
                      {city.deployed > 0 ? 'Déployée' : 'Veille'}
                    </span>
                  </div>

                  <div style={smallGridStyle}>
                    <span>👩‍👧 Total: {city.totalCaregivers}</span>
                    <span>🛰️ Déployées: {city.deployed}</span>
                    <span>✅ Disponibles: {city.available}</span>
                    <span>📞 Leads: {city.leads}</span>
                    <span>🏠 Familles: {city.families}</span>
                    <span>📅 Missions jour: {city.missionsToday}</span>
                  </div>

                  {city.activeZones.length > 0 && (
                    <div style={{ marginTop: 10, color: '#475569', fontSize: 13 }}>
                      Zones actives : {city.activeZones.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Missions • filtre par jour">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <Link href="/" style={activeDay === todayISO && !selectedDay ? activeChipStyle : chipStyle}>
              Aujourd’hui
            </Link>

            {missionDays.slice(0, 7).map((day) => (
              <Link key={day} href={`/?day=${day}`} style={activeDay === day ? activeChipStyle : chipStyle}>
                {formatShortDate(day)}
              </Link>
            ))}
          </div>

          <div style={{ marginBottom: 14, color: '#64748b', fontSize: 14 }}>
            Jour affiché : <strong>{formatLongDate(activeDay)}</strong>
          </div>

          {filteredMissions.length > 0 ? (
            <div style={{ display: 'grid', gap: 12, maxHeight: 520, overflow: 'auto' }}>
              {filteredMissions.map((mission) => (
                <div key={mission.id} style={ticketStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{mission.service_type || 'Mission AngelCare'}</div>
                      <div style={metaStyle}>#{mission.id} • {mission.mission_date || 'Date non définie'}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={badgeStyle((mission.status || 'draft').toLowerCase())}>{mission.status || 'draft'}</span>
                      <div style={{ height: 8 }} />
                      <span style={badgeStyle((mission.urgency || 'normal').toLowerCase())}>{mission.urgency || 'normal'}</span>
                    </div>
                  </div>

                  <div style={ticketMetaGridStyle}>
                    <div>🕒 {formatMissionTime(mission.start_time, mission.end_time)}</div>
                    <div>👩‍👧 Intervenante ID: {mission.caregiver_id || 'Non assignée'}</div>
                    <div>🏠 Famille ID: {mission.family_id || 'Non définie'}</div>
                    <div>📝 {mission.notes || 'Aucune note opérationnelle'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune mission planifiée sur ce jour." />
          )}
        </Panel>
      </section>

      <section style={twoColSectionStyle}>
        <Panel title="📊 Missions à venir par catégorie">
          {Object.keys(groupedUpcoming).length > 0 ? (
            <div style={categoryBoardStyle}>
              {Object.entries(groupedUpcoming).map(([category, list]) => {
                const upcomingList = list as Mission[]
                const todayCount = upcomingList.filter((m) => m.mission_date === todayISO).length
                const tomorrowCount = upcomingList.filter((m) => m.mission_date === tomorrowISO).length
                const urgentCount = upcomingList.filter((m) => isUrgent(m.urgency)).length
                const nextMission = upcomingList[0]

                return (
                  <div key={category} style={categoryCardStyle}>
                    <div style={categoryTitleStyle}>{category}</div>
                    <div style={categoryMetricStyle}>Aujourd’hui: <strong>{todayCount}</strong></div>
                    <div style={categoryMetricStyle}>Demain: <strong>{tomorrowCount}</strong></div>
                    <div style={categoryMetricStyle}>Urgentes: <strong>{urgentCount}</strong></div>
                    <div style={categoryMetricStyle}>Prochaine: <strong>{nextMission?.mission_date || '—'}</strong></div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState text="Aucune mission à venir." />
          )}
        </Panel>

        <Panel title="🎯 Priorités du moment">
          {topPriorityItems.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {topPriorityItems.map((item, index) => (
                <div key={index} style={priorityItemStyle(item.tone)}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.label}</div>
                  <div style={metaStyle}>{item.meta}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune priorité immédiate." />
          )}
        </Panel>
      </section>

      <section style={{ marginBottom: 24 }}>
        <Panel title="🧭 Live Operations Board" rightContent={<span style={subtleTagStyle}>Flux du jour</span>}>
          <div style={operationsBoardStyle}>
            {liveBoardColumns.map((column) => (
              <div key={column.key} style={operationsColumnStyle}>
                <div style={operationsColumnHeaderStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{column.title}</div>
                  <span style={smallCountPillStyle}>{column.items.length}</span>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {column.items.length > 0 ? (
                    column.items.slice(0, 8).map((mission) => (
                      <div key={mission.id} style={operationsTicketStyle}>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                          #{mission.id} • {mission.service_type || 'Mission'}
                        </div>
                        <div style={metaStyle}>{formatMissionTime(mission.start_time, mission.end_time)}</div>
                        <div style={metaStyle}>{mission.city || 'Ville non définie'} • {mission.zone || 'Zone non définie'}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={badgeStyle(mission.status || 'draft')}>{mission.status || 'draft'}</span>
                          <span style={badgeStyle(mission.urgency || 'normal')}>{mission.urgency || 'normal'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={emptyColumnStateStyle}>Aucune mission</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section style={twoColSectionStyle}>
        <Panel title="🧠 Dispatch & couverture">
          <div style={dispatchGridStyle}>
            <div style={dispatchBoxStyle}>
              <div style={dispatchTitleStyle}>Couverture du jour</div>
              <div style={dispatchValueStyle}>{todaysMissionCoverage}%</div>
              <div style={metaStyle}>Missions avec intervenante assignée</div>
            </div>
            <div style={dispatchBoxStyle}>
              <div style={dispatchTitleStyle}>Taux incidents ouverts</div>
              <div style={dispatchValueStyle}>{openIncidentRate}%</div>
              <div style={metaStyle}>Par rapport au volume missions</div>
            </div>
            <div style={dispatchBoxStyle}>
              <div style={dispatchTitleStyle}>Familles VIP</div>
              <div style={dispatchValueStyle}>{vipFamilies}</div>
              <div style={metaStyle}>A surveiller de près</div>
            </div>
            <div style={dispatchBoxStyle}>
              <div style={dispatchTitleStyle}>Tâches pending</div>
              <div style={dispatchValueStyle}>{tasksPending}</div>
              <div style={metaStyle}>Charge CRM / ops</div>
            </div>
          </div>
        </Panel>

        <Panel title="🏙️ Villes sous vigilance">
          {lowCoverageCities.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {lowCoverageCities.map((city) => (
                <div key={city.city} style={priorityItemStyle('urgent')}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{city.city}</div>
                  <div style={metaStyle}>Missions du jour: {city.missionsToday} • Disponibles: {city.available}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune ville en sous-couverture détectée." />
          )}
        </Panel>
      </section>

      <section style={mainGridStyle}>
        <Panel title="Pointages récents">
          {checkins.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {checkins.slice(0, 8).map((checkin) => (
                <div key={checkin.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {checkin.event_type === 'check_in' ? '🟢 Check-in' : '⚪ Check-out'}
                    </div>
                    <div style={metaStyle}>Intervenante ID: {checkin.caregiver_id} • Mission ID: {checkin.mission_id || '—'}</div>
                    <div style={metaStyle}>{checkin.city || 'Ville non définie'} • {checkin.zone || 'Zone non définie'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={metaStyle}>{new Date(checkin.event_time).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun pointage enregistré." />
          )}
        </Panel>

        <Panel title="Leads récents">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} style={{ ...rowStyle, marginBottom: 10 }}>
              <div>
                <Link href={`/leads/${lead.id}`} style={leadLinkStyle}>
                  {lead.parent_name || 'Sans nom'}
                </Link>
                <div style={metaStyle}>{lead.city || 'Ville non définie'} • {lead.phone || 'Sans téléphone'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={badgeStyle(lead.status || 'new')}>{lead.status || 'new'}</span>
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <section style={{ marginTop: 24 }}>
        <Panel title="⭐ Top profils disponibles aujourd’hui">
          {topAvailableCaregivers.length > 0 ? (
            <div style={topProfilesGridStyle}>
              {topAvailableCaregivers.map((caregiver) => (
                <div key={caregiver.id} style={profileCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                    {caregiver.full_name || `Caregiver #${caregiver.id}`}
                  </div>
                  <div style={metaStyle}>{caregiver.city || 'Ville non définie'} • {(caregiver.current_status || caregiver.status || 'available')}</div>
                  <div style={metaStyle}>Reliability: {caregiver.reliability_score ?? 0}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []).slice(0, 4).map((tag) => (
                      <span key={tag} style={miniSkillTagStyle}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune intervenante disponible." />
          )}
        </Panel>
      </section>
    </main>
  )
}

function MoroccoOperationsMap({
  cityCoverage,
}: {
  cityCoverage: Array<{
    city: string
    deployed: number
    available: number
    totalCaregivers: number
    leads: number
    families: number
    missionsToday: number
    point?: { x: number; y: number }
    activeZones: string[]
  }>
}) {
  return (
    <svg viewBox="0 0 300 420" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="moroccoFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      <path
        d="M185 28 L218 52 L238 88 L250 124 L234 158 L240 188 L224 224 L208 252 L216 294 L200 328 L174 362 L150 390 L126 376 L108 338 L94 302 L78 260 L72 214 L86 172 L96 128 L112 98 L140 72 L164 48 Z"
        fill="url(#moroccoFill)"
        stroke="#94a3b8"
        strokeWidth="2"
      />

      {cityCoverage.map((city) => {
        if (!city.point) return null
        return (
          <g key={city.city}>
            {city.deployed > 0 && (
              <circle cx={city.point.x} cy={city.point.y} r="16" fill="rgba(239,68,68,0.12)">
                <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.25;1" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={city.point.x}
              cy={city.point.y}
              r={city.deployed > 0 ? 7 : 5}
              fill={city.deployed > 0 ? '#ef4444' : '#0f172a'}
              stroke="#ffffff"
              strokeWidth="3"
            />
            <text x={city.point.x + 10} y={city.point.y - 10} fontSize="12" fill="#0f172a" fontWeight="700">
              {city.city}
            </text>
            <text x={city.point.x + 10} y={city.point.y + 8} fontSize="11" fill="#475569">
              {city.deployed} déployée(s)
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div style={metricCardStyle}>
      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      {hint ? <div style={metricHintStyle}>{hint}</div> : null}
    </div>
  )
}

function MiniExecutiveCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: 'danger' | 'warning' | 'info' | 'success'
}) {
  return (
    <div style={miniExecutiveStyle(color)}>
      <div style={miniExecutiveLabelStyle}>{label}</div>
      <div style={miniExecutiveValueStyle}>{value}</div>
    </div>
  )
}

function SmallStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={smallStatStyle}>
      <div style={smallStatLabelStyle}>{label}</div>
      <div style={smallStatValueStyle}>{value}</div>
    </div>
  )
}

function Panel({
  title,
  rightContent,
  children,
}: {
  title: string
  rightContent?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <h2 style={panelTitleStyle}>{title}</h2>
        {rightContent}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ color: '#64748b', margin: 0 }}>{text}</p>
}

function groupByCategory(missions: Mission[]) {
  const map: Record<string, Mission[]> = {}
  missions.forEach((m) => {
    const key = m.service_type || 'Autre'
    if (!map[key]) map[key] = []
    map[key].push(m)
  })
  return map
}

function isUrgent(value?: string | null) {
  const normalized = (value || '').toLowerCase()
  return normalized === 'urgent' || normalized === 'high'
}

function isAvailable(caregiver: Caregiver) {
  return (caregiver.current_status || caregiver.status || '').toLowerCase() === 'available'
}

function isOpenIncident(status?: string | null) {
  const normalized = (status || '').toLowerCase()
  return normalized === 'open' || normalized === 'in_progress'
}

function isPending(status?: string | null) {
  return (status || '').toLowerCase() === 'pending'
}

function normalizeCity(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatMissionTime(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Horaire non défini'
  return `${start || '--:--'} → ${end || '--:--'}`
}

function capitalizeFirst(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function badgeStyle(status: string): React.CSSProperties {
  const s = status.toLowerCase()

  const colors: Record<string, { bg: string; text: string }> = {
    new: { bg: '#fef3c7', text: '#92400e' },
    urgent: { bg: '#fee2e2', text: '#991b1b' },
    available: { bg: '#dcfce7', text: '#166534' },
    draft: { bg: '#e0f2fe', text: '#075985' },
    confirmed: { bg: '#dcfce7', text: '#166534' },
    active: { bg: '#ede9fe', text: '#5b21b6' },
    normal: { bg: '#e2e8f0', text: '#334155' },
    check_in: { bg: '#dcfce7', text: '#166534' },
    check_out: { bg: '#e2e8f0', text: '#334155' },
    resolved: { bg: '#dcfce7', text: '#166534' },
    open: { bg: '#fee2e2', text: '#991b1b' },
    completed: { bg: '#dcfce7', text: '#166534' },
    in_progress: { bg: '#fef3c7', text: '#92400e' },
    assigned: { bg: '#ede9fe', text: '#5b21b6' },
    incident: { bg: '#fee2e2', text: '#991b1b' },
  }

  const color = colors[s] || { bg: '#e2e8f0', text: '#334155' }

  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
  }
}

function miniExecutiveStyle(color: 'danger' | 'warning' | 'info' | 'success'): React.CSSProperties {
  const palette = {
    danger: { bg: '#fff1f2', border: '#fecdd3' },
    warning: { bg: '#fffbeb', border: '#fde68a' },
    info: { bg: '#eff6ff', border: '#bfdbfe' },
    success: { bg: '#ecfdf5', border: '#bbf7d0' },
  }[color]

  return {
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 16,
    padding: 14,
  }
}

function priorityItemStyle(tone: string): React.CSSProperties {
  const styleMap: Record<string, React.CSSProperties> = {
    urgent: { background: '#fff1f2', border: '1px solid #fecdd3' },
    danger: { background: '#fff7ed', border: '1px solid #fed7aa' },
    normal: { background: '#f8fafc', border: '1px solid #e2e8f0' },
  }
  return {
    borderRadius: 14,
    padding: 14,
    ...(styleMap[tone] || styleMap.normal),
  }
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial, sans-serif',
  background: 'radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  minHeight: '100vh',
}

const topbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  marginBottom: 28,
  flexWrap: 'wrap',
}

const topRightClusterStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'stretch',
}

const dateTimeWidgetStyle: React.CSSProperties = {
  minWidth: 220,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  color: 'white',
  padding: 16,
  borderRadius: 18,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
}

const healthWidgetStyle: React.CSSProperties = {
  minWidth: 220,
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  color: '#0f172a',
  padding: 16,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
}

const dateTimeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.72,
  marginBottom: 8,
  fontWeight: 700,
}

const dateTimeValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
}

const dateTimeSubStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  opacity: 0.9,
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#334155',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.1,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 16,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
}

const executiveRibbonStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 12,
  marginBottom: 24,
}

const newWidgetsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const heroGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const twoColSectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const mapPanelGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 1fr',
  gap: 18,
  alignItems: 'start',
}

const mapWrapStyle: React.CSSProperties = {
  minHeight: 420,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  padding: 12,
}

const cityCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const smallGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginTop: 10,
  color: '#475569',
  fontSize: 13,
}

const ticketStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderLeft: '4px solid #0f172a',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
}

const ticketMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  color: '#475569',
  fontSize: 14,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}

const activeChipStyle: React.CSSProperties = {
  ...chipStyle,
  background: '#0f172a',
  color: '#ffffff',
  border: '1px solid #0f172a',
}

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: 20,
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  borderRadius: 22,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
}

const panelInnerStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
}

const alertTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 16,
  color: '#0f172a',
  fontWeight: 700,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
}

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  color: '#0f172a',
  fontWeight: 700,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: 14,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
}

const alertRowStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  marginBottom: 10,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  marginTop: 4,
}

const metricCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
}

const metricHintStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  marginTop: 8,
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: 10,
  fontWeight: 700,
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontWeight: 700,
}

const leadLinkStyle: React.CSSProperties = {
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 700,
}

const widgetMetricListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  color: '#334155',
  fontSize: 14,
}

const statusFooterStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px solid #e2e8f0',
  color: '#0f172a',
  fontSize: 15,
}

const quadGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const smallStatStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const smallStatLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
}

const smallStatValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const miniExecutiveLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
}

const miniExecutiveValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const categoryBoardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
}

const categoryCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
}

const categoryTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 16,
  marginBottom: 10,
}

const categoryMetricStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.7,
}

const operationsBoardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(220px, 1fr))',
  gap: 14,
  overflowX: 'auto',
  paddingBottom: 4,
}

const operationsColumnStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 12,
  minHeight: 220,
}

const operationsColumnHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
}

const smallCountPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  background: '#0f172a',
  color: 'white',
  fontSize: 12,
  fontWeight: 800,
}

const operationsTicketStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
}

const emptyColumnStateStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 13,
  border: '1px dashed #cbd5e1',
  borderRadius: 12,
  padding: 12,
  background: 'white',
}

const dispatchGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const dispatchBoxStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
}

const dispatchTitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
}

const dispatchValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 800,
}

const topProfilesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 14,
}

const profileCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const miniSkillTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: 999,
  background: '#ede9fe',
  color: '#5b21b6',
  fontSize: 11,
  fontWeight: 800,
}

const subtleTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#4338ca',
  fontSize: 12,
  fontWeight: 700,
}
