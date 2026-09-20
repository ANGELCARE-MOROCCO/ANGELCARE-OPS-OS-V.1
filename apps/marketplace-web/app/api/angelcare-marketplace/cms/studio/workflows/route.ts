import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { STUDIO_WORKFLOW_DESCRIPTORS } from '@/angelcare-marketplace/studio-workflows/registry'
export const dynamic='force-dynamic'
export async function GET(){await requireMarketplaceApiContext('marketplace.cms.view');return Response.json({data:STUDIO_WORKFLOW_DESCRIPTORS.map(row=>({id:row.id,label:row.label,description:row.description,execution:row.execution,actionId:row.actionId,targetRequired:row.targetRequired,targetSources:row.targetSources,canonicalEngine:row.canonicalEngine,creates:row.creates,adminDestination:row.adminDestination,authenticated:Boolean(row.authenticated),fields:row.fields,consentKeys:row.consentKeys}))},{headers:{'Cache-Control':'no-store'}})}
