import {ConversionQueueBoard} from '@/angelcare-marketplace/conversion-universe/components/ConversionQueueBoard'
import {listConversionSessions} from '@/angelcare-marketplace/conversion-universe/repository'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.conversion.view');const sessions=(await listConversionSessions(context,{limit:400})).filter(row=>row.status==='expired'||(Date.now()-new Date(row.last_activity_at).getTime()>24*60*60*1000&&!['confirmed','cancelled'].includes(row.status)));return <ConversionQueueBoard eyebrow="ABANDONMENT & RECOVERY" title="Parcours abandonnés et expirés" sessions={sessions} mode="abandonment"/>}
