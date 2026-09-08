import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { hashPassword } from '@/lib/auth/session'
import { sendAngelcare360Email } from '@/lib/angelcare360/email/email-os-bridge'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { createClient } from '@/lib/supabase/server'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

const text=(value:unknown,fallback='')=>{const raw=value==null?'':String(value).trim();return raw||fallback}
const TOKEN_TTL_MS=7*24*60*60*1000
const PASSWORD_MIN=12
type DatabaseClient = Awaited<ReturnType<typeof createClient>>
function digest(value:string){return createHash('sha256').update(value).digest('hex')}
function baseUrl(){const raw=String(process.env.NEXT_PUBLIC_APP_URL||process.env.APP_URL||'https://my.angelcarehub.com').trim().replace(/\/$/,'');return /^https?:\/\//i.test(raw)?raw:'https://my.angelcarehub.com'}
function profileTable(kind:Angelcare360PortalKind){return kind==='parent'?'angelcare360_parents':kind==='student'?'angelcare360_students':'angelcare360_staff'}

async function requireInvitationManager(){
  const context=await getAngelcare360AccessContext()
  if(!context?.school) throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.',404)
  const canConfigure=context.access.accessLevel==='super_admin'||context.access.canSeeConfiguration||context.permissions.has('angelcare360.administration.configure')||context.permissions.has('angelcare360.people.manage')||['direction','administration','owner','ceo'].includes(text(context.primaryRoleKey).toLowerCase())
  if(!canConfigure) throw new Angelcare360AccessError('Vous n’avez pas l’autorisation de gérer les accès portail.',403)
  return context
}

type InvitationManagerContext = Awaited<ReturnType<typeof requireInvitationManager>>

export type PreparedPortalInvitation={id:string;state:'smtp_accepted'|'failed'|'simulated';email:string;expiresAt:string;deliveryReference:string|null;activationUrl:string|null;message:string}

export async function preparePortalInvitation(input:{kind:Angelcare360PortalKind;personId:string;email?:string|null;roleId?:string|null;reason?:string|null}):Promise<PreparedPortalInvitation>{
  const context=await requireInvitationManager(); const db=await createClient(); const schoolId=context.school!.id; const kind=input.kind
  const table=profileTable(kind)
  const {data:person,error:personError}=await db.from(table).select('*').eq('school_id',schoolId).eq('id',input.personId).eq('status','active').maybeSingle()
  if(personError||!person) throw new Angelcare360AccessError('Le profil ciblé n’appartient pas à cet établissement ou n’est pas actif.',404)
  if(person.portal_app_user_id) throw new Angelcare360AccessError('Ce profil possède déjà un compte portail actif.',409)
  const email=text(input.email||person.email).toLowerCase(); if(!email||!/^\S+@\S+\.\S+$/.test(email)) throw new Angelcare360AccessError('Une adresse e-mail valide est requise pour l’activation.',422)
  return createInvitation({db,context,portalKind:kind,personId:input.personId,email,roleId:input.roleId||null,fullName:text(person.full_name,`${text(person.first_name)} ${text(person.last_name)}`.trim()||email),reason:input.reason||null})
}

export async function prepareSchoolUserInvitation(input:{email:string;fullName?:string|null;roleId:string;personId?:string|null;reason?:string|null}){
  const context=await requireInvitationManager(); const db=await createClient(); const schoolId=context.school!.id
  const email=text(input.email).toLowerCase(); if(!/^\S+@\S+\.\S+$/.test(email)) throw new Angelcare360AccessError('Une adresse e-mail valide est requise.',422)
  const {data:role}=await db.from('angelcare360_roles').select('id,label,status').eq('school_id',schoolId).eq('id',input.roleId).eq('status','active').maybeSingle(); if(!role) throw new Angelcare360AccessError('Ce rôle n’appartient pas à l’établissement.',403)
  return createInvitation({db,context,portalKind:'school_user',personId:input.personId||null,email,roleId:input.roleId,fullName:text(input.fullName,email.split('@')[0]),reason:input.reason||null})
}

async function createInvitation({db,context,portalKind,personId,email,roleId,fullName,reason}:{db:DatabaseClient;context:InvitationManagerContext;portalKind:Angelcare360PortalKind|'school_user';personId:string|null;email:string;roleId:string|null;fullName:string;reason:string|null}):Promise<PreparedPortalInvitation>{
  const schoolId=context.school!.id
  const token=randomBytes(32).toString('base64url'); const tokenDigest=digest(token); const expiresAt=new Date(Date.now()+TOKEN_TTL_MS).toISOString()
  await db.from('angelcare360_portal_invitations').update({state:'revoked',revoked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('school_id',schoolId).eq('email',email).in('state',['prepared','smtp_accepted','opened'])
  const {data:inv,error}=await db.from('angelcare360_portal_invitations').insert({school_id:schoolId,portal_kind:portalKind,person_id:personId,role_id:roleId,email,token_digest:tokenDigest,state:'prepared',expires_at:expiresAt,invited_by:context.user.id,metadata_json:{full_name:fullName,reason:reason||null}}).select('id').single()
  if(error||!inv) throw new Angelcare360AccessError(error?.message||'Impossible de préparer l’invitation.',500)
  const activationUrl=`${baseUrl()}/angelcare-360-access/activate?token=${encodeURIComponent(token)}`
  const mail=await sendAngelcare360Email({toEmail:email,subject:`Activez votre accès SANILA · ${context.school!.name}`,body:[`Bonjour ${fullName},`,'',`${context.school!.name} vous invite à activer votre espace sécurisé SANILA.`,`Ce lien est personnel et expire dans 7 jours :`,activationUrl,'','Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.'].join('\n'),templateKey:'onboarding',metadata:{schoolId,entityType:'portal_invitation',entityId:String(inv.id),portalKind}})
  const now=new Date().toISOString()
  if(mail.ok){
    const state=mail.locked?'simulated':'smtp_accepted'
    await db.from('angelcare360_portal_invitations').update({state:mail.locked?'prepared':'smtp_accepted',delivery_reference:mail.emailId||null,last_sent_at:now,failure_message:null,updated_at:now,metadata_json:{full_name:fullName,reason:reason||null,delivery_state:state}}).eq('id',inv.id).eq('school_id',schoolId)
    return {id:String(inv.id),state:state as 'smtp_accepted'|'simulated',email,expiresAt,deliveryReference:mail.emailId||null,activationUrl:mail.locked?activationUrl:null,message:mail.locked?'Invitation préparée en mode démonstration sécurisé; aucun message externe n’a été envoyé.':`Invitation acceptée par la messagerie pour ${email}.`}
  }
  await db.from('angelcare360_portal_invitations').update({state:'failed',failure_message:mail.error||'Envoi indisponible',updated_at:now,metadata_json:{full_name:fullName,reason:reason||null,delivery_state:'failed'}}).eq('id',inv.id).eq('school_id',schoolId)
  return {id:String(inv.id),state:'failed',email,expiresAt,deliveryReference:null,activationUrl:null,message:`Invitation préparée mais non envoyée : ${mail.error||'messagerie indisponible'}.`}
}

export async function resendPortalInvitation(invitationId:string){
  const context=await requireInvitationManager(); const db=await createClient(); const schoolId=context.school!.id
  const {data:inv}=await db.from('angelcare360_portal_invitations').select('*').eq('school_id',schoolId).eq('id',invitationId).maybeSingle(); if(!inv) throw new Angelcare360AccessError('Invitation introuvable.',404)
  if(inv.state==='accepted'||inv.state==='revoked') throw new Angelcare360AccessError('Cette invitation n’est plus renvoyable.',409)
  if(inv.portal_kind==='school_user') return prepareSchoolUserInvitation({email:inv.email,fullName:inv.metadata_json?.full_name||null,roleId:inv.role_id,personId:inv.person_id||null,reason:'Renvoi de l’invitation'})
  return preparePortalInvitation({kind:inv.portal_kind as Angelcare360PortalKind,personId:inv.person_id,email:inv.email,roleId:inv.role_id,reason:'Renvoi de l’invitation'})
}

export async function revokePortalInvitation(invitationId:string){
  const context=await requireInvitationManager(); const db=await createClient(); const now=new Date().toISOString()
  const {data,error}=await db.from('angelcare360_portal_invitations').update({state:'revoked',revoked_at:now,updated_at:now}).eq('school_id',context.school!.id).eq('id',invitationId).in('state',['prepared','smtp_accepted','opened','failed']).select('id').maybeSingle(); if(error||!data) throw new Angelcare360AccessError('Invitation introuvable ou déjà terminée.',404)
  return {ok:true,message:'Invitation révoquée.'}
}

export async function inspectPortalInvitationToken(token:string){
  const tokenDigest=digest(text(token)); if(!tokenDigest) return null; const db=await createClient()
  const {data}=await db.from('angelcare360_portal_invitations').select('id,school_id,portal_kind,email,state,expires_at,metadata_json').eq('token_digest',tokenDigest).maybeSingle(); if(!data) return null
  const expired=new Date(data.expires_at).getTime()<=Date.now(); if(expired&&['prepared','smtp_accepted','opened'].includes(data.state)) await db.from('angelcare360_portal_invitations').update({state:'expired',updated_at:new Date().toISOString()}).eq('id',data.id)
  return {...data,expired}
}

function validatePassword(password:string){
  if(password.length<PASSWORD_MIN) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`
  if(!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password)||!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) return 'Utilisez au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
  return null
}

export async function acceptPortalInvitation(input:{token:string;password:string;passwordConfirmation:string}){
  const token=text(input.token); if(!token) throw new Angelcare360AccessError('Jeton d’activation manquant.',422)
  if(input.password!==input.passwordConfirmation) throw new Angelcare360AccessError('Les mots de passe ne correspondent pas.',422)
  const passwordError=validatePassword(input.password); if(passwordError) throw new Angelcare360AccessError(passwordError,422)
  const invitation=await inspectPortalInvitationToken(token); if(!invitation) throw new Angelcare360AccessError('Ce lien d’activation est invalide.',404)
  if(invitation.expired||invitation.state==='expired') throw new Angelcare360AccessError('Ce lien d’activation a expiré.',410)
  if(!['prepared','smtp_accepted','opened'].includes(invitation.state)) throw new Angelcare360AccessError('Ce lien d’activation n’est plus disponible.',409)
  const db=await createClient(); const username=text(invitation.email).toLowerCase(); const passwordHash=await hashPassword(input.password); const fullName=text(invitation.metadata_json?.full_name,username.split('@')[0])
  const {data,error}=await db.rpc('angelcare360_accept_portal_invitation_v1',{p_token_digest:digest(token),p_password_hash:passwordHash,p_username:username,p_full_name:fullName})
  if(error) throw new Angelcare360AccessError(error.message||'Activation impossible.',500)
  return data as {app_user_id:string;school_id:string;portal_kind:string}
}
