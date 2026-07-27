import type {
  AcCapitalAiPreparedAction,
  AcCapitalCommandMetric,
  AcCapitalCommandPlanItem,
  AcCapitalDeadlineRisk,
  AcCapitalDocumentBlocker,
  AcCapitalHotOpportunity,
} from './types';

export const AC_CAPITAL_EXECUTIVE_COCKPIT_CONTRACT = {
  megaZip: 2,
  name: 'Capital Executive Cockpit',
  status: 'installed',
  route: '/ac-capital-os',
  purpose:
    'Give AngelCare coordinators and founders an impressive capital command dashboard where today’s priorities, AI-prepared actions, deadline risks, case blockers and pipeline signals are visible in under 60 seconds.',
  visualUniverse: 'capital command room',
  humanRole:
    'The human coordinator approves, sends, uploads, confirms, calls, escalates and marks proof. The AI prepares expert work; the human controls execution.',
};

export const capitalCommandMetrics: AcCapitalCommandMetric[] = [
  {
    label: 'Capital Readiness Score',
    value: '82%',
    context: 'Foundation + executive cockpit ready; radar and qualification activate next.',
    trend: '+12 pts after Mega ZIP 02 cockpit activation',
    accent: 'green',
  },
  {
    label: 'Active Capital Routes',
    value: '18',
    context: 'Morocco, Africa/MENA, international grants, banks, VC and accelerators.',
    trend: '7 need qualification once Radar is connected',
    accent: 'blue',
  },
  {
    label: 'AI-Prepared Actions',
    value: '9',
    context: 'Drafted tasks waiting for human review, approval, upload or communication.',
    trend: '3 critical actions due this week',
    accent: 'purple',
  },
  {
    label: 'Deadline Risks',
    value: '4',
    context: 'Urgent opportunities needing documents, founder approval or follow-up.',
    trend: '2 under 14 days',
    accent: 'red',
  },
  {
    label: 'Document Blockers',
    value: '6',
    context: 'Missing, expired or not yet approved proofs preventing submission readiness.',
    trend: 'Data Room will own these in MZ8',
    accent: 'amber',
  },
  {
    label: 'Capital Pipeline Value',
    value: '4.8M Dh',
    context: 'Estimated reachable capital routes being monitored or prepared.',
    trend: 'Conservative visible pipeline only',
    accent: 'navy',
  },
];

export const todayCommandPlan: AcCapitalCommandPlanItem[] = [
  {
    time: '09:15',
    title: 'Review high-fit funding route shortlist',
    owner: 'Capital coordinator',
    priority: 'critical',
    instruction: 'Open the recommended route cards, confirm relevance, then queue eligible opportunities for qualification once MZ4 activates.',
  },
  {
    time: '10:30',
    title: 'Resolve bank-ready document blockers',
    owner: 'Admin / finance support',
    priority: 'high',
    instruction: 'Upload or request missing proofs required for business plan, supplier quotes and founder documentation.',
  },
  {
    time: '12:00',
    title: 'Founder approval sweep',
    owner: 'Founder office',
    priority: 'high',
    instruction: 'Collect approval on ready case narrative, final risk wording and use-of-funds framing before any external sending.',
  },
  {
    time: '15:45',
    title: 'Follow-up on submitted funding conversations',
    owner: 'Coordinator',
    priority: 'medium',
    instruction: 'Prepare follow-up calls and emails with proof of prior submission, next question and requested answer deadline.',
  },
];

export const aiPreparedActions: AcCapitalAiPreparedAction[] = [
  {
    title: 'Approve ILAYKI / bank funding follow-up note',
    opportunity: 'Attijariwafa Bank / Dar Al Mokawil route',
    readiness: 'Draft note ready; awaiting founder review',
    humanAction: 'Review language, confirm attachments, then mark approved.',
    deadline: '48h',
    risk: 'high',
  },
  {
    title: 'Prepare women-founder funding evidence pack',
    opportunity: 'Women-led enterprise programs',
    readiness: 'Checklist ready; missing Pamela profile annex confirmation',
    humanAction: 'Upload final founder profile and proof of active role.',
    deadline: '5 days',
    risk: 'medium',
  },
  {
    title: 'Validate SaaS monetization narrative',
    opportunity: 'VC / SaaS-oriented route',
    readiness: 'Narrative angle prepared from Partner OS doctrine',
    humanAction: 'Founder approval before deck adaptation.',
    deadline: '7 days',
    risk: 'medium',
  },
  {
    title: 'Confirm international grant eligibility assumptions',
    opportunity: 'Childcare / education impact grants',
    readiness: 'AI identified likely fit; source verification pending MZ3 Radar',
    humanAction: 'Hold until Radar source confidence is activated.',
    deadline: 'Monitoring',
    risk: 'low',
  },
];

export const hotOpportunities: AcCapitalHotOpportunity[] = [
  {
    name: 'Women-led business expansion financing',
    route: 'Morocco',
    type: 'Bank / guarantee-backed funding',
    score: 91,
    deadline: 'Active window',
    estimatedValue: '1.5M Dh',
    nextAction: 'Keep bank-ready case package updated and approval-controlled.',
  },
  {
    name: 'Education and childcare social-impact grant',
    route: 'International',
    type: 'Grant / impact funding',
    score: 84,
    deadline: 'Source validation pending',
    estimatedValue: '250k–750k Dh',
    nextAction: 'Validate source and adapt impact narrative.',
  },
  {
    name: 'SaaS-enabled school operations investor route',
    route: 'Africa/MENA',
    type: 'VC / strategic investor',
    score: 79,
    deadline: 'Relationship nurture',
    estimatedValue: 'Seed route',
    nextAction: 'Strengthen Partner OS proof and tenant monetization story.',
  },
  {
    name: 'Academy and workforce upskilling funding',
    route: 'Morocco',
    type: 'Training / employment support',
    score: 76,
    deadline: 'Prepare monitor list',
    estimatedValue: 'Program-based',
    nextAction: 'Build Academy certification and jobs impact proof pack.',
  },
];

export const deadlineRisks: AcCapitalDeadlineRisk[] = [
  { label: 'Bank case annex validation', deadline: '48h', status: 'Founder approval needed', risk: 'high' },
  { label: 'Women-founder evidence pack', deadline: '5 days', status: 'Profile annex missing', risk: 'medium' },
  { label: 'International impact route', deadline: 'Unknown', status: 'Needs source confidence', risk: 'low' },
  { label: 'SaaS investor narrative', deadline: '7 days', status: 'Waiting strategic sign-off', risk: 'medium' },
];

export const documentBlockers: AcCapitalDocumentBlocker[] = [
  { document: 'Founder profile annex - Pamela', neededFor: 'Women-founder and inclusion routes', owner: 'Founder office', status: 'Needs final approved version' },
  { document: 'Partner OS product evidence', neededFor: 'VC/SaaS investor routes', owner: 'Product', status: 'Screenshots and module proof pending' },
  { document: 'SOP / Quality Check 360 summary', neededFor: 'Impact grants and B2B trust packages', owner: 'Quality', status: 'Needs executive summary' },
  { document: 'Supplier quote index', neededFor: 'Bank and funding proof files', owner: 'Finance/admin', status: 'Ready to organize in Data Room' },
  { document: 'Academy certification map', neededFor: 'Training and workforce routes', owner: 'Academy', status: 'Needs latest version' },
  { document: 'International expansion one-pager', neededFor: 'Africa/MENA investor route', owner: 'Strategy', status: 'Draft required' },
];

export const pipelineStageCards = [
  { stage: 'Detected', count: 18, note: 'Awaiting Radar source confidence and qualification queue.' },
  { stage: 'Qualified', count: 6, note: 'High and medium-fit capital routes known from current doctrine.' },
  { stage: 'Preparing', count: 4, note: 'Cases need documents, narrative angle or founder approval.' },
  { stage: 'Ready to Send', count: 2, note: 'Coordinator can execute once attachments and approval are confirmed.' },
  { stage: 'Submitted / Follow-up', count: 3, note: 'Requires structured next-contact cadence.' },
  { stage: 'Learning Injected', count: 1, note: 'Prior feedback added to doctrine and risk language.' },
];

export const capitalReadinessPillars = [
  { label: 'Strategy clarity', score: 88, note: 'AngelCare positioning, founders, SaaS, Academy and impact story are strong.' },
  { label: 'Document readiness', score: 72, note: 'Most files exist; Data Room discipline and expiry control still needed.' },
  { label: 'Opportunity coverage', score: 64, note: 'Manual doctrine is strong; automated Radar begins in MZ3.' },
  { label: 'Coordinator execution', score: 81, note: 'Tasks are visible; dedicated Coordinator Cockpit comes in MZ10.' },
  { label: 'AI governance', score: 58, note: 'Rules are signed; Command Center and troubleshooting come in MZ11.' },
];

export const fundingRouteSplit = [
  { label: 'Morocco bank / guarantee routes', value: 38, accent: 'green' },
  { label: 'Women-founder and inclusion programs', value: 22, accent: 'purple' },
  { label: 'Education / childcare / impact grants', value: 18, accent: 'blue' },
  { label: 'SaaS / VC / strategic investors', value: 14, accent: 'navy' },
  { label: 'Africa-MENA expansion watchlist', value: 8, accent: 'amber' },
] as const;

export function getAcCapitalExecutiveCockpitSnapshot() {
  return {
    metrics: capitalCommandMetrics,
    todayCommandPlan,
    aiPreparedActions,
    hotOpportunities,
    deadlineRisks,
    documentBlockers,
    pipelineStageCards,
    capitalReadinessPillars,
    fundingRouteSplit,
    generatedFor: 'AC CAPITAL OS Mega ZIP 02 - Capital Executive Cockpit',
    humanCoordinatorDoctrine:
      'The coordinator executes approval, communication, upload, proof and follow-up. Expert analysis is prepared by AC CAPITAL OS and remains human-approved before any external action.',
  };
}
