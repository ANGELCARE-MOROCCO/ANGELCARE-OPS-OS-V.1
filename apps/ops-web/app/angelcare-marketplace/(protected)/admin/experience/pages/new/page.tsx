import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { CreatePageClient } from '@/angelcare-marketplace/experience-builder/components/CreatePageClient'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.cms.create')
  return <><PageHeader eyebrow="NEW EXPERIENCE" title="Créer une page gouvernée" description="La page naît en français, avec une identité de route stable, un propriétaire et un cycle de validation."/><CreatePageClient /></>
}
