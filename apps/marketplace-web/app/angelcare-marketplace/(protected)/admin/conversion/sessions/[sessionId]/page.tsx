import {notFound} from 'next/navigation'
import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {getConversionAdminSession} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page({params}:{params:Promise<{sessionId:string}>}){const context=await requireMarketplacePageContext('marketplace.conversion.view');const session=await getConversionAdminSession(context,(await params).sessionId);if(!session)notFound();return <ConversionQueueBoard eyebrow="CONVERSION DOSSIER 360" title={session.public_reference} sessions={[session]}/>}
