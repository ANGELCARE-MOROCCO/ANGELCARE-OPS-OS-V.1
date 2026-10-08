// SANILA Master Demo business clock. Security and audit clocks must not use this helper.
export const SANILA_MASTER_DEMO_SCHOOL_ID = '8bc47614-f16c-41c0-8d37-22fe78b08cad'
export const SANILA_MASTER_DEMO_BUSINESS_INSTANT = '2027-02-17T10:37:00Z'

type TrustedBusinessClockContext = {
  school?: { id: string; timezone?: string | null } | null
  demoAccess?: { schoolId: string } | null
}

export type SanilaBusinessClock = {
  instant: Date
  date: string
  timezone: string
  simulated: boolean
}

export function getSanilaBusinessClock(context?: TrustedBusinessClockContext | null): SanilaBusinessClock {
  const isTrustedMasterDemo = Boolean(
    context?.demoAccess
      && context.school?.id === SANILA_MASTER_DEMO_SCHOOL_ID
      && context.demoAccess.schoolId === context.school.id,
  )
  const timezone = context?.school?.timezone || 'Africa/Casablanca'
  const instant = isTrustedMasterDemo ? new Date(SANILA_MASTER_DEMO_BUSINESS_INSTANT) : new Date()
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(instant)
  return { instant, date, timezone, simulated: isTrustedMasterDemo }
}

export function getSanilaBusinessDate(context?: TrustedBusinessClockContext | null) {
  return getSanilaBusinessClock(context).date
}
