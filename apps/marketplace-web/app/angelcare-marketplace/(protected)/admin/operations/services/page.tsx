import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Service Fulfillment" eyebrow="FAMILY & HOME SERVICE EXECUTION" description="Provider acceptance, readiness, brief, mission evidence, quality and payable eligibility." items={await listFulfillmentCases(c,{kind:'family_service'})}/>}
