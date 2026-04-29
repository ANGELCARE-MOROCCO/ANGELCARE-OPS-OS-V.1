
export type AcademyModuleKey =
  | 'administration'
  | 'enrollments'
  | 'eligibility'
  | 'payments'
  | 'locations-groups'
  | 'trainers'
  | 'courses'
  | 'calendar'
  | 'attendance'
  | 'trainees'
  | 'certificates'
  | 'graduation'
  | 'partners'
  | 'alerts-sales'

export type AcademyField = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'email' | 'tel' | 'select' | 'textarea'
  required?: boolean
  placeholder?: string
  options?: string[]
}

export type AcademyModuleConfig = {
  key: AcademyModuleKey
  title: string
  shortTitle: string
  href: string
  icon: string
  table: string
  permission: string
  executiveIntent: string
  managementMission: string
  primaryAction: string
  fields: AcademyField[]
  workflow: string[]
  kpis: string[]
  related: AcademyModuleKey[]
  riskRules: string[]
}

export const ACADEMY_MODULES: AcademyModuleConfig[] = [
  {
    key: 'administration',
    title: 'Administration',
    shortTitle: 'Administration',
    href: '/academy/administration',
    icon: '🛡️',
    table: 'academy_alerts',
    permission: 'admin.view',
    executiveIntent: 'Academy governance, compliance, roles, policies and operating discipline.',
    managementMission: 'Operate administration with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Define academy SOP',
    fields: [
    { name: 'title', label: 'Governance item', type: 'text', required: true, placeholder: 'Policy, audit, SOP, incident or internal control' },
    { name: 'message', label: 'Management note', type: 'textarea', placeholder: 'What must the Academy manager verify or enforce?' },
    { name: 'severity', label: 'Severity', type: 'select', options: ['normal', 'medium', 'high', 'critical'] },
    { name: 'due_at', label: 'Due date/time', type: 'datetime-local' }
  ],
    workflow: ['Define academy SOP', 'Assign owner', 'Control evidence', 'Audit exception', 'Close governance loop'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'enrollments',
    title: 'Enrollments',
    shortTitle: 'Enrollments',
    href: '/academy/enrollments',
    icon: '📝',
    table: 'academy_enrollments',
    permission: 'academy.view',
    executiveIntent: 'Candidate intake, registration, enrollment conversion and course/group assignment.',
    managementMission: 'Operate enrollments with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Register candidate',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', placeholder: 'Paste trainee UUID when available' },
    { name: 'course_id', label: 'Course ID', type: 'text', placeholder: 'Paste course UUID' },
    { name: 'group_id', label: 'Group ID', type: 'text', placeholder: 'Paste group UUID' },
    { name: 'status', label: 'Enrollment status', type: 'select', options: ['lead', 'pending', 'enrolled', 'active', 'completed', 'cancelled'] }
  ],
    workflow: ['Register candidate', 'Validate eligibility', 'Assign course', 'Dispatch group', 'Activate training file'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "payments", "attendance", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'eligibility',
    title: 'Eligibility',
    shortTitle: 'Eligibility',
    href: '/academy/eligibility',
    icon: '✅',
    table: 'academy_trainees',
    permission: 'academy.view',
    executiveIntent: 'Candidate scoring, document readiness, interview decision and approval workflow.',
    managementMission: 'Operate eligibility with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Capture profile',
    fields: [
    { name: 'full_name', label: 'Candidate full name', type: 'text', required: true, placeholder: 'Example: Hajar Jarlamane' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+212...' },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Rabat, Temara, Casablanca...' },
    { name: 'source', label: 'Source', type: 'select', options: ['Meta Ads', 'Referral', 'School Partner', 'Walk-in', 'WhatsApp', 'Existing Client'] },
    { name: 'eligibility_status', label: 'Eligibility status', type: 'select', options: ['pending', 'prequalified', 'approved', 'rejected', 'needs_documents'] },
    { name: 'notes', label: 'Eligibility notes', type: 'textarea', placeholder: 'Interview, documents, constraints, profile quality...' }
  ],
    workflow: ['Capture profile', 'Score documents', 'Interview decision', 'Approve/reject', 'Convert to enrollment'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'payments',
    title: 'Payments',
    shortTitle: 'Payments',
    href: '/academy/payments',
    icon: '💳',
    table: 'academy_payments',
    permission: 'academy.view',
    executiveIntent: 'Payment status, installments, overdue risk, finance follow-up and receipts control.',
    managementMission: 'Operate payments with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Create payment record',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', placeholder: 'Paste trainee UUID' },
    { name: 'amount', label: 'Amount MAD', type: 'number', required: true, placeholder: '1500' },
    { name: 'method', label: 'Payment method', type: 'select', options: ['cash', 'bank_transfer', 'card', 'installment', 'partner_invoice'] },
    { name: 'status', label: 'Payment status', type: 'select', options: ['pending', 'paid', 'partial', 'overdue', 'refunded'] },
    { name: 'due_at', label: 'Due date/time', type: 'datetime-local' },
    { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Receipt or internal reference' }
  ],
    workflow: ['Create payment record', 'Track installments', 'Detect overdue', 'Finance follow-up', 'Release certificate eligibility'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "attendance", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'locations-groups',
    title: 'Locations & Group Dispatch',
    shortTitle: 'Locations & Group Dispatch',
    href: '/academy/locations-groups',
    icon: '🏫',
    table: 'academy_groups',
    permission: 'academy.view',
    executiveIntent: 'Training locations, city capacity, group dispatch, course/trainer allocation and schedule readiness.',
    managementMission: 'Operate locations & group dispatch with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Plan location',
    fields: [
    { name: 'name', label: 'Group name', type: 'text', required: true, placeholder: 'Rabat Garde Enfants Cohort A' },
    { name: 'course_id', label: 'Course ID', type: 'text', placeholder: 'Paste course UUID' },
    { name: 'trainer_id', label: 'Trainer ID', type: 'text', placeholder: 'Paste trainer UUID' },
    { name: 'location', label: 'Location label', type: 'text', placeholder: 'Rabat Training Center' },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'end_date', label: 'End date', type: 'date' },
    { name: 'max_capacity', label: 'Max capacity', type: 'number', placeholder: '20' },
    { name: 'status', label: 'Group status', type: 'select', options: ['planned', 'open', 'active', 'full', 'completed', 'cancelled'] }
  ],
    workflow: ['Plan location', 'Assign course/trainer', 'Control capacity', 'Dispatch trainees', 'Monitor delivery'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'trainers',
    title: 'Trainers Management',
    shortTitle: 'Trainers Management',
    href: '/academy/trainers',
    icon: '👩‍🏫',
    table: 'academy_trainers',
    permission: 'academy.view',
    executiveIntent: 'Trainer registry, specialties, workload, quality control and assignment governance.',
    managementMission: 'Operate trainers management with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Register trainer',
    fields: [
    { name: 'full_name', label: 'Trainer full name', type: 'text', required: true, placeholder: 'Trainer name' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+212...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'trainer@...' },
    { name: 'specialty', label: 'Specialty', type: 'text', placeholder: 'Childcare, postpartum, special needs...' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'standby', 'busy', 'inactive'] },
    { name: 'notes', label: 'Quality / workload notes', type: 'textarea' }
  ],
    workflow: ['Register trainer', 'Classify specialty', 'Assign groups', 'Monitor workload', 'Quality review'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'courses',
    title: 'Training Courses',
    shortTitle: 'Training Courses',
    href: '/academy/courses',
    icon: '📚',
    table: 'academy_courses',
    permission: 'academy.view',
    executiveIntent: 'Course catalog, levels, duration, price, competency structure and operational readiness.',
    managementMission: 'Operate training courses with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Design course',
    fields: [
    { name: 'title', label: 'Course title', type: 'text', required: true, placeholder: 'Premium childcare foundations' },
    { name: 'category', label: 'Category', type: 'select', options: ['Childcare', 'Postpartum', 'Special Needs', 'Flashcards', 'School Support', 'Sales & Care'] },
    { name: 'level', label: 'Level', type: 'select', options: ['foundation', 'intermediate', 'advanced', 'elite'] },
    { name: 'duration_hours', label: 'Duration hours', type: 'number', placeholder: '24' },
    { name: 'price', label: 'Price MAD', type: 'number', placeholder: '2500' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'paused', 'archived'] },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Competencies, outcomes, evaluation method...' }
  ],
    workflow: ['Design course', 'Set duration/price', 'Activate module', 'Measure readiness', 'Archive/upgrade'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'calendar',
    title: 'Calendar Management',
    shortTitle: 'Calendar Management',
    href: '/academy/calendar',
    icon: '🗓️',
    table: 'academy_sessions',
    permission: 'academy.view',
    executiveIntent: 'Training calendar, upcoming sessions, deadlines, group rhythm and manager planning.',
    managementMission: 'Operate calendar management with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Create session',
    fields: [
    { name: 'group_id', label: 'Group ID', type: 'text', placeholder: 'Paste group UUID' },
    { name: 'title', label: 'Session title', type: 'text', required: true, placeholder: 'Practical evaluation session' },
    { name: 'starts_at', label: 'Start date/time', type: 'datetime-local', required: true },
    { name: 'ends_at', label: 'End date/time', type: 'datetime-local' },
    { name: 'status', label: 'Status', type: 'select', options: ['planned', 'confirmed', 'delivered', 'cancelled'] },
    { name: 'notes', label: 'Session notes', type: 'textarea' }
  ],
    workflow: ['Create session', 'Confirm trainer/location', 'Notify trainees', 'Mark delivery', 'Feed attendance'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'attendance',
    title: 'Attendance Management',
    shortTitle: 'Attendance Management',
    href: '/academy/attendance',
    icon: '📍',
    table: 'academy_attendance',
    permission: 'academy.view',
    executiveIntent: 'Presence, absence, lateness, discipline tracking and attendance risk control.',
    managementMission: 'Operate attendance management with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Select group/session',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', required: true, placeholder: 'Paste trainee UUID' },
    { name: 'group_id', label: 'Group ID', type: 'text', placeholder: 'Paste group UUID' },
    { name: 'session_date', label: 'Session date', type: 'date', required: true },
    { name: 'status', label: 'Attendance status', type: 'select', options: ['present', 'absent', 'late', 'excused', 'discipline_review'] },
    { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Reason, trainer note, corrective action...' }
  ],
    workflow: ['Select group/session', 'Mark presence', 'Flag absence', 'Manager note', 'Risk follow-up'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'trainees',
    title: 'Trainee Permanent Folder',
    shortTitle: 'Trainee Permanent Folder',
    href: '/academy/trainees',
    icon: '🗂️',
    table: 'academy_trainees',
    permission: 'academy.view',
    executiveIntent: 'Permanent trainee profile, serial number, documents, notes, progress and lifecycle history.',
    managementMission: 'Operate trainee permanent folder with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Create permanent folder',
    fields: [
    { name: 'serial_number', label: 'Serial number', type: 'text', placeholder: 'Leave blank for manual/auto policy' },
    { name: 'full_name', label: 'Full name', type: 'text', required: true, placeholder: 'Trainee name' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+212...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'candidate@email.com' },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Rabat, Temara...' },
    { name: 'status', label: 'Lifecycle status', type: 'select', options: ['prospect', 'candidate', 'eligible', 'enrolled', 'active', 'certified', 'placed', 'upsell', 'inactive'] },
    { name: 'eligibility_status', label: 'Eligibility', type: 'select', options: ['pending', 'prequalified', 'approved', 'rejected', 'needs_documents'] },
    { name: 'notes', label: 'Permanent profile notes', type: 'textarea', placeholder: 'Documents, behavior, strengths, risk, future assignment...' }
  ],
    workflow: ['Create permanent folder', 'Assign serial', 'Track lifecycle', 'Store notes', 'Prepare certificate/placement'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["enrollments", "payments", "attendance", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'certificates',
    title: 'Certificates & Authenticity',
    shortTitle: 'Certificates & Authenticity',
    href: '/academy/certificates',
    icon: '🏅',
    table: 'academy_certificates',
    permission: 'academy.view',
    executiveIntent: 'Certificate issuance, serial number, verification hash, compliance record and authenticity controls.',
    managementMission: 'Operate certificates & authenticity with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Validate trainee/course',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', required: true, placeholder: 'Paste trainee UUID' },
    { name: 'course_id', label: 'Course ID', type: 'text', placeholder: 'Paste course UUID' },
    { name: 'certificate_number', label: 'Certificate number', type: 'text', placeholder: 'ACAD-2026-0001' },
    { name: 'serial_number', label: 'Trainee serial number', type: 'text', placeholder: 'AC-TR-...' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'issued', 'blocked', 'revoked', 'reissued'] },
    { name: 'verification_hash', label: 'Verification hash', type: 'text', placeholder: 'Optional authenticity hash' }
  ],
    workflow: ['Validate trainee/course', 'Create certificate number', 'Generate hash', 'Issue certificate', 'Verify authenticity'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'graduation',
    title: 'Graduation & Upsell',
    shortTitle: 'Graduation & Upsell',
    href: '/academy/graduation',
    icon: '🎓',
    table: 'academy_graduation_followups',
    permission: 'academy.view',
    executiveIntent: 'Graduation readiness, post-training opportunities, placement, upsell and alumni follow-up.',
    managementMission: 'Operate graduation & upsell with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Check readiness',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', required: true, placeholder: 'Paste trainee UUID' },
    { name: 'certificate_id', label: 'Certificate ID', type: 'text', placeholder: 'Paste certificate UUID' },
    { name: 'opportunity_type', label: 'Opportunity type', type: 'select', options: ['internal_duty', 'school_partner', 'family_assignment', 'advanced_training', 'upsell_package', 'watchlist'] },
    { name: 'partner_id', label: 'Partner ID', type: 'text', placeholder: 'Partner UUID' },
    { name: 'status', label: 'Follow-up status', type: 'select', options: ['open', 'qualified', 'assigned', 'placed', 'upsold', 'closed', 'lost'] },
    { name: 'next_action', label: 'Next action', type: 'text', placeholder: 'Call, dispatch, interview, upsell...' },
    { name: 'next_action_at', label: 'Next action date/time', type: 'datetime-local' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ],
    workflow: ['Check readiness', 'Classify opportunity', 'Partner dispatch', 'Upsell follow-up', 'Close outcome'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'partners',
    title: 'Academy Partners',
    shortTitle: 'Academy Partners',
    href: '/academy/partners',
    icon: '🤝',
    table: 'academy_partners',
    permission: 'academy.view',
    executiveIntent: 'School, nursery, family and professional partner registry, placement opportunity and relationship pipeline.',
    managementMission: 'Operate academy partners with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Register partner',
    fields: [
    { name: 'name', label: 'Partner name', type: 'text', required: true, placeholder: 'School, nursery, institution, client partner' },
    { name: 'type', label: 'Partner type', type: 'select', options: ['school', 'nursery', 'family_network', 'professional_partner', 'training_location', 'recruitment_partner'] },
    { name: 'city', label: 'City', type: 'text', placeholder: 'Rabat' },
    { name: 'contact_name', label: 'Contact name', type: 'text', placeholder: 'Director / coordinator' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+212...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'partner@email.com' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'prospect', 'negotiation', 'paused', 'inactive'] },
    { name: 'notes', label: 'Partner notes', type: 'textarea', placeholder: 'Needs, potential volume, conditions...' }
  ],
    workflow: ['Register partner', 'Classify need', 'Map city/service', 'Create placement pipeline', 'Review relationship'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
  {
    key: 'alerts-sales',
    title: 'Alerts, Reminders, Sales & After-Sales',
    shortTitle: 'Alerts, Reminders, Sales & After-Sales',
    href: '/academy/alerts-sales',
    icon: '🚨',
    table: 'academy_sales_pipeline',
    permission: 'academy.view',
    executiveIntent: 'Alerts, reminders, sales pipeline, callbacks, after-sales actions and recovery opportunities.',
    managementMission: 'Operate alerts, reminders, sales & after-sales with traceable controls, stored workflows, classification, evidence and manager-ready follow-up for AngelCare Academy.',
    primaryAction: 'Create lead/reminder',
    fields: [
    { name: 'trainee_id', label: 'Trainee ID', type: 'text', placeholder: 'Optional trainee UUID' },
    { name: 'source', label: 'Lead source', type: 'select', options: ['Meta Ads', 'WhatsApp', 'Partner', 'Referral', 'Existing Client', 'Academy Event'] },
    { name: 'stage', label: 'Stage', type: 'select', options: ['lead', 'contacted', 'qualified', 'proposal', 'payment_pending', 'won', 'lost', 'after_sales'] },
    { name: 'value', label: 'Estimated value MAD', type: 'number', placeholder: '2500' },
    { name: 'next_action', label: 'Next action', type: 'text', placeholder: 'Call, WhatsApp, payment reminder, placement follow-up...' },
    { name: 'next_action_at', label: 'Next action date/time', type: 'datetime-local' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'won', 'lost', 'sleeping', 'after_sales'] }
  ],
    workflow: ['Create lead/reminder', 'Assign next action', 'Track stage', 'Recover revenue', 'After-sales follow-up'],
    kpis: ['Open records','Critical risks','Next actions','Conversion impact'],
    related: ["trainees", "enrollments", "payments", "administration"],
    riskRules: ['No stale files without next action','Every record needs a clear owner/status','Critical Academy data must be traceable and certificate-safe'],
  },
]

export function getAcademyModule(key: AcademyModuleKey) {
  return ACADEMY_MODULES.find((module) => module.key === key) || ACADEMY_MODULES[0]
}

export const ACADEMY_STATUS_TONES: Record<string, string> = {
  prospect: '#64748b', candidate: '#7c3aed', eligible: '#2563eb', enrolled: '#0891b2', active: '#16a34a', certified: '#ca8a04', placed: '#059669', upsell: '#db2777', inactive: '#475569',
  pending: '#f59e0b', paid: '#16a34a', partial: '#0891b2', overdue: '#dc2626', refunded: '#64748b',
  planned: '#2563eb', open: '#0891b2', full: '#7c3aed', completed: '#16a34a', cancelled: '#dc2626',
  present: '#16a34a', absent: '#dc2626', late: '#f59e0b', excused: '#64748b', discipline_review: '#7c2d12',
  issued: '#16a34a', draft: '#64748b', blocked: '#dc2626', revoked: '#7f1d1d', reissued: '#7c3aed',
  won: '#16a34a', lost: '#dc2626', sleeping: '#64748b', after_sales: '#db2777', qualified: '#2563eb', contacted: '#0891b2', proposal: '#7c3aed', payment_pending: '#f59e0b'
}
