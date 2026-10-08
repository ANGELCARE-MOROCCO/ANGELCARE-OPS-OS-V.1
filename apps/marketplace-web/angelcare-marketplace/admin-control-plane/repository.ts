import { randomBytes, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type {
  AdminCustomerDossier,
  AdminCustomerList,
  AdminCustomerSummary,
  AdminPaymentDossier,
  AdminPaymentRecord,
  AdminPaymentSummary,
  ManualOrderInput,
} from './types'
import type { PaymentIntentStatus } from '../customer-commerce/types'

type Row = Record<string, unknown>

const text = (value: unknown): string => typeof value === 'string' ? value : ''
const nullable = (value: unknown): string | null => text(value) || null
const num = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0
const rows = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object')
  : []

function fail(operation: string, error: { code?: string; message?: string } | null): MarketplaceError {
  return new MarketplaceError(
    error?.code === '42P01' ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    error?.code === '42P01'
      ? 'Le socle de données Marketplace requis par ce workspace n’est pas disponible.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined },
  )
}

function safeSearch(value: string): string {
  return value.replaceAll('%', ' ').replaceAll(',', ' ').replaceAll('(', ' ').replaceAll(')', ' ').trim().slice(0, 120)
}

function mapCustomer(row: Row, orderCount = 0, paymentCount = 0): AdminCustomerSummary {
  return {
    id: text(row.id),
    public_reference: text(row.public_reference),
    auth_user_id: text(row.auth_user_id),
    account_kind: text(row.account_kind) as AdminCustomerSummary['account_kind'],
    status: text(row.status) as AdminCustomerSummary['status'],
    display_name: text(row.display_name),
    email: nullable(row.email),
    phone: nullable(row.phone),
    preferred_locale: (text(row.preferred_locale) || 'fr') as AdminCustomerSummary['preferred_locale'],
    family_account_id: nullable(row.family_account_id),
    territory_id: nullable(row.territory_id),
    premium_status: Boolean(row.premium_status),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
    order_count: orderCount,
    payment_count: paymentCount,
  }
}

async function customerRow(customerId: string): Promise<Row> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_customer_accounts')
    .select('*')
    .eq('id', customerId)
    .single()
  if (error || !data) throw new MarketplaceError('NOT_FOUND', 'Client Marketplace introuvable.', { cause: error || undefined })
  return data as Row
}

async function familyRowForCustomer(account: Row): Promise<Row | null> {
  const db = await createServiceClient()
  if (account.family_account_id) {
    const { data, error } = await db
      .from('angelcare_marketplace_family_accounts')
      .select('*')
      .eq('id', String(account.family_account_id))
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw fail('charger le dossier famille', error)
    if (data) return data as Row
  }
  const { data, error } = await db
    .from('angelcare_marketplace_family_accounts')
    .select('*')
    .eq('app_user_id', String(account.auth_user_id))
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw fail('résoudre le dossier famille', error)
  return data ? data as Row : null
}

async function ensureFamilyForCustomer(account: Row, context: MarketplaceRequestContext): Promise<Row> {
  const existing = await familyRowForCustomer(account)
  if (existing) return existing

  const db = await createServiceClient()
  const { data, error } = await db
    .from('angelcare_marketplace_family_accounts')
    .insert({
      app_user_id: String(account.auth_user_id),
      display_name: String(account.display_name || 'Famille ANGELCARE'),
      email: nullable(account.email),
      phone: nullable(account.phone),
      preferred_locale: text(account.preferred_locale) || 'fr',
      territory_id: nullable(account.territory_id),
      status: 'active',
      onboarding_status: 'in_progress',
      consent_status: 'pending',
    })
    .select('*')
    .single()
  if (error || !data) throw fail('créer le dossier famille', error)

  const { data: updated, error: updateError } = await db
    .from('angelcare_marketplace_customer_accounts')
    .update({ family_account_id: data.id, updated_at: new Date().toISOString() })
    .eq('id', String(account.id))
    .select('*')
    .single()
  if (updateError || !updated) throw fail('lier le dossier famille au client', updateError)

  await writeMarketplaceAudit({
    context,
    requestId: randomUUID(),
    action: 'marketplace.customer.family_linked',
    objectType: 'customer_account',
    objectId: String(account.id),
    result: 'success',
    source: 'admin-customer-command',
    afterValue: { familyAccountId: data.id },
  })
  return data as Row
}

export async function adminCustomerList(input: {
  query?: string
  accountKind?: string
  status?: string
  limit?: number
} = {}): Promise<AdminCustomerList> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_customer_accounts')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(input.limit || 300, 1), 500))

  const search = safeSearch(String(input.query || ''))
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,public_reference.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (input.accountKind && input.accountKind !== 'all') query = query.eq('account_kind', input.accountKind)
  if (input.status && input.status !== 'all') query = query.eq('status', input.status)

  const { data, error, count } = await query
  if (error) throw fail('charger les clients', error)

  const accountRows = rows(data)
  const ids = accountRows.map((row) => String(row.id))
  let orderCounts = new Map<string, number>()
  let paymentCounts = new Map<string, number>()

  if (ids.length) {
    const [{ data: journeys }, { data: payments }] = await Promise.all([
      db.from('angelcare_marketplace_journeys').select('customer_account_id').in('customer_account_id', ids),
      db.from('angelcare_marketplace_payment_intents').select('customer_account_id').in('customer_account_id', ids),
    ])
    for (const row of rows(journeys)) {
      const id = text(row.customer_account_id)
      orderCounts.set(id, (orderCounts.get(id) || 0) + 1)
    }
    for (const row of rows(payments)) {
      const id = text(row.customer_account_id)
      paymentCounts.set(id, (paymentCounts.get(id) || 0) + 1)
    }
  }

  const customers = accountRows.map((row) => mapCustomer(
    row,
    orderCounts.get(String(row.id)) || 0,
    paymentCounts.get(String(row.id)) || 0,
  ))

  return {
    customers,
    total: count || customers.length,
    active: customers.filter((item) => item.status === 'active').length,
    families: customers.filter((item) => item.account_kind === 'family').length,
    organizations: customers.filter((item) => item.account_kind === 'organization').length,
    restricted: customers.filter((item) => ['restricted', 'suspended'].includes(item.status)).length,
  }
}

export async function adminCustomerDossier(customerId: string): Promise<AdminCustomerDossier> {
  const account = await customerRow(customerId)
  const family = await familyRowForCustomer(account)
  const db = await createServiceClient()

  const [
    { data: addresses, error: addressError },
    { data: memberships, error: membershipError },
    { data: preferences, error: preferenceError },
    { data: wallet, error: walletError },
    { data: orders, error: ordersError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    db.from('angelcare_marketplace_customer_addresses').select('*').eq('customer_account_id', customerId).order('is_default', { ascending: false }).order('updated_at', { ascending: false }),
    db.from('angelcare_marketplace_customer_organization_memberships').select('*').eq('customer_account_id', customerId).order('updated_at', { ascending: false }),
    db.from('angelcare_marketplace_customer_notification_preferences').select('*').eq('customer_account_id', customerId).maybeSingle(),
    db.from('angelcare_marketplace_wallet_accounts').select('*').eq('customer_account_id', customerId).maybeSingle(),
    db.from('angelcare_marketplace_journeys').select('id,public_reference,journey_type,status,title,financial_status,fulfillment_status,next_action_label,next_action_due_at,scheduled_start_at,updated_at').eq('customer_account_id', customerId).order('updated_at', { ascending: false }).limit(100),
    db.from('angelcare_marketplace_payment_intents').select('*').eq('customer_account_id', customerId).order('updated_at', { ascending: false }).limit(100),
  ])
  if (addressError) throw fail('charger les adresses client', addressError)
  if (membershipError) throw fail('charger les affiliations organisationnelles', membershipError)
  if (preferenceError && preferenceError.code !== 'PGRST116') throw fail('charger les préférences client', preferenceError)
  if (walletError && walletError.code !== 'PGRST116') throw fail('charger le Wallet client', walletError)
  if (ordersError) throw fail('charger les commandes client', ordersError)
  if (paymentsError) throw fail('charger les paiements client', paymentsError)

  let children: Row[] = []
  let familyRequests: Row[] = []
  let supportTickets: Row[] = []
  if (family) {
    const [{ data: childRows, error: childError }, { data: requestRows, error: requestError }, { data: ticketRows, error: ticketError }] = await Promise.all([
      db.from('angelcare_marketplace_family_children').select('*').eq('family_account_id', String(family.id)).order('created_at', { ascending: false }),
      db.from('angelcare_marketplace_family_quote_requests').select('*').eq('family_account_id', String(family.id)).order('created_at', { ascending: false }).limit(100),
      db.from('angelcare_marketplace_family_support_tickets').select('*').eq('family_account_id', String(family.id)).order('updated_at', { ascending: false }).limit(100),
    ])
    if (childError) throw fail('charger les enfants du dossier famille', childError)
    if (requestError) throw fail('charger les demandes du dossier famille', requestError)
    if (ticketError) throw fail('charger les tickets du dossier famille', ticketError)
    children = rows(childRows)
    familyRequests = rows(requestRows)
    supportTickets = rows(ticketRows)
  }

  const summary = mapCustomer(
    account,
    rows(orders).length,
    rows(payments).length,
  )

  return {
    account: summary,
    family,
    children,
    familyRequests,
    supportTickets,
    addresses: rows(addresses),
    organizationMemberships: rows(memberships),
    notificationPreferences: preferences ? preferences as Row : null,
    wallet: wallet ? wallet as Row : null,
    orders: rows(orders),
    payments: rows(payments),
  }
}

export async function createAdminCustomer(input: {
  displayName: string
  email: string
  phone?: string | null
  accountKind: AdminCustomerSummary['account_kind']
  preferredLocale: 'fr' | 'en' | 'ar'
  territoryId?: string | null
  premiumStatus?: boolean
  context: MarketplaceRequestContext
  request: Request
}): Promise<{ customer: AdminCustomerSummary; temporaryPassword: string }> {
  const db = await createServiceClient()
  const existing = await db
    .from('angelcare_marketplace_customer_accounts')
    .select('id,public_reference')
    .ilike('email', input.email)
    .maybeSingle()
  if (existing.error && existing.error.code !== 'PGRST116') throw fail('vérifier le client existant', existing.error)
  if (existing.data) throw new MarketplaceError('CONFLICT', 'Un dossier client utilise déjà cette adresse email.')

  const temporaryPassword = randomBytes(18).toString('base64url')
  const authPayload: {
    email: string
    password: string
    email_confirm: boolean
    phone?: string
    phone_confirm?: boolean
    user_metadata: Record<string, unknown>
  } = {
    email: input.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: input.displayName,
      marketplace_account_kind: input.accountKind,
      locale: input.preferredLocale,
      created_by: input.context.actor.id,
      source: 'marketplace_admin_customer_command',
    },
  }
  if (input.phone) {
    authPayload.phone = input.phone
    authPayload.phone_confirm = false
  }

  const { data: authData, error: authError } = await db.auth.admin.createUser(authPayload)
  if (authError || !authData.user) {
    throw new MarketplaceError('CONFLICT', authError?.message || 'Le compte Auth client n’a pas pu être créé.', { cause: authError || undefined })
  }

  try {
    const { data: account, error: accountError } = await db
      .from('angelcare_marketplace_customer_accounts')
      .insert({
        auth_user_id: authData.user.id,
        account_kind: input.accountKind,
        status: 'active',
        display_name: input.displayName,
        email: input.email,
        phone: input.phone || null,
        preferred_locale: input.preferredLocale,
        territory_id: input.territoryId || null,
        premium_status: Boolean(input.premiumStatus),
        email_verified_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (accountError || !account) throw fail('créer le dossier client', accountError)

    let finalAccount = account as Row
    if (input.accountKind === 'family') {
      const family = await ensureFamilyForCustomer(finalAccount, input.context)
      finalAccount = { ...finalAccount, family_account_id: family.id }
    }

    await db.from('angelcare_marketplace_customer_notification_preferences').insert({
      customer_account_id: String(finalAccount.id),
      preferred_locale: input.preferredLocale,
    })

    await writeMarketplaceAudit({
      context: input.context,
      requestId: randomUUID(),
      action: 'marketplace.customer.created',
      objectType: 'customer_account',
      objectId: String(finalAccount.id),
      result: 'success',
      source: 'admin-customer-command',
      request: input.request,
      afterValue: {
        publicReference: finalAccount.public_reference,
        accountKind: finalAccount.account_kind,
        email: finalAccount.email,
      },
    })

    return {
      customer: mapCustomer(finalAccount),
      temporaryPassword,
    }
  } catch (error) {
    await db.auth.admin.deleteUser(authData.user.id).catch(() => undefined)
    if (error instanceof MarketplaceError) throw error
    throw new MarketplaceError('INTERNAL_ERROR', 'Le compte Auth a été créé, mais le dossier Marketplace n’a pas pu être finalisé.', { cause: error })
  }
}

export async function updateAdminCustomer(input: {
  customerId: string
  patch: {
    displayName?: string
    email?: string
    phone?: string | null
    accountKind?: AdminCustomerSummary['account_kind']
    status?: AdminCustomerSummary['status']
    preferredLocale?: 'fr' | 'en' | 'ar'
    premiumStatus?: boolean
    territoryId?: string | null
  }
  context: MarketplaceRequestContext
  request: Request
}): Promise<AdminCustomerSummary> {
  const before = await customerRow(input.customerId)
  const db = await createServiceClient()
  const authPatch: { email?: string; email_confirm?: boolean; phone?: string; user_metadata?: Record<string, unknown> } = {}
  if (input.patch.email && input.patch.email !== text(before.email)) {
    authPatch.email = input.patch.email
    authPatch.email_confirm = true
  }
  if (input.patch.phone && input.patch.phone !== text(before.phone)) authPatch.phone = input.patch.phone
  if (input.patch.displayName || input.patch.accountKind || input.patch.preferredLocale) {
    authPatch.user_metadata = {
      full_name: input.patch.displayName || text(before.display_name),
      marketplace_account_kind: input.patch.accountKind || text(before.account_kind),
      locale: input.patch.preferredLocale || text(before.preferred_locale) || 'fr',
    }
  }

  if (Object.keys(authPatch).length) {
    const { error } = await db.auth.admin.updateUserById(String(before.auth_user_id), authPatch)
    if (error) throw new MarketplaceError('CONFLICT', error.message || 'Le compte Auth n’a pas pu être mis à jour.', { cause: error })
  }

  const payload: Row = { updated_at: new Date().toISOString() }
  if (input.patch.displayName !== undefined) payload.display_name = input.patch.displayName
  if (input.patch.email !== undefined) payload.email = input.patch.email
  if (input.patch.phone !== undefined) payload.phone = input.patch.phone || null
  if (input.patch.accountKind !== undefined) payload.account_kind = input.patch.accountKind
  if (input.patch.status !== undefined) payload.status = input.patch.status
  if (input.patch.preferredLocale !== undefined) payload.preferred_locale = input.patch.preferredLocale
  if (input.patch.premiumStatus !== undefined) payload.premium_status = input.patch.premiumStatus
  if (input.patch.territoryId !== undefined) payload.territory_id = input.patch.territoryId || null

  const { data, error } = await db
    .from('angelcare_marketplace_customer_accounts')
    .update(payload)
    .eq('id', input.customerId)
    .select('*')
    .single()
  if (error || !data) throw fail('mettre à jour le client', error)

  let finalAccount = data as Row
  if (finalAccount.account_kind === 'family') {
    const family = await ensureFamilyForCustomer(finalAccount, input.context)
    finalAccount = { ...finalAccount, family_account_id: family.id }
  }

  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.customer.updated',
    objectType: 'customer_account',
    objectId: input.customerId,
    result: 'success',
    source: 'admin-customer-command',
    request: input.request,
    beforeValue: before,
    afterValue: finalAccount,
  })

  return mapCustomer(finalAccount)
}

export async function updateAdminFamily(input: {
  customerId: string
  patch: {
    displayName?: string
    phone?: string | null
    city?: string | null
    preferredLocale?: 'fr' | 'en' | 'ar'
    status?: 'active' | 'incomplete' | 'suspended' | 'archived'
    onboardingStatus?: 'not_started' | 'in_progress' | 'completed'
    consentStatus?: 'pending' | 'granted' | 'withdrawn'
  }
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const account = await customerRow(input.customerId)
  const family = await ensureFamilyForCustomer(account, input.context)
  const db = await createServiceClient()
  const payload: Row = { updated_at: new Date().toISOString() }
  if (input.patch.displayName !== undefined) payload.display_name = input.patch.displayName
  if (input.patch.phone !== undefined) payload.phone = input.patch.phone || null
  if (input.patch.city !== undefined) payload.city = input.patch.city || null
  if (input.patch.preferredLocale !== undefined) payload.preferred_locale = input.patch.preferredLocale
  if (input.patch.status !== undefined) payload.status = input.patch.status
  if (input.patch.onboardingStatus !== undefined) payload.onboarding_status = input.patch.onboardingStatus
  if (input.patch.consentStatus !== undefined) payload.consent_status = input.patch.consentStatus

  const { data, error } = await db
    .from('angelcare_marketplace_family_accounts')
    .update(payload)
    .eq('id', String(family.id))
    .select('*')
    .single()
  if (error || !data) throw fail('mettre à jour le dossier famille', error)

  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.family.admin_updated',
    objectType: 'family_account',
    objectId: String(family.id),
    result: 'success',
    source: 'admin-family-command',
    request: input.request,
    beforeValue: family,
    afterValue: data,
  })
  return data as Row
}

export async function createAdminAddress(input: {
  customerId: string
  patch: {
    addressType?: string
    label?: string | null
    recipientName?: string | null
    phone?: string | null
    city: string
    addressLine: string
    postalCode?: string | null
    territoryId?: string | null
    isDefault?: boolean
    serviceInstructions?: string | null
  }
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  await customerRow(input.customerId)
  const db = await createServiceClient()
  if (input.patch.isDefault) {
    await db.from('angelcare_marketplace_customer_addresses').update({ is_default: false }).eq('customer_account_id', input.customerId)
  }
  const { data, error } = await db
    .from('angelcare_marketplace_customer_addresses')
    .insert({
      customer_account_id: input.customerId,
      address_type: input.patch.addressType || 'home',
      label: input.patch.label || null,
      recipient_name: input.patch.recipientName || null,
      phone: input.patch.phone || null,
      city: input.patch.city,
      address_line: input.patch.addressLine,
      postal_code: input.patch.postalCode || null,
      territory_id: input.patch.territoryId || null,
      is_default: Boolean(input.patch.isDefault),
      service_instructions: input.patch.serviceInstructions || null,
      status: 'active',
    })
    .select('*')
    .single()
  if (error || !data) throw fail('créer l’adresse client', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.customer.address.created',
    objectType: 'customer_address',
    objectId: String(data.id),
    result: 'success',
    source: 'admin-customer-command',
    request: input.request,
    afterValue: data,
  })
  return data as Row
}

export async function updateAdminAddress(input: {
  customerId: string
  addressId: string
  patch: {
    addressType?: string
    label?: string | null
    recipientName?: string | null
    phone?: string | null
    city?: string
    addressLine?: string
    postalCode?: string | null
    territoryId?: string | null
    isDefault?: boolean
    serviceInstructions?: string | null
    status?: 'active' | 'archived'
  }
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const db = await createServiceClient()
  const { data: before, error: beforeError } = await db.from('angelcare_marketplace_customer_addresses').select('*').eq('id', input.addressId).eq('customer_account_id', input.customerId).single()
  if (beforeError || !before) throw new MarketplaceError('NOT_FOUND', 'Adresse client introuvable.', { cause: beforeError || undefined })
  if (input.patch.isDefault) {
    await db.from('angelcare_marketplace_customer_addresses').update({ is_default: false }).eq('customer_account_id', input.customerId)
  }
  const payload: Row = { updated_at: new Date().toISOString() }
  const mapping: Array<[keyof typeof input.patch, string]> = [
    ['addressType', 'address_type'], ['label', 'label'], ['recipientName', 'recipient_name'], ['phone', 'phone'],
    ['city', 'city'], ['addressLine', 'address_line'], ['postalCode', 'postal_code'], ['territoryId', 'territory_id'],
    ['isDefault', 'is_default'], ['serviceInstructions', 'service_instructions'], ['status', 'status'],
  ]
  for (const [source, target] of mapping) {
    if (input.patch[source] !== undefined) payload[target] = input.patch[source]
  }
  const { data, error } = await db.from('angelcare_marketplace_customer_addresses').update(payload).eq('id', input.addressId).eq('customer_account_id', input.customerId).select('*').single()
  if (error || !data) throw fail('mettre à jour l’adresse client', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.customer.address.updated',
    objectType: 'customer_address',
    objectId: input.addressId,
    result: 'success',
    source: 'admin-customer-command',
    request: input.request,
    beforeValue: before,
    afterValue: data,
  })
  return data as Row
}

export async function createAdminChild(input: {
  customerId: string
  firstName: string
  birthDate: string
  ageGroup: string
  gender?: string | null
  schoolLevel?: string | null
  languages?: string[]
  interests?: string[]
  allergies?: string | null
  medicalBoundaries?: string | null
  supportNotes?: string | null
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const account = await customerRow(input.customerId)
  const family = await ensureFamilyForCustomer(account, input.context)
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_family_children').insert({
    family_account_id: String(family.id),
    first_name: input.firstName,
    birth_date: input.birthDate,
    age_group: input.ageGroup,
    gender: input.gender || null,
    school_level: input.schoolLevel || null,
    languages: input.languages || [],
    interests: input.interests || [],
    allergies: input.allergies || null,
    medical_boundaries: input.medicalBoundaries || null,
    support_notes: input.supportNotes || null,
    status: 'active',
    created_by: input.context.actor.id,
  }).select('*').single()
  if (error || !data) throw fail('créer le profil enfant', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.family.child.admin_created',
    objectType: 'family_child',
    objectId: String(data.id),
    result: 'success',
    source: 'admin-family-command',
    request: input.request,
    afterValue: data,
  })
  return data as Row
}

export async function updateAdminChild(input: {
  customerId: string
  childId: string
  patch: Row
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const account = await customerRow(input.customerId)
  const family = await ensureFamilyForCustomer(account, input.context)
  const db = await createServiceClient()
  const allowed = ['first_name','birth_date','age_group','gender','school_level','languages','interests','allergies','medical_boundaries','support_notes','status'] as const
  const payload: Row = { updated_at: new Date().toISOString() }
  for (const key of allowed) if (input.patch[key] !== undefined) payload[key] = input.patch[key]
  const { data, error } = await db.from('angelcare_marketplace_family_children').update(payload).eq('id', input.childId).eq('family_account_id', String(family.id)).select('*').single()
  if (error || !data) throw new MarketplaceError('NOT_FOUND', 'Profil enfant introuvable dans ce dossier famille.', { cause: error || undefined })
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.family.child.admin_updated',
    objectType: 'family_child',
    objectId: input.childId,
    result: 'success',
    source: 'admin-family-command',
    request: input.request,
    afterValue: data,
  })
  return data as Row
}

export async function createManualOrder(input: ManualOrderInput & { context: MarketplaceRequestContext; request: Request }): Promise<{ order: Row; payment: Row | null }> {
  const account = await customerRow(input.customerId)
  const db = await createServiceClient()
  const journeyId = randomUUID()
  const title = input.title.trim()
  if (!title) throw new MarketplaceError('VALIDATION_ERROR', 'Le titre de la commande est requis.')
  if (!Number.isFinite(input.amount) || input.amount < 0) throw new MarketplaceError('VALIDATION_ERROR', 'Le montant de la commande est invalide.')

  const { data: order, error: orderError } = await db.from('angelcare_marketplace_journeys').insert({
    id: journeyId,
    journey_type: input.journeyType,
    status: 'registered',
    locale: input.context.locale,
    title,
    subtitle: input.notes || null,
    owner_user_id: input.context.actor.id,
    family_account_id: nullable(account.family_account_id),
    tenant_id: nullable(account.tenant_id),
    territory_id: nullable(account.territory_id),
    canonical_object_type: 'manual_order',
    canonical_object_id: journeyId,
    current_authority: 'manual_order_command',
    next_action_label: input.amount > 0 ? 'Vérifier le paiement' : 'Préparer la commande',
    risk_level: 'low',
    completion_percent: 5,
    scheduled_start_at: input.scheduledStartAt || null,
    scheduled_end_at: input.scheduledEndAt || null,
    financial_status: {
      status: input.amount > 0 ? 'unpaid' : 'not_required',
      amount: input.amount,
      currency: input.currencyLabel || 'Dh',
    },
    fulfillment_status: { status: 'pending' },
    customer_context: {
      customer_id: account.id,
      customer_name: account.display_name,
      customer_reference: account.public_reference,
      email: account.email,
    },
    metadata: {
      source: 'admin_manual_order',
      notes: input.notes || null,
    },
  }).select('*').single()
  if (orderError || !order) throw fail('créer la commande manuelle', orderError)

  try {
    await db.from('angelcare_marketplace_journey_events').insert({
      journey_id: journeyId,
      event_key: 'manual_order_created',
      title: 'Commande créée manuellement',
      description: input.notes || 'Commande créée depuis le centre opérateur.',
      status: 'registered',
      authority_type: 'manual_order_command',
      authority_object_id: journeyId,
      customer_visible: true,
      occurred_at: new Date().toISOString(),
    })
    await db.from('angelcare_marketplace_journey_participants').insert({
      journey_id: journeyId,
      participant_type: 'customer',
      participant_id: account.auth_user_id,
      display_name: account.display_name,
      role_label: 'Client',
      visibility: 'customer',
      status: 'active',
    })

    let payment: Row | null = null
    if (input.createPayment && input.amount > 0) {
      const paymentId = randomUUID()
      const { data: paymentRow, error: paymentError } = await db.from('angelcare_marketplace_payment_intents').insert({
        id: paymentId,
        customer_account_id: account.id,
        canonical_object_type: 'manual_order',
        canonical_object_id: journeyId,
        status: 'pending',
        currency_label: input.currencyLabel || 'Dh',
        expected_amount: input.amount,
        due_now_amount: input.amount,
        due_later_amount: 0,
        idempotency_key: `manual-order:${journeyId}`,
        selected_method: input.paymentMethod || 'manual_verified',
        provider_key: input.paymentMethod === 'manual_verified' || !input.paymentMethod ? 'manual_verified' : input.paymentMethod,
        provider_reference: input.providerReference || null,
        metadata: { source: 'admin_manual_order' },
      }).select('*').single()
      if (paymentError || !paymentRow) throw fail('créer le paiement de la commande', paymentError)
      payment = paymentRow as Row

      await db.from('angelcare_marketplace_payment_attempts').insert({
        payment_intent_id: paymentId,
        attempt_number: 1,
        method_kind: input.paymentMethod || 'manual_verified',
        status: 'pending',
        amount: input.amount,
        idempotency_key: `manual-order-attempt:${journeyId}`,
        provider_key: input.paymentMethod || 'manual_verified',
        provider_reference: input.providerReference || null,
      })
      await db.from('angelcare_marketplace_journeys').update({
        financial_status: {
          status: 'pending',
          amount: input.amount,
          currency: input.currencyLabel || 'Dh',
          payment_intent_id: paymentId,
        },
        updated_at: new Date().toISOString(),
      }).eq('id', journeyId)
    }
  } catch (error) {
    await db.from('angelcare_marketplace_journeys').delete().eq('id', journeyId)
    throw error
  }

  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.order.manual_created',
    objectType: 'marketplace_journey',
    objectId: journeyId,
    result: 'success',
    source: 'admin-order-command',
    request: input.request,
    afterValue: { publicReference: order.public_reference, title: order.title, amount: input.amount },
  })

  const { data: finalOrder, error: finalError } = await db.from('angelcare_marketplace_journeys').select('*').eq('id', journeyId).single()
  if (finalError || !finalOrder) throw fail('recharger la commande créée', finalError)
  const { data: finalPayment } = input.createPayment && input.amount > 0
    ? await db.from('angelcare_marketplace_payment_intents').select('*').eq('canonical_object_id', journeyId).maybeSingle()
    : { data: null }

  return { order: finalOrder as Row, payment: finalPayment as Row | null }
}

export async function adminPaymentSummary(): Promise<AdminPaymentSummary> {
  const db = await createServiceClient()
  const { data: paymentRows, error } = await db.from('angelcare_marketplace_payment_intents').select('*').order('updated_at', { ascending: false }).limit(500)
  if (error) throw fail('charger les paiements', error)
  const payments = rows(paymentRows)
  const customerIds = [...new Set(payments.map((row) => text(row.customer_account_id)).filter(Boolean))]
  const journeyIds = [...new Set(payments.map((row) => text(row.canonical_object_id)).filter(Boolean))]
  const [{ data: customers }, { data: journeys }] = await Promise.all([
    customerIds.length ? db.from('angelcare_marketplace_customer_accounts').select('id,display_name,public_reference').in('id', customerIds) : { data: [] },
    journeyIds.length ? db.from('angelcare_marketplace_journeys').select('id,public_reference,title').in('id', journeyIds) : { data: [] },
  ])
  const customerMap = new Map(rows(customers).map((row) => [String(row.id), row]))
  const journeyMap = new Map(rows(journeys).map((row) => [String(row.id), row]))
  const mapped: AdminPaymentRecord[] = payments.map((row) => {
    const customer = customerMap.get(text(row.customer_account_id))
    const journey = journeyMap.get(text(row.canonical_object_id))
    return {
      id: text(row.id),
      public_reference: text(row.public_reference),
      customer_account_id: nullable(row.customer_account_id),
      customer_name: text(customer?.display_name) || 'Client invité',
      customer_reference: nullable(customer?.public_reference),
      canonical_object_type: nullable(row.canonical_object_type),
      canonical_object_id: nullable(row.canonical_object_id),
      order_reference: nullable(journey?.public_reference),
      order_title: nullable(journey?.title),
      status: text(row.status) as PaymentIntentStatus,
      currency_label: text(row.currency_label) || 'Dh',
      expected_amount: num(row.expected_amount),
      authorized_amount: num(row.authorized_amount),
      captured_amount: num(row.captured_amount),
      refunded_amount: num(row.refunded_amount),
      due_now_amount: num(row.due_now_amount),
      due_later_amount: num(row.due_later_amount),
      selected_method: nullable(row.selected_method) as AdminPaymentRecord['selected_method'],
      provider_key: nullable(row.provider_key),
      provider_reference: nullable(row.provider_reference),
      created_at: text(row.created_at),
      updated_at: text(row.updated_at),
    }
  })
  return {
    payments: mapped,
    total: mapped.length,
    pending: mapped.filter((row) => ['created', 'requires_method', 'requires_customer_action', 'pending', 'authorized', 'partially_captured'].includes(row.status)).length,
    captured: mapped.filter((row) => ['captured', 'partially_refunded'].includes(row.status)).length,
    failed: mapped.filter((row) => ['failed', 'cancelled', 'expired'].includes(row.status)).length,
    refunded: mapped.filter((row) => row.status === 'refunded').length,
    disputed: mapped.filter((row) => ['disputed', 'chargeback', 'reconciliation_pending'].includes(row.status)).length,
    expectedVolume: mapped.reduce((sum, row) => sum + row.expected_amount, 0),
    capturedVolume: mapped.reduce((sum, row) => sum + row.captured_amount, 0),
    refundedVolume: mapped.reduce((sum, row) => sum + row.refunded_amount, 0),
  }
}

export async function adminPaymentDossier(paymentId: string): Promise<AdminPaymentDossier> {
  const db = await createServiceClient()
  const { data: payment, error } = await db.from('angelcare_marketplace_payment_intents').select('*').eq('id', paymentId).single()
  if (error || !payment) throw new MarketplaceError('NOT_FOUND', 'Paiement introuvable.', { cause: error || undefined })

  const [{ data: attempts, error: attemptsError }, { data: refunds, error: refundsError }] = await Promise.all([
    db.from('angelcare_marketplace_payment_attempts').select('*').eq('payment_intent_id', paymentId).order('attempt_number'),
    db.from('angelcare_marketplace_payment_refunds').select('*').eq('payment_intent_id', paymentId).order('created_at', { ascending: false }),
  ])
  if (attemptsError) throw fail('charger les tentatives de paiement', attemptsError)
  if (refundsError) throw fail('charger les remboursements', refundsError)

  const order = payment.canonical_object_id
    ? (await db.from('angelcare_marketplace_journeys').select('*').eq('id', String(payment.canonical_object_id)).maybeSingle()).data as Row | null
    : null

  const summary = await adminPaymentSummary()
  const mapped = summary.payments.find((entry) => entry.id === paymentId)
  if (!mapped) throw new MarketplaceError('NOT_FOUND', 'Paiement introuvable dans le registre opérateur.')
  return { payment: mapped, attempts: rows(attempts), refunds: rows(refunds), order }
}

export async function captureAdminPayment(input: {
  paymentId: string
  amount?: number
  providerReference?: string | null
  reason: string
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const db = await createServiceClient()
  const { data: intent, error } = await db.from('angelcare_marketplace_payment_intents').select('*').eq('id', input.paymentId).single()
  if (error || !intent) throw new MarketplaceError('NOT_FOUND', 'Paiement introuvable.', { cause: error || undefined })

  const currentCaptured = num(intent.captured_amount)
  const refundableExpected = Math.max(0, num(intent.expected_amount) - currentCaptured)
  const captureAmount = input.amount == null ? refundableExpected : num(input.amount)
  if (captureAmount <= 0) throw new MarketplaceError('VALIDATION_ERROR', 'Le montant de capture doit être supérieur à 0.')
  if (captureAmount > refundableExpected) throw new MarketplaceError('VALIDATION_ERROR', `Le montant restant à capturer est de ${refundableExpected.toFixed(2)} Dh.`)
  if (['failed', 'cancelled', 'expired', 'refunded', 'disputed', 'chargeback'].includes(text(intent.status))) {
    throw new MarketplaceError('CONFLICT', 'Ce paiement ne peut plus être capturé dans son état actuel.')
  }

  const nextCaptured = currentCaptured + captureAmount
  const nextStatus = nextCaptured >= num(intent.expected_amount) ? 'captured' : 'partially_captured'
  const now = new Date().toISOString()
  const nextReference = input.providerReference || nullable(intent.provider_reference)

  const { count: attemptCount } = await db.from('angelcare_marketplace_payment_attempts').select('id', { count: 'exact', head: true }).eq('payment_intent_id', input.paymentId)
  const nextAttemptNumber = attemptCount || 0

  const { error: updateError } = await db.from('angelcare_marketplace_payment_intents').update({
    status: nextStatus,
    authorized_amount: Math.max(num(intent.authorized_amount), nextCaptured),
    captured_amount: nextCaptured,
    provider_reference: nextReference,
    updated_at: now,
  }).eq('id', input.paymentId)
  if (updateError) throw fail('enregistrer la capture du paiement', updateError)

  const { error: attemptError } = await db.from('angelcare_marketplace_payment_attempts').insert({
    payment_intent_id: input.paymentId,
    attempt_number: nextAttemptNumber + 1,
    method_kind: text(intent.selected_method) || 'manual_verified',
    status: nextStatus,
    amount: captureAmount,
    idempotency_key: `admin-capture:${input.paymentId}:${nextAttemptNumber + 1}:${nextCaptured}`,
    provider_key: text(intent.provider_key) || 'manual_verified',
    provider_reference: nextReference,
    customer_message: 'Paiement vérifié manuellement par ANGELCARE.',
    provider_evidence: { operatorCapture: true, reason: input.reason },
  })
  if (attemptError) throw fail('enregistrer la preuve de capture', attemptError)

  if (intent.canonical_object_id) {
    const { data: order } = await db.from('angelcare_marketplace_journeys').select('id,financial_status').eq('id', String(intent.canonical_object_id)).maybeSingle()
    if (order) {
      const financial = order.financial_status && typeof order.financial_status === 'object' ? order.financial_status as Row : {}
      await db.from('angelcare_marketplace_journeys').update({
        financial_status: { ...financial, status: nextStatus, captured_amount: nextCaptured, payment_intent_id: input.paymentId },
        updated_at: now,
      }).eq('id', String(intent.canonical_object_id))
      await db.from('angelcare_marketplace_journey_events').insert({
        journey_id: String(intent.canonical_object_id),
        event_key: 'manual_payment_captured',
        title: 'Paiement vérifié',
        description: input.reason,
        status: 'awaiting_angelcare',
        authority_type: 'payment_command',
        authority_object_id: input.paymentId,
        evidence: { capturedAmount: captureAmount, capturedTotal: nextCaptured },
        customer_visible: true,
        occurred_at: now,
      })
    }
  }

  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.payment.manual_captured',
    objectType: 'payment_intent',
    objectId: input.paymentId,
    result: 'success',
    severity: 'warning',
    source: 'admin-payment-command',
    request: input.request,
    reason: input.reason,
    afterValue: { status: nextStatus, capturedAmount: nextCaptured, providerReference: nextReference },
  })
  return adminPaymentDossier(input.paymentId)
}

export async function transitionAdminPayment(input: {
  paymentId: string
  status: 'failed' | 'cancelled'
  reason: string
  context: MarketplaceRequestContext
  request: Request
}): Promise<Record<string, unknown>> {
  const db = await createServiceClient()
  const { data: before, error } = await db.from('angelcare_marketplace_payment_intents').select('*').eq('id', input.paymentId).single()
  if (error || !before) throw new MarketplaceError('NOT_FOUND', 'Paiement introuvable.', { cause: error || undefined })
  if (!['created', 'requires_method', 'requires_customer_action', 'pending', 'authorized'].includes(text(before.status))) {
    throw new MarketplaceError('CONFLICT', 'Seuls les paiements non capturés peuvent être annulés ou déclarés en échec.')
  }
  const now = new Date().toISOString()
  const { error: updateError } = await db.from('angelcare_marketplace_payment_intents').update({
    status: input.status,
    updated_at: now,
  }).eq('id', input.paymentId)
  if (updateError) throw fail('faire évoluer le paiement', updateError)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: `marketplace.payment.${input.status}`,
    objectType: 'payment_intent',
    objectId: input.paymentId,
    result: 'success',
    severity: 'warning',
    source: 'admin-payment-command',
    request: input.request,
    reason: input.reason,
    beforeValue: before,
    afterValue: { status: input.status },
  })
  return adminPaymentDossier(input.paymentId)
}

export async function createManualPayment(input: {
  customerId: string
  amount: number
  orderId?: string | null
  method?: string
  providerReference?: string | null
  note?: string | null
  context: MarketplaceRequestContext
  request: Request
}): Promise<AdminPaymentDossier> {
  const db = await createServiceClient()
  const account = await customerRow(input.customerId)
  let order: Row | null = null

  if (input.orderId) {
    const { data, error } = await db
      .from('angelcare_marketplace_journeys')
      .select('*')
      .eq('id', input.orderId)
      .eq('customer_account_id', input.customerId)
      .maybeSingle()
    if (error) throw fail('vérifier la commande du paiement', error)
    if (!data) throw new MarketplaceError('NOT_FOUND', 'La commande sélectionnée n’appartient pas à ce client.')
    order = data as Row
  }

  const paymentId = randomUUID()
  const method = input.method || 'manual_verified'
  const providerKey = method === 'manual_verified' ? 'manual_verified' : method
  const providerReference = input.providerReference || null

  const { error: paymentError } = await db.from('angelcare_marketplace_payment_intents').insert({
    id: paymentId,
    customer_account_id: account.id,
    canonical_object_type: order ? 'manual_order' : 'manual_payment',
    canonical_object_id: order ? order.id : null,
    status: 'pending',
    currency_label: 'Dh',
    expected_amount: input.amount,
    due_now_amount: input.amount,
    due_later_amount: 0,
    idempotency_key: `admin-manual-payment:${paymentId}`,
    selected_method: method,
    provider_key: providerKey,
    provider_reference: providerReference,
    metadata: {
      source: 'admin_payment_command',
      note: input.note || null,
    },
  }).select('*').single()
  if (paymentError) throw fail('créer le paiement manuel', paymentError)

  const { error: attemptError } = await db.from('angelcare_marketplace_payment_attempts').insert({
    payment_intent_id: paymentId,
    attempt_number: 1,
    method_kind: method,
    status: 'pending',
    amount: input.amount,
    idempotency_key: `admin-manual-payment-attempt:${paymentId}`,
    provider_key: providerKey,
    provider_reference: providerReference,
    customer_message: 'Paiement enregistré dans le registre opérateur et en attente de vérification.',
    provider_evidence: { source: 'admin_payment_command', note: input.note || null },
  })
  if (attemptError) {
    await db.from('angelcare_marketplace_payment_intents').delete().eq('id', paymentId)
    throw fail('enregistrer la tentative de paiement', attemptError)
  }

  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.payment.manual_created',
    objectType: 'payment_intent',
    objectId: paymentId,
    result: 'success',
    source: 'admin-payment-command',
    request: input.request,
    afterValue: {
      customerId: account.id,
      customerReference: account.public_reference,
      orderId: order?.id || null,
      amount: input.amount,
      method,
      providerReference,
    },
  })

  return adminPaymentDossier(paymentId)
}

export async function createAdminSupplier(input: {
  supplierCode: string
  legalName: string
  displayName: string
  status?: 'prospect' | 'qualification' | 'approved' | 'active' | 'suspended' | 'archived'
  qualityStatus?: 'unreviewed' | 'pending' | 'approved' | 'conditional' | 'rejected' | 'expired'
  paymentTerms?: string | null
  primaryContact?: Record<string, unknown>
  context: MarketplaceRequestContext
  request: Request
}): Promise<Row> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_suppliers').insert({
    supplier_code: input.supplierCode,
    legal_name: input.legalName,
    display_name: input.displayName,
    status: input.status || 'prospect',
    quality_status: input.qualityStatus || 'unreviewed',
    payment_terms: input.paymentTerms || null,
    primary_contact: input.primaryContact || {},
    territory_id: input.context.territoryId,
    owner_id: input.context.actor.id,
    created_by: input.context.actor.id,
    updated_by: input.context.actor.id,
  }).select('*').single()
  if (error || !data) throw fail('créer le fournisseur', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.supplier.created',
    objectType: 'supplier',
    objectId: String(data.id),
    result: 'success',
    source: 'admin-supplier-command',
    request: input.request,
    afterValue: data,
  })
  return data as Row
}

export async function updateAdminSupplier(input: {
  supplierId: string
  patch: Row
  context: MarketplaceRequestContext
  request: Request
}): Promise<Row> {
  const db = await createServiceClient()
  const { data: before, error: beforeError } = await db.from('angelcare_marketplace_suppliers').select('*').eq('id', input.supplierId).single()
  if (beforeError || !before) throw new MarketplaceError('NOT_FOUND', 'Fournisseur introuvable.', { cause: beforeError || undefined })
  const allowed = ['supplier_code','legal_name','display_name','status','quality_status','payment_terms','primary_contact'] as const
  const payload: Row = { updated_at: new Date().toISOString(), updated_by: input.context.actor.id }
  for (const key of allowed) if (input.patch[key] !== undefined) payload[key] = input.patch[key]
  const { data, error } = await db.from('angelcare_marketplace_suppliers').update(payload).eq('id', input.supplierId).select('*').single()
  if (error || !data) throw fail('mettre à jour le fournisseur', error)
  await writeMarketplaceAudit({
    context: input.context,
    requestId: randomUUID(),
    action: 'marketplace.supplier.updated',
    objectType: 'supplier',
    objectId: input.supplierId,
    result: 'success',
    source: 'admin-supplier-command',
    request: input.request,
    beforeValue: before,
    afterValue: data,
  })
  return data as Row
}
