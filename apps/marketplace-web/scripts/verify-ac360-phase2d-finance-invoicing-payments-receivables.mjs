#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase2d_finance_invoicing_payments_receivables.sql',
  'lib/ac360/school-finance.ts',
  'app/api/ac360/school-finance/dashboard/route.ts',
  'app/api/ac360/school-finance/fee-catalog/upsert/route.ts',
  'app/api/ac360/school-finance/billing-cycles/open/route.ts',
  'app/api/ac360/school-finance/invoice-batches/generate/route.ts',
  'app/api/ac360/school-finance/invoices/issue/route.ts',
  'app/api/ac360/school-finance/invoices/mark-overdue/route.ts',
  'app/api/ac360/school-finance/payments/record/route.ts',
  'app/api/ac360/school-finance/payments/allocate/route.ts',
  'app/api/ac360/school-finance/receivables/reconcile/route.ts',
  'app/api/ac360/school-finance/payment-promises/create/route.ts',
  'app/api/ac360/school-finance/adjustments/decide/route.ts',
  'app/api/ac360/school-finance/alerts/resolve/route.ts',
]

const requiredSqlTokens = [
  'ac360_school_fee_catalog',
  'ac360_school_billing_cycles',
  'ac360_school_invoice_batches',
  'ac360_school_payment_allocations',
  'ac360_school_payment_promises',
  'ac360_school_collection_cases',
  'ac360_school_collection_events',
  'ac360_school_finance_adjustments',
  'ac360_school_finance_reconcile_runs',
  'ac360_school_receivable_snapshots',
  'ac360_school_finance_alerts',
  'ac360_school_finance_dashboard',
  'ac360_school_generate_invoice_batch',
  'ac360_school_issue_invoice',
  'ac360_school_record_fee_payment',
  'ac360_school_reconcile_receivables',
  'school.finance.invoice_batch.generate',
  'school.finance.payment.record',
  'school.finance.receivables.reconcile',
  'finance_receivables_runtime',
  'uiBuildAllowed":false',
]

const requiredActionWiring = [
  'ac360.school_finance.fee_catalog.upsert',
  'ac360.school_finance.billing_cycle.open',
  'ac360.school_finance.invoice_batch.generate',
  'ac360.school_finance.invoice.issue',
  'ac360.school_finance.payment.record',
  'ac360.school_finance.payment.allocate',
  'ac360.school_finance.receivables.reconcile',
  'ac360.school_finance.invoice.mark_overdue',
  'ac360.school_finance.payment_promise.create',
  'ac360.school_finance.adjustment.decide',
  'ac360.school_finance.alert.resolve',
]

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

let failed = false
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`❌ Missing required file: ${rel}`)
    failed = true
  }
}

const sql = read('supabase/migrations/20260630_ac360_phase2d_finance_invoicing_payments_receivables.sql')
for (const token of requiredSqlTokens) {
  if (!sql.includes(token)) {
    console.error(`❌ Missing SQL token: ${token}`)
    failed = true
  }
}

const wiring = read('lib/ac360/action-wiring.ts')
for (const token of requiredActionWiring) {
  if (!wiring.includes(token)) {
    console.error(`❌ Missing action wiring token: ${token}`)
    failed = true
  }
}

const financeLib = read('lib/ac360/school-finance.ts')
for (const token of ['runAc360WiredAction', 'resolveAc360SchoolOpsContext', 'phase_2d_finance_invoicing_payments_receivables']) {
  if (!financeLib.includes(token)) {
    console.error(`❌ Missing finance lib token: ${token}`)
    failed = true
  }
}

const appPageHits = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (/app[\/].*angelcare-360[\/].*school-finance.*page\.tsx$/.test(p)) appPageHits.push(p)
  }
}
walk(path.join(root, 'app'))
if (appPageHits.length) {
  console.error('❌ UI page created too early:', appPageHits.join(', '))
  failed = true
}

if (failed) process.exit(1)
console.log('✅ AC360 Phase 2D finance, invoicing, payments & receivables runtime verification passed.')
console.log('✅ UI build remains locked: no school-finance page.tsx created.')
