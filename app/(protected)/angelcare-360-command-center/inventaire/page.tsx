import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360InventoryHub from '@/components/angelcare360/inventory/Angelcare360InventoryHub'
import Angelcare360InventoryPageShell from '@/components/angelcare360/inventory/Angelcare360InventoryPageShell'
import { ANGELCARE360_INVENTORY_NAVIGATION } from '@/data/angelcare360/inventory-navigation'
import { getAngelcare360InventoryOverview } from '@/lib/angelcare360/server/inventory'
import { getAngelcare360InventoryContext, inventoryBadgeStyle, inventoryPrimaryLinkStyle, inventorySecondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InventairePage() {
  const context = await getAngelcare360InventoryContext()
  const overview = await getAngelcare360InventoryOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue inventaire indisponible"
        description="Aucune donnée active n’a pu être résolue pour alimenter le cockpit inventaire."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Articles: ${overview.itemCount}`} />
      <Badge label={`Stock bas: ${overview.lowStockCount}`} />
    </>
  )

  return (
    <Angelcare360InventoryPageShell
      title="Bibliothèque & Inventaire"
      subtitle="Le cockpit inventaire suit les catégories, articles, quantités et mouvements sans export simulé ni lecture code-barres fictive."
      badge="Phase 11"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle inventaire prêt'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_INVENTORY_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/inventaire/articles" style={inventoryPrimaryLinkStyle}>Voir les articles</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/inventaire/audit" style={inventorySecondaryLinkStyle}>Audit inventaire</Link>}
    >
      <Angelcare360InventoryHub overview={overview} />
    </Angelcare360InventoryPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={inventoryBadgeStyle}>{label}</span>
}
