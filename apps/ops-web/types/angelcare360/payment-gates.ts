export type Angelcare360PaymentGateStatus =
  | 'active'
  | 'online_processing'
  | 'manual_pending'
  | 'processed'
  | 'waived'
  | 'cancelled'
  | 'expired'

export interface Angelcare360PaymentGateRecord {
  id: string
  client_id: string
  client_display_name?: string | null
  school_name?: string | null
  tenant_id?: string | null
  tenant_slug?: string | null
  invoice_id?: string | null
  invoice_number?: string | null
  subscription_id?: string | null
  subscription_code?: string | null
  gate_code: string
  status: Angelcare360PaymentGateStatus | string
  amount_due_mad: number | string
  currency: string
  reason: string
  due_date?: string | null
  blocking: boolean
  provider_key?: string | null
  checkout_url?: string | null
  online_payment_reference?: string | null
  manual_processed_by?: string | null
  manual_processed_at?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  resolution_reason?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface Angelcare360PaymentProviderStatus {
  configured: boolean
  providerKey: string | null
  locked: boolean
  reason: string
}
