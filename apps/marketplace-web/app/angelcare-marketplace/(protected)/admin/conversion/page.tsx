import {ConversionAdminCommand} from '@/angelcare-marketplace/conversion-universe/components/ConversionAdminCommand'
import {conversionAdminSummary,listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');const[summary,sessions]=await Promise.all([conversionAdminSummary(context),listConversionSessions(context,{limit:80})]);return <ConversionAdminCommand summary={summary} sessions={sessions}/>}
