import Link from 'next/link'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360LowStockItems } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryLowStockPage() {
  const context = await getAngelcare360InventoryContext()
  const items = await listAngelcare360LowStockItems({ schoolId: context.school.id })

  return (
    <Angelcare360InventorySectionScreen title="Stock bas" description="Articles sous seuil ou en rupture calculés depuis les quantités réelles." actions={<Link href="/angelcare-360-command-center/inventaire/articles" style={inventoryPrimaryLinkStyle}>Articles</Link>}>
      {items.length > 0 ? (
        <ul style={listStyle}>
          {items.map((item) => (
            <li key={item.id} style={itemStyle}>
              <div style={titleStyle}>{item.label}</div>
              <div style={mutedStyle}>{item.item_code} · stock {item.current_stock} · seuil {item.reorder_level} · {item.status}</div>
            </li>
          ))}
        </ul>
      ) : (
        <Angelcare360EmptyState title="Aucun stock bas" description="Aucun article n’est actuellement sous seuil ou en rupture." />
      )}
    </Angelcare360InventorySectionScreen>
  )
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }
const itemStyle: React.CSSProperties = { display: 'grid', gap: 4, color: '#334155', lineHeight: 1.5, fontWeight: 600 }
const titleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontSize: 12 }
