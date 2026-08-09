import 'server-only'

export const SOLUTIONS_TENANT_KEY = 'angelcare-internal'
export const SOLUTIONS_VIEW_PREFIX = 'fc_os_'
export const SOLUTIONS_HARD_MAX_SCENARIOS = 10
export const SOLUTIONS_HARD_MAX_COLLECTIONS = 24

function integerEnv(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)))
}

export function solutionsEnvironment() {
  return {
    maximumScenarios: Math.min(SOLUTIONS_HARD_MAX_SCENARIOS, integerEnv(process.env.FLASHCARDS_OS_MAX_SOLUTION_SCENARIOS, 10, 1, 10)),
    maximumJourneyPlans: Math.min(SOLUTIONS_HARD_MAX_SCENARIOS, integerEnv(process.env.FLASHCARDS_OS_MAX_JOURNEY_SCENARIOS, 10, 1, 10)),
    maximumCollections: integerEnv(process.env.FLASHCARDS_OS_MAX_COLLECTIONS_PER_SOLUTION, 12, 1, SOLUTIONS_HARD_MAX_COLLECTIONS),
    maximumJourneyDays: integerEnv(process.env.FLASHCARDS_OS_MAX_JOURNEY_DAYS, 90, 1, 365),
    maximumSessionsPerDay: integerEnv(process.env.FLASHCARDS_OS_MAX_SESSIONS_PER_DAY, 5, 1, 12),
    maximumMinutesPerSession: integerEnv(process.env.FLASHCARDS_OS_MAX_MINUTES_PER_SESSION, 120, 5, 240),
  }
}

export function clampScenarioCount(value: number, journey = false) {
  const env = solutionsEnvironment()
  const ceiling = journey ? env.maximumJourneyPlans : env.maximumScenarios
  return Math.min(ceiling, Math.max(1, Math.round(Number(value) || 1)))
}
