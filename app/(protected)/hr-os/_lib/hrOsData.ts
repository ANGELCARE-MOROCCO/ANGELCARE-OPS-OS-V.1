export type HrModuleKey =
  | 'command'
  | 'recruitment'
  | 'talent-dna'
  | 'readiness'
  | 'allocation'
  | 'compliance'
  | 'performance'
  | 'incidents'
  | 'academy'
  | 'reports'

export const HR_MODULES: Record<HrModuleKey, any> = {
  command: {
    title: 'HR-OS Command Center',
    subtitle: 'Executive people operations cockpit for staffing, readiness, compliance and deployment.',
    kpis: [['Open Actions', 12, '#2563eb'], ['Deployment Blockers', 4, '#ef4444'], ['Ready Profiles', 31, '#16a34a'], ['Compliance Alerts', 7, '#f59e0b']],
    priorities: ['Resolve missing compliance files', 'Prepare next recruitment sprint', 'Review high-risk incidents'],
    workflow: ['Demand signal', 'Recruitment sprint', 'Validation', 'Readiness', 'Deployment'],
    risks: ['Compliance gaps', 'City staffing shortage', 'Training backlog'],
  },
  recruitment: {
    title: 'Recruitment Sprint Control',
    subtitle: 'Source, qualify, interview and move candidates into Academy or readiness tracks.',
    kpis: [['Candidates', 48, '#2563eb'], ['Interviews', 11, '#7c3aed'], ['Qualified', 19, '#16a34a'], ['Rejected', 6, '#ef4444']],
    priorities: ['Call new candidates', 'Schedule interviews', 'Validate profile fit'],
    workflow: ['Source', 'Screen', 'Interview', 'Qualify', 'Route to Academy'],
    risks: ['No-show interviews', 'Incomplete profile', 'Low city coverage'],
  },
  'talent-dna': {
    title: 'Talent DNA',
    subtitle: 'Skills, cities, languages, availability, personality fit and service readiness mapping.',
    kpis: [['Mapped Profiles', 67, '#2563eb'], ['High Fit', 24, '#16a34a'], ['Risk Profiles', 5, '#ef4444'], ['Missing Data', 13, '#f59e0b']],
    priorities: ['Complete profile DNA', 'Classify skills', 'Identify mission fit'],
    workflow: ['Profile', 'Skills', 'Availability', 'Risk', 'Mission fit'],
    risks: ['Missing availability', 'Unclear skills', 'High risk match'],
  },
  readiness: {
    title: 'Readiness Control',
    subtitle: 'Operational readiness, deployment eligibility, coaching needs and blockers.',
    kpis: [['Ready', 31, '#16a34a'], ['Needs Coaching', 9, '#f59e0b'], ['Blocked', 6, '#ef4444'], ['Urgent', 3, '#7c3aed']],
    priorities: ['Validate ready profiles', 'Assign coaching', 'Escalate blockers'],
    workflow: ['Compliance', 'Training', 'Assessment', 'Ready', 'Deploy'],
    risks: ['Training missing', 'Document gap', 'Behavioral concern'],
  },
  allocation: {
    title: 'Allocation Command',
    subtitle: 'Match talent to missions based on city, skills, availability, risk and urgency.',
    kpis: [['Open Missions', 14, '#2563eb'], ['Matched', 9, '#16a34a'], ['Unassigned', 5, '#ef4444'], ['Urgent Gaps', 3, '#f59e0b']],
    priorities: ['Match urgent missions', 'Review city gaps', 'Confirm availability'],
    workflow: ['Mission need', 'Profile match', 'Confirm', 'Assign', 'Monitor'],
    risks: ['Wrong city', 'Overload', 'Urgent gap'],
  },
  compliance: {
    title: 'Compliance Gate',
    subtitle: 'Documents, validation, deployment blocking and audit-friendly HR controls.',
    kpis: [['Complete Files', 42, '#16a34a'], ['Missing Docs', 18, '#ef4444'], ['Blocked', 7, '#f59e0b'], ['Expiring', 5, '#7c3aed']],
    priorities: ['Request missing documents', 'Validate files', 'Block unsafe deployment'],
    workflow: ['Collect', 'Review', 'Validate', 'Block/Approve', 'Audit'],
    risks: ['Missing CIN', 'Expired document', 'Unvalidated record'],
  },
  performance: {
    title: 'Performance Control',
    subtitle: 'Quality, attendance, client feedback, incident patterns and retention risk.',
    kpis: [['Top Performers', 12, '#16a34a'], ['At Risk', 8, '#ef4444'], ['Feedbacks', 21, '#2563eb'], ['Reviews Due', 10, '#f59e0b']],
    priorities: ['Review low score profiles', 'Prepare coaching', 'Update performance status'],
    workflow: ['Feedback', 'Score', 'Coaching', 'Decision', 'Follow-up'],
    risks: ['Low rating', 'Repeated incident', 'Retention risk'],
  },
  incidents: {
    title: 'Incident Escalation',
    subtitle: 'Create, investigate, assign and close HR incidents with traceability.',
    kpis: [['Open Incidents', 6, '#ef4444'], ['Critical', 2, '#7f1d1d'], ['Under Review', 4, '#f59e0b'], ['Closed', 18, '#16a34a']],
    priorities: ['Assign incident owner', 'Document decision', 'Close resolved cases'],
    workflow: ['Report', 'Classify', 'Assign', 'Investigate', 'Close'],
    risks: ['No owner', 'No decision', 'Repeat pattern'],
  },
  academy: {
    title: 'Academy Bridge',
    subtitle: 'Move candidates into training, monitor certification and approve deployment.',
    kpis: [['In Training', 22, '#2563eb'], ['Certified', 16, '#16a34a'], ['Not Ready', 5, '#ef4444'], ['To Deploy', 8, '#7c3aed']],
    priorities: ['Send candidates to Academy', 'Check certificates', 'Approve deployment'],
    workflow: ['Candidate', 'Academy', 'Attendance', 'Certificate', 'Deploy'],
    risks: ['Training delay', 'Certificate missing', 'Attendance issue'],
  },
  reports: {
    title: 'HR Reports',
    subtitle: 'Management reporting, compliance exports and executive people metrics.',
    kpis: [['Reports Ready', 8, '#2563eb'], ['Exports', 14, '#7c3aed'], ['Audit Logs', 112, '#16a34a'], ['Pending Reviews', 5, '#f59e0b']],
    priorities: ['Generate HR report', 'Export compliance snapshot', 'Review audit history'],
    workflow: ['Filter', 'Generate', 'Review', 'Export', 'Log'],
    risks: ['Missing period', 'Unreviewed data', 'No export reason'],
  },
}
