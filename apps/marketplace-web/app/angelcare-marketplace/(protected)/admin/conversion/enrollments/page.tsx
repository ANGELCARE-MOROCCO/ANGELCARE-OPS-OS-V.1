import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');return <ConversionQueueBoard eyebrow="ACADEMY ENROLLMENT CONTROL" title="Inscriptions — Academy Enrollment Control" sessions={await listConversionSessions(context,{journey:'academy_enrollment',limit:300})} mode="enrollments"/>}
