import Link from 'next/link'
import { getAcademyDocumentByToken, logDocumentVerification } from '@/lib/academy/document-repository'

export const dynamic = 'force-dynamic'

export default async function VerifyDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const document = await getAcademyDocumentByToken(token)
  await logDocumentVerification(token, document?.id, document ? 'valid_view' : 'not_found')

  if (!document) {
    return <main style={wrap}><section style={card}><h1>Document introuvable</h1><p>Ce QR code ne correspond à aucun document Academy valide.</p><Link href="/">Retour</Link></section></main>
  }

  const valid = document.status === 'valid'
  return <main style={wrap}><section style={card}>
    <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'start'}}>
      <div><p style={eyebrow}>ANGELCARE ACADEMY VERIFICATION</p><h1>{valid ? 'Document authentique' : 'Document non valide'}</h1><p style={{color:'#64748b',fontWeight:800}}>Vérification live connectée à Academy OS.</p></div>
      <span style={{...badge, background: valid ? '#dcfce7' : '#fee2e2', color: valid ? '#15803d' : '#b91c1c'}}>{document.status}</span>
    </div>
    <div style={grid}>
      <Info label="N° Document" value={document.document_number}/>
      <Info label="Type" value={document.document_type}/>
      <Info label="Montant" value={`${Number(document.amount || 0).toLocaleString('fr-FR')} ${document.currency || 'MAD'}`}/>
      <Info label="Date génération" value={new Date(document.generated_at).toLocaleString('fr-FR')}/>
    </div>
    {document.qr_data_url ? <img src={document.qr_data_url} alt="QR Code" style={{width:150,height:150,marginTop:20}}/> : null}
  </section></main>
}
function Info({ label, value }: { label: string; value: string }) { return <div style={info}><small>{label}</small><b>{value}</b></div> }
const wrap: React.CSSProperties = { minHeight:'100vh', background:'#f8fafc', display:'grid', placeItems:'center', padding:24, fontFamily:'Inter, Arial, sans-serif' }
const card: React.CSSProperties = { width:'min(860px,100%)', background:'#fff', border:'1px solid #e2e8f0', borderRadius:28, padding:34, boxShadow:'0 25px 80px rgba(15,23,42,.08)' }
const eyebrow: React.CSSProperties = { color:'#2563eb', fontWeight:1000, letterSpacing:'.18em', fontSize:12 }
const badge: React.CSSProperties = { borderRadius:999, padding:'10px 16px', fontWeight:1000, textTransform:'uppercase' }
const grid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14, marginTop:24 }
const info: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:18, padding:16, display:'grid', gap:8 }
