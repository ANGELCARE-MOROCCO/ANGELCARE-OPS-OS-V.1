import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId, requireText } from '../server/request'
import { MarketplaceError } from '../server/errors'
import {
  adminCustomerDossier,
  adminCustomerList,
  adminPaymentDossier,
  adminPaymentSummary,
  captureAdminPayment,
  createAdminAddress,
  createAdminChild,
  createAdminCustomer,
  createManualOrder,
  createManualPayment,
  createAdminSupplier,
  updateAdminSupplier,
  transitionAdminPayment,
  updateAdminAddress,
  updateAdminChild,
  updateAdminCustomer,
  updateAdminFamily,
} from './repository'
import type { ManualOrderInput } from './types'

const locale = (value: unknown): 'fr' | 'en' | 'ar' => value === 'en' || value === 'ar' ? value : 'fr'
const accountKinds = new Set(['individual', 'family', 'organization', 'employee_beneficiary', 'guest'])
const customerStatuses = new Set(['pending_verification', 'active', 'restricted', 'suspended', 'closed'])
const familyStatuses = new Set(['active', 'incomplete', 'suspended', 'archived'])
const onboardingStatuses = new Set(['not_started', 'in_progress', 'completed'])
const consentStatuses = new Set(['pending', 'granted', 'withdrawn'])
const journeyTypes = new Set([
  'product_order', 'kit_order', 'family_booking', 'recurring_service', 'academy_enrollment',
  'b2b_quotation', 'hospitality_programme', 'corporate_benefit', 'partner_activation', 'quality_assessment',
])

function numberField(value: unknown, label: string, minimum = 0): number {
  const result = Number(value)
  if (!Number.isFinite(result) || result < minimum) throw new MarketplaceError('VALIDATION_ERROR', `${label} invalide.`)
  return result
}

export async function handleAdminCustomers(request: Request) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.admin.access')
    if (request.method === 'GET') {
      const url = new URL(request.url)
      return apiSuccess(await adminCustomerList({
        query: url.searchParams.get('query') || '',
        accountKind: url.searchParams.get('accountKind') || 'all',
        status: url.searchParams.get('status') || 'all',
      }), { requestId: rid })
    }
    const body = await parseJsonObject(request)
    const result = await createAdminCustomer({
      displayName: requireText(body.displayName, 'displayName', 'Nom client', 180),
      email: requireText(body.email, 'email', 'Email', 320),
      phone: cleanOptionalText(body.phone, 80),
      accountKind: (accountKinds.has(String(body.accountKind)) ? String(body.accountKind) : 'family') as 'individual' | 'family' | 'organization' | 'employee_beneficiary' | 'guest',
      preferredLocale: locale(body.preferredLocale),
      territoryId: cleanOptionalText(body.territoryId, 120),
      premiumStatus: body.premiumStatus === true,
      context,
      request,
    })
    return apiSuccess(result, { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomer(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.admin.access')
    if (request.method === 'GET') return apiSuccess(await adminCustomerDossier(customerId), { requestId: rid })

    const body = await parseJsonObject(request)
    const patch: {
      displayName?: string
      email?: string
      phone?: string | null
      accountKind?: 'individual' | 'family' | 'organization' | 'employee_beneficiary' | 'guest'
      status?: 'pending_verification' | 'active' | 'restricted' | 'suspended' | 'closed'
      preferredLocale?: 'fr' | 'en' | 'ar'
      premiumStatus?: boolean
      territoryId?: string | null
    } = {}
    if (body.displayName !== undefined) patch.displayName = requireText(body.displayName, 'displayName', 'Nom client', 180)
    if (body.email !== undefined) patch.email = requireText(body.email, 'email', 'Email', 320)
    if (body.phone !== undefined) patch.phone = cleanOptionalText(body.phone, 80)
    if (body.accountKind !== undefined) {
      if (!accountKinds.has(String(body.accountKind))) throw new MarketplaceError('VALIDATION_ERROR', 'Type de compte invalide.')
      patch.accountKind = String(body.accountKind) as typeof patch.accountKind
    }
    if (body.status !== undefined) {
      if (!customerStatuses.has(String(body.status))) throw new MarketplaceError('VALIDATION_ERROR', 'Statut client invalide.')
      patch.status = String(body.status) as typeof patch.status
    }
    if (body.preferredLocale !== undefined) patch.preferredLocale = locale(body.preferredLocale)
    if (body.premiumStatus !== undefined) patch.premiumStatus = body.premiumStatus === true
    if (body.territoryId !== undefined) patch.territoryId = cleanOptionalText(body.territoryId, 120)
    const context = await requireMarketplaceApiContext('marketplace.admin.access')
    return apiSuccess(await updateAdminCustomer({ customerId, patch, context, request }), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomerFamily(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(request.method === 'GET' ? 'marketplace.family.admin.view' : 'marketplace.family.admin.manage')
    const dossier = await adminCustomerDossier(customerId)
    if (request.method === 'GET') return apiSuccess({ family: dossier.family, children: dossier.children, requests: dossier.familyRequests, tickets: dossier.supportTickets }, { requestId: rid })
    const body = await parseJsonObject(request)
    const status = body.status === undefined ? undefined : String(body.status)
    const onboardingStatus = body.onboardingStatus === undefined ? undefined : String(body.onboardingStatus)
    const consentStatus = body.consentStatus === undefined ? undefined : String(body.consentStatus)
    if (status && !familyStatuses.has(status)) throw new MarketplaceError('VALIDATION_ERROR', 'Statut famille invalide.')
    if (onboardingStatus && !onboardingStatuses.has(onboardingStatus)) throw new MarketplaceError('VALIDATION_ERROR', 'Statut onboarding invalide.')
    if (consentStatus && !consentStatuses.has(consentStatus)) throw new MarketplaceError('VALIDATION_ERROR', 'Statut de consentement invalide.')
    return apiSuccess(await updateAdminFamily({
      customerId,
      patch: {
        displayName: body.displayName === undefined ? undefined : requireText(body.displayName, 'displayName', 'Nom famille', 180),
        phone: body.phone === undefined ? undefined : cleanOptionalText(body.phone, 80),
        city: body.city === undefined ? undefined : cleanOptionalText(body.city, 120),
        preferredLocale: body.preferredLocale === undefined ? undefined : locale(body.preferredLocale),
        status: status as 'active' | 'incomplete' | 'suspended' | 'archived' | undefined,
        onboardingStatus: onboardingStatus as 'not_started' | 'in_progress' | 'completed' | undefined,
        consentStatus: consentStatus as 'pending' | 'granted' | 'withdrawn' | undefined,
      },
      context,
      request,
    }), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomerAddresses(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.admin.access')
    const dossier = await adminCustomerDossier(customerId)
    if (request.method === 'GET') return apiSuccess({ addresses: dossier.addresses }, { requestId: rid })
    const body = await parseJsonObject(request)
    return apiSuccess(await createAdminAddress({
      customerId,
      patch: {
        addressType: cleanOptionalText(body.addressType, 50) || 'home',
        label: cleanOptionalText(body.label, 100),
        recipientName: cleanOptionalText(body.recipientName, 180),
        phone: cleanOptionalText(body.phone, 80),
        city: requireText(body.city, 'city', 'Ville', 120),
        addressLine: requireText(body.addressLine, 'addressLine', 'Adresse', 500),
        postalCode: cleanOptionalText(body.postalCode, 30),
        territoryId: cleanOptionalText(body.territoryId, 120),
        isDefault: body.isDefault === true,
        serviceInstructions: cleanOptionalText(body.serviceInstructions, 1200),
      },
      context,
      request,
    }), { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomerAddress(request: Request, customerId: string, addressId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.admin.access')
    if (request.method !== 'PATCH') throw new MarketplaceError('METHOD_NOT_ALLOWED', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    return apiSuccess(await updateAdminAddress({
      customerId,
      addressId,
      patch: {
        addressType: body.addressType === undefined ? undefined : cleanOptionalText(body.addressType, 50) || 'home',
        label: body.label === undefined ? undefined : cleanOptionalText(body.label, 100),
        recipientName: body.recipientName === undefined ? undefined : cleanOptionalText(body.recipientName, 180),
        phone: body.phone === undefined ? undefined : cleanOptionalText(body.phone, 80),
        city: body.city === undefined ? undefined : requireText(body.city, 'city', 'Ville', 120),
        addressLine: body.addressLine === undefined ? undefined : requireText(body.addressLine, 'addressLine', 'Adresse', 500),
        postalCode: body.postalCode === undefined ? undefined : cleanOptionalText(body.postalCode, 30),
        territoryId: body.territoryId === undefined ? undefined : cleanOptionalText(body.territoryId, 120),
        isDefault: body.isDefault === undefined ? undefined : body.isDefault === true,
        serviceInstructions: body.serviceInstructions === undefined ? undefined : cleanOptionalText(body.serviceInstructions, 1200),
        status: body.status === 'archived' ? 'archived' : body.status === 'active' ? 'active' : undefined,
      },
      context,
      request,
    }), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomerChildren(request: Request, customerId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(request.method === 'GET' ? 'marketplace.family.admin.view' : 'marketplace.family.admin.manage')
    const dossier = await adminCustomerDossier(customerId)
    if (request.method === 'GET') return apiSuccess({ children: dossier.children }, { requestId: rid })
    const body = await parseJsonObject(request)
    return apiSuccess(await createAdminChild({
      customerId,
      firstName: requireText(body.firstName, 'firstName', 'Prénom', 80),
      birthDate: requireText(body.birthDate, 'birthDate', 'Date de naissance', 20),
      ageGroup: requireText(body.ageGroup, 'ageGroup', 'Tranche d’âge', 60),
      gender: cleanOptionalText(body.gender, 40),
      schoolLevel: cleanOptionalText(body.schoolLevel, 100),
      languages: Array.isArray(body.languages) ? body.languages.map(String).slice(0, 20) : [],
      interests: Array.isArray(body.interests) ? body.interests.map(String).slice(0, 30) : [],
      allergies: cleanOptionalText(body.allergies, 1200),
      medicalBoundaries: cleanOptionalText(body.medicalBoundaries, 1200),
      supportNotes: cleanOptionalText(body.supportNotes, 2000),
      context,
      request,
    }), { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminCustomerChild(request: Request, customerId: string, childId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.family.admin.manage')
    if (request.method !== 'PATCH') throw new MarketplaceError('METHOD_NOT_ALLOWED', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const patch: Record<string, unknown> = {}
    const keys = ['first_name','birth_date','age_group','gender','school_level','languages','interests','allergies','medical_boundaries','support_notes','status']
    for (const key of keys) if (body[key] !== undefined) patch[key] = body[key]
    return apiSuccess(await updateAdminChild({ customerId, childId, patch, context, request }), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminPayments(request: Request) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.finance.view')
    if (request.method === 'GET') return apiSuccess(await adminPaymentSummary(), { requestId: rid })
    const body = await parseJsonObject(request)
    if (body.action !== 'manual_create') throw new MarketplaceError('VALIDATION_ERROR', 'Action de paiement inconnue.')
    const customerId = requireText(body.customerId, 'customerId', 'Client', 120)
    const amount = numberField(body.amount, 'Montant', 0.01)
    const db = await createManualPayment({ customerId, amount, orderId: cleanOptionalText(body.orderId, 120), method: cleanOptionalText(body.method, 40) || 'manual_verified', providerReference: cleanOptionalText(body.providerReference, 240), note: cleanOptionalText(body.note, 1200), context, request })
    return apiSuccess(db, { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminPayment(request: Request, paymentId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.finance.exceptions.approve')
    if (request.method === 'GET') return apiSuccess(await adminPaymentDossier(paymentId), { requestId: rid })
    const body = await parseJsonObject(request)
    const action = String(body.action || '')
    if (action === 'capture') {
      return apiSuccess(await captureAdminPayment({
        paymentId,
        amount: body.amount === undefined || body.amount === '' ? undefined : numberField(body.amount, 'Montant de capture', 0.01),
        providerReference: cleanOptionalText(body.providerReference, 240),
        reason: requireText(body.reason, 'reason', 'Motif', 1000),
        context,
        request,
      }), { requestId: rid })
    }
    if (action === 'failed' || action === 'cancelled') {
      return apiSuccess(await transitionAdminPayment({ paymentId, status: action, reason: requireText(body.reason, 'reason', 'Motif', 1000), context, request }), { requestId: rid })
    }
    throw new MarketplaceError('VALIDATION_ERROR', 'Action de paiement inconnue.')
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminOrders(request: Request) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(request.method === 'POST' ? 'marketplace.operations.missions.create' : 'marketplace.operations.view')
    if (request.method === 'GET') {
      const { adminOrderCommand } = await import('../customer-commerce/admin-repository')
      return apiSuccess(await adminOrderCommand(context), { requestId: rid })
    }
    const body = await parseJsonObject(request)
    if (body.action !== 'manual_create') throw new MarketplaceError('VALIDATION_ERROR', 'Action de commande inconnue.')
    if (!journeyTypes.has(String(body.journeyType))) throw new MarketplaceError('VALIDATION_ERROR', 'Type de commande invalide.')
    const result = await createManualOrder({
      customerId: requireText(body.customerId, 'customerId', 'Client', 120),
      title: requireText(body.title, 'title', 'Titre', 180),
      journeyType: String(body.journeyType) as ManualOrderInput['journeyType'],
      amount: numberField(body.amount || 0, 'Montant', 0),
      currencyLabel: cleanOptionalText(body.currencyLabel, 10) || 'Dh',
      scheduledStartAt: cleanOptionalText(body.scheduledStartAt, 40),
      scheduledEndAt: cleanOptionalText(body.scheduledEndAt, 40),
      notes: cleanOptionalText(body.notes, 2000),
      createPayment: body.createPayment !== false,
      paymentMethod: cleanOptionalText(body.paymentMethod, 40) as ManualOrderInput['paymentMethod'],
      providerReference: cleanOptionalText(body.providerReference, 240),
      context,
      request,
    })
    return apiSuccess(result, { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}


export async function handleAdminSuppliers(request: Request) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(request.method === 'POST' ? 'marketplace.catalog.suppliers.manage' : 'marketplace.catalog.suppliers.view')
    if (request.method === 'GET') {
      const { listSuppliers } = await import('../marketplace-core/repository')
      return apiSuccess(await listSuppliers(), { requestId: rid })
    }
    const body = await parseJsonObject(request)
    return apiSuccess(await createAdminSupplier({
      supplierCode: requireText(body.supplierCode, 'supplierCode', 'Code fournisseur', 80),
      legalName: requireText(body.legalName, 'legalName', 'Raison sociale', 180),
      displayName: requireText(body.displayName, 'displayName', 'Nom affiché', 180),
      status: body.status === undefined ? undefined : String(body.status) as 'prospect' | 'qualification' | 'approved' | 'active' | 'suspended' | 'archived',
      qualityStatus: body.qualityStatus === undefined ? undefined : String(body.qualityStatus) as 'unreviewed' | 'pending' | 'approved' | 'conditional' | 'rejected' | 'expired',
      paymentTerms: cleanOptionalText(body.paymentTerms, 500),
      primaryContact: body.primaryContact && typeof body.primaryContact === 'object' ? body.primaryContact as Record<string, unknown> : {},
      context,
      request,
    }), { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleAdminSupplier(request: Request, supplierId: string) {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.catalog.suppliers.manage')
    if (request.method !== 'PATCH') throw new MarketplaceError('METHOD_NOT_ALLOWED', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const patch: Record<string, unknown> = {}
    for (const key of ['supplierCode','legalName','displayName','status','qualityStatus','paymentTerms','primaryContact']) {
      if (body[key] !== undefined) {
        const target = key === 'supplierCode' ? 'supplier_code'
          : key === 'legalName' ? 'legal_name'
            : key === 'displayName' ? 'display_name'
              : key === 'qualityStatus' ? 'quality_status'
                : key === 'paymentTerms' ? 'payment_terms'
                  : key === 'primaryContact' ? 'primary_contact'
                    : 'status'
        patch[target] = body[key]
      }
    }
    return apiSuccess(await updateAdminSupplier({ supplierId, patch, context, request }), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}
