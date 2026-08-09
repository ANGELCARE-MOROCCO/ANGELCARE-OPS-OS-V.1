export const PRODUCTION_RELEASE_CHANNELS = ['development','internal','pilot','stable','rollback'] as const
export const PRODUCTION_COMPONENTS = ['extension_runtime','service_worker','sidepanel','focus_mode','gateway','account_hydration','partner_hydration','management_hydration','adapter','controlled_automation','release_update'] as const
export const PRODUCTION_ADMIN_ACTIONS = [
  'feature_flag.set',
  'kill_switch.activate',
  'kill_switch.deactivate',
  'incident.create',
  'incident.transition',
  'release.promote',
  'release.mark_bad',
  'release.rollback',
  'device.channel_assign',
  'device.revoke',
] as const
export const PERFORMANCE_BUDGETS = {
  service_worker_wake: 800,
  sidepanel_cached_interactive: 1500,
  sidepanel_uncached_interactive: 2500,
  account_hydration: 3000,
  partner_hydration: 4000,
  management_hydration: 4000,
  focus_cached_startup: 2000,
  command_acknowledgement: 1500,
} as const
export const SENSITIVE_TELEMETRY_KEYS = new Set([
  'authorization','accessToken','refreshToken','token','password','secret','selectedText','messageBody','body','pageContent','rawPayload','html','conversation','emailBody'
])
