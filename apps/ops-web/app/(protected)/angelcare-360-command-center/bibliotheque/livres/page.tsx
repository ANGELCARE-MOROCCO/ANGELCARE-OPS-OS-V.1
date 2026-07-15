import Link from 'next/link'
import Angelcare360LibraryMutationForm from '@/components/angelcare360/library/Angelcare360LibraryMutationForm'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360LibraryBooks } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryBooksPage() {
  const context = await getAngelcare360LibraryContext()
  const books = await listAngelcare360LibraryBooks({ schoolId: context.school.id })

  return (
    <section style={shellStyle}>
      <Angelcare360LibrarySectionScreen
        title="Livres"
        description="Catalogue livres, fiches d’ouvrage et indicateurs d’exemplaires."
        actions={<Link href="/angelcare-360-command-center/bibliotheque" style={libraryPrimaryLinkStyle}>Retour au cockpit</Link>}
      >
        <Angelcare360LibraryMutationForm
          title="Créer un livre"
          description="Enregistrement réel dans la table des livres."
          entity="book"
          operation="create"
          submitLabel="Créer le livre"
          schoolId={context.school.id}
          fields={[
            { name: 'bookCode', label: 'Code livre', kind: 'text', required: true },
            { name: 'title', label: 'Titre', kind: 'text', required: true },
            { name: 'isbn', label: 'ISBN', kind: 'text' },
            { name: 'author', label: 'Auteur', kind: 'text' },
            { name: 'publisher', label: 'Éditeur', kind: 'text' },
            { name: 'category', label: 'Catégorie', kind: 'text' },
            { name: 'language', label: 'Langue', kind: 'text', placeholder: 'fr' },
          ]}
        />

        {books.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Livre</th>
                  <th style={thStyle}>ISBN</th>
                  <th style={thStyle}>Exemplaires</th>
                  <th style={thStyle}>Prêts</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td style={tdStyle}>
                      <Link href={`/angelcare-360-command-center/bibliotheque/livres/${book.id}`} style={linkStyle}>{book.title}</Link>
                      <div style={mutedStyle}>{book.book_code}</div>
                    </td>
                    <td style={tdStyle}>{book.isbn || '—'}</td>
                    <td style={tdStyle}>{book.copy_count || 0} disponibles / {book.available_copy_count || 0}</td>
                    <td style={tdStyle}>{book.loan_count || 0}</td>
                    <td style={tdStyle}>{book.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun livre" description="Créez un premier livre pour alimenter le catalogue." />
        )}
      </Angelcare360LibrarySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 820 }
const thStyle: React.CSSProperties = { padding: '12px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#334155', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }
const linkStyle: React.CSSProperties = { color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, marginTop: 4 }
