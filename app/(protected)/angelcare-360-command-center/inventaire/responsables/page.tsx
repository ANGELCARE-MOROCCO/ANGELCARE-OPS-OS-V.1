import Link from 'next/link'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360InventoryResponsibleCoverage } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryResponsiblePage() {
  const context = await getAngelcare360InventoryContext()
  const coverage = await listAngelcare360InventoryResponsibleCoverage({ schoolId: context.school.id })

  return (
    <Angelcare360InventorySectionScreen title="Responsables" description="Répartition des articles par responsable." actions={<Link href="/angelcare-360-command-center/inventaire/articles" style={inventoryPrimaryLinkStyle}>Articles</Link>}>
      {coverage.length > 0 ? (
        <ul style={listStyle}>
          {coverage.map((row) => (
            <li key={String(row.responsible_staff_id || 'unassigned')} style={itemStyle}>
              <div style={titleStyle}>{row.responsible_staff_full_name || 'Non assigné'}</div>
              <div style={mutedStyle}>{row.item_count} article(s) · {row.low_stock_count} sous seuil · {row.unassigned_item_count} non assigné(s)</div>
            </li>
          ))}
        </ul>
      ) : (
        <Angelcare360EmptyState title="Aucune couverture" description="Aucun article n’est encore affecté à un responsable." />
      )}
    </Angelcare360InventorySectionScreen>
  )
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }
const itemStyle: React.CSSProperties = { display: 'grid', gap: 4, color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12 }
