import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Territory Intelligence" copy="Demande, supply, capacité, localisation, risques et readiness par territoire isolé." items={await listMetricObservations(c,'territories')} links={[]}/>}
