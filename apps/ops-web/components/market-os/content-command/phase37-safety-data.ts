import type {
  Phase37AutonomyBoundary,
  Phase37AutonomyReadiness,
  Phase37HumanGate,
  Phase37RollbackPlan,
  Phase37SafetyCheck,
} from './phase37-safety-types';

export const phase37HumanGates: Phase37HumanGate[] = [
  {
    id: 'gate-publishing',
    gate: 'Publishing approval',
    appliesTo: 'Any AI-recommended publication action',
    requiredRole: 'publisher',
    risk: 'critical',
    mandatory: true,
  },
  {
    id: 'gate-brand',
    gate: 'Brand governance validation',
    appliesTo: 'Brand-sensitive content or visual identity changes',
    requiredRole: 'brand_manager',
    risk: 'high',
    mandatory: true,
  },
  {
    id: 'gate-executive',
    gate: 'Executive escalation decision',
    appliesTo: 'Critical campaign sequence or reputation-risk decisions',
    requiredRole: 'executive',
    risk: 'critical',
    mandatory: true,
  },
  {
    id: 'gate-ai-output',
    gate: 'AI output validation',
    appliesTo: 'Generated copy, translations, claims, product/service sheets',
    requiredRole: 'reviewer',
    risk: 'high',
    mandatory: true,
  },
];

export const phase37AutonomyBoundaries: Phase37AutonomyBoundary[] = [
  {
    id: 'boundary-publication',
    actionType: 'Publish content',
    autonomyLevel: 'human_approved_execution',
    maxAllowedRisk: 'medium',
    notes: 'The system may recommend but must not publish without human approval.',
  },
  {
    id: 'boundary-analytics',
    actionType: 'Generate analytics summary',
    autonomyLevel: 'limited_auto_execution',
    maxAllowedRisk: 'low',
    notes: 'Low-risk analytics summaries may be generated automatically from approved data.',
  },
  {
    id: 'boundary-task-priority',
    actionType: 'Prioritize execution queue',
    autonomyLevel: 'recommend_only',
    maxAllowedRisk: 'medium',
    notes: 'The system may suggest task order but should not reassign owners automatically.',
  },
  {
    id: 'boundary-brand',
    actionType: 'Modify brand rules',
    autonomyLevel: 'blocked',
    maxAllowedRisk: 'low',
    notes: 'Brand rules must not be modified by autonomous coordination.',
  },
];

export const phase37SafetyChecks: Phase37SafetyCheck[] = [
  {
    id: 'check-human-loop',
    title: 'Human approval required for critical actions',
    category: 'permissions',
    passed: true,
    required: true,
    recommendation: 'Keep all critical autonomous recommendations in proposed state.',
  },
  {
    id: 'check-audit',
    title: 'Autonomous recommendations must be auditable',
    category: 'audit',
    passed: true,
    required: true,
    recommendation: 'Log recommendation, reviewer, decision, and final action.',
  },
  {
    id: 'check-ai-claims',
    title: 'AI-generated claims require review',
    category: 'ai',
    passed: false,
    required: true,
    recommendation: 'Add review enforcement before any public content use.',
  },
  {
    id: 'check-publishing',
    title: 'No direct autonomous publishing',
    category: 'publishing',
    passed: true,
    required: true,
    recommendation: 'Keep publishing execution manual or human-approved.',
  },
  {
    id: 'check-brand',
    title: 'Brand governance cannot be bypassed',
    category: 'brand',
    passed: true,
    required: true,
    recommendation: 'Route brand-sensitive outputs to brand manager.',
  },
];

export const phase37RollbackPlans: Phase37RollbackPlan[] = [
  {
    id: 'rollback-publishing',
    scenario: 'Incorrect content enters publishing queue',
    rollbackOwner: 'Marketing Ops',
    steps: ['Pause publication item', 'Notify publisher', 'Return to review state', 'Emit audit event'],
    ready: true,
  },
  {
    id: 'rollback-ai-copy',
    scenario: 'AI-generated copy fails brand validation',
    rollbackOwner: 'Brand Manager',
    steps: ['Reject output', 'Attach revision note', 'Restore previous approved version', 'Send to creator'],
    ready: true,
  },
  {
    id: 'rollback-priority',
    scenario: 'Autonomous priority recommendation disrupts execution queue',
    rollbackOwner: 'Marketing Director',
    steps: ['Restore previous queue order', 'Lock recommendation', 'Review rationale', 'Update coordination rule'],
    ready: false,
  },
];

export const phase37AutonomyReadiness: Phase37AutonomyReadiness[] = [
  {
    label: 'Human-in-loop Controls',
    score: 91,
    risk: 'low',
    blocker: 'Ready as governance model; enforcement requires live role mapping.',
  },
  {
    label: 'Autonomy Boundaries',
    score: 88,
    risk: 'medium',
    blocker: 'Action boundaries are defined; runtime enforcement pending.',
  },
  {
    label: 'Rollback Preparedness',
    score: 82,
    risk: 'medium',
    blocker: 'One rollback plan still needs operational confirmation.',
  },
  {
    label: 'AI Safety Checks',
    score: 76,
    risk: 'high',
    blocker: 'Claims review enforcement still required.',
  },
  {
    label: 'Auditability',
    score: 89,
    risk: 'medium',
    blocker: 'Audit persistence requires backend implementation.',
  },
];