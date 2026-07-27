import { getAcCapitalFeatureFlags } from "./feature-flags";
import { mapRowsForApi, summarizeRows } from "./mappers";
import { supabaseRestInsert, supabaseRestSelect } from "./supabase";
import type { AcCapitalEnvelope, AcCapitalWorkspaceConfig, AcCapitalWorkspaceKey, AcCapitalWriteResult } from "./types";

const workspaceConfigs: Record<AcCapitalWorkspaceKey, AcCapitalWorkspaceConfig> = {
  "foundation": {
    key: "foundation",
    title: "AC CAPITAL OS Foundation",
    safeWriteTable: "ac_capital_os_system_events",
    groups: [
      { label: "moduleRegistry", table: "ac_capital_os_module_registry" },
      { label: "roles", table: "ac_capital_os_roles" },
      { label: "permissions", table: "ac_capital_os_permissions" },
      { label: "featureFlags", table: "ac_capital_os_feature_flags" },
      { label: "systemEvents", table: "ac_capital_os_system_events" },
    ],
  },
  "executive-cockpit": {
    key: "executive-cockpit",
    title: "Capital Executive Cockpit",
    safeWriteTable: "ac_capital_command_priorities",
    groups: [
      { label: "snapshots", table: "ac_capital_executive_snapshots" },
      { label: "priorities", table: "ac_capital_command_priorities" },
      { label: "deadlineRisks", table: "ac_capital_deadline_risks" },
      { label: "documentBlockers", table: "ac_capital_document_blockers" },
    ],
  },
  "capital-radar": {
    key: "capital-radar",
    title: "Capital Radar",
    safeWriteTable: "ac_capital_radar_opportunities",
    groups: [
      { label: "opportunities", table: "ac_capital_radar_opportunities" },
      { label: "sources", table: "ac_capital_radar_sources" },
      { label: "researchRuns", table: "ac_capital_radar_research_runs" },
      { label: "handoffQueue", table: "ac_capital_radar_handoff_queue" },
      { label: "opportunityTags", table: "ac_capital_radar_opportunity_tags" },
    ],
  },
  "qualification-engine": {
    key: "qualification-engine",
    title: "Qualification Engine",
    safeWriteTable: "ac_capital_qualification_next_actions",
    groups: [
      { label: "dossiers", table: "ac_capital_qualification_dossiers" },
      { label: "scores", table: "ac_capital_qualification_scores" },
      { label: "criteria", table: "ac_capital_qualification_criteria" },
      { label: "missingDocuments", table: "ac_capital_qualification_missing_documents" },
      { label: "risks", table: "ac_capital_qualification_risks" },
      { label: "nextActions", table: "ac_capital_qualification_next_actions" },
      { label: "decisions", table: "ac_capital_qualification_decisions" },
    ],
  },
  "funder-intelligence": {
    key: "funder-intelligence",
    title: "Funder Intelligence Room",
    safeWriteTable: "ac_capital_funder_relationship_events",
    groups: [
      { label: "funders", table: "ac_capital_funders" },
      { label: "contacts", table: "ac_capital_funder_contacts" },
      { label: "psychologyBriefs", table: "ac_capital_funder_psychology_briefs" },
      { label: "objections", table: "ac_capital_funder_objections" },
      { label: "narratives", table: "ac_capital_funder_narratives" },
      { label: "relationshipEvents", table: "ac_capital_funder_relationship_events" },
      { label: "followupActions", table: "ac_capital_funder_followup_actions" },
      { label: "opportunityLinks", table: "ac_capital_funder_opportunity_links" },
    ],
  },
  "capital-doctrine": {
    key: "capital-doctrine",
    title: "Capital Doctrine Vault",
    safeWriteTable: "ac_capital_doctrine_commands",
    groups: [
      { label: "items", table: "ac_capital_doctrine_items" },
      { label: "versions", table: "ac_capital_doctrine_versions" },
      { label: "categories", table: "ac_capital_doctrine_categories" },
      { label: "commands", table: "ac_capital_doctrine_commands" },
      { label: "prompts", table: "ac_capital_doctrine_prompts" },
      { label: "skills", table: "ac_capital_doctrine_skills" },
      { label: "agentBindings", table: "ac_capital_doctrine_agent_bindings" },
      { label: "conflicts", table: "ac_capital_doctrine_conflicts" },
      { label: "monthlyInjections", table: "ac_capital_doctrine_monthly_injections" },
      { label: "applications", table: "ac_capital_doctrine_applications" },
    ],
  },
  "case-builder": {
    key: "case-builder",
    title: "Fundraising Case Builder",
    safeWriteTable: "ac_capital_cases",
    groups: [
      { label: "cases", table: "ac_capital_cases" },
      { label: "stages", table: "ac_capital_case_stages" },
      { label: "documents", table: "ac_capital_case_documents" },
      { label: "narratives", table: "ac_capital_case_narratives" },
      { label: "financialSections", table: "ac_capital_case_financial_sections" },
      { label: "impactSections", table: "ac_capital_case_impact_sections" },
      { label: "riskPlans", table: "ac_capital_case_risk_plans" },
      { label: "outreachScripts", table: "ac_capital_case_outreach_scripts" },
      { label: "coordinatorHandovers", table: "ac_capital_case_coordinator_handovers" },
      { label: "founderApprovals", table: "ac_capital_case_founder_approvals" },
      { label: "proofPacks", table: "ac_capital_case_proof_packs" },
    ],
  },
  "data-room": {
    key: "data-room",
    title: "Due Diligence Data Room",
    safeWriteTable: "ac_capital_data_room_documents",
    groups: [
      { label: "documents", table: "ac_capital_data_room_documents" },
      { label: "categories", table: "ac_capital_data_room_categories" },
      { label: "versions", table: "ac_capital_data_room_versions" },
      { label: "missingEvidence", table: "ac_capital_data_room_missing_evidence" },
      { label: "packageBuilders", table: "ac_capital_data_room_package_builders" },
      { label: "packageItems", table: "ac_capital_data_room_package_items" },
      { label: "caseLinks", table: "ac_capital_data_room_case_links" },
      { label: "readinessScores", table: "ac_capital_data_room_readiness_scores" },
      { label: "submissionArchive", table: "ac_capital_data_room_submission_archive" },
      { label: "credibilityScores", table: "ac_capital_data_room_credibility_scores" },
    ],
  },
  "capital-pipeline": {
    key: "capital-pipeline",
    title: "Capital Pipeline CRM",
    safeWriteTable: "ac_capital_pipeline_followups",
    groups: [
      { label: "records", table: "ac_capital_pipeline_records" },
      { label: "stageEvents", table: "ac_capital_pipeline_stage_events" },
      { label: "followups", table: "ac_capital_pipeline_followups" },
      { label: "tasks", table: "ac_capital_pipeline_tasks" },
      { label: "communications", table: "ac_capital_pipeline_communications" },
      { label: "submissions", table: "ac_capital_pipeline_submissions" },
      { label: "dueDiligenceRequests", table: "ac_capital_pipeline_due_diligence_requests" },
      { label: "negotiations", table: "ac_capital_pipeline_negotiations" },
      { label: "outcomes", table: "ac_capital_pipeline_outcomes" },
      { label: "learningItems", table: "ac_capital_pipeline_learning_items" },
      { label: "calendarEvents", table: "ac_capital_pipeline_calendar_events" },
    ],
  },
  "coordinator-cockpit": {
    key: "coordinator-cockpit",
    title: "Human Coordinator Cockpit",
    safeWriteTable: "ac_capital_coordinator_completion_events",
    groups: [
      { label: "todayActions", table: "ac_capital_coordinator_tasks" },
      { label: "aiPreparedTasks", table: "ac_capital_coordinator_ai_prepared_tasks" },
      { label: "manualEmails", table: "ac_capital_coordinator_manual_emails" },
      { label: "callDesk", table: "ac_capital_coordinator_call_logs" },
      { label: "proofTasks", table: "ac_capital_coordinator_proof_tasks" },
      { label: "founderApprovals", table: "ac_capital_coordinator_founder_approvals" },
      { label: "submissionReadiness", table: "ac_capital_coordinator_submission_readiness" },
      { label: "escalations", table: "ac_capital_coordinator_escalations" },
      { label: "handoverSheets", table: "ac_capital_coordinator_handover_sheets" },
      { label: "safetyWarnings", table: "ac_capital_coordinator_safety_warnings" },
      { label: "completionEvents", table: "ac_capital_coordinator_completion_events" },
    ],
  },
  "ai-command-center": {
    key: "ai-command-center",
    title: "AI Command Center",
    safeWriteTable: "ac_capital_ai_troubleshooting_issues",
    groups: [
      { label: "agents", table: "ac_capital_ai_agents" },
      { label: "agentRuns", table: "ac_capital_ai_agent_runs" },
      { label: "prompts", table: "ac_capital_ai_prompts" },
      { label: "skills", table: "ac_capital_ai_skills" },
      { label: "researchAdapters", table: "ac_capital_ai_research_adapters" },
      { label: "providerSettings", table: "ac_capital_ai_provider_settings" },
      { label: "safetyRules", table: "ac_capital_ai_safety_rules" },
      { label: "troubleshootingIssues", table: "ac_capital_ai_troubleshooting_issues" },
      { label: "confidencePolicies", table: "ac_capital_ai_confidence_policies" },
      { label: "auditEvents", table: "ac_capital_ai_audit_events" },
      { label: "costUsage", table: "ac_capital_ai_cost_usage" },
      { label: "permissions", table: "ac_capital_ai_permissions" },
      { label: "humanApprovalQueue", table: "ac_capital_ai_human_approval_queue" },
      { label: "providerBridge", table: "ac_capital_ai_provider_bridge" },
    ],
  },
  "strategy-production-command": {
    key: "strategy-production-command",
    title: "Strategy Simulator & Production Command",
    safeWriteTable: "ac_capital_production_blockers",
    groups: [
      { label: "strategyScenarios", table: "ac_capital_strategy_scenarios" },
      { label: "scenarioInputs", table: "ac_capital_strategy_scenario_inputs" },
      { label: "scenarioOutputs", table: "ac_capital_strategy_scenario_outputs" },
      { label: "comparisons", table: "ac_capital_strategy_comparisons" },
      { label: "stressTests", table: "ac_capital_strategy_stress_tests" },
      { label: "reports", table: "ac_capital_strategy_reports" },
      { label: "reportSections", table: "ac_capital_strategy_report_sections" },
      { label: "sopManuals", table: "ac_capital_sop_manuals" },
      { label: "sopWorkflowSteps", table: "ac_capital_sop_workflow_steps" },
      { label: "readinessChecks", table: "ac_capital_production_readiness_checks" },
      { label: "wiringMap", table: "ac_capital_seeded_to_live_wiring_map" },
      { label: "launchChecklist", table: "ac_capital_launch_control_checklist" },
      { label: "databaseActivationStatus", table: "ac_capital_database_activation_status" },
      { label: "productionBlockers", table: "ac_capital_production_blockers" },
      { label: "auditEvents", table: "ac_capital_strategy_audit_events" },
    ],
  },
};

function seededWorkspace(key: AcCapitalWorkspaceKey) {
  const config = workspaceConfigs[key];
  return {
    workspace: config.title,
    workspaceKey: key,
    liveWiring: "seeded-fallback",
    warning: "Supabase is not configured or no live rows exist yet. Returning contract fallback.",
    groups: Object.fromEntries(
      config.groups.map((group) => [
        group.label,
        {
          table: group.table,
          rows: [],
          summary: { count: 0, hasData: false, sample: [] },
          status: "empty-or-not-configured",
        },
      ]),
    ),
    productionBoundary: {
      noAutomaticSubmission: true,
      noExposedApiKeys: true,
      noLiveAiByDefault: true,
      requiresFounderApprovalForSensitiveActions: true,
    },
  };
}

export async function loadWorkspaceData(key: AcCapitalWorkspaceKey): Promise<AcCapitalEnvelope<Record<string, unknown>>> {
  const flags = getAcCapitalFeatureFlags();
  const config = workspaceConfigs[key];

  if (flags.forceSeeded) {
    return {
      ok: true,
      dataMode: "seeded-fallback",
      source: "seeded",
      warning: "AC_CAPITAL_FORCE_SEEDED=true",
      data: seededWorkspace(key),
    };
  }

  const groups: Record<string, unknown> = {};
  const warnings: string[] = [];
  let liveRowCount = 0;
  let attemptedSupabase = false;

  for (const group of config.groups) {
    attemptedSupabase = true;
    const result = await supabaseRestSelect(group.table, { limit: group.limit ?? 25 });
    if (!result.ok) warnings.push(result.warning || `Failed to read ${group.table}`);
    if (result.rows.length > 0) liveRowCount += result.rows.length;
    groups[group.label] = {
      table: group.table,
      rows: mapRowsForApi(result.rows),
      summary: summarizeRows(result.rows),
      status: result.ok ? (result.rows.length > 0 ? "supabase-live" : "empty") : "read-failed",
    };
  }

  if (!attemptedSupabase || liveRowCount === 0) {
    return {
      ok: true,
      dataMode: "seeded-fallback",
      source: "seeded",
      warning: warnings[0] || "Supabase tables are empty for this workspace. Returning contract fallback.",
      data: seededWorkspace(key),
    };
  }

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    warning: warnings.length ? warnings.join(" | ") : undefined,
    data: {
      workspace: config.title,
      workspaceKey: key,
      liveWiring: "supabase-live",
      groups,
      rowCount: liveRowCount,
      productionBoundary: {
        noAutomaticSubmission: true,
        noExposedApiKeys: true,
        noLiveAiByDefault: true,
        requiresFounderApprovalForSensitiveActions: true,
      },
    },
  };
}

export async function createWorkspaceRecord(
  key: AcCapitalWorkspaceKey,
  record: Record<string, unknown>,
): Promise<AcCapitalWriteResult> {
  const flags = getAcCapitalFeatureFlags();
  const config = workspaceConfigs[key];

  if (flags.disableWrites) {
    return {
      ok: false,
      dataMode: "disabled",
      source: "none",
      code: "WRITES_DISABLED",
      warning: "AC_CAPITAL_DISABLE_WRITES=true",
    };
  }

  if (!config.safeWriteTable) {
    return {
      ok: false,
      dataMode: "disabled",
      source: "none",
      code: "NO_SAFE_WRITE_TABLE",
      warning: `No safe write table configured for ${key}`,
    };
  }

  const result = await supabaseRestInsert(config.safeWriteTable, record);
  if (!result.ok) {
    return {
      ok: false,
      dataMode: "seeded-fallback",
      source: "seeded",
      warning: result.warning,
      code: "SUPABASE_WRITE_FAILED",
    };
  }

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    record: result.record,
  };
}

export function getWorkspaceConfigs() {
  return workspaceConfigs;
}
