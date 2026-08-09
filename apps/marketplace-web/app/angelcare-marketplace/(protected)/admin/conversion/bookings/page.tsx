import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');return <ConversionQueueBoard eyebrow="SERVICE BOOKING CONTROL" title="Bookings, disponibilité et handover famille" sessions={await listConversionSessions(context,{journey:'service_booking',limit:300})}/>}
