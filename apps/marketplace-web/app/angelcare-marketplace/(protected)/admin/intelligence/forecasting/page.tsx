import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Forecasting & Scenario Lab" copy="Scénarios explicitement hypothétiques, assumptions visibles et aucune prédiction présentée comme vérité." items={await listMetricObservations(c,'forecasting')} links={[]}/>}
