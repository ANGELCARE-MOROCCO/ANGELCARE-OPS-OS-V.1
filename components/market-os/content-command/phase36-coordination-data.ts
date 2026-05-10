import type {
  Phase36AutonomousRecommendation,
  Phase36CoordinationConflict,
  Phase36DecisionRoute,
  Phase36ExecutiveBriefing,
  Phase36ScenarioSimulation,
  Phase36WorkloadRedistribution,
} from './phase36-coordination-types';

export const phase36Recommendations: Phase36AutonomousRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Prioritize Trust Campaign carousel resolution',
    type: 'prioritize_task',
    confidence: 91,
    risk: 'high',
    state: 'proposed',
    rationale: 'The carousel is blocking publishing readiness and increasing campaign delay risk.',
    proposedAction: 'Move carousel review to top priority and assign same-day decision owner.',
  },
  {
    id: 'rec-002',
    title: 'Redistribute design workload',
    type: 'redistribute_workload',
    confidence: 86,
    risk: 'medium',
    state: 'reviewing',
    rationale: 'Design capacity is above healthy threshold while content capacity remains manageable.',
    proposedAction: 'Move two low-complexity visuals from Designer to backup creative owner.',
  },
  {
    id: 'rec-003',
    title: 'Pause incomplete WhatsApp publication',
    type: 'pause_publication',
    confidence: 88,
    risk: 'critical',
    state: 'proposed',
    rationale: 'Compliance checks and translation verification are incomplete.',
    proposedAction: 'Pause publication until approval and translation checks pass.',
  },
  {
    id: 'rec-004',
    title: 'Sequence Core Services before Partnership Push',
    type: 'sequence_campaign',
    confidence: 84,
    risk: 'low',
    state: 'proposed',
    rationale: 'Core Services has stronger readiness and lower blocker count.',
    proposedAction: 'Publish Core Services first while Partnership Push completes executive validation.',
  },
];

export const phase36DecisionRoutes: Phase36DecisionRoute[] = [
  {
    id: 'route-001',
    decision: 'Approve or revise Trust Campaign final visual',
    routedTo: 'Brand Manager',
    reason: 'Brand validation is the main blocker.',
    urgency: 'high',
    requiresHumanApproval: true,
  },
  {
    id: 'route-002',
    decision: 'Confirm campaign publication order',
    routedTo: 'Marketing Director',
    reason: 'Multiple campaigns compete for the same execution window.',
    urgency: 'medium',
    requiresHumanApproval: true,
  },
  {
    id: 'route-003',
    decision: 'Validate AI-generated product sheet claims',
    routedTo: 'Brand Manager',
    reason: 'Sensitive claims require human validation.',
    urgency: 'high',
    requiresHumanApproval: true,
  },
];

export const phase36WorkloadRedistributions: Phase36WorkloadRedistribution[] = [
  {
    id: 'redistribute-001',
    fromOwner: 'Designer',
    toOwner: 'Marketing Ops',
    taskTitle: 'Resize approved social visual variants',
    expectedImpact: 'Reduce design pressure by 12% and protect urgent campaign work.',
    risk: 'low',
  },
  {
    id: 'redistribute-002',
    fromOwner: 'Content Lead',
    toOwner: 'Marketing',
    taskTitle: 'Draft product sheet supporting bullets',
    expectedImpact: 'Accelerate family care sheet completion.',
    risk: 'medium',
  },
];

export const phase36ScenarioSimulations: Phase36ScenarioSimulation[] = [
  {
    id: 'scenario-001',
    scenario: 'If Trust Campaign remains blocked for 24 more hours',
    predictedOutcome: 'Publishing confidence drops and workload pressure moves to Marketing Ops.',
    confidence: 83,
    recommendedMove: 'Escalate blocker and sequence Core Services first.',
  },
  {
    id: 'scenario-002',
    scenario: 'If design workload is redistributed today',
    predictedOutcome: 'Urgent task pressure decreases and review cycle improves.',
    confidence: 79,
    recommendedMove: 'Transfer low-risk resizing tasks immediately.',
  },
  {
    id: 'scenario-003',
    scenario: 'If AI-generated content is approved without claims review',
    predictedOutcome: 'Brand and compliance risk increases.',
    confidence: 87,
    recommendedMove: 'Require brand manager review before publication.',
  },
];

export const phase36CoordinationConflicts: Phase36CoordinationConflict[] = [
  {
    id: 'conflict-001',
    conflict: 'Publishing window conflict between Core Services and Partnership Push',
    affectedArea: 'Publishing',
    severity: 'medium',
    resolutionProposal: 'Sequence Core Services first due to higher readiness.',
  },
  {
    id: 'conflict-002',
    conflict: 'AI output ready before governance validation',
    affectedArea: 'AI + Brand Governance',
    severity: 'high',
    resolutionProposal: 'Lock AI output until brand validation is completed.',
  },
  {
    id: 'conflict-003',
    conflict: 'Creative workload exceeds operational capacity',
    affectedArea: 'Workload',
    severity: 'high',
    resolutionProposal: 'Redistribute low-risk creative tasks and freeze non-critical requests.',
  },
];

export const phase36ExecutiveBriefings: Phase36ExecutiveBriefing[] = [
  {
    id: 'brief-001',
    headline: 'Trust Campaign requires intervention',
    summary: 'Execution pressure is rising due to creative and approval blockers.',
    decisionNeeded: true,
    owner: 'Marketing Director',
  },
  {
    id: 'brief-002',
    headline: 'Core Services is the safest publishing candidate',
    summary: 'High readiness and low operational risk make it ideal for first publication window.',
    decisionNeeded: false,
    owner: 'Marketing Ops',
  },
  {
    id: 'brief-003',
    headline: 'AI content must remain review-gated',
    summary: 'AI-generated product sheet content should not bypass sensitive claims validation.',
    decisionNeeded: true,
    owner: 'Brand Manager',
  },
];