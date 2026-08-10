import Link from 'next/link'
import Angelcare360InventoryMutationForm from '@/components/angelcare360/inventory/Angelcare360InventoryMutationForm'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { listAngelcare360InventoryCategories } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryCategoriesPage() {
  const context = await getAngelcare360InventoryContext()
  const categories = await listAngelcare360InventoryCategories({ schoolId: context.school.id })

  return (
    <section style={shellStyle}>
      <Angelcare360InventorySectionScreen title="Catégories" description="Référentiel des catégories d’articles." actions={<Link href="/angelcare-360-command-center/inventaire" style={inventoryPrimaryLinkStyle}>Retour</Link>}>
        <Angelcare360InventoryMutationForm
          title="Créer une catégorie"
          description="Enregistrement réel d’une catégorie inventaire."
          entity="category"
          operation="create"
          submitLabel="Créer la catégorie"
          schoolId={context.school.id}
          fields={[
            { name: 'categoryCode', label: 'Code catégorie', kind: 'text', required: true },
            { name: 'label', label: 'Libellé', kind: 'text', required: true },
            { name: 'description', label: 'Description', kind: 'textarea' },
          ]}
        />

        {categories.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Catégorie</th>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Articles</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td style={tdStyle}>{category.label}</td>
                    <td style={tdStyle}>{category.category_code}</td>
                    <td style={tdStyle}>{category.item_count || 0}</td>
                    <td style={tdStyle}>{category.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucune catégorie" description="Créez une catégorie pour structurer les articles." />
        )}
      </Angelcare360InventorySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 760 }
const thStyle: React.CSSProperties = { padding: '12px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#334155', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }
