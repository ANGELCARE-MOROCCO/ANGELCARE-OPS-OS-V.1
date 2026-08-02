import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');const sessions=(await listConversionSessions(context,{limit:400})).filter(row=>row.journey==='b2b_quotation'||row.journey==='quality_assessment'||row.priceSnapshot?.status==='quote_required');return <ConversionQueueBoard eyebrow="QUOTE & PROPOSAL AUTHORITY" title="Demandes de proposition et qualification" sessions={sessions}/>}
