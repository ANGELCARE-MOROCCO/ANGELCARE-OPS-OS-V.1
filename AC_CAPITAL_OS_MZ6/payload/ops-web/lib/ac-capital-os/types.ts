export type AcCapitalOsWorkspaceStatus =
  | 'activated-mz6'
  | 'activated-mz5'
  | 'activated-mz4'
  | 'activated-mz3'
  | 'activated-mz2'
  | 'foundation-ready'
  | 'contracted-next'
  | 'requires-backend-activation'
  | 'requires-ai-activation'
  | 'locked-future-zip';

export type AcCapitalOsRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AcCapitalOsAccent = 'navy' | 'blue' | 'teal' | 'green' | 'amber' | 'red' | 'purple';

export type AcCapitalOsWorkspaceKey =
  | 'executive-cockpit'
  | 'capital-radar'
  | 'qualification-engine'
  | 'funder-intelligence'
  | 'case-builder'
  | 'data-room'
  | 'capital-pipeline'
  | 'coordinator-cockpit'
  | 'doctrine-vault'
  | 'ai-command-center'
  | 'strategy-simulator'
  | 'reports'
  | 'manual-sop'
  | 'settings';

export interface AcCapitalOsWorkspace {
  key: AcCapitalOsWorkspaceKey;
  name: string;
  route: string;
  universe: string;
  mission: string;
  status: AcCapitalOsWorkspaceStatus;
  accent: AcCapitalOsAccent;
  protected: boolean;
  megaZip: number;
  frontEndObligation: string;
  backEndObligation: string;
  backofficeObligation: string;
}

export interface AcCapitalOsFoundationContract {
  moduleName: 'AC CAPITAL OS';
  route: '/ac-capital-os';
  signedBackend: boolean;
  signedFrontEnd: boolean;
  protectedInternalAccess: boolean;
  megaZip: number;
  mission: string;
  visualDoctrine: string;
}

export interface AcCapitalOsAuditEvent {
  id: string;
  module: 'AC CAPITAL OS';
  action: string;
  objectType: string;
  objectId?: string;
  actorId?: string;
  severity: AcCapitalOsRiskLevel;
  message: string;
  createdAt: string;
}

export interface AcCapitalOsRolePermission {
  role: 'founder' | 'capital-admin' | 'coordinator' | 'viewer' | 'ai-system';
  canView: boolean;
  canCreate: boolean;
  canApprove: boolean;
  canExecuteExternalCommunication: boolean;
  canInjectDoctrine: boolean;
  canManageAi: boolean;
}

export interface AcCapitalCommandMetric {
  label: string;
  value: string;
  context: string;
  trend: string;
  accent: AcCapitalOsAccent;
}

export interface AcCapitalCommandPlanItem {
  time: string;
  title: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium';
  instruction: string;
}

export interface AcCapitalAiPreparedAction {
  title: string;
  opportunity: string;
  readiness: string;
  humanAction: string;
  deadline: string;
  risk: AcCapitalOsRiskLevel;
}

export interface AcCapitalHotOpportunity {
  name: string;
  route: 'Morocco' | 'International' | 'Africa/MENA';
  type: string;
  score: number;
  deadline: string;
  estimatedValue: string;
  nextAction: string;
}

export interface AcCapitalDeadlineRisk {
  label: string;
  deadline: string;
  status: string;
  risk: AcCapitalOsRiskLevel;
}

export interface AcCapitalDocumentBlocker {
  document: string;
  neededFor: string;
  owner: string;
  status: string;
}

export type AcCapitalRadarFundingType =
  | 'bank-guarantee'
  | 'grant-impact'
  | 'vc-seed'
  | 'angel-family-office'
  | 'accelerator'
  | 'women-founder'
  | 'saas-innovation'
  | 'education-childcare'
  | 'training-workforce';

export type AcCapitalRadarDeadlineHeat = 'cold' | 'watch' | 'warm' | 'hot' | 'critical' | 'unknown';
export type AcCapitalRadarStatus = 'detected' | 'watchlist' | 'source-review' | 'ready-for-qualification' | 'duplicate' | 'rejected';
export type AcCapitalRadarRegion = 'Morocco' | 'Africa/MENA' | 'International';

export interface AcCapitalRadarOpportunity {
  id: string;
  title: string;
  fundingType: AcCapitalRadarFundingType;
  country: string;
  region: AcCapitalRadarRegion;
  amountRange: string;
  currencyLabel: 'Dh' | 'USD' | 'EUR' | 'Mixed' | 'Unknown';
  deadline: string;
  deadlineHeat: AcCapitalRadarDeadlineHeat;
  sourceName: string;
  sourceUrl: string;
  sourceConfidence: number;
  eligibilityPreview: string;
  angelCareRelevancePreview: string;
  whyCaptured: string;
  detectedKeywords: string[];
  status: AcCapitalRadarStatus;
  handoffStatus: 'not-ready' | 'ready-for-qualification' | 'needs-human-confirmation' | 'blocked-missing-source' | 'blocked-missing-deadline';
  primaryAction: 'Send to Qualification';
  secondaryActions: Array<'Open Source' | 'View Brief' | 'Add to Watchlist' | 'Request Human Review'>;
}

export interface AcCapitalRadarResearchRun {
  id: string;
  label: string;
  adapter: 'Manual Scan' | 'Simulated Gemini-Ready Adapter' | 'Web-Ready Adapter Placeholder';
  mode: 'manual' | 'simulated' | 'gemini-ready' | 'web-ready';
  status: 'completed' | 'requires-human-review' | 'failed' | 'scheduled-placeholder';
  lastRunAt: string;
  opportunitiesDetected: number;
  sourcesCaptured: number;
  failedSources: number;
  humanReviewRequired: number;
}

export interface AcCapitalRadarFilter {
  label: string;
  value: string;
  count: number;
  accent: AcCapitalOsAccent;
}

export interface AcCapitalRadarAdapterStatus {
  name: string;
  mode: 'manual' | 'simulated' | 'gemini-ready' | 'web-ready';
  lastRun: string;
  nextScheduledRun: string;
  failedRuns: number;
  humanReviewRequired: number;
  sourceCaptureHealth: string;
  safetyNote: string;
}

export interface AcCapitalRadarHandoffItem {
  label: string;
  count: number;
  instruction: string;
  accent: AcCapitalOsAccent;
}


export type AcCapitalQualificationStatus =
  | 'new-from-radar'
  | 'scoring-draft'
  | 'needs-human-review'
  | 'qualified-pursue'
  | 'qualified-prepare'
  | 'missing-documents'
  | 'strategic-watchlist'
  | 'rejected'
  | 'escalated-to-founder';

export type AcCapitalQualificationDecision =
  | 'Pursue Immediately'
  | 'Strong — Prepare Package'
  | 'Prepare Missing Documents'
  | 'Strategic Watchlist'
  | 'Low Priority'
  | 'Reject'
  | 'Escalate to Founder'
  | 'Recheck After Doctrine Update';

export type AcCapitalQualificationCriterionKey =
  | 'eligibility-fit'
  | 'sector-fit'
  | 'stage-fit'
  | 'women-cofounder-fit'
  | 'saas-tech-fit'
  | 'childcare-impact-fit'
  | 'morocco-expansion-relevance'
  | 'funding-amount-fit'
  | 'deadline-feasibility'
  | 'documentation-readiness'
  | 'strategic-value'
  | 'probability-of-success'
  | 'effort-required'
  | 'risk-impact'
  | 'relationship-value';

export type AcCapitalEvidenceStatus = 'confirmed' | 'likely' | 'unclear' | 'missing' | 'blocking' | 'human-verification-required';

export interface AcCapitalQualificationCriterionScore {
  criterionKey: AcCapitalQualificationCriterionKey;
  label: string;
  purpose: string;
  weight: number;
  score: number;
  weightedScore: number;
  explanation: string;
  evidenceStatus: AcCapitalEvidenceStatus;
  missingEvidence: string;
  riskNote: string;
  aiConfidence: number;
}

export interface AcCapitalQualificationRisk {
  riskType: string;
  severity: AcCapitalOsRiskLevel;
  description: string;
  mitigation: string;
  owner: string;
  founderReviewRequired: boolean;
}

export interface AcCapitalQualificationMissingDocument {
  documentName: string;
  category: string;
  status: 'Ready' | 'Needs Update' | 'Missing' | 'Not Required' | 'Human Confirmation Required' | 'Later ZIP Required';
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiredForSubmission: boolean;
  owner: string;
  dueDate: string;
}

export interface AcCapitalQualificationNextAction {
  label: string;
  why: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline: string;
  expectedOutput: string;
  relatedWorkspace: AcCapitalOsWorkspaceKey;
}

export interface AcCapitalQualificationDossier {
  id: string;
  radarOpportunityId: string;
  title: string;
  source: string;
  country: string;
  region: AcCapitalRadarRegion;
  opportunityType: AcCapitalRadarFundingType;
  deadline: string;
  deadlineRisk: AcCapitalOsRiskLevel;
  sourceConfidence: number;
  totalScore: number;
  decisionLabel: AcCapitalQualificationDecision;
  aiConfidence: number;
  status: AcCapitalQualificationStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  documentationReadiness: number;
  founderReviewRequired: boolean;
  recommendedOwner: string;
  nextAction: string;
  executiveSummary: string;
  eligibilitySummary: string;
  angelCareMatchSummary: string;
  strategicException?: string;
  criteria: AcCapitalQualificationCriterionScore[];
  risks: AcCapitalQualificationRisk[];
  missingDocuments: AcCapitalQualificationMissingDocument[];
  nextActions: AcCapitalQualificationNextAction[];
}

export interface AcCapitalQualificationQueueItem {
  id: string;
  title: string;
  source: string;
  country: string;
  region: AcCapitalRadarRegion;
  fundingType: AcCapitalRadarFundingType;
  deadline: string;
  radarSourceConfidence: number;
  currentQualificationStatus: AcCapitalQualificationStatus;
  preliminaryFitScore: number;
  deadlineHeat: AcCapitalRadarDeadlineHeat;
  missingInformationCount: number;
  assignedReviewer: string;
  recommendedAction: AcCapitalQualificationDecision;
}

export interface AcCapitalQualificationBoardColumn {
  status: AcCapitalQualificationStatus;
  label: string;
  count: number;
  description: string;
  accent: AcCapitalOsAccent;
}


export type AcCapitalFunderType =
  | 'Bank'
  | 'Guarantee-backed financing program'
  | 'Public funding program'
  | 'Grant'
  | 'VC'
  | 'Angel investor'
  | 'Family office'
  | 'Accelerator'
  | 'Development institution'
  | 'Corporate CSR fund'
  | 'Education fund'
  | 'Social impact fund'
  | 'Women-founder program'
  | 'SaaS / technology fund'
  | 'Strategic corporate partner'
  | 'Diaspora investor'
  | 'Public-private partnership route';

export type AcCapitalFunderRelationshipStatus =
  | 'Not Contacted'
  | 'Researching'
  | 'Warm Lead'
  | 'First Contact Sent'
  | 'Follow-Up Due'
  | 'Meeting Planned'
  | 'Requested Documents'
  | 'Due Diligence'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Nurture Later'
  | 'Strategic Watchlist'
  | 'Rejected';

export type AcCapitalRelationshipTemperature =
  | 'Cold'
  | 'Warm'
  | 'Active'
  | 'In Review'
  | 'High Potential'
  | 'Stalled'
  | 'Closed Won'
  | 'Closed Lost'
  | 'Nurture Later';

export type AcCapitalFunderFitLabel = 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Strategic Long-Term' | 'Not Relevant';

export interface AcCapitalFunderProfile {
  id: string;
  name: string;
  funderType: AcCapitalFunderType;
  country: string;
  region: 'Morocco' | 'Africa / MENA' | 'Europe' | 'North America' | 'Global';
  ticketRange: string;
  fundingStageFocus: string;
  sectorFocus: string[];
  websiteUrl: string;
  sourceConfidence: number;
  angelCareFitScore: number;
  fitLabel: AcCapitalFunderFitLabel;
  relationshipStatus: AcCapitalFunderRelationshipStatus;
  relationshipTemperature: AcCapitalRelationshipTemperature;
  strategicPriority: 'critical' | 'high' | 'medium' | 'low';
  recommendedNarrative: string;
  owner: string;
  lastContact: string;
  nextAction: string;
  nextActionDueDate: string;
  linkedOpportunities: string[];
  likelyObjectionCount: number;
  proofRequiredCount: number;
  founderLevelApproach: boolean;
  summary: string;
}

export interface AcCapitalFunderContact {
  funderId: string;
  contactName: string;
  roleTitle: string;
  email: string;
  phone: string;
  preferredLanguage: 'FR' | 'EN' | 'AR';
  communicationStyle: string;
  relationshipStatus: AcCapitalFunderRelationshipStatus;
  lastContactAt: string;
  nextContactAt: string;
}

export interface AcCapitalFunderPsychologyBrief {
  funderId: string;
  decisionStyle: string;
  likelyPriorities: string[];
  likelyConcerns: string[];
  proofRequired: string[];
  languageToUse: string[];
  languageToAvoid: string[];
  founderLevelRequired: boolean;
}

export interface AcCapitalFunderLikelyObjection {
  funderId: string;
  objectionTitle: string;
  severity: AcCapitalOsRiskLevel;
  whyItMayHappen: string;
  bestAnswer: string;
  requiredProof: string;
  owner: string;
  relatedDocument: string;
  founderReviewRequired: boolean;
}

export interface AcCapitalFunderNarrativeRecommendation {
  funderId: string;
  narrativeType: string;
  recommendedAngle: string;
  openingMessage: string;
  proofToEmphasize: string[];
  numbersToMentionCarefully: string[];
  risksToAvoidOverclaiming: string[];
  documentsToAttach: string[];
  idealNextAction: string;
}

export interface AcCapitalFunderRelationshipEvent {
  funderId: string;
  eventDate: string;
  eventType: 'discovered' | 'email' | 'call' | 'meeting' | 'document-request' | 'follow-up' | 'note';
  title: string;
  summary: string;
  owner: string;
}

export interface AcCapitalFunderOpportunityLink {
  funderId: string;
  opportunityTitle: string;
  radarOrigin: string;
  qualificationDecision: AcCapitalQualificationDecision;
  fitScore: number;
  status: string;
  nextAction: string;
}

export interface AcCapitalFunderFollowUpAction {
  funderId: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: string;
  owner: string;
  actionType: 'research' | 'email-prep' | 'call-prep' | 'meeting-prep' | 'document-pack' | 'founder-approach' | 'nurture';
  instruction: string;
}

export interface AcCapitalFunderStrategicSegment {
  label: string;
  count: number;
  description: string;
  accent: AcCapitalOsAccent;
}


export type AcCapitalDoctrineStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Active'
  | 'Active — Founder Approved'
  | 'Deprecated'
  | 'Replaced'
  | 'Conflicting'
  | 'Needs Founder Approval'
  | 'Needs Data Update'
  | 'Archived';

export type AcCapitalDoctrinePriority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Experimental' | 'Watchlist';

export type AcCapitalDoctrineInjectionMode =
  | 'Manual'
  | 'Monthly AI'
  | 'Founder Instruction'
  | 'Coordinator Note'
  | 'Market Learning'
  | 'Funder Feedback'
  | 'Lost Opportunity Learning'
  | 'Won Opportunity Learning'
  | 'Imported Prompt'
  | 'Imported Skill';

export interface AcCapitalDoctrineItem {
  id: string;
  title: string;
  category: string;
  doctrineType: string;
  doctrineText: string;
  status: AcCapitalDoctrineStatus;
  priority: AcCapitalDoctrinePriority;
  source: string;
  injectionMode: AcCapitalDoctrineInjectionMode;
  injectedBy: string;
  approvalStatus: string;
  founderApprovalRequired: boolean;
  appliesToWorkspaces: string[];
  appliesToAgents: string[];
  activeFrom: string;
  validUntil: string;
  version: string;
  replacesDoctrineId?: string;
  conflictSensitivity: 'low' | 'medium' | 'high' | 'critical';
  lastUsedAt: string;
  summary: string;
}

export interface AcCapitalDoctrineCommand {
  id: string;
  commandTitle: string;
  commandText: string;
  targetWorkspace: string;
  targetAgent: string;
  priority: AcCapitalDoctrinePriority;
  status: 'Active' | 'Draft' | 'Testing' | 'Deprecated' | 'Replaced' | 'Requires Approval';
  approvalRequired: boolean;
  activeFrom: string;
  validUntil: string;
}

export interface AcCapitalDoctrinePrompt {
  id: string;
  promptName: string;
  purpose: string;
  targetAgent: string;
  targetWorkspace: string;
  inputRequirements: string;
  outputRequirements: string;
  riskLevel: AcCapitalOsRiskLevel;
  approvalRequired: boolean;
  version: string;
  status: string;
}

export interface AcCapitalDoctrineSkill {
  id: string;
  skillName: string;
  skillCategory: string;
  applicableAgents: string[];
  applicableWorkspaces: string[];
  skillDescription: string;
  inputExpectations: string;
  outputStandards: string;
  cautionRules: string;
  version: string;
  status: string;
}

export interface AcCapitalDoctrineConflict {
  id: string;
  conflictTitle: string;
  doctrineA: string;
  doctrineB: string;
  severity: AcCapitalOsRiskLevel;
  affectedWorkspaces: string[];
  recommendedResolution: string;
  founderReviewRequired: boolean;
  status: string;
}

export interface AcCapitalDoctrineApplication {
  workspace: string;
  activeDoctrineCount: number;
  criticalDoctrineCount: number;
  lastAppliedDate: string;
  conflicts: number;
  missingDoctrine: string;
  nextReview: string;
  owner: string;
}

export interface AcCapitalDoctrineAgentBinding {
  agentName: string;
  activeDoctrineCount: number;
  activePromptCount: number;
  activeSkillCount: number;
  lastDoctrineUpdate: string;
  doctrineConflicts: number;
  allowedOutputTypes: string[];
  forbiddenBehaviors: string[];
  humanApprovalRequirement: string;
  confidencePolicy: string;
}

export interface AcCapitalDoctrineMonthlyInjection {
  month: string;
  title: string;
  generatedDoctrineItems: number;
  aiConfidence: number;
  sourcesRequired: boolean;
  reviewStatus: 'Generated' | 'Under Review' | 'Accepted' | 'Partially Accepted' | 'Rejected' | 'Needs Founder Approval' | 'Applied to Active Cases' | 'Archived';
  suggestedChanges: string[];
  affectedWorkspaces: string[];
}

export interface AcCapitalDoctrineAuditEvent {
  id: string;
  eventType: string;
  actor: string;
  doctrineTitle: string;
  summary: string;
  createdAt: string;
}
