import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { requireSocialCommandActor, requireSocialCommandRoutePermission, socialCommandSecurityHealth, socialError, socialOk } from "@/lib/social-command/auth"
import { decryptSecret, encryptSecret, randomState, socialCommandEncryptionHealth } from "@/lib/social-command/crypto"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"
import {
  auditSocial, completeMediaAsset, createBulkPlan, createCampaign, createJobsForPublication,
  createMediaPlaceholder, createOperation, createPublication, getActiveConnection, listCampaigns,
  listJobs, listMedia, listOperations, listPublications, replaceFutureJobs, updateOperation, updatePublication,
} from "@/lib/social-command/repository"
import { autoReconcileMetaWebhookSubscriptionsEnabled, buildMetaLoginUrl, cleanupExpiredMetaOAuthSessions, discoverMetaPages, exchangeMetaCode, getMetaGrantedScopes, inspectMetaWebhookSubscriptions, reconcileMetaWebhookSubscriptions, rotateStoredMetaSecrets, saveMetaConnection, verifyMetaConnection } from "@/lib/social-command/meta"
import { createUploadSession, deleteGatewayAsset, fetchGatewayAsset, fetchGatewayHealth } from "@/lib/social-command/storage"
import { processDueJobs, processExecutionJob } from "@/lib/social-command/publishing"
import { mz2Bootstrap } from "@/lib/social-command/mz2"
import { bulkConversationAction, getConversation, listComments, listConversations, listMentions, replyToComment, sendConversationReply, updateCommentState, updateConversationState } from "@/lib/social-command/engagement"
import { listAutomations, listAutomationRuns, processAutomationTick, runAutomation, updateAutomation } from "@/lib/social-command/automation"
import { aiUsageSummary, suggestDmReply } from "@/lib/social-command/ai"
import { capabilityMatrix, performanceSummary, reconcilePublishedProviderState, syncProviderMetrics } from "@/lib/social-command/intelligence"
import { processMetaWebhookPayload, recordRejectedWebhook, recordWebhookVerification, replayMetaWebhookEvent, runWebhookSignatureSelfTest, verifyMetaWebhookSignatureDetailed, verifyWebhookChallenge, webhookHealth } from "@/lib/social-command/webhook"
import type { BulkSlotDraft, SocialChannel, SocialFormat, SocialPublication } from "@/lib/social-command/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = { params: Promise<{ segments: string[] }> }

function pathKey(segments: string[]) { return segments.join("/") }
function hashState(value: string) { return crypto.createHash("sha256").update(value).digest("hex") }
function toDate(value: unknown) {
  const d = new Date(String(value || "")); if (Number.isNaN(d.getTime())) throw new Error("Date/heure invalide"); return d
}
function cleanPlatformVariants(value: unknown): NonNullable<BulkSlotDraft["platformVariants"]> {
  const raw=jsonObject(value); const out:NonNullable<BulkSlotDraft["platformVariants"]>={}
  for(const channel of ["facebook","instagram"] as SocialChannel[]){const v=jsonObject(raw[channel]);const caption=cleanString(v.caption,20000);const hashtags=stringArray(v.hashtags);if(caption||hashtags.length)out[channel]={...(caption?{caption}:{}),...(hashtags.length?{hashtags}: {})}}
  return out
}
function workerAuthorized(request: Request) {
  const configured = String(process.env.SOCIAL_COMMAND_WORKER_SECRET || "")
  const supplied = String(request.headers.get("x-social-command-worker-secret") || "")
  if (!configured || !supplied || configured.length !== supplied.length) return false
  return crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(supplied))
}
async function activeConnectionRaw() {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_connections").select("*").eq("status", "connected").order("connected_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data || null
}
async function bootstrap() {
  const [connection, assets, campaigns, publications, jobs, operations, storage, mz2] = await Promise.all([
    getActiveConnection(), listMedia(), listCampaigns(), listPublications(), listJobs(), listOperations(), fetchGatewayHealth(), mz2Bootstrap(),
  ])
  const today = new Date(); const y=today.getFullYear(), m=today.getMonth(), d=today.getDate();
  const from = new Date(y,m,d).getTime(), to = new Date(y,m,d+1).getTime()
  const isToday = (s:string|null) => { if(!s) return false; const t=new Date(s).getTime(); return t>=from&&t<to }
  const scopes=connection?.granted_scopes||[]
  const capabilities={
    facebookPublish:scopes.includes("pages_manage_posts"),
    facebookStory:false,
    instagramPublish:scopes.includes("instagram_content_publish"),
    instagramMessages:scopes.includes("instagram_manage_messages"),
  }
  const stats = {
    todayScheduled: publications.filter(p=>isToday(p.scheduled_at) && !["published","cancelled","archived"].includes(p.status)).length,
    todayPublished: publications.filter(p=>isToday(p.published_at)).length,
    processing: jobs.filter(j=>["preparing","publishing","confirming","retrying"].includes(j.status)).length,
    failed: jobs.filter(j=>j.status==="failed").length,
    stories: publications.filter(p=>p.format==="story").length,
    reels: publications.filter(p=>p.format==="reel").length,
    posts: publications.filter(p=>p.format==="post").length,
    carousels: publications.filter(p=>p.format==="carousel").length,
  }
  return { connection, capabilities, assets, campaigns, publications, jobs, operations, storage, stats, mz2 }
}

async function requireActor() {
  const auth = await requireSocialCommandActor(); if (!auth.ok) return auth; return auth
}

export async function GET(request: Request, context: RouteContext) {
  const { segments = [] } = await context.params
  const key = pathKey(segments)
  try {
    if (key === "meta/webhooks") {
      const challenge = verifyWebhookChallenge(new URL(request.url))
      if (!challenge) return new NextResponse("Webhook verification rejected", { status: 403 })
      await recordWebhookVerification()
      return new NextResponse(challenge, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } })
    }
    if (key === "meta/callback") {
      const url = new URL(request.url); const state = cleanString(url.searchParams.get("state"), 500); const code = cleanString(url.searchParams.get("code"), 5000)
      const auth = await requireActor(); if (!auth.ok) return auth.response
      const access = requireSocialCommandRoutePermission(auth.actor, "GET", "meta/connect"); if (!access.ok) return access.response
      if (!state || !code) throw new Error("Meta OAuth callback is incomplete")
      const db = await socialDb(); const { data: session, error } = await db.from("social_command_oauth_sessions").select("*").eq("state_hash", hashState(state)).eq("actor_user_id", auth.actor.id).maybeSingle()
      if (error || !session) throw new Error("Meta OAuth state is invalid or expired")
      if (new Date(session.expires_at).getTime() < Date.now()) throw new Error("Meta OAuth session expired")
      const exchanged = await exchangeMetaCode(code)
      const pages = await discoverMetaPages(exchanged.accessToken)
      await db.from("social_command_oauth_sessions").update({
        encrypted_user_token: encryptSecret(exchanged.accessToken), token_expires_in: exchanged.expiresIn || null,
        status: "authorized", metadata: { page_candidates: pages.map(p=>({id:p.id,name:p.name,tasks:p.tasks,instagram:p.instagram||p.instagram_business_account||null})) }, updated_at: nowIso(),
      }).eq("id", session.id)
      const base = cleanString(process.env.SOCIAL_COMMAND_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL, 1000).replace(/\/$/,"")
      return NextResponse.redirect(`${base}/social-command?universe=control&view=channels&oauthSession=${encodeURIComponent(session.id)}`)
    }

    const auth = await requireActor(); if (!auth.ok) return auth.response
    const access = requireSocialCommandRoutePermission(auth.actor, "GET", key); if (!access.ok) return access.response
    if (key === "bootstrap") return socialOk(await bootstrap())
    if (key === "media") return socialOk(await listMedia())
    if (key === "campaigns") return socialOk(await listCampaigns())
    if (key === "publications") return socialOk(await listPublications())
    if (key === "jobs") return socialOk(await listJobs())
    if (key === "operations") return socialOk(await listOperations())
    if (key === "control/audit") {
      const db=await socialDb(); const {data,error}=await db.from("social_command_audit_events").select("*").order("created_at",{ascending:false}).limit(250); if(error)throw error; return socialOk(data||[])
    }
    if (key === "meta/connect") {
      await cleanupExpiredMetaOAuthSessions().catch(() => ({ expired: 0 }))
      const state=randomState(); const db=await socialDb(); const id=crypto.randomUUID(); const now=nowIso()
      const {error}=await db.from("social_command_oauth_sessions").insert({id,state_hash:hashState(state),actor_user_id:auth.actor.id,status:"initiated",expires_at:new Date(Date.now()+15*60*1000).toISOString(),metadata:{},created_at:now,updated_at:now})
      if(error) throw error
      return socialOk({url:buildMetaLoginUrl(state),sessionId:id})
    }
    if (key === "meta/candidates") {
      const url=new URL(request.url); const sessionId=cleanString(url.searchParams.get("sessionId"),120); if(!sessionId) throw new Error("sessionId required")
      const db=await socialDb(); const {data,error}=await db.from("social_command_oauth_sessions").select("*").eq("id",sessionId).eq("actor_user_id",auth.actor.id).eq("status","authorized").maybeSingle(); if(error||!data) throw new Error("Authorized OAuth session not found")
      if(new Date(data.expires_at).getTime()<Date.now()) throw new Error("OAuth session expired")
      const token=decryptSecret(data.encrypted_user_token); const pages=await discoverMetaPages(token)
      return socialOk(pages.map(p=>({id:p.id,name:p.name,tasks:p.tasks,instagram:p.instagram||p.instagram_business_account||null})))
    }
    if (key === "meta/health") {
      const connection=await activeConnectionRaw(); if(!connection) return socialOk({connected:false,health:"disconnected"})
      try{const identity=await verifyMetaConnection(connection); const db=await socialDb(); await db.from("social_command_connections").update({connection_health:"healthy",last_verified_at:nowIso(),updated_at:nowIso()}).eq("id",connection.id); return socialOk({connected:true,health:"healthy",identity})}
      catch(error){const db=await socialDb(); await db.from("social_command_connections").update({connection_health:"unhealthy",last_verified_at:nowIso(),updated_at:nowIso()}).eq("id",connection.id); return socialOk({connected:true,health:"unhealthy",error:error instanceof Error?error.message:String(error)})}
    }
    if (key === "conversations") return socialOk(await listConversations())
    if (/^conversations\/[^/]+$/.test(key)) return socialOk(await getConversation(segments[1]))
    if (key === "comments") return socialOk(await listComments())
    if (key === "mentions") return socialOk(await listMentions())
    if (key === "automations") return socialOk(await listAutomations())
    if (key === "automation-runs") return socialOk(await listAutomationRuns())
    if (key === "control/capabilities") return socialOk(await capabilityMatrix())
    if (key === "control/webhook-health") return socialOk(await webhookHealth())
    if (key === "control/security-health") return socialOk({ ...socialCommandSecurityHealth(auth.actor), encryption: socialCommandEncryptionHealth() })
    if (key === "control/ai-usage") return socialOk(await aiUsageSummary())
    if (key === "intelligence/performance") return socialOk(await performanceSummary())
    if (key === "storage/health") return socialOk(await fetchGatewayHealth())
    return socialError("SOCIAL_COMMAND_ROUTE_NOT_FOUND",404,{path:key})
  } catch(error){ return socialError(error,500,{path:key}) }
}

export async function POST(request: Request, context: RouteContext) {
  const { segments = [] } = await context.params; const key=pathKey(segments)
  try {
    if (key === "meta/webhooks") {
      const rawBody = await request.text()
      const signature = request.headers.get("x-hub-signature-256")
      const signatureCheck = verifyMetaWebhookSignatureDetailed(rawBody, signature)
      if (!signatureCheck.valid) {
        await recordRejectedWebhook(rawBody, signatureCheck.reason, signatureCheck)
        return new NextResponse("Invalid webhook signature", { status: 401 })
      }
      let payload: Record<string, unknown>
      try { payload = JSON.parse(rawBody) as Record<string, unknown> }
      catch { await recordRejectedWebhook(rawBody, "invalid_json", signatureCheck); return new NextResponse("Invalid webhook payload", { status: 400 }) }
      return socialOk(await processMetaWebhookPayload(payload, rawBody))
    }
    if (key === "worker/tick") {
      if(!workerAuthorized(request)) return socialError("WORKER_UNAUTHORIZED",401)
      const body=await request.json().catch(()=>({})); const publishing=await processDueJobs(Math.max(1,Math.min(20,Number(body?.limit||8)))); let automation:unknown=null; try{automation=await processAutomationTick()}catch(error){automation={error:error instanceof Error?error.message:String(error)}}; return socialOk({publishing,automation})
    }
    const auth=await requireActor(); if(!auth.ok) return auth.response
    const access=requireSocialCommandRoutePermission(auth.actor,"POST",key); if(!access.ok) return access.response
    const body=await request.json().catch(()=>({})) as Record<string,unknown>

    if(key==="control/webhook-self-test"){const result=await runWebhookSignatureSelfTest();await auditSocial(auth.actor.id,"webhook.self_test","webhook",null,{ok:result.ok});return socialOk(result)}
    if(key==="control/webhook-subscriptions/inspect"){const connection=await activeConnectionRaw();if(!connection)throw new Error("No active Meta connection");const result=await inspectMetaWebhookSubscriptions(connection);await auditSocial(auth.actor.id,"webhook.subscriptions.inspect","connection",connection.id,{state:result.state});return socialOk(result)}
    if(key==="control/webhook-subscriptions/reconcile"){const connection=await activeConnectionRaw();if(!connection)throw new Error("No active Meta connection");const result=await reconcileMetaWebhookSubscriptions(connection);await auditSocial(auth.actor.id,"webhook.subscriptions.reconcile","connection",connection.id,{state:result.state,missingFields:result.missingFields});return socialOk(result)}
    if(key==="control/webhook-replay"){const eventId=cleanString(body.eventId,120);if(!eventId)throw new Error("eventId required");const result=await replayMetaWebhookEvent(eventId);await auditSocial(auth.actor.id,"webhook.replayed","webhook_event",eventId,{normalized:result.normalized,kind:result.kind});return socialOk(result)}
    if(key==="control/crypto-rotate"){const result=await rotateStoredMetaSecrets();await auditSocial(auth.actor.id,"crypto.tokens_rotated","social_command",null,result);return socialOk(result)}

    const conversationReply=/^conversations\/([^/]+)\/reply$/.exec(key)
    if(conversationReply){const result=await sendConversationReply(conversationReply[1],body.text,auth.actor.id);await auditSocial(auth.actor.id,"conversation.reply","conversation",conversationReply[1]);return socialOk(result)}
    const conversationState=/^conversations\/([^/]+)\/state$/.exec(key)
    if(conversationState){const result=await updateConversationState(conversationState[1],body,auth.actor.id);await auditSocial(auth.actor.id,"conversation.updated","conversation",conversationState[1],body);return socialOk(result)}
    if(key==="conversations/bulk"){const result=await bulkConversationAction(body,auth.actor.id);await auditSocial(auth.actor.id,"conversation.bulk","conversation",null,{count:Array.isArray(body.conversationIds)?body.conversationIds.length:0});return socialOk(result)}
    const commentReply=/^comments\/([^/]+)\/reply$/.exec(key)
    if(commentReply){const result=await replyToComment(commentReply[1],body.text,auth.actor.id);await auditSocial(auth.actor.id,"comment.reply","comment",commentReply[1]);return socialOk(result)}
    const commentState=/^comments\/([^/]+)\/state$/.exec(key)
    if(commentState){const result=await updateCommentState(commentState[1],body);await auditSocial(auth.actor.id,"comment.updated","comment",commentState[1],body);return socialOk(result)}
    const automationRun=/^automations\/([^/]+)\/run$/.exec(key)
    if(automationRun){const result=await runAutomation(automationRun[1],auth.actor.id,body);await auditSocial(auth.actor.id,"automation.run","automation",automationRun[1]);return socialOk(result)}
    if(key==="automations/cadence-proposal")return socialOk(await runAutomation("A07",auth.actor.id,body))
    if(key==="automation/tick")return socialOk(await processAutomationTick())
    if(key==="intelligence/sync")return socialOk(await syncProviderMetrics())
    if(key==="intelligence/reconcile")return socialOk(await reconcilePublishedProviderState(Number(body.limit||100)))
    if(key==="ai/adapt")return socialOk(await runAutomation("A06",auth.actor.id,body))
    if(key==="ai/dm-suggest")return socialOk(await suggestDmReply(body,auth.actor.id))

    if (key === "meta/finalize") {
      const sessionId=cleanString(body.sessionId,120), pageId=cleanString(body.pageId,200); if(!sessionId||!pageId) throw new Error("sessionId and pageId are required")
      const db=await socialDb(); const {data:session,error}=await db.from("social_command_oauth_sessions").select("*").eq("id",sessionId).eq("actor_user_id",auth.actor.id).eq("status","authorized").maybeSingle(); if(error||!session) throw new Error("Authorized OAuth session not found")
      const token=decryptSecret(session.encrypted_user_token); const pages=await discoverMetaPages(token); const page=pages.find(p=>p.id===pageId); if(!page) throw new Error("Selected Meta Page is no longer available")
      const scopes=await getMetaGrantedScopes(token); const connection=await saveMetaConnection({actorUserId:auth.actor.id,userToken:token,userTokenExpiresIn:Number(session.token_expires_in||0),page,grantedScopes:scopes})
      await db.from("social_command_oauth_sessions").update({status:"completed",completed_at:nowIso(),encrypted_user_token:null,updated_at:nowIso()}).eq("id",sessionId)
      const caps=[
        ["facebook","post",scopes.includes("pages_manage_posts")],["facebook","reel",scopes.includes("pages_manage_posts")],["facebook","story",false],
        ["instagram","post",scopes.includes("instagram_content_publish")],["instagram","carousel",scopes.includes("instagram_content_publish")],["instagram","reel",scopes.includes("instagram_content_publish")],["instagram","story",scopes.includes("instagram_content_publish")],
        ["instagram","messages",scopes.includes("instagram_manage_messages")],
      ]
      for(const [channel,capability,supported] of caps){await db.from("social_command_channel_capabilities").upsert({connection_id:connection.id,channel,capability,supported,source:"meta_scope",reason:supported?null:(channel==="facebook"&&capability==="story"?"No verified Facebook Page Story adapter in MZ1":"Required permission is not granted"),checked_at:nowIso()},{onConflict:"connection_id,channel,capability"})}
      let webhookSubscriptions:unknown=null
      if(autoReconcileMetaWebhookSubscriptionsEnabled()&&connection.instagram_business_id){try{const active=await activeConnectionRaw();if(!active)throw new Error("Active Meta connection could not be reloaded after authorization");webhookSubscriptions=await reconcileMetaWebhookSubscriptions(active)}catch(error){webhookSubscriptions={state:"degraded",error:error instanceof Error?error.message:String(error)}}}
      await auditSocial(auth.actor.id,"meta.connected","connection",connection.id,{pageId:connection.facebook_page_id,instagram:connection.instagram_username,scopes,webhookSubscriptions})
      return socialOk({connection,webhookSubscriptions})
    }
    if (key === "meta/disconnect") {
      const db=await socialDb(); const connection=await activeConnectionRaw(); if(!connection) return socialOk({disconnected:false})
      await db.from("social_command_connections").update({status:"disconnected",connection_health:"disconnected",encrypted_user_token:null,encrypted_page_token:null,disconnected_at:nowIso(),updated_at:nowIso()}).eq("id",connection.id)
      await auditSocial(auth.actor.id,"meta.disconnected","connection",connection.id); return socialOk({disconnected:true})
    }
    if (key === "media/upload-session") {
      const filename=cleanString(body.filename,180), mimeType=cleanString(body.mimeType,120), sizeBytes=Math.max(0,Number(body.sizeBytes||0)); if(!filename||!mimeType) throw new Error("filename and mimeType required")
      const maxBytes=Math.max(sizeBytes,1); const asset=await createMediaPlaceholder({filename,mimeType,sizeBytes,actorUserId:auth.actor.id}); const upload=createUploadSession({assetId:asset.id,filename,mimeType,maxBytes,actorUserId:auth.actor.id})
      await auditSocial(auth.actor.id,"media.upload_session","media_asset",asset.id,{filename,mimeType,sizeBytes}); return socialOk({asset,upload})
    }
    if (key === "media/complete") {
      const assetId=cleanString(body.assetId,120); if(!assetId) throw new Error("assetId required"); const gateway=await fetchGatewayAsset(assetId); const asset=await completeMediaAsset(assetId,gateway); await auditSocial(auth.actor.id,"media.ready","media_asset",assetId,{sizeBytes:asset.size_bytes}); return socialOk(asset)
    }
    if (key === "campaigns") {const c=await createCampaign(body,auth.actor.id); await auditSocial(auth.actor.id,"campaign.created","campaign",c.id); return socialOk(c,{status:201})}
    if (key === "publications") {const p=await createPublication(body,auth.actor.id); await auditSocial(auth.actor.id,"publication.created","publication",p.id,{format:p.format,channels:p.channels}); return socialOk(p,{status:201})}

    const pubAction=/^publications\/([^/]+)\/(schedule|publish)$/.exec(key)
    if(pubAction){
      const id=pubAction[1], action=pubAction[2]; const db=await socialDb(); const {data,error}=await db.from("social_command_publications").select("*").eq("id",id).single(); if(error||!data) throw new Error("Publication not found")
      const due=action==="publish"?new Date():toDate(body.scheduledAt||data.scheduled_at); const status=action==="publish"?"queued":"scheduled"
      const publication=await updatePublication(id,{status,scheduledAt:due.toISOString()})
      await db.from("social_command_schedules").delete().eq("publication_id",id).eq("status","active")
      if(action==="schedule") await db.from("social_command_schedules").insert({publication_id:id,scheduled_at:due.toISOString(),timezone:cleanString(body.timezone,100)||"Africa/Casablanca",status:"active",created_by:auth.actor.id,created_at:nowIso(),updated_at:nowIso()})
      const jobs=await replaceFutureJobs(publication,due.toISOString()); await auditSocial(auth.actor.id,`publication.${action}`,"publication",id,{dueAt:due.toISOString(),jobs:jobs.length}); return socialOk({publication,jobs})
    }

    if (key === "bulk-plans") {
      const slots=Array.isArray(body.slots)?body.slots:[]; if(!slots.length) throw new Error("Bulk plan requires at least one slot")
      const cleanSlots:BulkSlotDraft[]=slots.slice(0,500).map((raw:any,index)=>({slotNo:Number(raw.slotNo||index+1),format:(raw.format||body.format||"story") as SocialFormat,channels:(Array.isArray(raw.channels)?raw.channels:body.channels||[]).filter((v:any)=>v==="facebook"||v==="instagram") as SocialChannel[],scheduledAt:toDate(raw.scheduledAt).toISOString(),caption:cleanString(raw.caption,20000),hashtags:stringArray(raw.hashtags),assetIds:stringArray(raw.assetIds).slice(0,10),title:cleanString(raw.title,260)||`Création ${index+1}`,platformVariants:cleanPlatformVariants(raw.platformVariants||raw.platform_variants),internalTags:stringArray(raw.internalTags||raw.internal_tags)}))
      const result=await createBulkPlan({title:cleanString(body.title,260)||`Plan massif ${cleanSlots.length}`,format:(body.format||cleanSlots[0].format) as SocialFormat,channels:(body.channels||cleanSlots[0].channels) as SocialChannel[],slots:cleanSlots,campaignId:cleanString(body.campaignId,120)||null,actorUserId:auth.actor.id}); await auditSocial(auth.actor.id,"bulk_plan.created","bulk_plan",result.id,{slots:cleanSlots.length}); return socialOk(result,{status:201})
    }
    if (/^bulk-plans\/[^/]+\/apply$/.test(key)) {
      const planId=segments[1]; const db=await socialDb(); const {data:plan,error}=await db.from("social_command_bulk_plans").select("*").eq("id",planId).single(); if(error||!plan) throw new Error("Bulk plan not found")
      const {data:slots,error:slotErr}=await db.from("social_command_bulk_slots").select("*").eq("bulk_plan_id",planId).order("slot_no",{ascending:true}); if(slotErr)throw slotErr
      const operation=await createOperation({type:"bulk_schedule",label:`Planification de ${(slots||[]).length} créations`,actorUserId:auth.actor.id,totalItems:(slots||[]).length,metadata:{bulkPlanId:planId}})
      await updateOperation(operation.id,{status:"processing",progress:5,current_step:"Création des publications"} as any)
      const results=[] as any[]; let done=0,failed=0
      for(const slot of slots||[]){
        try{
          const pub=await createPublication({title:slot.title,format:slot.format,channels:slot.channels,caption:slot.caption,hashtags:slot.hashtags,campaignId:plan.campaign_id,assetIds:slot.asset_ids,platformVariants:slot.platform_variants,internalTags:slot.internal_tags,scheduledAt:slot.scheduled_at,status:"scheduled",metadata:{bulkPlanId:planId,bulkSlotId:slot.id}},auth.actor.id)
          await replaceFutureJobs(pub,slot.scheduled_at); await db.from("social_command_schedules").insert({publication_id:pub.id,scheduled_at:slot.scheduled_at,timezone:"Africa/Casablanca",status:"active",created_by:auth.actor.id,created_at:nowIso(),updated_at:nowIso()}); await db.from("social_command_bulk_slots").update({status:"applied",publication_id:pub.id,updated_at:nowIso()}).eq("id",slot.id); results.push(pub);done++
        }catch(e){failed++}
        await updateOperation(operation.id,{status:"processing",progress:Math.min(98,Math.round(((done+failed)/(slots||[]).length)*95)),current_step:`${done+failed}/${(slots||[]).length} traités`,completed_items:done,failed_items:failed} as any)
      }
      await db.from("social_command_bulk_plans").update({status:failed?"validated":"applied",updated_at:nowIso()}).eq("id",planId)
      await updateOperation(operation.id,failed?{status:"failed",progress:100,current_step:"Terminé avec erreurs",completed_items:done,failed_items:failed,error_message:`${failed} création(s) en échec`} as any:{status:"completed",progress:100,current_step:"Planification terminée",completed_items:done,failed_items:0} as any)
      await auditSocial(auth.actor.id,"bulk_plan.applied","bulk_plan",planId,{done,failed}); return socialOk({operationId:operation.id,done,failed,publications:results})
    }

    if (key === "calendar/bulk") {
      const ids=stringArray(body.publicationIds); const shiftDays=Number(body.shiftDays||0); const fixedTime=cleanString(body.fixedTime,20); if(!ids.length) throw new Error("No publications selected")
      const db=await socialDb(); const {data,error}=await db.from("social_command_publications").select("*").in("id",ids); if(error)throw error
      let updated=0
      for(const raw of data||[]){if(!raw.scheduled_at)continue;const dt=new Date(raw.scheduled_at);if(shiftDays)dt.setDate(dt.getDate()+shiftDays);if(/^\d{2}:\d{2}$/.test(fixedTime)){const[h,m]=fixedTime.split(':').map(Number);dt.setHours(h,m,0,0)};const pub=await updatePublication(raw.id,{scheduledAt:dt.toISOString()});await db.from("social_command_schedules").update({scheduled_at:dt.toISOString(),updated_at:nowIso()}).eq("publication_id",raw.id).eq("status","active");await db.from("social_command_execution_jobs").update({due_at:dt.toISOString(),next_attempt_at:dt.toISOString(),updated_at:nowIso()}).eq("publication_id",raw.id).in("status",["queued","retrying"]);updated++;await auditSocial(auth.actor.id,"publication.rescheduled","publication",raw.id,{scheduledAt:dt.toISOString()})}
      return socialOk({updated})
    }

    const jobAction=/^jobs\/([^/]+)\/(retry|cancel|reschedule|execute)$/.exec(key)
    if(jobAction){
      const db=await socialDb(); const id=jobAction[1],action=jobAction[2]
      if(action==="retry"){await db.from("social_command_execution_jobs").update({status:"retrying",next_attempt_at:nowIso(),locked_at:null,last_error:null,updated_at:nowIso()}).eq("id",id);await auditSocial(auth.actor.id,"job.retry","execution_job",id);return socialOk({id,status:"retrying"})}
      if(action==="cancel"){await db.from("social_command_execution_jobs").update({status:"cancelled",locked_at:null,updated_at:nowIso()}).eq("id",id);await auditSocial(auth.actor.id,"job.cancel","execution_job",id);return socialOk({id,status:"cancelled"})}
      if(action==="reschedule"){const due=toDate(body.scheduledAt).toISOString();await db.from("social_command_execution_jobs").update({status:"queued",due_at:due,next_attempt_at:due,locked_at:null,updated_at:nowIso()}).eq("id",id);await auditSocial(auth.actor.id,"job.reschedule","execution_job",id,{due});return socialOk({id,status:"queued",dueAt:due})}
      const result=await processExecutionJob(id); await auditSocial(auth.actor.id,"job.execute","execution_job",id); return socialOk(result)
    }
    return socialError("SOCIAL_COMMAND_ROUTE_NOT_FOUND",404,{path:key})
  } catch(error){return socialError(error,500,{path:key})}
}

export async function PATCH(request: Request, context: RouteContext) {
  const {segments=[]}=await context.params; const key=pathKey(segments)
  try{const auth=await requireActor();if(!auth.ok)return auth.response;const access=requireSocialCommandRoutePermission(auth.actor,"PATCH",key);if(!access.ok)return access.response;const body=await request.json().catch(()=>({})) as Record<string,unknown>
    const automation=/^automations\/([^/]+)$/.exec(key);if(automation){const a=await updateAutomation(automation[1],body,auth.actor.id);await auditSocial(auth.actor.id,"automation.updated","automation",a.id);return socialOk(a)}
    const conversation=/^conversations\/([^/]+)$/.exec(key);if(conversation){const c=await updateConversationState(conversation[1],body,auth.actor.id);await auditSocial(auth.actor.id,"conversation.updated","conversation",conversation[1]);return socialOk(c)}
    const comment=/^comments\/([^/]+)$/.exec(key);if(comment){const c=await updateCommentState(comment[1],body);await auditSocial(auth.actor.id,"comment.updated","comment",comment[1]);return socialOk(c)}
    const pub=/^publications\/([^/]+)$/.exec(key);if(pub){const p=await updatePublication(pub[1],body);await auditSocial(auth.actor.id,"publication.updated","publication",p.id);return socialOk(p)}
    return socialError("SOCIAL_COMMAND_ROUTE_NOT_FOUND",404,{path:key})
  }catch(error){return socialError(error,500,{path:key})}
}

export async function DELETE(request: Request, context: RouteContext) {
  const {segments=[]}=await context.params; const key=pathKey(segments)
  try{const auth=await requireActor();if(!auth.ok)return auth.response;const access=requireSocialCommandRoutePermission(auth.actor,"DELETE",key);if(!access.ok)return access.response;const media=/^media\/([^/]+)$/.exec(key);if(media){const db=await socialDb();const id=media[1];await deleteGatewayAsset(id);await db.from("social_command_media_assets").update({status:"deleted",archived_at:nowIso()}).eq("id",id);await auditSocial(auth.actor.id,"media.deleted","media_asset",id);return socialOk({deleted:true,id})}return socialError("SOCIAL_COMMAND_ROUTE_NOT_FOUND",404,{path:key})}catch(error){return socialError(error,500,{path:key})}
}
