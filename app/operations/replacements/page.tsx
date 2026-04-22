
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
  notes?: string | null
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

function getMissionSkillCode(mission: Mission) {
  const service = String(mission?.service_type || '').toLowerCase()

  if (service.includes("domicile") && service.includes("enfant")) return 'H.S'
  if (service.includes("post") || service.includes("bébé") || service.includes("bebe")) return 'PP'
  if (service.includes("spécial") && service.includes("domicile")) return 'SP'
  if (service.includes("special") && service.includes("domicile")) return 'SP'
  if (service.includes("spécial") && service.includes("école")) return 'SS'
  if (service.includes("special") && service.includes("ecole")) return 'SS'
  if (service.includes("ludique")) return 'SL'
  if (service.includes("anniversaire")) return 'PT'
  if (service.includes("excursion")) return 'EX'

  return null
}

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isAvailable(caregiver: Caregiver) {
  return normalize(caregiver.current_status || caregiver.status) === 'available'
}

function getCaregiverScore(caregiver: Caregiver, mission: Mission) {
  let score = 0

  const caregiverStatus = normalize(caregiver.current_status || caregiver.status)
  const caregiverCity = normalize(caregiver.city)
  const missionCity = normalize(mission.city)
  const missionSkillCode = getMissionSkillCode(mission)
  const caregiverSkillTags = Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []
  const caregiverLanguageTags = Array.isArray(caregiver.language_tags) ? caregiver.language_tags : []

  if (caregiverStatus === 'available') score += 50
  if (caregiverStatus === 'assigned') score += 10
  if (caregiverStatus === 'in_mission') score -= 30
  if (caregiverStatus === 'absent') score -= 50
  if (caregiverStatus === 'blocked') score -= 100

  if (caregiverCity && missionCity && caregiverCity === missionCity) score += 30
  if (missionSkillCode && caregiverSkillTags.includes(missionSkillCode)) score += 60
  if (typeof caregiver.reliability_score === 'number') score += caregiver.reliability_score

  if (caregiverLanguageTags.includes('FRA')) score += 4
  if (caregiverLanguageTags.includes('ARA')) score += 4
  if (caregiverLanguageTags.includes('ENG')) score += 2

  return score
}

function urgencyTone(urgency?: string | null): React.CSSProperties {
  const value = normalize(urgency)
  if (value === 'high' || value === 'urgent') {
    return { background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' }
  }
  return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
}

function riskBadgeStyle(level: 'critical' | 'high' | 'normal'): React.CSSProperties {
  const map = {
    critical: { background: '#7f1d1d', color: '#fff', border: '1px solid #7f1d1d' },
    high: { background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' },
    normal: { background: '#ecfdf5', color: '#166534', border: '1px solid #86efac' },
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    ...map[level],
  }
}

export default async function ReplacementsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [missionsRes, caregiversRes, incidentsRes] = await Promise.all([
    supabase.from('missions').select('*').order('mission_date', { ascending: true }),
    supabase.from('caregivers').select('*').eq('is_archived', false).order('full_name', { ascending: true }),
    supabase.from('incidents').select('*').order('created_at', { ascending: false }),
  ])

  const missions = (missionsRes.data || []) as Mission[]
  const caregivers = (caregiversRes.data || []) as Caregiver[]
  const incidents = incidentsRes.data || []

  const urgentPool = missions.filter((mission) => {
    const urgency = normalize(mission.urgency)
    const status = normalize(mission.status)
    return (
      mission.mission_date === today &&
      (!mission.caregiver_id ||
        urgency === 'urgent' ||
        urgency === 'high' ||
        status === 'incident')
    )
  })

  const replacementCases = urgentPool.map((mission) => {
    const ranked = caregivers
      .map((caregiver) => ({
        ...caregiver,
        score: getCaregiverScore(caregiver, mission),
      }))
      .sort((a, b) => b.score - a.score)

    const currentCaregiver = caregivers.find((c) => c.id === mission.caregiver_id)
    const riskLevel: 'critical' | 'high' | 'normal' =
      !mission.caregiver_id
        ? 'critical'
        : normalize(currentCaregiver?.current_status || currentCaregiver?.status) === 'blocked' ||
          normalize(currentCaregiver?.current_status || currentCaregiver?.status) === 'absent'
        ? 'critical'
        : normalize(mission.urgency) === 'urgent' || normalize(mission.urgency) === 'high'
        ? 'high'
        : 'normal'

    return {
      mission,
      ranked,
      currentCaregiver,
      riskLevel,
      recommended: ranked[0] || null,
    }
  })

  const criticalCases = replacementCases.filter((c) => c.riskLevel === 'critical')
  const highCases = replacementCases.filter((c) => c.riskLevel === 'high')
  const normalCases = replacementCases.filter((c) => c.riskLevel === 'normal')

  const availableCaregivers = caregivers.filter(isAvailable)
  const sameCityReady = replacementCases.flatMap((c) => c.ranked.filter((r) => normalize(r.city) === normalize(c.mission.city)).slice(0, 2))
  const openIncidents = incidents.filter((i: any) => normalize(i.status) === 'open' || normalize(i.status) === 'in_progress')

  return (
    <main style={pageStyle}>
      <div style={topbarStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Emergency Dispatch Center</div>
          <h1 style={titleStyle}>Replacement / Emergency Dispatch</h1>
          <p style={subtitleStyle}>
            Centre premium de remplacement avec contrôle manuel, recommandations assistées et prise de décision rapide.
          </p>
        </div>

        <div style={ctaRowStyle}>
          <Link href="/operations/availability" style={secondaryButtonStyle}>
            ← Availability board
          </Link>
          <Link href="/missions" style={secondaryButtonStyle}>
            Missions
          </Link>
          <Link href="/incidents" style={buttonStyle}>
            Incidents center
          </Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <MetricCard label="Cas critiques" value={String(criticalCases.length)} hint="Intervention immédiate" />
        <MetricCard label="Cas élevés" value={String(highCases.length)} hint="À stabiliser vite" />
        <MetricCard label="Cas monitorés" value={String(normalCases.length)} hint="Sous surveillance" />
        <MetricCard label="Caregivers disponibles" value={String(availableCaregivers.length)} hint="Réservoir de remplacement" />
        <MetricCard label="Incidents ouverts" value={String(openIncidents.length)} hint="Peuvent impacter le dispatch" />
        <MetricCard label="Missions pool du jour" value={String(urgentPool.length)} hint="Périmètre remplacement" />
      </section>

      <section style={executiveGridStyle}>
        <Panel title="Command panel manuel">
          <div style={manualChecklistStyle}>
            <ManualAction title="1. Vérifier le besoin réel" text="Confirmer si le remplacement est nécessaire maintenant, plus tard, ou si la mission peut être replanifiée." />
            <ManualAction title="2. Valider la ville / zone" text="Contrôler que la candidate recommandée couvre bien la zone réelle de mission." />
            <ManualAction title="3. Contrôler la compétence" text="Comparer service_type mission et skill tags caregiver avant décision." />
            <ManualAction title="4. Ouvrir la fiche mission" text="Consulter famille, notes terrain, horaire exact et incident lié avant de trancher." />
            <ManualAction title="5. Décider manuellement" text="Le système recommande, l’opération choisit. Aucune auto-assignation ici." />
          </div>
        </Panel>

        <Panel title="Upper hand • leviers de contrôle">
          <div style={upperHandGridStyle}>
            <UpperHandCard title="Filtrer mentalement" value="Ville • skill • statut" />
            <UpperHandCard title="Comparer 3 profils" value="Top shortlist manuel" />
            <UpperHandCard title="Vérifier risque terrain" value="Absent • bloqué • incident" />
            <UpperHandCard title="Prioriser impact client" value="Urgence • heure • famille" />
          </div>
        </Panel>
      </section>

      <section style={boardSectionStyle}>
        <BoardColumn
          title="⛔ Critical replacements"
          subtitle="Sans caregiver ou caregiver indisponible"
          items={criticalCases}
          tone="critical"
        />
        <BoardColumn
          title="🔥 High priority"
          subtitle="Urgentes à stabiliser"
          items={highCases}
          tone="high"
        />
        <BoardColumn
          title="🟢 Manual monitoring"
          subtitle="Sous contrôle, mais à surveiller"
          items={normalCases}
          tone="normal"
        />
      </section>

      <section style={twoColGridStyle}>
        <Panel title="Top manual shortlist by mission">
          {replacementCases.length > 0 ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {replacementCases.slice(0, 6).map((item) => (
                <div key={item.mission.id} style={shortlistCardStyle}>
                  <div style={shortlistHeaderStyle}>
                    <div>
                      <div style={shortlistTitleStyle}>
                        Mission #{item.mission.id} • {item.mission.service_type || 'Mission AngelCare'}
                      </div>
                      <div style={metaStyle}>
                        {item.mission.city || 'Ville non définie'} • {formatMissionTime(item.mission.start_time, item.mission.end_time)}
                      </div>
                    </div>

                    <span style={riskBadgeStyle(item.riskLevel)}>{item.riskLevel}</span>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {item.ranked.slice(0, 3).map((caregiver) => (
                      <div key={caregiver.id} style={candidateRowStyle}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            {caregiver.full_name || `Caregiver #${caregiver.id}`}
                          </div>
                          <div style={metaStyle}>
                            Score {caregiver.score} • {caregiver.city || 'Ville'} • {caregiver.current_status || caregiver.status || 'status'}
                          </div>
                          <div style={tagWrapStyle}>
                            {(Array.isArray(caregiver.language_tags) ? caregiver.language_tags : []).map((tag) => (
                              <span key={tag} style={languageTagStyle}>{tag}</span>
                            ))}
                            {(Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []).map((tag) => (
                              <span key={tag} style={skillTagStyle}>{tag}</span>
                            ))}
                          </div>
                        </div>

                        <div style={candidateActionsStyle}>
                          <Link href={`/caregivers/${caregiver.id}`} style={secondaryMiniButtonStyle}>
                            Voir profil
                          </Link>
                          <Link href={`/missions/${item.mission.id}`} style={primaryMiniButtonStyle}>
                            Ouvrir mission
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun cas de remplacement aujourd’hui." />
          )}
        </Panel>

        <Panel title="Dispatch intelligence widgets">
          <div style={widgetStackStyle}>
            <WidgetCard
              title="Caregivers disponibles en réserve"
              value={availableCaregivers.length}
              subtitle="Capacité de réaction immédiate"
            />
            <WidgetCard
              title="Top même ville"
              value={sameCityReady.length}
              subtitle="Profils shortlistés sur critère géographique"
            />
            <WidgetCard
              title="Incidents ouverts liés"
              value={openIncidents.length}
              subtitle="Peuvent perturber le remplacement"
            />
            <WidgetCard
              title="Missions sans assignation aujourd’hui"
              value={replacementCases.filter((c) => !c.mission.caregiver_id).length}
              subtitle="Risque client direct"
            />
          </div>
        </Panel>
      </section>

      <section style={bottomGridStyle}>
        <Panel title="Manual control board • règles de décision">
          <div style={decisionBoardStyle}>
            <DecisionRule
              title="Toujours prioriser la ville"
              text="Si deux profils sont proches, choisir d’abord la candidate située dans la même ville ou zone réelle."
            />
            <DecisionRule
              title="Ne jamais remplacer sans lire la mission"
              text="Ouvrir la fiche mission pour vérifier service, horaire, notes et situation famille avant validation."
            />
            <DecisionRule
              title="Skill tag > nom connu"
              text="Même si l’ops connaît une intervenante, la compétence codée doit l’emporter sur l’habitude."
            />
            <DecisionRule
              title="Garder une trace de la décision"
              text="Après arbitrage manuel, documenter la logique dans la mission ou l’incident lié."
            />
          </div>
        </Panel>

        <Panel title="Quick links de contrôle">
          <div style={quickLinksGridStyle}>
            <Link href="/caregivers" style={quickLinkCardStyle}>👩‍👧 Directory caregivers</Link>
            <Link href="/operations/availability" style={quickLinkCardStyle}>📍 Availability board</Link>
            <Link href="/missions" style={quickLinkCardStyle}>📅 Missions</Link>
            <Link href="/incidents" style={quickLinkCardStyle}>⚠️ Incidents</Link>
          </div>
        </Panel>
      </section>
    </main>
  )
}

function BoardColumn({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string
  subtitle: string
  items: Array<{
    mission: Mission
    ranked: Array<Caregiver & { score: number }>
    currentCaregiver?: Caregiver | undefined
    riskLevel: 'critical' | 'high' | 'normal'
    recommended: (Caregiver & { score: number }) | null
  }>
  tone: 'critical' | 'high' | 'normal'
}) {
  return (
    <section style={boardColumnStyle(tone)}>
      <div style={boardHeaderStyle}>
        <div style={boardTitleStyle}>{title}</div>
        <div style={boardSubtitleStyle}>{subtitle}</div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.mission.id} style={dispatchCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    Mission #{item.mission.id}
                  </div>
                  <div style={metaStyle}>
                    {item.mission.service_type || 'Mission AngelCare'}
                  </div>
                </div>

                <span style={urgencyTone(item.mission.urgency)}>
                  {item.mission.urgency || 'normal'}
                </span>
              </div>

              <div style={dispatchMetaGridStyle}>
                <div>📍 {item.mission.city || 'Ville non définie'}</div>
                <div>🕒 {formatMissionTime(item.mission.start_time, item.mission.end_time)}</div>
                <div>👩‍👧 Actuelle: {item.currentCaregiver?.full_name || 'Non assignée'}</div>
                <div>🎯 Skill cible: {getMissionSkillCode(item.mission) || '—'}</div>
              </div>

              <div style={recommendationBoxStyle}>
                <div style={recommendationLabelStyle}>Meilleure recommandation assistée</div>
                <div style={recommendationValueStyle}>
                  {item.recommended?.full_name || 'Aucune candidate'}
                </div>
                <div style={metaStyle}>
                  Score {item.recommended?.score || 0}
                  {item.recommended?.city ? ` • ${item.recommended.city}` : ''}
                  {item.recommended?.current_status || item.recommended?.status
                    ? ` • ${item.recommended?.current_status || item.recommended?.status}`
                    : ''}
                </div>
              </div>

              <div style={cardActionRowStyle}>
                <Link href={`/missions/${item.mission.id}`} style={primaryMiniButtonStyle}>
                  Ouvrir mission
                </Link>
                {item.recommended ? (
                  <Link href={`/caregivers/${item.recommended.id}`} style={secondaryMiniButtonStyle}>
                    Ouvrir profil recommandé
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="Aucun cas dans cette colonne." />
        )}
      </div>
    </section>
  )
}

function ManualAction({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div style={manualActionStyle}>
      <div style={manualActionTitleStyle}>{title}</div>
      <div style={manualActionTextStyle}>{text}</div>
    </div>
  )
}

function UpperHandCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div style={upperHandCardStyle}>
      <div style={upperHandLabelStyle}>{title}</div>
      <div style={upperHandValueStyle}>{value}</div>
    </div>
  )
}

function WidgetCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle: string
}) {
  return (
    <div style={widgetCardStyle}>
      <div style={widgetTitleStyle}>{title}</div>
      <div style={widgetValueStyle}>{value}</div>
      <div style={widgetSubtitleStyle}>{subtitle}</div>
    </div>
  )
}

function DecisionRule({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div style={decisionRuleStyle}>
      <div style={decisionRuleTitleStyle}>{title}</div>
      <div style={decisionRuleTextStyle}>{text}</div>
    </div>
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
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
      {hint ? <div style={metricHintStyle}>{hint}</div> : null}
    </div>
  )
}

function Panel({
  title,
  children,
  rightContent,
}: {
  title: string
  children: React.ReactNode
  rightContent?: React.ReactNode
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

function formatMissionTime(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Horaire non défini'
  return `${start || '--:--'} → ${end || '--:--'}`
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial, sans-serif',
  background:
    'radial-gradient(circle at top right, rgba(239,68,68,0.08), transparent 18%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
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

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#991b1b',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 36,
  lineHeight: 1.08,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 16,
  maxWidth: 820,
}

const ctaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  textDecoration: 'none',
  padding: '11px 14px',
  borderRadius: 10,
  fontWeight: 700,
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontWeight: 700,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 24,
}

const executiveGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const boardSectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 18,
  alignItems: 'start',
  marginBottom: 24,
}

const twoColGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  gap: 20,
  marginBottom: 24,
}

const bottomGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr',
  gap: 20,
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.93)',
  borderRadius: 22,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
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
  fontWeight: 800,
}

const metricCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
}

const metricLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginBottom: 8,
  fontWeight: 700,
}

const metricValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#0f172a',
}

const metricHintStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  marginTop: 8,
}

const manualChecklistStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const manualActionStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const manualActionTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 6,
}

const manualActionTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6,
}

const upperHandGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const upperHandCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const upperHandLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
}

const upperHandValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 800,
}

const boardHeaderStyle: React.CSSProperties = {
  marginBottom: 16,
}

const boardTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 6,
}

const boardSubtitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
}

function boardColumnStyle(tone: 'critical' | 'high' | 'normal'): React.CSSProperties {
  const toneMap = {
    critical: { border: '#fecaca', background: '#fff7f7' },
    high: { border: '#fed7aa', background: '#fffaf5' },
    normal: { border: '#d1fae5', background: '#f8fffb' },
  }[tone]

  return {
    borderRadius: 22,
    padding: 18,
    border: `1px solid ${toneMap.border}`,
    background: toneMap.background,
    minHeight: 220,
  }
}

const dispatchCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
}

const dispatchMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  color: '#475569',
  fontSize: 13,
  marginBottom: 12,
}

const recommendationBoxStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
}

const recommendationLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 6,
}

const recommendationValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 800,
}

const cardActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const primaryMiniButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: '#fff',
  padding: '9px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}

const secondaryMiniButtonStyle: React.CSSProperties = {
  background: '#fff',
  color: '#0f172a',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}

const shortlistCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
}

const shortlistHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
  marginBottom: 12,
}

const shortlistTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 800,
}

const candidateRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
}

const candidateActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 140,
}

const tagWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  marginTop: 8,
}

const languageTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 8px',
  borderRadius: 999,
  background: '#e0f2fe',
  color: '#075985',
  border: '1px solid #bae6fd',
  fontSize: 11,
  fontWeight: 800,
}

const skillTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 8px',
  borderRadius: 999,
  background: '#ede9fe',
  color: '#6d28d9',
  border: '1px solid #ddd6fe',
  fontSize: 11,
  fontWeight: 800,
}

const widgetStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const widgetCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const widgetTitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
}

const widgetValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 800,
}

const widgetSubtitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  marginTop: 8,
}

const decisionBoardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const decisionRuleStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const decisionRuleTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
  marginBottom: 6,
}

const decisionRuleTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6,
}

const quickLinksGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const quickLinkCardStyle: React.CSSProperties = {
  display: 'block',
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginTop: 4,
}
