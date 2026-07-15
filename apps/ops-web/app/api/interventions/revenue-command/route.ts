import { NextResponse } from 'next/server'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { buildPhase7InvoiceExposure, buildPhase7MarginProtection, buildPhase7RevenueAssurance, buildPhase7RoleFinanceLocks, PHASE7_CASH_CLOSURE_PROTOCOLS, PHASE7_COMPLIANCE_EXPORTS, PHASE7_FINANCE_GATES } from '@/lib/interventions/phase7-revenue-compliance'

export async function GET() {
  const state = INTERVENTION_SEED_STATE
  return NextResponse.json({
    ok: true,
    live: true,
    module: 'AngelCare Intervention & Dispatch OS',
    phase: 'mega-phase-7-revenue-compliance',
    generatedAt: new Date().toISOString(),
    assurance: buildPhase7RevenueAssurance(state),
    invoiceExposure: buildPhase7InvoiceExposure(state),
    marginProtection: buildPhase7MarginProtection(state),
    roleFinanceLocks: buildPhase7RoleFinanceLocks(state),
    financeGates: PHASE7_FINANCE_GATES,
    cashClosureProtocols: PHASE7_CASH_CLOSURE_PROTOCOLS,
    complianceExports: PHASE7_COMPLIANCE_EXPORTS,
  })
}
