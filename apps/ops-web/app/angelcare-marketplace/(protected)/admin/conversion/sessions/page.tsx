import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import type {ConversionJourney,ConversionStatus} from '@/angelcare-marketplace/conversion-universe/types'
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const context=await requireMarketplacePageContext('marketplace.conversion.view');const query=await searchParams;const journey=first(query.journey) as ConversionJourney|undefined;const status=first(query.status) as ConversionStatus|undefined;return <ConversionQueueBoard eyebrow="CONVERSION SESSION REGISTRY" title="Sessions, étapes et handovers" sessions={await listConversionSessions(context,{journey,status,limit:300})}/>}
