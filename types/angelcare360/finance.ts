import type { Angelcare360UUID } from './database'

export interface Angelcare360FeeStructureRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  fee_code: string
  label: string
  currency: string
  status: string
}

export interface Angelcare360InvoiceRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance_due: number
  status: string
}

export interface Angelcare360PaymentRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  invoice_id: Angelcare360UUID
  payment_number: string
  amount: number
  method: string
  status: string
}

