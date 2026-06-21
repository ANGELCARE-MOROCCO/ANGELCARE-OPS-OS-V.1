"use client";

import { getAmbassadorPhase4Snapshot } from "@/lib/market-os/ambassadors/phase4-data";
import { AmbassadorHealthEngine } from "./ambassador-health-engine";
import { CampaignAssignmentOrchestrator } from "./campaign-assignment-orchestrator";
import { ComplianceAndPayoutControl } from "./compliance-and-payout-control";
import { RegionalExecutionMonitor } from "./regional-execution-monitor";

export default function AmbassadorOperationsIntelligenceWorkspace() {
  const snapshot = getAmbassadorPhase4Snapshot();

  return (
    <main data-market-os-root className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-9500">AngelCare Ambassador OS · Phase 4</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Operations Intelligence Command Center
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                A production-oriented control layer for ambassador health, campaign assignment, regional execution,
                compliance escalation and payout risk decisions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-bold text-slate-950">Snapshot</p>
              <p className="text-xs text-slate-9500">{new Date(snapshot.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        </header>

        <AmbassadorHealthEngine records={snapshot.healthRecords} />
        <CampaignAssignmentOrchestrator assignments={snapshot.campaignAssignments} />
        <RegionalExecutionMonitor signals={snapshot.regionalSignals} />
        <ComplianceAndPayoutControl
          escalations={snapshot.complianceEscalations}
          payoutRisks={snapshot.payoutRisks}
        />
      </div>
    </main>
  );
}
