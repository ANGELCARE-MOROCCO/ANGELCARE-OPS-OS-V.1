import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { restoreArchivedRecord } from './actions'

export default async function ArchiveCenterPage() {
  const supabase = await createClient()

  const [
    missionsRes,
    caregiversRes,
    leadsRes,
    familiesRes,
    incidentsRes,
  ] = await Promise.all([
    supabase
      .from('missions')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false }),
    supabase
      .from('caregivers')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false }),
    supabase
      .from('leads')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false }),
    supabase
      .from('families')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false }),
    supabase
      .from('incidents')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false }),
  ])

  const archivedMissions = missionsRes.data || []
  const archivedCaregivers = caregiversRes.data || []
  const archivedLeads = leadsRes.data || []
  const archivedFamilies = familiesRes.data || []
  const archivedIncidents = incidentsRes.data || []

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Archive Center</div>
          <h1 style={titleStyle}>Restore Center</h1>
          <p style={subtitleStyle}>
            Retrouvez les éléments archivés et restaurez-les si nécessaire.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <KpiCard label="Missions archivées" value={archivedMissions.length} />
        <KpiCard label="Caregivers archivées" value={archivedCaregivers.length} />
        <KpiCard label="Leads archivés" value={archivedLeads.length} />
        <KpiCard label="Familles archivées" value={archivedFamilies.length} />
        <KpiCard label="Incidents archivés" value={archivedIncidents.length} />
      </section>

      <ArchiveSection
        title="Missions archivées"
        records={archivedMissions}
        tableName="missions"
        getLabel={(item: any) => `Mission #${item.id} • ${item.service_type || 'Mission'}`}
        getMeta={(item: any) => `${item.mission_date || 'Date inconnue'} • ${item.city || 'Ville inconnue'}`}
        hrefBuilder={(item: any) => `/missions/${item.id}`}
      />

      <ArchiveSection
        title="Caregivers archivées"
        records={archivedCaregivers}
        tableName="caregivers"
        getLabel={(item: any) => item.full_name || `Caregiver #${item.id}`}
        getMeta={(item: any) => `${item.city || 'Ville inconnue'} • ${item.current_status || item.status || '—'}`}
        hrefBuilder={(item: any) => `/caregivers/${item.id}`}
      />

      <ArchiveSection
        title="Leads archivés"
        records={archivedLeads}
        tableName="leads"
        getLabel={(item: any) => item.parent_name || `Lead #${item.id}`}
        getMeta={(item: any) => `${item.city || 'Ville inconnue'} • ${item.phone || 'Sans téléphone'}`}
        hrefBuilder={(item: any) => `/leads/${item.id}`}
      />

      <ArchiveSection
        title="Familles archivées"
        records={archivedFamilies}
        tableName="families"
        getLabel={(item: any) => item.family_name || item.parent_name || `Famille #${item.id}`}
        getMeta={(item: any) => `${item.city || 'Ville inconnue'} • ${item.status || '—'}`}
        hrefBuilder={(item: any) => `/families/${item.id}`}
      />

      <ArchiveSection
        title="Incidents archivés"
        records={archivedIncidents}
        tableName="incidents"
        getLabel={(item: any) => item.incident_title || item.incident_type || `Incident #${item.id}`}
        getMeta={(item: any) => `${item.severity || '—'} • ${item.status || '—'}`}
        hrefBuilder={(item: any) => `/incidents/${item.id}`}
      />
    </main>
  )
}

function ArchiveSection({
  title,
  records,
  tableName,
  getLabel,
  getMeta,
  hrefBuilder,
}: {
  title: string
  records: any[]
  tableName: string
  getLabel: (item: any) => string
  getMeta: (item: any) => string
  hrefBuilder: (item: any) => string
}) {
  return (
    <section style={panelStyle}>
      <h2 style={panelTitleStyle}>{title}</h2>

      {records.length === 0 ? (
        <div style={emptyStyle}>Aucun élément archivé.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {records.map((item) => (
            <div key={item.id} style={rowStyle}>
              <div>
                <div style={rowTitleStyle}>{getLabel(item)}</div>
                <div style={rowMetaStyle}>{getMeta(item)}</div>
                <div style={rowMetaStyle}>
                  Archivé le : {item.archived_at ? new Date(item.archived_at).toLocaleString() : '—'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href={hrefBuilder(item)} style={secondaryButtonStyle}>
                  Ouvrir
                </Link>

                <form action={restoreArchivedRecord}>
                  <input type="hidden" name="table" value={tableName} />
                  <input type="hidden" name="record_id" value={item.id} />
                  <button type="submit" style={restoreButtonStyle}>
                    Restaurer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function KpiCard({ label, value }: { label: string; value: number }) {
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
  fontSize: 40,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 17,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 24,
}

const kpiCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginBottom: 8,
  fontWeight: 700,
}

const kpiValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#0f172a',
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  marginBottom: 20,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: 14,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
}

const rowTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
  marginBottom: 6,
}

const rowMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: 1.6,
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

const restoreButtonStyle: React.CSSProperties = {
  background: '#dcfce7',
  color: '#166534',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #86efac',
  cursor: 'pointer',
}

const emptyStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: '1px dashed #cbd5e1',
  background: '#ffffff',
  color: '#64748b',
}