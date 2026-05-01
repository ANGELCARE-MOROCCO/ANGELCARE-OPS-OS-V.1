export function makeHrReportReference(type: string) {
  const year = new Date().getFullYear()
  const stamp = Date.now().toString().slice(-6)
  return `HR-${type.toUpperCase()}-${year}-${stamp}`
}

export const HR_BOARD_REPORTS = [
  {
    type: 'board_pack',
    title: 'HR Board Pack',
    description: 'Executive workforce, risk, readiness, compliance and hiring pressure report.',
  },
  {
    type: 'workforce_gap',
    title: 'Workforce Gap Report',
    description: 'City/service staffing gaps, coverage exposure and recommended hiring waves.',
  },
  {
    type: 'compliance_exposure',
    title: 'Compliance Exposure Report',
    description: 'Missing documents, blocked profiles and deployment restrictions.',
  },
  {
    type: 'readiness_scorecard',
    title: 'Readiness Scorecard',
    description: 'Ready, blocked, training-required and deployable talent overview.',
  },
  {
    type: 'incident_governance',
    title: 'Incident Governance Report',
    description: 'Incident volume, severity, owner status, corrective actions and closure quality.',
  },
  {
    type: 'academy_bridge',
    title: 'Academy Bridge Report',
    description: 'Training pipeline, certification dependency and HR-to-Academy transition status.',
  },
]
