import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Incident = {
  id: number
  incident_title: string | null
  incident_type: string | null
  severity: string | null
  status: string | null
  source_module: string | null
  mission_id: number | null
  caregiver_id: number | null
  family_id: number | null
  lead_id: number | null
  description: string | null
  resolution_notes: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string | null
  resolved_at: string | null
}

function badgeStyle(
  value: string,
  kind: 'status' | 'severity'
): React.CSSProperties {
  const v = (value || '').toLowerCase()

  const severityMap: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
    medium: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    high: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    critical: { bg: '#7f1d1d', text: '#ffffff', border: '#7f1d1d' },
  }

  const statusMap: Record<string, { bg: string; text: string; border: string }> = {
    open: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    in_progress: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    resolved: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    closed: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
  }

  const map = kind === 'severity' ? severityMap : statusMap
  const color = map[v] || { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }

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

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; severity?: string; status?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const q = (params?.q || '').trim()
  const severityFilter = (params?.severity || '').trim()
  const statusFilter = (params?.status || '').trim()

  const supabase = await createClient()

  let query = supabase
    .from('incidents')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (severityFilter) query = query.eq('severity', severityFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  if (q) {
    query = query.or(
      `incident_title.ilike.%${q}%,incident_type.ilike.%${q}%,source_module.ilike.%${q}%,description.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  const incidents = (data || []) as Incident[]

  const { data: allIncidentsRaw } = await supabase.from('incidents').select('*')
  const allIncidents = (allIncidentsRaw || []) as Incident[]

  const total = allIncidents.length
  const open = allIncidents.filter((i) => (i.status || '').toLowerCase() === 'open').length
  const inProgress = allIncidents.filter((i) => (i.status || '').toLowerCase() === 'in_progress').length
  const resolved = allIncidents.filter((i) => (i.status || '').toLowerCase() === 'resolved').length
  const critical = allIncidents.filter((i) => (i.severity || '').toLowerCase() === 'critical').length

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Incidents Center</div>
          <h1 style={titleStyle}>Incidents Module</h1>
          <p style={subtitleStyle}>
            Centre centralisé de suivi des incidents missions, intervenantes, familles et leads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/incidents/new" style={buttonStyle}>+ Nouvel incident</Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <KpiCard label="Incidents totaux" value={`🚨 ${total}`} />
        <KpiCard label="Open" value={`🔴 ${open}`} />
        <KpiCard label="In progress" value={`🟠 ${inProgress}`} />
        <KpiCard label="Resolved" value={`🟢 ${resolved}`} />
        <KpiCard label="Critical" value={`⛔ ${critical}`} />
      </section>

      <section style={panelStyle}>
        <form method="GET" style={filterGridStyle}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Titre, type, module, description..."
            style={inputStyle}
          />

          <select name="severity" defaultValue={severityFilter} style={inputStyle}>
            <option value="">Toutes les sévérités</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>

          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">Tous les statuts</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={buttonStyle}>Filtrer</button>
            <Link href="/incidents" style={secondaryButtonStyle}>Reset</Link>
          </div>
        </form>
      </section>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : incidents.length === 0 ? (
        <div style={emptyStyle}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Aucun incident trouvé</h3>
          <p style={{ color: '#475569' }}>Crée un incident pour commencer le suivi opérationnel.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {incidents.map((incident) => (
            <section key={incident.id} style={cardStyle}>
              <div style={cardTopStyle}>
                <div>
                  <div style={idStyle}>Incident #{incident.id}</div>
                  <h2 style={nameStyle}>{incident.incident_title || 'Incident sans titre'}</h2>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={badgeStyle(incident.severity || 'medium', 'severity')}>
                    {incident.severity || 'medium'}
                  </span>
                  <span style={badgeStyle(incident.status || 'open', 'status')}>
                    {incident.status || 'open'}
                  </span>
                </div>
              </div>

              <div style={contentGridStyle}>
                <div>
                  <div style={lineStyle}>🧩 <strong>Type :</strong> {incident.incident_type || 'Non défini'}</div>
                  <div style={lineStyle}>📦 <strong>Module source :</strong> {incident.source_module || 'Non défini'}</div>
                  <div style={lineStyle}>👤 <strong>Assigné à :</strong> {incident.assigned_to || 'Non assigné'}</div>
                  <div style={lineStyle}>🕓 <strong>Créé le :</strong> {incident.created_at ? new Date(incident.created_at).toLocaleString() : '—'}</div>
                </div>

                <div>
                  <div style={lineStyle}>🎯 <strong>Mission ID :</strong> {incident.mission_id || '—'}</div>
                  <div style={lineStyle}>👩‍👧 <strong>Caregiver ID :</strong> {incident.caregiver_id || '—'}</div>
                  <div style={lineStyle}>🏠 <strong>Family ID :</strong> {incident.family_id || '—'}</div>
                  <div style={lineStyle}>📞 <strong>Lead ID :</strong> {incident.lead_id || '—'}</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={smallBlockTitleStyle}>Description</div>
                <div style={metaTextStyle}>{incident.description || 'Aucune description'}</div>
              </div>

              <div style={actionsWrapStyle}>
                <Link href={`/incidents/${incident.id}`} style={primaryActionStyle}>
                  Voir incident
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>{label}</div>
      <div style={kpiValueStyle}>{value}</div>
    </div>
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

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 20,
  padding: 18,
  border: '1px solid #dbe3ee',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
  marginBottom: 20,
}

const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr auto',
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
  marginBottom: 12,
}

const lineStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 16,
  lineHeight: 1.7,
}

const smallBlockTitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 6,
}

const metaTextStyle: React.CSSProperties = {
  color: '#334155',
  fontSize: 15,
  lineHeight: 1.6,
}

const actionsWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  paddingTop: 16,
  borderTop: '1px solid #e2e8f0',
  marginTop: 16,
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
