import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Quality Check Fulfillment" eyebrow="ASSESSMENT EXECUTION CONTROL" description="Evidence readiness, assessor allocation, findings, report and corrective-action handover." items={await listFulfillmentCases(c,{kind:'quality_assessment'})}/>}
