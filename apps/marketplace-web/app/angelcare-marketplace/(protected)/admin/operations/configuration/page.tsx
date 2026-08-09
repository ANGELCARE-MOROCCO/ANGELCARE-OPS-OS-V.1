import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Operations Configuration" eyebrow="GOVERNED POLICY CONTROL" description="Policies remain persistent, approved and audited. Operational data is never hard-coded." items={await listFulfillmentCases(c,{})}/>}
