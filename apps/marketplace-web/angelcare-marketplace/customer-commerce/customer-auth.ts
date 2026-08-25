import { redirect } from 'next/navigation'
import { createServiceClient, createUserClient } from '@/lib/supabase/server'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplacePermission, MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { emailValue, localeValue, passwordValue, phoneValue, requiredText } from './validation'
import type { CustomerAccount, CustomerContext } from './types'

const CUSTOMER_PERMISSIONS: MarketplacePermission[] = [
  'marketplace.workspace.access',
  'marketplace.journeys.view',
  'marketplace.journeys.actions.manage',
  'marketplace.journeys.documents.manage',
  'marketplace.journeys.notifications.manage',
  'marketplace.journeys.recovery.manage',
  'marketplace.family.access',
  'marketplace.family.dashboard',
  'marketplace.family.profile.view',
  'marketplace.family.profile.manage',
  'marketplace.family.children.view',
  'marketplace.family.children.manage',
  'marketplace.family.diagnostics.create',
  'marketplace.family.diagnostics.view',
  'marketplace.family.requests.create',
  'marketplace.family.requests.view',
  'marketplace.family.missions.view',
  'marketplace.family.support.create',
  'marketplace.family.support.view',
]

type Row = Record<string, unknown>
const text = (value: unknown) => typeof value === 'string' ? value : ''
const nullable = (value: unknown) => text(value) || null

function mapAccount(row: Row): CustomerAccount {
  return {
    id: text(row.id), public_reference: text(row.public_reference), auth_user_id: text(row.auth_user_id),
    account_kind: text(row.account_kind) as CustomerAccount['account_kind'], status: text(row.status) as CustomerAccount['status'],
    display_name: text(row.display_name), email: nullable(row.email), phone: nullable(row.phone),
    preferred_locale: localeValue(row.preferred_locale), family_account_id: nullable(row.family_account_id),
    crm_account_id: nullable(row.crm_account_id), tenant_id: nullable(row.tenant_id), territory_id: nullable(row.territory_id),
    email_verified_at: nullable(row.email_verified_at), phone_verified_at: nullable(row.phone_verified_at),
    premium_status: Boolean(row.premium_status), created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

async function customerAccountByAuthId(authUserId: string): Promise<CustomerAccount | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_customer_accounts').select('*').eq('auth_user_id', authUserId).maybeSingle()
  if (error && error.code !== '42P01') throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de charger le compte client.', { cause: error })
  return data ? mapAccount(data as Row) : null
}

async function ensureFamilyLink(account: CustomerAccount): Promise<CustomerAccount> {
  if (account.account_kind !== 'family' || account.family_account_id) return account
  const db = await createServiceClient()
  const { data: existing } = await db.from('angelcare_marketplace_family_accounts').select('id').eq('app_user_id', account.auth_user_id).maybeSingle()
  let familyId = existing?.id ? String(existing.id) : null
  if (!familyId) {
    const { data, error } = await db.from('angelcare_marketplace_family_accounts').insert({
      app_user_id: account.auth_user_id, display_name: account.display_name, email: account.email,
      phone: account.phone, preferred_locale: account.preferred_locale, status: 'active', onboarding_status: 'in_progress', consent_status: 'pending',
    }).select('id').single()
    if (error || !data) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de créer le dossier famille canonique.', { cause: error })
    familyId = String(data.id)
  }
  const { data: updated, error: updateError } = await db.from('angelcare_marketplace_customer_accounts').update({ family_account_id: familyId, updated_at: new Date().toISOString() }).eq('id', account.id).select('*').single()
  if (updateError || !updated) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de lier le dossier famille.', { cause: updateError })
  return mapAccount(updated as Row)
}

export async function getCustomerContext(): Promise<CustomerContext | null> {
  const userClient = await createUserClient()
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return null
  let account = await customerAccountByAuthId(user.id)
  if (!account) return null
  account = await ensureFamilyLink(account)
  if (!['active','pending_verification'].includes(account.status)) return null
  const marketplace: MarketplaceRequestContext = {
    actor: { id: user.id, email: account.email, displayName: account.display_name, sourceRole: 'marketplace_customer' },
    roleKeys: ['marketplace_customer'], permissions: CUSTOMER_PERMISSIONS,
    assignments: [{ roleKey: 'marketplace_customer', scopeType: 'self', territoryId: account.territory_id, tenantId: account.tenant_id }],
    territoryId: account.territory_id, tenantId: account.tenant_id, locale: account.preferred_locale, sessionReference: user.id,
  }
  return { account, authUserId: user.id, locale: account.preferred_locale, marketplace }
}

export async function requireCustomerContext(): Promise<CustomerContext> {
  const context = await getCustomerContext()
  if (!context) throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Connectez-vous à Mon ANGELCARE pour continuer.')
  return context
}

export async function requireCustomerPageContext(locale: CatalogLocale, returnTo?: string): Promise<CustomerContext> {
  const context = await getCustomerContext()
  if (!context) redirect(`/angelcare-marketplace/${locale}/auth/login?returnTo=${encodeURIComponent(returnTo || `/angelcare-marketplace/${locale}/account`)}`)
  return context
}

export async function registerCustomer(input: { fullName: unknown; email: unknown; phone?: unknown; password: unknown; locale?: unknown; accountKind?: unknown; returnTo?: string }): Promise<{ account: CustomerAccount | null; verificationRequired: boolean }> {
  const fullName = requiredText(input.fullName, 'fullName', 180)
  const email = emailValue(input.email)
  const phone = phoneValue(input.phone)
  const password = passwordValue(input.password)
  const locale = localeValue(input.locale)
  const accountKind = input.accountKind === 'organization' ? 'organization' : 'family'
  const userClient = await createUserClient()
  const { data, error } = await userClient.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, phone, marketplace_account_kind: accountKind, locale }, emailRedirectTo: input.returnTo },
  })
  if (error) throw new MarketplaceError('CONFLICT', error.message || 'Inscription impossible.', { cause: error })
  if (!data.user?.id) return { account: null, verificationRequired: true }
  const db = await createServiceClient()
  const { data: row, error: accountError } = await db.from('angelcare_marketplace_customer_accounts').upsert({
    auth_user_id: data.user.id, account_kind: accountKind, status: data.user.email_confirmed_at ? 'active' : 'pending_verification',
    display_name: fullName, email, phone, preferred_locale: locale,
    email_verified_at: data.user.email_confirmed_at || null, premium_status: false, updated_at: new Date().toISOString(),
  }, { onConflict: 'auth_user_id' }).select('*').single()
  if (accountError || !row) throw new MarketplaceError('INTERNAL_ERROR', 'Le compte sécurisé existe, mais son dossier Marketplace n’a pas pu être initialisé.', { cause: accountError })
  return { account: mapAccount(row as Row), verificationRequired: !data.session }
}

export async function loginCustomer(input: { email: unknown; password: unknown }): Promise<CustomerAccount> {
  const userClient = await createUserClient()
  const { data, error } = await userClient.auth.signInWithPassword({ email: emailValue(input.email), password: String(input.password || '') })
  if (error || !data.user) throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Email ou mot de passe incorrect.', { cause: error })
  const account = await customerAccountByAuthId(data.user.id)
  if (!account) throw new MarketplaceError('CONFIGURATION_ERROR', 'Le compte existe mais son dossier Marketplace est introuvable.')
  if (account.status === 'suspended' || account.status === 'closed') throw new MarketplaceError('PERMISSION_DENIED', 'Ce compte ne peut pas se connecter actuellement.')
  const db = await createServiceClient()
  await db.from('angelcare_marketplace_customer_accounts').update({
    status: 'active', email_verified_at: data.user.email_confirmed_at || account.email_verified_at,
    last_login_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', account.id)
  return { ...account, status: 'active', email_verified_at: data.user.email_confirmed_at || account.email_verified_at }
}

export async function logoutCustomer(): Promise<void> {
  const userClient = await createUserClient()
  const { error } = await userClient.auth.signOut()
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Déconnexion impossible.', { cause: error })
}

export async function requestCustomerRecovery(email: unknown, redirectTo: string): Promise<void> {
  const userClient = await createUserClient()
  const { error } = await userClient.auth.resetPasswordForEmail(emailValue(email), { redirectTo })
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible d’envoyer le lien de récupération.', { cause: error })
}

export async function updateCustomerPassword(password: unknown): Promise<void> {
  const userClient = await createUserClient()
  const { error } = await userClient.auth.updateUser({ password: passwordValue(password) })
  if (error) throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de mettre à jour le mot de passe.', { cause: error })
}

export async function claimGuestCommerce(input: { visitorReference: string; account: CustomerAccount }): Promise<{ conversions: number; journeys: number }> {
  const db = await createServiceClient()
  const { data, error } = await db.rpc('angelcare_marketplace_claim_guest_commerce', {
    p_customer_account_id: input.account.id, p_auth_user_id: input.account.auth_user_id,
    p_visitor_reference: input.visitorReference, p_email: input.account.email,
  })
  if (error && error.code !== '42883') throw new MarketplaceError('INTERNAL_ERROR', 'Impossible de rattacher le parcours invité.', { cause: error })
  const result = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  return { conversions: Number(result.conversions || 0), journeys: Number(result.journeys || 0) }
}

export async function sendCustomerMagicLink(input:{email:unknown;locale:unknown;redirectTo:string}):Promise<void>{
 const userClient=await createUserClient();const email=emailValue(input.email)
 const{error}=await userClient.auth.signInWithOtp({email,options:{emailRedirectTo:input.redirectTo,shouldCreateUser:false}})
 if(error)throw new MarketplaceError('INTERNAL_ERROR','Impossible d’envoyer le lien sécurisé.',{cause:error})
}
export async function sendCustomerPhoneOtp(phone:unknown):Promise<void>{
 const userClient=await createUserClient();const value=phoneValue(phone)
 if(!value)throw new MarketplaceError('VALIDATION_ERROR','Un numéro de téléphone valide est requis.')
 const{error}=await userClient.auth.signInWithOtp({phone:value,options:{shouldCreateUser:false}})
 if(error)throw new MarketplaceError('CONFIGURATION_ERROR','L’OTP téléphone nécessite un fournisseur SMS Supabase activé.',{cause:error})
}
export async function verifyCustomerPhoneOtp(input:{phone:unknown;token:unknown}):Promise<CustomerAccount>{
 const userClient=await createUserClient();const phone=phoneValue(input.phone);const token=requiredText(input.token,'token',12)
 if(!phone)throw new MarketplaceError('VALIDATION_ERROR','Le téléphone est requis.')
 const{data,error}=await userClient.auth.verifyOtp({phone,token,type:'sms'})
 if(error||!data.user)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Code OTP invalide ou expiré.',{cause:error})
 const account=await customerAccountByAuthId(data.user.id);if(!account)throw new MarketplaceError('CONFIGURATION_ERROR','Dossier client introuvable.')
 const db=await createServiceClient();await db.from('angelcare_marketplace_customer_accounts').update({phone_verified_at:new Date().toISOString(),status:'active',updated_at:new Date().toISOString()}).eq('id',account.id)
 return{...account,phone_verified_at:new Date().toISOString(),status:'active'}
}
export async function logoutCustomerEverywhere():Promise<void>{
 const userClient=await createUserClient();const{error}=await userClient.auth.signOut({scope:'global'})
 if(error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de fermer toutes les sessions.',{cause:error})
}
export async function customerSessionSummary():Promise<{currentUserId:string;lastSignInAt:string|null;email:string|null;phone:string|null}>{
 const userClient=await createUserClient();const{data:{user},error}=await userClient.auth.getUser();if(error||!user)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Connexion requise.')
 return{currentUserId:user.id,lastSignInAt:user.last_sign_in_at||null,email:user.email||null,phone:user.phone||null}
}
