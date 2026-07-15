import { notFound } from 'next/navigation'
import Angelcare360A4DocumentFrame from '@/components/angelcare360/documents/Angelcare360A4DocumentFrame'
import Angelcare360A4KpiBlock from '@/components/angelcare360/documents/Angelcare360A4KpiBlock'
import Angelcare360A4SignatureBlock from '@/components/angelcare360/documents/Angelcare360A4SignatureBlock'
import Angelcare360A4StatusStamp from '@/components/angelcare360/documents/Angelcare360A4StatusStamp'
import Angelcare360A4Table from '@/components/angelcare360/documents/Angelcare360A4Table'
import Angelcare360PrintToolbar from '@/components/angelcare360/documents/Angelcare360PrintToolbar'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { buildOperatorReceiptA4Model } from '@/lib/angelcare360/documents/builders'
import { getOperatorPaymentById } from '@/lib/angelcare360/operator/billing'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360OperatorReceiptPrintPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const payment = await getOperatorPaymentById(id)
  if (!payment) {
    return (
      <Angelcare360EmptyState
        title="Reçu introuvable"
        description="Le reçu demandé ne peut pas être imprimé car le paiement n’existe pas dans le dossier opérateur."
        actionLabel="Retour aux paiements"
        actionHref="/angelcare-360-operator/billing/payments"
      />
    )
  }

  const model = buildOperatorReceiptA4Model({
    payment,
    client: payment.client || payment.invoice?.client || null,
    invoice: payment.invoice || null,
  })

  return (
    <main style={pageStyle}>
      <Angelcare360PrintToolbar backHref="/angelcare-360-operator/billing/payments" printLabel="Imprimer le reçu" />
      <Angelcare360A4DocumentFrame model={model}>
        <div style={stackStyle}>
          <section style={kpiGridStyle}>
            <Angelcare360A4KpiBlock label="Montant" value={`${Number(payment.amount_mad || 0).toLocaleString('fr-FR')} MAD`} tone="success" />
            <Angelcare360A4KpiBlock label="Méthode" value={String(payment.method || '—')} tone="primary" />
            <Angelcare360A4KpiBlock label="Référence" value={String(payment.payment_reference || payment.id)} tone="neutral" />
            <Angelcare360A4StatusStamp label={String(payment.status || '—')} tone="neutral" />
          </section>

          <Angelcare360A4Table
            headers={['Champ', 'Valeur']}
            rows={[
              ['Référence', String(payment.payment_reference || payment.id)],
              ['Client', String((payment.client as Record<string, unknown> | undefined)?.display_name || payment.client_id || '—')],
              ['Facture', String((payment.invoice as Record<string, unknown> | undefined)?.invoice_number || payment.invoice_id || '—')],
              ['Date paiement', String(payment.payment_date || '—')],
              ['Méthode', String(payment.method || '—')],
              ['Réception', String(payment.received_by || '—')],
            ]}
          />

          <div style={summaryStyle}>
            <div>
              <div style={sectionLabelStyle}>Résumé</div>
              <p style={summaryTextStyle}>
                {String(payment.notes || 'Ce reçu A4 reflète le paiement réel enregistré par l’équipe opérateur et peut être imprimé ou téléchargé depuis le moteur documentaire.')}
              </p>
            </div>
            <Angelcare360A4SignatureBlock label="Validation reçu" name="AngelCare 360" title="Équipe finance opérateur" />
          </div>
        </div>
      </Angelcare360A4DocumentFrame>
    </main>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 16 }
const stackStyle: React.CSSProperties = { display: 'grid', gap: 14 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }
const summaryStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: '1.2fr .8fr', alignItems: 'start' }
const sectionLabelStyle: React.CSSProperties = { color: '#0f172a', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }
const summaryTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
