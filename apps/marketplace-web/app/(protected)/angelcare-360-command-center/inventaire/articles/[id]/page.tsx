import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360InventoryMutationForm from '@/components/angelcare360/inventory/Angelcare360InventoryMutationForm'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import { getAngelcare360InventoryItemById, listAngelcare360InventoryCategories } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360InventoryItemDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360InventoryContext()
  const item = await getAngelcare360InventoryItemById(id, { schoolId: context.school.id })
  if (!item) {
    return <Angelcare360EmptyState title="Article introuvable" description="L’article demandé n’existe pas ou n’est pas accessible." actionLabel="Retour aux articles" actionHref="/angelcare-360-command-center/inventaire/articles" />
  }
  const categories = await listAngelcare360InventoryCategories({ schoolId: context.school.id })

  return (
    <section style={shellStyle}>
      <Angelcare360InventorySectionScreen
        title={item.label}
        description={`Fiche article ${item.item_code}`}
        actions={<Link href="/angelcare-360-command-center/inventaire/articles" style={inventoryPrimaryLinkStyle}>Retour</Link>}
      >
        <div style={gridStyle}>
          <article style={cardStyle}>
            <div style={labelStyle}>Stock</div>
            <div style={valueStyle}>{item.current_stock}</div>
            <div style={mutedStyle}>Seuil: {item.reorder_level}</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Statut</div>
            <div style={valueStyle}>{item.status}</div>
            <div style={mutedStyle}>{item.responsible_staff_full_name || 'Aucun responsable'}</div>
          </article>
          <article style={cardStyle}>
            <div style={labelStyle}>Mouvements</div>
            <div style={valueStyle}>{item.movement_count || 0}</div>
            <div style={mutedStyle}>{item.low_stock ? 'Stock bas détecté' : 'Niveau stable'}</div>
          </article>
        </div>

        <Angelcare360InventoryMutationForm
          title="Modifier l’article"
          description="Mise à jour réelle de l’article sélectionné."
          entity="item"
          operation="update"
          submitLabel="Enregistrer"
          recordId={item.id}
          schoolId={context.school.id}
          initialValues={{
            categoryId: item.category_id,
            itemCode: item.item_code,
            label: item.label,
            unitOfMeasure: item.unit_of_measure,
            barcode: item.barcode || '',
            currentStock: item.current_stock,
            reorderLevel: item.reorder_level,
            purchasePrice: item.purchase_price,
            responsibleStaffId: item.responsible_staff_id || '',
          }}
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

        <Angelcare360InventoryMutationForm
          title="Créer un mouvement"
          description="Enregistrement réel d’un mouvement de stock."
          entity="movement"
          operation="create"
          submitLabel="Créer le mouvement"
          schoolId={context.school.id}
          fields={[
            { name: 'itemId', label: 'Article', kind: 'text', required: true, placeholder: item.id },
            { name: 'movementCode', label: 'Code mouvement', kind: 'text', required: true },
            { name: 'movementType', label: 'Type', kind: 'select', required: true, options: [
              { label: 'Entrée', value: 'entry' },
              { label: 'Sortie', value: 'exit' },
              { label: 'Ajustement', value: 'adjustment' },
              { label: 'Transfert', value: 'transfer' },
              { label: 'Perte', value: 'loss' },
              { label: 'Dégradation', value: 'damage' },
            ] },
            { name: 'quantity', label: 'Quantité', kind: 'number', required: true },
            { name: 'movementDate', label: 'Date', kind: 'date' },
            { name: 'notes', label: 'Motif', kind: 'textarea' },
          ]}
        />
      </Angelcare360InventorySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const valueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.6, fontWeight: 600 }
