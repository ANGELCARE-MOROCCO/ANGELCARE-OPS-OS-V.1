import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Angelcare360LibraryMutationForm from '@/components/angelcare360/library/Angelcare360LibraryMutationForm'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../_utils'
import { listAngelcare360LibraryCopies, listAngelcare360LibraryLoans } from '@/lib/angelcare360/server/library'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryLoansPage() {
  const context = await getAngelcare360LibraryContext()
  const copies = await listAngelcare360LibraryCopies({ schoolId: context.school.id })
  const loans = await listAngelcare360LibraryLoans({ schoolId: context.school.id })
  const supabase = await createClient()
  const [studentsResponse, staffResponse] = await Promise.all([
    supabase.from('angelcare360_students').select('id, student_code, full_name').eq('school_id', context.school.id).order('full_name', { ascending: true }).limit(300),
    supabase.from('angelcare360_staff').select('id, staff_code, full_name').eq('school_id', context.school.id).order('full_name', { ascending: true }).limit(300),
  ])
  const studentOptions = (studentsResponse.data || []).map((row) => ({ label: `${String((row as Record<string, unknown>).full_name || '')} · ${String((row as Record<string, unknown>).student_code || '')}`, value: String((row as Record<string, unknown>).id) }))
  const staffOptions = (staffResponse.data || []).map((row) => ({ label: `${String((row as Record<string, unknown>).full_name || '')} · ${String((row as Record<string, unknown>).staff_code || '')}`, value: String((row as Record<string, unknown>).id) }))

  return (
    <section style={shellStyle}>
      <Angelcare360LibrarySectionScreen title="Prêts" description="Saisie des prêts, suivi et contrôle des dates d’échéance." actions={<Link href="/angelcare-360-command-center/bibliotheque" style={libraryPrimaryLinkStyle}>Retour</Link>}>
        <Angelcare360LibraryMutationForm
          title="Créer un prêt"
          description="Enregistrement réel d’un prêt bibliothèque."
          entity="loan"
          operation="create"
          submitLabel="Créer le prêt"
          schoolId={context.school.id}
          fields={[
            { name: 'copyId', label: 'Exemplaire', kind: 'select', required: true, options: copies.map((copy) => ({ label: `${copy.copy_code} · ${copy.book_title || copy.book_code || 'Livre'}`, value: copy.id })) },
            { name: 'borrowerType', label: 'Emprunteur', kind: 'select', required: true, options: [{ label: 'Élève', value: 'student' }, { label: 'Personnel', value: 'staff' }] },
            { name: 'borrowerStudentId', label: 'Élève emprunteur', kind: 'select', options: studentOptions },
            { name: 'borrowerStaffId', label: 'Personnel emprunteur', kind: 'select', options: staffOptions },
            { name: 'loanedAt', label: 'Date emprunt', kind: 'date' },
            { name: 'dueAt', label: 'Date échéance', kind: 'date', required: true },
          ]}
        />

        {loans.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Prêt</th>
                  <th style={thStyle}>Exemplaire</th>
                  <th style={thStyle}>Emprunteur</th>
                  <th style={thStyle}>Échéance</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td style={tdStyle}><Link href={`/angelcare-360-command-center/bibliotheque/prets/${loan.id}`} style={linkStyle}>{loan.id}</Link></td>
                    <td style={tdStyle}>{loan.copy_code || '—'}<div style={mutedStyle}>{loan.book_title || loan.book_code || 'Livre'}</div></td>
                    <td style={tdStyle}>{loan.borrower_full_name || '—'}</td>
                    <td style={tdStyle}>{loan.due_at}</td>
                    <td style={tdStyle}>{loan.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun prêt" description="Créez un prêt pour démarrer le suivi des restitutions." />
        )}
      </Angelcare360LibrarySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 860 }
const thStyle: React.CSSProperties = { padding: '12px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#334155', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }
const linkStyle: React.CSSProperties = { color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 4 }
