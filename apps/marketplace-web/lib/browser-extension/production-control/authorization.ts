import { isExtensionAdmin } from '../access'
export function assertProductionAdministrator(user: any) {
  if (!user || !isExtensionAdmin(user)) throw Object.assign(new Error('PRODUCTION_ADMIN_REQUIRED'), { status: 403 })
}
