
import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, StatusPill } from '@/app/components/erp/ERPPrimitives'

const templates = [
  ['Client Contract','Contrat client avec conditions, package, service details et signature.'],
  ['Mission Order','Ordre de mission pour caregiver avec horaires, lieu, famille et consignes.'],
  ['Caregiver Assignment Sheet','Fiche affectation intervenante avec contact, service et checklist.'],
  ['Daily Planning Sheet','Planning journalier operations imprimable.'],
  ['Incident Report','Rapport incident avec sévérité, actions et signatures.'],
  ['Quotation / Devis','Devis commercial brandé AngelCare.'],
  ['Invoice-ready Summary','Résumé facturation prêt pour facture.'],
  ['Family Profile Sheet','Fiche famille CRM imprimable.'],
  ['Caregiver Profile Sheet','Fiche caregiver avec compétences et historique.'],
  ['Monthly Service Report','Rapport mensuel de service / package.'],
  ['Pointage Report','Rapport présence, check-in, check-out.'],
  ['Training Certificate','Attestation / certificat AngelCare Academy.'],
  ['Service Proposal PDF','Proposition service premium pour famille ou institution.'],
]

export default function PrintCenterPage() {
  return <AppShell title="Print & Document Template Center" subtitle="Corporate-ready printable templates with AngelCare branding, reference numbers, service details and signature areas." breadcrumbs={[{label:'Print Center'}]}><ERPPanel title="Pre-installed Templates" subtitle="Print now. PDF export can be connected later."><div style={gridStyle}>{templates.map((t, i) => <div key={t[0]} style={templateCardStyle}><div style={topStyle}><StatusPill tone="blue">REF AC-{String(i+1).padStart(3,'0')}</StatusPill><button type="button" onClick={undefined} style={printButtonStyle}>Print</button></div><h3 style={titleStyle}>{t[0]}</h3><p style={textStyle}>{t[1]}</p><div style={templatePreviewStyle}><div style={brandLineStyle}>AngelCare</div><div style={docLineStyle} /><div style={docLineShortStyle} /><div style={signatureStyle}>Signature / Cachet</div></div></div>)}</div></ERPPanel><style>{`@media print { aside, header, button { display:none !important; } main { padding:0 !important; } }`}</style></AppShell>
}
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14 }
const templateCardStyle: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:20, background:'#fff', padding:18, boxShadow:'0 12px 28px rgba(15,23,42,.04)' }
const topStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom:12 }
const printButtonStyle: React.CSSProperties = { border:'1px solid #cbd5e1', background:'#f8fafc', borderRadius:12, padding:'8px 10px', fontWeight:900, cursor:'pointer' }
const titleStyle: React.CSSProperties = { color:'#0f172a', margin:'0 0 8px', fontSize:18, fontWeight:950 }
const textStyle: React.CSSProperties = { color:'#64748b', lineHeight:1.55, fontWeight:650, fontSize:13 }
const templatePreviewStyle: React.CSSProperties = { marginTop:14, border:'1px solid #e2e8f0', borderRadius:16, background:'#f8fafc', padding:14 }
const brandLineStyle: React.CSSProperties = { color:'#0f172a', fontWeight:950, borderBottom:'1px solid #cbd5e1', paddingBottom:8, marginBottom:10 }
const docLineStyle: React.CSSProperties = { height:10, borderRadius:999, background:'#e2e8f0', marginBottom:8 }
const docLineShortStyle: React.CSSProperties = { height:10, width:'62%', borderRadius:999, background:'#e2e8f0', marginBottom:18 }
const signatureStyle: React.CSSProperties = { border:'1px dashed #94a3b8', borderRadius:12, padding:12, color:'#64748b', fontSize:12, fontWeight:800 }
