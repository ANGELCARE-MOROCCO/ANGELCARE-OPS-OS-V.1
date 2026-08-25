import type { CustomerAccountKind, CustomerAccountStatus, PaymentIntentStatus, PaymentMethodKind } from '../customer-commerce/types'

export type AdminCustomerSummary = {
  id: string
  public_reference: string
  auth_user_id: string
  account_kind: CustomerAccountKind
  status: CustomerAccountStatus
  display_name: string
  email: string | null
  phone: string | null
  preferred_locale: 'fr' | 'en' | 'ar'
  family_account_id: string | null
  territory_id: string | null
  premium_status: boolean
  created_at: string
  updated_at: string
  order_count: number
  payment_count: number
}

export type AdminCustomerDossier = {
  account: AdminCustomerSummary
  family: Record<string, unknown> | null
  children: Record<string, unknown>[]
  familyRequests: Record<string, unknown>[]
  supportTickets: Record<string, unknown>[]
  addresses: Record<string, unknown>[]
  organizationMemberships: Record<string, unknown>[]
  notificationPreferences: Record<string, unknown> | null
  wallet: Record<string, unknown> | null
  orders: Record<string, unknown>[]
  payments: Record<string, unknown>[]
}

export type AdminCustomerList = {
  customers: AdminCustomerSummary[]
  total: number
  active: number
  families: number
  organizations: number
  restricted: number
}

export type AdminPaymentRecord = {
  id: string
  public_reference: string
  customer_account_id: string | null
  customer_name: string
  customer_reference: string | null
  canonical_object_type: string | null
  canonical_object_id: string | null
  order_reference: string | null
  order_title: string | null
  status: PaymentIntentStatus
  currency_label: string
  expected_amount: number
  authorized_amount: number
  captured_amount: number
  refunded_amount: number
  due_now_amount: number
  due_later_amount: number
  selected_method: PaymentMethodKind | null
  provider_key: string | null
  provider_reference: string | null
  created_at: string
  updated_at: string
}

export type AdminPaymentDossier = {
  payment: AdminPaymentRecord
  attempts: Record<string, unknown>[]
  refunds: Record<string, unknown>[]
  order: Record<string, unknown> | null
}

export type AdminPaymentSummary = {
  payments: AdminPaymentRecord[]
  total: number
  pending: number
  captured: number
  failed: number
  refunded: number
  disputed: number
  expectedVolume: number
  capturedVolume: number
  refundedVolume: number
}

export type ManualOrderInput = {
  customerId: string
  title: string
  journeyType: 'product_order' | 'kit_order' | 'family_booking' | 'recurring_service' | 'academy_enrollment' | 'b2b_quotation' | 'hospitality_programme' | 'corporate_benefit' | 'partner_activation' | 'quality_assessment'
  amount: number
  currencyLabel?: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  notes?: string | null
  createPayment: boolean
  paymentMethod?: PaymentMethodKind
  providerReference?: string | null
}
