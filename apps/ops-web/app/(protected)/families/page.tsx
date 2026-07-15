import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'

type Family = Record<string, any>

function text(value: any, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function tone(status?: string) {
  const s = (status || '').toLowerCase()
  if (s.includes('vip')) return { bg: '#ede9fe', fg: '#5b21b6', bd: '#c4b5fd' }
  if (s.includes('active')) return { bg: '#dcfce7', fg: '#166534', bd: '#86efac' }
  if (s.includes('pending')) return { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' }
  if (s.includes('risk') || s.includes('urgent')) return { bg: '#fee2e2', fg: '#991b1b', bd: '#fca5a5' }
  return { bg: '#e2e8f0', fg: '#334155', bd: '#cbd5e1' }
}

export default async function FamiliesPage({ searchParams }: { searchParams?: Promise<{ q?: string; city?: string; status?: string; segment?: string }> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const city = (sp?.city || '').trim()
  const status = (sp?.status || '').trim()
  const segment = (sp?.segment || '').trim()

  const supabase = await createClient()

  let query = supabase.from('families').select('*').eq('is_archived', false).order('id', { ascending: false })
  if (city) query = query.eq('city', city)
  if (status) query = query.eq('status', status)
  if (segment) query = query.eq('family_segment', segment)
  if (q) query = query.or(`family_name.ilike.%${q}%,parent_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%`)

  const [{ data, error }, { data: allRaw }] = await Promise.all([
    query,
    supabase.from('families').select('*').eq('is_archived', false),
  ])

  const families = (data || []) as Family[]
  const all = (allRaw || []) as Family[]
  const cities = Array.from(new Set(all.map((f) => f.city).filter(Boolean))) as string[]
  const segments = Array.from(new Set(all.map((f) => f.family_segment).filter(Boolean))) as string[]

  const total = all.length
  const active = all.filter((f) => (f.status || '').toLowerCase() === 'active').length
  const vip = all.filter((f) => (f.status || '').toLowerCase() === 'vip' || (f.family_segment || '').toLowerCase() === 'vip').length
  const risk = all.filter((f) => ['high', 'critical', 'urgent'].includes((f.risk_level || '').toLowerCase())).length
  const children = all.reduce((s, f) => s + Number(f.children_count || 0), 0)
  const pendingReview = all.filter((f) => f.next_review_at && new Date(f.next_review_at) <= new Date()).length

  return (
    <AppShell
      title="Families Intelligence"
      subtitle="CRM client enrichi : familles, besoins enfants, priorités, risques et continuité opérationnelle."
      breadcrumbs={[{ label: 'Families' }]}
      actions={<><PageAction href="/families/intelligence" variant="light">Command Center</PageAction><PageAction href="/families/new">+ Nouvelle famille</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Family Operating Layer</div>
            <h1 style={heroTitleStyle}>Clients, besoins & potentiel service</h1>
            <p style={heroTextStyle}>Vue manager pour détecter les familles VIP, les besoins spécifiques, les relances et les comptes à risque.</p>
          </div>
          <div style={heroPanelStyle}>
            <strong>{total}</strong>
            <span>familles actives dans le CRM</span>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Total familles" value={total} sub="CRM actif" />
          <Kpi label="Familles actives" value={active} sub="service en cours" />
          <Kpi label="VIP / Premium" value={vip} sub="priorité relation" />
          <Kpi label="À risque" value={risk} sub="surveillance manager" />
          <Kpi label="Enfants suivis" value={children} sub="population service" />
          <Kpi label="Reviews dues" value={pendingReview} sub="action attendue" />
        </section>

        <form style={filterStyle}>
          <input name="q" defaultValue={q} placeholder="Recherche famille, parent, téléphone, ville, zone..." style={inputStyle} />
          <select name="city" defaultValue={city} style={inputStyle}><option value="">Toutes villes</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <select name="status" defaultValue={status} style={inputStyle}><option value="">Tous statuts</option><option value="active">active</option><option value="pending">pending</option><option value="inactive">inactive</option><option value="vip">vip</option></select>
          <select name="segment" defaultValue={segment} style={inputStyle}><option value="">Tous segments</option>{segments.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <button style={buttonStyle}>Filtrer</button>
          <Link href="/families" style={lightButtonStyle}>Reset</Link>
        </form>

        {error ? <div style={errorStyle}>Erreur : {error.message}</div> : null}

        <section style={gridStyle}>
          {families.map((family) => {
            const c = tone(family.status || family.risk_level)
            return (
              <article key={family.id} style={cardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <div style={idStyle}>Family #{family.id}</div>
                    <h2 style={cardTitleStyle}>{text(family.family_name || family.parent_name, 'Famille sans nom')}</h2>
                    <p style={mutedStyle}>{text(family.city)} • {text(family.zone)} • {text(family.source, 'source inconnue')}</p>
                  </div>
                  <span style={{ ...badgeStyle, background: c.bg, color: c.fg, borderColor: c.bd }}>{text(family.status, 'active')}</span>
                </div>

                <div style={miniGridStyle}>
                  <Info label="Parent" value={family.parent_name} />
                  <Info label="Téléphone" value={family.phone} />
                  <Info label="Enfants" value={family.children_count ?? 0} />
                  <Info label="Âges" value={family.children_ages} />
                </div>

                <div style={sectionMiniStyle}>
                  <strong>Besoins & préférences</strong>
                  <p>{text(family.service_preferences || family.special_needs, 'Besoins non détaillés')}</p>
                </div>

                <div style={footerActionsStyle}>
                  <Link href={`/families/${family.id}`} style={darkButtonStyle}>Ouvrir fiche</Link>
                  <Link href={`/missions/new?family_id=${family.id}`} style={lightButtonStyle}>Créer mission</Link>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: number | string; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Info({ label, value }: { label: string; value: any }) { return <div style={infoStyle}><span>{label}</span><strong>{text(value)}</strong></div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 65%)', boxShadow: '0 30px 80px rgba(2,6,23,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950, color: '#fff' }
const heroTextStyle: React.CSSProperties = { margin: '8px 0 0', color: 'rgba(255,255,255,.86)', fontWeight: 750, maxWidth: 720 }
const heroPanelStyle: React.CSSProperties = { minWidth: 250, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 170px 150px 170px auto auto', gap: 12, padding: 16, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', alignItems: 'center' }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const lightButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '12px 14px', background: '#f8fafc', color: '#0f172a', border: '1px solid #dbe3ee', fontWeight: 900, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }
const darkButtonStyle: React.CSSProperties = { ...buttonStyle, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', display: 'grid', gap: 16 }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }
const idStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 900, marginBottom: 6 }
const cardTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const mutedStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 950 }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const sectionMiniStyle: React.CSSProperties = { padding: 14, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#334155' }
const footerActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const errorStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#fee2e2', color: '#991b1b', fontWeight: 900 }
