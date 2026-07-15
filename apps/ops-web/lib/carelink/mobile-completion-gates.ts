import { loadMissionChecklist, loadMissionProgramActivityLogs, loadMissionReport, loadMissionReportCorrections, missionPresenceProofReadyForCompletion, missionReportValidationReadyForCompletion } from '@/lib/carelink/mobile-persistence'
import { getMissionDossier } from '@/lib/missions/repository'

const CARELINK_REPORT_CORRECTION_REQUIRED_CODE = 'carelink_report_correction_required'
const CARELINK_REPORT_VALIDATION_REQUIRED_CODE = 'carelink_report_validation_required'

type CompletionGateInput = {
  missionId: number
  caregiverId: number
  serviceType?: string | null
  mission?: Record<string, any> | null
}

export type CareLinkCompletionGateResult = {
  allowed: boolean
  serviceType: string | null
  checklist: {
    total: number
    required: number
    completed: number
    missingRequired: unknown[]
    progress: number
  }
  report: {
    exists: boolean
    status: string
    ready: boolean
    validationStatus: string
    correctionStatus: string
    correctionRequired: boolean
  }
  program: {
    total: number
    required: number
    completed: number
    missingRequired: unknown[]
    progress: number
  }
  presence: {
    ready: boolean
    hasCheckIn: boolean
    hasCheckOut: boolean
    proofCount: number
  }
  blockers: Array<{ code: string; message: string; details?: unknown }>
}

function cleanString(value: unknown) {
  return String(value || '').trim()
}

function normalizeLower(value: unknown) {
  return cleanString(value).toLowerCase()
}

function programLineId(line: Record<string, any>, index: number) {
  return String(line.id || line.activity_id || line.program_line_id || line.code || line.reference || `program-line-${index + 1}`)
}

function programLineRequired(line: Record<string, any>) {
  const raw = normalizeLower(line.required || line.is_required || line.mandatory || line.requirement || line.priority)
  return line.required === true || line.is_required === true || line.mandatory === true || ['required', 'mandatory', 'obligatoire', 'must'].some((word) => raw.includes(word))
}

export async function evaluateCareLinkCompletionGates(input: CompletionGateInput): Promise<CareLinkCompletionGateResult> {
  const dossier = await getMissionDossier(input.missionId)
  const serviceType = input.serviceType || dossier?.raw?.service_type || dossier?.mission?.serviceType || null
  const checklist = await loadMissionChecklist(input.missionId, serviceType, input.caregiverId)
  const required = checklist.filter((item) => item.required)
  const completed = checklist.filter((item) => item.completed)
  const missingRequired = required.filter((item) => !item.completed)
  const report = await loadMissionReport(input.missionId)
  const reportCorrections = await loadMissionReportCorrections(input.missionId, input.caregiverId)
  const reportStatus = normalizeLower(input.mission?.report_status || report?.status || '')
  const reportValidationStatus = normalizeLower(report?.validationStatus || input.mission?.validation_status || '')
  const reportCorrectionStatus = normalizeLower(report?.correctionStatus || '')
  const reportReady = ['submitted', 'validated', 'ready', 'resubmitted'].includes(reportStatus) || ['ready', 'validated'].includes(reportValidationStatus)
  const validationGate = missionReportValidationReadyForCompletion(report, reportCorrections, input.mission)
  const programLines = (dossier?.programLines || []) as Array<Record<string, any>>
  const requiredProgramLines = programLines
    .map((line, index) => ({ ...line, __activityId: programLineId(line, index) }))
    .filter((line) => programLineRequired(line))
  const programLogs = await loadMissionProgramActivityLogs(input.missionId, input.caregiverId)
  const completedProgramIds = new Set(programLogs
    .filter((log) => ['completed', 'done', 'validated'].includes(normalizeLower(log.status)))
    .map((log) => String(log.activityId)))
  const missingRequiredProgram = requiredProgramLines.filter((line) => !completedProgramIds.has(String(line.__activityId)))
  const presenceGate = await missionPresenceProofReadyForCompletion(input.missionId, input.caregiverId)
  const blockers: CareLinkCompletionGateResult['blockers'] = []

  if (missingRequired.length) {
    blockers.push({
      code: 'carelink_required_checklist_missing',
      message: 'La checklist obligatoire doit être complétée avant la clôture.',
      details: missingRequired,
    })
  }

  if (missingRequiredProgram.length) {
    blockers.push({
      code: 'carelink_required_program_activity_missing',
      message: 'Les activités obligatoires du programme doivent être terminées avant la clôture.',
      details: missingRequiredProgram,
    })
  }


  if (!presenceGate.ready) {
    blockers.push({
      code: 'carelink_presence_proof_required',
      message: 'Le check-in et le check-out présence doivent être enregistrés avant la clôture.',
      details: { hasCheckIn: presenceGate.hasCheckIn, hasCheckOut: presenceGate.hasCheckOut },
    })
  }

  if (!reportReady) {
    blockers.push({
      code: 'carelink_report_required_before_completion',
      message: 'Le rapport de mission doit être soumis avant la clôture.',
      details: { reportStatus: reportStatus || 'missing' },
    })
  }

  if (!validationGate.ready) {
    const validationBlockerCode = validationGate.code === CARELINK_REPORT_CORRECTION_REQUIRED_CODE
      ? CARELINK_REPORT_CORRECTION_REQUIRED_CODE
      : validationGate.code === CARELINK_REPORT_VALIDATION_REQUIRED_CODE
        ? CARELINK_REPORT_VALIDATION_REQUIRED_CODE
        : validationGate.code
    blockers.push({
      code: validationBlockerCode,
      message: validationGate.message,
      details: { reportStatus: reportStatus || 'missing', validationStatus: reportValidationStatus || 'pending', correctionStatus: reportCorrectionStatus || 'none', activeCorrection: validationGate.activeCorrection || null },
    })
  }

  return {
    allowed: blockers.length === 0,
    serviceType,
    checklist: {
      total: checklist.length,
      required: required.length,
      completed: completed.length,
      missingRequired,
      progress: checklist.length ? Math.round((completed.length / checklist.length) * 100) : 0,
    },
    report: {
      exists: Boolean(report),
      status: reportStatus || 'missing',
      ready: reportReady && validationGate.ready,
      validationStatus: reportValidationStatus || 'pending',
      correctionStatus: reportCorrectionStatus || 'none',
      correctionRequired: Boolean(report?.correctionRequired),
    },
    program: {
      total: programLines.length,
      required: requiredProgramLines.length,
      completed: completedProgramIds.size,
      missingRequired: missingRequiredProgram,
      progress: programLines.length ? Math.round((programLogs.filter((log) => ['completed', 'done', 'validated'].includes(normalizeLower(log.status))).length / programLines.length) * 100) : 0,
    },
    presence: {
      ready: presenceGate.ready,
      hasCheckIn: presenceGate.hasCheckIn,
      hasCheckOut: presenceGate.hasCheckOut,
      proofCount: presenceGate.proofs.length,
    },
    blockers,
  }
}

export function firstCareLinkCompletionBlocker(result: CareLinkCompletionGateResult) {
  return result.blockers[0] || null
}
