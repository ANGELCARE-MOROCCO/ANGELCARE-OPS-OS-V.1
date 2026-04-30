export type DocumentCategory =
  | 'trainee'
  | 'trainer'
  | 'group'
  | 'course'
  | 'finance'
  | 'partner'
  | 'executive'
  | 'compliance'

export type ConfidentialityLevel = 'internal' | 'restricted' | 'confidential' | 'board'

export type AcademyDocumentTemplate = {
  type: string
  category: DocumentCategory
  code: string
  title: string
  description: string
  confidentiality: ConfidentialityLevel
  recommendedPurpose: string
  primaryEntity?: 'trainee' | 'trainer' | 'group' | 'course' | 'partner'
  sections: string[]
}

export const EXPORT_REASONS = [
  'Internal management review',
  'Client / family communication',
  'Trainer follow-up',
  'Partner dispatch',
  'Compliance / audit',
  'Financial control',
  'Certification proof',
  'Legal / administrative file',
  'Board reporting',
  'Other',
] as const

export const DOCUMENT_CATALOG: AcademyDocumentTemplate[] = [
  { type: 'trainee-permanent-dossier', category: 'trainee', code: 'DOS-TRN', title: 'Trainee Permanent Dossier', description: 'Complete controlled trainee file with identity, serial number, lifecycle, notes and compliance trace.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', primaryEntity: 'trainee', sections: ['Identity & serial', 'Lifecycle status', 'Eligibility', 'Payments', 'Attendance', 'Certificates', 'Manager notes'] },
  { type: 'trainee-eligibility-evaluation', category: 'trainee', code: 'ELG-TRN', title: 'Trainee Eligibility Evaluation Sheet', description: 'Eligibility scoring, approval/rejection status, missing evidence and evaluator notes.', confidentiality: 'restricted', recommendedPurpose: 'Internal management review', primaryEntity: 'trainee', sections: ['Candidate profile', 'Eligibility status', 'Scoring summary', 'Approval decision', 'Required actions'] },
  { type: 'trainee-enrollment-confirmation', category: 'trainee', code: 'ENR-CON', title: 'Trainee Enrollment Confirmation', description: 'Formal enrollment confirmation with course, group, status, dates and administrative references.', confidentiality: 'restricted', recommendedPurpose: 'Client / family communication', primaryEntity: 'trainee', sections: ['Enrollment summary', 'Course details', 'Group assignment', 'Administrative conditions'] },
  { type: 'trainee-payment-statement', category: 'finance', code: 'PAY-TRN', title: 'Trainee Payment Statement', description: 'Trainee-level payment ledger, paid amounts, outstanding balance and follow-up status.', confidentiality: 'confidential', recommendedPurpose: 'Financial control', primaryEntity: 'trainee', sections: ['Payment ledger', 'Outstanding balance', 'Risk flags', 'Finance actions'] },
  { type: 'trainee-attendance-record', category: 'trainee', code: 'ATT-TRN', title: 'Trainee Attendance Record', description: 'Attendance proof for trainee with presence/absence/late history and completion indicators.', confidentiality: 'restricted', recommendedPurpose: 'Certification proof', primaryEntity: 'trainee', sections: ['Attendance history', 'Presence rate', 'Absence notes', 'Certification impact'] },
  { type: 'trainee-progress-report', category: 'trainee', code: 'PRG-TRN', title: 'Trainee Training Progress Report', description: 'Operational progress report covering training status, risks, actions and readiness.', confidentiality: 'restricted', recommendedPurpose: 'Trainer follow-up', primaryEntity: 'trainee', sections: ['Progress status', 'Learning risks', 'Attendance', 'Trainer/manager actions'] },
  { type: 'trainee-risk-intervention', category: 'trainee', code: 'RSK-TRN', title: 'Trainee Risk & Intervention Report', description: 'Escalation-style report for dropout, payment, attendance or compliance risk.', confidentiality: 'confidential', recommendedPurpose: 'Internal management review', primaryEntity: 'trainee', sections: ['Risk diagnosis', 'Evidence', 'Intervention plan', 'Owner & deadlines'] },
  { type: 'trainee-graduation-file', category: 'trainee', code: 'GRD-TRN', title: 'Trainee Graduation File', description: 'Graduation readiness and final record for certified or near-certified trainees.', confidentiality: 'restricted', recommendedPurpose: 'Certification proof', primaryEntity: 'trainee', sections: ['Completion status', 'Certificate status', 'Payment closure', 'Post-graduation path'] },
  { type: 'certificate-verification-sheet', category: 'compliance', code: 'CERT-VER', title: 'Trainee Certificate Verification Sheet', description: 'Certificate authenticity sheet with serial, certificate number, verification hash and issuance status.', confidentiality: 'restricted', recommendedPurpose: 'Certification proof', primaryEntity: 'trainee', sections: ['Certificate identity', 'Trainee identity', 'Verification hash', 'Issuance controls'] },
  { type: 'trainee-placement-profile', category: 'partner', code: 'PLC-TRN', title: 'Trainee Partner Placement Profile', description: 'Professional partner-facing profile for placement, schools, nurseries or family missions.', confidentiality: 'confidential', recommendedPurpose: 'Partner dispatch', primaryEntity: 'trainee', sections: ['Candidate profile', 'Training evidence', 'Placement recommendation', 'Restrictions/notes'] },

  { type: 'trainer-permanent-file', category: 'trainer', code: 'DOS-TRR', title: 'Trainer Permanent File', description: 'Trainer profile with specialty, contact, status and operational notes.', confidentiality: 'confidential', recommendedPurpose: 'Internal management review', primaryEntity: 'trainer', sections: ['Identity', 'Specialties', 'Assigned groups', 'Quality notes'] },
  { type: 'trainer-assignment-report', category: 'trainer', code: 'ASN-TRR', title: 'Trainer Assignment Report', description: 'Trainer assignment overview by group, course, location and period.', confidentiality: 'restricted', recommendedPurpose: 'Trainer follow-up', primaryEntity: 'trainer', sections: ['Trainer workload', 'Group assignments', 'Location coverage', 'Schedule risks'] },
  { type: 'trainer-workload-report', category: 'trainer', code: 'WRK-TRR', title: 'Trainer Workload Report', description: 'Workload and utilization control report for trainer planning.', confidentiality: 'restricted', recommendedPurpose: 'Internal management review', primaryEntity: 'trainer', sections: ['Utilization', 'Active groups', 'Capacity pressure', 'Manager action'] },
  { type: 'trainer-performance-review', category: 'trainer', code: 'PER-TRR', title: 'Trainer Performance Review', description: 'Performance review with delivery outcomes, attendance quality and group completion signals.', confidentiality: 'confidential', recommendedPurpose: 'Internal management review', primaryEntity: 'trainer', sections: ['Performance scorecard', 'Groups delivered', 'Completion outcomes', 'Improvement plan'] },
  { type: 'trainer-attendance-delivery', category: 'trainer', code: 'DEL-TRR', title: 'Trainer Attendance Delivery Sheet', description: 'Session delivery and attendance evidence by trainer.', confidentiality: 'restricted', recommendedPurpose: 'Trainer follow-up', primaryEntity: 'trainer', sections: ['Session register', 'Attendance coverage', 'Delivery notes'] },
  { type: 'trainer-quality-incident', category: 'trainer', code: 'INC-TRR', title: 'Trainer Quality Incident Report', description: 'Controlled incident report for trainer delivery or quality escalation.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', primaryEntity: 'trainer', sections: ['Incident summary', 'Evidence', 'Impact', 'Corrective action'] },

  { type: 'group-master-file', category: 'group', code: 'DOS-GRP', title: 'Group Master File', description: 'Complete cohort file with course, trainer, location, dates, capacity and enrolled trainees.', confidentiality: 'restricted', recommendedPurpose: 'Internal management review', primaryEntity: 'group', sections: ['Group identity', 'Course/trainer/location', 'Capacity', 'Enrollment list'] },
  { type: 'group-attendance-register', category: 'group', code: 'ATT-GRP', title: 'Group Attendance Register', description: 'Group-level attendance register for operational evidence and compliance.', confidentiality: 'restricted', recommendedPurpose: 'Compliance / audit', primaryEntity: 'group', sections: ['Group identity', 'Attendance table', 'Absence rate', 'Follow-up actions'] },
  { type: 'group-capacity-dispatch', category: 'group', code: 'CAP-GRP', title: 'Group Capacity & Dispatch Report', description: 'Capacity control report showing under/over-capacity, city demand and dispatch pressure.', confidentiality: 'internal', recommendedPurpose: 'Internal management review', primaryEntity: 'group', sections: ['Capacity analysis', 'City dispatch', 'Demand/supply', 'Recommended actions'] },
  { type: 'group-completion-report', category: 'group', code: 'CMP-GRP', title: 'Group Course Completion Report', description: 'Course completion status by group with attendance and certification readiness.', confidentiality: 'restricted', recommendedPurpose: 'Certification proof', primaryEntity: 'group', sections: ['Completion status', 'Attendance', 'Payment closure', 'Certificate readiness'] },
  { type: 'group-cert-readiness', category: 'group', code: 'RDY-GRP', title: 'Group Certification Readiness Report', description: 'Readiness map for certification by group, payment, attendance and eligibility rules.', confidentiality: 'restricted', recommendedPurpose: 'Certification proof', primaryEntity: 'group', sections: ['Readiness list', 'Blockers', 'Recommended issuance actions'] },
  { type: 'group-risk-dashboard', category: 'group', code: 'RSK-GRP', title: 'Group Risk Dashboard Report', description: 'Group-level risk overview covering attendance, capacity, trainer, payments and exceptions.', confidentiality: 'confidential', recommendedPurpose: 'Internal management review', primaryEntity: 'group', sections: ['Risk radar', 'Top exceptions', 'Owner actions', 'Deadlines'] },

  { type: 'course-technical-sheet', category: 'course', code: 'TEC-CRS', title: 'Course Technical Sheet', description: 'Technical course profile with category, level, duration, price and delivery conditions.', confidentiality: 'internal', recommendedPurpose: 'Internal management review', primaryEntity: 'course', sections: ['Course identity', 'Pricing', 'Duration', 'Certification path'] },
  { type: 'course-delivery-plan', category: 'course', code: 'PLN-CRS', title: 'Course Delivery Plan', description: 'Delivery plan for training execution, group schedule and trainer assignment.', confidentiality: 'internal', recommendedPurpose: 'Trainer follow-up', primaryEntity: 'course', sections: ['Delivery scope', 'Groups', 'Trainer coverage', 'Timeline'] },
  { type: 'course-evaluation-report', category: 'course', code: 'EVL-CRS', title: 'Course Evaluation Report', description: 'Course-level performance and outcome analysis.', confidentiality: 'restricted', recommendedPurpose: 'Internal management review', primaryEntity: 'course', sections: ['Enrollment', 'Attendance', 'Completion', 'Recommendations'] },
  { type: 'course-pricing-revenue', category: 'finance', code: 'REV-CRS', title: 'Course Pricing & Revenue Report', description: 'Revenue and pricing view by course.', confidentiality: 'confidential', recommendedPurpose: 'Financial control', primaryEntity: 'course', sections: ['Price book', 'Revenue', 'Outstanding', 'Margin signals'] },
  { type: 'course-compliance-pack', category: 'compliance', code: 'CMP-CRS', title: 'Course Compliance Evidence Pack', description: 'Evidence pack for audit, curriculum delivery and certification readiness.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', primaryEntity: 'course', sections: ['Course evidence', 'Attendance evidence', 'Certificate controls', 'Audit notes'] },

  { type: 'academy-revenue-report', category: 'finance', code: 'REV-ACD', title: 'Academy Revenue Report', description: 'Academy revenue, collected amounts and unpaid exposure.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Revenue overview', 'Collected', 'Outstanding', 'Management interpretation'] },
  { type: 'payment-aging-report', category: 'finance', code: 'AGE-PAY', title: 'Payment Aging Report', description: 'Aging report for pending and overdue academy payments.', confidentiality: 'confidential', recommendedPurpose: 'Financial control', sections: ['Aging buckets', 'Pending amounts', 'Overdue cases', 'Collection priorities'] },
  { type: 'outstanding-balance-report', category: 'finance', code: 'BAL-PAY', title: 'Outstanding Balance Report', description: 'Outstanding balance control and follow-up report.', confidentiality: 'confidential', recommendedPurpose: 'Financial control', sections: ['Balance summary', 'Unpaid trainees', 'Priority follow-up'] },
  { type: 'payment-collection-followup', category: 'finance', code: 'FUP-PAY', title: 'Payment Collection Follow-up Report', description: 'Finance follow-up register for collection actions.', confidentiality: 'confidential', recommendedPurpose: 'Financial control', sections: ['Follow-up register', 'Contact actions', 'Risk cases'] },
  { type: 'refund-exception-report', category: 'finance', code: 'EXC-PAY', title: 'Refund / Exception Report', description: 'Payment exceptions, refunds, write-offs and special approvals.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', sections: ['Exception log', 'Reason', 'Approval status', 'Financial impact'] },

  { type: 'partner-directory-export', category: 'partner', code: 'DIR-PRT', title: 'Partner Directory Export', description: 'Controlled export of academy partners by city/type/status.', confidentiality: 'restricted', recommendedPurpose: 'Partner dispatch', primaryEntity: 'partner', sections: ['Partner directory', 'City/type filters', 'Relationship status'] },
  { type: 'partner-placement-report', category: 'partner', code: 'PLC-PRT', title: 'Partner Placement Report', description: 'Placement flow by partner, trainee and opportunity status.', confidentiality: 'confidential', recommendedPurpose: 'Partner dispatch', primaryEntity: 'partner', sections: ['Placement pipeline', 'Trainee candidates', 'Partner actions'] },
  { type: 'partner-opportunity-pipeline', category: 'partner', code: 'OPP-PRT', title: 'Partner Opportunity Pipeline', description: 'Partner sales and placement opportunity pipeline.', confidentiality: 'restricted', recommendedPurpose: 'Board reporting', primaryEntity: 'partner', sections: ['Opportunity stages', 'Owners', 'Next actions'] },
  { type: 'partner-dispatch-recommendation', category: 'partner', code: 'DSP-PRT', title: 'Partner Dispatch Recommendation Sheet', description: 'Recommended trainees for dispatch based on city, readiness and partner fit.', confidentiality: 'confidential', recommendedPurpose: 'Partner dispatch', sections: ['Candidate shortlist', 'Partner fit', 'Readiness criteria', 'Dispatch notes'] },
  { type: 'post-graduation-followup', category: 'partner', code: 'FUP-GRD', title: 'Post-Graduation Follow-up Report', description: 'Post-graduation actions, upsell, placement and reactivation follow-up.', confidentiality: 'restricted', recommendedPurpose: 'Internal management review', sections: ['Graduates', 'Follow-up stage', 'Next actions', 'Outcome'] },

  { type: 'weekly-operations-report', category: 'executive', code: 'OPS-WKL', title: 'Academy Weekly Operations Report', description: 'Weekly operational performance, risks, actions and priorities.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Executive summary', 'KPIs', 'Exceptions', 'Next week priorities'] },
  { type: 'monthly-executive-report', category: 'executive', code: 'EXE-MTH', title: 'Academy Monthly Executive Report', description: 'Monthly board-level report across pipeline, revenue, delivery, certification and partners.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Executive dashboard', 'Revenue', 'Quality', 'Risks', 'Decisions required'] },
  { type: 'iso-audit-evidence-report', category: 'compliance', code: 'ISO-AUD', title: 'Academy ISO Audit Evidence Report', description: 'Audit evidence report consolidating exports, certificates, actions and controlled records.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', sections: ['Audit scope', 'Controlled records', 'Action log', 'Evidence summary'] },
  { type: 'exceptions-risks-report', category: 'executive', code: 'RSK-EXC', title: 'Academy Exceptions & Risks Report', description: 'Executive exception register for overdue payments, attendance risk, missing eligibility and capacity pressure.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Risk register', 'Severity', 'Owner', 'Management action'] },
  { type: 'action-log-report', category: 'compliance', code: 'LOG-ACT', title: 'Academy Action Log Report', description: 'Traceability report for controlled actions and decisions.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', sections: ['Action log', 'Actor', 'Entity', 'Timestamp', 'Reason'] },
  { type: 'governance-export-log', category: 'compliance', code: 'GOV-EXP', title: 'Academy Governance Export Log', description: 'Export governance register showing document reasons, authors, filters and references.', confidentiality: 'confidential', recommendedPurpose: 'Compliance / audit', sections: ['Export log', 'References', 'Reasons', 'Governance controls'] },
  { type: 'academy-board-pack', category: 'executive', code: 'BRD-PCK', title: 'Academy Board Pack', description: 'Board pack consolidating Academy KPIs, financials, quality, risks and strategic actions.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Board summary', 'Financials', 'Operations', 'Risks', 'Strategic decisions'] },
  { type: 'performance-scorecard', category: 'executive', code: 'PER-SCR', title: 'Academy Performance Scorecard', description: 'Balanced scorecard for Academy performance and management control.', confidentiality: 'board', recommendedPurpose: 'Board reporting', sections: ['Scorecard', 'Targets', 'Actuals', 'Variance', 'Management response'] },
]

export function getDocumentTemplate(type?: string | null) {
  return DOCUMENT_CATALOG.find((doc) => doc.type === type) || null
}

export function getCategoryLabel(category: DocumentCategory) {
  const labels: Record<DocumentCategory, string> = {
    trainee: 'Trainees',
    trainer: 'Trainers',
    group: 'Groups & Cohorts',
    course: 'Courses',
    finance: 'Finance',
    partner: 'Partners & Placement',
    executive: 'Executive',
    compliance: 'Compliance / ISO',
  }
  return labels[category]
}
