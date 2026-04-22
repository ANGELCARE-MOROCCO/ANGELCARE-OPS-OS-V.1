import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { archiveIncident } from '../archive-action'

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

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const incidentId = Number(id)
  const supabase = await createClient()

  const { data: incident, error } = await supabase
      .from('incidents')
  .select('*')
  .eq('id', incidentId)
  .eq('is_archived', false)
  .maybeSingle()

  if (error) {
    return <main style={{ padding: 32 }}>Erreur : {error.message}</main>
  }

  if (!incident) {
    return (
      <main style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>Incident introuvable</h1>
        <Link href="/incidents" style={secondaryButtonStyle}>← Retour incidents</Link>
        <Link href={`/incidents/edit/${incident.id}`} style={secondaryButtonStyle}>Modifier</Link>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Incidents Center</div>
          <h1 style={titleStyle}>{incident.incident_title || `Incident #${incident.id}`}</h1>
          <p style={subtitleStyle}>
            Vue détaillée de l’incident, impact opérationnel et éléments de résolution.
          </p>
        </div>
<form action={archiveIncident}>
  <input type="hidden" name="incident_id" value={incident.id} />
  <button type="submit" style={archiveButtonStyle}>
    Archiver
  </button>
</form>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/incidents" style={secondaryButtonStyle}>← Retour incidents</Link>
          <Link href={`/incidents/edit/${incident.id}`} style={secondaryButtonStyle}>Modifier</Link>
        </div>
      </div>

      <section style={heroCardStyle}>
        <div style={heroTopStyle}>
          <div>
            <div style={smallLabelStyle}>Incident ID</div>
            <div style={heroValueStyle}>#{incident.id}</div>
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

        <div style={heroGridStyle}>
          <InfoCard label="Type incident" value={incident.incident_type || 'Non défini'} />
          <InfoCard label="Module source" value={incident.source_module || 'Non défini'} />
          <InfoCard label="Assigné à" value={incident.assigned_to || 'Non assigné'} />
          <InfoCard label="Créé par" value={incident.created_by || 'Non défini'} />
          <InfoCard
            label="Créé le"
            value={incident.created_at ? new Date(incident.created_at).toLocaleString() : '—'}
          />
          <InfoCard
            label="Résolu le"
            value={incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : '—'}
          />
          <InfoCard label="Mission ID" value={incident.mission_id ? String(incident.mission_id) : '—'} />
          <InfoCard label="Caregiver ID" value={incident.caregiver_id ? String(incident.caregiver_id) : '—'} />
          <InfoCard label="Family ID" value={incident.family_id ? String(incident.family_id) : '—'} />
          <InfoCard label="Lead ID" value={incident.lead_id ? String(incident.lead_id) : '—'} />
        </div>
      </section>

      <div style={sectionGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Description</h2>
          <div style={infoValueStyle}>{incident.description || 'Aucune description renseignée.'}</div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Notes de résolution</h2>
          <div style={infoValueStyle}>{incident.resolution_notes || 'Aucune note de résolution.'}</div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Liens opérationnels</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {incident.mission_id ? (
              <Link href={`/missions/${incident.mission_id}`} style={primaryActionStyle}>
                Voir mission
              </Link>
            ) : null}

            {incident.caregiver_id ? (
              <Link href={`/caregivers/${incident.caregiver_id}`} style={primaryActionStyle}>
                Voir caregiver
              </Link>
            ) : null}

            {incident.family_id ? (
              <Link href={`/families/${incident.family_id}`} style={primaryActionStyle}>
                Voir famille
              </Link>
            ) : null}

            {incident.lead_id ? (
              <Link href={`/leads/${incident.lead_id}`} style={primaryActionStyle}>
                Voir lead
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={smallLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
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

const heroCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
  marginBottom: 20,
}

const heroTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 18,
}

const heroGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 14,
}

const sectionGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 20,
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

const infoCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const smallLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 6,
}

const heroValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 800,
}

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.5,
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
const archiveButtonStyle: React.CSSProperties = {
  background: '#fff7ed',
  color: '#9a3412',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #fdba74',
  cursor: 'pointer',
}