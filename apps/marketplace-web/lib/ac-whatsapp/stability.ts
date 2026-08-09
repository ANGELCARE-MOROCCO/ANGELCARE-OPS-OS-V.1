export type AcUnknownRecord = Record<string, any>

const UNKNOWN_LABELS = new Set(['', 'unknown', '[unknown]', 'inconnu', '[inconnu]', 'contact', 'whatsapp', 'undefined', 'null'])
const MESSAGE_ID_KEYS = ['id','message_id','provider_message_id','openwa_message_id','whatsapp_message_id','external_id','client_message_id','transport_message_id'] as const
const ATTACHMENT_ID_KEYS = ['id','storage_key','storage_path','file_name','filename'] as const

function asRecord(value: unknown): AcUnknownRecord | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as AcUnknownRecord : null }
function normalizedText(value: unknown) { return String(value ?? '').trim() }
function meaningfulName(value: unknown) {
  const text = normalizedText(value); if (!text) return false
  const normalized = text.toLowerCase(); if (UNKNOWN_LABELS.has(normalized)) return false
  if (/^\+?\d{7,}$/.test(text.replace(/[\s().-]/g, ''))) return false
  if (/@(?:lid|c\.us|g\.us)$/i.test(text)) return false
  return true
}
export function isValidE164(value: unknown) { return /^\+[1-9]\d{7,14}$/.test(normalizedText(value)) }
export function isWhatsAppLid(value: unknown) { return /@lid$/i.test(normalizedText(value)) }
function lidDigits(value: unknown) { const text=normalizedText(value); return isWhatsAppLid(text) ? text.replace(/@lid$/i,'').replace(/\D/g,'') : '' }
function identityOf(record: AcUnknownRecord | null | undefined) {
  if (!record) return ''
  for (const key of MESSAGE_ID_KEYS) { const value=normalizedText(record[key]); if (value) return `${key}:${value}` }
  const timestamp=normalizedText(record.sent_at||record.received_at||record.created_at||record.timestamp)
  const direction=normalizedText(record.direction||record.sender_type||record.from_me)
  const body=normalizedText(record.body||record.caption||record.text).slice(0,160)
  return `fallback:${direction}:${timestamp}:${body}`
}
function attachmentIdentity(record: AcUnknownRecord | null | undefined) {
  if (!record) return ''
  for (const key of ATTACHMENT_ID_KEYS) { const value=normalizedText(record[key]); if (value) return `${key}:${value}` }
  return `fallback:${normalizedText(record.mime_type||record.mimetype)}:${normalizedText(record.size_bytes||record.size)}:${normalizedText(record.created_at)}`
}
function mergeAttachments(previousValue: unknown, incomingValue: unknown) {
  const previous=Array.isArray(previousValue)?previousValue:[]; const incoming=Array.isArray(incomingValue)?incomingValue:[]
  if (!incoming.length) return previous; if (!previous.length) return incoming
  const map=new Map<string,AcUnknownRecord>()
  previous.forEach((item,index)=>{const record=asRecord(item); if(record) map.set(attachmentIdentity(record)||`previous:${index}`,record)})
  incoming.forEach((item,index)=>{const record=asRecord(item); if(!record)return; const key=attachmentIdentity(record)||`incoming:${index}`; const old=map.get(key); map.set(key,old?{...old,...record}:record)})
  return Array.from(map.values())
}
function mergePersonLike(previousValue: unknown, incomingValue: unknown) {
  const previous=asRecord(previousValue), incoming=asRecord(incomingValue); if(!previous)return incomingValue; if(!incoming)return previousValue
  const merged:AcUnknownRecord={...previous,...incoming}
  for(const key of ['display_name','name','contact_name','sender_display_name','business_name','organization_name']) if(!meaningfulName(incoming[key])&&meaningfulName(previous[key])) merged[key]=previous[key]
  for(const key of ['phone_e164','e164','phone']) if(!isValidE164(incoming[key])&&isValidE164(previous[key])) merged[key]=previous[key]
  return merged
}
function normalizeRecord(record: AcUnknownRecord): AcUnknownRecord {
  const next:AcUnknownRecord={...record}
  const remote=normalizedText(next.remote_chat_id||next.remoteChatId||next.whatsapp_id||next.whatsappId||next.remote_id)
  const lid=isWhatsAppLid(remote)?remote:normalizedText(next.lid||next.lid_identity)
  if(lid&&isWhatsAppLid(lid)){
    next.lid_identity=lid; const digits=lidDigits(lid)
    for(const key of ['phone_e164','e164','phone']){const candidate=normalizedText(next[key]).replace(/\D/g,''); if(candidate&&digits&&candidate===digits) next[key]=null}
  }
  for(const key of ['contact','sender','assigned_user','owner','responsible','account']) if(asRecord(next[key])) next[key]=normalizeRecord(next[key])
  if(Array.isArray(next.attachments)) next.attachments=next.attachments.map((item:unknown)=>{const value=asRecord(item); return value?normalizeRecord(value):item})
  return next
}
export function normalizeConversationSnapshot<T>(value:T):T{
  const visit=(input:any,depth=0):any=>{if(depth>7||input==null)return input; if(Array.isArray(input))return input.map(item=>visit(item,depth+1)); const record=asRecord(input); if(!record)return input; const normalized=normalizeRecord(record); for(const [key,nested] of Object.entries(normalized)){if(['contact','sender','assigned_user','owner','responsible','account','attachments'].includes(key))continue; if(nested&&typeof nested==='object') normalized[key]=visit(nested,depth+1)} return normalized}
  return visit(value) as T
}
function mergeMessage(previous:AcUnknownRecord,incoming:AcUnknownRecord){
  const merged:AcUnknownRecord={...previous,...incoming}; merged.attachments=mergeAttachments(previous.attachments,incoming.attachments); merged.sender=mergePersonLike(previous.sender,incoming.sender)
  for(const key of ['sender_display_name_snapshot','sender_display_name','author_name']) if(!meaningfulName(incoming[key])&&meaningfulName(previous[key])) merged[key]=previous[key]
  for(const key of ['provider_message_id','openwa_message_id','whatsapp_message_id','transport_message_id']) if(!normalizedText(incoming[key])&&normalizedText(previous[key])) merged[key]=previous[key]
  return merged
}
function mergeMessages(previousValue:unknown,incomingValue:unknown){
  const previous=Array.isArray(previousValue)?previousValue:[], incoming=Array.isArray(incomingValue)?incomingValue:[]
  if(!incoming.length)return previous; if(!previous.length)return incoming
  const map=new Map<string,AcUnknownRecord>(), order:string[]=[]
  previous.forEach((item,index)=>{const record=asRecord(item); if(!record)return; const key=identityOf(record)||`previous:${index}`; if(!map.has(key))order.push(key); map.set(key,record)})
  incoming.forEach((item,index)=>{const record=asRecord(item); if(!record)return; const key=identityOf(record)||`incoming:${index}`; const old=map.get(key); if(!map.has(key))order.push(key); map.set(key,old?mergeMessage(old,record):record)})
  return order.map(key=>map.get(key)).filter(Boolean)
}
function recordId(value:unknown){const record=asRecord(value); return normalizedText(record?.id||record?.conversation_id||record?.conversationId)}
export function mergeConversationSnapshot<T>(current:T|null|undefined,incoming:T):T{
  const normalized=normalizeConversationSnapshot(incoming); if(!current)return normalized
  const previousRecord=asRecord(current), incomingRecord=asRecord(normalized); if(!previousRecord||!incomingRecord)return normalized
  const previousId=recordId(previousRecord), incomingId=recordId(incomingRecord); if(previousId&&incomingId&&previousId!==incomingId)return normalized
  const merged:AcUnknownRecord={...previousRecord,...incomingRecord}; merged.messages=mergeMessages(previousRecord.messages,incomingRecord.messages); merged.contact=mergePersonLike(previousRecord.contact,incomingRecord.contact); merged.account=mergePersonLike(previousRecord.account,incomingRecord.account); merged.assigned_user=mergePersonLike(previousRecord.assigned_user,incomingRecord.assigned_user); merged.owner=mergePersonLike(previousRecord.owner,incomingRecord.owner); return merged as T
}
export function stableMessageKey(message:unknown,index=0){const record=asRecord(message); return record?(identityOf(record)||`message-${index}`):`message-${index}`}
export function safeDisplayName(current:unknown,fallback?:unknown){if(meaningfulName(current))return normalizedText(current); if(meaningfulName(fallback))return normalizedText(fallback); return 'Contact WhatsApp'}
