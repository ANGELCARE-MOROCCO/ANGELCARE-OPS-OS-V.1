import type { Angelcare360SessionUser } from '@/types/angelcare360/module'

export type Angelcare360DemoPrincipalContext = {
  isDemo: boolean
  schoolId: string | null
  grantId: string | null
  inquiryId: string | null
  expiresAt: string | null
}

export type Angelcare360DemoAccess = {
  schoolId: string
  grantId: string
  inquiryId: string | null
  expiresAt: string
}

type RawPrincipal = Partial<Angelcare360SessionUser> & Record<string, unknown>

function principalRecord(value: unknown): RawPrincipal | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RawPrincipal : null
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function extractTrustedAngelcare360DemoPrincipalContext(rawPrincipal: unknown): Angelcare360DemoPrincipalContext {
  const principal = principalRecord(rawPrincipal)
  if (!principal || principal.__demo !== true) {
    return { isDemo: false, schoolId: null, grantId: null, inquiryId: null, expiresAt: null }
  }

  return {
    isDemo: true,
    schoolId: optionalText(principal.__demoSchoolId),
    grantId: optionalText(principal.__demoGrantId),
    inquiryId: optionalText(principal.__demoInquiryId),
    expiresAt: optionalText(principal.__demoExpiresAt),
  }
}

export function buildAngelcare360DemoAccess(context: Angelcare360DemoPrincipalContext): Angelcare360DemoAccess | null {
  if (!context.isDemo || !context.schoolId || !context.grantId || !context.expiresAt) return null
  return {
    schoolId: context.schoolId,
    grantId: context.grantId,
    inquiryId: context.inquiryId,
    expiresAt: context.expiresAt,
  }
}

export function resolveAngelcare360PrincipalSchoolAuthority(input: {
  demoContext: Angelcare360DemoPrincipalContext
  supportSchoolId?: string | null
  requestedSchoolId?: string | null
}): { ok: true; schoolId: string | null } | { ok: false; code: 'DEMO_CONTEXT_MISMATCH' } {
  const { demoContext } = input
  if (!demoContext.isDemo) {
    return { ok: true, schoolId: input.supportSchoolId || input.requestedSchoolId || null }
  }

  if (!demoContext.schoolId || !demoContext.grantId || !demoContext.expiresAt) {
    return { ok: false, code: 'DEMO_CONTEXT_MISMATCH' }
  }
  if (input.supportSchoolId && input.supportSchoolId !== demoContext.schoolId) {
    return { ok: false, code: 'DEMO_CONTEXT_MISMATCH' }
  }
  if (input.requestedSchoolId && input.requestedSchoolId !== demoContext.schoolId) {
    return { ok: false, code: 'DEMO_CONTEXT_MISMATCH' }
  }

  return { ok: true, schoolId: demoContext.schoolId }
}
