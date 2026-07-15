import type {
  Phase35CampaignForecast,
  Phase35ExecutiveDigestItem,
  Phase35ExecutiveInsight,
  Phase35IntelligenceScore,
  Phase35OperationalAnomaly,
  Phase35WorkloadForecast,
} from './phase35-intelligence-types';

export const phase35ExecutiveInsights: Phase35ExecutiveInsight[] = [
  {
    id: 'insight-001',
    title: 'Trust Campaign execution pressure is rising',
    area: 'campaign',
    severity: 'high',
    confidence: 88,
    summary: 'Multiple blockers and delayed approvals are compressing the publishing window.',
    recommendation: 'Escalate blocked carousel and force same-day review decision.',
  },
  {
    id: 'insight-002',
    title: 'Designer workload is approaching unhealthy capacity',
    area: 'workload',
    severity: 'high',
    confidence: 84,
    summary: 'Creative workload is concentrated around one operator with multiple urgent items.',
    recommendation: 'Reassign low-priority visuals or delay non-critical creative tasks.',
  },
  {
    id: 'insight-003',
    title: 'Core Services campaign is publication-ready',
    area: 'publishing',
    severity: 'low',
    confidence: 92,
    summary: 'Readiness, approvals, and brand checks are strong enough for controlled publication.',
    recommendation: 'Move Core Services into final publishing handoff.',
  },
  {
    id: 'insight-004',
    title: 'AI outputs need sensitive-claims review',
    area: 'ai',
    severity: 'medium',
    confidence: 79,
    summary: 'AI-generated service content may need additional review before public use.',
    recommendation: 'Route AI outputs through brand and claims validation before approval.',
  },
];

export const phase35CampaignForecasts: Phase35CampaignForecast[] = [
  {
    id: 'forecast-core',
    campaign: 'Core Services',
    deliveryProbability: 91,
    riskLevel: 'low',
    forecastDirection: 'improving',
    predictedBlocker: 'Minor final handoff delay possible.',
    recommendedMove: 'Proceed with publishing window.',
  },
  {
    id: 'forecast-trust',
    campaign: 'Trust Campaign',
    deliveryProbability: 58,
    riskLevel: 'high',
    forecastDirection: 'declining',
    predictedBlocker: 'Creative and brand validation bottleneck.',
    recommendedMove: 'Escalate approval and reassign copy dependency.',
  },
  {
    id: 'forecast-partnership',
    campaign: 'Partnership Push',
    deliveryProbability: 64,
    riskLevel: 'medium',
    forecastDirection: 'volatile',
    predictedBlocker: 'Executive validation uncertainty.',
    recommendedMove: 'Add executive decision item and freeze final message.',
  },
];

export const phase35WorkloadForecasts: Phase35WorkloadForecast[] = [
  {
    id: 'workload-design',
    team: 'Design',
    pressureScore: 94,
    forecastDirection: 'declining',
    predictedRisk: 'Creative queue may delay social publishing.',
    recommendedAction: 'Redistribute design requests and freeze new non-critical tasks.',
  },
  {
    id: 'workload-content',
    team: 'Content',
    pressureScore: 76,
    forecastDirection: 'stable',
    predictedRisk: 'Review load manageable but deadline pressure remains.',
    recommendedAction: 'Prioritize campaign copy over internal descriptions.',
  },
  {
    id: 'workload-ops',
    team: 'Marketing Ops',
    pressureScore: 82,
    forecastDirection: 'volatile',
    predictedRisk: 'Publishing handoff may stack if approvals arrive at once.',
    recommendedAction: 'Prepare publishing slots before approvals land.',
  },
];

export const phase35OperationalAnomalies: Phase35OperationalAnomaly[] = [
  {
    id: 'anomaly-001',
    title: 'Approval cycle unusually slow',
    detectedIn: 'Approvals',
    severity: 'high',
    signal: 'Review cycle exceeds normal SLA by more than 40%.',
    response: 'Escalate to Marketing Director and assign backup reviewer.',
  },
  {
    id: 'anomaly-002',
    title: 'Brand template inconsistency detected',
    detectedIn: 'Brand Governance',
    severity: 'medium',
    signal: 'One outdated flyer template is still present in active work.',
    response: 'Archive outdated template and replace with approved version.',
  },
  {
    id: 'anomaly-003',
    title: 'Publishing queue dependency conflict',
    detectedIn: 'Publishing',
    severity: 'medium',
    signal: 'One scheduled item has incomplete compliance checks.',
    response: 'Pause publication until compliance checklist is complete.',
  },
];

export const phase35ExecutiveDigest: Phase35ExecutiveDigestItem[] = [
  {
    id: 'digest-001',
    headline: 'Trust Campaign needs immediate intervention.',
    priority: 'high',
    decisionRequired: true,
    owner: 'Marketing Director',
  },
  {
    id: 'digest-002',
    headline: 'Core Services can move to publishing handoff.',
    priority: 'low',
    decisionRequired: false,
    owner: 'Marketing Ops',
  },
  {
    id: 'digest-003',
    headline: 'Design workload requires rebalancing today.',
    priority: 'high',
    decisionRequired: true,
    owner: 'Marketing Director',
  },
  {
    id: 'digest-004',
    headline: 'AI-generated content needs claims validation before use.',
    priority: 'medium',
    decisionRequired: false,
    owner: 'Brand Manager',
  },
];

export const phase35IntelligenceScores: Phase35IntelligenceScore[] = [
  {
    label: 'Operational Confidence',
    score: 82,
    direction: 'stable',
    note: 'Execution is credible but blocker pressure remains.',
  },
  {
    label: 'Campaign Delivery Probability',
    score: 71,
    direction: 'volatile',
    note: 'Core Services is strong; Trust Campaign is pulling average down.',
  },
  {
    label: 'Publication Readiness',
    score: 78,
    direction: 'improving',
    note: 'Publication flow is ready if compliance checks are enforced.',
  },
  {
    label: 'Workload Stability',
    score: 68,
    direction: 'declining',
    note: 'Design load is the main operational risk.',
  },
  {
    label: 'Governance Safety',
    score: 86,
    direction: 'stable',
    note: 'Governance structure is strong but live enforcement is pending.',
  },
];