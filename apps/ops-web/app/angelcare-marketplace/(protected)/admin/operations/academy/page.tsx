import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Academy Fulfillment" eyebrow="LEARNING DELIVERY OPERATIONS" description="Seat, prerequisites, trainer readiness, attendance evidence, assessment and commercial closure." items={await listFulfillmentCases(c,{kind:'academy_delivery'})}/>}
