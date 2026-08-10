import Link from 'next/link'
import Angelcare360LibraryMutationForm from '@/components/angelcare360/library/Angelcare360LibraryMutationForm'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360LibraryBooks, listAngelcare360LibraryCopies } from '@/lib/angelcare360/server/library'
import { libraryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryCopiesPage() {
  const context = await getAngelcare360AccessContext()
  const books = await listAngelcare360LibraryBooks({ schoolId: context?.school?.id || null })
  const copies = await listAngelcare360LibraryCopies({ schoolId: context?.school?.id || null })
  if (!context?.school) {
    return (
      <Angelcare360EmptyState title="Contexte indisponible" description="Aucun établissement actif n’a pu être résolu." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center" />
    )
  }

  return (
    <section style={shellStyle}>
      <Angelcare360LibrarySectionScreen title="Exemplaires" description="Copies physiques, état et disponibilité." actions={<Link href="/angelcare-360-command-center/bibliotheque" style={libraryPrimaryLinkStyle}>Retour</Link>}>
        <Angelcare360LibraryMutationForm
          title="Créer un exemplaire"
          description="Enregistrement réel d’un exemplaire physique."
          entity="copy"
          operation="create"
          submitLabel="Créer l’exemplaire"
          schoolId={context.school.id}
          fields={[
            { name: 'bookId', label: 'Livre', kind: 'select', required: true, options: books.map((book) => ({ label: `${book.title} (${book.book_code})`, value: book.id })) },
            { name: 'copyCode', label: 'Code exemplaire', kind: 'text', required: true },
            { name: 'barcode', label: 'Code-barres', kind: 'text' },
            { name: 'acquisitionDate', label: 'Date acquisition', kind: 'date' },
            { name: 'shelfLocation', label: 'Emplacement', kind: 'text' },
            { name: 'condition', label: 'État', kind: 'text', placeholder: 'good' },
          ]}
        />

        {copies.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Exemplaire</th>
                  <th style={thStyle}>Livre</th>
                  <th style={thStyle}>État</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {copies.map((copy) => (
                  <tr key={copy.id}>
                    <td style={tdStyle}>
                      <Link href={`/angelcare-360-command-center/bibliotheque/livres/${copy.book_id}`} style={linkStyle}>{copy.copy_code}</Link>
                      <div style={mutedStyle}>{copy.shelf_location || 'Rayonnage non renseigné'}</div>
                    </td>
                    <td style={tdStyle}>{copy.book_title || copy.book_code || '—'}</td>
                    <td style={tdStyle}>{copy.condition}</td>
                    <td style={tdStyle}>{copy.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun exemplaire" description="Créez un exemplaire pour mettre le fonds en mouvement." />
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
