import QRCode from 'qrcode'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintActions } from '@/components/academy/print/PrintActions'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function text(value: unknown, fallback = '—') {
  const output = String(value ?? '').trim()
  return output || fallback
}

function amount(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mad(value: unknown) {
  return `${amount(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`
}

function dateFr(value: unknown) {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}

function dateTimeFr(value: unknown) {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

async function maybeOne(supabase: any, table: string, id: unknown) {
  if (!id) return null
  const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  return data || null
}

async function findRefund(supabase: any, id: string) {
  let query = supabase.from('academy_refunds').select('*').eq('id', id).maybeSingle()
  let { data } = await query
  if (data) return data

  query = supabase.from('academy_refunds').select('*').eq('reference', id).maybeSingle()
  ;({ data } = await query)
  return data || null
}

export default async function AcademyRefundReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const refund = await findRefund(supabase, decodeURIComponent(id))

  if (!refund) notFound()

  const payment = await maybeOne(supabase, 'academy_payments', refund.payment_id)
  const trainee = await maybeOne(supabase, 'academy_trainees', refund.trainee_id || payment?.trainee_id)
  const enrollment = await maybeOne(supabase, 'academy_enrollments', refund.enrollment_id || payment?.enrollment_id)
  const course = await maybeOne(supabase, 'academy_courses', enrollment?.course_id || payment?.course_id)
  const group = await maybeOne(supabase, 'academy_groups', enrollment?.group_id)
  const location = await maybeOne(supabase, 'academy_locations', group?.location_id || enrollment?.location_id)

  const refundReference = text(refund.reference || refund.refund_number || `REF-${String(refund.id).slice(0, 12).toUpperCase()}`)
  const paymentReference = text(payment?.reference || payment?.transaction_id || payment?.id)
  const refundAmount = amount(refund.amount || refund.amount_mad || refund.refund_amount)
  const originalPaymentAmount = amount(payment?.amount || payment?.amount_mad || payment?.total_amount)
  const verificationBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const verificationUrl = `${verificationBase}/academy-print/refunds/${encodeURIComponent(String(refund.id || refundReference))}`
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 220 })

  return (
    <main className="academy-print-root">
      <PrintActions />
      <article className="a4-document">
        <section className="receipt-header">
          <div>
            <div className="brand-title">ANGEL CARE</div>
            <div className="brand-subtitle">Preschool &amp; Kindergarten</div>
          </div>
          <div className="receipt-title">
            <h1>REÇU DE REMBOURSEMENT</h1>
            <p>Reçu de remboursement • Paiement Academy</p>
            <div className="meta-grid">
              <div className="meta-row"><b>Reçu remboursement N°</b><span>{refundReference}</span></div>
              <div className="meta-row"><b>Date d’émission</b><span>{dateFr(refund.processed_at || refund.requested_at || refund.created_at)}</span></div>
              <div className="meta-row"><b>Mode de remboursement</b><span>{text(refund.method || payment?.method || payment?.payment_method, '—')}</span></div>
            </div>
          </div>
        </section>

        <section className="two-col">
          <div className="info-card">
            <h2 className="section-title">♡ Informations trainee</h2>
            <div className="info-list">
              <div className="info-row"><b>Nom complet</b><span>{text(trainee?.full_name || trainee?.name)}</span></div>
              <div className="info-row"><b>Date de naissance</b><span>{text(trainee?.birth_date || trainee?.date_of_birth)}</span></div>
              <div className="info-row"><b>Téléphone</b><span>{text(trainee?.phone || trainee?.phone_number)}</span></div>
              <div className="info-row"><b>Email</b><span>{text(trainee?.email)}</span></div>
              <div className="info-row"><b>CIN</b><span>{text(trainee?.cin || trainee?.national_id)}</span></div>
              <div className="info-row"><b>Adresse</b><span>{text(trainee?.address || trainee?.city)}</span></div>
            </div>
          </div>
          <div className="info-card">
            <h2 className="section-title">◇ Informations formation</h2>
            <div className="info-list">
              <div className="info-row"><b>Programme</b><span>{text(course?.title || course?.name || payment?.course_title, 'Course Enrollment')}</span></div>
              <div className="info-row"><b>Session</b><span>{text(group?.name || group?.title, 'Session Academy')}</span></div>
              <div className="info-row"><b>Durée</b><span>{text(course?.duration || course?.duration_label, 'Selon programme')}</span></div>
              <div className="info-row"><b>Lieu de formation</b><span>{text(location?.name || location?.city, 'AngelCare Academy – Rabat')}</span></div>
              <div className="info-row"><b>Date de début</b><span>{text(enrollment?.start_date || group?.start_date)}</span></div>
            </div>
          </div>
        </section>

        <section className="refund-table-wrap">
          <h2 className="section-title">▣ Détails du remboursement</h2>
          <table className="refund-table">
            <thead>
              <tr><th>Désignation</th><th>Montant / Détail</th></tr>
            </thead>
            <tbody>
              <tr><td>Référence paiement original</td><td>{paymentReference}</td></tr>
              <tr><td>Montant paiement initial</td><td>{mad(originalPaymentAmount)}</td></tr>
              <tr><td>Motif du remboursement</td><td>{text(refund.reason || refund.refund_reason, 'Remboursement validé')}</td></tr>
              <tr className="total"><td>Total remboursé</td><td>{mad(refundAmount)}</td></tr>
              <tr className="paid"><td>Montant remboursé</td><td>{mad(refundAmount)}</td></tr>
              <tr className="status"><td>Statut</td><td>Remboursement {text(refund.status, 'approuvé')}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="box-grid">
          <div className="rounded-box">
            <h3>▦ Détails de la transaction de remboursement</h3>
            <div className="info-list">
              <div className="info-row"><b>Méthode de remboursement</b><span>{text(refund.method || payment?.method || payment?.payment_method)}</span></div>
              <div className="info-row"><b>Référence remboursement</b><span>{refundReference}</span></div>
              <div className="info-row"><b>Référence paiement</b><span>{paymentReference}</span></div>
              <div className="info-row"><b>Date de demande</b><span>{dateTimeFr(refund.requested_at || refund.created_at)}</span></div>
              <div className="info-row"><b>Date de traitement</b><span>{dateTimeFr(refund.processed_at || refund.updated_at || refund.created_at)}</span></div>
              <div className="info-row"><b>Montant remboursé</b><span>{mad(refundAmount)}</span></div>
            </div>
          </div>
          <div className="rounded-box">
            <h3>ⓘ Conditions de remboursement</h3>
            <div className="info-list">
              <div><span>Remboursement traité selon la politique AngelCare Academy.</span></div>
              <div><span>Référence unique de remboursement vérifiable par QR code.</span></div>
              <div><span>Document lié au dossier trainee et au paiement initial.</span></div>
              <div><span>Historique conservé dans Academy OS.</span></div>
              <div><span>Authenticité vérifiable par scan.</span></div>
            </div>
          </div>
        </section>

        <section className="conditions-grid">
          <div>
            <h3>Conditions</h3>
            <p>Ce reçu confirme le traitement du remboursement mentionné ci-dessus. Le remboursement reste soumis aux conditions administratives et financières d’AngelCare Academy.</p>
          </div>
          <div>
            <h3>Signature &amp; cachet</h3>
            <div className="signature-box" />
          </div>
          <div className="qr-box">
            <h3>Scannez pour vérifier</h3>
            <img src={qrDataUrl} alt="QR code de vérification" />
          </div>
        </section>

        <footer className="footer">
          <div><b>AV. HASSAN 2 RUE KUWAIT N13 PREMIER ÉTAGE ADMINISTRATION BUREAU N°3</b><br />12030, TÉMARA MAROC</div>
          <div><b>+212 5 37 58 14 62</b><br />academy@angelcare.ma</div>
          <div><b>@ angelcare.morocco</b></div>
        </footer>
      </article>
    </main>
  )
}
