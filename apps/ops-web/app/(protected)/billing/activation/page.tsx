import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export default async function BillingActivationPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  await requireRole(['ceo', 'manager'])
  const filters = await searchParams
  const status = filters?.status || 'all'
  const supabase = await createClient()

  let invoiceQuery = supabase.from('billing_invoices').select('*').order('created_at', { ascending: false }).limit(80)
  if (status !== 'all') invoiceQuery = invoiceQuery.eq('status', status)

  const [{ data: invoices }, { data: contracts }, { data: events }] = await Promise.all([
    invoiceQuery,
    supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(40),
    supabase.from('contract_finance_events').select('*').order('created_at', { ascending: false }).limit(12),
  ])

  const rows = invoices || []
  const contractRows = contracts || []
  const totalInvoiced = rows.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
  const totalPaid = rows.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0)
  const pending = rows.filter((i: any) => i.status === 'pending').length
  const overdue = rows.filter((i: any) => i.status === 'overdue' || (i.due_date && new Date(i.due_date) < new Date() && i.status !== 'paid')).length
  const openAmount = totalInvoiced - totalPaid
  const activeContracts = contractRows.filter((c: any) => ['active', 'signed', 'confirmed'].includes(String(c.status || '').toLowerCase())).length

  return (
    <AppShell
      title="Billing Activation Command"
      subtitle="Finance operating cockpit: invoices, collections, overdue risk and contract revenue activation."
      breadcrumbs={[{ label: 'Billing', href: '/billing' }, { label: 'Activation' }]}
      actions={<><PageAction href="/billing" variant="light">Billing</PageAction><PageAction href="/contracts" variant="light">Contracts</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>💎 FINANCE CONTROL TOWER</div><h1 style={heroTitleStyle}>{formatMoney(openAmount)}</h1><p style={heroSubStyle}>Open amount to collect across visible invoices</p></div>
          <div style={heroGridStyle}><Mini label="Invoiced" value={formatMoney(totalInvoiced)} /><Mini label="Collected" value={formatMoney(totalPaid)} /><Mini label="Active contracts" value={String(activeContracts)} /></div>
        </section>

        <form style={filterStyle}>
          <strong>Finance filters</strong>
          <select name="status" defaultValue={status} style={inputStyle}>
            <option value="all">All invoices</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button style={buttonStyle}>Apply</button>
        </form>

        <section style={kpiGridStyle}>
          <Kpi title="Invoices" value={String(rows.length)} sub="visible rows" />
          <Kpi title="Pending" value={String(pending)} sub="to collect" />
          <Kpi title="Overdue" value={String(overdue)} sub="risk alert" />
          <Kpi title="Open amount" value={formatMoney(openAmount)} sub="collection target" />
          <Kpi title="Collected" value={formatMoney(totalPaid)} sub="cash received" />
          <Kpi title="Contracts" value={String(contractRows.length)} sub="loaded scope" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Invoice control room" subtitle="Operational billing table for daily finance follow-up." />
            <div style={tableWrapStyle}><table style={tableStyle}><thead><tr><th style={thStyle}>Ref</th><th style={thStyle}>Contract</th><th style={thStyle}>Amount</th><th style={thStyle}>Paid</th><th style={thStyle}>Status</th><th style={thStyle}>Due</th></tr></thead><tbody>{rows.map((i: any) => <tr key={i.id}><td style={tdStyle}>{i.invoice_reference || `#${i.id}`}</td><td style={tdStyle}>{i.contract_id || '—'}</td><td style={tdStyle}>{formatMoney(i.amount)}</td><td style={tdStyle}>{formatMoney(i.amount_paid)}</td><td style={tdStyle}><span style={pillStyle(i.status)}>{i.status}</span></td><td style={tdStyle}>{i.due_date || '—'}</td></tr>)}</tbody></table></div>
          </div>
          <aside style={panelStyle}>
            <Header title="Finance activity feed" subtitle="Latest generated finance events." />
            {(events || []).map((e: any) => <div key={e.id} style={eventStyle}><strong>{e.event_type}</strong><span>{formatMoney(e.amount)} • Contract #{e.contract_id || '—'}</span><small>{e.note || new Date(e.created_at).toLocaleString('fr-FR')}</small></div>)}
          </aside>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ title, value, sub }: { title: string; value: string; sub: string }) { return <div style={kpiStyle}><span>{title}</span><strong>{value}</strong><small>{sub}</small></div> }
function Mini({ label, value }: { label: string; value: string }) { return <div style={miniStyle}><span>{label}</span><strong>{value}</strong></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function formatMoney(v: any) { return `${Number(v || 0).toLocaleString('fr-FR')} MAD` }
function pillStyle(s: string): React.CSSProperties { const c = s === 'paid' ? '#16a34a' : s === 'overdue' ? '#dc2626' : '#f59e0b'; return { padding: '6px 10px', borderRadius: 999, background: `${c}22`, color: c, fontWeight: 950, fontSize: 12 } }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 30, borderRadius: 32, background: 'radial-gradient(circle at top left,#1d4ed8,#020617 60%)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.25)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', fontWeight: 950, fontSize: 12, color: '#bfdbfe' }
const heroTitleStyle: React.CSSProperties = { margin: '12px 0 5px', fontSize: 42, fontWeight: 1000 }
const heroSubStyle: React.CSSProperties = { margin: 0, color: '#dbeafe', fontWeight: 800 }
const heroGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }
const miniStyle: React.CSSProperties = { display: 'grid', gap: 5, minWidth: 160, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.14)' }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 220px auto', gap: 14, alignItems: 'center', padding: 18, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee' }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .6fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const tdStyle: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
const eventStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, color: '#0f172a' }
