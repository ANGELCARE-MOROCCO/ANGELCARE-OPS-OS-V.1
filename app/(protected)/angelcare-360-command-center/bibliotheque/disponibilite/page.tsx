import Link from 'next/link'
import Angelcare360LibrarySectionScreen from '@/components/angelcare360/library/Angelcare360LibrarySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360LibraryAvailability } from '@/lib/angelcare360/server/library'
import { getAngelcare360LibraryContext, libraryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360LibraryAvailabilityPage() {
  const context = await getAngelcare360LibraryContext()
  const availability = await getAngelcare360LibraryAvailability({ schoolId: context.school.id })

  return (
    <Angelcare360LibrarySectionScreen title="Disponibilité" description="Disponibilité réelle des exemplaires par livre." actions={<Link href="/angelcare-360-command-center/bibliotheque/livres" style={libraryPrimaryLinkStyle}>Livres</Link>}>
      {availability.length > 0 ? (
        <ul style={listStyle}>
          {availability.map((item) => (
            <li key={item.book_id} style={itemStyle}>
              <div style={titleStyle}>{item.title}</div>
              <div style={mutedStyle}>{item.copy_count} exemplaire(s) · {item.available_copy_count} disponible(s) · {item.loaned_copy_count} prêt(s)</div>
              <div style={mutedStyle}>Endommagés: {item.damaged_copy_count} · Perdus: {item.lost_copy_count} · Statut: {item.status}</div>
            </li>
          ))}
        </ul>
      ) : (
        <Angelcare360EmptyState title="Aucune disponibilité calculée" description="Créez des livres et exemplaires pour calculer la disponibilité." />
      )}
    </Angelcare360LibrarySectionScreen>
  )
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }
const itemStyle: React.CSSProperties = { display: 'grid', gap: 4, color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12 }
