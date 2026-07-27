import type { AcCapitalOsAccent, AcCapitalOsRiskLevel } from './types';

export const AC_CAPITAL_CASE_BUILDER_CONTRACT = {
  module: 'AC CAPITAL OS',
  megaZip: 7,
  token: 'MZ7_AC_CAPITAL_OS_FUNDRAISING_CASE_BUILDER',
  workspace: 'Fundraising Case Builder',
  subtitle: 'Opportunity-to-Package Capital Dossier Factory',
  safetyBoundary:
    'MZ7 prepares structured case packages, seeded drafts, document maps, approval gates and coordinator handovers. It does not send emails, submit applications, generate live PDFs or call external AI providers automatically.',
} as const;

export type CasePackageType =
  | 'Bank Package'
  | 'VC Package'
  | 'Grant Package'
  | 'Impact Package'
  | 'Women-Founder Package'
  | 'SaaS/Tech Package'
  | 'International Expansion Package'
  | 'Strategic Partner Package'
  | 'Blended Finance Package'
  | 'Custom Funding Package';

export type CaseStatus =
  | 'New from Qualification'
  | 'Strategy Draft'
  | 'Doctrine Alignment'
  | 'Document Mapping'
  | 'Financial Section'
  | 'Risk & Objections'
  | 'Draft Package Ready'
  | 'Founder Review Required'
  | 'Coordinator Execution Ready'
  | 'Submitted to Pipeline'
  | 'Blocked'
  | 'Archived';

export interface CaseBuilderCase {
  id: string;
  title: string;
  opportunity: string;
  funder: string;
  fundingType: string;
  packageType: CasePackageType;
  amountRange: string;
  deadline: string;
  qualificationScore: number;
  funderFit: number;
  doctrineAlignmentScore: number;
  documentReadinessScore: number;
  financialReadinessScore: number;
  riskReadinessScore: number;
  totalReadinessScore: number;
  founderApprovalRequired: boolean;
  coordinatorHandoverStatus: string;
  status: CaseStatus;
  priority: 'Critical' | 'High' | 'Medium' | 'Strategic Watchlist';
  owner: string;
  nextAction: string;
}

export interface CaseBuilderStage {
  label: string;
  status: 'Not Started' | 'AI Draft Ready' | 'Needs Data' | 'Needs Human Verification' | 'Needs Founder Approval' | 'Approved' | 'Final' | 'Blocked' | 'Rejected / Rework';
  readiness: number;
  owner: string;
  blockers: string;
  aiConfidence: number;
  founderApprovalRequired: boolean;
  action: string;
}

export interface CaseBuilderDocument {
  name: string;
  category: string;
  required: boolean;
  status: 'Ready' | 'Needs Update' | 'Missing' | 'Not Required' | 'Needs Founder Approval' | 'Needs Signature/Stamp' | 'Needs External Supplier' | 'Needs Data Room Upload' | 'Later ZIP/Data Room Required';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  sourceWorkspace: string;
  deadline: string;
  notes: string;
}

export interface CaseBuilderNarrative {
  type: string;
  headline: string;
  opening: string;
  proofToEmphasize: string;
  avoid: string;
  annexes: string;
  tone: string;
  founderReviewRequired: boolean;
  riskFlag: string;
}

export interface CaseBuilderPositioningBlock {
  label: string;
  recommendedEmphasis: string;
  tone: string;
  riskNote: string;
  proofNeeded: string;
  sourceDoctrine: string;
  included: boolean;
}

export interface CaseBuilderFinancialSection {
  label: string;
  value: string;
  status: 'AI Draft Ready' | 'Needs Updated Numbers' | 'Needs Founder Approval' | 'Needs Finance Review' | 'Ready for Package' | 'Blocked';
  explanation: string;
  owner: string;
}

export interface CaseBuilderRiskPlan {
  riskType: string;
  severity: AcCapitalOsRiskLevel;
  likelihood: 'Low' | 'Medium' | 'High';
  whyItMatters: string;
  mitigation: string;
  planB: string;
  planC: string;
  planD: string;
  owner: string;
  founderReviewRequired: boolean;
  status: string;
}

export interface CaseBuilderImpactSection {
  category: string;
  statement: string;
  measurableIndicator: string;
  proofNeeded: string;
  overclaimRisk: string;
  recommendedWording: string;
  relevantFundingType: string;
}

export interface CaseBuilderOutreachScript {
  type: string;
  recipientType: string;
  subject: string;
  bodyPreview: string;
  tone: string;
  attachmentsSuggested: string[];
  approvalRequired: boolean;
  riskNotes: string;
  coordinatorInstruction: string;
}

export interface CaseBuilderProofPackItem {
  proofType: string;
  available: boolean;
  credibilityLevel: 'High' | 'Medium' | 'Needs Update' | 'Later ZIP Required';
  source: string;
  lastUpdated: string;
  reusable: boolean;
  requiredForCase: boolean;
  owner: string;
  attachToPackage: boolean;
}

export interface CaseBuilderFounderApproval {
  item: string;
  status: 'Not Required' | 'Required' | 'Pending Founder Review' | 'Approved' | 'Rejected' | 'Rework Requested';
  reason: string;
  approver: 'Aissaoui Ilyass' | 'Pamela Jacosalem Pacumba' | 'Both Founders' | 'Finance / Admin Review';
  dueDate: string;
  comment: string;
}

export interface CaseBuilderCoordinatorHandover {
  block: string;
  instruction: string;
  owner: string;
  deadline: string;
  proofAfterAction: string;
  escalationCondition: string;
}

export const caseBuilderCases: CaseBuilderCase[] = [
  {
    id: 'case-ilayki-bank-2027',
    title: 'ILAYKI / TAMWILCOM bank-ready financing package',
    opportunity: 'Women-led guarantee-backed financing route for AngelCare SARL launch',
    funder: 'Attijariwafa Bank · Dar Al Mokawil Rabat / TAMWILCOM-linked route',
    fundingType: 'Bank / guarantee-backed financing',
    packageType: 'Bank Package',
    amountRange: '1 500 000 Dh requested envelope',
    deadline: 'Founder-controlled submission window',
    qualificationScore: 92,
    funderFit: 90,
    doctrineAlignmentScore: 96,
    documentReadinessScore: 78,
    financialReadinessScore: 82,
    riskReadinessScore: 86,
    totalReadinessScore: 84,
    founderApprovalRequired: true,
    coordinatorHandoverStatus: 'Documents and final attachments still need human confirmation',
    status: 'Founder Review Required',
    priority: 'Critical',
    owner: 'Capital Coordinator + Founder Review',
    nextAction: 'Review Required Documents Map, update financial annexes, prepare Founder Approval panel and coordinator handover.',
  },
  {
    id: 'case-impact-grant-kids360',
    title: 'Kids 360 impact and child-quality modernization grant package',
    opportunity: 'Education, child development, women/co-led and workforce professionalization grant route',
    funder: 'Impact / development institution watchlist route',
    fundingType: 'Grant / impact funding',
    packageType: 'Grant Package',
    amountRange: 'Amount to confirm per call',
    deadline: 'Monitor monthly doctrine injection',
    qualificationScore: 81,
    funderFit: 78,
    doctrineAlignmentScore: 91,
    documentReadinessScore: 66,
    financialReadinessScore: 70,
    riskReadinessScore: 74,
    totalReadinessScore: 73,
    founderApprovalRequired: false,
    coordinatorHandoverStatus: 'Prepare missing impact proof and Academy/SOP annexes',
    status: 'Document Mapping',
    priority: 'High',
    owner: 'Capital Coordinator',
    nextAction: 'Map Academy, Quality Check 360 and caregiver professionalization proofs before application drafting.',
  },
  {
    id: 'case-partner-os-seed',
    title: 'Partner OS SaaS / marketplace seed narrative package',
    opportunity: 'SaaS, marketplace and private-establishment digitalization investor route',
    funder: 'Seed VC / angel relationship watchlist',
    fundingType: 'VC / angel / SaaS investment',
    packageType: 'VC Package',
    amountRange: 'Ticket range to be validated after relationship-first outreach',
    deadline: 'Relationship-first, no immediate submission',
    qualificationScore: 74,
    funderFit: 76,
    doctrineAlignmentScore: 88,
    documentReadinessScore: 58,
    financialReadinessScore: 61,
    riskReadinessScore: 64,
    totalReadinessScore: 67,
    founderApprovalRequired: true,
    coordinatorHandoverStatus: 'Strategic watchlist; founder-level narrative required before outreach',
    status: 'Strategy Draft',
    priority: 'Strategic Watchlist',
    owner: 'Founder / Capital Strategy',
    nextAction: 'Prepare relationship-first VC narrative without overclaiming traction or immediate international scale.',
  },
];

export const caseBuilderStages: CaseBuilderStage[] = [
  { label: 'Opportunity Brief', status: 'AI Draft Ready', readiness: 88, owner: 'AC Capital Executive Brain', blockers: 'Needs final source attachment after Data Room ZIP.', aiConfidence: 87, founderApprovalRequired: false, action: 'Review brief and confirm source context.' },
  { label: 'Pursuit Strategy', status: 'Needs Founder Approval', readiness: 76, owner: 'Founder / Capital Strategy', blockers: 'Bank package tone and funding amount must remain founder-approved.', aiConfidence: 84, founderApprovalRequired: true, action: 'Approve strategic route or request rework.' },
  { label: 'Funder Narrative', status: 'AI Draft Ready', readiness: 82, owner: 'Funder Intelligence Agent', blockers: 'Final recipient context must be verified by coordinator.', aiConfidence: 81, founderApprovalRequired: false, action: 'Select Bank / VC / Grant / Impact narrative mode.' },
  { label: 'Required Documents', status: 'Needs Human Verification', readiness: 72, owner: 'Capital Coordinator', blockers: 'RC, legal documents and proof pack status require upload validation.', aiConfidence: 79, founderApprovalRequired: false, action: 'Mark each document Ready, Missing or Needs Update.' },
  { label: 'Financial Section', status: 'Needs Finance Review', readiness: 70, owner: 'Finance / Admin Review', blockers: 'Financial values must use Dh in Moroccan bank-facing context and remain conservative.', aiConfidence: 77, founderApprovalRequired: true, action: 'Review requested amount, BFR, treasury reserve and scenarios.' },
  { label: 'Risk Plan', status: 'AI Draft Ready', readiness: 86, owner: 'Legal/Compliance + Strategy Agent', blockers: 'Founder must validate sensitive risk mitigation language.', aiConfidence: 83, founderApprovalRequired: true, action: 'Approve risk language before final package.' },
  { label: 'Outreach Scripts', status: 'AI Draft Ready', readiness: 80, owner: 'Document Factory Agent', blockers: 'No automatic sending; coordinator must approve and send manually.', aiConfidence: 82, founderApprovalRequired: false, action: 'Review subject, body, attachments and follow-up date.' },
  { label: 'Coordinator Handover', status: 'Needs Data', readiness: 68, owner: 'Coordinator Agent', blockers: 'Depends on final document map and founder approval.', aiConfidence: 75, founderApprovalRequired: false, action: 'Generate execution sheet after documents are marked.' },
];

export const caseBuilderDocuments: CaseBuilderDocument[] = [
  { name: 'Business plan adapted to funding route', category: 'Business plan', required: true, status: 'Needs Update', priority: 'Critical', owner: 'Capital Coordinator', sourceWorkspace: 'Fundraising Case Builder', deadline: 'Before founder approval', notes: 'Must use bank-safe, VC-scale or grant-impact tone depending on package type.' },
  { name: 'Financial projections and use-of-funds note', category: 'Financial projections', required: true, status: 'Needs Founder Approval', priority: 'Critical', owner: 'Finance / Founder Review', sourceWorkspace: 'Financial Section Builder', deadline: 'Before submission', notes: 'Use Dh for Moroccan bank-facing documentation; separate fixed, variable, BFR and treasury reserve logic.' },
  { name: 'Founder bios and governance profile', category: 'Founder documents', required: true, status: 'Ready', priority: 'High', owner: 'Founder Office', sourceWorkspace: 'Doctrine Vault / Data Room placeholder', deadline: 'Package assembly', notes: 'Ilyass as strategic pilot; Pamela as cofounder and 2nd active Managing Director with Academy/quality role.' },
  { name: 'SaaS / Partner OS proof screenshots', category: 'SaaS/product proof', required: true, status: 'Later ZIP/Data Room Required', priority: 'High', owner: 'Product / Data Room', sourceWorkspace: 'Due Diligence Data Room future ZIP', deadline: 'Before VC or SaaS package', notes: 'Required for VC/angel/international SaaS narratives.' },
  { name: 'SOP / Quality Check 360 proof', category: 'Quality/SOP proof', required: true, status: 'Needs Data Room Upload', priority: 'High', owner: 'Quality / Academy', sourceWorkspace: 'Data Room future ZIP', deadline: 'Before grant/impact package', notes: 'Supports child-quality standards and risk-control credibility.' },
  { name: 'Bank cover email and call script', category: 'Emails/call scripts', required: true, status: 'Ready', priority: 'Medium', owner: 'Capital Coordinator', sourceWorkspace: 'Outreach Scripts', deadline: 'After founder approval', notes: 'Prepared but never sent automatically.' },
];

export const caseBuilderNarratives: CaseBuilderNarrative[] = [
  { type: 'Bank-safe narrative', headline: 'Disciplined Kids 360 operator with controlled use of funds and repayment-safe growth path', opening: 'AngelCare presents a structured, cost-controlled and phased operational launch around verified services, Academy, B2B demand and SaaS-supported execution.', proofToEmphasize: 'Business plan, supplier quotes, staffing plan, cost-control doctrine, BFR and treasury reserve logic.', avoid: 'Do not over-emphasize speculative valuation or immediate international expansion.', annexes: 'Business plan, financial projections, use-of-funds, risk plan, quotations, organigram.', tone: 'Conservative, precise, bank-ready, Dh-based for Moroccan files.', founderReviewRequired: true, riskFlag: 'Financial projections and debt commitments require founder approval.' },
  { type: 'VC-scale narrative', headline: 'AngelCare Partner OS as a scalable SaaS and marketplace layer for private establishments', opening: 'AngelCare is positioned as a Kids 360 platform with tenant monetization, marketplace expansion, Academy quality engine and future Territory OS scaling.', proofToEmphasize: 'Partner OS screens, tenant logic, marketplace contracts, B2B pipeline, product architecture.', avoid: 'Do not claim mature recurring revenue before evidence exists.', annexes: 'SaaS proof, roadmap, traction, product screenshots, market map.', tone: 'Ambitious, scalable, precise, evidence-aware.', founderReviewRequired: true, riskFlag: 'Avoid overclaiming traction or exit potential.' },
  { type: 'Grant-impact narrative', headline: 'Improving child quality standards while professionalizing caregivers and supporting women co-leadership', opening: 'AngelCare’s impact pathway combines child development quality, caregiver professionalization, family support, private-establishment modernization and women/co-led governance.', proofToEmphasize: 'Academy, SOPs, Quality Check 360, impact indicators, training materials and job-creation plan.', avoid: 'Avoid unsupported medical or therapeutic claims.', annexes: 'Impact note, Academy proof, SOP, quality proof, training plan.', tone: 'Impactful, social, measurable, governance-safe.', founderReviewRequired: false, riskFlag: 'Impact claims must remain measurable and non-medical.' },
];

export const caseBuilderPositioningBlocks: CaseBuilderPositioningBlock[] = [
  { label: 'AngelCare as Kids 360 ecosystem', recommendedEmphasis: 'Critical in all packages', tone: 'Executive and broad, but controlled', riskNote: 'Must not sound unfocused; connect each vertical to revenue and SOP discipline.', proofNeeded: 'Business model deck and platform screenshots', sourceDoctrine: 'Core AngelCare Doctrine', included: true },
  { label: 'B2B private establishments + Partner OS SaaS', recommendedEmphasis: 'Very high for VC, investor and bank future-upside sections', tone: 'Scalable and recurring-revenue oriented', riskNote: 'Needs product proof and staged adoption evidence.', proofNeeded: 'Partner OS route/screens and tenant monetization plan', sourceDoctrine: 'SaaS Partner OS Doctrine', included: true },
  { label: 'Academy and caregiver professionalization', recommendedEmphasis: 'High for grants, impact, quality and operational risk reduction', tone: 'Institutional, measurable and quality-led', riskNote: 'Avoid unsupported certification claims without evidence.', proofNeeded: 'Training catalog, SOP, attendance/proof records', sourceDoctrine: 'Grant Impact Doctrine', included: true },
  { label: 'International expansion via Territory OS', recommendedEmphasis: 'Use as phased future capability, not immediate over-expansion', tone: 'Strategic and staged', riskNote: 'Funder may consider it premature if not phased.', proofNeeded: 'Territory OS contract and roadmap', sourceDoctrine: 'VC Investor Doctrine + Risk Doctrine', included: true },
];

export const caseBuilderFinancialSections: CaseBuilderFinancialSection[] = [
  { label: 'Requested amount', value: '1 500 000 Dh for Moroccan bank financing case', status: 'Needs Founder Approval', explanation: 'Must remain aligned with ILAYKI/TAMWILCOM/AWB bank-facing business plan and use Dh terminology.', owner: 'Founder + Finance' },
  { label: 'Use of funds', value: 'Optimized deployment across launch readiness, BFR, internal production support, proof-backed suppliers and treasury reserve', status: 'Needs Finance Review', explanation: 'Must separate operating needs, external quotes, internal execution value and protected reserve logic.', owner: 'Finance / Admin Review' },
  { label: 'Revenue stream mapping', value: 'B2C services, B2B contracts, Partner OS SaaS, Academy, marketplace/kits, Quality Check, hospitality and corporate programs', status: 'AI Draft Ready', explanation: 'Revenue streams must be presented differently depending on bank, VC, grant or impact package.', owner: 'Capital Strategy' },
  { label: 'Scenario posture', value: 'Conservative / Base / Upside', status: 'Needs Updated Numbers', explanation: 'MZ7 structures the financial narrative; detailed modeling is still a future hardening and reporting responsibility.', owner: 'Finance / Case Owner' },
];

export const caseBuilderRiskPlans: CaseBuilderRiskPlan[] = [
  { riskType: 'No 3-year financial history', severity: 'high', likelihood: 'High', whyItMatters: 'Bank or institutional funder may request historical proof that a pre-establishing company cannot provide.', mitigation: 'Explain beta since 2022, founder experience, supplier quotes, cost-control doctrine and controlled launch under SARL from Jan 2027.', planB: 'Provide alternative proof pack and detailed forecast.', planC: 'Request bank guidance on substitute evidence.', planD: 'Escalate to founder and expert-comptable for authenticated supporting note.', owner: 'Capital Coordinator + Founder', founderReviewRequired: true, status: 'Prepared for bank-safe file' },
  { riskType: 'SaaS traction proof still early', severity: 'medium', likelihood: 'Medium', whyItMatters: 'VC or SaaS investor may require proof of tenant adoption and recurring revenue.', mitigation: 'Position Partner OS as strategic monetization layer with staged rollout, not as already mature revenue.', planB: 'Use screenshots, roadmap and B2B pipeline proof.', planC: 'Target strategic relationship-first outreach.', planD: 'Move to strategic watchlist until SaaS proof is stronger.', owner: 'Founder / Product', founderReviewRequired: true, status: 'Narrative caution required' },
  { riskType: 'Childcare safety or quality overclaim', severity: 'critical', likelihood: 'Medium', whyItMatters: 'Unsupported claims can weaken trust or create legal/compliance risk.', mitigation: 'Use SOP, Quality Check 360, Academy and non-medical wording rules.', planB: 'Route sensitive language to founder/quality review.', planC: 'Attach approved SOP proof.', planD: 'Remove claim until evidence exists.', owner: 'Quality + Legal/Compliance Agent', founderReviewRequired: true, status: 'Must remain evidence-backed' },
  { riskType: 'Deadline risk', severity: 'medium', likelihood: 'High', whyItMatters: 'Packages can fail if documents, signatures or final attachments are late.', mitigation: 'Coordinator Handover specifies exact tasks, owners, deadlines and proof after action.', planB: 'Submit relationship-first email before full package if allowed.', planC: 'Request extension or next cohort.', planD: 'Archive and inject learning into doctrine.', owner: 'Capital Coordinator', founderReviewRequired: false, status: 'Operational control required' },
];

export const caseBuilderImpactSections: CaseBuilderImpactSection[] = [
  { category: 'Child quality standards', statement: 'AngelCare improves service consistency for children from birth to 12 through SOP, Academy and Quality Check 360.', measurableIndicator: 'Number of trained providers, validated SOP modules and quality reviews.', proofNeeded: 'Academy and SOP documents.', overclaimRisk: 'Avoid medical or therapeutic claims.', recommendedWording: 'Quality, organization, safety process and developmental support language only.', relevantFundingType: 'Grant / impact / bank social value' },
  { category: 'Caregiver professionalization', statement: 'AngelCare creates structured work opportunities for certified AngelCare Kids Specialists through mission-based deployment.', measurableIndicator: 'Certified provider pool, hours dispatched, training cohorts.', proofNeeded: 'Training logs and provider eligibility records.', overclaimRisk: 'Avoid calling standby agents fixed employees unless contractually true.', recommendedWording: 'Professionalization and mission-based deployment with validation.', relevantFundingType: 'Impact / workforce / grant' },
  { category: 'Private-establishment modernization', statement: 'Partner OS can support private schools and crèches with digital workflows, parent trust, quality monitoring and marketplace add-ons.', measurableIndicator: 'Tenant pilots, active modules, B2B opportunities.', proofNeeded: 'Partner OS screenshots and B2B pipeline.', overclaimRisk: 'Do not claim full tenant traction before evidence.', recommendedWording: 'Scalable SaaS-enabled modernization pathway.', relevantFundingType: 'VC / SaaS / bank upside' },
];

export const caseBuilderOutreachScripts: CaseBuilderOutreachScript[] = [
  { type: 'Bank-safe cover email', recipientType: 'Bank advisor / financing officer', subject: 'Demande d’étude de dossier de financement AngelCare', bodyPreview: 'Nous vous transmettons un dossier structuré présentant AngelCare, son modèle Kids 360, son plan d’exécution, ses projections financières en Dh et les annexes justificatives disponibles.', tone: 'Professional, concise, conservative', attachmentsSuggested: ['Business plan', 'Use-of-funds note', 'Financial projections', 'Supplier quote proof pack'], approvalRequired: true, riskNotes: 'Founder review before sending; no unsupported claims.', coordinatorInstruction: 'Review attachments, confirm recipient, send manually, upload proof of sending.' },
  { type: 'VC introduction email', recipientType: 'VC / angel investor', subject: 'AngelCare Partner OS · Kids 360 SaaS and marketplace opportunity', bodyPreview: 'AngelCare is developing a Kids 360 platform combining B2C services, B2B private-establishment SaaS, Academy, marketplace and quality systems, with a phased approach to scale.', tone: 'Ambitious but evidence-aware', attachmentsSuggested: ['One-pager', 'Product screenshots', 'SaaS roadmap'], approvalRequired: true, riskNotes: 'Founder-level approach recommended; do not overstate recurring revenue.', coordinatorInstruction: 'Use only after founder approves the VC narrative.' },
  { type: 'Grant application email', recipientType: 'Grant / impact program', subject: 'AngelCare · professionnalisation, qualité enfant et impact social', bodyPreview: 'AngelCare structure un modèle combinant qualité des services aux enfants, professionnalisation des accompagnatrices, formation Academy et modernisation des établissements privés.', tone: 'Impact, inclusion, measurable outcomes', attachmentsSuggested: ['Impact note', 'Academy proof', 'SOP proof'], approvalRequired: false, riskNotes: 'Avoid medical claims; keep impact measurable.', coordinatorInstruction: 'Attach approved impact and SOP documents when available.' },
];

export const caseBuilderProofPacks: CaseBuilderProofPackItem[] = [
  { proofType: 'Beta proof since 2022', available: true, credibilityLevel: 'High', source: 'Business plan and founder materials', lastUpdated: '2026-07', reusable: true, requiredForCase: true, owner: 'Founder Office', attachToPackage: true },
  { proofType: 'SaaS / Partner OS screenshots', available: true, credibilityLevel: 'Needs Update', source: 'Product workspace screenshots', lastUpdated: 'Needs latest capture', reusable: true, requiredForCase: true, owner: 'Product / Capital Coordinator', attachToPackage: false },
  { proofType: 'Supplier quotes and CDC proof', available: true, credibilityLevel: 'High', source: 'Supplier quotation CDC pack', lastUpdated: '2026-07', reusable: true, requiredForCase: true, owner: 'Admin / Finance', attachToPackage: true },
  { proofType: 'Academy and SOP documents', available: true, credibilityLevel: 'Medium', source: 'Internal production notes and Academy plans', lastUpdated: 'Needs Data Room classification', reusable: true, requiredForCase: true, owner: 'Academy / Quality', attachToPackage: false },
  { proofType: 'Financial projections', available: true, credibilityLevel: 'Needs Update', source: 'Business plan financial model', lastUpdated: 'Needs final founder review', reusable: true, requiredForCase: true, owner: 'Finance / Founder', attachToPackage: false },
];

export const caseBuilderFounderApprovals: CaseBuilderFounderApproval[] = [
  { item: 'Funding amount and bank commitment narrative', status: 'Pending Founder Review', reason: 'Impacts debt obligation, financial credibility and final submission wording.', approver: 'Both Founders', dueDate: 'Before external sending', comment: 'Review requested amount, BFR, treasury reserve and repayment-safe language.' },
  { item: 'Women cofounder positioning', status: 'Required', reason: 'Must present Pamela accurately as cofounder and 2nd active Managing Director without reducing her role to funding eligibility.', approver: 'Pamela Jacosalem Pacumba', dueDate: 'Before grant or women-founder package', comment: 'Confirm Academy, quality and operational standardization wording.' },
  { item: 'International expansion claim', status: 'Required', reason: 'Must be phased through Territory OS and not presented as reckless immediate expansion.', approver: 'Aissaoui Ilyass', dueDate: 'Before VC/international package', comment: 'Use staged route only.' },
  { item: 'Sensitive risk plan', status: 'Pending Founder Review', reason: 'Risk language can influence bank/investor perception and must remain controlled.', approver: 'Both Founders', dueDate: 'Before final package lock', comment: 'Approve plan B/C/D language.' },
];

export const caseBuilderCoordinatorHandovers: CaseBuilderCoordinatorHandover[] = [
  { block: 'Documents ready', instruction: 'Attach approved business plan, financial projections, use-of-funds note, founder bios and selected proof pack only after final review.', owner: 'Capital Coordinator', deadline: 'Submission day minus 1', proofAfterAction: 'Upload final sent package copy', escalationCondition: 'Missing founder approval or missing mandatory attachment' },
  { block: 'Emails ready', instruction: 'Use AI-prepared script only after approval; never send from AC CAPITAL OS automatically in MZ7.', owner: 'Capital Coordinator', deadline: 'After founder approval', proofAfterAction: 'Upload email sent screenshot or archive reference', escalationCondition: 'Recipient uncertainty or sensitive wording concern' },
  { block: 'Calls to make', instruction: 'Use call script, record response summary, capture objections and update learning notes for later doctrine injection.', owner: 'Capital Coordinator', deadline: '3 business days after first email', proofAfterAction: 'Call note + next action', escalationCondition: 'Funder requests founder-level meeting' },
  { block: 'Final checks', instruction: 'Confirm Dh currency in Moroccan bank-facing files, no unsupported claims, no automatic submission, no missing annexes.', owner: 'Capital Coordinator + Founder Review', deadline: 'Before sending', proofAfterAction: 'Final checklist marked complete', escalationCondition: 'Any red risk remains open' },
];

export const caseBuilderHandoffTargets = [
  { target: 'MZ8 Due Diligence Data Room', purpose: 'Store final documents, proof packs, versions, expiry and reusable annexes.', status: 'future-handoff' },
  { target: 'MZ9 Capital Pipeline CRM', purpose: 'Move approved case into submission, follow-up, due diligence and negotiation tracking.', status: 'future-handoff' },
  { target: 'MZ10 Human Coordinator Cockpit', purpose: 'Transform coordinator handover into daily execution tasks, calls, uploads and proof capture.', status: 'future-handoff' },
  { target: 'MZ11 AI Command Center', purpose: 'Later connect live model prompts, troubleshooting and cost/usage logs.', status: 'future-handoff' },
];

export function getCaseBuilderSnapshot() {
  const readyCases = caseBuilderCases.filter((item) => item.totalReadinessScore >= 80).length;
  const missingDocumentCases = caseBuilderCases.filter((item) => item.documentReadinessScore < 75).length;
  const founderApprovalRequired = caseBuilderFounderApprovals.filter((item) => item.status === 'Required' || item.status === 'Pending Founder Review').length;
  const coordinatorReady = caseBuilderCases.filter((item) => item.status === 'Coordinator Execution Ready').length;
  const averagePackageReadiness = Math.round(caseBuilderCases.reduce((sum, item) => sum + item.totalReadinessScore, 0) / caseBuilderCases.length);
  return {
    contract: AC_CAPITAL_CASE_BUILDER_CONTRACT,
    metrics: {
      activeCases: caseBuilderCases.length,
      readyCases,
      missingDocumentCases,
      founderApprovalRequired,
      coordinatorReady,
      averagePackageReadiness,
      financialSections: caseBuilderFinancialSections.length,
      riskPlans: caseBuilderRiskPlans.length,
      outreachScripts: caseBuilderOutreachScripts.length,
      proofPackItems: caseBuilderProofPacks.length,
    },
  };
}
