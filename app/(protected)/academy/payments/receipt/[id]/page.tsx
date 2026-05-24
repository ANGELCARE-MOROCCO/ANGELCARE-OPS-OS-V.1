import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function s(v: unknown, fallback = '—') { const out = String(v ?? '').trim(); return out || fallback }
function n(v: unknown) { const out = Number(v ?? 0); return Number.isFinite(out) ? out : 0 }
function mad(v: unknown) { return `${n(v).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD` }
function d(v: unknown) { try { return v ? new Date(String(v)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' } catch { return '—' } }
function t(v: unknown) { try { return v ? new Date(String(v)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—' } catch { return '—' } }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'AC' }

async function one(supabase: any, table: string, id: unknown) {
  if (!id) return null
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data as AnyRow | null
}

export default async function PaymentReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccess('academy.view')
  const { id } = await params
  const supabase = await createClient()
  const { data: payment } = await supabase.from('academy_payments').select('*').eq('id', id).maybeSingle()
  const p = payment as AnyRow | null
  const trainee = await one(supabase, 'academy_trainees', p?.trainee_id)
  const enrollment = await one(supabase, 'academy_enrollments', p?.enrollment_id)
  const course = await one(supabase, 'academy_courses', p?.course_id ?? enrollment?.course_id)
  const group = await one(supabase, 'academy_groups', p?.group_id ?? enrollment?.group_id)
  const location = await one(supabase, 'academy_locations', p?.location_id ?? enrollment?.location_id ?? group?.location_id)
  const amount = n(p?.amount ?? p?.amount_mad ?? p?.paid_amount)
  const paidAt = p?.paid_at ?? p?.created_at
  const receiptNo = s(p?.reference, `ACA-REC-${String(id).slice(0, 8).toUpperCase()}`)
  return <main className="receiptPage"><div className="toolbar"><Link href="/academy/payments?view=payments">← Back to payments</Link><button onClick={undefined as any}>Use browser print / Save as PDF</button></div><section className="receipt">
    <header className="receiptTop"><div className="logo"><strong>ANGEL CARE</strong><span>Preschool & Kindergarten</span></div><div className="title"><h1>REÇU D’INSCRIPTION & PAIEMENT</h1><p>Trainee Enrollment & Payment Receipt</p><div className="meta"><b>Reçu N°</b><span>{receiptNo}</span><b>Date d’émission</b><span>{d(paidAt)}</span><b>Mode de paiement</b><span>{s(p?.method ?? p?.payment_method, 'Cash')}</span></div></div></header>
    <div className="sectionGrid two"><section><h2>♡ INFORMATIONS TRAINEE</h2><p><b>Nom complet</b><span>{s(trainee?.full_name ?? p?.trainee_name)}</span></p><p><b>Date de naissance</b><span>{d(trainee?.birth_date ?? trainee?.date_of_birth)}</span></p><p><b>Téléphone</b><span>{s(trainee?.phone ?? trainee?.telephone)}</span></p><p><b>Email</b><span>{s(trainee?.email)}</span></p><p><b>CIN</b><span>{s(trainee?.cin ?? trainee?.national_id)}</span></p><p><b>Adresse</b><span>{s(trainee?.address ?? trainee?.city, 'Maroc')}</span></p></section><section><h2>♢ INFORMATIONS FORMATION</h2><p><b>Programme</b><span>{s(course?.title ?? course?.name, 'Course Enrollment')}</span></p><p><b>Session</b><span>{s(group?.name ?? group?.title, 'Session Academy')}</span></p><p><b>Durée</b><span>{s(course?.duration ?? course?.duration_days, 'Selon programme')}</span></p><p><b>Lieu de formation</b><span>{s(location?.name ?? location?.city, 'Angelcare Academy – Rabat')}</span></p><p><b>Date de début</b><span>{d(enrollment?.start_date ?? group?.start_date)}</span></p></section></div>
    <section className="paymentBlock"><h2>▤ DÉTAILS DU PAIEMENT</h2><table><thead><tr><th>DÉSIGNATION</th><th>MONTANT (MAD)</th></tr></thead><tbody><tr><td>Frais d'inscription</td><td>{mad(0)}</td></tr><tr><td>Frais de formation</td><td>{mad(amount)}</td></tr><tr><td>Supports & Matériel</td><td>{mad(0)}</td></tr><tr><td>Frais d'attestation</td><td>{mad(0)}</td></tr><tr className="total"><td>TOTAL</td><td>{mad(amount)}</td></tr><tr className="paid"><td>MONTANT PAYÉ</td><td>{mad(amount)}</td></tr><tr><td>STATUT</td><td className="green">{String(p?.status || '').toLowerCase().includes('pending') ? 'Paiement en attente' : 'Payé intégralement'}</td></tr></tbody></table></section>
    <div className="sectionGrid two cards"><section><h2>▧ DÉTAILS DE LA TRANSACTION</h2><p><b>Méthode de paiement</b><span>{s(p?.method ?? p?.payment_method, 'Cash')}</span></p><p><b>Référence de transaction</b><span>{receiptNo}</span></p><p><b>Banque</b><span>{s(p?.bank, '—')}</span></p><p><b>Date de paiement</b><span>{d(paidAt)} – {t(paidAt)}</span></p><p><b>Montant payé</b><span>{mad(amount)}</span></p></section><section><h2>ⓘ INCLUS DANS LA FORMATION</h2><ul><li>Attestation professionnelle reconnue</li><li>Supports pédagogiques & matériel</li><li>Accompagnement insertion emploi</li><li>Accès aux ateliers pratiques</li><li>Suivi post-formation</li></ul></section></div>
    <footer><div><h3>CONDITIONS</h3><p>Ce reçu confirme l'inscription et le paiement des frais de formation mentionnés ci-dessus. Aucun remboursement n’est possible sauf en cas d’annulation de la session par Angelcare Academy.</p></div><div><h3>SIGNATURE & CACHET</h3></div><div><h3>SCANNEZ POUR VÉRIFIER</h3><div className="qr">▦</div></div></footer><div className="contact"><span>📍 AV. HASSAN 2 RUE KUWAIT N13 PREMIER ÉTAGE ADMINISTRATION BUREAU N°3 12030, TÉMARA MAROC</span><span>☎ +212 5 37 58 14 62</span><span>✉ academy@angelcare.ma</span><span>@ angelcare.morocco</span></div>
  </section><style>{css}</style><script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load',()=>setTimeout(()=>window.print(),500))` }} /></main>
}

const css = `
.receiptPage{min-height:100vh;background:#f5f7fb;padding:24px;font-family:Inter,Arial,sans-serif;color:#142039}.toolbar{display:flex;justify-content:space-between;align-items:center;max-width:1180px;margin:0 auto 16px}.toolbar a,.toolbar button{border:1px solid #dbe3ef;background:#fff;border-radius:12px;padding:12px 16px;text-decoration:none;color:#142039;font-weight:900}.receipt{max-width:1180px;margin:0 auto;background:#fff;border:4px solid #4222c8;padding:46px;box-shadow:0 28px 90px rgba(15,23,42,.10)}.receiptTop{display:grid;grid-template-columns:1fr 1.2fr;gap:42px;border-bottom:2px solid #ddd;padding-bottom:30px}.logo strong{font-size:48px;color:#24338a;letter-spacing:-.06em}.logo span{display:block;font-size:18px;color:#24338a}.title{text-align:right}.title h1{font-size:32px;letter-spacing:.02em;margin:0}.title p{font-size:19px;color:#667085}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px 26px;max-width:430px;margin-left:auto;border-top:2px solid #d9b46b;padding-top:18px;text-align:left}.meta b{color:#38445a}.sectionGrid{display:grid;gap:42px}.sectionGrid.two{grid-template-columns:1fr 1fr}.sectionGrid section{padding:28px 0}.sectionGrid.two section:first-child{border-right:1px solid #d6dbe6;padding-right:42px}.sectionGrid h2,.paymentBlock h2{font-size:17px;color:#172033;margin:0 0 18px}.sectionGrid p{display:grid;grid-template-columns:190px 1fr;margin:12px 0;font-size:16px}.sectionGrid p b{color:#344054}.sectionGrid p span{font-weight:650}.paymentBlock{border-top:2px solid #ddd;border-bottom:2px solid #ddd;padding:26px 0}.paymentBlock table{width:100%;border-collapse:collapse;font-size:17px}.paymentBlock th{background:#eee;text-align:left;padding:14px;border:1px solid #ddd}.paymentBlock td{padding:15px;border:1px solid #ddd;font-weight:700}.paymentBlock td:last-child{text-align:center}.total td{font-size:22px;font-weight:1000}.paid td{background:#111f3a!important;color:#fff!important;font-size:22px}.green{color:#31a354!important}.cards section{border:1px solid #e7ebf2!important;border-radius:20px;padding:24px!important}.cards ul{margin:0;padding-left:20px;line-height:1.9;font-weight:700}footer{display:grid;grid-template-columns:1.2fr 1fr .8fr;gap:36px;border-top:2px solid #ddd;margin-top:28px;padding-top:28px;min-height:140px}footer h3{font-size:15px;margin:0 0 12px}.qr{width:96px;height:96px;border:1px solid #ddd;display:grid;place-items:center;font-size:52px;margin:auto}.contact{display:grid;grid-template-columns:1.5fr .8fr 1fr 1fr;gap:18px;border-top:2px solid #ddd;margin-top:20px;padding-top:18px;font-size:12px;font-weight:800}@media print{.toolbar{display:none}.receiptPage{padding:0;background:#fff}.receipt{box-shadow:none;border-width:3px;max-width:none;margin:0;min-height:100vh}@page{size:A4;margin:8mm}}`
