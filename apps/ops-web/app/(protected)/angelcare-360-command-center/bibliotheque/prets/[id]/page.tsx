import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360LibraryMutationForm from '@/components/angelcare360/library/Angelcare360LibraryMutationForm'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import { getAngelcare360LibraryLoanById } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const context = await getAngelcare360LibraryContext()
  const loan = await getAngelcare360LibraryLoanById(id, { schoolId: context.school.id })
  if (!loan) {
    return <Angelcare360EmptyState title="Prêt introuvable" description="Le prêt demandé n’existe pas ou n’est pas accessible." actionLabel="Retour aux prêts" actionHref="/angelcare-360-command-center/bibliotheque/prets" />
  }

  return (
    <section style={shellStyle}>
      <Angelcare360LibrarySectionScreen
        title={`Prêt ${loan.id}`}
        description={`Exemplaire ${loan.copy_code || '—'} · ${loan.book_title || 'Livre'}`}
        actions={<Link href="/angelcare-360-command-center/bibliotheque/prets" style={libraryPrimaryLinkStyle}>Retour</Link>}
      >
        <div style={gridStyle}>
          <article style={cardStyle}>
            <div style={labelStyle}>Emprunteur</div>
            <div style={valueStyle}>{loan.borrower_full_name || '—'}</div>
            <div style={mutedStyle}>{loan.borrower_type}</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Échéance</div>
            <div style={valueStyle}>{loan.due_at}</div>
            <div style={mutedStyle}>{loan.days_overdue ? `${loan.days_overdue} jour(s) de retard` : 'À jour'}</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Statut</div>
            <div style={valueStyle}>{loan.status}</div>
            <div style={mutedStyle}>Retour et perte sont validés côté serveur.</div>
          </article>
        </div>

        <Angelcare360LibraryMutationForm
          title="Retourner le prêt"
          description="Marque le prêt comme retourné et libère l’exemplaire."
          entity="loan"
          operation="return"
          submitLabel="Retourner"
          recordId={loan.id}
          schoolId={context.school.id}
          fields={[
            { name: 'returnedAt', label: 'Date de retour', kind: 'date' },
            { name: 'notes', label: 'Notes', kind: 'textarea' },
          ]}
        />

        <Angelcare360LibraryMutationForm
          title="Marquer perdu"
          description="Marque le prêt comme perdu avec motif obligatoire."
          entity="loan"
          operation="lost"
          submitLabel="Marquer perdu"
          recordId={loan.id}
          schoolId={context.school.id}
          fields={[
            { name: 'reason', label: 'Motif', kind: 'textarea', required: true },
          ]}
        />

        <Angelcare360LibraryMutationForm
          title="Annuler le prêt"
          description="Archive le prêt avec motif obligatoire."
          entity="loan"
          operation="cancel"
          submitLabel="Annuler"
          recordId={loan.id}
          schoolId={context.school.id}
          fields={[
            { name: 'reason', label: 'Motif', kind: 'textarea', required: true },
          ]}
        />
      </Angelcare360LibrarySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const valueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.6, fontWeight: 600 }
