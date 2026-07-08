import Link from 'next/link'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360LibraryOverdueLoans } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryOverduePage() {
  const context = await getAngelcare360LibraryContext()
  const loans = await listAngelcare360LibraryOverdueLoans({ schoolId: context.school.id })

  return (
    <Angelcare360LibrarySectionScreen title="Retards" description="Prêts en retard calculés à partir des dates d’échéance réelles." actions={<Link href="/angelcare-360-command-center/bibliotheque/prets" style={libraryPrimaryLinkStyle}>Prêts</Link>}>
      {loans.length > 0 ? (
        <ul style={listStyle}>
          {loans.map((loan) => (
            <li key={loan.id} style={itemStyle}>
              <Link href={`/angelcare-360-command-center/bibliotheque/prets/${loan.id}`} style={linkStyle}>{loan.book_title || loan.copy_code || loan.id}</Link>
              <div style={mutedStyle}>{loan.borrower_full_name || 'Emprunteur non renseigné'} · {loan.days_overdue || 0} jour(s) de retard</div>
            </li>
          ))}
        </ul>
      ) : (
        <Angelcare360EmptyState title="Aucun retard" description="Aucun prêt n’est en retard à cet instant." />
      )}
    </Angelcare360LibrarySectionScreen>
  )
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const itemStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const linkStyle: React.CSSProperties = { color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 4 }
