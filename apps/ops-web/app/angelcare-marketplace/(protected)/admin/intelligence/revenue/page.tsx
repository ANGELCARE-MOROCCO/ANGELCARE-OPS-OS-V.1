import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {AuthorityWorkspace} from '@/angelcare-marketplace/final-authority/components/AuthorityWorkspace'
import {listMetricObservations} from '@/angelcare-marketplace/final-authority/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.intelligence.view');return <AuthorityWorkspace eyebrow="FINAL MARKETPLACE AUTHORITY" title="Revenue & Leakage Intelligence" copy="Influence commerciale, exposition, remboursements, payables et fuites reliés aux autorités Finance." items={await listMetricObservations(c,'revenue')} links={[]}/>}
