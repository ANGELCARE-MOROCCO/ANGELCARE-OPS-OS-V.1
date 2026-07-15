export type OperatorValidationIssue = {
  path: string
  message: string
}

export type OperatorValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: OperatorValidationIssue[] }

export type OperatorSchema<T> = {
  name: string
  parse: (input: unknown) => T
  safeParse: (input: unknown) => OperatorValidationResult<T>
}

type Validator<T> = (input: unknown) => OperatorValidationResult<T>

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input)
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function asString(value: unknown, message: string, path: string, errors: OperatorValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }
  return String(value).trim()
}

function asOptionalString(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  return typeof value === 'string' ? value.trim() : null
}

function asOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function asPositiveNumber(value: unknown, message: string, path: string, errors: OperatorValidationIssue[]) {
  const parsed = asOptionalNumber(value)
  if (parsed === null || parsed < 0) {
    errors.push({ path, message })
    return 0
  }
  return parsed
}

function asPositiveInteger(value: unknown, message: string, path: string, errors: OperatorValidationIssue[], fallback = 0) {
  const parsed = asOptionalNumber(value)
  if (parsed === null || parsed < 0) {
    errors.push({ path, message })
    return fallback
  }
  return Math.trunc(parsed)
}

function asDateString(value: unknown, message: string, path: string, errors: OperatorValidationIssue[]) {
  if (!isNonEmptyString(value)) {
    errors.push({ path, message })
    return ''
  }
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    errors.push({ path, message })
    return ''
  }
  return String(value).trim()
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], message: string, path: string, errors: OperatorValidationIssue[]) {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    errors.push({ path, message })
    return allowed[0]
  }
  return value as T
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function createSchema<T>(name: string, validator: Validator<T>): OperatorSchema<T> {
  return {
    name,
    parse(input) {
      const result = validator(input)
      if (!result.success) {
        throw new Error(result.errors.map((item) => `${item.path}: ${item.message}`).join(' | '))
      }
      return result.data
    },
    safeParse: validator,
  }
}

export type OperatorClientCreateInput = {
  clientCode: string
  displayName: string
  legalName?: string | null
  clientType: string
  city?: string | null
  country?: string | null
  address?: string | null
  primaryContactName?: string | null
  primaryContactEmail?: string | null
  primaryContactPhone?: string | null
  status: string
  lifecycleStage: string
  source?: string | null
  healthStatus?: string | null
  riskLevel?: string | null
  notes?: string | null
}

export const operatorClientCreateSchema = createSchema<OperatorClientCreateInput>('operator_client_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le client doit être un objet.' }] }
  const data: OperatorClientCreateInput = {
    clientCode: asString(input.clientCode, 'Le code client est requis.', 'clientCode', errors),
    displayName: asString(input.displayName, 'Le nom du client est requis.', 'displayName', errors),
    legalName: asOptionalString(input.legalName),
    clientType: asString(input.clientType, 'Le type de client est requis.', 'clientType', errors),
    city: asOptionalString(input.city),
    country: asOptionalString(input.country) || 'Maroc',
    address: asOptionalString(input.address),
    primaryContactName: asOptionalString(input.primaryContactName),
    primaryContactEmail: asOptionalString(input.primaryContactEmail),
    primaryContactPhone: asOptionalString(input.primaryContactPhone),
    status: asEnum(input.status, ['prospect', 'pilot', 'active', 'suspended', 'churned', 'archived'] as const, 'Le statut du client est invalide.', 'status', errors),
    lifecycleStage: asEnum(input.lifecycleStage, ['lead', 'qualified', 'demo_done', 'proposal_sent', 'contract_pending', 'onboarding', 'live', 'renewal', 'at_risk', 'churned'] as const, 'Le cycle de vie du client est invalide.', 'lifecycleStage', errors),
    source: asOptionalString(input.source),
    healthStatus: asOptionalString(input.healthStatus),
    riskLevel: asOptionalString(input.riskLevel),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type OperatorClientUpdateInput = OperatorClientCreateInput & { id: string }
export const operatorClientUpdateSchema = createSchema<OperatorClientUpdateInput>('operator_client_update', (input) => {
  const parsed = operatorClientCreateSchema.safeParse(input)
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le client doit être un objet.' }] }
  const errors: OperatorValidationIssue[] = []
  const id = asString(input.id, 'Le client est requis.', 'id', errors)
  if (!parsed.success) return { success: false, errors: [...errors, ...parsed.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...parsed.data, id } }
})

export type OperatorClientArchiveInput = { id: string; reason?: string | null }
export const operatorClientArchiveSchema = createSchema<OperatorClientArchiveInput>('operator_client_archive', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le client doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le client est requis.', 'id', errors), reason: asOptionalString(input.reason) } }
})

export type OperatorTenantCreateOrLinkInput = {
  clientId: string
  schoolId?: string | null
  tenantSlug: string
  environment: 'pilot' | 'production' | 'sandbox'
  status: 'not_created' | 'provisioning' | 'active' | 'suspended' | 'archived'
  provisioningStatus?: string | null
  commandCenterUrl?: string | null
  goLiveDate?: string | null
}

export const operatorTenantCreateOrLinkSchema = createSchema<OperatorTenantCreateOrLinkInput>('operator_tenant_create_or_link', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le tenant doit être un objet.' }] }
  const data: OperatorTenantCreateOrLinkInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    schoolId: asOptionalString(input.schoolId),
    tenantSlug: asString(input.tenantSlug, 'Le slug du tenant est requis.', 'tenantSlug', errors),
    environment: asEnum(input.environment, ['pilot', 'production', 'sandbox'] as const, 'L’environnement du tenant est invalide.', 'environment', errors),
    status: asEnum(input.status, ['not_created', 'provisioning', 'active', 'suspended', 'archived'] as const, 'Le statut du tenant est invalide.', 'status', errors),
    provisioningStatus: asOptionalString(input.provisioningStatus),
    commandCenterUrl: asOptionalString(input.commandCenterUrl),
    goLiveDate: asOptionalString(input.goLiveDate),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type OperatorTenantUpdateStatusInput = { id: string; status: string; provisioningStatus?: string | null; commandCenterUrl?: string | null }
export const operatorTenantUpdateStatusSchema = createSchema<OperatorTenantUpdateStatusInput>('operator_tenant_update_status', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le tenant doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'Le tenant est requis.', 'id', errors),
      status: asEnum(input.status, ['not_created', 'provisioning', 'active', 'suspended', 'archived'] as const, 'Le statut du tenant est invalide.', 'status', errors),
      provisioningStatus: asOptionalString(input.provisioningStatus),
      commandCenterUrl: asOptionalString(input.commandCenterUrl),
    },
  }
})

export type OperatorPlanCreateInput = {
  planCode: string
  name: string
  description?: string | null
  monthlyPriceMad: number
  annualPriceMad: number
  billingCycle: string
  maxStudents?: number | null
  maxStaff?: number | null
  maxUsers?: number | null
  maxSites?: number | null
  includedModules?: string[]
  includedFeatures?: string[]
  supportLevel?: string | null
  status: 'draft' | 'active' | 'retired' | 'archived'
}

export const operatorPlanCreateSchema = createSchema<OperatorPlanCreateInput>('operator_plan_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le plan doit être un objet.' }] }
  const data: OperatorPlanCreateInput = {
    planCode: asString(input.planCode, 'Le code du plan est requis.', 'planCode', errors),
    name: asString(input.name, 'Le nom du plan est requis.', 'name', errors),
    description: asOptionalString(input.description),
    monthlyPriceMad: asPositiveNumber(input.monthlyPriceMad, 'Le montant mensuel doit être positif.', 'monthlyPriceMad', errors),
    annualPriceMad: asPositiveNumber(input.annualPriceMad, 'Le montant annuel doit être positif.', 'annualPriceMad', errors),
    billingCycle: asString(input.billingCycle, 'Le cycle de facturation est requis.', 'billingCycle', errors),
    maxStudents: asOptionalNumber(input.maxStudents),
    maxStaff: asOptionalNumber(input.maxStaff),
    maxUsers: asOptionalNumber(input.maxUsers),
    maxSites: asOptionalNumber(input.maxSites),
    includedModules: asStringArray(input.includedModules),
    includedFeatures: asStringArray(input.includedFeatures),
    supportLevel: asOptionalString(input.supportLevel),
    status: asEnum(input.status, ['draft', 'active', 'retired', 'archived'] as const, 'Le statut du plan est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type OperatorPlanUpdateInput = OperatorPlanCreateInput & { id: string }
export const operatorPlanUpdateSchema = createSchema<OperatorPlanUpdateInput>('operator_plan_update', (input) => {
  const parsed = operatorPlanCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le plan doit être un objet.' }] }
  const id = asString(input.id, 'Le plan est requis.', 'id', errors)
  if (!parsed.success) return { success: false, errors: [...errors, ...parsed.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...parsed.data, id } }
})

export type OperatorPlanRetireInput = { id: string }
export const operatorPlanRetireSchema = createSchema<OperatorPlanRetireInput>('operator_plan_retire', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le plan doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le plan est requis.', 'id', errors) } }
})

export type OperatorPackageCreateInput = { packageCode: string; name: string; description?: string | null; moduleKeys?: string[]; featureKeys?: string[]; status: string }
export const operatorPackageCreateSchema = createSchema<OperatorPackageCreateInput>('operator_package_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le package doit être un objet.' }] }
  const data: OperatorPackageCreateInput = {
    packageCode: asString(input.packageCode, 'Le code du package est requis.', 'packageCode', errors),
    name: asString(input.name, 'Le nom du package est requis.', 'name', errors),
    description: asOptionalString(input.description),
    moduleKeys: asStringArray(input.moduleKeys),
    featureKeys: asStringArray(input.featureKeys),
    status: asEnum(input.status, ['draft', 'active', 'retired', 'archived'] as const, 'Le statut du package est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorPackageUpdateSchema = createSchema<OperatorPackageCreateInput & { id: string }>('operator_package_update', (input) => {
  const base = operatorPackageCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le package doit être un objet.' }] }
  const id = asString(input.id, 'Le package est requis.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})

export type OperatorSubscriptionCreateInput = {
  clientId: string
  tenantId?: string | null
  planId: string
  subscriptionCode: string
  status: string
  startDate: string
  trialEndsAt?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  billingCycle: string
  billingAmountMad: number
  discountAmountMad?: number | null
  cancellationReason?: string | null
  suspendedReason?: string | null
}

export const operatorSubscriptionCreateSchema = createSchema<OperatorSubscriptionCreateInput>('operator_subscription_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’abonnement doit être un objet.' }] }
  const data: OperatorSubscriptionCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    tenantId: asOptionalString(input.tenantId),
    planId: asString(input.planId, 'Le plan est requis.', 'planId', errors),
    subscriptionCode: asString(input.subscriptionCode, 'Le code d’abonnement est requis.', 'subscriptionCode', errors),
    status: asEnum(input.status, ['trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired', 'archived'] as const, 'Le statut d’abonnement est invalide.', 'status', errors),
    startDate: asDateString(input.startDate, 'La date de début est requise.', 'startDate', errors),
    trialEndsAt: asOptionalString(input.trialEndsAt),
    currentPeriodStart: asOptionalString(input.currentPeriodStart),
    currentPeriodEnd: asOptionalString(input.currentPeriodEnd),
    billingCycle: asString(input.billingCycle, 'Le cycle de facturation est requis.', 'billingCycle', errors),
    billingAmountMad: asPositiveNumber(input.billingAmountMad, 'Le montant doit être positif.', 'billingAmountMad', errors),
    discountAmountMad: asOptionalNumber(input.discountAmountMad),
    cancellationReason: asOptionalString(input.cancellationReason),
    suspendedReason: asOptionalString(input.suspendedReason),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorSubscriptionUpdateSchema = createSchema<OperatorSubscriptionCreateInput & { id: string }>('operator_subscription_update', (input) => {
  const base = operatorSubscriptionCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’abonnement doit être un objet.' }] }
  const id = asString(input.id, 'L’abonnement est requis.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})
export const operatorSubscriptionStatusChangeSchema = createSchema<{ id: string; status: string; reason?: string | null }>('operator_subscription_status_change', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’abonnement doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'L’abonnement est requis.', 'id', errors),
      status: asEnum(input.status, ['trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired', 'archived'] as const, 'Le statut d’abonnement est invalide.', 'status', errors),
      reason: asOptionalString(input.reason),
    },
  }
})
export const operatorSubscriptionCancelSchema = createSchema<{ id: string; reason?: string | null }>('operator_subscription_cancel', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’abonnement doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'L’abonnement est requis.', 'id', errors), reason: asOptionalString(input.reason) } }
})

export type OperatorBillingAccountCreateInput = { clientId: string; billingName: string; billingEmail: string; billingPhone?: string | null; billingAddress?: string | null; taxIdentifier?: string | null; paymentTermsDays?: number | null; status: string }
export const operatorBillingAccountCreateSchema = createSchema<OperatorBillingAccountCreateInput>('operator_billing_account_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le compte de facturation doit être un objet.' }] }
  const data: OperatorBillingAccountCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    billingName: asString(input.billingName, 'Le nom de facturation est requis.', 'billingName', errors),
    billingEmail: asString(input.billingEmail, 'L’email de facturation est requis.', 'billingEmail', errors),
    billingPhone: asOptionalString(input.billingPhone),
    billingAddress: asOptionalString(input.billingAddress),
    taxIdentifier: asOptionalString(input.taxIdentifier),
    paymentTermsDays: asOptionalNumber(input.paymentTermsDays),
    status: asEnum(input.status, ['active', 'inactive', 'archived'] as const, 'Le statut du compte est invalide.', 'status', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorBillingAccountUpdateSchema = createSchema<OperatorBillingAccountCreateInput & { id: string }>('operator_billing_account_update', (input) => {
  const base = operatorBillingAccountCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le compte de facturation doit être un objet.' }] }
  const id = asString(input.id, 'Le compte de facturation est requis.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})

export type OperatorInvoiceCreateInput = {
  clientId: string
  subscriptionId?: string | null
  billingAccountId?: string | null
  invoiceNumber: string
  issueDate: string
  dueDate: string
  periodStart?: string | null
  periodEnd?: string | null
  subtotalMad: number
  discountMad?: number | null
  totalMad: number
  amountPaidMad?: number | null
  balanceDueMad?: number | null
  status: string
  notes?: string | null
}

export const operatorInvoiceCreateSchema = createSchema<OperatorInvoiceCreateInput>('operator_invoice_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La facture doit être un objet.' }] }
  const data: OperatorInvoiceCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    subscriptionId: asOptionalString(input.subscriptionId),
    billingAccountId: asOptionalString(input.billingAccountId),
    invoiceNumber: asString(input.invoiceNumber, 'Le numéro de facture est requis.', 'invoiceNumber', errors),
    issueDate: asDateString(input.issueDate, 'La date d’émission est requise.', 'issueDate', errors),
    dueDate: asDateString(input.dueDate, 'La date d’échéance est requise.', 'dueDate', errors),
    periodStart: asOptionalString(input.periodStart),
    periodEnd: asOptionalString(input.periodEnd),
    subtotalMad: asPositiveNumber(input.subtotalMad, 'Le sous-total doit être positif.', 'subtotalMad', errors),
    discountMad: asOptionalNumber(input.discountMad),
    totalMad: asPositiveNumber(input.totalMad, 'Le total doit être positif.', 'totalMad', errors),
    amountPaidMad: asOptionalNumber(input.amountPaidMad),
    balanceDueMad: asOptionalNumber(input.balanceDueMad),
    status: asEnum(input.status, ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived'] as const, 'Le statut de facture est invalide.', 'status', errors),
    notes: asOptionalString(input.notes),
  }
  if (data.issueDate && data.dueDate && new Date(data.dueDate).getTime() < new Date(data.issueDate).getTime()) {
    errors.push({ path: 'dueDate', message: 'La date d’échéance doit être postérieure à la date d’émission.' })
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorInvoiceIssueSchema = createSchema<{ id: string }>('operator_invoice_issue', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La facture doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'La facture est requise.', 'id', errors) } }
})
export const operatorInvoiceCancelSchema = createSchema<{ id: string; reason?: string | null }>('operator_invoice_cancel', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La facture doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'La facture est requise.', 'id', errors), reason: asOptionalString(input.reason) } }
})

export type OperatorDunningActionCreateInput = { clientId: string; invoiceId?: string | null; actionType: string; status: string; dueDate?: string | null; notes?: string | null }
export const operatorDunningActionCreateSchema = createSchema<OperatorDunningActionCreateInput>('operator_dunning_action_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’action de relance doit être un objet.' }] }
  const data: OperatorDunningActionCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    invoiceId: asOptionalString(input.invoiceId),
    actionType: asString(input.actionType, 'Le type d’action est requis.', 'actionType', errors),
    status: asEnum(input.status, ['planned', 'in_progress', 'completed', 'blocked', 'cancelled'] as const, 'Le statut de relance est invalide.', 'status', errors),
    dueDate: asOptionalString(input.dueDate),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorDunningActionCompleteSchema = createSchema<{ id: string }>('operator_dunning_action_complete', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’action de relance doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'L’action de relance est requise.', 'id', errors) } }
})

export type OperatorPaymentRecordInput = {
  clientId: string
  invoiceId?: string | null
  paymentReference: string
  paymentDate: string
  amountMad: number
  method: string
  status: string
  receivedBy?: string | null
  notes?: string | null
}

export const operatorPaymentRecordSchema = createSchema<OperatorPaymentRecordInput>('operator_payment_record', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le paiement doit être un objet.' }] }
  const data: OperatorPaymentRecordInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    invoiceId: asOptionalString(input.invoiceId),
    paymentReference: asString(input.paymentReference, 'La référence de paiement est requise.', 'paymentReference', errors),
    paymentDate: asDateString(input.paymentDate, 'La date de paiement est requise.', 'paymentDate', errors),
    amountMad: asPositiveNumber(input.amountMad, 'Le montant doit être positif.', 'amountMad', errors),
    method: asEnum(input.method, ['bank_transfer', 'cash', 'cheque', 'card_manual', 'other'] as const, 'Le mode de paiement est invalide.', 'method', errors),
    status: asEnum(input.status, ['pending', 'confirmed', 'rejected', 'refunded', 'cancelled'] as const, 'Le statut du paiement est invalide.', 'status', errors),
    receivedBy: asOptionalString(input.receivedBy),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorPaymentConfirmSchema = createSchema<{ id: string }>('operator_payment_confirm', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le paiement doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le paiement est requis.', 'id', errors) } }
})
export const operatorPaymentRejectSchema = createSchema<{ id: string; reason?: string | null }>('operator_payment_reject', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le paiement doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le paiement est requis.', 'id', errors), reason: asOptionalString(input.reason) } }
})

export type OperatorFeatureFlagUpdateInput = {
  id: string
  enabled: boolean
  status: string
  lockedReason?: string | null
  scheduledFor?: string | null
}

export const operatorFeatureFlagUpdateSchema = createSchema<OperatorFeatureFlagUpdateInput>('operator_feature_flag_update', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le feature flag doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'Le feature flag est requis.', 'id', errors),
      enabled: asBoolean(input.enabled),
      status: asEnum(input.status, ['enabled', 'disabled', 'locked', 'scheduled', 'requires_configuration'] as const, 'Le statut du feature flag est invalide.', 'status', errors),
      lockedReason: asOptionalString(input.lockedReason),
      scheduledFor: asOptionalString(input.scheduledFor),
    },
  }
})

export type OperatorUsageLimitUpdateInput = { id: string; allowedValue?: number | null; currentValue?: number | null; status: string; resetCycle?: string | null }
export const operatorUsageLimitUpdateSchema = createSchema<OperatorUsageLimitUpdateInput>('operator_usage_limit_update', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La limite doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'La limite est requise.', 'id', errors),
      allowedValue: asOptionalNumber(input.allowedValue),
      currentValue: asOptionalNumber(input.currentValue),
      status: asEnum(input.status, ['active', 'paused', 'archived'] as const, 'Le statut de la limite est invalide.', 'status', errors),
      resetCycle: asOptionalString(input.resetCycle),
    },
  }
})

export type OperatorOnboardingTaskCreateInput = { clientId: string; tenantId?: string | null; title: string; description?: string | null; ownerId?: string | null; status: string; priority: string; dueDate?: string | null }
export const operatorOnboardingTaskCreateSchema = createSchema<OperatorOnboardingTaskCreateInput>('operator_onboarding_task_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  const data: OperatorOnboardingTaskCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    tenantId: asOptionalString(input.tenantId),
    title: asString(input.title, 'Le titre est requis.', 'title', errors),
    description: asOptionalString(input.description),
    ownerId: asOptionalString(input.ownerId),
    status: asEnum(input.status, ['todo', 'in_progress', 'blocked', 'done', 'cancelled'] as const, 'Le statut de tâche est invalide.', 'status', errors),
    priority: asEnum(input.priority, ['low', 'normal', 'high', 'urgent'] as const, 'La priorité est invalide.', 'priority', errors),
    dueDate: asOptionalString(input.dueDate),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorOnboardingTaskUpdateSchema = createSchema<OperatorOnboardingTaskCreateInput & { id: string }>('operator_onboarding_task_update', (input) => {
  const base = operatorOnboardingTaskCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  const id = asString(input.id, 'La tâche est requise.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})
export const operatorOnboardingTaskCompleteSchema = createSchema<{ id: string }>('operator_onboarding_task_complete', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'La tâche est requise.', 'id', errors) } }
})

export type OperatorSupportTicketCreateInput = { clientId: string; tenantId?: string | null; subject: string; description: string; category: string; priority: string; status: string; assignedTo?: string | null; resolutionSummary?: string | null }
export const operatorSupportTicketCreateSchema = createSchema<OperatorSupportTicketCreateInput>('operator_support_ticket_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le ticket doit être un objet.' }] }
  const data: OperatorSupportTicketCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    tenantId: asOptionalString(input.tenantId),
    subject: asString(input.subject, 'Le sujet est requis.', 'subject', errors),
    description: asString(input.description, 'La description est requise.', 'description', errors),
    category: asString(input.category, 'La catégorie est requise.', 'category', errors),
    priority: asEnum(input.priority, ['low', 'normal', 'high', 'urgent'] as const, 'La priorité est invalide.', 'priority', errors),
    status: asEnum(input.status, ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal', 'resolved', 'closed', 'archived'] as const, 'Le statut du ticket est invalide.', 'status', errors),
    assignedTo: asOptionalString(input.assignedTo),
    resolutionSummary: asOptionalString(input.resolutionSummary),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorSupportTicketAssignSchema = createSchema<{ id: string; assignedTo: string }>('operator_support_ticket_assign', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le ticket doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le ticket est requis.', 'id', errors), assignedTo: asString(input.assignedTo, 'L’assignation est requise.', 'assignedTo', errors) } }
})
export const operatorSupportTicketStatusChangeSchema = createSchema<{ id: string; status: string; reason?: string | null }>('operator_support_ticket_status_change', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le ticket doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le ticket est requis.', 'id', errors), status: asEnum(input.status, ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal', 'resolved', 'closed', 'archived'] as const, 'Le statut du ticket est invalide.', 'status', errors), reason: asOptionalString(input.reason) } }
})
export const operatorSupportTicketResolveSchema = createSchema<{ id: string; resolutionSummary: string }>('operator_support_ticket_resolve', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le ticket doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le ticket est requis.', 'id', errors), resolutionSummary: asString(input.resolutionSummary, 'La résolution est requise avant clôture.', 'resolutionSummary', errors) } }
})

export type OperatorContractCreateInput = { clientId: string; subscriptionId?: string | null; contractCode: string; status: string; startDate: string; endDate?: string | null; renewalDate?: string | null; signedAt?: string | null; documentUrl?: string | null; notes?: string | null }
export const operatorContractCreateSchema = createSchema<OperatorContractCreateInput>('operator_contract_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le contrat doit être un objet.' }] }
  const data: OperatorContractCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    subscriptionId: asOptionalString(input.subscriptionId),
    contractCode: asString(input.contractCode, 'Le code du contrat est requis.', 'contractCode', errors),
    status: asEnum(input.status, ['draft', 'sent', 'signed', 'active', 'expired', 'cancelled', 'archived'] as const, 'Le statut du contrat est invalide.', 'status', errors),
    startDate: asDateString(input.startDate, 'La date de début est requise.', 'startDate', errors),
    endDate: asOptionalString(input.endDate),
    renewalDate: asOptionalString(input.renewalDate),
    signedAt: asOptionalString(input.signedAt),
    documentUrl: asOptionalString(input.documentUrl),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorContractStatusUpdateSchema = createSchema<{ id: string; status: string }>('operator_contract_status_update', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le contrat doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le contrat est requis.', 'id', errors), status: asEnum(input.status, ['draft', 'sent', 'signed', 'active', 'expired', 'cancelled', 'archived'] as const, 'Le statut du contrat est invalide.', 'status', errors) } }
})

export type OperatorRenewalCreateInput = { clientId: string; subscriptionId?: string | null; renewalDate: string; status: string; probability?: number | null; expectedAmountMad?: number | null; ownerId?: string | null; notes?: string | null }
export const operatorRenewalCreateSchema = createSchema<OperatorRenewalCreateInput>('operator_renewal_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le renouvellement doit être un objet.' }] }
  const data: OperatorRenewalCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    subscriptionId: asOptionalString(input.subscriptionId),
    renewalDate: asDateString(input.renewalDate, 'La date de renouvellement est requise.', 'renewalDate', errors),
    status: asEnum(input.status, ['upcoming', 'in_discussion', 'proposal_sent', 'renewed', 'at_risk', 'lost', 'cancelled'] as const, 'Le statut de renouvellement est invalide.', 'status', errors),
    probability: asOptionalNumber(input.probability),
    expectedAmountMad: asOptionalNumber(input.expectedAmountMad),
    ownerId: asOptionalString(input.ownerId),
    notes: asOptionalString(input.notes),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorRenewalStatusUpdateSchema = createSchema<{ id: string; status: string }>('operator_renewal_status_update', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le renouvellement doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'Le renouvellement est requis.', 'id', errors), status: asEnum(input.status, ['upcoming', 'in_discussion', 'proposal_sent', 'renewed', 'at_risk', 'lost', 'cancelled'] as const, 'Le statut de renouvellement est invalide.', 'status', errors) } }
})

export type OperatorServiceRequestCreateInput = { clientId: string; tenantId?: string | null; requestType: string; title: string; description: string; priority: string; status: string; assignedTo?: string | null; dueDate?: string | null }
export const operatorServiceRequestCreateSchema = createSchema<OperatorServiceRequestCreateInput>('operator_service_request_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La demande service doit être un objet.' }] }
  const data: OperatorServiceRequestCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    tenantId: asOptionalString(input.tenantId),
    requestType: asString(input.requestType, 'Le type de demande est requis.', 'requestType', errors),
    title: asString(input.title, 'Le titre est requis.', 'title', errors),
    description: asString(input.description, 'La description est requise.', 'description', errors),
    priority: asEnum(input.priority, ['low', 'normal', 'high', 'urgent'] as const, 'La priorité est invalide.', 'priority', errors),
    status: asEnum(input.status, ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal', 'resolved', 'closed', 'archived'] as const, 'Le statut est invalide.', 'status', errors),
    assignedTo: asOptionalString(input.assignedTo),
    dueDate: asOptionalString(input.dueDate),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorServiceRequestUpdateSchema = createSchema<OperatorServiceRequestCreateInput & { id: string }>('operator_service_request_update', (input) => {
  const base = operatorServiceRequestCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La demande service doit être un objet.' }] }
  const id = asString(input.id, 'La demande service est requise.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})
export const operatorServiceRequestCompleteSchema = createSchema<{ id: string }>('operator_service_request_complete', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La demande service doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'La demande service est requise.', 'id', errors) } }
})

export type OperatorIncidentCreateInput = { clientId?: string | null; tenantId?: string | null; severity: string; status: string; title: string; description: string; startedAt?: string | null }
export const operatorIncidentCreateSchema = createSchema<OperatorIncidentCreateInput>('operator_incident_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’incident doit être un objet.' }] }
  const data: OperatorIncidentCreateInput = {
    clientId: asOptionalString(input.clientId),
    tenantId: asOptionalString(input.tenantId),
    severity: asEnum(input.severity, ['low', 'medium', 'high', 'critical'] as const, 'La sévérité est invalide.', 'severity', errors),
    status: asEnum(input.status, ['open', 'investigating', 'mitigated', 'resolved', 'archived'] as const, 'Le statut d’incident est invalide.', 'status', errors),
    title: asString(input.title, 'Le titre est requis.', 'title', errors),
    description: asString(input.description, 'La description est requise.', 'description', errors),
    startedAt: asOptionalString(input.startedAt),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorIncidentResolveSchema = createSchema<{ id: string }>('operator_incident_resolve', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’incident doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'L’incident est requis.', 'id', errors) } }
})

export type OperatorTaskCreateInput = { clientId?: string | null; tenantId?: string | null; title: string; description?: string | null; ownerId?: string | null; status: string; priority: string; dueDate?: string | null }
export const operatorTaskCreateSchema = createSchema<OperatorTaskCreateInput>('operator_task_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  const data: OperatorTaskCreateInput = {
    clientId: asOptionalString(input.clientId),
    tenantId: asOptionalString(input.tenantId),
    title: asString(input.title, 'Le titre est requis.', 'title', errors),
    description: asOptionalString(input.description),
    ownerId: asOptionalString(input.ownerId),
    status: asEnum(input.status, ['todo', 'in_progress', 'blocked', 'done', 'cancelled'] as const, 'Le statut est invalide.', 'status', errors),
    priority: asEnum(input.priority, ['low', 'normal', 'high', 'urgent'] as const, 'La priorité est invalide.', 'priority', errors),
    dueDate: asOptionalString(input.dueDate),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})
export const operatorTaskUpdateSchema = createSchema<OperatorTaskCreateInput & { id: string }>('operator_task_update', (input) => {
  const base = operatorTaskCreateSchema.safeParse(input)
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  const id = asString(input.id, 'La tâche est requise.', 'id', errors)
  if (!base.success) return { success: false, errors: [...errors, ...base.errors] }
  return errors.length ? { success: false, errors } : { success: true, data: { ...base.data, id } }
})
export const operatorTaskCompleteSchema = createSchema<{ id: string }>('operator_task_complete', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La tâche doit être un objet.' }] }
  return { success: true, data: { id: asString(input.id, 'La tâche est requise.', 'id', errors) } }
})

export type OperatorNoteCreateInput = { clientId?: string | null; tenantId?: string | null; authorId?: string | null; noteType: string; body: string; visibility: string }
export const operatorNoteCreateSchema = createSchema<OperatorNoteCreateInput>('operator_note_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La note doit être un objet.' }] }
  const data: OperatorNoteCreateInput = {
    clientId: asOptionalString(input.clientId),
    tenantId: asOptionalString(input.tenantId),
    authorId: asOptionalString(input.authorId),
    noteType: asString(input.noteType, 'Le type de note est requis.', 'noteType', errors),
    body: asString(input.body, 'Le contenu est requis.', 'body', errors),
    visibility: asEnum(input.visibility, ['internal', 'restricted', 'public'] as const, 'La visibilité est invalide.', 'visibility', errors),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type OperatorServiceEventCreateInput = { clientId?: string | null; tenantId?: string | null; eventType: string; severity: string; title: string; description?: string | null; status: string; occurredAt?: string | null }
export const operatorServiceEventCreateSchema = createSchema<OperatorServiceEventCreateInput>('operator_service_event_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'L’événement doit être un objet.' }] }
  const data: OperatorServiceEventCreateInput = {
    clientId: asOptionalString(input.clientId),
    tenantId: asOptionalString(input.tenantId),
    eventType: asString(input.eventType, 'Le type d’événement est requis.', 'eventType', errors),
    severity: asEnum(input.severity, ['debug', 'info', 'notice', 'warning', 'critical'] as const, 'La sévérité est invalide.', 'severity', errors),
    title: asString(input.title, 'Le titre est requis.', 'title', errors),
    description: asOptionalString(input.description),
    status: asEnum(input.status, ['open', 'watching', 'resolved', 'archived'] as const, 'Le statut est invalide.', 'status', errors),
    occurredAt: asOptionalString(input.occurredAt),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export type OperatorAuditFilter = {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  clientId?: string | null
  tenantId?: string | null
  from?: string | null
  to?: string | null
}

export const operatorAuditFiltersSchema = createSchema<OperatorAuditFilter>('operator_audit_filters', (input) => {
  if (!isRecord(input)) {
    return { success: true, data: {} }
  }
  return {
    success: true,
    data: {
      search: asOptionalString(input.search),
      module: asOptionalString(input.module),
      action: asOptionalString(input.action),
      severity: asOptionalString(input.severity),
      clientId: asOptionalString(input.clientId),
      tenantId: asOptionalString(input.tenantId),
      from: asOptionalString(input.from),
      to: asOptionalString(input.to),
    },
  }
})

export type OperatorPaymentGateCreateInput = {
  clientId: string
  tenantId?: string | null
  invoiceId?: string | null
  subscriptionId?: string | null
  gateCode: string
  status: 'active' | 'online_processing' | 'manual_pending' | 'processed' | 'waived' | 'cancelled' | 'expired'
  amountDueMad: number
  currency?: string | null
  reason: string
  dueDate?: string | null
  blocking?: boolean
  providerKey?: string | null
  checkoutUrl?: string | null
  onlinePaymentReference?: string | null
}

export const operatorPaymentGateCreateSchema = createSchema<OperatorPaymentGateCreateInput>('operator_payment_gate_create', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le gate de paiement doit être un objet.' }] }
  const data: OperatorPaymentGateCreateInput = {
    clientId: asString(input.clientId, 'Le client est requis.', 'clientId', errors),
    tenantId: asOptionalString(input.tenantId),
    invoiceId: asOptionalString(input.invoiceId),
    subscriptionId: asOptionalString(input.subscriptionId),
    gateCode: asString(input.gateCode, 'Le code du gate est requis.', 'gateCode', errors),
    status: asEnum(input.status, ['active', 'online_processing', 'manual_pending', 'processed', 'waived', 'cancelled', 'expired'] as const, 'Le statut du gate est invalide.', 'status', errors),
    amountDueMad: asPositiveNumber(input.amountDueMad, 'Le montant dû doit être positif.', 'amountDueMad', errors),
    currency: asOptionalString(input.currency) || 'MAD',
    reason: asString(input.reason, 'Le motif est requis.', 'reason', errors),
    dueDate: asOptionalString(input.dueDate),
    blocking: typeof input.blocking === 'boolean' ? input.blocking : true,
    providerKey: asOptionalString(input.providerKey),
    checkoutUrl: asOptionalString(input.checkoutUrl),
    onlinePaymentReference: asOptionalString(input.onlinePaymentReference),
  }
  return errors.length ? { success: false, errors } : { success: true, data }
})

export const operatorPaymentGateStatusSchema = createSchema<{ id: string; status: OperatorPaymentGateCreateInput['status']; resolutionReason?: string | null }>('operator_payment_gate_status', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'Le gate de paiement doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'Le gate de paiement est requis.', 'id', errors),
      status: asEnum(input.status, ['active', 'online_processing', 'manual_pending', 'processed', 'waived', 'cancelled', 'expired'] as const, 'Le statut du gate est invalide.', 'status', errors),
      resolutionReason: asOptionalString(input.resolutionReason),
    },
  }
})

export const operatorEmailSendSchema = createSchema<{ id: string; recipientEmail?: string | null; note?: string | null }>('operator_email_send', (input) => {
  const errors: OperatorValidationIssue[] = []
  if (!isRecord(input)) return { success: false, errors: [{ path: 'racine', message: 'La requête email doit être un objet.' }] }
  return {
    success: true,
    data: {
      id: asString(input.id, 'La référence est requise.', 'id', errors),
      recipientEmail: asOptionalString(input.recipientEmail),
      note: asOptionalString(input.note),
    },
  }
})
