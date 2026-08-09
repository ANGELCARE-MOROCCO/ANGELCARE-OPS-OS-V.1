import {ConversionBasketBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionBasketBoard'
import {listConversionBaskets} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');return <ConversionBasketBoard records={await listConversionBaskets(context,300)}/>}
