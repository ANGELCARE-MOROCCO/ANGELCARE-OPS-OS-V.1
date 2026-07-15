import Link from 'next/link'
import Angelcare360InventoryMutationForm from '@/components/angelcare360/inventory/Angelcare360InventoryMutationForm'
import Angelcare360InventorySectionScreen from '@/components/angelcare360/inventory/Angelcare360InventorySectionScreen'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360InventoryContext, inventoryPrimaryLinkStyle } from '../_utils'
import { listAngelcare360InventoryItems, listAngelcare360InventoryMovements } from '@/lib/angelcare360/server/inventory'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventoryMovementsPage() {
  const context = await getAngelcare360InventoryContext()
  const items = await listAngelcare360InventoryItems({ schoolId: context.school.id })
  const movements = await listAngelcare360InventoryMovements({ schoolId: context.school.id })

  return (
    <section style={shellStyle}>
      <Angelcare360InventorySectionScreen title="Mouvements" description="Entrées, sorties, ajustements et pertes." actions={<Link href="/angelcare-360-command-center/inventaire" style={inventoryPrimaryLinkStyle}>Retour</Link>}>
        <Angelcare360InventoryMutationForm
          title="Créer un mouvement"
          description="Enregistrement réel d’un mouvement de stock."
          entity="movement"
          operation="create"
          submitLabel="Créer le mouvement"
          schoolId={context.school.id}
          fields={[
            { name: 'itemId', label: 'Article', kind: 'select', required: true, options: items.map((item) => ({ label: `${item.label} (${item.item_code})`, value: item.id })) },
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

        {movements.length > 0 ? (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Mouvement</th>
                  <th style={thStyle}>Article</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Quantité</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td style={tdStyle}>{movement.movement_code}</td>
                    <td style={tdStyle}>{movement.item_label || movement.item_code || '—'}</td>
                    <td style={tdStyle}>{movement.movement_type}</td>
                    <td style={tdStyle}>{movement.quantity}</td>
                    <td style={tdStyle}>{movement.movement_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Angelcare360EmptyState title="Aucun mouvement" description="Aucun mouvement de stock n’a encore été saisi." />
        )}
      </Angelcare360InventorySectionScreen>
    </section>
  )
}

const shellStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }
const thStyle: React.CSSProperties = { padding: '12px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#334155', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }
