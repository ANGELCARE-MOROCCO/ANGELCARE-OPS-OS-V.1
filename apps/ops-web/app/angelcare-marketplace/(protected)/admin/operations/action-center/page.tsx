import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {OperationsQueuePage} from '@/angelcare-marketplace/operations-reconciliation/components/OperationsQueuePage'
import {listFulfillmentCases} from '@/angelcare-marketplace/operations-reconciliation/repository'
export default async function Page(){const c=await requireMarketplacePageContext('marketplace.operations.view');return <OperationsQueuePage title="Action Center" eyebrow="LIVE OPERATING PRIORITIES" description="Acceptations, blocages, preuves, quality review, reconciliation et retards n\u00e9cessitant une d\u00e9cision." items={await listFulfillmentCases(c,{})}/>}
