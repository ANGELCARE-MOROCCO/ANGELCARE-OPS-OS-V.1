import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb } from "@/lib/social-command/db"
import { facebookRuntimeMZ7 } from "@/lib/social-command/facebook-mz7"
import { persistFacebookCommentChangeMZ7, persistFacebookMessageMZ7 } from "@/lib/social-command/facebook-webhook-mz7"
import { instagramWebhookConfig } from "@/lib/social-command/instagram-webhook"
import { bindEntityToRelationshipMZ7, ensureRelationshipIdentityMZ7, recordJourneyEventMZ7 } from "@/lib/social-command/relationship-mz7"

export type MZ7HistoryProvider = "facebook" | "instagram"
export type MZ7HistoryKind = "conversations" | "comments"
export type MZ7HistoryMode = "discover" | "import"

type PageResult = { data: any[]; paging?: { next?: string; cursors?: { after?: string } }; [key: string]: any }

function normalizeUrl(value: string, expectedHost: string) {
  const url = new URL(value)
  if (url.hostname !== expectedHost) throw new Error(`Provider pagination host mismatch: ${url.hostname}`)
  return url
}

async function providerJson(url: URL, token: string) {
  const response = await fetch(url, { cache: "no-store", headers: { authorization: `Bearer ${token}`, accept: "application/json" } })
  const text = await response.text().catch(() => "")
  let payload: any = null; try { payload = text ? JSON.parse(text) : null } catch {}
  const err = payload?.error
  if (!response.ok || err) throw new Error(cleanString(err?.message || payload?.error_description || `Provider HTTP ${response.status}`, 2000))
  return payload || {}
}

async function createRun(provider: MZ7HistoryProvider, kind: MZ7HistoryKind, mode: MZ7HistoryMode, actorUserId: string) {
  const db = await socialDb(), id = crypto.randomUUID(), started = nowIso()
  const { error } = await db.from("social_command_history_sync_runs").insert({ id, provider, sync_kind: kind, mode, status: "running", discovered_count: 0, imported_count: 0, skipped_count: 0, failed_count: 0, provider_limited_count: 0, started_at: started, actor_user_id: actorUserId, details: {}, created_at: started, updated_at: started })
  if (error) throw error
  return id
}

async function finishRun(id: string, patch: Record<string, unknown>) {
  const db = await socialDb()
  await db.from("social_command_history_sync_runs").update({ ...patch, completed_at: nowIso(), updated_at: nowIso() }).eq("id", id)
}

async function checkpoint(provider: MZ7HistoryProvider, kind: MZ7HistoryKind, cursor: string | null, metadata: Record<string, unknown> = {}) {
  const db = await socialDb(), now = nowIso()
  const { data: existing } = await db.from("social_command_history_sync_checkpoints").select("id").eq("provider", provider).eq("sync_kind", kind).maybeSingle()
  const row = { provider, sync_kind: kind, cursor, last_success_at: now, metadata, updated_at: now }
  if (existing?.id) await db.from("social_command_history_sync_checkpoints").update(row).eq("id", existing.id)
  else await db.from("social_command_history_sync_checkpoints").insert({ id: crypto.randomUUID(), ...row, created_at: now })
}

async function pageThrough(start: URL, token: string, host: string, maxPages: number, maxRows: number) {
  const rows: any[] = [], pages: Array<{ count: number; next: string | null }> = []
  let url: URL | null = start, page = 0, lastCursor: string | null = null
  while (url && page < maxPages && rows.length < maxRows) {
    const payload: PageResult = await providerJson(url, token)
    const data = Array.isArray(payload.data) ? payload.data : []
    rows.push(...data.slice(0, Math.max(0, maxRows - rows.length)))
    const next = cleanString(payload.paging?.next, 4000) || null
    lastCursor = cleanString(payload.paging?.cursors?.after, 2000) || lastCursor
    pages.push({ count: data.length, next })
    url = next ? normalizeUrl(next, host) : null
    page += 1
  }
  return { rows, pages, cursor: lastCursor, truncated: Boolean(url) || rows.length >= maxRows }
}

async function importInstagramConversation(conversation: any, token: string, accountId: string, graphVersion: string) {
  const db = await socialDb(), conversationId = cleanString(conversation.id, 500)
  if (!conversationId) return { imported: 0, skipped: 1 }
  const detailUrl = new URL(`https://graph.instagram.com/${graphVersion}/${encodeURIComponent(conversationId)}`)
  detailUrl.searchParams.set("fields", "participants,messages.limit(50){id,created_time,from,to,message,attachments}")
  const detail = await providerJson(detailUrl, token)
  const participants = Array.isArray(detail.participants?.data) ? detail.participants.data : Array.isArray(detail.participants) ? detail.participants : []
  const other = participants.find((p: any) => cleanString(p?.id, 500) !== accountId) || participants[0] || null
  const messages = Array.isArray(detail.messages?.data) ? detail.messages.data : []
  const participantId = cleanString(other?.id, 500) || cleanString(messages.find((m: any) => cleanString(m?.from?.id,500)!==accountId)?.from?.id, 500)
  if (!participantId) return { imported: 0, skipped: 1 }
  const identity = await ensureRelationshipIdentityMZ7({ provider: "instagram", providerUserId: participantId, providerAccountId: accountId, username: cleanString(other?.username,500)||null, displayName: cleanString(other?.name,500)||null, evidence: { source: "historical_sync" }, firstSeenAt: cleanString(messages.length ? messages[messages.length-1]?.created_time : null,100)||null, lastSeenAt: cleanString(messages[0]?.created_time || conversation.updated_time,100)||null })
  const { data: existing, error } = await db.from("social_command_conversations").select("*").eq("channel","instagram").eq("participant_id",participantId).maybeSingle(); if(error)throw error
  const now=nowIso(), lastAt=cleanString(messages[0]?.created_time || conversation.updated_time,100)||now, preview=cleanString(messages[0]?.message,2000)||existing?.last_message_preview||null
  let localConversation:any=existing
  if(existing){const q=await db.from("social_command_conversations").update({provider_conversation_id:conversationId,relationship_contact_id:identity.relationship_contact_id,source_kind:existing.source_kind||"historical_sync",last_message_at:existing.last_message_at||lastAt,last_message_preview:existing.last_message_preview||preview,updated_at:now}).eq("id",existing.id).select("*").single();if(q.error)throw q.error;localConversation=q.data}
  else{const q=await db.from("social_command_conversations").insert({id:crypto.randomUUID(),channel:"instagram",provider_conversation_id:conversationId,participant_id:participantId,participant_username:cleanString(other?.username,500)||null,participant_name:cleanString(other?.name,500)||null,status:"archived",priority:"normal",unread_count:0,relationship_contact_id:identity.relationship_contact_id,provider_account_id:accountId,source_kind:"historical_sync",first_received_at:cleanString(messages.length ? messages[messages.length-1]?.created_time : null,100)||lastAt,last_message_at:lastAt,last_message_preview:preview,tags:[],metadata:{historical_sync:true},created_at:now,updated_at:now}).select("*").single();if(q.error)throw q.error;localConversation=q.data}
  let imported=0,skipped=0
  for(const message of messages){const mid=cleanString(message.id,500);if(!mid){skipped++;continue}const {data:exists}=await db.from("social_command_messages").select("id").eq("provider_message_id",mid).maybeSingle();if(exists){skipped++;continue}const from=jsonObject(message.from),toArr=Array.isArray(message.to?.data)?message.to.data:Array.isArray(message.to)?message.to:[],fromId=cleanString(from.id,500),inbound=fromId!==accountId,recipient=inbound?accountId:cleanString(toArr[0]?.id,500)||participantId;const at=cleanString(message.created_time,100)||now;const q=await db.from("social_command_messages").insert({id:crypto.randomUUID(),conversation_id:localConversation.id,provider_message_id:mid,direction:inbound?"inbound":"outbound",sender_id:fromId||null,recipient_id:recipient||null,sender_username:cleanString(from.username,500)||null,message_type:Array.isArray(message.attachments?.data)&&message.attachments.data.length?"attachment":"text",text:cleanString(message.message,20000),attachments:Array.isArray(message.attachments?.data)?message.attachments.data:[],status:inbound?"received":"sent",sent_by_user_id:null,provider_timestamp:at,provider_payload:message,source_kind:"historical_sync",provider_state:"historical",created_at:now,updated_at:now});if(q.error)throw q.error;imported++;await recordJourneyEventMZ7({contactId:identity.relationship_contact_id,providerIdentityId:identity.id,provider:"instagram",entityType:"message",entityId:mid,kind:inbound?"instagram.dm.historical_inbound":"instagram.dm.historical_outbound",source:"historical_sync",title:"Message Instagram historique",summary:cleanString(message.message,2000),occurredAt:at,providerReference:mid,payload:{conversationId}})}
  return { imported, skipped }
}

async function importInstagramComment(media: any, comment: any, accountId: string) {
  const db=await socialDb(), providerCommentId=cleanString(comment.id,500);if(!providerCommentId)return {imported:0,skipped:1};const {data:exists,error}=await db.from("social_command_comments").select("id").eq("provider_comment_id",providerCommentId).maybeSingle();if(error)throw error;if(exists)return{imported:0,skipped:1};const from=jsonObject(comment.from),fromId=cleanString(from.id,500)||null,at=cleanString(comment.timestamp||comment.created_time,100)||nowIso();let identity:any=null;if(fromId)identity=await ensureRelationshipIdentityMZ7({provider:"instagram",providerUserId:fromId,providerAccountId:accountId,username:cleanString(from.username,500)||null,evidence:{source:"historical_sync"},firstSeenAt:at,lastSeenAt:at});const id=crypto.randomUUID();const q=await db.from("social_command_comments").insert({id,provider_comment_id:providerCommentId,channel:"instagram",media_id:cleanString(media.id,500)||null,provider_post_id:cleanString(media.id,500)||null,parent_comment_id:cleanString(comment.parent_id,500)||null,publication_id:null,campaign_id:null,commenter_id:fromId,commenter_username:cleanString(from.username,500)||null,text:cleanString(comment.text,20000),status:"archived",assigned_user_id:null,provider_created_at:at,relationship_contact_id:identity?.relationship_contact_id||null,source_kind:"historical_sync",provider_state:"historical",metadata:{...comment,media:{id:media.id,permalink:media.permalink,caption:media.caption}},archived_at:nowIso(),archive_reason:"Historical sync baseline",created_at:nowIso(),updated_at:nowIso()});if(q.error)throw q.error;await recordJourneyEventMZ7({contactId:identity?.relationship_contact_id||null,providerIdentityId:identity?.id||null,provider:"instagram",entityType:"comment",entityId:id,kind:"instagram.comment.historical",source:"historical_sync",title:"Commentaire Instagram historique",summary:cleanString(comment.text,2000),occurredAt:at,providerReference:providerCommentId,payload:{mediaId:media.id}});return{imported:1,skipped:0}
}

export async function runMetaHistorySyncMZ7(input: { provider: MZ7HistoryProvider; kind: MZ7HistoryKind; mode: MZ7HistoryMode; actorUserId: string; maxPages?: number; maxRecords?: number }) {
  const maxPages=Math.max(1,Math.min(20,Number(input.maxPages||5))),maxRecords=Math.max(1,Math.min(2500,Number(input.maxRecords||500)));const runId=await createRun(input.provider,input.kind,input.mode,input.actorUserId);let discovered=0,imported=0,skipped=0,failed=0,providerLimited=0;const samples:any[]=[]
  try{
    if(input.provider==="facebook"){
      const rt=await facebookRuntimeMZ7()
      if(input.kind==="conversations"){
        const start=new URL(`https://graph.facebook.com/${rt.graphVersion}/${encodeURIComponent(rt.pageId)}/conversations`);start.searchParams.set("fields","id,updated_time,participants");start.searchParams.set("limit","50");const page=await pageThrough(start,rt.pageToken,"graph.facebook.com",maxPages,maxRecords);discovered=page.rows.length;samples.push(...page.rows.slice(0,20).map(x=>({id:x.id,updated_time:x.updated_time,participants:x.participants?.data?.length||0})))
        if(input.mode==="import")for(const conv of page.rows){try{const detailUrl=new URL(`https://graph.facebook.com/${rt.graphVersion}/${encodeURIComponent(cleanString(conv.id,500))}`);detailUrl.searchParams.set("fields","id,participants,messages.limit(50){id,created_time,from,to,message,attachments}");const detail=await providerJson(detailUrl,rt.pageToken);const participants=Array.isArray(detail.participants?.data)?detail.participants.data:[];const other=participants.find((p:any)=>cleanString(p?.id,500)!==rt.pageId)||participants[0]||null;const messages=Array.isArray(detail.messages?.data)?detail.messages.data:[];for(const m of messages){const from=jsonObject(m.from),toArr=Array.isArray(m.to?.data)?m.to.data:[],event={sender:{id:cleanString(from.id,500)},recipient:{id:cleanString(toArr[0]?.id,500)||rt.pageId},timestamp:new Date(cleanString(m.created_time,100)||Date.now()).getTime(),conversation_id:conv.id,message:{mid:m.id,text:m.message,attachments:m.attachments?.data||[]}};const count=await persistFacebookMessageMZ7(rt.pageId,event,"historical_sync");if(count)imported++;else skipped++}if(!messages.length&&other?.id)skipped++}catch{failed++}}
        await checkpoint("facebook","conversations",page.cursor,{truncated:page.truncated,discovered})
      }else{
        const postsUrl=new URL(`https://graph.facebook.com/${rt.graphVersion}/${encodeURIComponent(rt.pageId)}/published_posts`);postsUrl.searchParams.set("fields","id,message,created_time,permalink_url");postsUrl.searchParams.set("limit","50");const posts=await pageThrough(postsUrl,rt.pageToken,"graph.facebook.com",Math.min(maxPages,10),Math.min(maxRecords,500));
        for(const post of posts.rows){try{const cUrl=new URL(`https://graph.facebook.com/${rt.graphVersion}/${encodeURIComponent(cleanString(post.id,500))}/comments`);cUrl.searchParams.set("fields","id,message,created_time,from,parent");cUrl.searchParams.set("limit","100");const page=await pageThrough(cUrl,rt.pageToken,"graph.facebook.com",Math.min(maxPages,10),Math.max(1,maxRecords-discovered));for(const c of page.rows){discovered++;if(samples.length<20)samples.push({id:c.id,post_id:post.id,message:cleanString(c.message,180),created_time:c.created_time,from:c.from?.name||null});if(input.mode==="import"){const change={field:"feed",value:{__mz7_source:"historical_sync",item:"comment",verb:"add",comment_id:c.id,post_id:post.id,parent_id:c.parent?.id||post.id,sender_id:c.from?.id||null,sender_name:c.from?.name||null,message:c.message,created_time:c.created_time,permalink_url:post.permalink_url}};const count=await persistFacebookCommentChangeMZ7(rt.pageId,change,"historical_sync");if(count)imported++;else skipped++}}if(discovered>=maxRecords)break}catch{providerLimited++}}
        await checkpoint("facebook","comments",posts.cursor,{postsScanned:posts.rows.length,discovered})
      }
    }else{
      const cfg=instagramWebhookConfig();if(!cfg.accessToken||!cfg.accountId)throw new Error("Dedicated Instagram Login history credential is not configured")
      if(input.kind==="conversations"){
        const start=new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(cfg.accountId)}/conversations`);start.searchParams.set("platform","instagram");start.searchParams.set("limit","50");const page=await pageThrough(start,cfg.accessToken,"graph.instagram.com",maxPages,maxRecords);discovered=page.rows.length;samples.push(...page.rows.slice(0,20).map(x=>({id:x.id,updated_time:x.updated_time})));if(input.mode==="import")for(const conv of page.rows){try{const r=await importInstagramConversation(conv,cfg.accessToken,cfg.accountId,cfg.graphVersion);imported+=r.imported;skipped+=r.skipped}catch{failed++}}await checkpoint("instagram","conversations",page.cursor,{truncated:page.truncated,discovered})
      }else{
        const mediaUrl=new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(cfg.accountId)}/media`);mediaUrl.searchParams.set("fields","id,caption,media_type,timestamp,permalink");mediaUrl.searchParams.set("limit","50");const media=await pageThrough(mediaUrl,cfg.accessToken,"graph.instagram.com",Math.min(maxPages,10),Math.min(maxRecords,500));for(const item of media.rows){try{const cUrl=new URL(`https://graph.instagram.com/${cfg.graphVersion}/${encodeURIComponent(cleanString(item.id,500))}/comments`);cUrl.searchParams.set("fields","id,from,text,timestamp,parent_id");cUrl.searchParams.set("limit","100");const comments=await pageThrough(cUrl,cfg.accessToken,"graph.instagram.com",Math.min(maxPages,10),Math.max(1,maxRecords-discovered));for(const c of comments.rows){discovered++;if(samples.length<20)samples.push({id:c.id,media_id:item.id,text:cleanString(c.text,180),timestamp:c.timestamp,from:c.from?.username||null});if(input.mode==="import"){const r=await importInstagramComment(item,c,cfg.accountId);imported+=r.imported;skipped+=r.skipped}}if(discovered>=maxRecords)break}catch{providerLimited++}}await checkpoint("instagram","comments",media.cursor,{mediaScanned:media.rows.length,discovered})
      }
    }
    await finishRun(runId,{status:"completed",discovered_count:discovered,imported_count:imported,skipped_count:skipped,failed_count:failed,provider_limited_count:providerLimited,details:{samples,truncated:discovered>=maxRecords}})
    return{runId,provider:input.provider,kind:input.kind,mode:input.mode,discovered,imported,skipped,failed,providerLimited,samples,truncated:discovered>=maxRecords}
  }catch(error){await finishRun(runId,{status:"failed",discovered_count:discovered,imported_count:imported,skipped_count:skipped,failed_count:failed+1,provider_limited_count:providerLimited,error_message:error instanceof Error?error.message:String(error),details:{samples}});throw error}
}

export async function historySyncBootstrapMZ7(){const db=await socialDb();const[{data:runs,error:rErr},{data:checkpoints,error:cErr}]=await Promise.all([db.from("social_command_history_sync_runs").select("*").order("started_at",{ascending:false}).limit(30),db.from("social_command_history_sync_checkpoints").select("*").order("updated_at",{ascending:false}).limit(20)]);if(rErr)throw rErr;if(cErr)throw cErr;return{runs:runs||[],checkpoints:checkpoints||[]}}
