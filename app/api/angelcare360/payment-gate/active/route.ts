import { NextResponse } from 'next/server'
import { getActiveCustomerPaymentGate } from '@/lib/angelcare360/payment-gates/customer-gate'

export const runtime = 'nodejs'

export async function GET() {
  const gate = await getActiveCustomerPaymentGate()
  return NextResponse.json({ ok: true, gate: gate || null })
}
