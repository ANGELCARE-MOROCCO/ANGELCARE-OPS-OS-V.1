import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'

function txt(v: any, f = '—') { return v === null || v === undefined || v === '' ? f : String(v) }

export default async function FamiliesIntelligencePage() {
  const supabase = await createClient()
  const [{ data: familiesRaw }, { data: missionsRaw }, { data: leadsRaw }] = await Promise.all([
    supabase.from('families').select('*').eq('is_archived', false),
    supabase.from('missions').select('*').order('id', { ascending: false }).limit(300),
    supabase.from('leads').select('*').order('id', { ascending: false }).limit(300),
  ])

  const families = familiesRaw || []
  const missions = missionsRaw || []
  const leads = leadsRaw || []
  const riskFamilies = families.filter((f: any) => ['high', 'critical', 'urgent'].includes((f.risk_level || '').toLowerCase()))
  const vipFamilies = families.filter((f: any) => (f.family_segment || f.status || '').toLowerCase().includes('vip'))
  const needs = families.filter((f: any) => f.special_needs)
  const withoutMission = families.filter((f: any) => !missions.some((m: any) => Number(m.family_id) === Number(f.id)))

  return (
    <AppShell title="Families Command Center" subtitle="Vue CEO/Manager : risques, VIP, besoins spécifiques et familles sans mission." breadcrumbs={[{ label: 'Families', href: '/families' }, { label: 'Command Center' }]} actions={<PageAction href="/families" variant="light">Retour Families</PageAction>}>
      <div style={pageStyle}>
        <section style={heroStyle}><div><div style={eyebrowStyle}>Client Intelligence</div><h1 style={heroTitleStyle}>Family Portfolio Health</h1><p style={heroTextStyle}>Priorisez la relation client, la qualité de mission et la transformation commerciale.</p></div></section>
        <section style={kpiGridStyle}><Kpi label="Familles" value={families.length} /><Kpi label="VIP" value={vipFamilies.length} /><Kpi label="À risque" value={riskFamilies.length} /><Kpi label="Besoins spécifiques" value={needs.length} /><Kpi label="Sans mission" value={withoutMission.length} /><Kpi label="Leads liés" value={leads.length} /></section>
        <section style={gridStyle}>
          <Board title="Familles à risque" items={riskFamilies} empty="Aucune famille à risque." />
          <Board title="VIP / Premium" items={vipFamilies} empty="Aucune famille VIP identifiée." />
          <Board title="Besoins spécifiques" items={needs} empty="Aucun besoin spécifique déclaré." />
          <Board title="Familles sans mission" items={withoutMission} empty="Toutes les familles ont au moins une mission." />
        </section>
      </div>
    </AppShell>
  )
}
function Kpi({ label, value }: { label: string; value: any }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong></div> }
function Board({ title, items, empty }: { title: string; items: any[]; empty: string }) { return <div style={panelStyle}><h2 style={titleStyle}>{title}</h2>{items.length ? items.slice(0, 10).map((f) => <Link key={f.id} href={`/families/${f.id}`} style={itemStyle}><strong>{txt(f.family_name || f.parent_name)}</strong><span>{txt(f.city)} • {txt(f.zone)} • {txt(f.status || f.risk_level)}</span></Link>) : <div style={emptyStyle}>{empty}</div>}</div> }
const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#020617 68%)', boxShadow: '0 30px 80px rgba(2,6,23,.3)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#ddd6fe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 40, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { color: 'rgba(255,255,255,.86)', fontWeight: 750 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const titleStyle: React.CSSProperties = { margin: '0 0 14px', color: '#0f172a', fontSize: 23, fontWeight: 950 }
const itemStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, color: '#334155', textDecoration: 'none' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
