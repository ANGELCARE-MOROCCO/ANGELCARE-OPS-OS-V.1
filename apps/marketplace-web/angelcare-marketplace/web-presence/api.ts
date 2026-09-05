import { NextResponse } from 'next/server'
import { hasMarketplacePermission, requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import type { MarketplacePermission } from '@/angelcare-marketplace/domain/types'
import { parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { createWebPresenceDraft, getWebPresenceSnapshot, publishWebPresence, rollbackWebPresence, updateWebPresenceDraft, validateWebPresenceDraft, webPresenceHistory } from './repository'
import { parseScope, WebPresenceInputError } from './schema'
import { verifyLiveWebPresence } from './verification'

export type WebPresenceVersionRouteContext = {
  params: Promise<{ versionId: string }>
}

const WEB_PRESENCE_VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function routeVersionId(context: WebPresenceVersionRouteContext) {
  const { versionId } = await context.params
  if (typeof versionId !== 'string' || !WEB_PRESENCE_VERSION_ID.test(versionId)) {
    throw new WebPresenceInputError('PUBLICATION_BLOCKED', 'Identifiant de révision Web Presence invalide.', 400)
  }
  return versionId
}

function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).host===(request.headers.get('x-forwarded-host')||request.headers.get('host')||new URL(request.url).host).split(',')[0].trim()}catch{return false}}
async function contextFor(permission:MarketplacePermission){const value=await requireMarketplaceApiContext(permission);if(!hasMarketplacePermission(value,permission))throw new WebPresenceInputError('PERMISSION_DENIED','Permission Web Presence requise.',403);return value}
function failure(error:unknown,rid:string){if(error instanceof WebPresenceInputError)return NextResponse.json({error:{code:error.code,message:error.message,...(error.field?{field:error.field}:{})},requestId:rid},{status:error.status});return NextResponse.json({error:{code:'PUBLICATION_BLOCKED',message:'L’opération Web Presence n’a pas pu être exécutée.'},requestId:rid},{status:500})}
async function body(request:Request){if(!sameOrigin(request))throw new WebPresenceInputError('PERMISSION_DENIED','Origine de requête refusée.',403);return parseJsonObject(request)}
export async function getWorkspace(request:Request){const rid=requestId(request);try{await contextFor('marketplace.web_presence.view');const scope=parseScope(new URL(request.url).searchParams.get('scope'));return NextResponse.json({data:await getWebPresenceSnapshot(scope),requestId:rid})}catch(error){return failure(error,rid)}}
export async function getHistory(request:Request){const rid=requestId(request);try{await contextFor('marketplace.web_presence.view');const scope=parseScope(new URL(request.url).searchParams.get('scope'));return NextResponse.json({data:await webPresenceHistory(scope),requestId:rid})}catch(error){return failure(error,rid)}}
export async function postDraft(request:Request){const rid=requestId(request);try{const payload=await body(request),ctx=await contextFor('marketplace.web_presence.manage'),scope=parseScope(payload.scope),version=await createWebPresenceDraft(scope,ctx,rid,String(payload.changeSummary||''),request);return NextResponse.json({data:{requestId:rid,profileId:version.profileId,versionId:version.id,revision:version.versionNumber,result:'DRAFT_CREATED',affectedScopes:[scope],affectedRoutes:(await getWebPresenceSnapshot(scope)).affectedRoutes,version},requestId:rid},{status:201})}catch(error){return failure(error,rid)}}
export async function patchDraft(request:Request,context:WebPresenceVersionRouteContext){const rid=requestId(request);try{const payload=await body(request),ctx=await contextFor('marketplace.web_presence.manage'),versionId=await routeVersionId(context),version=await updateWebPresenceDraft(versionId,Number(payload.expectedRevision),payload.configuration,String(payload.changeSummary||''),ctx,rid,request),snapshot=await getWebPresenceSnapshot(parseScope(payload.scope));return NextResponse.json({data:{requestId:rid,profileId:version.profileId,versionId:version.id,revision:version.versionNumber,result:'DRAFT_SAVED',affectedScopes:[snapshot.profile.scopeKey],affectedRoutes:snapshot.affectedRoutes,version},requestId:rid})}catch(error){return failure(error,rid)}}
export async function validateDraft(request:Request,context:WebPresenceVersionRouteContext){const rid=requestId(request);try{await body(request);const ctx=await contextFor('marketplace.web_presence.manage'),versionId=await routeVersionId(context),version=await validateWebPresenceDraft(versionId,ctx,rid,request),snapshot=await getWebPresenceSnapshot((await profileScope(version.profileId)));return NextResponse.json({data:{requestId:rid,profileId:version.profileId,versionId:version.id,revision:version.versionNumber,result:version.validationResult?.valid?'VALIDATED':'VALIDATION_FAILED',affectedScopes:[snapshot.profile.scopeKey],affectedRoutes:snapshot.affectedRoutes,version},requestId:rid},{status:version.validationResult?.valid?200:422})}catch(error){return failure(error,rid)}}
async function profileScope(profileId:string){const {createServiceClient}=await import('@/lib/supabase/server');const db=await createServiceClient(),result=await db.from('angelcare_marketplace_web_presence_profiles').select('scope_key').eq('id',profileId).single();return parseScope(result.data?.scope_key)}
export async function publishDraft(request:Request,context:WebPresenceVersionRouteContext){const rid=requestId(request);try{const payload=await body(request),ctx=await contextFor('marketplace.web_presence.publish'),versionId=await routeVersionId(context);return NextResponse.json({data:await publishWebPresence(versionId,Number(payload.expectedCurrentRevision||0),ctx,rid,request),requestId:rid})}catch(error){return failure(error,rid)}}
export async function postRollback(request:Request){const rid=requestId(request);try{const payload=await body(request),ctx=await contextFor('marketplace.web_presence.rollback');return NextResponse.json({data:await rollbackWebPresence(parseScope(payload.scope),String(payload.sourceVersionId||''),Number(payload.expectedCurrentRevision||0),String(payload.reason||''),ctx,rid,request),requestId:rid})}catch(error){return failure(error,rid)}}
export async function postVerify(request:Request){const rid=requestId(request);try{const payload=await body(request),ctx=await contextFor('marketplace.web_presence.verify');return NextResponse.json({data:await verifyLiveWebPresence(parseScope(payload.scope),ctx,rid,request),requestId:rid})}catch(error){return failure(error,rid)}}
