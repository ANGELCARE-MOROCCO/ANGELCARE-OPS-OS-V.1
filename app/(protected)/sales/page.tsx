
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'

const stages = ['New Lead', 'Qualified', 'Discovery Call', 'Proposal Sent', 'Follow-up', 'Won', 'Lost']
const clientTypes = ['B2C Families', 'B2B Schools', 'Nurseries', 'Institutions', 'Academy Learners']

export default async function SalesPage() {
  const supabase = await createClient()
  const [leadsRes, familiesRes, contractsRes] = await Promise.all([
    supabase.from('leads').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('families').select('*').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('contracts').select('*').eq('is_archived', false).order('id', { ascending: false }),
  ])
  const leads = leadsRes.data || []
  const families = familiesRes.data || []
  const contracts = contractsRes.data || []
  const pending = leads.filter((l:any) => ['new','pending','follow_up'].includes(String(l.status || '').toLowerCase()))
  const won = contracts.filter((c:any) => ['active','completed'].includes(String(c.status || '').toLowerCase()))

  return (
    <AppShell title="Advanced Sales System" subtitle="Pipeline, client segmentation, quotations, proposals, WhatsApp scripts, renewal and multi-city sales visibility." breadcrumbs={[{ label:'Sales CRM' }]} actions={<><PageAction href="/leads/new">+ Lead</PageAction><PageAction href="/families/new" variant="light">+ Family</PageAction><PageAction href="/print" variant="light">Print quote</PageAction></>}>
      <section style={metricGridStyle}>
        <MetricCard label="Active leads" value={leads.length} sub={`${pending.length} pending follow-up`} icon="📈" accent="#7c3aed" />
        <MetricCard label="Families CRM" value={families.length} sub="B2C base" icon="🏡" accent="#0f766e" />
        <MetricCard label="Won contracts" value={won.length} sub="converted opportunities" icon="🏆" accent="#166534" />
        <MetricCard label="Client types" value={clientTypes.length} sub="B2C / B2B / Academy" icon="🎯" accent="#1d4ed8" />
      </section>

      <ERPPanel title="Pipeline Board" subtitle="A ClickUp-style sales board adapted to AngelCare conversion operations.">
        <div style={boardStyle}>
          {stages.map((stage, index) => (
            <div key={stage} style={columnStyle}>
              <div style={columnHeadStyle}><span>{stage}</span><StatusPill tone={index < 2 ? 'blue' : index === 5 ? 'green' : index === 6 ? 'red' : 'amber'}>{index === 0 ? leads.length : index === 5 ? won.length : 'Ready'}</StatusPill></div>
              <div style={{ display:'grid', gap:10 }}>
                {(index === 0 ? leads.slice(0,5) : []).map((lead:any) => <div key={lead.id} style={cardStyle}><strong>{lead.full_name || lead.parent_name || lead.name || `Lead #${lead.id}`}</strong><span>{lead.phone || lead.city || 'No contact details'}</span></div>)}
                {index !== 0 ? <div style={emptyCardStyle}>Use this stage for {stage.toLowerCase()} tracking.</div> : null}
              </div>
            </div>
          ))}
        </div>
      </ERPPanel>

      <div style={twoColStyle}>
        <ERPPanel title="Client Type Segmentation" subtitle="Prepare AngelCare for B2C families, B2B schools, nurseries and institutions.">
          <div style={segGridStyle}>{clientTypes.map((t) => <div key={t} style={segCardStyle}>{t}<small> dedicated offers, notes, pricing and follow-up logic</small></div>)}</div>
        </ERPPanel>
        <ERPPanel title="Premium Sales Tools" subtitle="Built-in sales assets for daily conversion.">
          <div style={{ display:'grid', gap:10 }}>
            {['Quotation / devis builder', 'Service proposal PDF', 'Package offers', 'WhatsApp-ready scripts', 'Call notes', 'Lost reason analysis', 'Campaign source tracking', 'Renewal pipeline'].map((x) => <div key={x} style={toolRowStyle}>{x}</div>)}
          </div>
        </ERPPanel>
      </div>

      <ERPPanel title="WhatsApp-ready Scripts" subtitle="Fast operational scripts for Moroccan parent conversion.">
        <div style={scriptGridStyle}>
          <pre style={scriptStyle}>Bonjour, ici AngelCare. Nous pouvons vous proposer une intervenante adaptée selon l'âge de l'enfant, la ville, le besoin et la durée souhaitée. Souhaitez-vous une garde ponctuelle ou un package mensuel ?</pre>
          <pre style={scriptStyle}>Merci pour votre demande. Pour vous orienter correctement, j'ai besoin de confirmer: ville, âge de l'enfant, date, horaire, type de service, et préférence caregiver si existante.</pre>
        </div>
      </ERPPanel>
    </AppShell>
  )
}
const metricGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:14, marginBottom:18 }
const boardStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(7,minmax(220px,1fr))', gap:12, overflowX:'auto', paddingBottom:4 }
const columnStyle: React.CSSProperties = { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:18, padding:12, minHeight:260 }
const columnHeadStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, color:'#0f172a', fontWeight:950, marginBottom:12 }
const cardStyle: React.CSSProperties = { display:'grid', gap:6, background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:12, color:'#0f172a' }
const emptyCardStyle: React.CSSProperties = { background:'#fff', border:'1px dashed #cbd5e1', borderRadius:14, padding:12, color:'#64748b', fontWeight:700, fontSize:13 }
const twoColStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginTop:18, marginBottom:18 }
const segGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 }
const segCardStyle: React.CSSProperties = { display:'grid', gap:8, padding:16, border:'1px solid #e2e8f0', borderRadius:18, background:'#fff', color:'#0f172a', fontWeight:950 }
const toolRowStyle: React.CSSProperties = { padding:13, borderRadius:14, border:'1px solid #e2e8f0', background:'#fff', color:'#0f172a', fontWeight:850 }
const scriptGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }
const scriptStyle: React.CSSProperties = { whiteSpace:'pre-wrap', margin:0, padding:16, borderRadius:18, background:'#0f172a', color:'#e2e8f0', fontWeight:650, lineHeight:1.7 }
