import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Conversion Intelligence" copy="De la découverte à l’outcome canonique, chaque abandon et chaque validation restent explicables." items={await listMetricObservations(c,'conversion')} links={[]}/>}
