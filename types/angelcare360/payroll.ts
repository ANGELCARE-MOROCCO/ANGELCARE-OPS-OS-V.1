import type { Angelcare360UUID } from './database'

export interface Angelcare360PayrollPeriodRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  period_code: string
  label: string
  starts_on: string
  ends_on: string
  status: string
}

export interface Angelcare360PayrollRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  payroll_period_id: Angelcare360UUID
  staff_id: Angelcare360UUID
  payroll_number: string
  gross_amount: number
  deductions_total: number
  bonuses_total: number
  net_amount: number
  status: string
}

