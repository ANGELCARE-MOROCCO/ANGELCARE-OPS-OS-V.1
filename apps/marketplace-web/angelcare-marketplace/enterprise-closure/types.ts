export type InvoiceStatus='draft'|'issued'|'partially_paid'|'paid'|'overdue'|'cancelled'|'credited'
export type PromotionStatus='draft'|'active'|'paused'|'expired'|'archived'
export type SubscriptionStatus='draft'|'trial'|'active'|'paused'|'past_due'|'cancelled'|'expired'
export type BookingStatus='registered'|'awaiting_customer'|'awaiting_angelcare'|'qualified'|'scheduled'|'in_preparation'|'in_progress'|'completed'|'blocked'|'recovery'|'cancelled'

export interface EnterpriseCustomerRef{ id:string;public_reference:string;display_name:string;email:string|null;phone:string|null;family_account_id:string|null;status:string }
export interface FamilyGuardianRecord{ id:string;public_reference:string;family_account_id:string;customer_account_id:string|null;full_name:string;relationship:string;email:string|null;phone:string|null;is_primary:boolean;status:string;notes:string|null;created_at:string;updated_at:string }
export interface EnterpriseCatalogRef{ id:string;public_reference:string;name:string;slug:string;kind:string;price_amount:number|null;currency_label:string;availability_status:string;category_key:string|null }

export interface OrderLineRecord{
 id:string;public_reference:string;journey_id:string;catalog_item_id:string|null;catalog_variant_id:string|null;line_type:string;title:string;quantity:number;unit_price:number;discount_amount:number;tax_amount:number;line_total:number;currency_label:string;configuration:Record<string,unknown>;fulfillment_config:Record<string,unknown>;status:string;sort_order:number;created_at:string;updated_at:string
}

export interface EnterpriseOrderRecord{
 id:string;public_reference:string;journey_type:string;status:BookingStatus;title:string;customer_account_id:string|null;customer_name:string;customer_reference:string|null;scheduled_start_at:string|null;scheduled_end_at:string|null;financial_status:Record<string,unknown>;fulfillment_status:Record<string,unknown>;creation_source:string;created_at:string;updated_at:string;lines:OrderLineRecord[]
}

export interface InvoiceLineRecord{ id:string;invoice_id:string;catalog_item_id:string|null;description:string;quantity:number;unit_price:number;discount_amount:number;tax_amount:number;line_total:number;sort_order:number }
export interface InvoiceRecord{
 id:string;public_reference:string;invoice_number:string;customer_account_id:string;customer_name:string;customer_reference:string|null;family_account_id:string|null;journey_id:string|null;journey_reference:string|null;status:InvoiceStatus;currency_label:string;subtotal:number;discount_total:number;tax_total:number;total_amount:number;paid_amount:number;balance_due:number;due_at:string|null;issued_at:string|null;notes:string|null;billing_details:Record<string,unknown>;metadata:Record<string,unknown>;created_at:string;updated_at:string;lines:InvoiceLineRecord[]
}
export interface ReceiptRecord{ id:string;public_reference:string;receipt_number:string;payment_intent_id:string;invoice_id:string|null;customer_account_id:string|null;amount:number;currency_label:string;payment_method:string|null;provider_reference:string|null;status:string;issued_at:string;metadata:Record<string,unknown> }

export interface PromotionRecord{
 id:string;public_reference:string;promotion_key:string;name:string;description:string|null;code:string|null;promotion_type:'percent'|'fixed'|'wallet_credit'|'free_delivery'|'custom';value:number;minimum_order_amount:number;maximum_discount_amount:number|null;starts_at:string|null;ends_at:string|null;usage_limit:number|null;customer_usage_limit:number|null;automatic:boolean;status:PromotionStatus;priority:number;content:Record<string,unknown>;created_at:string;updated_at:string;targets:Array<{id:string;target_type:string;target_value:string|null}>
}

export interface CustomerSubscriptionRecord{
 id:string;public_reference:string;customer_account_id:string;customer_name:string;customer_reference:string|null;catalog_item_id:string|null;catalog_item_name:string|null;status:SubscriptionStatus;billing_period:string;quantity:number;amount:number;currency_label:string;starts_at:string|null;current_period_starts_at:string|null;current_period_ends_at:string|null;next_billing_at:string|null;renewal_mode:string;cancel_reason:string|null;metadata:Record<string,unknown>;created_at:string;updated_at:string
}

export interface BookingRecord{
 id:string;public_reference:string;journey_type:string;status:BookingStatus;title:string;customer_account_id:string|null;customer_name:string;customer_reference:string|null;catalog_item_id:string|null;catalog_item_name:string|null;scheduled_start_at:string|null;scheduled_end_at:string|null;territory_id:string|null;next_action_label:string|null;customer_context:Record<string,unknown>;fulfillment_status:Record<string,unknown>;financial_status:Record<string,unknown>;created_at:string;updated_at:string
}

export interface EnterpriseControlSnapshot{
 customers:EnterpriseCustomerRef[];catalog:EnterpriseCatalogRef[];orders:EnterpriseOrderRecord[];invoices:InvoiceRecord[];receipts:ReceiptRecord[];promotions:PromotionRecord[];subscriptions:CustomerSubscriptionRecord[];bookings:BookingRecord[]
}
