import 'server-only'
import { createSign } from 'node:crypto'
import { db } from '../repository'
import { nativeSummary, type NativeSummary } from './native'

// Production read-only Google integration. All identifiers here are non-secret.
export const SEO_GOOGLE_PROJECT = 'sage-byte-514100-t5'
export const SEO_SEARCH_SITE = 'sc-domain:angelcarehub.com'
export const SEO_GA4_PROPERTY = '562445579'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly'
const SEARCH_URL = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEO_SEARCH_SITE)}/searchAnalytics/query`
const GA_URL = `https://analyticsdata.googleapis.com/v1beta/properties/${SEO_GA4_PROPERTY}:runReport`
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

export class GoogleIntelligenceError extends Error {
  constructor(public code:string,message:string,public status=502){super(message);this.name='GoogleIntelligenceError'}
}
export type Source<T> = {state:'ok'; data:T} | {state:'error';code:string;message:string}
export type SearchRow = { keys?:string[]; clicks?:number; impressions?:number; ctr?:number; position?:number }
type SearchResponse = { rows?: SearchRow[] }
type GaRow = { dimensionValues?:Array<{value?:string}>;metricValues?:Array<{value?:string}> }
type GaResponse = {rows?:GaRow[];rowCount?:number}
export type DailySearch = {date:string;clicks:number;impressions:number;ctr:number;position:number}
export type SearchPage = {url:string;world:string;locale:string;clicks:number;impressions:number;ctr:number;position:number}
export type SearchSummary = {
  clicks:number; impressions:number; ctr:number; position:number|null
  priorClicks:number;priorImpressions:number;daily:DailySearch[]
  pages:SearchPage[];queries:Array<{query:string;clicks:number;impressions:number;ctr:number;position:number}>
  countries:Array<{code:string;clicks:number;impressions:number}>
  devices:Array<{device:string;clicks:number;impressions:number}>
  limitedToTopPages:true; limit:number
}
export type AnalyticsSummary = {
  sessions:number;activeUsers:number;engagedSessions:number;priorSessions:number
  engagementRate:number
  daily:Array<{date:string;sessions:number;activeUsers:number;engagedSessions:number}>
  landingPages:Array<{host:string;path:string;world:string;locale:string;sessions:number;activeUsers:number;engagedSessions:number}>
  limitedToTopPages:true
}
export type GoogleOverview = {
  generatedAt:string;property:string;ga4PropertyId:string
  period:{start:string;end:string;priorStart:string;priorEnd:string;note:string}
  search:Source<SearchSummary>;analytics:Source<AnalyticsSummary>;native:Source<NativeSummary>
  warnings:string[]
}
export type Inspection = {
  url:string;inspectedAt:string;source:'GOOGLE_URL_INSPECTION';verdict:string;coverageState:string
  lastCrawlTime:string|null;googleCanonical:string|null;userCanonical:string|null
  robotsTxtState:string|null;indexingState:string|null;pageFetchState:string|null
  sitemap:string[];referringUrls:string[];persisted:boolean;note:string
}
export type InspectionHistory = {id:string;url:string;inspectedAt:string;verdict:string;coverageState:string;persisted:boolean}[]
export type Diagnostics = {project:string;searchProperty:string;ga4Property:string;configured:boolean;serviceAccount:string|null;cacheAgeSeconds:number|null;inspectionBudget:{day:string;used:number;limit:number}|null;notes:string[]}

type Credential={type?:string;project_id?:string;client_email?:string;private_key?:string;token_uri?:string}
function readCredential():{email:string;key:string} {
  const encoded=process.env.SEO_GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim()
  if(!encoded)throw new GoogleIntelligenceError('NOT_CONFIGURED','Google service credential is not configured on the server.',503)
  let c:Credential
  try {c=JSON.parse(Buffer.from(encoded,'base64').toString('utf8')) as Credential}
  catch {throw new GoogleIntelligenceError('INVALID_CREDENTIAL','Google credential is not valid JSON.',503)}
  if(c.type!=='service_account'||c.project_id!==SEO_GOOGLE_PROJECT||!c.client_email?.endsWith(`@${SEO_GOOGLE_PROJECT}.iam.gserviceaccount.com`)||!c.private_key?.includes('-----BEGIN PRIVATE KEY-----')||(c.token_uri&&c.token_uri!==TOKEN_URL))
    throw new GoogleIntelligenceError('CREDENTIAL_MISMATCH','Google credential does not belong to the configured SEO Power project.',503)
  return {email:c.client_email,key:c.private_key}
}
const b64=(s:string)=>Buffer.from(s).toString('base64url')
let bearer:{value:string;expiresAt:number}|null=null
let tokenPending:Promise<string>|null=null
async function refreshToken():Promise<string>{
  const c=readCredential(),now=Math.floor(Date.now()/1000)
  const unsigned=`${b64(JSON.stringify({alg:'RS256',typ:'JWT'}))}.${b64(JSON.stringify({iss:c.email,scope:SCOPE,aud:TOKEN_URL,iat:now,exp:now+3500}))}`
  let signature:string
  try{signature=createSign('RSA-SHA256').update(unsigned).end().sign(c.key,'base64url')}
  catch{throw new GoogleIntelligenceError('INVALID_PRIVATE_KEY','Unable to sign the Google service request.',503)}
  let response:Response
  try{response=await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`}),cache:'no-store',signal:AbortSignal.timeout(12000)})}
  catch{throw new GoogleIntelligenceError('GOOGLE_AUTH_NETWORK','Google authentication network error.',503)}
  const body=await response.json().catch(()=>({})) as {access_token?:string;expires_in?:number}
  if(!response.ok||!body.access_token)throw new GoogleIntelligenceError('GOOGLE_AUTH_DENIED',`Google authentication denied (HTTP ${response.status}).`,503)
  bearer={value:body.access_token,expiresAt:Date.now()+Math.max(60,Number(body.expires_in)||3500)*1000}
  return bearer.value
}
async function getToken(){
  if(bearer&&bearer.expiresAt>Date.now()+120000)return bearer.value
  if(!tokenPending)tokenPending=refreshToken().finally(()=>{tokenPending=null})
  return tokenPending
}
async function postGoogle<T>(url:string,payload:unknown):Promise<T>{
  const access=await getToken()
  let res:Response
  try{res=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(18000)})}
  catch{throw new GoogleIntelligenceError('GOOGLE_TIMEOUT','Google API timed out or cannot be reached.',503)}
  if(!res.ok){
    if(res.status===429)throw new GoogleIntelligenceError('GOOGLE_QUOTA','Google API quota was reached; no results were fabricated.',429)
    if(res.status===403)throw new GoogleIntelligenceError('GOOGLE_PERMISSION','Google denied access. Check the property permissions and enabled APIs.',403)
    if(res.status===401) {bearer=null;throw new GoogleIntelligenceError('GOOGLE_TOKEN_REJECTED','Google rejected the access token.',503)}
    throw new GoogleIntelligenceError('GOOGLE_API_FAILURE',`Google API returned HTTP ${res.status}.`,502)
  }
  try {return await res.json() as T} catch{throw new GoogleIntelligenceError('GOOGLE_BAD_RESPONSE','Google returned an unreadable response.',502)}
}
const err=(e:unknown):Extract<Source<never>,{state:'error'}>=>e instanceof GoogleIntelligenceError?{state:'error',code:e.code,message:e.message}:{state:'error',code:'SOURCE_UNAVAILABLE',message:'Source unavailable; no fabricated results.'}
function dateUTC(delta:number){const x=new Date();x.setUTCHours(12,0,0,0);x.setUTCDate(x.getUTCDate()+delta);return x.toISOString().slice(0,10)}
export function classify(url:string):{world:string;locale:string}{
  let path='';try{path=new URL(url).pathname.toLowerCase()}catch{path=url.toLowerCase()}
  const parts=path.split('/').filter(Boolean)
  const first=parts[0]||''
  const world=first==='angelcare-marketplace'?'AngelCare':first==='kidflix'?'KidFlix':first==='jobkix'?'JOBKIX':'Other'
  const lang=(parts[1]||'').toLowerCase()
  return {world,locale:/^(en|fr|ar|es|hi|tl|id)$/.test(lang)?lang:'—'}
}
const searchBase={type:'web',dataState:'final'}
const organicBase=(start:string,end:string)=>({dateRanges:[{startDate:start,endDate:end}],dimensionFilter:{filter:{fieldName:'sessionDefaultChannelGroup',stringFilter:{matchType:'EXACT',value:'Organic Search'}}}})
function numeric(r:SearchRow|undefined,k:'clicks'|'impressions'|'ctr'|'position'){return Number(r?.[k]||0)}
async function googleSearch(start:string,end:string,priorStart:string,priorEnd:string):Promise<Source<SearchSummary>>{
  try{
    const q=(dimensions:string[],rowLimit:number,startDate=start,endDate=end)=>postGoogle<SearchResponse>(SEARCH_URL,{...searchBase,startDate,endDate,dimensions,rowLimit})
    const [current,prior,daily,pages,queries,countries,devices]=await Promise.all([
      q([],1),q([],1,priorStart,priorEnd),q(['date'],35),q(['page'],1000),q(['query'],150),q(['country'],40),q(['device'],10)
    ])
    const total=current.rows?.[0],before=prior.rows?.[0]
    return {state:'ok',data:{
      clicks:numeric(total,'clicks'),impressions:numeric(total,'impressions'),ctr:numeric(total,'ctr'),position:total?.impressions?numeric(total,'position'):null,
      priorClicks:numeric(before,'clicks'),priorImpressions:numeric(before,'impressions'),
      daily:(daily.rows||[]).map(r=>({date:r.keys?.[0]||'',clicks:numeric(r,'clicks'),impressions:numeric(r,'impressions'),ctr:numeric(r,'ctr'),position:numeric(r,'position')})).sort((a,b)=>a.date.localeCompare(b.date)),
      pages:(pages.rows||[]).map(r=>({url:r.keys?.[0]||'',...classify(r.keys?.[0]||''),clicks:numeric(r,'clicks'),impressions:numeric(r,'impressions'),ctr:numeric(r,'ctr'),position:numeric(r,'position')})),
      queries:(queries.rows||[]).map(r=>({query:r.keys?.[0]||'',clicks:numeric(r,'clicks'),impressions:numeric(r,'impressions'),ctr:numeric(r,'ctr'),position:numeric(r,'position')})),
      countries:(countries.rows||[]).map(r=>({code:r.keys?.[0]||'',clicks:numeric(r,'clicks'),impressions:numeric(r,'impressions')})),
      devices:(devices.rows||[]).map(r=>({device:r.keys?.[0]||'',clicks:numeric(r,'clicks'),impressions:numeric(r,'impressions')})),
      limitedToTopPages:true,limit:1000
    }}
  }catch(e){return err(e)}
}
const gaN=(r:GaRow|undefined,i:number)=>Number(r?.metricValues?.[i]?.value||0)
async function googleAnalytics(start:string,end:string,priorStart:string,priorEnd:string):Promise<Source<AnalyticsSummary>>{
  try{
    const base=organicBase(start,end)
    const [total,prior,daily,pages]=await Promise.all([
      postGoogle<GaResponse>(GA_URL,{...base,metrics:[{name:'sessions'},{name:'activeUsers'},{name:'engagedSessions'}]}),
      postGoogle<GaResponse>(GA_URL,{...organicBase(priorStart,priorEnd),metrics:[{name:'sessions'}]}),
      postGoogle<GaResponse>(GA_URL,{...base,dimensions:[{name:'date'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'engagedSessions'}],limit:35}),
      postGoogle<GaResponse>(GA_URL,{...base,dimensions:[{name:'hostName'},{name:'landingPagePlusQueryString'}],metrics:[{name:'sessions'},{name:'activeUsers'},{name:'engagedSessions'}],limit:200,orderBys:[{metric:{metricName:'sessions'},desc:true}]}),
    ])
    const t=total.rows?.[0]
    const sessions=gaN(t,0),engagedSessions=gaN(t,2)
    return {state:'ok',data:{sessions,activeUsers:gaN(t,1),engagedSessions,priorSessions:gaN(prior.rows?.[0],0),engagementRate:sessions?engagedSessions/sessions:0,
      daily:(daily.rows||[]).map(r=>({date:r.dimensionValues?.[0]?.value||'',sessions:gaN(r,0),activeUsers:gaN(r,1),engagedSessions:gaN(r,2)})).sort((a,b)=>a.date.localeCompare(b.date)),
      landingPages:(pages.rows||[]).map(r=>{const host=r.dimensionValues?.[0]?.value||'',path=r.dimensionValues?.[1]?.value||'';return {host,path,...classify(path),sessions:gaN(r,0),activeUsers:gaN(r,1),engagedSessions:gaN(r,2)}}),
      limitedToTopPages:true
    }}
  }catch(e){return err(e)}
}
const TTL=15*60*1000
let cache:{at:number;data:GoogleOverview}|null=null
let pending:Promise<GoogleOverview>|null=null
let lastForced=0
export async function googleOverview(force=false):Promise<GoogleOverview>{
  const now=Date.now()
  const refreshAllowed=force&&now-lastForced>5*60*1000
  if(!refreshAllowed&&cache&&now-cache.at<TTL)return cache.data
  if(pending)return pending
  if(refreshAllowed)lastForced=now
  pending=readOverview().then(result=>{cache={at:Date.now(),data:result};return result}).finally(()=>{pending=null})
  return pending
}
async function readOverview():Promise<GoogleOverview>{
  const end=dateUTC(-3),start=dateUTC(-30),priorEnd=dateUTC(-31),priorStart=dateUTC(-58)
  const [search,analytics,native]=await Promise.all([
    googleSearch(start,end,priorStart,priorEnd),googleAnalytics(start,end,priorStart,priorEnd),nativeSummary().then((data):Source<NativeSummary>=>({state:'ok',data})).catch(err)
  ])
  return {generatedAt:new Date().toISOString(),property:SEO_SEARCH_SITE,ga4PropertyId:SEO_GA4_PROPERTY,
    period:{start,end,priorStart,priorEnd,note:'28 days of final Search Console data, ending three days before today; the previous 28-day period is used for comparison. GA4 is queried for these same dates.'},
    search,analytics,native,warnings:[
      'Search Console performance rows are sampled top results, not a list of every indexed page.',
      'Native inventory counts reflect registered SEO Power records; an unpublished/unregistered item may not appear.',
      'Missing Search Console performance never proves that Google has not indexed a page.',
      'GA4 Organic Search sessions are not equivalent to Search Console clicks, and GA4 property scope may differ.'
    ]}
}

// Restrict manual Google inspection to approved public URLs within the property.
function safeDecodedPath(path:string){try{return decodeURIComponent(path)}catch{throw new GoogleIntelligenceError('INVALID_URL','Invalid URL encoding.',400)}}
export function validateInspectionUrl(input:unknown):string{
  if(typeof input!=='string'||input.length>1900)throw new GoogleIntelligenceError('INVALID_URL','Enter a public HTTPS URL under angelcarehub.com.',400)
  let u:URL
  try{u=new URL(input)}catch{throw new GoogleIntelligenceError('INVALID_URL','Invalid public URL.',400)}
  const host=u.hostname.toLowerCase()
  if(u.protocol!=='https:'||!(host==='angelcarehub.com'||host.endsWith('.angelcarehub.com'))||u.username||u.password||u.port||u.hash||u.search||
    !/^\/(angelcare-marketplace|kidflix|jobkix)(\/|$)/i.test(u.pathname)||
    /\/(admin|api|auth|login|logout|workspace|account|basket|checkout|payment|candidate|hirer|dashboard|preview)(\/|$)/i.test(safeDecodedPath(u.pathname)))
    throw new GoogleIntelligenceError('URL_OUT_OF_SCOPE','Only public canonical project URLs, without query parameters, are allowed.',400)
  return u.href
}
async function quotaReserve(){
  const client=await db(),day=dateUTC(0)
  const result=await client.rpc('ac_seo_google_reserve_quota',{p_day:day,p_cap:300})
  if(result.error)throw new GoogleIntelligenceError('QUOTA_LEDGER_REQUIRED','The Google inspection budget migration must be applied before inspection requests.',503)
  if(typeof result.data!=='number'||result.data<0)throw new GoogleIntelligenceError('LOCAL_INSPECTION_BUDGET','Daily safe inspection budget reached. Try tomorrow.',429)
}
async function auditInspection(inspection:Inspection,success:boolean):Promise<boolean>{
  try{const client=await db();const r=await client.from('ac_seo_google_inspections').insert({url:inspection.url,verdict:inspection.verdict,coverage_state:inspection.coverageState,inspected_at:inspection.inspectedAt,result:inspection,success});return !r.error}catch{return false}
}
export async function inspectGoogleUrl(input:unknown):Promise<Inspection>{
  const url=validateInspectionUrl(input)
  await quotaReserve() // database atomic quota ledger across all server replicas
  const result=await postGoogle<{inspectionResult?:{indexStatusResult?:Record<string,unknown>}}>(INSPECT_URL,{inspectionUrl:url,siteUrl:SEO_SEARCH_SITE,languageCode:'fr-FR'})
  const v=result.inspectionResult?.indexStatusResult||{}
  const value=(key:string)=>typeof v[key]==='string'?String(v[key]):null
  const inspection:Inspection={url,inspectedAt:new Date().toISOString(),source:'GOOGLE_URL_INSPECTION',verdict:value('verdict')||'UNKNOWN',coverageState:value('coverageState')||'Not reported',lastCrawlTime:value('lastCrawlTime'),googleCanonical:value('googleCanonical'),userCanonical:value('userCanonical'),robotsTxtState:value('robotsTxtState'),indexingState:value('indexingState'),pageFetchState:value('pageFetchState'),sitemap:Array.isArray(v.sitemap)?v.sitemap.filter(x=>typeof x==='string').slice(0,10):[],referringUrls:Array.isArray(v.referringUrls)?v.referringUrls.filter(x=>typeof x==='string').slice(0,10):[],persisted:false,note:'Google index status is not a live URL test and does not guarantee future indexing or ranking.'}
  inspection.persisted=await auditInspection(inspection,true)
  return inspection
}
export async function inspectionHistory():Promise<InspectionHistory>{
  const client=await db()
  const result=await client.from('ac_seo_google_inspections').select('id,url,inspected_at,verdict,coverage_state,success').order('inspected_at',{ascending:false}).limit(80)
  if(result.error)throw new GoogleIntelligenceError('INSPECTION_HISTORY_MISSING','Inspection history table is unavailable. Apply the SQL migration.',503)
  return (result.data||[]).map((r:Record<string,unknown>)=>({id:String(r.id),url:String(r.url),inspectedAt:String(r.inspected_at),verdict:String(r.verdict),coverageState:String(r.coverage_state),persisted:r.success===true}))
}
export async function googleDiagnostics():Promise<Diagnostics>{
  let serviceAccount:string|null=null
  let configured=Boolean(process.env.SEO_GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim())
  if(configured)try{serviceAccount=readCredential().email}catch{configured=false}
  let budget:Diagnostics['inspectionBudget']=null
  try {const client=await db();const r=await client.from('ac_seo_google_daily_quota').select('day,used').eq('day',dateUTC(0)).maybeSingle();if(!r.error)budget={day:dateUTC(0),used:Number(r.data?.used||0),limit:300}}catch{}
  return {project:SEO_GOOGLE_PROJECT,searchProperty:SEO_SEARCH_SITE,ga4Property:SEO_GA4_PROPERTY,configured,serviceAccount,cacheAgeSeconds:cache?Math.max(0,Math.floor((Date.now()-cache.at)/1000)):null,inspectionBudget:budget,notes:['All credentials remain server-side.','Read-only Google API scopes.','URL inspections are explicitly requested and reserved atomically in the existing database.','Google free quota enforcement remains authoritative.']}
}
