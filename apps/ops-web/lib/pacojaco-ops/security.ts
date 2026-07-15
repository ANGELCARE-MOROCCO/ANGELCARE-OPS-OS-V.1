import type { PacojacoDocumentRow } from './types'

const ALLOWED_ROLES = new Set([
  'ceo',
  'admin',
  'commercial',
  'super_admin',
  'superadmin',
  'direction',
  'finance',
])

const ALLOWED_PERMISSIONS = new Set([
  'pacojaco_ops',
  'pacojaco_ops:read',
  'pacojaco_ops:write',
  'invoices:manage',
  'quotations:manage',
  'billing.manage',
  'billing.view',
  'print.create',
  'print.view',
  'sales.manage',
  'sales.view',
])

function normalizeText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map((item) => normalizeText(item)).filter(Boolean)
    } catch {}
    return value.split(',').map((item) => normalizeText(item)).filter(Boolean)
  }
  return []
}

export function hasPacojacoOpsAccess(user: any) {
  if (!user) return false

  const role = normalizeText(user.role || user.role_key || user.app_role)
  const permissions = normalizePermissions(user.permissions)

  if (ALLOWED_ROLES.has(role)) return true
  if (permissions.some((permission) => ALLOWED_PERMISSIONS.has(permission))) return true

  return false
}

export function normalizePacojacoUser(user: any) {
  return {
    id: user?.id ? String(user.id) : null,
    email: String(user?.email || user?.work_email || user?.username || '').trim().toLowerCase() || null,
    role: normalizeText(user?.role || user?.role_key || user?.app_role),
    permissions: normalizePermissions(user?.permissions),
  }
}

export function summarizePacojacoDocument(doc: PacojacoDocumentRow | null | undefined) {
  if (!doc) return null

  return {
    id: doc.id,
    document_type: doc.document_type,
    document_number: doc.document_number,
    status: doc.status,
    client_name: doc.client_name,
    object: doc.object,
    total_ttc: doc.total_ttc,
    remaining_amount: doc.remaining_amount,
    currency: doc.currency,
    updated_at: doc.updated_at,
  }
}

