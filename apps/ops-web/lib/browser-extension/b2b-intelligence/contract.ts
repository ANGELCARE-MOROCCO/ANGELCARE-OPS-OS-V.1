import type { B2BIntelligenceCommandDefinition } from './types'

export const B2B_INTELLIGENCE_COMMANDS: B2BIntelligenceCommandDefinition[] = [
  { commandKey:'b2b.context.resolve', capabilityPermission:'extension.b2b.browser_context_understanding', requiredSubmodule:'account_recognition', adapterKeys:['generic_web','google_maps','angelcare_saas'], mutating:false, acceptanceId:'M2-A01' },
  { commandKey:'b2b.account.recognize', capabilityPermission:'extension.b2b.organization_identity_resolution', requiredSubmodule:'account_recognition', adapterKeys:['generic_web','google_maps','angelcare_saas'], mutating:false, acceptanceId:'M2-A02' },
  { commandKey:'b2b.account.search', capabilityPermission:'extension.b2b.organization_identity_resolution', requiredSubmodule:'account_recognition', mutating:false, acceptanceId:'M2-A02' },
  { commandKey:'b2b.account.match_candidates', capabilityPermission:'extension.b2b.organization_identity_resolution', requiredSubmodule:'account_recognition', mutating:false, acceptanceId:'M2-A03' },
  { commandKey:'b2b.prospect.create', capabilityPermission:'extension.b2b.prospect_capture', requiredSubmodule:'prospects', mutating:true, acceptanceId:'M2-A01' },
  { commandKey:'b2b.prospect.branch_create', capabilityPermission:'extension.b2b.prospect_capture', requiredSubmodule:'accounts', mutating:true, acceptanceId:'M2-A03' },
  { commandKey:'b2b.prospect.merge_request', capabilityPermission:'extension.b2b.prospect_capture', requiredSubmodule:'account_recognition', mutating:true, acceptanceId:'M2-A03' },
  { commandKey:'b2b.prospect.enrich', capabilityPermission:'extension.b2b.account_enrichment', requiredSubmodule:'accounts', mutating:true, acceptanceId:'M2-A07' },
  { commandKey:'b2b.intelligence.vertical.evaluate', capabilityPermission:'extension.b2b.vertical_specific_intelligence', requiredSubmodule:'intelligence', mutating:false, acceptanceId:'M2-A01' },
  { commandKey:'b2b.account.score', capabilityPermission:'extension.b2b.account_scoring', requiredSubmodule:'intelligence', mutating:false, acceptanceId:'M2-A01' },
  { commandKey:'b2b.account_plan.create', capabilityPermission:'extension.b2b.account_plan_builder', requiredSubmodule:'account_plans', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.contact.create', capabilityPermission:'extension.b2b.contact_capture_management', requiredSubmodule:'contacts', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.contact.update', capabilityPermission:'extension.b2b.contact_capture_management', requiredSubmodule:'contacts', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.contact.classify', capabilityPermission:'extension.b2b.contact_capture_management', requiredSubmodule:'decision_makers', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.buying_committee.read', capabilityPermission:'extension.b2b.decision_maker_research', requiredSubmodule:'decision_makers', mutating:false, acceptanceId:'M2-A08' },
  { commandKey:'b2b.buying_committee.update', capabilityPermission:'extension.b2b.decision_maker_research', requiredSubmodule:'decision_makers', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.decision_maker.research', capabilityPermission:'extension.b2b.decision_maker_research', requiredSubmodule:'decision_makers', mutating:true, acceptanceId:'M2-A08' },
  { commandKey:'b2b.evidence.capture', capabilityPermission:'extension.b2b.evidence_audit', requiredSubmodule:'evidence', mutating:true, acceptanceId:'M2-A07' },
  { commandKey:'b2b.territory.inspect', capabilityPermission:'extension.b2b.browser_context_understanding', requiredSubmodule:'territory_sweep', adapterKeys:['google_maps'], mutating:false, acceptanceId:'M2-A09' },
  { commandKey:'b2b.territory.target_capture', capabilityPermission:'extension.b2b.prospect_capture', requiredSubmodule:'territory_sweep', adapterKeys:['google_maps'], mutating:true, acceptanceId:'M2-A09' },
  { commandKey:'b2b.territory.mission_create', capabilityPermission:'extension.b2b.decision_maker_research', requiredSubmodule:'territory_sweep', adapterKeys:['google_maps'], mutating:true, acceptanceId:'M2-A09' },
]

export const B2B_INTELLIGENCE_COMMAND_MAP = new Map(B2B_INTELLIGENCE_COMMANDS.map((row)=>[row.commandKey,row]))
