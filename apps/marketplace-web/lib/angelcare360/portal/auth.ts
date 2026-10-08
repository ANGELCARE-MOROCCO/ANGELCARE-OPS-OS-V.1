import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { APP_SESSION_COOKIE, APP_SESSION_COOKIE_DOMAIN, generateSessionToken, verifyPassword } from '@/lib/ac360-portability/auth-session'
import { PORTAL_DEFAULT_ROUTE } from '@/data/angelcare360/role-portals'
import { DEMO_COOKIE } from '@/lib/sanila-demo/authority'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

export type LinkedPortalPersona = {
  kind: Angelcare360PortalKind
  personId: string
  schoolId: string
  personLabel: string
  schoolLabel: string
  detail: string | null
}

const COOKIE_KIND='sanila_portal_kind'
const COOKIE_PERSON='sanila_portal_person'
const COOKIE_SCHOOL='sanila_portal_school'

function text(value: unknown, fallback='') { const raw=String(value ?? '').trim(); return raw || fallback }
function isTeacherType(value: unknown) { const raw=text(value).toLowerCase(); return raw.includes('teach') || raw.includes('enseign') }
export function safePortalNext(value: string, kind?: Angelcare360PortalKind | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('://')) return ''
  if (kind && !value.startsWith(`/angelcare-360-${kind}`)) return ''
  return value
}

export async function listLinkedPortalPersonas(userId: string): Promise<LinkedPortalPersona[]> {
  const db=await createClient()
  const [parents,students,staff]=await Promise.all([
    db.from('angelcare360_parents').select('id,school_id,full_name,parent_code,status').eq('portal_app_user_id',userId).eq('status','active'),
    db.from('angelcare360_students').select('id,school_id,full_name,student_code,status').eq('portal_app_user_id',userId).eq('status','active'),
    db.from('angelcare360_staff').select('id,school_id,full_name,staff_code,staff_type,department,status').eq('portal_app_user_id',userId).eq('status','active'),
  ])
  if (parents.error || students.error || staff.error) throw new Error('PORTAL_IDENTITY_LOOKUP_FAILED')
  const raw:Array<{kind:Angelcare360PortalKind;personId:string;schoolId:string;personLabel:string;detail:string|null}>=[]
  for(const row of parents.data||[]) raw.push({kind:'parent',personId:String(row.id),schoolId:String(row.school_id),personLabel:text(row.full_name,'Parent'),detail:text(row.parent_code)||null})
  for(const row of students.data||[]) raw.push({kind:'student',personId:String(row.id),schoolId:String(row.school_id),personLabel:text(row.full_name,'Élève'),detail:text(row.student_code)||null})
  for(const row of staff.data||[]) raw.push({kind:isTeacherType(row.staff_type)?'teacher':'staff',personId:String(row.id),schoolId:String(row.school_id),personLabel:text(row.full_name,isTeacherType(row.staff_type)?'Enseignant':'Collaborateur'),detail:[text(row.staff_code),text(row.department)].filter(Boolean).join(' · ')||null})
  const schoolIds=[...new Set(raw.map(item=>item.schoolId).filter(Boolean))]
  const schools=schoolIds.length ? await db.from('angelcare360_schools').select('id,name,status').in('id',schoolIds).eq('status','active') : {data:[],error:null}
  if (schools.error) throw new Error('PORTAL_SCHOOL_LOOKUP_FAILED')
  const schoolMap=new Map((schools.data||[]).map(row=>[String(row.id),text(row.name,'Établissement SANILA')]))
  return raw.filter(item=>schoolMap.has(item.schoolId)).map(item=>({...item,schoolLabel:schoolMap.get(item.schoolId)!}))
}

export async function setPortalContext(persona: LinkedPortalPersona, expiresAt: Date) {
  const store=await cookies()
  const options={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',expires:expiresAt}
  store.set(COOKIE_KIND,persona.kind,options)
  store.set(COOKIE_PERSON,persona.personId,options)
  store.set(COOKIE_SCHOOL,persona.schoolId,options)
}

export async function clearPortalContext() {
  const store=await cookies()
  store.delete(COOKIE_KIND); store.delete(COOKIE_PERSON); store.delete(COOKIE_SCHOOL)
}

export async function authenticatePortalCredentials(input:{username:string;password:string;requestedKind?:Angelcare360PortalKind|null;next?:string|null}) {
  const username=text(input.username).toLowerCase(); const password=String(input.password||'')
  if(!username||!password) return {ok:false as const,error:'missing' as const}
  const db=await createClient()
  const byUsername=await db.from('app_users').select('id,password_hash,status').eq('username',username).limit(2)
  const byEmail=byUsername.data?.length?null:await db.from('app_users').select('id,password_hash,status').ilike('email',username).limit(2)
  const candidates=byUsername.data?.length?byUsername.data:(byEmail?.data||[])
  if(byUsername.error||byEmail?.error||candidates.length!==1) return {ok:false as const,error:'invalid' as const}
  const user=candidates[0]
  if(user.status!=='active') return {ok:false as const,error:'inactive' as const}
  if(!user.password_hash||!(await verifyPassword(password,String(user.password_hash)))) return {ok:false as const,error:'invalid' as const}
  let personas:LinkedPortalPersona[]
  try { personas=await listLinkedPortalPersonas(String(user.id)) } catch { return {ok:false as const,error:'server' as const} }
  if(input.requestedKind) personas=personas.filter(persona=>persona.kind===input.requestedKind)
  if(!personas.length) return {ok:false as const,error:'role' as const}
  const token=generateSessionToken(); const expiresAt=new Date(Date.now()+12*3600000)
  const session=await db.from('app_sessions').insert({user_id:user.id,session_token:token,expires_at:expiresAt.toISOString()})
  if(session.error) return {ok:false as const,error:'server' as const}
  const loginUpdate=await db.from('app_users').update({last_login_at:new Date().toISOString()}).eq('id',user.id)
  if(loginUpdate.error){await db.from('app_sessions').delete().eq('session_token',token);return {ok:false as const,error:'server' as const}}
  const store=await cookies(); store.set(DEMO_COOKIE,'',{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',expires:new Date(0)}); store.set(APP_SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',expires:expiresAt,...(APP_SESSION_COOKIE_DOMAIN?{domain:APP_SESSION_COOKIE_DOMAIN}:{})})
  await clearPortalContext()
  const safeNext=safePortalNext(text(input.next),input.requestedKind||null)
  if(personas.length===1){await setPortalContext(personas[0],expiresAt);return {ok:true as const,select:false as const,redirectTo:safeNext||PORTAL_DEFAULT_ROUTE[personas[0].kind],persona:personas[0]}}
  const qs=new URLSearchParams(); if(input.requestedKind) qs.set('portal',input.requestedKind); if(safeNext) qs.set('next',safeNext)
  return {ok:true as const,select:true as const,redirectTo:`/angelcare-360-portal/select?${qs.toString()}`}
}

export async function selectPortalPersona(input:{userId:string;kind:Angelcare360PortalKind;personId:string;schoolId:string;next?:string|null}) {
  const personas=await listLinkedPortalPersonas(input.userId)
  const chosen=personas.find(item=>item.kind===input.kind&&item.personId===input.personId&&item.schoolId===input.schoolId)
  if(!chosen) throw new Error('Le contexte portail sélectionné n’est plus autorisé.')
  const store=await cookies(); const sessionToken=store.get(APP_SESSION_COOKIE)?.value
  if(!sessionToken) throw new Error('Session absente.')
  const db=await createClient(); const session=await db.from('app_sessions').select('expires_at').eq('session_token',sessionToken).eq('user_id',input.userId).maybeSingle()
  if(session.error||!session.data) throw new Error('Session invalide.')
  const expiresAt=new Date(String(session.data.expires_at)); await setPortalContext(chosen,expiresAt)
  return safePortalNext(text(input.next),chosen.kind)||PORTAL_DEFAULT_ROUTE[chosen.kind]
}
