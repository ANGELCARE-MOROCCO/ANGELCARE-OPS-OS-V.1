import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function money(value: any) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0)) }
function daysUntil(value: any) { if (!value) return null; const a = new Date(); const b = new Date(value); a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.ceil((b.getTime()-a.getTime())/86400000) }
function date(value: any) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : '—' }

export default async function ContractsCommandCenterPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('contracts').select(`*, families:family_id (family_name, parent_name, city)`).eq('is_archived', false).order('created_at', { ascending: false })
  const contracts = data || []

  const active = contracts.filter((c: any) => c.status === 'active')
  const expiring = contracts.filter((c: any) => { const d = daysUntil(c.renewal_date || c.end_date); return d !== null && d >= 0 && d <= 30 })
  const overdueRenewals = contracts.filter((c: any) => { const d = daysUntil(c.renewal_date || c.end_date); return d !== null && d < 0 && c.status !== 'completed' })
  const paymentRisk = contracts.filter((c: any) => ['overdue', 'partial', 'pending'].includes(String(c.payment_status || 'pending')))
  const totalValue = contracts.reduce((s: number, c: any) => s + Number(c.contract_value || c.monthly_amount || 0), 0)
  const monthly = contracts.reduce((s: number, c: any) => s + Number(c.monthly_amount || 0), 0)
  const remainingSessions = contracts.reduce((s: number, c: any) => s + Math.max(0, Number(c.total_sessions || 0) - Number(c.sessions_used || 0)), 0)

  return (
    <AppShell
      title="Contracts Command Center"
      subtitle="Control tower contrats: valeur, renouvellement, risque paiement, consommation et priorités manager."
      breadcrumbs={[{ label: 'Contracts', href: '/contracts' }, { label: 'Command Center' }]}
      actions={<><PageAction href="/contracts" variant="light">Contracts</PageAction><PageAction href="/billing/overview" variant="light">Billing Overview</PageAction><PageAction href="/contracts/new">+ Contract</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>🧠 CEO FINANCE CONTROL</div><h1 style={heroTitleStyle}>Contrôler la livraison vendue avant qu’elle devienne risque financier.</h1><p style={heroTextStyle}>Cette vue transforme les contrats en priorités: renouveler, encaisser, consommer, sécuriser.</p></div>
          <div style={bigNumberStyle}><span>Valeur totale</span><strong>{money(totalValue)}</strong><small>{money(monthly)} mensuel potentiel</small></div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Contrats" value={contracts.length} sub="portfolio total" />
          <Kpi label="Actifs" value={active.length} sub="en livraison" />
          <Kpi label="Renouvellement ≤30j" value={expiring.length} sub="à sécuriser" />
          <Kpi label="Renouvellement dépassé" value={overdueRenewals.length} sub="risque churn" />
          <Kpi label="Risque paiement" value={paymentRisk.length} sub="pending/partial/overdue" />
          <Kpi label="Sessions restantes" value={remainingSessions} sub="capacité vendue" />
        </section>

        <section style={gridStyle}>
          <Panel title="Priorités renouvellement" subtitle="Contrats qui demandent une action commerciale ou manager.">
            <List items={[...overdueRenewals, ...expiring].slice(0, 8)} empty="Aucun renouvellement critique." />
          </Panel>
          <Panel title="Risque paiement" subtitle="Contrats à surveiller pour encaissement ou clarification.">
            <List items={paymentRisk.slice(0, 8)} empty="Aucun risque paiement détecté." payment />
          </Panel>
        </section>

        <Panel title="Vue portefeuille complète" subtitle="Contrats triés du plus récent au plus ancien.">
          <div style={tableWrapStyle}><table style={tableStyle}><thead><tr><th style={thStyle}>Contrat</th><th style={thStyle}>Famille</th><th style={thStyle}>Statut</th><th style={thStyle}>Paiement</th><th style={thStyle}>Renouvellement</th><th style={thStyle}>Valeur</th><th style={thStyle}>Action</th></tr></thead><tbody>{contracts.map((c: any) => <tr key={c.id}><td style={tdStyle}><strong>{c.contract_reference || c.package_label || `#${c.id}`}</strong></td><td style={tdStyle}>{c.families?.family_name || c.families?.parent_name || '—'}</td><td style={tdStyle}>{c.status || 'draft'}</td><td style={tdStyle}>{c.payment_status || 'pending'}</td><td style={tdStyle}>{date(c.renewal_date || c.end_date)}</td><td style={tdStyle}>{money(c.contract_value || c.monthly_amount)}</td><td style={tdStyle}><Link href={`/contracts/${c.id}`} style={miniLinkStyle}>Ouvrir</Link></td></tr>)}</tbody></table></div>
        </Panel>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: any; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section style={panelStyle}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p><div style={{ marginTop: 16 }}>{children}</div></section> }
function List({ items, empty, payment = false }: { items: any[]; empty: string; payment?: boolean }) { if (!items.length) return <div style={emptyStyle}>{empty}</div>; return <div style={{ display:'grid', gap:10 }}>{items.map((c) => <Link key={c.id} href={`/contracts/${c.id}`} style={listItemStyle}><div><strong>{c.contract_reference || c.package_label || `Contrat #${c.id}`}</strong><span>{c.families?.family_name || c.families?.parent_name || 'Famille non définie'}</span></div><div><small>{payment ? c.payment_status || 'pending' : date(c.renewal_date || c.end_date)}</small></div></Link>)}</div> }

const pageStyle: React.CSSProperties = { display:'grid', gap:20 }
const heroStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, padding:32, borderRadius:34, background:'linear-gradient(135deg,#020617,#1e3a8a 70%)', color:'#fff', boxShadow:'0 34px 90px rgba(15,23,42,.28)' }
const badgeStyle: React.CSSProperties = { display:'inline-flex', padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,.12)', color:'#dbeafe', fontWeight:950, fontSize:12, marginBottom:12 }
const heroTitleStyle: React.CSSProperties = { margin:0, fontSize:38, fontWeight:950, maxWidth:820, letterSpacing:-.8 }
const heroTextStyle: React.CSSProperties = { color:'#dbeafe', fontWeight:760, maxWidth:760, lineHeight:1.6 }
const bigNumberStyle: React.CSSProperties = { minWidth:300, padding:22, borderRadius:26, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)', display:'grid', gap:8 }
const kpiGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpiStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:22, padding:18, display:'grid', gap:7, boxShadow:'0 18px 38px rgba(15,23,42,.05)', color:'#0f172a' }
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }
const panelStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:26, padding:22, boxShadow:'0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:24, fontWeight:950 }
const sectionTextStyle: React.CSSProperties = { margin:'8px 0 0', color:'#64748b', fontWeight:700 }
const listItemStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, padding:14, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0', textDecoration:'none', color:'#0f172a' }
const emptyStyle: React.CSSProperties = { padding:18, borderRadius:18, background:'#f8fafc', border:'1px dashed #cbd5e1', color:'#64748b', fontWeight:800 }
const tableWrapStyle: React.CSSProperties = { overflowX:'auto', borderRadius:18, border:'1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width:'100%', borderCollapse:'collapse', background:'#fff' }
const thStyle: React.CSSProperties = { textAlign:'left', padding:14, background:'#0f172a', color:'#fff' }
const tdStyle: React.CSSProperties = { padding:14, borderBottom:'1px solid #e2e8f0', color:'#334155' }
const miniLinkStyle: React.CSSProperties = { color:'#1d4ed8', fontWeight:900, textDecoration:'none' }
