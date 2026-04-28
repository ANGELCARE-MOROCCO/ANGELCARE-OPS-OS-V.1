import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function money(value: any) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0)) }
function date(value: any) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : '—' }
function datetime(value: any) { return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function daysUntil(value: any) { if (!value) return null; const a = new Date(); const b = new Date(value); a.setHours(0,0,0,0); b.setHours(0,0,0,0); return Math.ceil((b.getTime()-a.getTime())/86400000) }

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contractId = Number(id)
  const supabase = await createClient()

  const [contractRes, missionsRes, rowsRes, invoicesRes, eventsRes] = await Promise.all([
    supabase.from('contracts').select(`*, families:family_id (family_name, parent_name, city, phone), caregivers:preferred_caregiver_id (full_name, phone)`).eq('id', contractId).eq('is_archived', false).maybeSingle(),
    supabase.from('missions').select('*').eq('contract_id', contractId).eq('is_archived', false).order('contract_row_order', { ascending: true }),
    supabase.from('contract_mission_rows').select('*').eq('contract_id', contractId).order('row_order', { ascending: true }),
    supabase.from('billing_invoices').select('*').eq('contract_id', contractId).eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('contract_finance_events').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }).limit(12),
  ])

  if (contractRes.error) return <main style={{ padding: 32 }}>Erreur : {contractRes.error.message}</main>
  const contract = contractRes.data
  if (!contract) notFound()

  const missions = missionsRes.data || []
  const rows = rowsRes.data || []
  const invoices = invoicesRes.data || []
  const events = eventsRes.data || []
  const totalSessions = Number(contract.total_sessions || 0)
  const used = Number(contract.sessions_used || 0)
  const remaining = Math.max(0, totalSessions - used)
  const progress = totalSessions > 0 ? Math.min(100, (used / totalSessions) * 100) : 0
  const invoiceAmount = invoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
  const paidAmount = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0)
  const unpaid = Math.max(0, invoiceAmount - paidAmount)
  const renewalDays = daysUntil(contract.renewal_date || contract.end_date)

  return (
    <AppShell
      title={contract.contract_reference || contract.package_label || `Contrat #${contract.id}`}
      subtitle="Vue complète contrat: famille, service, missions, consommation, facturation et risques."
      breadcrumbs={[{ label: 'Contracts', href: '/contracts' }, { label: contract.contract_reference || `#${contract.id}` }]}
      actions={<><PageAction href="/contracts" variant="light">Retour</PageAction><PageAction href={`/contracts/edit/${contract.id}`} variant="light">Modifier</PageAction><PageAction href={`/contracts/${contract.id}/print`} variant="light">Print</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>📦 CONTRACT CONTROL FILE</div><h1 style={heroTitleStyle}>{contract.contract_reference || contract.package_label || `Contrat #${contract.id}`}</h1><p style={heroTextStyle}>{contract.families?.family_name || contract.families?.parent_name || 'Famille non définie'} • {contract.service_type || 'Service non défini'} • {contract.status || 'draft'}</p></div>
          <div style={heroCardStyle}><span>Reste à encaisser</span><strong>{money(unpaid || Math.max(0, Number(contract.contract_value || 0) - Number(contract.amount_paid || 0)))}</strong><small>{contract.payment_status || 'pending'} • {renewalDays === null ? 'renouvellement non défini' : `${renewalDays}j renouvellement`}</small></div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Valeur" value={money(contract.contract_value || contract.monthly_amount)} sub="contrat" />
          <Kpi label="Payé" value={money(contract.amount_paid || paidAmount)} sub="encaissement" />
          <Kpi label="Sessions" value={`${used}/${totalSessions}`} sub={`${remaining} restantes`} />
          <Kpi label="Missions" value={missions.length} sub="liées au contrat" />
          <Kpi label="Factures" value={invoices.length} sub="billing records" />
          <Kpi label="Risque" value={contract.risk_level || 'normal'} sub="lecture manager" />
        </section>

        <section style={gridStyle}>
          <Panel title="Dossier contrat" subtitle="Informations principales du contrat.">
            <Info label="Famille" value={contract.families?.family_name || contract.families?.parent_name || '—'} />
            <Info label="Ville" value={contract.families?.city || '—'} />
            <Info label="Service" value={contract.service_type || '—'} />
            <Info label="Package" value={contract.package_label || '—'} />
            <Info label="Caregiver préférée" value={contract.caregivers?.full_name || '—'} />
            <Info label="Cycle billing" value={contract.billing_cycle || 'one_time'} />
            <Info label="Début" value={date(contract.start_date)} />
            <Info label="Fin" value={date(contract.end_date)} />
            <Info label="Renouvellement" value={date(contract.renewal_date)} />
          </Panel>

          <Panel title="Consommation & finance" subtitle="Vision manager des sessions et paiements.">
            <div style={progressWrapStyle}><div style={progressLabelStyle}><span>Consommation sessions</span><strong>{Math.round(progress)}%</strong></div><div style={trackStyle}><div style={{ ...fillStyle, width: `${progress}%` }} /></div></div>
            <Info label="Payment status" value={contract.payment_status || 'pending'} />
            <Info label="Next billing" value={date(contract.next_billing_date)} />
            <Info label="Last payment" value={datetime(contract.last_payment_at)} />
            <Info label="Finance notes" value={contract.finance_notes || '—'} />
          </Panel>
        </section>

        <section style={gridStyle}>
          <Panel title="Missions liées" subtitle="Livraison opérationnelle attachée au contrat.">
            {missions.length ? <div style={{ display:'grid', gap:10 }}>{missions.map((m: any) => <Link key={m.id} href={`/missions/${m.id}`} style={rowLinkStyle}><div><strong>{m.mission_code || `Mission #${m.id}`}</strong><span>{m.service_type || 'Service'} • {date(m.mission_date)}</span></div><b>{m.status || 'draft'}</b></Link>)}</div> : <Empty text="Aucune mission liée." />}
          </Panel>

          <Panel title="Factures & événements finance" subtitle="Historique facturation et notes financières.">
            {invoices.length ? <div style={{ display:'grid', gap:10, marginBottom:14 }}>{invoices.map((i: any) => <div key={i.id} style={rowStyle}><div><strong>{i.invoice_reference || i.invoice_label || `Invoice #${i.id}`}</strong><span>{money(i.amount)} • paid {money(i.amount_paid)}</span></div><b>{i.status}</b></div>)}</div> : <Empty text="Aucune facture liée." />}
            {events.length ? <div style={{ display:'grid', gap:8 }}>{events.map((e: any) => <div key={e.id} style={miniEventStyle}><strong>{e.event_type}</strong><span>{money(e.amount)} • {datetime(e.created_at)}</span></div>)}</div> : null}
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: any; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section style={panelStyle}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p><div style={{ marginTop:16 }}>{children}</div></section> }
function Info({ label, value }: { label: string; value: any }) { return <div style={infoStyle}><span>{label}</span><strong>{value}</strong></div> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }

const pageStyle: React.CSSProperties = { display:'grid', gap:20 }
const heroStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, padding:32, borderRadius:34, background:'linear-gradient(135deg,#1e3a8a,#020617 70%)', color:'#fff', boxShadow:'0 34px 90px rgba(15,23,42,.28)' }
const badgeStyle: React.CSSProperties = { display:'inline-flex', padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,.12)', color:'#dbeafe', fontWeight:950, fontSize:12, marginBottom:12 }
const heroTitleStyle: React.CSSProperties = { margin:0, fontSize:38, fontWeight:950, maxWidth:820, letterSpacing:-.8 }
const heroTextStyle: React.CSSProperties = { color:'#dbeafe', fontWeight:760, maxWidth:760, lineHeight:1.6 }
const heroCardStyle: React.CSSProperties = { minWidth:300, padding:22, borderRadius:26, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)', display:'grid', gap:8 }
const kpiGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpiStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:22, padding:18, display:'grid', gap:7, boxShadow:'0 18px 38px rgba(15,23,42,.05)', color:'#0f172a' }
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, alignItems:'start' }
const panelStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:26, padding:22, boxShadow:'0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:24, fontWeight:950 }
const sectionTextStyle: React.CSSProperties = { margin:'8px 0 0', color:'#64748b', fontWeight:700 }
const infoStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:14, padding:'12px 0', borderBottom:'1px solid #e2e8f0', color:'#334155' }
const progressWrapStyle: React.CSSProperties = { marginBottom:14, padding:14, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0' }
const progressLabelStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', marginBottom:8, color:'#334155', fontWeight:900 }
const trackStyle: React.CSSProperties = { height:12, borderRadius:999, background:'#e2e8f0', overflow:'hidden' }
const fillStyle: React.CSSProperties = { height:12, borderRadius:999, background:'linear-gradient(90deg,#2563eb,#0f172a)' }
const rowStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, padding:14, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }
const rowLinkStyle: React.CSSProperties = { ...rowStyle, textDecoration:'none' }
const miniEventStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', padding:10, borderRadius:14, background:'#fff', border:'1px solid #e2e8f0', color:'#334155' }
const emptyStyle: React.CSSProperties = { padding:18, borderRadius:18, background:'#f8fafc', border:'1px dashed #cbd5e1', color:'#64748b', fontWeight:800 }
