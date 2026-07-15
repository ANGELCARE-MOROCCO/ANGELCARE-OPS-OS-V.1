import Link from 'next/link'
import Angelcare360LibraryMutationForm from '@/components/angelcare360/library/Angelcare360LibraryMutationForm'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360LibraryBookById, listAngelcare360LibraryCopies, listAngelcare360LibraryLoans } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const context = await getAngelcare360LibraryContext()
  const book = await getAngelcare360LibraryBookById(id, { schoolId: context.school.id })
  if (!book) {
    return (
      <Angelcare360EmptyState title="Livre introuvable" description="Le livre demandé n’existe pas ou n’est pas accessible." actionLabel="Retour aux livres" actionHref="/angelcare-360-command-center/bibliotheque/livres" />
    )
  }
  const copies = (await listAngelcare360LibraryCopies({ schoolId: context.school.id })).filter((copy) => copy.book_id === book.id)
  const loans = (await listAngelcare360LibraryLoans({ schoolId: context.school.id })).filter((loan) => loan.book_code === book.book_code)

  return (
    <section style={shellStyle}>
      <Angelcare360LibrarySectionScreen
        title={book.title}
        description={`Fiche livre ${book.book_code}`}
        actions={<Link href="/angelcare-360-command-center/bibliotheque/livres" style={libraryPrimaryLinkStyle}>Retour</Link>}
      >
        <div style={gridStyle}>
          <article style={cardStyle}>
            <div style={labelStyle}>Titre</div>
            <div style={valueStyle}>{book.title}</div>
            <div style={mutedStyle}>{book.author || 'Auteur non renseigné'}</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Exemplaires</div>
            <div style={valueStyle}>{copies.length}</div>
            <div style={mutedStyle}>{copies.filter((copy) => copy.status === 'available').length} disponibles</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Prêts</div>
            <div style={valueStyle}>{loans.length}</div>
            <div style={mutedStyle}>{loans.filter((loan) => ['open', 'active', 'overdue'].includes(loan.status)).length} actifs</div>
          </article>
        </div>

        <Angelcare360LibraryMutationForm
          title="Modifier le livre"
          description="Mise à jour réelle du livre sélectionné."
          entity="book"
          operation="update"
          submitLabel="Enregistrer"
          recordId={book.id}
          schoolId={context.school.id}
          initialValues={{
            bookCode: book.book_code,
            title: book.title,
            isbn: book.isbn || '',
            author: book.author || '',
            publisher: book.publisher || '',
            category: book.category || '',
            language: book.language || 'fr',
          }}
          fields={[
            { name: 'bookCode', label: 'Code livre', kind: 'text', required: true },
            { name: 'title', label: 'Titre', kind: 'text', required: true },
            { name: 'isbn', label: 'ISBN', kind: 'text' },
            { name: 'author', label: 'Auteur', kind: 'text' },
            { name: 'publisher', label: 'Éditeur', kind: 'text' },
            { name: 'category', label: 'Catégorie', kind: 'text' },
            { name: 'language', label: 'Langue', kind: 'text' },
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
