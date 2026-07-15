export type ServiceOSRole = 'ceo' | 'admin' | 'operations' | 'finance' | 'hr' | 'academy' | 'city_manager' | 'viewer'
export type ServiceOSCapability = 'serviceos.read' | 'serviceos.write' | 'serviceos.price' | 'serviceos.assign' | 'serviceos.incident' | 'serviceos.strategy' | 'serviceos.admin'
const matrix: Record<ServiceOSRole, ServiceOSCapability[]> = {
  ceo:['serviceos.read','serviceos.write','serviceos.price','serviceos.assign','serviceos.incident','serviceos.strategy','serviceos.admin'],
  admin:['serviceos.read','serviceos.write','serviceos.price','serviceos.assign','serviceos.incident','serviceos.admin'],
  operations:['serviceos.read','serviceos.assign','serviceos.incident','serviceos.write'],
  finance:['serviceos.read','serviceos.price'],
  hr:['serviceos.read','serviceos.assign'],
  academy:['serviceos.read','serviceos.write'],
  city_manager:['serviceos.read','serviceos.assign','serviceos.incident'],
  viewer:['serviceos.read'],
}
export function canServiceOS(role: ServiceOSRole, capability: ServiceOSCapability) { return matrix[role]?.includes(capability) || false }
export function requireServiceOS(role: ServiceOSRole, capability: ServiceOSCapability) { if (!canServiceOS(role, capability)) throw new Error(`Missing ServiceOS capability: ${capability}`) }
