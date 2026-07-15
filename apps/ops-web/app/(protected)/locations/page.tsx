
import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'

const cities = ['Casablanca','Rabat','Kénitra','Témara','Salé','Future City']
const clientTypes = ['B2C Families','B2B Schools','Nurseries','Institutions','Academy Learners','Caregivers']

export default function LocationsPage() {
  return <AppShell title="Multi-location / Multi-service Architecture" subtitle="Cities, zones, branches, service lines, client types and scalable operating structure." breadcrumbs={[{label:'Locations'}]}><section style={gridStyle}><MetricCard label="Cities" value={cities.length} sub="current + future" icon="📍"/><MetricCard label="Client types" value={clientTypes.length} sub="segmentation ready" icon="🎯"/><MetricCard label="Branches" value="Multi" sub="branch-level logic" icon="🏢"/></section><ERPPanel title="Supported city architecture"><div style={cardGridStyle}>{cities.map(c=><div key={c} style={cardStyle}><h3>{c}</h3><StatusPill tone="blue">zones</StatusPill><StatusPill tone="green">services</StatusPill><StatusPill tone="purple">teams</StatusPill></div>)}</div></ERPPanel><ERPPanel title="Client & workforce types"><div style={cardGridStyle}>{clientTypes.map(c=><div key={c} style={miniStyle}>{c}</div>)}</div></ERPPanel></AppShell>
}
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14, marginBottom:18 }
const cardGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14 }
const cardStyle: React.CSSProperties = { display:'flex', flexWrap:'wrap', gap:8, padding:18, borderRadius:20, border:'1px solid #e2e8f0', background:'#fff' }
const miniStyle: React.CSSProperties = { padding:16, borderRadius:18, border:'1px solid #e2e8f0', background:'#fff', color:'#0f172a', fontWeight:950 }
