import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

async function createInvoice(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const amount = Number(formData.get('amount') || 0)
  const label = String(formData.get('invoice_label') || 'Facture contrat')
  const dueDate = String(formData.get('due_date') || '') || null
  const notes = String(formData.get('notes') || '') || null

  const { error } = await supabase.from('billing_invoices').insert([{ contract_id: contractId, amount, invoice_label: label, due_date: dueDate, notes, status: 'pending', invoice_reference: `AC-${Date.now()}` }])
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'invoice_created', amount, note: label }])
  redirect(`/contracts/${contractId}/activation`)
}

async function markInvoicePaid(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const invoiceId = Number(formData.get('invoice_id'))
  const amountPaid = Number(formData.get('amount_paid') || 0)

  const { error } = await supabase.from('billing_invoices').update({ status: 'paid', amount_paid: amountPaid, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', invoiceId)
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'payment_received', amount: amountPaid, note: `Invoice #${invoiceId} marked paid` }])
  redirect(`/contracts/${contractId}/activation`)
}

async function logConsumption(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const amountValue = Number(formData.get('amount_value') || 0)
  const unitsUsed = Number(formData.get('units_used') || 1)
  const notes = String(formData.get('notes') || '') || null

  const { error } = await supabase.from('contract_consumption_logs').insert([{ contract_id: contractId, amount_value: amountValue, units_used: unitsUsed, notes }])
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'contract_consumption', amount: amountValue, note: notes || 'Manual consumption log' }])
  redirect(`/contracts/${contractId}/activation`)
}

export default async function ContractActivationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager'])
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle()
  if (!contract) notFound()

  const [{ data: invoices }, { data: events }, { data: consumption }] = await Promise.all([
    supabase.from('billing_invoices').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
    supabase.from('contract_finance_events').select('*').eq('contract_id', id).order('created_at', { ascending: false }).limit(12),
    supabase.from('contract_consumption_logs').select('*').eq('contract_id', id).order('created_at', { ascending: false }).limit(12),
  ])

  const invoiceRows = invoices || []
  const totalInvoiced = invoiceRows.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
  const totalPaid = invoiceRows.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0)
  const openAmount = totalInvoiced - totalPaid
  const overdue = invoiceRows.filter((i: any) => i.status === 'overdue' || (i.due_date && new Date(i.due_date) < new Date() && i.status !== 'paid')).length
  const contractValue = Number(contract.contract_value || contract.value || 0)
  const consumed = (consumption || []).reduce((s: number, c: any) => s + Number(c.amount_value || 0), 0)

  return (
    <AppShell
      title="Contract Billing Activation"
      subtitle={`Finance control cockpit • Contract #${contract.id}`}
      breadcrumbs={[{ label: 'Contracts', href: '/contracts' }, { label: `Contract #${contract.id}`, href: `/contracts/${contract.id}` }, { label: 'Activation' }]}
      actions={<><PageAction href={`/contracts/${contract.id}`} variant="light">Retour contrat</PageAction><PageAction href="/billing/activation" variant="light">Billing Control</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>💰 FINANCE ACTIVATION</div><h1 style={heroTitleStyle}>Contract #{contract.id}</h1><p style={heroSubStyle}>Billing cycle: {contract.billing_cycle || 'one_time'} • Risk: {contract.risk_level || 'normal'}</p></div>
          <div style={heroPanelStyle}><strong>{formatMoney(openAmount)}</strong><span>Open amount</span></div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi title="Contract value" value={formatMoney(contractValue)} sub="contract base" />
          <Kpi title="Invoiced" value={formatMoney(totalInvoiced)} sub="total issued" />
          <Kpi title="Collected" value={formatMoney(totalPaid)} sub="paid amount" />
          <Kpi title="Open" value={formatMoney(openAmount)} sub="still to collect" />
          <Kpi title="Overdue" value={String(overdue)} sub="risk invoices" />
          <Kpi title="Consumed" value={formatMoney(consumed)} sub="manual logs" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Create invoice" subtitle="Generate a contract invoice without leaving the finance cockpit." />
            <form action={createInvoice} style={formGridStyle}>
              <input type="hidden" name="contract_id" value={contract.id} />
              <Field name="invoice_label" label="Invoice label" defaultValue="Facture contrat AngelCare" />
              <Field name="amount" label="Amount MAD" type="number" defaultValue={String(contract.monthly_amount || contract.contract_value || 0)} />
              <Field name="due_date" label="Due date" type="date" />
              <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}><span>Notes</span><textarea name="notes" style={textAreaStyle} /></label>
              <button style={primaryButtonStyle}>Create invoice</button>
            </form>
          </div>

          <div style={panelStyle}>
            <Header title="Consumption log" subtitle="Track mission or service consumption against the contract." />
            <form action={logConsumption} style={formGridStyle}>
              <input type="hidden" name="contract_id" value={contract.id} />
              <Field name="units_used" label="Units used" type="number" defaultValue="1" />
              <Field name="amount_value" label="Value MAD" type="number" defaultValue="0" />
              <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}><span>Notes</span><textarea name="notes" style={textAreaStyle} /></label>
              <button style={primaryButtonStyle}>Log consumption</button>
            </form>
          </div>
        </section>

        <section style={panelStyle}>
          <Header title="Invoices control table" subtitle="Pay, monitor, and audit contract invoices." />
          <div style={tableWrapStyle}><table style={tableStyle}><thead><tr><th style={thStyle}>Ref</th><th style={thStyle}>Label</th><th style={thStyle}>Amount</th><th style={thStyle}>Paid</th><th style={thStyle}>Status</th><th style={thStyle}>Due</th><th style={thStyle}>Action</th></tr></thead><tbody>{invoiceRows.map((i: any) => <tr key={i.id}><td style={tdStyle}>{i.invoice_reference || `#${i.id}`}</td><td style={tdStyle}>{i.invoice_label || '—'}</td><td style={tdStyle}>{formatMoney(i.amount)}</td><td style={tdStyle}>{formatMoney(i.amount_paid)}</td><td style={tdStyle}><span style={pillStyle(i.status)}>{i.status}</span></td><td style={tdStyle}>{i.due_date || '—'}</td><td style={tdStyle}>{i.status !== 'paid' ? <form action={markInvoicePaid}><input type="hidden" name="contract_id" value={contract.id} /><input type="hidden" name="invoice_id" value={i.id} /><input type="hidden" name="amount_paid" value={i.amount} /><button style={miniButtonStyle}>Mark paid</button></form> : '✅'}</td></tr>)}</tbody></table></div>
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}><Header title="Finance events" subtitle="Latest finance timeline." />{(events || []).map((e: any) => <div key={e.id} style={eventStyle}><strong>{e.event_type}</strong><span>{formatMoney(e.amount)} • {formatDate(e.created_at)}</span><small>{e.note}</small></div>)}</div>
          <div style={panelStyle}><Header title="Consumption history" subtitle="Recent service consumption." />{(consumption || []).map((c: any) => <div key={c.id} style={eventStyle}><strong>{c.action_type}</strong><span>{c.units_used} units • {formatMoney(c.amount_value)}</span><small>{c.notes || formatDate(c.created_at)}</small></div>)}</div>
        </section>
      </div>
    </AppShell>
  )
}

function Field({ name, label, type = 'text', defaultValue = '' }: { name: string; label: string; type?: string; defaultValue?: string }) { return <label style={fieldStyle}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} style={inputStyle} /></label> }
function Kpi({ title, value, sub }: { title: string; value: string; sub: string }) { return <div style={kpiStyle}><span>{title}</span><strong>{value}</strong><small>{sub}</small></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function formatMoney(v: any) { return `${Number(v || 0).toLocaleString('fr-FR')} MAD` }
function formatDate(d: string) { return new Date(d).toLocaleString('fr-FR', { hour12: false }) }
function pillStyle(s: string): React.CSSProperties { const c = s === 'paid' ? '#16a34a' : s === 'overdue' ? '#dc2626' : '#f59e0b'; return { padding: '6px 10px', borderRadius: 999, background: `${c}22`, color: c, fontWeight: 950, fontSize: 12 } }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 30, borderRadius: 32, background: 'linear-gradient(135deg,#020617,#1e3a8a)', color: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.25)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', fontWeight: 950, fontSize: 12, color: '#bfdbfe' }
const heroTitleStyle: React.CSSProperties = { margin: '12px 0 5px', fontSize: 36, fontWeight: 1000 }
const heroSubStyle: React.CSSProperties = { margin: 0, color: '#dbeafe', fontWeight: 800 }
const heroPanelStyle: React.CSSProperties = { display: 'grid', gap: 5, minWidth: 230, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const textAreaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80 }
const primaryButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const miniButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const tdStyle: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
const eventStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, color: '#0f172a' }
