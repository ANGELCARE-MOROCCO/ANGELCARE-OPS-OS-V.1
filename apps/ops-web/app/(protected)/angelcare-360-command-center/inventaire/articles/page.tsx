import Link from 'next/link'
import Angelcare360InventoryMutationForm from '@/components/angelcare360/inventory/Angelcare360InventoryMutationForm'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360InventoryCategories, listAngelcare360InventoryItems } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryItemsPage() {
  const context = await getAngelcare360InventoryContext()
  const categories = await listAngelcare360InventoryCategories({ schoolId: context.school.id })
  const items = await listAngelcare360InventoryItems({ schoolId: context.school.id })

  return (
    <section style={shellStyle}>
      <Angelcare360InventorySectionScreen title="Articles" description="Articles, quantités, seuils et responsables." actions={<Link href="/angelcare-360-command-center/inventaire" style={inventoryPrimaryLinkStyle}>Retour</Link>}>
        <Angelcare360InventoryMutationForm
          title="Créer un article"
          description="Enregistrement réel d’un article inventaire."
          entity="item"
          operation="create"
          submitLabel="Créer l’article"
          schoolId={context.school.id}
          fields={[
            { name: 'categoryId', label: 'Catégorie', kind: 'select', required: true, options: categories.map((category) => ({ label: `${category.label} (${category.category_code})`, value: category.id })) },
            { name: 'itemCode', label: 'Code article', kind: 'text', required: true },
            { name: 'label', label: 'Libellé', kind: 'text', required: true },
            { name: 'unitOfMeasure', label: 'Unité', kind: 'text' },
            { name: 'barcode', label: 'Code-barres', kind: 'text' },
            { name: 'currentStock', label: 'Stock actuel', kind: 'number', required: true },
            { name: 'reorderLevel', label: 'Seuil', kind: 'number' },
            { name: 'purchasePrice', label: 'Prix d’achat', kind: 'number' },
          ]}
        />

        {items.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Article</th>
                  <th style={thStyle}>Catégorie</th>
                  <th style={thStyle}>Stock</th>
                  <th style={thStyle}>Seuil</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      <Link href={`/angelcare-360-command-center/inventaire/articles/${item.id}`} style={linkStyle}>{item.label}</Link>
                      <div style={mutedStyle}>{item.item_code}</div>
                    </td>
                    <td style={tdStyle}>{item.category_label || item.category_code || '—'}</td>
                    <td style={tdStyle}>{item.current_stock}</td>
                    <td style={tdStyle}>{item.reorder_level}</td>
                    <td style={tdStyle}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun article" description="Créez un article pour alimenter le stock." />
        )}
      </Angelcare360InventorySectionScreen>
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
