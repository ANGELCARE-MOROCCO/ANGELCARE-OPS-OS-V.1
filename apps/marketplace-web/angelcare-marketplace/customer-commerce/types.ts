import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'
import type { JourneyType, MarketplaceJourney } from '../journey-control/types'

export type CustomerAccountKind = 'individual' | 'family' | 'organization' | 'employee_beneficiary' | 'guest'
export type CustomerAccountStatus = 'pending_verification' | 'active' | 'restricted' | 'suspended' | 'closed'
export type CustomerVerificationChannel = 'email' | 'phone'
export type CustomerSessionRisk = 'normal' | 'review' | 'high' | 'blocked'

export interface CustomerAccount {
  id: string
  public_reference: string
  auth_user_id: string
  account_kind: CustomerAccountKind
  status: CustomerAccountStatus
  display_name: string
  email: string | null
  phone: string | null
  preferred_locale: CatalogLocale
  family_account_id: string | null
  crm_account_id: string | null
  tenant_id: string | null
  territory_id: string | null
  email_verified_at: string | null
  phone_verified_at: string | null
  premium_status: boolean
  created_at: string
  updated_at: string
}

export interface CustomerContext {
  account: CustomerAccount
  authUserId: string
  locale: CatalogLocale
  marketplace: MarketplaceRequestContext
}

export type PaymentMethodKind =
  | 'ac_wallet'
  | 'card'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'pay_at_location'
  | 'invoice'
  | 'deposit'
  | 'installment'
  | 'corporate_allowance'
  | 'voucher'
  | 'manual_verified'

export type PaymentIntentStatus =
  | 'created'
  | 'requires_method'
  | 'requires_customer_action'
  | 'pending'
  | 'authorized'
  | 'partially_captured'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'partially_refunded'
  | 'refunded'
  | 'disputed'
  | 'chargeback'
  | 'reversed'
  | 'reconciliation_pending'
  | 'reconciled'

export interface PaymentMethodOption {
  kind: PaymentMethodKind
  label: string
  description: string
  eligible: boolean
  reason: string | null
  requiresExternalProvider: boolean
  supportsSplit: boolean
  supportsRefund: boolean
  dueNow: number
  currencyLabel: string
  metadata: Record<string, unknown>
}

export interface PaymentIntent {
  id: string
  public_reference: string
  customer_account_id: string | null
  conversion_session_id: string | null
  canonical_object_type: string | null
  canonical_object_id: string | null
  status: PaymentIntentStatus
  currency_label: string
  expected_amount: number
  authorized_amount: number
  captured_amount: number
  refunded_amount: number
  due_now_amount: number
  due_later_amount: number
  wallet_contribution: number
  external_contribution: number
  metadata: Record<string, unknown>
  idempotency_key: string
  selected_method: PaymentMethodKind | null
  provider_key: string | null
  provider_reference: string | null
  wallet_reservation_id: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentAttempt {
  id: string
  payment_intent_id: string
  attempt_number: number
  method_kind: PaymentMethodKind
  status: string
  amount: number
  provider_key: string | null
  provider_reference: string | null
  failure_code: string | null
  customer_message: string | null
  created_at: string
}

export type WalletBucketKind =
  | 'purchased'
  | 'promotional'
  | 'goodwill'
  | 'refund'
  | 'employer'
  | 'gift'
  | 'reserved'
  | 'pending'
  | 'expiring'
  | 'expired'
  | 'frozen'
  | 'disputed'

export type WalletEntryType =
  | 'top_up'
  | 'top_up_bonus'
  | 'purchase_reservation'
  | 'purchase_commit'
  | 'reservation_release'
  | 'refund'
  | 'partial_refund'
  | 'goodwill_credit'
  | 'promotion_credit'
  | 'manual_adjustment_credit'
  | 'manual_adjustment_debit'
  | 'expiry'
  | 'expiry_reversal'
  | 'chargeback_freeze'
  | 'chargeback_reversal'
  | 'employer_credit'
  | 'gift_credit'
  | 'migration_credit'
  | 'correction'

export interface WalletBalanceBucket {
  bucket_kind: WalletBucketKind
  available_amount: number
  reserved_amount: number
  expires_at: string | null
}

export interface WalletMembership {
  id: string
  tier_key: string
  tier_name: string
  status: string
  qualified_at: string | null
  expires_at: string | null
  progress: number
  next_tier_name: string | null
  next_tier_threshold: number | null
}

export interface WalletAccount {
  id: string
  public_reference: string
  customer_account_id: string
  status: 'active' | 'frozen' | 'restricted' | 'closed'
  currency_label: string
  available_balance: number
  purchased_balance: number
  bonus_balance: number
  reserved_balance: number
  expiring_balance: number
  lifetime_funded: number
  lifetime_spent: number
  lifetime_savings: number
  buckets: WalletBalanceBucket[]
  membership: WalletMembership | null
  created_at: string
  updated_at: string
}

export interface WalletLedgerEntry {
  id: string
  public_reference: string
  wallet_account_id: string
  entry_type: WalletEntryType
  bucket_kind: WalletBucketKind
  direction: 'credit' | 'debit'
  amount: number
  balance_after: number
  source_type: string
  source_id: string | null
  order_reference: string | null
  payment_reference: string | null
  policy_id: string | null
  reason_code: string
  description: string
  effective_at: string
  expires_at: string | null
  created_at: string
}

export type WalletPolicyBenefitKind =
  | 'percentage_discount'
  | 'fixed_discount'
  | 'wallet_fixed_price'
  | 'bonus_credits'
  | 'topup_bonus'
  | 'cashback_credits'
  | 'free_delivery'
  | 'priority_booking'
  | 'priority_waitlist'
  | 'included_addon'
  | 'fee_waiver'
  | 'early_access'
  | 'exclusive_availability'

export interface WalletPolicy {
  id: string
  policy_key: string
  name_fr: string
  name_en: string
  name_ar: string
  description_fr: string | null
  status: 'draft' | 'active' | 'suspended' | 'archived'
  priority: number
  stack_mode: 'stackable' | 'exclusive' | 'best_benefit'
  customer_scope: string
  conditions: Record<string, unknown>
  benefits: Record<string, unknown>
  customer_message: Record<string, string>
  starts_at: string | null
  ends_at: string | null
  usage_limit_per_customer: number | null
  campaign_budget: number | null
  consumed_budget: number
  maximum_discount: number | null
  margin_floor_rate: number | null
  version: number
  created_at: string
  updated_at: string
}

export interface WalletPolicyEvaluationLine {
  policyId: string
  policyKey: string
  policyName: string
  accepted: boolean
  rejectionReason: string | null
  benefitKind: WalletPolicyBenefitKind | null
  benefitAmount: number
  priority: number
  customerMessage: string | null
  evidence: Record<string, unknown>
}

export interface WalletComparison {
  normalPrice: number
  walletPrice: number
  immediateSaving: number
  savingPercent: number
  walletBalance: number
  walletContribution: number
  externalContribution: number
  remainingBalance: number
  requiredTopUp: number
  suggestedTopUp: number
  topUpBonus: number
  priorityLabel: string | null
  eligible: boolean
  reason: string | null
  policies: WalletPolicyEvaluationLine[]
  evaluationId: string | null
  currencyLabel: string
}

export interface WalletSummary {
  account: WalletAccount
  recentEntries: WalletLedgerEntry[]
  activePolicies: WalletPolicy[]
  expiring: Array<{ amount: number; expiresAt: string; bucketKind: WalletBucketKind }>
  recommendations: Array<{ title: string; message: string; href: string }>
}

export interface WalletTopUpQuote {
  requestedAmount: number
  purchasedCredits: number
  bonusCredits: number
  totalCredits: number
  availableMethods: PaymentMethodOption[]
  policyEvaluations: WalletPolicyEvaluationLine[]
  currencyLabel: string
}

export interface WalletTopUpResult {
  topupId: string
  publicReference: string
  paymentIntent: PaymentIntent
  walletAccount: WalletAccount
  status: string
}

export interface CustomerPortfolio {
  locale: CatalogLocale
  account: CustomerAccount
  wallet: WalletAccount | null
  journeys: MarketplaceJourney[]
  filteredJourneys: MarketplaceJourney[]
  filter: JourneyType | 'all'
  counts: Record<string, number>
  pendingPayments: PaymentIntent[]
}

export interface WalletAdminSummary {
  walletCount: number
  activeWallets: number
  frozenWallets: number
  availableLiability: number
  purchasedLiability: number
  promotionalExposure: number
  reservedCredits: number
  expiringCredits: number
  fundedVolume: number
  spentVolume: number
  issuedSavings: number
  reconciliationExceptions: number
  recentAccounts: WalletAccount[]
}

export interface EnterpriseOrderRecord {
  id: string
  publicReference: string
  journeyType: JourneyType
  status: string
  title: string
  customerName: string
  customerReference: string | null
  paymentStatus: string
  paymentAmount: number
  walletContribution: number
  externalContribution: number
  fulfillmentStatus: string
  riskLevel: string
  nextAction: string | null
  updatedAt: string
  journey: MarketplaceJourney | null
}

export interface EnterpriseOrderSummary {
  total: number
  requiringAction: number
  paymentExceptions: number
  fulfillmentExceptions: number
  walletExceptions: number
  refundsPending: number
  records: EnterpriseOrderRecord[]
}

export interface PaymentProviderRequest {
  intent: PaymentIntent
  method: PaymentMethodKind
  returnUrl: string
  cancelUrl: string
  customer: CustomerAccount | null
  metadata: Record<string, unknown>
}

export interface PaymentProviderResult {
  status: PaymentIntentStatus
  providerKey: string
  providerReference: string | null
  customerActionUrl: string | null
  customerMessage: string
  evidence: Record<string, unknown>
}
