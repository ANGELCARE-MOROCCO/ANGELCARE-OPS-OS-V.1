import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../../_utils'
import { getAngelcare360InvoiceById } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360FinanceInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360FinanceContext()
  const result = await getAngelcare360InvoiceById({ schoolId: context.school!.id, id })
  if (!result) notFound()

  return (
    <Angelcare360FinancePageShell
      title={result.invoice.invoice_number}
      subtitle="Détail de facture, lignes, paiements, remises et reçus associés."
      badge="Facture"
      statusLabel={result.invoice.status}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance/factures" style={linkStyle}>Retour aux factures</Link>}
    >
      <section style={gridStyle}>
        <Card title="Synthèse" lines={[result.invoice.student_full_name || 'Élève', result.invoice.invoice_date, `Total: ${result.invoice.total_amount}`, `Payé: ${result.invoice.amount_paid}`]} />
        <Card title="Lignes" lines={result.lines.map((line) => `${line.label} · ${line.line_total}`)} />
        <Card title="Paiements" lines={result.payments.map((payment) => `${payment.payment_number} · ${payment.amount} · ${payment.status}`)} />
        <Card title="Remises" lines={result.discounts.map((discount) => `${discount.discount_code} · ${discount.amount} · ${discount.status}`)} />
      </section>
      {result.receipts.length > 0 ? <Card title="Reçus" lines={result.receipts.map((receipt) => `${receipt.receipt_number} · ${receipt.status}`)} /> : <Angelcare360EmptyState title="Aucun reçu" description="Aucun reçu n’est encore lié à cette facture." />}
    </Angelcare360FinancePageShell>
  )
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article style={cardStyle}>
      <h2 style={cardTitleStyle}>{title}</h2>
      <ul style={listStyle}>
        {lines.length > 0 ? lines.map((line) => <li key={line} style={itemStyle}>{line}</li>) : <li style={itemStyle}>Aucune donnée</li>}
      </ul>
    </article>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 18,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const cardTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const itemStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '8px 10px',
  textDecoration: 'none',
  fontWeight: 800,
}
