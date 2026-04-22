import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Family = {
  id: number
  family_name: string | null
  parent_name: string | null
  phone: string | null
  secondary_phone: string | null
  city: string | null
  zone: string | null
  address: string | null
  children_count: number | null
  children_ages: string | null
  preferred_schedule: string | null
  service_preferences: string | null
  special_needs: string | null
  source: string | null
  status: string | null
  notes: string | null
  created_at: string | null
}

function badgeStyle(value: string): React.CSSProperties {
  const v = (value || '').toLowerCase()

  const map: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    inactive: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
    vip: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
  }

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

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; city?: string; status?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const q = (params?.q || '').trim()
  const cityFilter = (params?.city || '').trim()
  const statusFilter = (params?.status || '').trim()

  const supabase = await createClient()

  let query = supabase
    .from('families')
    .select('*')
    .eq('is_archived', false)
    .order('id', { ascending: false })

  if (cityFilter) query = query.eq('city', cityFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  if (q) {
    query = query.or(
      `family_name.ilike.%${q}%,parent_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  const families = (data || []) as Family[]

  const { data: allFamiliesRaw } = await supabase.from('families').select('*').eq('is_archived', false)
  const allFamilies = (allFamiliesRaw || []) as Family[]

  const cityOptions = Array.from(new Set(allFamilies.map((f) => f.city).filter(Boolean))) as string[]

  const total = allFamilies.length
  const active = allFamilies.filter((f) => (f.status || '').toLowerCase() === 'active').length
  const pending = allFamilies.filter((f) => (f.status || '').toLowerCase() === 'pending').length
  const vip = allFamilies.filter((f) => (f.status || '').toLowerCase() === 'vip').length
  const childrenTotal = allFamilies.reduce((sum, f) => sum + Number(f.children_count || 0), 0)

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Families CRM</div>
          <h1 style={titleStyle}>Families / Clients Directory</h1>
          <p style={subtitleStyle}>
            Répertoire CRM des familles clientes, coordonnées, besoins enfants et suivi relationnel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/families/new" style={buttonStyle}>+ Nouvelle famille</Link>
        </div>
      </div>

      <section style={kpiGridStyle}>
        <KpiCard label="Familles totales" value={`👨‍👩‍👧 ${total}`} />
        <KpiCard label="Familles actives" value={`✅ ${active}`} />
        <KpiCard label="En attente" value={`🕓 ${pending}`} />
        <KpiCard label="VIP" value={`⭐ ${vip}`} />
        <KpiCard label="Enfants suivis" value={`🧒 ${childrenTotal}`} />
      </section>

      <section style={panelStyle}>
        <form method="GET" style={filterGridStyle}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nom famille, parent, téléphone, ville..."
            style={inputStyle}
          />

          <select name="city" defaultValue={cityFilter} style={inputStyle}>
            <option value="">Toutes les villes</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">Tous les statuts</option>
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="inactive">inactive</option>
            <option value="vip">vip</option>
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={buttonStyle}>Filtrer</button>
            <Link href="/families" style={secondaryButtonStyle}>Reset</Link>
          </div>
        </form>
      </section>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : families.length === 0 ? (
        <div style={emptyStyle}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Aucune famille trouvée</h3>
          <p style={{ color: '#475569' }}>Ajoute une première famille pour lancer le CRM client.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {families.map((family) => (
            <section key={family.id} style={cardStyle}>
              <div style={cardTopStyle}>
                <div>
                  <div style={idStyle}>Family #{family.id}</div>
                  <h2 style={nameStyle}>
                    {family.family_name || family.parent_name || 'Famille sans nom'}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={badgeStyle(family.status || 'active')}>
                    {family.status || 'active'}
                  </span>
                </div>
              </div>

              <div style={contentGridStyle}>
                <div>
                  <div style={lineStyle}>👤 <strong>Parent :</strong> {family.parent_name || 'Non défini'}</div>
                  <div style={lineStyle}>📞 <strong>Téléphone :</strong> {family.phone || 'Non défini'}</div>
                  <div style={lineStyle}>📍 <strong>Ville :</strong> {family.city || 'Non définie'}</div>
                  <div style={lineStyle}>🧭 <strong>Zone :</strong> {family.zone || 'Non définie'}</div>
                </div>

                <div>
                  <div style={lineStyle}>🧒 <strong>Enfants :</strong> {family.children_count ?? 0}</div>
                  <div style={lineStyle}>🎂 <strong>Âges :</strong> {family.children_ages || 'Non définis'}</div>
                  <div style={lineStyle}>🗓️ <strong>Créneaux :</strong> {family.preferred_schedule || 'Non définis'}</div>
                  <div style={lineStyle}>🧩 <strong>Besoins spécifiques :</strong> {family.special_needs || 'Aucun'}</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={smallBlockTitleStyle}>Préférences service</div>
                <div style={metaTextStyle}>{family.service_preferences || 'Non définies'}</div>
              </div>

              <div style={actionsWrapStyle}>
                <Link href={`/families/${family.id}`} style={primaryActionStyle}>
                  Voir fiche famille
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