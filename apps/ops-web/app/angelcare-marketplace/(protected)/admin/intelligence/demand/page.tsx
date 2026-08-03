import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Demand Intelligence" copy="Recherche, intérêt, intention et demande non satisfaite — sans compter le bruit comme du revenu." items={await listMetricObservations(c,'demand')} links={[]}/>}
