import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="B2B Programme Fulfillment" eyebrow="ENTERPRISE DELIVERY CONTROL" description="Sites, milestones, dependencies, acceptance evidence and variation exposure." items={await listFulfillmentCases(c,{kind:'b2b_programme'})}/>}
