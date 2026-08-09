import type { B2BIntelligenceCommandDefinition } from '../b2b-intelligence/types'

export const B2B_ULTRA_COMMANDS: B2BIntelligenceCommandDefinition[] = [
  { commandKey: 'b2b.ultra.launchpad.read', capabilityPermission: 'extension.b2b.organization_identity_resolution', requiredSubmodule: 'account_recognition', mutating: false, acceptanceId: 'URC-A01' },
  { commandKey: 'b2b.ultra.context.set', capabilityPermission: 'extension.b2b.browser_context_understanding', requiredSubmodule: 'account_recognition', mutating: true, acceptanceId: 'URC-A02' },
  { commandKey: 'b2b.ultra.context.read', capabilityPermission: 'extension.b2b.browser_context_understanding', requiredSubmodule: 'account_recognition', mutating: false, acceptanceId: 'URC-A02' },
  { commandKey: 'b2b.ultra.journey.read', capabilityPermission: 'extension.b2b.daily_revenue_command', requiredSubmodule: 'activity_timeline', mutating: false, acceptanceId: 'URC-A03' },
  { commandKey: 'b2b.ultra.timeline.read', capabilityPermission: 'extension.b2b.evidence_audit', requiredSubmodule: 'activity_timeline', mutating: false, acceptanceId: 'URC-A04' },
  { commandKey: 'b2b.ultra.data_quality.scan', capabilityPermission: 'extension.b2b.manager_control', requiredSubmodule: 'management_command', mutating: true, acceptanceId: 'URC-A05' },
  { commandKey: 'b2b.ultra.data_quality.resolve', capabilityPermission: 'extension.b2b.manager_control', requiredSubmodule: 'management_command', mutating: true, acceptanceId: 'URC-A05' },
  { commandKey: 'b2b.ultra.bridge.status', capabilityPermission: 'extension.b2b.b2b_reporting', requiredSubmodule: 'executive_reporting', mutating: false, acceptanceId: 'URC-A06' },
  { commandKey: 'b2b.ultra.ai.reason', capabilityPermission: 'extension.b2b.manager_control', requiredSubmodule: 'ai_sales_director', mutating: true, acceptanceId: 'URC-A07' },
  { commandKey: 'b2b.ultra.report.generate', capabilityPermission: 'extension.b2b.b2b_reporting', requiredSubmodule: 'executive_reporting', mutating: true, acceptanceId: 'URC-A08' },
  { commandKey: 'b2b.ultra.partner_operations.read', capabilityPermission: 'extension.b2b.partner_performance', requiredSubmodule: 'partner_performance', mutating: false, acceptanceId: 'URC-A10' },
  { commandKey: 'b2b.ultra.scheduler.status', capabilityPermission: 'extension.b2b.controlled_automation', requiredSubmodule: 'automation_center', mutating: false, acceptanceId: 'URC-A09' },
  { commandKey: 'b2b.ultra.scheduler.enqueue', capabilityPermission: 'extension.b2b.controlled_automation', requiredSubmodule: 'automation_center', mutating: true, acceptanceId: 'URC-A09' },
  { commandKey: 'b2b.ultra.scheduler.control', capabilityPermission: 'extension.b2b.controlled_automation', requiredSubmodule: 'automation_center', mutating: true, acceptanceId: 'URC-A09' },
  { commandKey: 'b2b.ultra.scheduler.tick', capabilityPermission: 'extension.b2b.controlled_automation', requiredSubmodule: 'automation_center', mutating: true, acceptanceId: 'URC-A09' },
]
export const B2B_ULTRA_COMMAND_MAP = new Map(B2B_ULTRA_COMMANDS.map((row) => [row.commandKey, row]))
