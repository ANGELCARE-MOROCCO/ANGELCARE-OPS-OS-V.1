import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { convertLeadToMissionFromList } from './actions'
function badgeStyle(status: string): React.CSSProperties {
  const s = (status || '').toLowerCase()

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    new: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    contacted: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
    qualified: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    matching: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    converted: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    normal: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
    whatsapp: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    appel: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
    facebook: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
    instagram: { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' },
  }

  const color = colors[s] || { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
    fontSize: 13,
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

export default async function LeadsPage({
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
    .from('leads')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (cityFilter) query = query.eq('city', cityFilter)
  if (urgencyFilter) query = query.eq('urgency', urgencyFilter)
  if (q) query = query.or(`parent_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`)

  const { data: leads, error } = await query

  const allLeadsRes = await supabase.from('leads').select('*').eq('is_archived', false)
  const allLeads = allLeadsRes.data || []

  const totalLeads = allLeads.length
  const newLeads = allLeads.filter((l) => (l.status || 'new').toLowerCase() === 'new').length
  const urgentLeads = allLeads.filter((l) => (l.urgency || '').toLowerCase() === 'urgent').length
  const convertedLeads = allLeads.filter((l) => (l.status || '').toLowerCase() === 'converted').length

  const cityOptions = Array.from(
    new Set(allLeads.map((lead) => lead.city).filter(Boolean))
  ) as string[]

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • CRM Leads Desk</div>
          <h1 style={titleStyle}>Leads AngelCare</h1>
          <p style={subtitleStyle}>
            Qualification commerciale, organisation CRM et conversion vers les missions
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/leads/new" style={buttonStyle}>+ Nouveau lead</Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <div style={kpiCardStyle('default')}>
          <div style={kpiLabelStyle}>Leads totaux</div>
          <div style={kpiValueStyle}>🔥 {totalLeads}</div>
        </div>
        <div style={kpiCardStyle('warning')}>
          <div style={kpiLabelStyle}>Nouveaux</div>
          <div style={kpiValueStyle}>🆕 {newLeads}</div>
        </div>
        <div style={kpiCardStyle('danger')}>
          <div style={kpiLabelStyle}>Urgents</div>
          <div style={kpiValueStyle}>🚨 {urgentLeads}</div>
        </div>
        <div style={kpiCardStyle('success')}>
          <div style={kpiLabelStyle}>Convertis</div>
          <div style={kpiValueStyle}>✅ {convertedLeads}</div>
        </div>
      </section>

      <section style={filterPanelStyle}>
        <form method="GET" style={filterGridStyle}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom, téléphone ou ville"
            style={inputStyle}
          />

          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">Tous les statuts</option>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="qualified">qualified</option>
            <option value="matching">matching</option>
            <option value="converted">converted</option>
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
            <Link href="/leads" style={secondaryButtonStyle}>Reset</Link>
          </div>
        </form>
      </section>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : !leads || leads.length === 0 ? (
        <div style={emptyStyle}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Aucun lead trouvé</h3>
          <p style={{ color: '#475569' }}>
            Essaie d’élargir les filtres ou crée un nouveau lead.
          </p>
          <Link href="/leads/new" style={buttonStyle}>Créer un lead</Link>
        </div>
      ) : (
        <div style={gridStyle}>
          {leads.map((lead) => {
            const serviceText =
              lead.service_interests?.length
                ? lead.service_interests.join(', ')
                : lead.service_needed || 'Non précisé'

            return (
              <section key={lead.id} style={cardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <div style={idStyle}>Lead #{lead.id}</div>
                    <h2 style={nameStyle}>{lead.parent_name || 'Sans nom'}</h2>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={badgeStyle(lead.status || 'new')}>{lead.status || 'new'}</span>
                    <span style={badgeStyle(lead.urgency || 'normal')}>{lead.urgency || 'normal'}</span>
                    <span style={badgeStyle(lead.source || 'normal')}>{lead.source || 'source'}</span>
                  </div>
                </div>

                <div style={contentGridStyle}>
                  <div>
                    <div style={lineStyle}>📍 <strong>Ville :</strong> {lead.city || 'Non définie'}</div>
                    <div style={lineStyle}>📞 <strong>Téléphone :</strong> {lead.phone || 'Non défini'}</div>
                    <div style={lineStyle}>🧩 <strong>Service :</strong> {serviceText}</div>
                    <div style={lineStyle}>👶 <strong>Enfants :</strong> {lead.children_count || 0}</div>
                  </div>

                  <div>
                    <div style={lineStyle}>🕒 <strong>Créneaux :</strong> {lead.preferred_schedule || 'Non précisé'}</div>
                    <div style={lineStyle}>⚠️ <strong>Besoins spécifiques :</strong> {lead.special_needs || 'Aucun détail'}</div>
                    <div style={lineStyle}>📝 <strong>Note CRM :</strong> {lead.timeline_note || '—'}</div>
                    <div style={lineStyle}>📅 <strong>Créé le :</strong> {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</div>
                  </div>
                </div>

                <div style={actionsWrapStyle}>
                  <Link href={`/leads/${lead.id}`} style={primaryActionStyle}>
                    Voir fiche CRM
                  </Link>

                  <Link href={`/leads/edit/${lead.id}`} style={secondaryActionStyle}>
                    Modifier
                  </Link>

                  <form action={convertLeadToMissionFromList} style={{ margin: 0 }}>
  <input type="hidden" name="lead_id" value={lead.id} />
  <button type="submit" style={convertActionStyle}>
    Convertir mission
  </button>
</form>

                  <Link href={`/leads/${lead.id}`} style={secondaryActionStyle}>
                    Convertir en mission
                  </Link>
                </div>
              </section>
            )
          })}
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
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  marginBottom: 8,
}

const kpiValueStyle: React.CSSProperties = {
  fontSize: 30,
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
  gridTemplateColumns: '1.2fr 1fr',
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

const convertActionStyle: React.CSSProperties = {
  background: '#16a34a',
  color: 'white',
  padding: '10px 12px',
  borderRadius: 10,
  fontWeight: 800,
  fontSize: 13,
  border: 'none',
  cursor: 'pointer',
}