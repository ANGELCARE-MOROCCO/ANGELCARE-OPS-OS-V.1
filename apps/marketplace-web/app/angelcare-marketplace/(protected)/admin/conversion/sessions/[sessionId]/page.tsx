import {notFound} from 'next/navigation'
import {ConversionSessionDossier} from '@/angelcare-marketplace/conversion-universe/components/ConversionSessionDossier'
import {getConversionAdminSession, listConversionEvidence} from '@/angelcare-marketplace/conversion-universe/repository'
import {hasMarketplacePermission, requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'

export default async function Page({params}:{params:Promise<{sessionId:string}>}) {
  const context = await requireMarketplacePageContext('marketplace.conversion.view')
  const sessionId = (await params).sessionId
  const [session, holds, consents, exceptions] = await Promise.all([
    getConversionAdminSession(context, sessionId),
    listConversionEvidence(context, 'holds', 500),
    listConversionEvidence(context, 'consents', 500),
    listConversionEvidence(context, 'exceptions', 500),
  ])
  if (!session) notFound()
  return <ConversionSessionDossier initialSession={session} evidence={[...holds, ...consents, ...exceptions]} canRecover={hasMarketplacePermission(context, 'marketplace.conversion.recover')}/>
}
