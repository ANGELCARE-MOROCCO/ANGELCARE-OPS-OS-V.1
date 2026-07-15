import { notFound } from 'next/navigation'
import Angelcare360A4DocumentFrame from '@/components/angelcare360/documents/Angelcare360A4DocumentFrame'
import Angelcare360A4KpiBlock from '@/components/angelcare360/documents/Angelcare360A4KpiBlock'
import Angelcare360A4SignatureBlock from '@/components/angelcare360/documents/Angelcare360A4SignatureBlock'
import Angelcare360A4StatusStamp from '@/components/angelcare360/documents/Angelcare360A4StatusStamp'
import Angelcare360A4Table from '@/components/angelcare360/documents/Angelcare360A4Table'
import Angelcare360PrintToolbar from '@/components/angelcare360/documents/Angelcare360PrintToolbar'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { buildOperatorStatementA4Model } from '@/lib/angelcare360/documents/builders'
import { getOperatorClientById } from '@/lib/angelcare360/operator/clients'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360OperatorStatementPrintPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const client = await getOperatorClientById(id)
  if (!client) {
    return (
      <Angelcare360EmptyState
        title="État de compte introuvable"
        description="Le dossier client demandé ne peut pas être imprimé car le client est introuvable."
        actionLabel="Retour au dossier client"
        actionHref="/angelcare-360-operator/clients"
      />
    )
  }

  const model = buildOperatorStatementA4Model({
    client,
    invoices: client.invoices || [],
    payments: client.payments || [],
  })

  return (
    <main style={pageStyle}>
      <Angelcare360PrintToolbar backHref={`/angelcare-360-operator/clients/${id}`} printLabel="Imprimer l’état de compte" />
      <Angelcare360A4DocumentFrame model={model}>
        <div style={stackStyle}>
          <section style={kpiGridStyle}>
            <Angelcare360A4KpiBlock label="Factures récentes" value={String((client.invoices || []).length)} tone="primary" />
            <Angelcare360A4KpiBlock label="Paiements récents" value={String((client.payments || []).length)} tone="success" />
            <Angelcare360A4KpiBlock label="Encaissé" value={`${(client.payments || []).filter((payment) => String(payment.status) === 'confirmed').reduce((sum, payment) => sum + Number(payment.amount_mad || 0), 0).toLocaleString('fr-FR')} MAD`} tone="success" />
            <Angelcare360A4KpiBlock label="Solde affiché" value={`${Number(client.balance_due_mad || 0).toLocaleString('fr-FR')} MAD`} tone="warning" />
            <Angelcare360A4StatusStamp label={String(client.status || '—')} tone="neutral" />
          </section>

          <Angelcare360A4Table
            headers={['Facture', 'Statut', 'Solde dû']}
            rows={(client.invoices || []).slice(0, 8).map((invoice) => [
              String(invoice.invoice_number || invoice.id || '—'),
              String(invoice.status || '—'),
              `${Number(invoice.balance_due_mad || 0).toLocaleString('fr-FR')} MAD`,
            ])}
          />

          <Angelcare360A4Table
            headers={['Paiement', 'Statut', 'Montant']}
            rows={(client.payments || []).slice(0, 8).map((payment) => [
              String(payment.payment_reference || payment.id || '—'),
              String(payment.status || '—'),
              `${Number(payment.amount_mad || 0).toLocaleString('fr-FR')} MAD`,
            ])}
          />

          <div style={summaryStyle}>
            <div>
              <div style={sectionLabelStyle}>Résumé</div>
              <p style={summaryTextStyle}>
                L’état de compte consolide les factures et paiements réels du client. Il sert de base opérateur pour l’impression A4 et le suivi des encours.
              </p>
            </div>
            <Angelcare360A4SignatureBlock label="Validation état de compte" name="AngelCare 360" title="Équipe finance opérateur" />
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
