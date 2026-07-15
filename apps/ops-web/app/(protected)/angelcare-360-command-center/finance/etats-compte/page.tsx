import Link from 'next/link'
import Angelcare360FinancePageShell from '@/components/angelcare360/finance/Angelcare360FinancePageShell'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { ANGELCARE360_FINANCE_NAVIGATION } from '@/data/angelcare360/finance-navigation'
import { getAngelcare360FinanceContext } from '../_utils'
import { listAngelcare360StudentBalances } from '@/lib/angelcare360/server/finance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceStatementsPage() {
  const context = await getAngelcare360FinanceContext()
  const balances = await listAngelcare360StudentBalances({ schoolId: context.school!.id })

  return (
    <Angelcare360FinancePageShell
      title="États de compte"
      subtitle="Relevés financiers et mouvements consolidés. L’export reste verrouillé tant que l’infrastructure n’est pas disponible."
      badge="Disponible"
      statusLabel="Export verrouillé"
      navigationItems={ANGELCARE360_FINANCE_NAVIGATION}
    >
      {balances.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun état de compte"
          description="Aucune base de mouvement n’est encore disponible pour générer un relevé."
          actionLabel="Voir les soldes"
          actionHref="/angelcare-360-command-center/finance/soldes-eleves"
        />
      ) : (
        <section style={gridStyle}>
          {balances.slice(0, 12).map((balance) => (
            <article key={balance.studentId} style={cardStyle}>
              <div style={titleStyle}>{balance.studentFullName}</div>
              <div style={metaStyle}>{balance.studentCode || '—'} · {balance.className || '—'}</div>
              <div style={amountStyle}>Solde dû: {balance.outstandingTotal}</div>
              <Link href={balance.detailHref} style={linkStyle}>Ouvrir le dossier élève</Link>
            </article>
          ))}
        </section>
      )}
    </Angelcare360FinancePageShell>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const amountStyle: React.CSSProperties = { color: '#166534', fontWeight: 900 }
const linkStyle: React.CSSProperties = { color: '#0f172a', textDecoration: 'none', fontWeight: 800 }

