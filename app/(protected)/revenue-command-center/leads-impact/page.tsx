import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Lead = Record<string, any>
const STAGE_WEIGHT: Record<string, number> = { new: .2, qualified: .45, proposal: .65, negotiation: .75, converted: 1, won: 1, lost: 0, cancelled: 0 }

export default async function LeadsRevenueImpactPage() {
  await requireRole(['ceo', 'manager', 'sales', 'ops_admin'])
  const supabase = await createClient()
  const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(1000)
  const leads = (data || []) as Lead[]
  const active = leads.filter((l) => !bool(l.is_archived))
  const pipeline = active.reduce((s, l) => s + money(l.estimated_value), 0)
  const forecast = active.reduce((s, l) => s + money(l.estimated_value) * (STAGE_WEIGHT[stage(l)] ?? .2), 0)
  const converted = active.filter((l) => ['converted', 'won'].includes(stage(l)))
  const lost = active.filter((l) => ['lost', 'cancelled'].includes(stage(l)))
  const hot = active.filter((l) => priority(l) === 'high' || ['proposal', 'negotiation', 'qualified'].includes(stage(l)))
  const conversionRate = active.length ? Math.round((converted.length / active.length) * 100) : 0
  const lostRate = active.length ? Math.round((lost.length / active.length) * 100) : 0
  const sourceRows = Object.entries(group(active, (l) => String(l.source || 'Non défini'))).map(([source, rows]) => ({ source, rows }))

  return (
    <AppShell
      title="Leads Revenue Impact"
      subtitle="Connexion entre pipeline commercial, prévision revenu et signaux de conversion."
      breadcrumbs={[{ label: 'Revenue Command Center', href: '/revenue-command-center' }, { label: 'Leads Impact' }]}
      actions={<PageAction href="/leads/command-center" variant="light">Leads Command Center</PageAction>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>💰 Revenue Intelligence</div>
            <h1 style={heroTitleStyle}>{formatMoney(forecast)}</h1>
            <p style={heroTextStyle}>Forecast pondéré à partir du pipeline leads actif.</p>
          </div>
          <div style={heroCardStyle}><span>Pipeline brut</span><strong>{formatMoney(pipeline)}</strong><small>{active.length} leads actifs</small></div>
        </section>
        <section style={kpiGridStyle}>
          <Kpi title="Conversion" value={`${conversionRate}%`} sub={`${converted.length} convertis`} tone="#22c55e" />
          <Kpi title="Perte" value={`${lostRate}%`} sub={`${lost.length} perdus`} tone={lostRate > 20 ? '#ef4444' : undefined} />
          <Kpi title="Hot pipeline" value={String(hot.length)} sub="haute probabilité" tone="#f59e0b" />
          <Kpi title="Valeur moyenne" value={formatMoney(active.length ? pipeline / active.length : 0)} sub="par lead actif" />
        </section>
        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Performance par source" subtitle="Comprendre d’où vient le potentiel commercial." />
            <div style={listStyle}>
              {sourceRows.map(({ source, rows }) => (
                <div key={source} style={sourceRowStyle}>
                  <div><strong>{source}</strong><p>{rows.length} leads</p></div>
                  <div style={{ textAlign: 'right' }}><strong>{formatMoney(rows.reduce((s, l) => s + money(l.estimated_value), 0))}</strong><p>pipeline</p></div>
                </div>
              ))}
            </div>
          </div>
          <aside style={panelStyle}>
            <Header title="Directive CEO" subtitle="Priorité commerciale recommandée." />
            <div style={directiveStyle}>
              <strong>{hot.length ? 'Accélérer les hot leads' : 'Créer du pipeline qualifié'}</strong>
              <p>{hot.length ? 'Traiter les leads en proposition/négociation avant création de nouveaux volumes.' : 'Le pipeline chaud est faible: relancer les sources performantes et qualifier rapidement.'}</p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}
function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone?: string }) { return <div style={{ ...kpiStyle, borderColor: tone || '#dbe3ee' }}><span>{title}</span><strong style={{ color: tone || '#0f172a' }}>{value}</strong><small>{sub}</small></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 18 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function bool(v: any) { return v === true || v === 'true' }
function stage(l: Lead) { return String(l.stage || l.status || 'new').toLowerCase() }
function priority(l: Lead) { return String(l.priority || 'medium').toLowerCase() }
function money(v: any) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
function group(items: Lead[], fn: (l: Lead) => string) { return items.reduce<Record<string, Lead[]>>((acc, item) => { const k = fn(item); acc[k] = acc[k] || []; acc[k].push(item); return acc }, {}) }
function formatMoney(n: number) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n || 0) }
const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#16a34a,#020617 62%)', boxShadow: '0 32px 80px rgba(2,6,23,.34)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bbf7d0', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 44, fontWeight: 1000 }
const heroTextStyle: React.CSSProperties = { color: 'rgba(255,255,255,.86)', fontWeight: 800 }
const heroCardStyle: React.CSSProperties = { minWidth: 260, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const sourceRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const directiveStyle: React.CSSProperties = { padding: 18, borderRadius: 20, background: '#0f172a', color: '#fff', lineHeight: 1.6 }
