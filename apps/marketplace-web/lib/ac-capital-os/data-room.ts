import type { AcCapitalOsAccent } from './types';

export const AC_CAPITAL_DATA_ROOM_CONTRACT = {
  module: 'AC CAPITAL OS',
  megaZip: 8,
  token: 'MZ8_AC_CAPITAL_OS_DUE_DILIGENCE_DATA_ROOM',
  workspace: 'Due Diligence Data Room',
  subtitle: 'Capital Proof Vault, Documents, Annexes, Evidence & Submission Packs',
  safetyBoundary:
    'MZ8 creates the Due Diligence Data Room UI, structured data contract, migration foundation, evidence readiness logic and case-evidence linking model. It does not integrate real storage, auto-sign, auto-submit, or send communications.',
} as const;

export type DataRoomCategory =
  | 'Company / Legal Documents'
  | 'Founder Documents'
  | 'Business Planning Documents'
  | 'Financial Documents'
  | 'Product / SaaS Proof'
  | 'B2B / Commercial Proof'
  | 'Academy / Training Proof'
  | 'SOP / Quality / Trust Proof'
  | 'Supplier / External Devis Proof'
  | 'Market / Impact Proof'
  | 'Communication Proof'
  | 'Submitted Packages Archive';

export type DataRoomStatus =
  | 'Ready'
  | 'Needs Update'
  | 'Missing'
  | 'Draft'
  | 'Under Review'
  | 'Founder Approval Required'
  | 'Approved'
  | 'Rejected / Rework'
  | 'Expired'
  | 'Duplicate'
  | 'Archived'
  | 'Submitted'
  | 'Reusable Evidence';

export type DataRoomReadinessLevel =
  | 'Bank Ready'
  | 'VC Ready'
  | 'Grant Ready'
  | 'Impact Ready'
  | 'Internal Only'
  | 'Needs Legal Review'
  | 'Needs Finance Review'
  | 'Needs Founder Review'
  | 'Not Ready';

export type DataRoomSensitivityLevel =
  | 'Public'
  | 'Internal'
  | 'Confidential'
  | 'Founder Sensitive'
  | 'Financial Sensitive'
  | 'Legal Sensitive'
  | 'Child/Safety Sensitive'
  | 'Investor Sensitive';

export interface DataRoomDocument {
  id: string;
  title: string;
  category: DataRoomCategory;
  documentType: string;
  status: DataRoomStatus;
  readinessLevel: DataRoomReadinessLevel;
  version: string;
  language: 'FR' | 'EN' | 'AR' | 'Mixed';
  owner: string;
  sourceWorkspace: string;
  relatedCase: string;
  relatedFunder: string;
  relatedOpportunity: string;
  approvalStatus: string;
  founderApprovalRequired: boolean;
  signatureRequired: boolean;
  stampRequired: boolean;
  expiryDate: string;
  lastUpdated: string;
  credibilityScore: number;
  credibilityLabel: 'Very Strong' | 'Strong' | 'Acceptable' | 'Weak' | 'Missing Proof' | 'Outdated' | 'Needs Verification';
  reusable: boolean;
  sensitivityLevel: DataRoomSensitivityLevel;
  missingDependencies: string;
  nextAction: string;
}

export interface DataRoomReadinessScore {
  label: string;
  score: number;
  blockers: number;
  nextAction: string;
  accent: AcCapitalOsAccent;
}

export interface DataRoomMissingEvidence {
  item: string;
  priority: 'Critical' | 'High' | 'Medium';
  relatedCase: string;
  relatedFunder: string;
  owner: string;
  dueDate: string;
  requiredForSubmission: boolean;
  action: string;
}

export interface DataRoomVersionAlert {
  title: string;
  alertType: 'Expired' | 'Expiring Soon' | 'Outdated Version' | 'Duplicate' | 'Submitted Older Version';
  severity: 'critical' | 'high' | 'medium';
  document: string;
  action: string;
}

export interface DataRoomPackageBuilder {
  packageName: string;
  packageType: 'Bank Pack' | 'VC Pack' | 'Grant Pack' | 'Custom Case Pack';
  readinessScore: number;
  includedDocuments: number;
  missingDocuments: number;
  outdatedDocuments: number;
  founderApprovalRequired: boolean;
  status: 'Prepared' | 'Needs Evidence' | 'Founder Approval Required' | 'Ready for Coordinator Handover';
  nextAction: string;
}

export interface DataRoomCaseEvidenceLink {
  caseTitle: string;
  opportunity: string;
  funder: string;
  requiredDocuments: number;
  attachedEvidence: number;
  missingEvidence: number;
  recommendedEvidence: string;
  founderApprovalNeeded: boolean;
  coordinatorHandoverReadiness: number;
  action: string;
}

export interface DataRoomSubmissionArchiveItem {
  submissionName: string;
  relatedCase: string;
  funder: string;
  packageType: string;
  documentsIncluded: number;
  versionSubmitted: string;
  submittedBy: string;
  submittedDate: string;
  recipient: string;
  proofOfSubmission: string;
  followUpDate: string;
  resultStatus: 'Prepared' | 'Submitted' | 'Follow-Up Due' | 'Additional Documents Requested' | 'Under Review' | 'Won' | 'Lost' | 'Archived' | 'Learning Injected';
}

export const dataRoomCategories: Array<{ category: DataRoomCategory; purpose: string; evidenceExamples: string; count: number; readiness: number; accent: AcCapitalOsAccent }> = [
  { category: 'Company / Legal Documents', purpose: 'Control legal establishment, authority and bank-facing identity proof.', evidenceExamples: 'Statuts, RC placeholder, ICE/IF/TP placeholders, founder approval notes, insurance documents.', count: 9, readiness: 68, accent: 'navy' },
  { category: 'Founder Documents', purpose: 'Protect founder credibility and women cofounder proof.', evidenceExamples: 'Ilyass profile, Pamela profile, founder bios by bank/VC/grant tone, women cofounder proof.', count: 7, readiness: 81, accent: 'purple' },
  { category: 'Business Planning Documents', purpose: 'Keep every submitted narrative version controlled.', evidenceExamples: 'Business plan versions, executive summaries, market notes, use-of-funds notes.', count: 12, readiness: 76, accent: 'blue' },
  { category: 'Financial Documents', purpose: 'Maintain conservative, credible, Dh-labelled bank/investor financial evidence.', evidenceExamples: 'Financial projections, BFR logic, treasury reserve logic, supplier quotations.', count: 11, readiness: 71, accent: 'green' },
  { category: 'Product / SaaS Proof', purpose: 'Prove Partner OS, AC CAPITAL OS and SaaS monetization credibility.', evidenceExamples: 'Screenshots, route proof, module contracts, product roadmap, architecture proof.', count: 10, readiness: 64, accent: 'teal' },
  { category: 'B2B / Commercial Proof', purpose: 'Connect institutional demand to real commercial assets.', evidenceExamples: 'Plaquettes, brochures, B2B profiles, pricing notes, partnership proposals.', count: 8, readiness: 73, accent: 'amber' },
  { category: 'Academy / Training Proof', purpose: 'Support training, caregiver professionalization and course commercialization claims.', evidenceExamples: 'Academy programs, certification logic, trainer profiles, course materials.', count: 6, readiness: 69, accent: 'purple' },
  { category: 'SOP / Quality / Trust Proof', purpose: 'Back sensitive trust and quality claims with evidence.', evidenceExamples: 'SOP, Quality Check 360, safety procedures, non-medical boundary notes.', count: 9, readiness: 62, accent: 'red' },
  { category: 'Supplier / External Devis Proof', purpose: 'Preserve external quotation evidence used by banks and assessors.', evidenceExamples: 'Electronics, stationery, furniture, printing, kits, cyber, insurance, vehicle, telecom.', count: 18, readiness: 84, accent: 'green' },
  { category: 'Market / Impact Proof', purpose: 'Support Moroccan market modernization and social/economic impact positioning.', evidenceExamples: 'Childcare modernization, job creation, women empowerment, caregiver professionalization.', count: 5, readiness: 58, accent: 'blue' },
  { category: 'Communication Proof', purpose: 'Archive serious correspondence and follow-up evidence.', evidenceExamples: 'Emails sent, call scripts, supplier replies, meeting minutes, submission confirmations.', count: 13, readiness: 75, accent: 'teal' },
  { category: 'Submitted Packages Archive', purpose: 'Track exactly what was submitted, when, to whom and with which version.', evidenceExamples: 'Bank packages, grant packages, VC packs, version submitted, proof of submission.', count: 4, readiness: 52, accent: 'navy' },
];

export const dataRoomDocuments: DataRoomDocument[] = [
  {
    id: 'doc-bank-business-plan-final',
    title: 'Business plan financement ILAYKI / TAMWILCOM - version Dh',
    category: 'Business Planning Documents',
    documentType: 'Business Plan',
    status: 'Ready',
    readinessLevel: 'Bank Ready',
    version: 'bank-v4-founder-review',
    language: 'FR',
    owner: 'Capital coordinator',
    sourceWorkspace: 'Fundraising Case Builder',
    relatedCase: 'ILAYKI / guarantee-backed financing package',
    relatedFunder: 'Attijariwafa Bank / Dar Al Moukawil route',
    relatedOpportunity: 'Morocco women-founder guarantee route',
    approvalStatus: 'Founder approved content pending final attachment check',
    founderApprovalRequired: true,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: 'Not applicable',
    lastUpdated: '2026-07-27',
    credibilityScore: 91,
    credibilityLabel: 'Very Strong',
    reusable: true,
    sensitivityLevel: 'Financial Sensitive',
    missingDependencies: 'Attach final signed founder approval note before submission.',
    nextAction: 'Request Founder Approval and lock submitted version.',
  },
  {
    id: 'doc-saas-proof-partner-os',
    title: 'Partner OS SaaS monetization proof pack',
    category: 'Product / SaaS Proof',
    documentType: 'SaaS Proof',
    status: 'Needs Update',
    readinessLevel: 'VC Ready',
    version: 'product-proof-v2',
    language: 'Mixed',
    owner: 'IT / SaaS executive',
    sourceWorkspace: 'AC CAPITAL OS / Partner OS evidence',
    relatedCase: 'Seed relationship nurture package',
    relatedFunder: 'SaaS / technology funder',
    relatedOpportunity: 'International SaaS innovation radar route',
    approvalStatus: 'Needs product screenshot refresh',
    founderApprovalRequired: false,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: '2026-09-30',
    lastUpdated: '2026-07-20',
    credibilityScore: 76,
    credibilityLabel: 'Strong',
    reusable: true,
    sensitivityLevel: 'Investor Sensitive',
    missingDependencies: 'Add latest route screenshots and tenant monetization summary.',
    nextAction: 'Request update from product owner before VC package export.',
  },
  {
    id: 'doc-founder-pamela-women-cofounder',
    title: 'Pamela Jacosalem Pacumba cofounder / women-led eligibility profile',
    category: 'Founder Documents',
    documentType: 'Founder Bio',
    status: 'Ready',
    readinessLevel: 'Grant Ready',
    version: 'grant-impact-v1',
    language: 'FR',
    owner: 'Founder office',
    sourceWorkspace: 'Capital Doctrine Vault',
    relatedCase: 'Women-founder impact package',
    relatedFunder: 'Women-founder program',
    relatedOpportunity: 'Grant / impact route',
    approvalStatus: 'Approved for grant narrative; founder confirmation still required for official package.',
    founderApprovalRequired: true,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: '2027-01-01',
    lastUpdated: '2026-07-18',
    credibilityScore: 88,
    credibilityLabel: 'Very Strong',
    reusable: true,
    sensitivityLevel: 'Founder Sensitive',
    missingDependencies: 'Attach identity/legal proof only through secure official process.',
    nextAction: 'Use in grant/impact/women-founder packages with careful role wording.',
  },
  {
    id: 'doc-cyber-insurance-quotes',
    title: 'Cyberdefense / insurance / telecom supplier quotation evidence bundle',
    category: 'Supplier / External Devis Proof',
    documentType: 'Supplier Devis',
    status: 'Reusable Evidence',
    readinessLevel: 'Bank Ready',
    version: 'devis-bundle-v3',
    language: 'FR',
    owner: 'Admin finance',
    sourceWorkspace: 'Due Diligence Data Room',
    relatedCase: 'Bank pack controlled costs',
    relatedFunder: 'Bank / assessor',
    relatedOpportunity: 'Funding use evidence',
    approvalStatus: 'Reusable external evidence; refresh if older than supplier validity.',
    founderApprovalRequired: false,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: '2026-12-31',
    lastUpdated: '2026-07-10',
    credibilityScore: 83,
    credibilityLabel: 'Strong',
    reusable: true,
    sensitivityLevel: 'Internal',
    missingDependencies: 'Confirm supplier validity period before attaching externally.',
    nextAction: 'Link to bank package builder and cost proof table.',
  },
  {
    id: 'doc-quality-sop-proof',
    title: 'Quality Check 360 / SOP standards proof appendix',
    category: 'SOP / Quality / Trust Proof',
    documentType: 'Quality Proof',
    status: 'Under Review',
    readinessLevel: 'Needs Legal Review',
    version: 'trust-sop-v1-review',
    language: 'FR',
    owner: 'Quality / Academy leadership',
    sourceWorkspace: 'Capital Doctrine Vault',
    relatedCase: 'Grant impact package',
    relatedFunder: 'Impact / development institution',
    relatedOpportunity: 'Child quality standards funding',
    approvalStatus: 'Legal-safe wording review required before external use.',
    founderApprovalRequired: true,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: '2026-10-15',
    lastUpdated: '2026-07-25',
    credibilityScore: 67,
    credibilityLabel: 'Acceptable',
    reusable: true,
    sensitivityLevel: 'Child/Safety Sensitive',
    missingDependencies: 'Remove unsupported safety claims and add non-medical boundary wording.',
    nextAction: 'Route to founder and compliance review before grant package inclusion.',
  },
  {
    id: 'doc-submission-proof-placeholder',
    title: 'Submission confirmation placeholder for first bank package',
    category: 'Submitted Packages Archive',
    documentType: 'Submission Proof',
    status: 'Missing',
    readinessLevel: 'Not Ready',
    version: 'pending',
    language: 'FR',
    owner: 'Coordinator',
    sourceWorkspace: 'Coordinator Handover',
    relatedCase: 'ILAYKI / guarantee-backed financing package',
    relatedFunder: 'Bank route',
    relatedOpportunity: 'Submitted package archive',
    approvalStatus: 'Created as expected evidence slot; only completed after real submission.',
    founderApprovalRequired: false,
    signatureRequired: false,
    stampRequired: false,
    expiryDate: 'Not applicable',
    lastUpdated: 'Pending',
    credibilityScore: 0,
    credibilityLabel: 'Missing Proof',
    reusable: false,
    sensitivityLevel: 'Investor Sensitive',
    missingDependencies: 'Upload proof after human coordinator submits externally.',
    nextAction: 'Do not mark submitted until proof is uploaded.',
  },
];

export const dataRoomReadinessScores: DataRoomReadinessScore[] = [
  { label: 'Data Room Readiness', score: 72, blockers: 6, nextAction: 'Clear missing proof blockers before next submission.', accent: 'navy' },
  { label: 'Bank Pack', score: 83, blockers: 2, nextAction: 'Finalize founder approval and signature/stamp requirements.', accent: 'green' },
  { label: 'VC Pack', score: 66, blockers: 5, nextAction: 'Refresh SaaS proof and traction screenshots.', accent: 'purple' },
  { label: 'Grant Pack', score: 74, blockers: 4, nextAction: 'Review impact/SOP wording and women cofounder attachments.', accent: 'blue' },
  { label: 'Legal Readiness', score: 61, blockers: 3, nextAction: 'Confirm legal documents and sensitive wording before external use.', accent: 'red' },
  { label: 'Financial Readiness', score: 78, blockers: 2, nextAction: 'Lock Dh-labelled projections and supplier quote validity.', accent: 'teal' },
  { label: 'SaaS Proof Readiness', score: 64, blockers: 4, nextAction: 'Add updated module screenshots and route proof.', accent: 'amber' },
  { label: 'SOP / Quality Proof', score: 62, blockers: 4, nextAction: 'Review non-medical and child-safety wording.', accent: 'red' },
];

export const dataRoomMissingEvidence: DataRoomMissingEvidence[] = [
  { item: 'Signed founder approval note for bank package', priority: 'Critical', relatedCase: 'ILAYKI / guarantee-backed financing package', relatedFunder: 'Bank route', owner: 'Founder office', dueDate: 'Before submission', requiredForSubmission: true, action: 'Request Founder Approval and lock version.' },
  { item: 'Latest SaaS screenshots for Partner OS and AC CAPITAL OS', priority: 'High', relatedCase: 'VC narrative pack', relatedFunder: 'SaaS / tech funder', owner: 'IT / SaaS executive', dueDate: 'This week', requiredForSubmission: true, action: 'Capture screenshots and update product proof.' },
  { item: 'Quality Check 360 legal-safe appendix', priority: 'High', relatedCase: 'Grant impact package', relatedFunder: 'Impact institution', owner: 'Quality / Academy leadership', dueDate: 'Before grant file', requiredForSubmission: true, action: 'Review claims and add safe boundaries.' },
  { item: 'Submission confirmation proof slot', priority: 'Medium', relatedCase: 'Any submitted package', relatedFunder: 'All external recipients', owner: 'Coordinator', dueDate: 'After submission', requiredForSubmission: false, action: 'Upload proof after human execution only.' },
];

export const dataRoomVersionControl: DataRoomVersionAlert[] = [
  { title: 'Submitted package may use older business plan version', alertType: 'Submitted Older Version', severity: 'high', document: 'Business plan financement ILAYKI / TAMWILCOM - version Dh', action: 'Verify submitted version before final sending.' },
  { title: 'SaaS proof pack expiring soon', alertType: 'Expiring Soon', severity: 'medium', document: 'Partner OS SaaS monetization proof pack', action: 'Refresh screenshots and route proof.' },
  { title: 'Duplicate supplier quote bundle detected', alertType: 'Duplicate', severity: 'medium', document: 'Cyberdefense / insurance / telecom supplier quotation evidence bundle', action: 'Merge or archive duplicate after finance review.' },
];

export const dataRoomPackageBuilders: DataRoomPackageBuilder[] = [
  { packageName: 'Bank Pack · ILAYKI / TAMWILCOM route', packageType: 'Bank Pack', readinessScore: 83, includedDocuments: 18, missingDocuments: 2, outdatedDocuments: 1, founderApprovalRequired: true, status: 'Founder Approval Required', nextAction: 'Lock founder-approved version and attach submission proof after sending.' },
  { packageName: 'VC Pack · Partner OS SaaS thesis', packageType: 'VC Pack', readinessScore: 66, includedDocuments: 12, missingDocuments: 5, outdatedDocuments: 2, founderApprovalRequired: true, status: 'Needs Evidence', nextAction: 'Refresh product screenshots, traction proof and SaaS revenue narrative.' },
  { packageName: 'Grant Pack · Women cofounder + child quality impact', packageType: 'Grant Pack', readinessScore: 74, includedDocuments: 15, missingDocuments: 4, outdatedDocuments: 1, founderApprovalRequired: true, status: 'Needs Evidence', nextAction: 'Complete impact indicators and SOP safe wording review.' },
  { packageName: 'Custom Case Pack · Funder-specific handover', packageType: 'Custom Case Pack', readinessScore: 71, includedDocuments: 10, missingDocuments: 3, outdatedDocuments: 1, founderApprovalRequired: true, status: 'Ready for Coordinator Handover', nextAction: 'Link to active Fundraising Case Builder dossier.' },
];

export const dataRoomCaseEvidenceLinks: DataRoomCaseEvidenceLink[] = [
  { caseTitle: 'ILAYKI / guarantee-backed financing package', opportunity: 'Morocco women-founder guarantee route', funder: 'Bank / TAMWILCOM-linked route', requiredDocuments: 24, attachedEvidence: 19, missingEvidence: 2, recommendedEvidence: 'Business plan, financial projections, supplier devis, founder bios, BFR note, risk plan.', founderApprovalNeeded: true, coordinatorHandoverReadiness: 84, action: 'Attach final signed approval note and submission proof slot.' },
  { caseTitle: 'Partner OS SaaS seed relationship pack', opportunity: 'International SaaS innovation route', funder: 'SaaS / VC funder', requiredDocuments: 18, attachedEvidence: 11, missingEvidence: 5, recommendedEvidence: 'Product screenshots, tenant monetization note, roadmap, marketplace logic, founder thesis.', founderApprovalNeeded: true, coordinatorHandoverReadiness: 61, action: 'Do not send before product proof refresh.' },
  { caseTitle: 'Women-founder child-quality grant pack', opportunity: 'Grant / impact route', funder: 'Impact / women-founder program', requiredDocuments: 20, attachedEvidence: 14, missingEvidence: 4, recommendedEvidence: 'Pamela profile, Academy proof, SOP proof, impact indicators, job creation evidence.', founderApprovalNeeded: true, coordinatorHandoverReadiness: 72, action: 'Complete Quality Check 360 wording and impact evidence.' },
];

export const dataRoomSubmissionArchive: DataRoomSubmissionArchiveItem[] = [
  { submissionName: 'Bank package · prepared archive slot', relatedCase: 'ILAYKI / guarantee-backed financing package', funder: 'Bank route', packageType: 'Bank Pack', documentsIncluded: 0, versionSubmitted: 'Not submitted yet', submittedBy: 'Pending human coordinator', submittedDate: 'Pending', recipient: 'Pending', proofOfSubmission: 'Missing', followUpDate: 'Pending', resultStatus: 'Prepared' },
  { submissionName: 'Supplier quotation request evidence archive', relatedCase: 'Cost proof pack', funder: 'Bank / assessor', packageType: 'Evidence Pack', documentsIncluded: 7, versionSubmitted: 'devis-bundle-v3', submittedBy: 'Coordinator', submittedDate: 'Internal archive', recipient: 'Internal data room', proofOfSubmission: 'Reusable internal evidence', followUpDate: 'Review before bank submission', resultStatus: 'Archived' },
  { submissionName: 'Future VC introduction pack placeholder', relatedCase: 'Partner OS SaaS seed relationship pack', funder: 'SaaS / VC funder', packageType: 'VC Pack', documentsIncluded: 0, versionSubmitted: 'Pending proof refresh', submittedBy: 'Not submitted', submittedDate: 'Pending', recipient: 'Pending', proofOfSubmission: 'Not applicable', followUpDate: 'After founder approval', resultStatus: 'Prepared' },
];

export function getDataRoomSnapshot() {
  const totalDocuments = dataRoomDocuments.length;
  const bankReady = dataRoomDocuments.filter((doc) => doc.readinessLevel === 'Bank Ready').length;
  const vcReady = dataRoomDocuments.filter((doc) => doc.readinessLevel === 'VC Ready').length;
  const grantReady = dataRoomDocuments.filter((doc) => doc.readinessLevel === 'Grant Ready').length;
  const founderApproval = dataRoomDocuments.filter((doc) => doc.founderApprovalRequired).length;
  const signatureOrStamp = dataRoomDocuments.filter((doc) => doc.signatureRequired || doc.stampRequired).length;
  const reusable = dataRoomDocuments.filter((doc) => doc.reusable).length;
  const missing = dataRoomDocuments.filter((doc) => doc.status === 'Missing').length;
  const outdated = dataRoomDocuments.filter((doc) => doc.status === 'Needs Update' || doc.status === 'Expired').length;
  return {
    token: AC_CAPITAL_DATA_ROOM_CONTRACT.token,
    totalDocuments,
    bankReady,
    vcReady,
    grantReady,
    founderApproval,
    signatureOrStamp,
    reusable,
    missing,
    outdated,
    packageBuilders: dataRoomPackageBuilders.length,
    submissionArchive: dataRoomSubmissionArchive.length,
    readiness: 72,
  };
}
