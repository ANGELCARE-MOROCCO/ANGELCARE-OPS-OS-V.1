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
  city: string | null
  zone: string | null
  notes: string | null
  created_at: string | null
}

function badgeStyle(value: string): React.CSSProperties {
  const v = (value || '').toLowerCase()

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
    assigned: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    confirmed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    in_progress: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    completed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    incident: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    cancelled: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
    urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    normal: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
  }

  const color = colors[v] || { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 11px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
  }
}

function kpiCardStyle(tone: 'default' | 'success' | 'warning' | 'danger'): React.CSSProperties {
  const tones = {
    default: { bg: '#ffffff', border: '#e2e8f0' },
    success: { bg: '#f0fdf4', border: '#bbf7d0' },
    warning: { bg: '#fffaf0', border: '#fde68a' },
    danger: { bg: '#fff7f7', border: '#fecaca' },
  }

  return {
    background: tones[tone].bg,
    border: `1px solid ${tones[tone].border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  }
}

export default async function MissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; city?: string; urgency?: string }>
}) {
  const params = searchParams ? await searchParams : undefined

  const q = (params?.q || '').trim()
  const statusFilter = (params?.status || '').trim()
  const cityFilter = (params?.city || '').trim()
  const urgencyFilter = (params?.urgency || '').trim()

  const supabase = await createClient()

  let query = supabase
    .from('missions')
    .select('*')
    .eq('is_archived', false)
    .order('mission_date', { ascending: false })
    

  if (statusFilter) query = query.eq('status', statusFilter)
  if (cityFilter) query = query.eq('city', cityFilter)
  if (urgencyFilter) query = query.eq('urgency', urgencyFilter)
  if (q) query = query.or(`service_type.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%`)

  const { data, error } = await query
  const missions = (data || []) as Mission[]

  const allRes = await supabase.from('missions').select('*')
  const allMissions = (allRes.data || []) as Mission[]

  const total = allMissions.length
  const draft = allMissions.filter((m) => (m.status || '').toLowerCase() === 'draft').length
  const confirmed = allMissions.filter((m) => (m.status || '').toLowerCase() === 'confirmed').length
  const inProgress = allMissions.filter((m) => (m.status || '').toLowerCase() === 'in_progress').length
  const urgent = allMissions.filter((m) => (m.urgency || '').toLowerCase() === 'urgent').length

  const cityOptions = Array.from(new Set(allMissions.map((m) => m.city).filter(Boolean))) as string[]

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Mission Control Desk</div>
          <h1 style={titleStyle}>Missions AngelCare</h1>
          <p style={subtitleStyle}>
            Pilotage opérationnel, assignation, exécution terrain et suivi des interventions
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/missions/new" style={buttonStyle}>+ Nouvelle mission</Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <div style={kpiCardStyle('default')}>
          <div style={kpiLabelStyle}>Missions totales</div>
          <div style={kpiValueStyle}>📦 {total}</div>
        </div>
        <div style={kpiCardStyle('warning')}>
          <div style={kpiLabelStyle}>Draft</div>
          <div style={kpiValueStyle}>📝 {draft}</div>
        </div>
        <div style={kpiCardStyle('success')}>
          <div style={kpiLabelStyle}>Confirmées</div>
          <div style={kpiValueStyle}>✅ {confirmed}</div>
        </div>
        <div style={kpiCardStyle('warning')}>
          <div style={kpiLabelStyle}>En cours</div>
          <div style={kpiValueStyle}>🛰️ {inProgress}</div>
        </div>
        <div style={kpiCardStyle('danger')}>
          <div style={kpiLabelStyle}>Urgentes</div>
          <div style={kpiValueStyle}>🚨 {urgent}</div>
        </div>
      </section>

      <section style={filterPanelStyle}>
        <form method="GET" style={filterGridStyle}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher service, ville ou zone"
            style={inputStyle}
          />

          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">Tous les statuts</option>
            <option value="draft">draft</option>
            <option value="assigned">assigned</option>
            <option value="confirmed">confirmed</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="incident">incident</option>
            <option value="cancelled">cancelled</option>
          </select>

          <select name="city" defaultValue={cityFilter} style={inputStyle}>
            <option value="">Toutes les villes</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select name="urgency" defaultValue={urgencyFilter} style={inputStyle}>
            <option value="">Toutes les urgences</option>
            <option value="normal">normal</option>
            <option value="urgent">urgent</option>
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={buttonStyle}>Filtrer</button>
            <Link href="/missions" style={secondaryButtonStyle}>Reset</Link>
          </div>
        </form>
      </section>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : !missions || missions.length === 0 ? (
        <div style={emptyStyle}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Aucune mission trouvée</h3>
          <p style={{ color: '#475569' }}>Crée une mission pour lancer l’opérationnel.</p>
          <Link href="/missions/new" style={buttonStyle}>Créer une mission</Link>
        </div>
      ) : (
        <div style={gridStyle}>
          {missions.map((mission) => (
            <section key={mission.id} style={cardStyle}>
              <div style={cardTopStyle}>
                <div>
                  <div style={idStyle}>Mission #{mission.id}</div>
                  <h2 style={nameStyle}>{mission.service_type || 'Mission AngelCare'}</h2>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={badgeStyle(mission.status || 'draft')}>{mission.status || 'draft'}</span>
                  <span style={badgeStyle(mission.urgency || 'normal')}>{mission.urgency || 'normal'}</span>
                </div>
              </div>

              <div style={contentGridStyle}>
                <div>
                  <div style={lineStyle}>📅 <strong>Date :</strong> {mission.mission_date || 'Non définie'}</div>
                  <div style={lineStyle}>🕒 <strong>Horaire :</strong> {mission.start_time || '--:--'} → {mission.end_time || '--:--'}</div>
                  <div style={lineStyle}>📍 <strong>Ville :</strong> {mission.city || 'Non définie'}</div>
                  <div style={lineStyle}>🧭 <strong>Zone :</strong> {mission.zone || 'Non définie'}</div>
                </div>

                <div>
                  <div style={lineStyle}>👩‍👧 <strong>Intervenante ID :</strong> {mission.caregiver_id || 'Non assignée'}</div>
                  <div style={lineStyle}>🏠 <strong>Famille ID :</strong> {mission.family_id || 'Non définie'}</div>
                  <div style={lineStyle}>📝 <strong>Notes :</strong> {mission.notes || 'Aucune note opérationnelle'}</div>
                </div>
              </div>

              <div style={actionsWrapStyle}>
                <Link href={`/missions/${mission.id}`} style={primaryActionStyle}>
                  Voir fiche mission
                </Link>

                <Link href={`/missions/edit/${mission.id}`} style={secondaryActionStyle}>
                  Modifier
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
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

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
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

const filterPanelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 20,
  padding: 18,
  border: '1px solid #dbe3ee',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
  marginBottom: 20,
}

const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
  gap: 12,
  alignItems: 'center',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
}

const cardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  marginBottom: 18,
  flexWrap: 'wrap',
}

const idStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 6,
}

const nameStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 24,
  marginBottom: 20,
}

const lineStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 16,
  lineHeight: 1.7,
}

const actionsWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  paddingTop: 16,
  borderTop: '1px solid #e2e8f0',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'white',
  color: '#0f172a',
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '12px 16px',
  borderRadius: 12,
  textDecoration: 'none',
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
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

const primaryActionStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 14,
}

const secondaryActionStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  padding: '10px 14px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 14,
  border: '1px solid #cbd5e1',
}

const emptyStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 20,
  padding: 32,
  border: '1px solid #e2e8f0',
}

const errorStyle: React.CSSProperties = {
  background: '#fff7f7',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 16,
  padding: 16,
}