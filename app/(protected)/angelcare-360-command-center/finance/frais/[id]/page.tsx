import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../../_utils'
import { getAngelcare360FeeStructureById } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360FinanceFeeDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360FinanceContext()
  const result = await getAngelcare360FeeStructureById({ schoolId: context.school!.id, id })
  if (!result) notFound()

  return (
    <Angelcare360FinancePageShell
      title={result.structure.label}
      subtitle="Détail de la structure de frais, articles et affectations."
      badge="Frais scolaires"
      statusLabel={result.structure.status}
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/finance/frais" style={linkStyle}>Retour à la liste</Link>}
    >
      <section style={gridStyle}>
        <Card title="Référence" lines={[result.structure.fee_code, result.structure.currency, result.structure.academic_year_label || 'Année non résolue']} />
        <Card title="Articles" lines={result.items.map((item) => `${item.label} · ${item.amount} ${result.structure.currency}`)} />
        <Card title="Affectations" lines={result.assignments.map((assignment) => `${assignment.student_full_name || 'Élève'} · ${assignment.status}`)} />
      </section>

      <Angelcare360EmptyState
        title="Actions server-side"
        description="La création et la mise à jour des structures de frais sont disponibles dans le module financier."
        actionLabel="Voir le détail"
        actionHref="/angelcare-360-command-center/finance/audit"
      />
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
