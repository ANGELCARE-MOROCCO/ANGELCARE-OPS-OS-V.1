import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ObjectDossier } from '@/angelcare-marketplace/sovereign-control/components/ObjectDossier'
import { getObjectDossier } from '@/angelcare-marketplace/sovereign-control/repository'

export default async function Page({ params }: { params: Promise<{ objectType: string; objectId: string }> }) {
  await requireMarketplacePageContext('marketplace.backoffice.objects.view')
  const { objectType, objectId } = await params
  const dossier = await getObjectDossier(objectType, objectId)
  return <ObjectDossier object={dossier.object} comments={dossier.comments} audit={dossier.audit} relations={dossier.relations} />
}
