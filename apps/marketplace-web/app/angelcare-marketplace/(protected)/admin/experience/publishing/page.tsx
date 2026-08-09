import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { PublishingRunway } from '@/angelcare-marketplace/experience-builder/components/PublishingRunway'
import { listPublicationJobs } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.cms.view');return <><PageHeader eyebrow="PUBLISHING CONTROL" title="Runway de publication" description="Préflight, approbation, planification, publication, échec et rollback sans perte d’historique."/><PublishingRunway jobs={await listPublicationJobs()}/></>}
