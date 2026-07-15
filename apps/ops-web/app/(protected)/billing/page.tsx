import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function money(value: any) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0)) }
function date(value: any) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : '—' }
function isOverdue(row: any) { return row.due_date && new Date(row.due_date) < new Date() && !['paid', 'cancelled'].includes(String(row.status || '').toLowerCase()) }

export default async function BillingPage() {
  const supabase = await createClient()
  const [contractsRes, invoicesRes] = await Promise.all([
    supabase.from('contracts').select('*, families:family_id (family_name, parent_name)').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('billing_invoices').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
  ])
  const contracts = contractsRes.data || []
  const invoices = invoicesRes.data || []
  const totalContractValue = contracts.reduce((s: number, c: any) => s + Number(c.contract_value || c.monthly_amount || 0), 0)
  const invoiceAmount = invoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
  const paidAmount = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0)
  const unpaid = Math.max(0, invoiceAmount - paidAmount)
  const overdue = invoices.filter(isOverdue)
  const pendingContracts = contracts.filter((c: any) => ['pending', 'partial', 'overdue'].includes(String(c.payment_status || 'pending')))

  return (
    <AppShell
      title="Billing Center"
      subtitle="Finance-ready billing cockpit: contrats, factures, encaissements, impayés et alertes."
      breadcrumbs={[{ label: 'Contracts & Billing' }, { label: 'Billing Center' }]}
      actions={<><PageAction href="/billing/overview" variant="light">Finance Overview</PageAction><PageAction href="/contracts/command-center" variant="light">Contracts Command</PageAction><PageAction href="/contracts/new">+ Contract</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>🧾 Billing Intelligence</div><h1 style={heroTitleStyle}>Transformer la livraison en encaissement contrôlé.</h1><p style={heroTextStyle}>Cette vue consolide les contrats, factures et risques de paiement pour piloter les revenus sans friction.</p></div>
          <div style={heroStatStyle}><span>Unpaid / à sécuriser</span><strong>{money(unpaid)}</strong><small>{overdue.length} factures overdue</small></div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Contrats" value={contracts.length} sub="portfolio" />
          <Kpi label="Valeur contrats" value={money(totalContractValue)} sub="valeur contractuelle" />
          <Kpi label="Facturé" value={money(invoiceAmount)} sub="invoices total" />
          <Kpi label="Payé" value={money(paidAmount)} sub="encaissement" />
          <Kpi label="Impayé" value={money(unpaid)} sub="reste à encaisser" />
          <Kpi label="Overdue" value={overdue.length} sub="priorité finance" />
        </section>

        <section style={gridStyle}>
          <Panel title="Factures récentes" subtitle="Derniers documents de facturation enregistrés.">
            {invoices.length ? <div style={{ display:'grid', gap:10 }}>{invoices.slice(0, 10).map((i: any) => <div key={i.id} style={rowStyle}><div><strong>{i.invoice_reference || i.invoice_label || `Invoice #${i.id}`}</strong><span>{money(i.amount)} • paid {money(i.amount_paid)}</span></div><div><b>{isOverdue(i) ? 'overdue' : i.status}</b><small>{date(i.due_date)}</small></div></div>)}</div> : <Empty text="Aucune facture enregistrée. Les contrats peuvent déjà être suivis côté billing." />}
          </Panel>

          <Panel title="Contrats à encaisser" subtitle="Contrats avec payment_status pending / partial / overdue.">
            {pendingContracts.length ? <div style={{ display:'grid', gap:10 }}>{pendingContracts.slice(0, 10).map((c: any) => <Link key={c.id} href={`/contracts/${c.id}`} style={linkRowStyle}><div><strong>{c.contract_reference || c.package_label || `Contract #${c.id}`}</strong><span>{c.families?.family_name || c.families?.parent_name || 'Famille non définie'}</span></div><div><b>{c.payment_status || 'pending'}</b><small>{money(c.contract_value || c.monthly_amount)}</small></div></Link>)}</div> : <Empty text="Aucun contrat à risque paiement." />}
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: any; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section style={panelStyle}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p><div style={{ marginTop:16 }}>{children}</div></section> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }

const pageStyle: React.CSSProperties = { display:'grid', gap:20 }
const heroStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, padding:32, borderRadius:34, background:'linear-gradient(135deg,#064e3b,#020617 70%)', color:'#fff', boxShadow:'0 34px 90px rgba(15,23,42,.28)' }
const badgeStyle: React.CSSProperties = { display:'inline-flex', padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,.12)', color:'#dcfce7', fontWeight:950, fontSize:12, marginBottom:12 }
const heroTitleStyle: React.CSSProperties = { margin:0, fontSize:38, fontWeight:950, maxWidth:820, letterSpacing:-.8 }
const heroTextStyle: React.CSSProperties = { color:'#d1fae5', fontWeight:760, maxWidth:760, lineHeight:1.6 }
const heroStatStyle: React.CSSProperties = { minWidth:300, padding:22, borderRadius:26, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)', display:'grid', gap:8 }
const kpiGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpiStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:22, padding:18, display:'grid', gap:7, boxShadow:'0 18px 38px rgba(15,23,42,.05)', color:'#0f172a' }
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }
const panelStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:26, padding:22, boxShadow:'0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:24, fontWeight:950 }
const sectionTextStyle: React.CSSProperties = { margin:'8px 0 0', color:'#64748b', fontWeight:700 }
const rowStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, padding:14, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }
const linkRowStyle: React.CSSProperties = { ...rowStyle, textDecoration:'none' }
const emptyStyle: React.CSSProperties = { padding:18, borderRadius:18, background:'#f8fafc', border:'1px dashed #cbd5e1', color:'#64748b', fontWeight:800 }
