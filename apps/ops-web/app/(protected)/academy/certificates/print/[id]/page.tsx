import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function field(source: AnyRow | undefined, key: string, fallback = '') {
  const value = source?.[key]
  const text = String(value ?? '').trim()
  return text || fallback
}
function dateFr(input: unknown) {
  try {
    const date = input ? new Date(String(input)) : new Date()
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return String(input || '')
  }
}
function qrCells(seedText: string) {
  const seed = seedText.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 49 }, (_, index) => ((seed + index * 7 + Math.floor(index / 3)) % 5) < 2)
}

export default async function CertificatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccess('academy.view')
  const { id } = await params
  const supabase = await createClient()
  const { data: certificate } = await supabase.from('academy_certificates').select('*').eq('id', id).maybeSingle()
  const cert = (certificate || {}) as AnyRow
  const content = (cert.content_fields || {}) as AnyRow
  const recipient = (cert.recipient_fields || {}) as AnyRow
  const recipientName = field(recipient, 'recipientName', 'KARIMA JARRAH').toUpperCase()
  const certNo = field(cert, 'certificate_number', field(cert, 'serial_number', `CERT-${String(id).slice(0, 8)}`))
  const verificationUrl = field(cert, 'verification_url', `/verify/${field(cert, 'verification_token', certNo)}`)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const qrDataUrl = field(cert, 'qr_code_data_url', await QRCode.toDataURL(`${siteUrl}${verificationUrl}`, { margin: 1, width: 240 }))
  const cells = qrCells(certNo)

  return <main className="printRoot">
    <section className="a4Certificate">
      <div className="cornerPattern cornerTopLeft" />
      <div className="cornerPattern cornerTopRight" />
      <div className="cornerPattern cornerBottomLeft" />
      <div className="cornerPattern cornerBottomRight" />
      <header className="certHeader"><div className="angelLogo">ANGEL CARE<small>Preschool & Kindergarten</small></div><h1>{field(cert, 'title', 'Attestation de réussite')}</h1><h2>{recipientName}</h2></header>
      <main className="certBodySafe"><section className="frZone"><p className="identity"><b>Carte d'identité nationale C.I.N°:</b><small>*MOROCCAN IDENTIFICATION CARD N°:</small></p><p>pour sa participation et son excellente performance durant la formation professionnel accompli le:</p><ul><li>Spécialité : {field(content, 'specializationFr', "Techniques d'accompagnement et animation de base pour enfants de 06 mois à 06 ans dans différents milieux")}.</li><li>Type de formation: {field(content, 'trainingTypeFr', 'Théorique + Pratique')}.</li><li>Heures totales: {field(content, 'totalHours', '15')} heures.</li></ul><small className="englishLine">SPECIALITY: {field(content, 'specializationEn', 'Early child care techniques and basic early learning methods applied for children')}. TYPE OF TRAINING: {field(content, 'trainingTypeFr', 'Théorique + Pratique')}. TOTAL HOURS: {field(content, 'totalHours', '15')} HOURS.</small></section><section className="centerZone"><strong>*{field(content, 'cin', 'GA207954')}*</strong><strong>*{dateFr(field(content, 'completionDate', cert.issued_at || cert.created_at))}*</strong></section><section className="arZone" dir="rtl"><p>الحاملة للبطاقة الوطنية المغربية رقم:</p><p>لمشاركتها وأدائها الممتاز خلال التدريب المهني المكتمل في:</p><ul><li>التخصص: {field(content, 'specializationAr', 'تقنيات الرعاية الأساسية و التنشيط الخاص بالأطفال من سن 6 أشهر إلى 6 سنوات في بيئات مختلفة')}</li><li>نوع التدريب: {field(content, 'trainingTypeAr', 'نظري + عملي')}</li><li>مجموع الساعات: {field(content, 'totalHours', '15')} ساعة</li></ul></section></main>
      <div className="sealZone"><div className="goldSeal">FORMATION<br/><b>SUCCÈS</b><small>CERTIFICAT ACADEMY</small></div></div>
      <footer className="footerSafe"><section className="signature"><i /><b>{field(content, 'founderName', 'PAMELA P.JACOSALEM')}</b><span>Fondatrice & Experte en petite enfance.</span></section><section className="verificationBlock"><img src={qrDataUrl} alt="QR verification" /> <b>{field(content, 'certificateRefLabel', certNo)}</b><span>QR vérification live</span></section><section className="signature"><i /><b>{field(content, 'directorName', 'AISSAOUI ILYASS')}</b><span>Direction.</span></section></footer>
    </section>
    <style>{css}</style>
  </main>
}

const css = `
@page{size:A4 landscape;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#fff}.printRoot{min-height:100vh;background:#fff;display:grid;place-items:center}.a4Certificate{position:relative;width:297mm;height:210mm;background:#fff;overflow:hidden;border:5px solid #6d4df6;box-shadow:inset 0 0 0 4px #e8c96a;color:#132985;font-family:Georgia,'Times New Roman',serif}.cornerPattern{position:absolute;z-index:1;background-color:#6f83c1;background-image:linear-gradient(135deg,rgba(255,255,255,.28) 25%,transparent 25%),linear-gradient(225deg,rgba(255,255,255,.22) 25%,transparent 25%),linear-gradient(45deg,rgba(15,42,130,.65) 25%,transparent 25%),linear-gradient(315deg,rgba(255,255,255,.18) 25%,transparent 25%);background-size:13mm 13mm;opacity:.98}.cornerTopLeft{left:-35mm;top:-35mm;width:88mm;height:88mm;clip-path:polygon(0 0,100% 0,0 100%)}.cornerTopRight{right:-34mm;top:-34mm;width:88mm;height:88mm;background-color:#f293ca;clip-path:polygon(100% 0,100% 100%,0 0)}.cornerBottomLeft{left:-28mm;bottom:-28mm;width:74mm;height:74mm;background-color:#f293ca;clip-path:polygon(0 0,100% 100%,0 100%)}.cornerBottomRight{right:-28mm;bottom:-28mm;width:74mm;height:74mm;clip-path:polygon(100% 0,100% 100%,0 100%)}.certHeader{position:relative;z-index:2;height:31%;display:grid;grid-template-rows:auto auto auto;place-items:center;padding-top:9mm}.angelLogo{text-align:center;font-family:Inter,Arial,sans-serif;font-size:24pt;line-height:1;color:#17308c;font-weight:1000;letter-spacing:.02em}.angelLogo small{display:block;font-size:10pt;font-weight:850;margin-top:1mm;color:#344055}.certHeader h1{font-family:Impact,'Arial Narrow',sans-serif;font-size:28pt;letter-spacing:.03em;color:#142a84;margin:9mm 0 2mm;text-transform:uppercase}.certHeader h2{font-family:Impact,'Arial Narrow',sans-serif;font-size:48pt;line-height:.95;letter-spacing:.08em;color:#142a84;margin:0;text-transform:uppercase;max-width:78%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.certBodySafe{position:relative;z-index:2;height:36%;display:grid;grid-template-columns:1fr .58fr 1fr;gap:7mm;padding:0 15mm;align-items:start}.frZone,.arZone{height:100%;overflow:hidden}.frZone{font-size:12pt;line-height:1.15}.frZone p{margin:0 0 3mm}.identity b{font-size:14pt}.identity small{display:block;font-size:7pt;font-weight:900;text-transform:uppercase}.frZone ul{margin:0;padding-left:6mm}.frZone li{margin:.8mm 0}.englishLine{display:block;font-size:6.2pt;line-height:1.05;font-weight:900;text-transform:uppercase;margin-top:1.5mm}.centerZone{display:grid;align-content:start;justify-items:center;gap:12mm;padding-top:3mm;font-family:Impact,'Arial Narrow',sans-serif;color:#142a84}.centerZone strong{font-size:26pt;white-space:nowrap}.arZone{font-family:Arial,sans-serif;font-size:16pt;line-height:1.24;text-align:right;font-weight:900;color:#142a84}.arZone p{margin:0 0 3mm}.arZone ul{padding-right:6mm;margin:0}.sealZone{position:absolute;z-index:3;left:50%;bottom:31mm;transform:translateX(-50%);width:31mm;height:31mm;display:grid;place-items:center}.goldSeal{width:30mm;height:30mm;border-radius:50%;background:radial-gradient(circle,#ffe08a 0 37%,#d99f2a 38% 70%,#b97912 71%);display:grid;place-items:center;text-align:center;color:#172033;font:900 8pt Inter,Arial;box-shadow:0 0 0 2mm rgba(224,168,62,.75);line-height:1.1}.goldSeal b{font-size:12pt}.goldSeal small{font-size:5pt}.footerSafe{position:absolute;z-index:4;left:29mm;right:29mm;bottom:8mm;height:28mm;display:grid;grid-template-columns:minmax(0,1fr) 28mm minmax(0,1fr);gap:12mm;align-items:end;text-align:center;color:#142a84}.signature i{display:block;width:min(64mm,82%);border-top:1mm solid #172033;margin:0 auto 2mm}.signature b{display:block;font-size:16pt;letter-spacing:.08em;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.signature span{display:block;font-size:10pt;line-height:1.15}.verificationBlock{justify-self:center;border:1px solid #dbe3ef;background:#fff;border-radius:2mm;padding:1.2mm;width:27mm;color:#172033;font-family:Inter,Arial;box-shadow:0 2mm 5mm rgba(15,23,42,.08)}.verificationBlock img{width:17mm;height:17mm;display:block;margin:0 auto 1mm}.verificationBlock b{display:block;font-size:5.4pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.verificationBlock span{display:block;font-size:4.8pt;color:#64748b}@media print{.printRoot{display:block}.a4Certificate{width:297mm;height:210mm;border-radius:0;page-break-inside:avoid}}
`
