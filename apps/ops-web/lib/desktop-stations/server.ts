import crypto from "node:crypto"
import { NextRequest } from "next/server"
import { fail, governanceContext, ok, parseBody } from "@/lib/whatsapp-desktop/server"
import type { EffectiveStationPolicy, StationRow } from "@/lib/desktop-stations/types"

export { fail, governanceContext, ok, parseBody }

export const STATION_COMMANDS = new Set([
  "ENTER_STANDARD_MODE", "ENTER_FOCUS_MODE", "ENTER_LOCKED_MODE", "LOCK_NOW", "UNLOCK_TEMPORARILY", "RELOCK",
  "OPEN_URL", "OPEN_TAB_TEMPLATE", "CLOSE_CORPORATE_TABS", "CLOSE_SPECIFIC_TAB", "REFRESH_STATION_POLICY",
  "RELOAD_ACTIVE_TAB", "RESTART_BROWSER_RUNTIME", "RESTART_DESKTOP_RUNTIME", "CLEAR_CORPORATE_BROWSER_CACHE",
  "CLEAR_CORPORATE_BROWSER_DATA", "REQUEST_STATION_DIAGNOSTICS", "SHOW_ADMINISTRATOR_MESSAGE",
  "ROTATE_STATION_CREDENTIAL", "PROVISION_OFFLINE_RECOVERY",
])

export const DEFAULT_EFFECTIVE_POLICY: EffectiveStationPolicy = {
  name: "Politique standard ANGELCARE",
  mode: "standard",
  policy_version: 1,
  active: true,
  start_at_login: false,
  kiosk_enforcement: false,
  always_on_top: false,
  confirm_before_quit: true,
  restore_after_crash: true,
  relock_after_restart: true,
  relock_after_inactivity_minutes: 0,
  pin_required: true,
  exit_reason_required: false,
  offline_unlock_permitted: true,
  failed_attempt_threshold: 5,
  lockout_duration_minutes: 15,
  auto_relock_minutes: 15,
  restore_tabs: true,
  maximum_tabs: 8,
  clear_browser_data_on_logout: false,
  browser_history_retention_days: 30,
  browser_policy: {
    default_action: "deny",
    allowed_domains: ["opsmanagement.angelcarehub.com", "angelcarehub.com", "google.com", "www.google.com", "mail.google.com", "accounts.google.com"],
    blocked_domains: [],
    allowed_schemes: ["https:"],
    allowed_private_hosts: [],
    allow_google_search: true,
    allow_gmail: true,
    allow_microsoft_365: false,
    allow_popups: false,
    allow_downloads: true,
    download_confirmation_required: true,
    allow_uploads: true,
    allow_camera: false,
    allow_microphone: false,
    allow_notifications: true,
    allow_clipboard_read: false,
    allow_clipboard_write: true,
    allow_printing: false,
    allow_external_open: false,
    maximum_download_bytes: 262144000,
    blocked_extensions: [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".ps1", ".app", ".dmg", ".pkg"],
    permission_overrides: {},
  },
  tab_templates: [],
}

function clean(value: unknown, max = 1000) { return String(value ?? "").trim().slice(0, max) }
function normalizeMode(value: unknown) { return ["standard", "focus", "locked"].includes(String(value)) ? String(value) : "standard" }
function numberBetween(value: unknown, fallback: number, min: number, max: number) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback }
function object(value: unknown): StationRow { return value && typeof value === "object" && !Array.isArray(value) ? value as StationRow : {} }
function list(value: unknown): string[] { return Array.isArray(value) ? value.map((x) => clean(x, 300)).filter(Boolean) : [] }

export function sanitizeStationPolicy(body: StationRow, current: StationRow = {}) {
  return {
    browser_policy_id: clean(body.browser_policy_id ?? current.browser_policy_id, 80) || null,
    name: clean(body.name ?? current.name ?? "Politique Corporate Station", 180),
    description: clean(body.description ?? current.description, 2000) || null,
    mode: normalizeMode(body.mode ?? current.mode),
    start_at_login: Boolean(body.start_at_login ?? current.start_at_login),
    kiosk_enforcement: Boolean(body.kiosk_enforcement ?? current.kiosk_enforcement),
    always_on_top: Boolean(body.always_on_top ?? current.always_on_top),
    confirm_before_quit: Boolean(body.confirm_before_quit ?? current.confirm_before_quit ?? true),
    restore_after_crash: Boolean(body.restore_after_crash ?? current.restore_after_crash ?? true),
    relock_after_restart: Boolean(body.relock_after_restart ?? current.relock_after_restart ?? true),
    relock_after_inactivity_minutes: numberBetween(body.relock_after_inactivity_minutes ?? current.relock_after_inactivity_minutes, 0, 0, 1440),
    pin_required: Boolean(body.pin_required ?? current.pin_required ?? true),
    exit_reason_required: Boolean(body.exit_reason_required ?? current.exit_reason_required),
    offline_unlock_permitted: Boolean(body.offline_unlock_permitted ?? current.offline_unlock_permitted ?? true),
    failed_attempt_threshold: numberBetween(body.failed_attempt_threshold ?? current.failed_attempt_threshold, 5, 1, 20),
    lockout_duration_minutes: numberBetween(body.lockout_duration_minutes ?? current.lockout_duration_minutes, 15, 1, 1440),
    auto_relock_minutes: numberBetween(body.auto_relock_minutes ?? current.auto_relock_minutes, 15, 1, 1440),
    restore_tabs: Boolean(body.restore_tabs ?? current.restore_tabs ?? true),
    maximum_tabs: numberBetween(body.maximum_tabs ?? current.maximum_tabs, 8, 2, 50),
    clear_browser_data_on_logout: Boolean(body.clear_browser_data_on_logout ?? current.clear_browser_data_on_logout),
    browser_history_retention_days: numberBetween(body.browser_history_retention_days ?? current.browser_history_retention_days, 30, 0, 365),
    active: Boolean(body.active ?? current.active ?? true),
    security_flags: object(body.security_flags ?? current.security_flags),
  }
}

export function sanitizeBrowserPolicy(body: StationRow, current: StationRow = {}) {
  const action = ["allow", "deny"].includes(String(body.default_action ?? current.default_action)) ? String(body.default_action ?? current.default_action) : "deny"
  return {
    browser_policy_id: clean(body.browser_policy_id ?? current.browser_policy_id, 80) || null,
    name: clean(body.name ?? current.name ?? "Navigation Corporate", 180),
    default_action: action,
    allowed_domains: list(body.allowed_domains ?? current.allowed_domains),
    blocked_domains: list(body.blocked_domains ?? current.blocked_domains),
    allowed_schemes: list(body.allowed_schemes ?? current.allowed_schemes).length ? list(body.allowed_schemes ?? current.allowed_schemes) : ["https:"],
    allowed_private_hosts: list(body.allowed_private_hosts ?? current.allowed_private_hosts),
    allow_google_search: Boolean(body.allow_google_search ?? current.allow_google_search ?? true),
    allow_gmail: Boolean(body.allow_gmail ?? current.allow_gmail ?? true),
    allow_microsoft_365: Boolean(body.allow_microsoft_365 ?? current.allow_microsoft_365),
    allow_popups: Boolean(body.allow_popups ?? current.allow_popups),
    allow_downloads: Boolean(body.allow_downloads ?? current.allow_downloads ?? true),
    download_confirmation_required: Boolean(body.download_confirmation_required ?? current.download_confirmation_required ?? true),
    allow_uploads: Boolean(body.allow_uploads ?? current.allow_uploads ?? true),
    allow_camera: Boolean(body.allow_camera ?? current.allow_camera),
    allow_microphone: Boolean(body.allow_microphone ?? current.allow_microphone),
    allow_notifications: Boolean(body.allow_notifications ?? current.allow_notifications ?? true),
    allow_clipboard_read: Boolean(body.allow_clipboard_read ?? current.allow_clipboard_read),
    allow_clipboard_write: Boolean(body.allow_clipboard_write ?? current.allow_clipboard_write ?? true),
    allow_printing: Boolean(body.allow_printing ?? current.allow_printing),
    allow_external_open: Boolean(body.allow_external_open ?? current.allow_external_open),
    maximum_download_bytes: numberBetween(body.maximum_download_bytes ?? current.maximum_download_bytes, 262144000, 0, 2147483648),
    blocked_extensions: list(body.blocked_extensions ?? current.blocked_extensions),
    permission_overrides: object(body.permission_overrides ?? current.permission_overrides),
    browser_data_retention: object(body.browser_data_retention ?? current.browser_data_retention),
    active: Boolean(body.active ?? current.active ?? true),
  }
}

export function hashSecret(secret: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16)
  const digest = crypto.scryptSync(secret, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex")
  return { algorithm: "scrypt", salt: salt.toString("hex"), digest, work_factor: { N: 16384, r: 8, p: 1 } }
}

export function verifySecret(secret: string, credential: StationRow) {
  if (!credential?.secret_hash || !credential?.salt) return false
  const candidate = hashSecret(secret, String(credential.salt)).digest
  const expected = Buffer.from(String(credential.secret_hash), "hex")
  const actual = Buffer.from(candidate, "hex")
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

export async function stationDevice(context: any, installationId: string) {
  const { data } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("installation_id", installationId).maybeSingle()
  if (!data) return null
  if (data.current_user_id && data.current_user_id !== context.userId) return null
  return data
}


function nativeBrowserPolicy(row: StationRow, templates: StationRow[]) {
  const toMode = (allowed: unknown, ask = false) => Boolean(allowed) ? (ask ? "ask" : "allow") : "deny"
  const normalizedTemplates = templates.map((item) => ({ id: item.id, title: item.title, url: item.normalized_url, pinned: Boolean(item.pinned), mandatory: Boolean(item.mandatory), order: Number(item.position || 0), allowed_modes: Array.isArray(item.allowed_modes) ? item.allowed_modes : ["standard", "focus", "locked"] }))
  return {
    default_action: row.default_action === "allow" ? "allow" : "deny",
    allowed_domains: list(row.allowed_domains), blocked_domains: list(row.blocked_domains),
    allowed_schemes: list(row.allowed_schemes).length ? list(row.allowed_schemes) : ["https:"],
    allowed_private_hosts: list(row.allowed_private_hosts), include_subdomains: true,
    google_search_enabled: row.allow_google_search !== false, gmail_enabled: row.allow_gmail !== false, microsoft_365_enabled: Boolean(row.allow_microsoft_365),
    popups: row.allow_popups ? "internal-tab" : "deny", external_open: Boolean(row.allow_external_open),
    downloads: row.allow_downloads === false ? "deny" : row.download_confirmation_required === false ? "allow" : "confirm",
    uploads: row.allow_uploads === false ? "deny" : "allow", printing: row.allow_printing ? "allow" : "deny",
    clipboard_read: toMode(row.allow_clipboard_read), clipboard_write: toMode(row.allow_clipboard_write),
    camera: toMode(row.allow_camera, true), microphone: toMode(row.allow_microphone, true), notifications: toMode(row.allow_notifications, true),
    geolocation: "deny", fullscreen: "allow", maximum_download_bytes: numberBetween(row.maximum_download_bytes, 262144000, 1048576, 2147483648),
    safe_download_directory: "ANGELCARE Corporate Downloads", blocked_extensions: list(row.blocked_extensions),
    domain_permission_overrides: object(row.permission_overrides),
    default_tabs: normalizedTemplates.filter((item) => !item.pinned && !item.mandatory),
    pinned_tabs: normalizedTemplates.filter((item) => item.pinned && !item.mandatory),
    mandatory_tabs: normalizedTemplates.filter((item) => item.mandatory), tab_order: normalizedTemplates.map((item) => item.id),
  }
}

export async function resolveEffectivePolicy(context: any, installationId: string): Promise<{ policy: EffectiveStationPolicy; device: StationRow | null }> {
  const device = await stationDevice(context, installationId)
  const { data: assignments } = await context.supabase.from("desktop_station_policy_assignments").select("*").eq("active", true)
  const department = clean(context.user?.department || context.user?.department_name, 180)
  const workspaceId = clean(device?.current_workspace_id, 80)
  const candidates = (assignments || []).filter((row: StationRow) => {
    const type = String(row.target_type)
    const target = clean(row.target_id, 180)
    if (type === "fleet") return true
    if (type === "device") return target === String(device?.id || "")
    if (type === "installation") return target === installationId
    if (type === "user") return target === context.userId
    if (type === "department") return target === department
    if (type === "workspace") return target === workspaceId
    return false
  }).sort((a: StationRow, b: StationRow) => Number(b.precedence || 0) - Number(a.precedence || 0) || new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
  const policyId = candidates[0]?.policy_id
  if (!policyId) return { policy: { ...DEFAULT_EFFECTIVE_POLICY, lockout_duration_seconds: 900, browser: nativeBrowserPolicy(DEFAULT_EFFECTIVE_POLICY.browser_policy || {}, []) }, device }
  const { data: station } = await context.supabase.from("desktop_station_policies").select("*").eq("id", policyId).eq("active", true).maybeSingle()
  if (!station) return { policy: { ...DEFAULT_EFFECTIVE_POLICY, lockout_duration_seconds: 900, browser: nativeBrowserPolicy(DEFAULT_EFFECTIVE_POLICY.browser_policy || {}, []) }, device }
  let browser: StationRow = DEFAULT_EFFECTIVE_POLICY.browser_policy || {}
  if (station.browser_policy_id) {
    const { data } = await context.supabase.from("desktop_station_browser_policies").select("*").eq("id", station.browser_policy_id).eq("active", true).maybeSingle()
    if (data) browser = data
  }
  const { data: templates } = await context.supabase.from("desktop_station_tab_templates").select("*").eq("active", true).order("position", { ascending: true })
  const applicableTemplates = (templates || []).filter((row: StationRow) => {
    const targets = Array.isArray(row.target_ids) ? row.target_ids.map(String) : []
    return !targets.length || targets.includes(String(device?.id || "")) || targets.includes(context.userId) || targets.includes(department) || targets.includes(workspaceId)
  })
  return { policy: { ...DEFAULT_EFFECTIVE_POLICY, ...station, mode: normalizeMode(station.mode) as any, maximum_tabs: numberBetween(station.maximum_tabs, 8, 2, 50), lockout_duration_seconds: numberBetween(station.lockout_duration_minutes, 15, 1, 1440) * 60, browser_policy: browser, browser: nativeBrowserPolicy(browser, applicableTemplates), tab_templates: applicableTemplates }, device }
}

export function validateCorporateUrl(input: unknown, browserPolicy: StationRow) {
  const raw = clean(input, 3000)
  let url: URL
  try { url = new URL(raw.includes("://") ? raw : `https://${raw}`) } catch { return { allowed: false, reason: "MALFORMED_URL" } }
  if (!list(browserPolicy.allowed_schemes).includes(url.protocol)) return { allowed: false, reason: "SCHEME_BLOCKED", normalized_url: url.href }
  const host = url.hostname.toLowerCase()
  const matches = (rule: string) => host === rule || host.endsWith(`.${rule}`)
  if (list(browserPolicy.blocked_domains).some(matches)) return { allowed: false, reason: "DOMAIN_BLOCKED", normalized_url: url.href }
  if (browserPolicy.default_action === "deny" && !list(browserPolicy.allowed_domains).some(matches)) return { allowed: false, reason: "DOMAIN_NOT_APPROVED", normalized_url: url.href }
  return { allowed: true, reason: "APPROVED", normalized_url: url.href }
}

export async function stationAdminContext(request: NextRequest, permission = "whatsapp_desktop.admin") {
  return governanceContext(request, { adminPermission: permission })
}
