import { notFound } from 'next/navigation'
import Angelcare360A4DocumentFrame from '@/components/angelcare360/documents/Angelcare360A4DocumentFrame'
import Angelcare360A4KpiBlock from '@/components/angelcare360/documents/Angelcare360A4KpiBlock'
import Angelcare360A4SignatureBlock from '@/components/angelcare360/documents/Angelcare360A4SignatureBlock'
import Angelcare360A4StatusStamp from '@/components/angelcare360/documents/Angelcare360A4StatusStamp'
import Angelcare360A4Table from '@/components/angelcare360/documents/Angelcare360A4Table'
import Angelcare360PrintToolbar from '@/components/angelcare360/documents/Angelcare360PrintToolbar'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { buildOperatorInvoiceA4Model } from '@/lib/angelcare360/documents/builders'
import { getOperatorInvoiceById } from '@/lib/angelcare360/operator/billing'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360OperatorInvoicePrintPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const invoice = await getOperatorInvoiceById(id)
  if (!invoice) {
    return (
      <Angelcare360EmptyState
        title="Facture introuvable"
        description="La facture demandée ne peut pas être imprimée car elle est absente du dossier opérateur."
        actionLabel="Retour aux factures"
        actionHref="/angelcare-360-operator/billing/invoices"
      />
    )
  }

  const model = buildOperatorInvoiceA4Model({
    invoice,
    client: invoice.client || null,
    billingAccount: invoice.billing_account || null,
    subscription: invoice.subscription || null,
  })

  return (
    <main style={pageStyle}>
      <Angelcare360PrintToolbar backHref="/angelcare-360-operator/billing/invoices" printLabel="Imprimer la facture" />
      <Angelcare360A4DocumentFrame model={model}>
        <div style={stackStyle}>
          <section style={kpiGridStyle}>
            <Angelcare360A4KpiBlock label="Total" value={`${Number(invoice.total_mad || 0).toLocaleString('fr-FR')} MAD`} tone="primary" />
            <Angelcare360A4KpiBlock label="Payé" value={`${Number(invoice.amount_paid_mad || 0).toLocaleString('fr-FR')} MAD`} tone="success" />
            <Angelcare360A4KpiBlock label="Solde dû" value={`${Number(invoice.balance_due_mad || 0).toLocaleString('fr-FR')} MAD`} tone="warning" />
            <Angelcare360A4StatusStamp label={String(invoice.status || '—')} tone="neutral" />
          </section>

          <Angelcare360A4Table
            headers={['Champ', 'Valeur']}
            rows={[
              ['Numéro', String(invoice.invoice_number || invoice.id)],
              ['Client', String((invoice.client as Record<string, unknown> | undefined)?.display_name || invoice.client_id || '—')],
              ['Compte facturation', String((invoice.billing_account as Record<string, unknown> | undefined)?.billing_name || '—')],
              ['Abonnement', String((invoice.subscription as Record<string, unknown> | undefined)?.subscription_code || invoice.subscription_id || '—')],
              ['Émission', String(invoice.issue_date || '—')],
              ['Échéance', String(invoice.due_date || '—')],
              ['Période', `${String(invoice.period_start || '—')} → ${String(invoice.period_end || '—')}`],
            ]}
          />

          <div style={summaryStyle}>
            <div>
              <div style={sectionLabelStyle}>Résumé</div>
              <p style={summaryTextStyle}>
                {String(invoice.notes || 'Cette facture A4 reflète l’état réel du dossier opérateur et peut être imprimée ou téléchargée depuis le moteur documentaire.')}
              </p>
            </div>
            <Angelcare360A4SignatureBlock label="Validation facture" name="AngelCare 360" title="Équipe finance opérateur" />
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
