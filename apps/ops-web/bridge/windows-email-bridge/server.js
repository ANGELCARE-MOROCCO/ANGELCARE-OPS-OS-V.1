const http = require("http")
const net = require("net")
const os = require("os")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const dns = require("dns").promises
const { execFile } = require("child_process")
const { promisify } = require("util")
const nodemailer = require("nodemailer")

const execFileAsync = promisify(execFile)

const SERVICE_NAME = "angelcare-email-bridge"
const CADDY_SERVICE_NAME = "angelcare-caddy"
const PUBLIC_DOMAIN = "angelcare-mailbridge.duckdns.org"
const VERSION = safeVersion()
const PORT = Number(process.env.PORT || 3005)
const HOST = "127.0.0.1"
const LOG_DIR = clean(process.env.ANGELCARE_LOG_DIR || "C:\\AngelCare\\logs") || "C:\\AngelCare\\logs"
const STATUS_DIR = clean(process.env.ANGELCARE_STATUS_DIR || "C:\\AngelCare\\status") || "C:\\AngelCare\\status"
const BACKUP_ROOT = clean(process.env.ANGELCARE_BACKUP_DIR || "C:\\AngelCare\\backups") || "C:\\AngelCare\\backups"
const CADDYFILE_PATH = clean(process.env.CADDYFILE_PATH || "C:\\AngelCare\\caddy\\Caddyfile") || "C:\\AngelCare\\caddy\\Caddyfile"
const DUCKDNS_UPDATE_SCRIPT = clean(process.env.DUCKDNS_UPDATE_SCRIPT || "C:\\AngelCare\\duckdns\\update-duckdns.ps1") || "C:\\AngelCare\\duckdns\\update-duckdns.ps1"
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const MAX_LOG_LINES = 1000
const MAX_BACKUP_COUNT = 50

const LOG_OUT = path.join(LOG_DIR, "email-bridge-out.log")
const LOG_ERROR = path.join(LOG_DIR, "email-bridge-error.log")
const LOG_CADDY_OUT = path.join(LOG_DIR, "caddy-out.log")
const LOG_CADDY_ERROR = path.join(LOG_DIR, "caddy-error.log")
const LOG_DUCKDNS = path.join(LOG_DIR, "duckdns.log")
const LOG_SERVICE = path.join(LOG_DIR, "service-actions.jsonl")
const AUDIT_FILE = path.join(LOG_DIR, "email-bridge-audit.jsonl")
const MAINTENANCE_STATE_FILE = path.join(STATUS_DIR, "maintenance.json")
const BACKUP_MANIFEST_NAME = "backup-manifest.json"
const SAFE_STATUSES = new Set(["running", "stopped", "unknown", "failed", "degraded"])

const runtimeState = {
  lastSmtpTest: null,
  lastDuckDnsUpdate: null,
  lastNetworkTest: null,
  lastCaddyValidation: null,
  lastCaddyReload: null,
  lastSendSuccess: null,
  lastSendError: null,
  maintenance: loadMaintenanceState(),
  lastBackup: null
}

const buckets = new Map()

function safeVersion() {
  try {
    return require("./package.json").version || "1.0.0"
  } catch {
    return "1.0.0"
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : ""
}

function nowIso() {
  return new Date().toISOString()
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function toJson(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return JSON.stringify({ error: "unserializable" })
  }
}

function redactText(text) {
  if (!text) return ""
  return String(text)
    .split(/\r?\n/)
    .map((line) => {
      if (/password|token|secret|authorization|apikey|api-key|pass\b/i.test(line)) {
        return line.replace(/(:\s*|=\s*).+$/, "$1***REDACTED***")
      }
      return line
    })
    .join("\n")
}

function safeSummary(value, depth = 3) {
  if (depth < 0 || value === null || value === undefined) return value
  if (typeof value === "string") return value.length > 220 ? `${value.slice(0, 217)}...` : value
  if (typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => safeSummary(item, depth - 1))
  if (typeof value === "object") {
    const out = {}
    for (const [key, current] of Object.entries(value)) {
      if (/password|pass|token|secret|authorization|cookie|auth/i.test(key)) {
        out[key] = "***REDACTED***"
      } else {
        out[key] = safeSummary(current, depth - 1)
      }
    }
    return out
  }
  return String(value)
}

function maskEmail(value) {
  const email = clean(value)
  if (!email) return ""
  const [local, domain] = email.split("@")
  if (!domain) return maskSecret(email)
  const left = local.length <= 2 ? `${local.slice(0, 1)}*` : `${local.slice(0, 2)}***`
  return `${left}@${domain}`
}

function maskSecret(value) {
  const text = clean(value)
  if (!text) return ""
  if (text.length <= 8) return "***"
  return `${text.slice(0, 4)}***${text.slice(-4)}`
}

function appendLine(filePath, line) {
  ensureDir(filePath)
  fs.appendFileSync(filePath, `${line}\n`, "utf8")
}

function appendJsonl(filePath, record) {
  appendLine(filePath, toJson(record))
}

function logStructured(filePath, entry) {
  appendJsonl(filePath, {
    timestamp: nowIso(),
    ...entry
  })
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    const raw = fs.readFileSync(filePath, "utf8")
    if (!raw.trim()) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJsonFile(filePath, value) {
  ensureDir(filePath)
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function loadMaintenanceState() {
  const state = readJsonFile(MAINTENANCE_STATE_FILE, null)
  if (!state || typeof state !== "object") {
    return {
      enabled: false,
      reason: "",
      expectedDuration: "",
      startedAt: "",
      startedBy: "",
      message: ""
    }
  }
  return {
    enabled: Boolean(state.enabled),
    reason: clean(state.reason),
    expectedDuration: clean(state.expectedDuration || state.expected_duration),
    startedAt: clean(state.startedAt || state.started_at),
    startedBy: clean(state.startedBy || state.started_by),
    message: clean(state.message)
  }
}

function saveMaintenanceState(state) {
  runtimeState.maintenance = {
    enabled: Boolean(state.enabled),
    reason: clean(state.reason),
    expectedDuration: clean(state.expectedDuration),
    startedAt: clean(state.startedAt),
    startedBy: clean(state.startedBy),
    message: clean(state.message)
  }
  writeJsonFile(MAINTENANCE_STATE_FILE, runtimeState.maintenance)
  return runtimeState.maintenance
}

function safeDate(value) {
  const text = clean(value)
  if (!text) return ""
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toISOString()
}

function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let current = value
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function getDirectorySize(filePath) {
  if (!fs.existsSync(filePath)) return 0
  const stat = fs.statSync(filePath)
  if (stat.isFile()) return stat.size
  let total = 0
  for (const entry of fs.readdirSync(filePath)) {
    total += getDirectorySize(path.join(filePath, entry))
  }
  return total
}

function getPathStats(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    return {
      exists: true,
      isDirectory: stat.isDirectory(),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      createdAt: stat.birthtime.toISOString()
    }
  } catch {
    return null
  }
}

function getLatestChildDirectory(rootPath) {
  if (!fs.existsSync(rootPath)) return null
  const entries = fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(rootPath, entry.name)
      const stat = fs.statSync(fullPath)
      return {
        name: entry.name,
        path: fullPath,
        mtimeMs: stat.mtimeMs
      }
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
  return entries[0] || null
}

function getFileNameSafe(filePath) {
  return path.basename(filePath)
}

function buildSafeManifestSummary(manifest) {
  if (!manifest || typeof manifest !== "object") return ""
  const files = Array.isArray(manifest.files) ? manifest.files : []
  const warnings = Array.isArray(manifest.warnings) ? manifest.warnings : []
  const assetCount = files.length
  const warningText = warnings.length ? ` warnings=${warnings.length}` : ""
  return `backupId=${clean(manifest.backupId)} assets=${assetCount}${warningText}`.trim()
}

function computeCpuSnapshot() {
  const cpus = os.cpus() || []
  const totals = cpus.reduce((acc, cpu) => {
    acc.user += cpu.times.user
    acc.nice += cpu.times.nice
    acc.sys += cpu.times.sys
    acc.idle += cpu.times.idle
    acc.irq += cpu.times.irq
    return acc
  }, { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 })

  return {
    model: cpus[0]?.model || "unknown",
    cores: cpus.length,
    loadAverage: os.loadavg().map((item) => item.toFixed(2)).join(" / "),
    processCpuUserMs: Math.round(process.cpuUsage().user / 1000),
    processCpuSystemMs: Math.round(process.cpuUsage().system / 1000),
    totalCpuTimes: totals
  }
}

function computeMemorySnapshot() {
  const memory = process.memoryUsage()
  const total = os.totalmem()
  const used = total - os.freemem()
  return {
    rss: memory.rss,
    heapUsed: memory.heapUsed,
    heapTotal: memory.heapTotal,
    external: memory.external,
    systemUsed: used,
    systemTotal: total
  }
}

function computeDiskSnapshot(rootPath) {
  try {
    if (!fs.existsSync(rootPath)) {
      return {
        availableBytes: 0,
        totalBytes: 0,
        usedBytes: 0,
        usedPercent: 0,
        rootPath
      }
    }
    const stat = fs.statfsSync(rootPath)
    const totalBytes = stat.bsize * stat.blocks
    const availableBytes = stat.bsize * stat.bavail
    const usedBytes = totalBytes - availableBytes
    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0
    return {
      availableBytes,
      totalBytes,
      usedBytes,
      usedPercent,
      rootPath
    }
  } catch {
    return {
      availableBytes: 0,
      totalBytes: 0,
      usedBytes: 0,
      usedPercent: 0,
      rootPath
    }
  }
}

function backupCandidateFiles() {
  return [
    "C:\\AngelCare\\email-bridge\\.env",
    "C:\\AngelCare\\email-bridge\\server.js",
    "C:\\AngelCare\\email-bridge\\package.json",
    "C:\\AngelCare\\caddy\\Caddyfile",
    clean(process.env.DUCKDNS_UPDATE_SCRIPT || "C:\\AngelCare\\duckdns\\update-duckdns.ps1") || "C:\\AngelCare\\duckdns\\update-duckdns.ps1",
  ]
}

function getBackupDirectories() {
  if (!fs.existsSync(BACKUP_ROOT)) return []
  return fs.readdirSync(BACKUP_ROOT)
    .map((name) => path.join(BACKUP_ROOT, name))
    .filter((item) => {
      try {
        return fs.statSync(item).isDirectory()
      } catch {
        return false
      }
    })
    .sort((left, right) => {
      try {
        return fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs
      } catch {
        return 0
      }
    })
}

function summarizeBackupStatus() {
  const directories = getBackupDirectories()
  const latest = directories[0] || ""
  const manifestPath = latest ? path.join(latest, BACKUP_MANIFEST_NAME) : ""
  const manifest = manifestPath ? readJsonFile(manifestPath, null) : null
  const latestStats = latest ? getPathStats(latest) : null
  const protectedAssets = backupCandidateFiles().map((assetPath) => ({
    name: getFileNameSafe(assetPath),
    path: assetPath,
    present: fs.existsSync(assetPath)
  }))

  return {
    directoryExists: fs.existsSync(BACKUP_ROOT),
    latestBackupAt: latestStats ? latestStats.modifiedAt : "",
    latestBackupName: latest ? path.basename(latest) : "",
    latestBackupPath: latest,
    latestManifestPath: manifestPath,
    backupCount: directories.length,
    folderSizeBytes: getDirectorySize(BACKUP_ROOT),
    latestManifestSummary: buildSafeManifestSummary(manifest),
    protectedAssets,
    warnings: Array.isArray(manifest?.warnings) ? manifest.warnings.slice(0, 10).map((item) => clean(item)) : [],
    lastCheckedAt: nowIso()
  }
}

function sanitizeLogEntryValue(value) {
  if (typeof value === "string") {
    return redactText(maskTokenValue(value))
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeLogEntryValue(item))
  }
  if (value && typeof value === "object") {
    const out = {}
    for (const [key, current] of Object.entries(value)) {
      if (/password|pass|token|secret|authorization|cookie|auth/i.test(key)) {
        out[key] = "***REDACTED***"
      } else {
        out[key] = sanitizeLogEntryValue(current)
      }
    }
    return out
  }
  return value
}

function maskTokenValue(text) {
  return String(text || "")
    .replace(/([A-Fa-f0-9]{24,})/g, "***REDACTED***")
    .replace(/(eyJ[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2})/g, "***REDACTED***")
    .replace(/\b([A-Za-z0-9_\-]{32,})\b/g, "***REDACTED***")
}

function auditAction(record) {
  appendJsonl(AUDIT_FILE, {
    timestamp: nowIso(),
    action: record.action,
    actor: clean(record.actor) || "system",
    ip: clean(record.ip) || "",
    params: safeSummary(record.params || {}),
    result: clean(record.result) || "unknown",
    durationMs: Number.isFinite(record.durationMs) ? Math.round(record.durationMs) : null,
    before: safeSummary(record.before || null),
    after: safeSummary(record.after || null),
    error: clean(record.error) || ""
  })
}

function bucketKey(request, token) {
  const ip = getRequestIp(request) || "unknown"
  return `${ip}:${token.slice(0, 8)}`
}

function rateLimit(request, token) {
  const key = bucketKey(request, token)
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }
  existing.count += 1
  return { ok: true, remaining: RATE_LIMIT_MAX - existing.count, resetAt: existing.resetAt }
}

function getRequestIp(request) {
  const forwarded = clean(request.headers["x-forwarded-for"])
  if (forwarded) return forwarded.split(",")[0].trim()
  return clean(request.headers["x-real-ip"]) || clean(request.headers["cf-connecting-ip"]) || ""
}

function readJsonBody(request) {
  return new Promise((resolve) => {
    let raw = ""
    request.on("data", (chunk) => {
      raw += chunk
      if (raw.length > 2_000_000) {
        request.destroy()
      }
    })
    request.on("end", () => {
      if (!raw.trim()) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
    request.on("error", () => resolve({}))
  })
}

function safeStatusValue(value, fallback = "unknown") {
  const normalized = clean(value).toLowerCase()
  return SAFE_STATUSES.has(normalized) ? normalized : fallback
}

function makeSafeStatusResult({ ok, status, error = "", raw = "", ...extra }) {
  const normalizedStatus = safeStatusValue(status, ok ? "running" : "unknown")
  const result = {
    ok: Boolean(ok),
    status: normalizedStatus,
    ...extra
  }
  if (error) result.error = String(error)
  if (raw !== "") result.raw = typeof raw === "string" ? raw : toJson(raw)
  return result
}

function fallbackHealthResult(label, error = "unknown") {
  return makeSafeStatusResult({
    ok: false,
    status: "unknown",
    error: `${label}: ${error}`.trim(),
    raw: ""
  })
}

function writeJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  })
  res.end(body)
}

function notFound(res) {
  writeJson(res, 404, { ok: false, error: "Not found" })
}

function listLines(filePath) {
  if (!fs.existsSync(filePath)) return []
  const text = fs.readFileSync(filePath, "utf8")
  return text.split(/\r?\n/).filter(Boolean)
}

function parseLine(line) {
  const trimmed = String(line || "").trim()
  if (!trimmed) return null
  try {
    const json = JSON.parse(trimmed)
    return sanitizeLogEntryValue(normalizeStructuredLog(json, trimmed))
  } catch {
    return sanitizeLogEntryValue(normalizeFreeformLog(trimmed))
  }
}

function normalizeStructuredLog(record, raw) {
  const timestamp = clean(record.timestamp || record.time || record.created_at || record.createdAt || record.at)
  return {
    timestamp,
    event: clean(record.event || record.action || record.type || record.eventType),
    level: clean(record.level || record.severity || record.result || record.status),
    message: clean(record.message || record.summary || record.error || record.detail || record.text),
    raw: raw || toJson(record),
    mailbox: clean(record.mailbox || record.mailboxKey || record.mailboxLabel),
    mailboxId: clean(record.mailboxId || record.mailbox_id),
    to: clean(record.to || record.toEmail || record.recipient),
    subject: clean(record.subject),
    latencyMs: Number.isFinite(Number(record.latencyMs || record.latency_ms)) ? Number(record.latencyMs || record.latency_ms) : null,
    response: clean(record.response || record.smtpResponse || record.responseText),
    messageId: clean(record.messageId || record.message_id),
    service: clean(record.service || record.serviceName),
    source: clean(record.source || record.origin)
  }
}

function normalizeFreeformLog(raw) {
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+(.*)$/)
  const bracketMatch = raw.match(/^\[([^\]]+)\]\s*(.*)$/)
  const timestamp = isoMatch ? isoMatch[1] : bracketMatch ? bracketMatch[1] : ""
  const text = isoMatch ? isoMatch[2] : bracketMatch ? bracketMatch[2] : raw
  return {
    timestamp,
    event: extractEvent(text),
    level: extractLevel(text),
    message: text,
    raw
  }
}

function extractEvent(text) {
  const tokens = String(text || "").split(/\s+/)
  const found = tokens.find((token) => /SEND_|SMTP_|SERVICE_|DUCKDNS|CADDY|NETWORK|AUDIT|STATUS|HEALTH/i.test(token))
  return found || ""
}

function extractLevel(text) {
  if (/error/i.test(text)) return "error"
  if (/warn/i.test(text)) return "warning"
  if (/ok|success|running|healthy/i.test(text)) return "ok"
  return ""
}

function readTailJsonl(filePath, maxLines) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `File not found: ${filePath}`, lines: [], filePath }
  }

  const lines = listLines(filePath).slice(-Math.min(MAX_LOG_LINES, Math.max(1, maxLines)))
  return {
    ok: true,
    filePath,
    totalLines: listLines(filePath).length,
    returnedLines: lines.length,
    lines: lines.map(parseLine).filter(Boolean).map((entry) => sanitizeLogEntryValue(entry))
  }
}

function getSettings() {
  return {
    serviceName: SERVICE_NAME,
    caddyServiceName: CADDY_SERVICE_NAME,
    version: VERSION,
    publicDomain: PUBLIC_DOMAIN,
    publicPurpose: "Production email relay for Email-OS via Menara SMTP"
  }
}

function getDefaultSmtpConfig() {
  const host = clean(process.env.DEFAULT_SMTP_HOST || process.env.EMAIL_OS_SMTP_HOST || "smtp-auth.menara.ma")
  const port = Number(process.env.DEFAULT_SMTP_PORT || process.env.EMAIL_OS_SMTP_PORT || 587)
  const secure = String(process.env.DEFAULT_SMTP_SECURE || process.env.EMAIL_OS_SMTP_SECURE || "false").toLowerCase() === "true"
  const user = clean(process.env.DEFAULT_SMTP_USER || process.env.EMAIL_OS_SMTP_USER || "")
  const pass = clean(process.env.DEFAULT_SMTP_PASS || process.env.EMAIL_OS_SMTP_PASS || "")
  const fromEmail = clean(process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_OS_FROM_EMAIL || user)
  return { host, port, secure, user, pass, fromEmail }
}

function createTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
    pool: false,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 45000
  })
}

function configSafe(config) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: maskEmail(config.user),
    fromEmail: maskEmail(config.fromEmail),
    passwordConfigured: Boolean(config.pass)
  }
}

async function sendMail(config, input, diagnostics) {
  const transport = createTransport(config)
  try {
    const info = await transport.sendMail({
      from: input.fromEmail || config.fromEmail,
      to: input.toEmail,
      cc: input.cc || undefined,
      bcc: input.bcc || undefined,
      subject: input.subject || "(Sans objet)",
      text: input.text || "",
      html: input.html || String(input.text || "").replace(/\n/g, "<br />"),
      replyTo: input.replyTo || undefined,
      headers: {
        "X-AngelCare-Mailbox": diagnostics.mailbox || "",
        "X-AngelCare-Mailbox-ID": diagnostics.mailboxId || "",
        "X-AngelCare-From": input.fromEmail || config.fromEmail || "",
        "X-AngelCare-Transport": "angelcare-windows-email-bridge"
      }
    })
    return info
  } finally {
    transport.close()
  }
}

async function verifySmtp(config) {
  const transport = createTransport(config)
  try {
    return await transport.verify()
  } finally {
    transport.close()
  }
}

async function runCommand(file, args, timeout = 30000) {
  return execFileAsync(file, args, {
    windowsHide: true,
    timeout,
    maxBuffer: 1024 * 1024
  })
}

async function tryCommands(candidates) {
  let lastError = null
  for (const candidate of candidates) {
    try {
      const result = await runCommand(candidate.file, candidate.args, candidate.timeout || 30000)
      return { ...result, command: `${candidate.file} ${candidate.args.join(" ")}`.trim() }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error("Command failed")
}

function parseNssmStatus(text) {
  const value = String(text || "").trim().toUpperCase()
  if (value.includes("SERVICE_RUNNING")) return "running"
  if (value.includes("SERVICE_STOPPED")) return "stopped"
  if (value.includes("SERVICE_PAUSED")) return "degraded"
  if (value.includes("SERVICE_STOP_PENDING")) return "degraded"
  if (value.includes("SERVICE_START_PENDING")) return "degraded"
  return "unknown"
}

function parseScStatus(text) {
  const value = String(text || "").toUpperCase()
  if (value.includes("RUNNING")) return "running"
  if (value.includes("STOPPED")) return "stopped"
  if (value.includes("PAUSED")) return "degraded"
  if (value.includes("START_PENDING")) return "degraded"
  if (value.includes("STOP_PENDING")) return "degraded"
  return "unknown"
}

function parseStartupType(text) {
  const match = String(text || "").match(/START_TYPE\s*:\s*\d+\s+([A-Z_]+)/i)
  if (!match) return "unknown"
  const value = match[1].toUpperCase()
  if (value.includes("AUTO")) return "auto"
  if (value.includes("DEMAND")) return "manual"
  if (value.includes("DISABLED")) return "disabled"
  return value.toLowerCase()
}

async function getServiceStatus(service) {
  let status = "unknown"
  let startupType = "unknown"
  let detail = ""
  let command = ""
  let error = ""

  try {
    const nssm = await runCommand("nssm", ["status", service], 15000)
    status = parseNssmStatus(nssm.stdout)
    detail = String(nssm.stdout || "").trim()
    command = nssm.command || "nssm status"
  } catch (nssmError) {
    try {
      const sc = await runCommand("sc", ["query", service], 15000)
      status = parseScStatus(sc.stdout)
      detail = String(sc.stdout || "").trim()
      command = sc.command || "sc query"
    } catch (scError) {
      error = scError instanceof Error ? scError.message : String(scError || "unknown")
      detail = error
    }
  }

  try {
    const qc = await runCommand("sc", ["qc", service], 15000)
    startupType = parseStartupType(qc.stdout)
  } catch {
    startupType = "unknown"
  }

  const ok = status === "running"
  const safe = makeSafeStatusResult({
    ok,
    status,
    error: ok ? "" : error,
    raw: detail,
    service,
    startupType,
    command
  })
  safe.detail = detail
  safe.serviceName = service
  safe.role = service === SERVICE_NAME ? "Email bridge NSSM service" : service === CADDY_SERVICE_NAME ? "Caddy HTTPS reverse proxy" : "Windows service"
  safe.serviceState = status
  safe.processStatus = status
  safe.lastCheckedAt = nowIso()
  safe.port = service === SERVICE_NAME ? PORT : service === CADDY_SERVICE_NAME ? 443 : null
  safe.endpoint = service === SERVICE_NAME ? `http://${HOST}:${PORT}/health` : service === CADDY_SERVICE_NAME ? `https://${PUBLIC_DOMAIN}` : ""
  safe.logAvailability = service === SERVICE_NAME ? LOG_OUT : service === CADDY_SERVICE_NAME ? LOG_CADDY_OUT : LOG_SERVICE
  safe.lastAction = ""
  safe.lastActionAt = ""
  safe.lastRestartAt = ""
  safe.recommendedAction = ok ? "No action required" : `Investigate ${service} status`
  return safe
}

async function changeServiceState(service, action) {
  const before = await getServiceStatus(service)
  const commands = [
    { file: "nssm", args: [action, service], timeout: 20000 },
    action === "restart"
      ? { file: "sc", args: ["stop", service], timeout: 20000 }
      : null,
    action === "restart"
      ? { file: "sc", args: ["start", service], timeout: 20000 }
      : null,
    action !== "restart" ? { file: "sc", args: [action, service], timeout: 20000 } : null
  ].filter(Boolean)

  let commandUsed = ""
  let commandResult = null
  let error = null

  try {
    if (action === "restart") {
      try {
        commandResult = await runCommand("nssm", ["restart", service], 30000)
        commandUsed = commandResult.command || "nssm restart"
      } catch {
        await runCommand("sc", ["stop", service], 20000)
        await sleep(2000)
        await runCommand("sc", ["start", service], 20000)
        commandUsed = "sc stop/start"
      }
    } else {
      commandResult = await tryCommands(commands)
      commandUsed = commandResult.command || `${action} ${service}`
    }
  } catch (err) {
    error = err
  }

  await sleep(2000)
  const after = await getServiceStatus(service)
  return {
    before,
    after,
    commandUsed,
    error
  }
}

async function validateCaddyConfig() {
  const before = await getServiceStatus(CADDY_SERVICE_NAME)
  const validate = await runCommand("caddy", ["validate", "--config", CADDYFILE_PATH, "--adapter", "caddyfile"], 30000)
  const after = await getServiceStatus(CADDY_SERVICE_NAME)
  runtimeState.lastCaddyValidation = {
    timestamp: nowIso(),
    status: "ok",
    command: validate.command || "caddy validate",
    output: String(validate.stdout || "").trim()
  }
  return {
    before,
    after,
    output: String(validate.stdout || "").trim(),
    error: ""
  }
}

async function reloadCaddy() {
  const before = await getServiceStatus(CADDY_SERVICE_NAME)
  let commandUsed = ""
  let output = ""
  let error = ""
  try {
    const result = await runCommand("caddy", ["reload", "--config", CADDYFILE_PATH, "--adapter", "caddyfile"], 30000)
    commandUsed = result.command || "caddy reload"
    output = String(result.stdout || "").trim()
  } catch (reloadError) {
    error = reloadError instanceof Error ? reloadError.message : String(reloadError || "reload failed")
    const fallback = await changeServiceState(CADDY_SERVICE_NAME, "restart")
    commandUsed = fallback.commandUsed || "service restart"
    output = "Reload failed; fallback restart used."
    error = fallback.error ? (fallback.error instanceof Error ? fallback.error.message : String(fallback.error)) : ""
  }
  await sleep(2000)
  const after = await getServiceStatus(CADDY_SERVICE_NAME)
  runtimeState.lastCaddyReload = {
    timestamp: nowIso(),
    status: after?.status || "unknown",
    command: commandUsed,
    output,
    error
  }
  return { before, after, commandUsed, output, error }
}

function maskCaddyConfig(text) {
  return redactText(text)
}

function readCaddyConfig() {
  if (!fs.existsSync(CADDYFILE_PATH)) {
    return { ok: false, error: `Caddyfile not found at ${CADDYFILE_PATH}`, config: "", preview: "" }
  }
  const config = fs.readFileSync(CADDYFILE_PATH, "utf8")
  const preview = maskCaddyConfig(config).split(/\r?\n/).slice(0, 220).join("\n")
  return {
    ok: true,
    config,
    preview
  }
}

function checkTcp(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const started = Date.now()
    let settled = false
    const settle = (result) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {}
      resolve(result)
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => settle({ ok: true, latencyMs: Date.now() - started }))
    socket.once("timeout", () => settle({ ok: false, error: "timeout", latencyMs: Date.now() - started }))
    socket.once("error", (error) => settle({ ok: false, error: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - started }))
    socket.connect(port, host)
  })
}

async function checkHttp(url, timeoutMs = 5000) {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" })
    const raw = await response.text()
    let payload = null
    try {
      payload = raw ? JSON.parse(raw) : null
    } catch {
      payload = null
    }
    if (response.ok && payload?.ok !== false) {
      return makeSafeStatusResult({
        ok: true,
        status: "running",
        raw,
        statusCode: response.status,
        latencyMs: Date.now() - started,
        payload
      })
    }
    if (response.ok) {
      return makeSafeStatusResult({
        ok: false,
        status: "degraded",
        error: payload?.error || `Health endpoint returned ok=false (${response.status})`,
        raw,
        statusCode: response.status,
        latencyMs: Date.now() - started,
        payload
      })
    }
    return makeSafeStatusResult({
      ok: false,
      status: "failed",
      error: payload?.error || `HTTP ${response.status}`,
      raw,
      statusCode: response.status,
      latencyMs: Date.now() - started,
      payload
    })
  } catch (error) {
    return makeSafeStatusResult({
      ok: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error || "fetch failed"),
      raw: "",
      latencyMs: Date.now() - started
    })
  } finally {
    clearTimeout(timer)
  }
}

async function resolveDuckDns() {
  try {
    const result = await dns.lookup(PUBLIC_DOMAIN)
    return makeSafeStatusResult({
      ok: true,
      status: "running",
      raw: result.address,
      ip: result.address
    })
  } catch (error) {
    return makeSafeStatusResult({
      ok: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error || "dns failed"),
      raw: ""
    })
  }
}

async function resolveHostStatus(host, label) {
  try {
    const result = await dns.lookup(host)
    return makeSafeStatusResult({
      ok: true,
      status: "running",
      raw: result.address,
      host,
      address: result.address,
      family: result.family
    })
  } catch (error) {
    return makeSafeStatusResult({
      ok: false,
      status: "failed",
      error: `${label || host}: ${error instanceof Error ? error.message : String(error || "dns failed")}`,
      raw: "",
      host
    })
  }
}

async function getPublicIp() {
  const response = await checkHttp("https://api.ipify.org?format=json", 5000)
  if (!response.ok) {
    return makeSafeStatusResult({
      ok: false,
      status: response.status === "degraded" ? "degraded" : "failed",
      error: response.error || "public ip failed",
      raw: response.raw || ""
    })
  }
  const ip = response.payload?.ip || response.payload?.ipAddress || ""
  return makeSafeStatusResult({
    ok: Boolean(ip),
    status: ip ? "running" : "degraded",
    error: ip ? "" : "Public IP response did not include an address",
    raw: response.raw || "",
    ip
  })
}

function detectLanIp() {
  const interfaces = os.networkInterfaces()
  for (const values of Object.values(interfaces)) {
    for (const item of values || []) {
      if (item && item.family === "IPv4" && !item.internal) {
        return item.address
      }
    }
  }
  return ""
}

async function findLatestEvent(predicate) {
  const entries = readTailJsonl(AUDIT_FILE, 400).lines
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]
    if (predicate(entry)) return entry
  }
  return null
}

function normalizeActionResult(ok, message, extra = {}) {
  return {
    ok,
    message,
    ...extra
  }
}

function classifyStatus(snapshot) {
  const issues = []
  const critical = []

  const bridgeService = snapshot.bridgeService || snapshot.services?.bridge || fallbackHealthResult("bridge service", "missing status")
  const caddyService = snapshot.caddyService || snapshot.services?.caddy || fallbackHealthResult("caddy service", "missing status")
  const localHealth = snapshot.localHealth || snapshot.network?.localBridgeHealth || fallbackHealthResult("local bridge health", "missing status")
  const publicHealth = snapshot.publicHealth || snapshot.network?.publicHealth || fallbackHealthResult("public health", "missing status")
  const duckdns = snapshot.duckdns || fallbackHealthResult("duckdns", "missing status")
  const menara = snapshot.menara || snapshot.smtp || fallbackHealthResult("menara", "missing status")
  const caddyLocalHttp = snapshot.network?.caddyLocalHttp || fallbackHealthResult("caddy local http", "missing status")
  const ports = snapshot.network?.ports || {}

  if (safeStatusValue(bridgeService.status) !== "running") critical.push("Bridge service is not running")
  if (safeStatusValue(caddyService.status) !== "running") critical.push("Caddy service is not running")
  if (safeStatusValue(localHealth.status) !== "running") critical.push("Local bridge health failed")
  if (safeStatusValue(publicHealth.status) !== "running") critical.push("Public HTTPS health failed")
  if (safeStatusValue(menara.authStatus?.status || menara.status) !== "running") critical.push("SMTP auth failed")

  if (safeStatusValue(duckdns.status) !== "running") issues.push("DuckDNS mismatch")
  if (!["ok", "running"].includes(ports[80])) issues.push("Port 80 unavailable")
  if (!["ok", "running"].includes(ports[443])) issues.push("Port 443 unavailable")
  if (!["ok", "running"].includes(ports[3005])) issues.push("Port 3005 unavailable")
  if (!["ok", "running"].includes(ports[587])) issues.push("Port 587 unavailable")
  if (safeStatusValue(caddyLocalHttp.status) !== "running") issues.push("Caddy HTTP local check failed")

  if (critical.length) {
    return {
      classification: "critical",
      recommendedAction: critical[0]
    }
  }

  if (issues.length) {
    return {
      classification: "degraded",
      recommendedAction: issues[0]
    }
  }

  return {
    classification: "operational",
    recommendedAction: "No immediate action required"
  }
}

async function buildNetworkSnapshot() {
  try {
    const [localBridgeHealth, caddyLocalHttp, publicHealth, duckdnsResolved, publicIp, smtpResolved, smtpPort, port80, port443, port3005, lanIp, caddyPreview, caddyValidation, bridgeService, caddyService] = await Promise.all([
      checkHttp(`http://${HOST}:${PORT}/health`, 5000),
      checkHttp("http://127.0.0.1:80/health", 5000),
      checkHttp(`https://${PUBLIC_DOMAIN}/health`, 5000),
      resolveDuckDns(),
      getPublicIp(),
      resolveHostStatus("smtp-auth.menara.ma", "Menara SMTP"),
      checkTcp("smtp-auth.menara.ma", 587, 4000),
      checkTcp("127.0.0.1", 80, 2000),
      checkTcp("127.0.0.1", 443, 2000),
      checkTcp("127.0.0.1", PORT, 2000),
      Promise.resolve(detectLanIp()),
      Promise.resolve(readCaddyConfig()),
      Promise.resolve(runtimeState.lastCaddyValidation || null),
      getServiceStatus(SERVICE_NAME),
      getServiceStatus(CADDY_SERVICE_NAME)
    ])

    const configPreview = caddyPreview.ok ? caddyPreview.preview : ""

    const smtpConfig = getDefaultSmtpConfig()
    let smtpAuth = makeSafeStatusResult({
      ok: false,
      status: "unknown",
      error: "No SMTP test run yet",
      raw: ""
    })
    if (runtimeState.lastSmtpTest) {
      const lastStatus = String(runtimeState.lastSmtpTest.status || "").toLowerCase()
      smtpAuth = makeSafeStatusResult({
        ok: lastStatus === "ok",
        status: lastStatus === "ok" ? "running" : lastStatus === "failed" ? "failed" : "unknown",
        error: lastStatus === "ok" ? "" : runtimeState.lastSmtpTest.message || "SMTP test not successful",
        raw: runtimeState.lastSmtpTest.response || runtimeState.lastSmtpTest.message || "",
        ...runtimeState.lastSmtpTest
      })
    }

    const duckdnsSync = duckdnsResolved.ok && publicIp.ok && duckdnsResolved.ip === publicIp.ip
    const duckdnsStatus = duckdnsResolved.ok && publicIp.ok
      ? (duckdnsSync ? "running" : "degraded")
      : "failed"
    const snapshot = {
      process: {
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        workingDirectory: process.cwd(),
        hostname: os.hostname(),
        currentTime: nowIso()
      },
      settings: getSettings(),
      services: {
        bridge: bridgeService,
        caddy: caddyService
      },
      bridgeService,
      caddyService,
      localHealth: normalizeHealth(localBridgeHealth),
      publicHealth: normalizeHealth(publicHealth),
      menara: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: maskEmail(smtpConfig.user),
        ok: smtpAuth.ok,
        status: smtpAuth.status,
        error: smtpAuth.error || "",
        raw: smtpAuth.raw || "",
        authStatus: smtpAuth,
        hostResolution: smtpResolved,
        lastTest: runtimeState.lastSmtpTest
      },
      network: {
        status: "unknown",
        ok: false,
        error: "",
        publicDomain: PUBLIC_DOMAIN,
        localBridgeHealth: normalizeHealth(localBridgeHealth),
        publicHealth: normalizeHealth(publicHealth),
        duckdnsResolvedIp: duckdnsResolved.ok ? duckdnsResolved.ip : "",
        publicIp: publicIp.ok ? publicIp.ip : "",
        ipMatch: duckdnsSync,
        lanIp,
        ports: {
          587: smtpPort.ok ? "running" : "failed",
          80: port80.ok ? "running" : "failed",
          443: port443.ok ? "running" : "failed",
          3005: port3005.ok ? "running" : "failed"
        },
        caddyLocalHttp: normalizeHealth(caddyLocalHttp),
        diagnosticTree: [],
        smtpHostResolution: smtpResolved.ok ? smtpResolved.address : "",
        smtpHostResolutionStatus: smtpResolved.ok ? "running" : "failed",
        smtpPortStatus: smtpPort.ok ? "running" : "failed"
      },
      smtp: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: maskEmail(smtpConfig.user),
        authStatus: smtpAuth,
        lastTest: runtimeState.lastSmtpTest,
        dnsResolutionStatus: smtpResolved.ok ? "running" : "failed",
        tcpConnectivityStatus: smtpPort.ok ? "running" : "failed",
        lastProofEmail: runtimeState.lastSendSuccess || null
      },
      duckdns: {
        ok: duckdnsStatus === "running",
        status: duckdnsStatus,
        domain: PUBLIC_DOMAIN,
        resolvedIp: duckdnsResolved.ok ? duckdnsResolved.ip : "",
        currentPublicIp: publicIp.ok ? publicIp.ip : "",
        syncStatus: duckdnsSync ? "synced" : "mismatch",
        error: duckdnsResolved.ok && publicIp.ok ? (duckdnsSync ? "" : "DuckDNS IP does not match current public IP") : (duckdnsResolved.error || publicIp.error || "DuckDNS resolution failed"),
        raw: [duckdnsResolved.raw || "", publicIp.raw || ""].filter(Boolean).join(" | ")
      },
      caddy: {
        configStatus: caddyPreview.ok ? "running" : "failed",
        configPreview,
        certificateStatus: publicHealth.ok ? { status: "running", message: "Public HTTPS reachable" } : { status: "unknown", message: "Public HTTPS not confirmed" }
      },
      lastSendSuccess: await findLatestEvent((entry) => String(entry.action || "").includes("SEND_OK") || String(entry.event || "").includes("SEND_OK")),
      lastError: await findLatestEvent((entry) => String(entry.action || "").includes("ERROR") || String(entry.result || "").includes("error") || String(entry.event || "").includes("ERROR"))
    }

    snapshot.network.diagnosticTree = [
      {
        step: "Bridge local health",
        status: snapshot.network.localBridgeHealth.status,
        message: snapshot.network.localBridgeHealth.message || "Local /health on 127.0.0.1:3005"
      },
      {
        step: "Caddy local HTTP",
        status: snapshot.network.caddyLocalHttp.status,
        message: snapshot.network.caddyLocalHttp.message || "Local Caddy HTTP health on 127.0.0.1:80"
      },
      {
        step: "Public HTTPS health",
        status: snapshot.network.publicHealth.status,
        message: snapshot.network.publicHealth.message || `https://${PUBLIC_DOMAIN}/health`
      },
      {
        step: "DuckDNS resolution",
        status: snapshot.duckdns.status,
        message: duckdnsResolved.ok ? `Resolved ${duckdnsResolved.ip}` : duckdnsResolved.error || "DNS resolution failed"
      },
      {
        step: "Current public IP",
        status: publicIp.ok ? "running" : "failed",
        message: publicIp.ok ? publicIp.ip : publicIp.error || "Unable to resolve public IP"
      },
      {
        step: "Menara host resolution",
        status: smtpResolved.ok ? "running" : "failed",
        message: smtpResolved.ok ? smtpResolved.address : smtpResolved.error || "smtp-auth.menara.ma resolution failed"
      },
      {
        step: "TCP 587 / 80 / 443 / 3005",
        status: [smtpPort.ok, port80.ok, port443.ok, port3005.ok].every(Boolean) ? "running" : "degraded",
        message: `587=${smtpPort.ok ? "ok" : "failed"} 80=${port80.ok ? "ok" : "failed"} 443=${port443.ok ? "ok" : "failed"} 3005=${port3005.ok ? "ok" : "failed"}`
      }
    ]

    const classification = classifyStatus(snapshot)
    snapshot.classification = classification.classification
    snapshot.recommendedAction = classification.recommendedAction
    snapshot.network.status = classification.classification === "operational" ? "running" : classification.classification === "degraded" ? "degraded" : "failed"
    snapshot.network.ok = classification.classification === "operational"
    snapshot.network.error = classification.recommendedAction === "No immediate action required" ? "" : classification.recommendedAction
    return snapshot
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "status snapshot failed")
    return {
      process: {
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        workingDirectory: process.cwd(),
        hostname: os.hostname(),
        currentTime: nowIso()
      },
      settings: getSettings(),
      services: {
        bridge: fallbackHealthResult("bridge service", message),
        caddy: fallbackHealthResult("caddy service", message)
      },
      bridgeService: fallbackHealthResult("bridge service", message),
      caddyService: fallbackHealthResult("caddy service", message),
      localHealth: fallbackHealthResult("local bridge health", message),
      publicHealth: fallbackHealthResult("public health", message),
      menara: fallbackHealthResult("menara", message),
      network: {
        ok: false,
        status: "failed",
        error: message,
        publicDomain: PUBLIC_DOMAIN,
        localBridgeHealth: fallbackHealthResult("local bridge health", message),
        publicHealth: fallbackHealthResult("public health", message),
        duckdnsResolvedIp: "",
        publicIp: "",
        ipMatch: false,
        lanIp: detectLanIp(),
        ports: { 587: "failed", 80: "failed", 443: "failed", 3005: "failed" },
        caddyLocalHttp: fallbackHealthResult("caddy local http", message),
        diagnosticTree: [
          { step: "Bridge local health", status: "failed", message },
          { step: "Caddy local HTTP", status: "failed", message },
          { step: "Public HTTPS health", status: "failed", message },
          { step: "DuckDNS resolution", status: "failed", message },
          { step: "Current public IP", status: "failed", message },
          { step: "Menara host resolution", status: "failed", message }
        ],
        smtpHostResolution: "",
        smtpHostResolutionStatus: "failed",
        smtpPortStatus: "failed"
      },
      smtp: {
        host: getDefaultSmtpConfig().host,
        port: getDefaultSmtpConfig().port,
        secure: getDefaultSmtpConfig().secure,
        user: maskEmail(getDefaultSmtpConfig().user),
        authStatus: fallbackHealthResult("smtp", message),
        lastTest: runtimeState.lastSmtpTest || null,
        dnsResolutionStatus: "failed",
        tcpConnectivityStatus: "failed",
        lastProofEmail: runtimeState.lastSendSuccess || null
      },
      duckdns: {
        ok: false,
        status: "failed",
        domain: PUBLIC_DOMAIN,
        resolvedIp: "",
        currentPublicIp: "",
        syncStatus: "mismatch",
        error: message,
        raw: ""
      },
      caddy: {
        configStatus: "failed",
        configPreview: "",
        certificateStatus: { status: "unknown", message }
      },
      lastSendSuccess: null,
      lastError: { timestamp: nowIso(), message },
      classification: "critical",
      recommendedAction: message
    }
  }
}

function normalizeHealth(response) {
  if (!response) {
    return fallbackHealthResult("health", "No response")
  }
  if (response.ok && response.payload?.ok !== false) {
    return makeSafeStatusResult({
      ok: true,
      status: "running",
      raw: response.raw || "",
      latencyMs: response.latencyMs,
      message: response.payload?.data?.purpose || response.payload?.data?.publicPurpose || response.payload?.data?.serviceName || "ok",
      statusCode: response.statusCode,
      payload: response.payload
    })
  }
  return makeSafeStatusResult({
    ok: false,
    status: response.ok ? "degraded" : "failed",
    error: response.error || response.payload?.error || "failed",
    raw: response.raw || "",
    latencyMs: response.latencyMs,
    statusCode: response.statusCode,
    payload: response.payload
  })
}

async function handleSend(request, body) {
  const expectedToken = clean(process.env.EMAIL_BRIDGE_TOKEN)
  if (!expectedToken) {
    return { status: 500, payload: { ok: false, error: "EMAIL_BRIDGE_TOKEN is not configured" } }
  }

  const providedToken = clean(request.headers["x-email-os-token"])
  if (providedToken !== expectedToken) {
    return { status: 401, payload: { ok: false, error: "Unauthorized" } }
  }

  const smtpHost = clean(body.smtpHost)
  const smtpPort = Number(body.smtpPort || 587)
  const smtpSecure = String(body.smtpSecure).toLowerCase() === "true"
  const username = clean(body.username)
  const password = clean(body.password)
  const fromEmail = clean(body.fromEmail)
  const toEmail = clean(body.toEmail)
  const cc = clean(body.cc)
  const bcc = clean(body.bcc)
  const subject = clean(body.subject) || "(Sans objet)"
  const text = clean(body.text)
  const html = clean(body.html)
  const replyTo = clean(body.replyTo)
  const diagnostics = safeSummary(body.diagnostics || {})
  const mailbox = clean(body.diagnostics?.mailbox || body.diagnostics?.mailboxKey || body.diagnostics?.mailboxLabel || username || fromEmail)
  const mailboxId = clean(body.diagnostics?.mailboxId || body.diagnostics?.mailbox_id)

  if (!smtpHost || !smtpPort || !username || !password || !fromEmail || !toEmail) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "SMTP configuration, sender and recipient are required"
      }
    }
  }

  const started = Date.now()
  const baseLog = {
    mailbox,
    mailboxId,
    from: fromEmail,
    to: toEmail,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    subject,
    diagnostics
  }

  logStructured(LOG_OUT, {
    event: "SEND_ATTEMPT",
    level: "info",
    message: "Email send attempt",
    ...baseLog
  })
  auditAction({
    action: "SEND_ATTEMPT",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: baseLog,
    result: "attempt",
    before: { mailbox, fromEmail, toEmail, host: smtpHost, port: smtpPort }
  })

  try {
    const info = await sendMail(
      {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: username,
        pass: password,
        fromEmail
      },
      { fromEmail, toEmail, cc, bcc, subject, text, html, replyTo },
      { mailbox, mailboxId }
    )
    const latencyMs = Date.now() - started
    const payload = {
      ok: true,
      data: {
        messageId: clean(info.messageId),
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        response: clean(info.response || ""),
        latencyMs,
        transport: "angelcare-windows-email-bridge",
        mailbox,
        mailboxId,
        from: fromEmail,
        to: toEmail,
        host: smtpHost,
        port: smtpPort
      }
    }
    runtimeState.lastSendSuccess = {
      timestamp: nowIso(),
      event: "SEND_OK",
      message: "Email delivered successfully",
      ...payload.data
    }
    logStructured(LOG_OUT, {
      event: "SEND_OK",
      level: "info",
      message: "Email sent successfully",
      ...payload.data
    })
    auditAction({
      action: "SEND_OK",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: baseLog,
      result: "ok",
      durationMs: latencyMs,
      before: { mailbox, fromEmail, toEmail, host: smtpHost, port: smtpPort },
      after: payload.data
    })
    return { status: 200, payload }
  } catch (error) {
    const latencyMs = Date.now() - started
    const message = error instanceof Error ? error.message : String(error || "Send failed")
    runtimeState.lastSendError = {
      timestamp: nowIso(),
      event: "SEND_ERROR",
      message
    }
    logStructured(LOG_ERROR, {
      event: "SEND_ERROR",
      level: "error",
      message,
      ...baseLog,
      error: message
    })
    auditAction({
      action: "SEND_ERROR",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: baseLog,
      result: "error",
      durationMs: latencyMs,
      before: { mailbox, fromEmail, toEmail, host: smtpHost, port: smtpPort },
      error: message
    })
    return {
      status: 500,
      payload: {
        ok: false,
        error: message
      }
    }
  }
}

function requireAdminToken(request) {
  const expected = clean(process.env.EMAIL_BRIDGE_ADMIN_TOKEN)
  if (!expected) {
    return { ok: false, status: 500, error: "EMAIL_BRIDGE_ADMIN_TOKEN is not configured" }
  }
  const provided = clean(request.headers["x-email-bridge-admin-token"])
  if (provided !== expected) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }
  const limit = rateLimit(request, expected)
  if (!limit.ok) {
    return { ok: false, status: 429, error: "Rate limit exceeded" }
  }
  return { ok: true }
}

function readMaxLinesFromUrl(url, fallback = 200) {
  const value = Number(url.searchParams.get("lines") || fallback)
  if (!Number.isFinite(value)) return fallback
  return Math.min(MAX_LOG_LINES, Math.max(1, Math.floor(value)))
}

function buildLogsResponse(kind, filePath, lines) {
  const payload = readTailJsonl(filePath, lines)
  if (!payload.ok) {
    return { ok: false, payload }
  }
  return {
    ok: true,
    payload: {
      ok: true,
      data: {
        kind,
        filePath,
        totalLines: payload.totalLines,
        returnedLines: payload.returnedLines,
        lines: payload.lines
      }
    }
  }
}

async function handleAdminStatus(request) {
  const snapshot = await buildNetworkSnapshot()
  const bridgeConfig = readCaddyConfig()
  if (bridgeConfig.ok) {
    snapshot.caddy.configPreview = bridgeConfig.preview
  } else if (!snapshot.caddy.configPreview) {
    snapshot.caddy.configPreview = ""
  }
  const backupStatus = summarizeBackupStatus()
  const maintenanceMode = runtimeState.maintenance || loadMaintenanceState()
  const auditTail = readTailJsonl(AUDIT_FILE, 300)
  const auditEntries = Array.isArray(auditTail.lines) ? auditTail.lines : []
  const lastAuditEvent = auditEntries[auditEntries.length - 1] || null
  const serviceActionEntries = auditEntries.filter((entry) => String(entry.action || "").startsWith("SERVICE_"))
  const unauthorizedAttempts = auditEntries.filter((entry) => String(entry.action || "").includes("ACCESS_BLOCKED") || String(entry.result || "").toLowerCase() === "blocked").length
  const failedSmtpAuth = auditEntries.filter((entry) => String(entry.action || "").includes("SMTP") && String(entry.result || "").toLowerCase() === "error").length
  const failedApiCalls = auditEntries.filter((entry) => String(entry.action || "").includes("ERROR") || String(entry.result || "").toLowerCase() === "error").length
  const bridgeLastRestart = await findLatestEvent((entry) => String(entry.action || "") === "SERVICE_RESTART" && String(entry.params?.service || entry.after?.service || entry.before?.service || "").includes(SERVICE_NAME))
  const caddyLastRestart = await findLatestEvent((entry) => String(entry.action || "") === "SERVICE_RESTART" && String(entry.params?.service || entry.after?.service || entry.before?.service || "").includes(CADDY_SERVICE_NAME))
  const bridgeService = {
    ...snapshot.bridgeService,
    lastAction: clean(runtimeState.lastAdminAction?.action || ""),
    lastActionAt: clean(runtimeState.lastAdminAction?.timestamp || ""),
    lastRestartAt: clean(bridgeLastRestart?.timestamp || ""),
  }
  const caddyService = {
    ...snapshot.caddyService,
    lastAction: clean(runtimeState.lastAdminAction?.action || ""),
    lastActionAt: clean(runtimeState.lastAdminAction?.timestamp || ""),
    lastRestartAt: clean(caddyLastRestart?.timestamp || ""),
  }
  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        serviceName: SERVICE_NAME,
        caddyServiceName: CADDY_SERVICE_NAME,
        version: VERSION,
        purpose: "Production email relay for Email-OS -> Menara SMTP",
        status: snapshot.classification,
        globalStatus: snapshot.classification,
        hostname: os.hostname(),
        processId: process.pid,
        nodeVersion: process.version,
        workingDirectory: process.cwd(),
        localTime: nowIso(),
        uptimeSeconds: Math.floor(process.uptime()),
        process: snapshot.process,
        services: {
          bridge: bridgeService,
          caddy: caddyService
        },
        bridgeService,
        caddyService,
        localHealth: snapshot.localHealth,
        publicHealth: snapshot.publicHealth,
        network: snapshot.network,
        smtp: snapshot.smtp,
        duckdns: {
          ...snapshot.duckdns,
          lastUpdatedAt: runtimeState.lastDuckDnsUpdate?.timestamp || ""
        },
        menara: snapshot.menara,
        caddy: snapshot.caddy,
        classification: snapshot.classification,
        recommendedAction: snapshot.recommendedAction,
        publicDomain: PUBLIC_DOMAIN,
        publicPurpose: "Production email relay for Email-OS",
        lastSendSuccess: runtimeState.lastSendSuccess || snapshot.lastSendSuccess,
        lastProofEmail: runtimeState.lastSendSuccess || snapshot.lastSendSuccess,
        lastError: snapshot.lastError,
        lastAdminAction: runtimeState.lastAdminAction,
        backups: backupStatus,
        maintenanceMode,
        auditSummary: {
          totalEvents: auditTail.totalLines || auditEntries.length,
          recentEvents: auditEntries.length,
          unauthorizedAttempts,
          lastEventAt: clean(lastAuditEvent?.timestamp || ""),
          lastEventAction: clean(lastAuditEvent?.action || "")
        },
        security: {
          adminTokenConfigured: Boolean(clean(process.env.EMAIL_BRIDGE_ADMIN_TOKEN)),
          bridgeTokenConfigured: Boolean(clean(process.env.EMAIL_BRIDGE_TOKEN)),
          envPresent: fs.existsSync(path.join(process.cwd(), ".env")) || fs.existsSync(path.join(process.cwd(), ".env.local")) || fs.existsSync("C:\\AngelCare\\email-bridge\\.env"),
          maskedSecrets: true,
          recentUnauthorizedAttempts: unauthorizedAttempts,
          recentTokenMismatchSuspicion: auditEntries.filter((entry) => String(entry.error || entry.message || "").toLowerCase().includes("unauthorized") || String(entry.action || "").includes("BLOCKED")).length,
          recentFailedSmtpAuth: failedSmtpAuth,
          recentFailedApiCalls: failedApiCalls,
          lastAdminAction: clean(runtimeState.lastAdminAction?.action || "")
        },
        cpuSnapshot: computeCpuSnapshot(),
        memory: computeMemorySnapshot(),
        disk: computeDiskSnapshot("C:\\AngelCare"),
        bridgeFiles: {
          serverJsModifiedAt: getPathStats(path.join(process.cwd(), "server.js"))?.modifiedAt || "",
          packageJsonModifiedAt: getPathStats(path.join(process.cwd(), "package.json"))?.modifiedAt || ""
        },
        updateReadiness: {
          bridgeVersion: VERSION,
          serverJsModifiedAt: getPathStats(path.join(process.cwd(), "server.js"))?.modifiedAt || "",
          packageJsonModifiedAt: getPathStats(path.join(process.cwd(), "package.json"))?.modifiedAt || "",
          nodeVersion: process.version,
          npmDependenciesStatus: "unknown",
          lastSyntaxCheck: runtimeState.lastAdminAction?.action === "BRIDGE_SYNTAX_CHECK" ? runtimeState.lastAdminAction.timestamp : "",
          lastRestartAfterUpdate: bridgeLastRestart?.timestamp || ""
        },
        technical: {
          bridgeProcessStatus: snapshot.bridgeService?.status || "unknown",
          serviceName: SERVICE_NAME,
          caddyServiceName: CADDY_SERVICE_NAME,
          hostname: os.hostname(),
          localTime: nowIso(),
          nodeVersion: process.version,
          workingDirectory: process.cwd()
        },
        auditServiceActions: serviceActionEntries.slice(-20)
      }
    }
  }
}

async function handleAdminLogs(request, url) {
  const lines = readMaxLinesFromUrl(url, 200)
  const kind = clean(url.pathname.split("/").pop() || "bridge")
  const mapping = {
    bridge: LOG_OUT,
    "bridge-error": LOG_ERROR,
    caddy: LOG_CADDY_OUT,
    "caddy-error": LOG_CADDY_ERROR,
    duckdns: LOG_DUCKDNS,
    audit: AUDIT_FILE,
    service: LOG_SERVICE
  }
  return buildLogsResponse(kind, mapping[kind] || LOG_OUT, lines)
}

async function handleAdminAudit(request, url) {
  return buildLogsResponse("audit", AUDIT_FILE, readMaxLinesFromUrl(url, 200))
}

async function handleAdminAuditEvent(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const event = body?.event && typeof body.event === "object" ? body.event : body
  const action = clean(event?.action)
  if (!action) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Audit event action is required",
        errorName: "AuditEventInvalid",
        errorMessage: "Audit event action is required"
      }
    }
  }

  const record = {
    timestamp: clean(event?.timestamp) || nowIso(),
    actor: clean(event?.actor) || "operator",
    action,
    target: clean(event?.target) || "/opsos/infrastructure/windows-node",
    result: clean(event?.result) || "unknown",
    reason: clean(event?.reason),
    severity: clean(event?.severity) || "info",
    metadataSummary: clean(event?.metadataSummary) || "",
  }

  auditAction({
    action: record.action,
    actor: record.actor,
    ip: getRequestIp(request),
    params: record,
    result: record.result,
    before: null,
    after: record
  })
  logStructured(LOG_SERVICE, {
    event: "AUDIT_EVENT",
    level: "info",
    message: record.action,
    ...record
  })

  return {
    status: 200,
    payload: {
      ok: true,
      data: record
    }
  }
}

async function handleBackupCreate(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const reason = clean(body.reason)
  if (!reason) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Backup reason is required",
        errorName: "BackupReasonRequired",
        errorMessage: "Backup reason is required"
      }
    }
  }

  const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`
  const destination = path.join(BACKUP_ROOT, backupId)
  const assets = backupCandidateFiles()
  const manifest = {
    backupId,
    createdAt: nowIso(),
    reason,
    operator: clean(request.headers["x-angelcare-operator"]) || "system",
    files: [],
    warnings: [],
  }

  ensureDir(path.join(destination, BACKUP_MANIFEST_NAME))
  fs.mkdirSync(destination, { recursive: true })

  for (const source of assets) {
    const entry = {
      source,
      name: getFileNameSafe(source),
      present: fs.existsSync(source),
      copied: false,
      relativePath: getFileNameSafe(source),
    }

    if (entry.present) {
      try {
        const target = path.join(destination, entry.relativePath)
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.cpSync(source, target, { recursive: true })
        entry.copied = true
      } catch (error) {
        entry.copied = false
        manifest.warnings.push(`Failed to copy ${entry.name}: ${error instanceof Error ? error.message : String(error || "copy failed")}`)
      }
    } else {
      manifest.warnings.push(`Missing asset: ${entry.name}`)
    }

    manifest.files.push(entry)
  }

  const notesFile = path.join(destination, "backup-notes.txt")
  fs.writeFileSync(notesFile, [
    `Backup ID: ${backupId}`,
    `Created At: ${manifest.createdAt}`,
    `Reason: ${reason}`,
    `Operator: ${manifest.operator}`,
    `Files: ${manifest.files.length}`,
  ].join("\n"), "utf8")

  fs.writeFileSync(path.join(destination, BACKUP_MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  runtimeState.lastBackup = {
    timestamp: manifest.createdAt,
    backupId,
    backupPath: destination,
    manifestSummary: buildSafeManifestSummary(manifest)
  }

  auditAction({
    action: "BACKUP_CREATE",
    actor: manifest.operator,
    ip: getRequestIp(request),
    params: { reason, backupId },
    result: "ok",
    after: runtimeState.lastBackup
  })
  logStructured(LOG_SERVICE, {
    event: "BACKUP_CREATE",
    level: "info",
    message: `Backup created: ${backupId}`,
    backupId,
    files: manifest.files.length,
    warnings: manifest.warnings.length
  })

  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        backupId,
        timestamp: manifest.createdAt,
        includedAssets: manifest.files.map((entry) => ({
          name: entry.name,
          present: entry.present,
          copied: entry.copied,
        })),
        missingAssets: manifest.files.filter((entry) => !entry.present).map((entry) => entry.name),
        warnings: manifest.warnings.slice(0, 20),
        manifestSummary: buildSafeManifestSummary(manifest)
      }
    }
  }
}

async function handleBackupStatus(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const status = summarizeBackupStatus()
  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        directoryExists: status.directoryExists,
        latestBackupAt: status.latestBackupAt,
        latestBackupName: status.latestBackupName,
        backupCount: status.backupCount,
        folderSizeBytes: status.folderSizeBytes,
        latestManifestSummary: status.latestManifestSummary,
        protectedAssets: status.protectedAssets.map((item) => ({
          name: item.name,
          present: item.present,
        })),
        warnings: status.warnings,
        lastCheckedAt: status.lastCheckedAt
      }
    }
  }
}

function setMaintenanceState(enabled, body, request) {
  const current = runtimeState.maintenance || loadMaintenanceState()
  const next = {
    enabled,
    reason: clean(body.reason) || current.reason,
    expectedDuration: clean(body.expectedDuration || body.expected_duration) || current.expectedDuration,
    startedAt: enabled ? current.startedAt || nowIso() : "",
    startedBy: enabled ? (clean(request.headers["x-angelcare-operator"]) || current.startedBy || "system") : "",
    message: clean(body.message) || (enabled ? `Maintenance mode enabled: ${clean(body.reason)}` : "Maintenance mode disabled")
  }
  saveMaintenanceState(next)
  return next
}

async function handleMaintenanceStatus(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  return {
    status: 200,
    payload: {
      ok: true,
      data: runtimeState.maintenance || loadMaintenanceState()
    }
  }
}

async function handleMaintenanceChange(request, enabled, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const reason = clean(body.reason)
  const expectedDuration = clean(body.expectedDuration || body.expected_duration)

  if (enabled && !reason) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Maintenance reason is required",
        errorName: "MaintenanceReasonRequired",
        errorMessage: "Maintenance reason is required"
      }
    }
  }

  if (enabled && !expectedDuration) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Maintenance expected duration is required",
        errorName: "MaintenanceDurationRequired",
        errorMessage: "Maintenance expected duration is required"
      }
    }
  }

  const state = setMaintenanceState(enabled, body, request)
  const action = enabled ? "MAINTENANCE_ENABLE" : "MAINTENANCE_DISABLE"
  auditAction({
    action,
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { reason, expectedDuration },
    result: "ok",
    after: state
  })
  logStructured(LOG_SERVICE, {
    event: action,
    level: "info",
    message: state.message,
    state
  })

  return {
    status: 200,
    payload: {
      ok: true,
      data: state
    }
  }
}

async function handleMaintenanceExtend(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const current = runtimeState.maintenance || loadMaintenanceState()
  if (!current.enabled) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Maintenance mode is not enabled",
        errorName: "MaintenanceNotEnabled",
        errorMessage: "Maintenance mode is not enabled"
      }
    }
  }

  const next = setMaintenanceState(true, {
    reason: clean(body.reason) || current.reason,
    expectedDuration: clean(body.expectedDuration || body.expected_duration) || current.expectedDuration,
    message: clean(body.message) || current.message,
  }, request)

  auditAction({
    action: "MAINTENANCE_EXTEND",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { reason: next.reason, expectedDuration: next.expectedDuration },
    result: "ok",
    after: next
  })
  logStructured(LOG_SERVICE, {
    event: "MAINTENANCE_EXTEND",
    level: "info",
    message: next.message,
    state: next
  })

  return {
    status: 200,
    payload: {
      ok: true,
      data: next
    }
  }
}

async function handleAdminService(request, action, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const service = clean(body.service)
  const confirmation = clean(body.confirmation)
  const reason = clean(body.reason)
  if (![SERVICE_NAME, CADDY_SERVICE_NAME].includes(service)) {
    return { status: 400, payload: { ok: false, error: "Unsupported service", errorName: "ServiceUnsupported", errorMessage: "Unsupported service" } }
  }
  if (!reason) {
    return { status: 400, payload: { ok: false, error: "Action reason is required", errorName: "ActionReasonRequired", errorMessage: "Action reason is required" } }
  }
  if (action === "stop" && !confirmation) {
    return { status: 400, payload: { ok: false, error: "Stopping a service requires confirmation", errorName: "ActionConfirmationRequired", errorMessage: "Stopping a service requires confirmation" } }
  }
  if (action === "stop" && service === CADDY_SERVICE_NAME && !/CONFIRM/i.test(confirmation)) {
    return { status: 400, payload: { ok: false, error: "Stopping Caddy requires explicit confirmation", errorName: "ActionConfirmationRequired", errorMessage: "Stopping Caddy requires explicit confirmation" } }
  }

  const started = Date.now()
  const before = await getServiceStatus(service)
  let result
  let error = ""
  try {
    result = await changeServiceState(service, action)
    if (result.error) {
      error = result.error instanceof Error ? result.error.message : String(result.error)
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err || "service action failed")
  }
  const after = result ? result.after : await getServiceStatus(service)
  const durationMs = Date.now() - started
  const expectedStatus = action === "stop" ? "stopped" : "running"
  const ok = !error && (after?.status || "unknown") === expectedStatus
  const record = {
    action: `SERVICE_${action.toUpperCase()}`,
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { service, confirmation: confirmation ? "***REDACTED***" : "", reason },
    result: ok ? "ok" : "error",
    durationMs,
    before,
    after,
    error
  }
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: record.action,
    target: service,
    reason,
    result: record.result
  }
  auditAction(record)
  logStructured(ok ? LOG_SERVICE : LOG_ERROR, {
    event: record.action,
    level: ok ? "info" : "error",
    message: ok ? `${service} ${action} completed` : error,
    service,
    before,
    after
  })
  return {
    status: ok ? 200 : 500,
    payload: {
      ok,
      data: {
        service,
        action,
        before,
        after,
        command: result ? result.commandUsed : "",
        error: error || "",
        durationMs,
        warning: action === "stop" && service === CADDY_SERVICE_NAME ? "Stopping Caddy can cut public operator access." : ""
      },
      error: ok ? undefined : error || "Service action failed"
    }
  }
}

async function handleAdminCaddy(request, action, body = {}) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const started = Date.now()
  const before = await getServiceStatus(CADDY_SERVICE_NAME)
  let outcome
  let error = ""
  try {
    if (action === "validate") {
      outcome = await validateCaddyConfig()
      runtimeState.lastCaddyValidation = {
        timestamp: nowIso(),
        status: "ok"
      }
    } else if (action === "reload") {
      outcome = await reloadCaddy()
    } else {
      return { status: 400, payload: { ok: false, error: "Unsupported caddy action", errorName: "CaddyActionUnsupported", errorMessage: "Unsupported caddy action" } }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err || "Caddy action failed")
  }
  const after = await getServiceStatus(CADDY_SERVICE_NAME)
  const durationMs = Date.now() - started
  const ok = !error
  auditAction({
    action: `CADDY_${action.toUpperCase()}`,
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { reason: clean(body.reason || "") },
    result: ok ? "ok" : "error",
    durationMs,
    before,
    after,
    error
  })
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: `CADDY_${action.toUpperCase()}`,
    target: CADDY_SERVICE_NAME,
    reason: clean(body.reason || ""),
    result: ok ? "ok" : "error"
  }
  logStructured(ok ? LOG_CADDY_OUT : LOG_CADDY_ERROR, {
    event: `CADDY_${action.toUpperCase()}`,
    level: ok ? "info" : "error",
    message: ok ? `Caddy ${action} completed` : error,
    before,
    after,
    output: outcome ? outcome.output || outcome.commandUsed || "" : ""
  })
  if (ok) {
    logStructured(LOG_SERVICE, {
      event: `CADDY_${action.toUpperCase()}`,
      level: "info",
      message: `Caddy ${action} completed`,
      before,
      after
    })
  }
  return {
    status: ok ? 200 : 500,
    payload: {
      ok,
      data: {
        before,
        after,
        durationMs,
        command: outcome ? outcome.commandUsed || "" : "",
        output: outcome ? outcome.output || "" : "",
        error: error || ""
      },
      error: ok ? undefined : error || "Caddy action failed"
    }
  }
}

async function handleDuckDnsUpdate(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const started = Date.now()
  const before = await resolveDuckDns()
  const scriptExists = fs.existsSync(DUCKDNS_UPDATE_SCRIPT)
  let commandUsed = ""
  let error = ""
  try {
    if (scriptExists) {
      const result = await runCommand("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", DUCKDNS_UPDATE_SCRIPT], 60000)
      commandUsed = result.command || "powershell duckdns update"
    } else {
      error = `DuckDNS update script not found at ${DUCKDNS_UPDATE_SCRIPT}`
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err || "DuckDNS update failed")
  }
  const after = await resolveDuckDns()
  const durationMs = Date.now() - started
  const publicIp = await getPublicIp()
  const status = after.ok && publicIp.ok && after.ip === publicIp.ip ? "synced" : "mismatch"
  runtimeState.lastDuckDnsUpdate = {
    timestamp: nowIso(),
    status,
    command: commandUsed,
    before,
    after,
    publicIp: publicIp.ok ? publicIp.ip : "",
    error
  }
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: "DUCKDNS_UPDATE",
    target: PUBLIC_DOMAIN,
    reason: "Refresh DuckDNS mapping",
    result: error ? "error" : "ok"
  }
  auditAction({
    action: "DUCKDNS_UPDATE",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { scriptExists },
    result: error ? "error" : "ok",
    durationMs,
    before,
    after,
    error
  })
  logStructured(error ? LOG_ERROR : LOG_DUCKDNS, {
    event: "DUCKDNS_UPDATE",
    level: error ? "error" : "info",
    message: error || "DuckDNS update executed",
    before,
    after,
    commandUsed
  })
  return {
    status: error ? 500 : 200,
    payload: {
      ok: !error,
      data: {
        before,
        after,
        status,
        command: commandUsed,
        scriptExists,
        publicIp: publicIp.ok ? publicIp.ip : "",
        durationMs,
        error
      },
      error: error || undefined
    }
  }
}

async function handleSmtpTest(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const started = Date.now()
  const config = getDefaultSmtpConfig()
  if (!config.host || !config.port || !config.user || !config.pass) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Default SMTP configuration is incomplete",
        errorName: "SmtpConfigIncomplete",
        errorMessage: "Default SMTP configuration is incomplete"
      }
    }
  }
  let verify = null
  let error = ""
  try {
    verify = await verifySmtp(config)
  } catch (err) {
    error = err instanceof Error ? err.message : String(err || "SMTP test failed")
  }
  const durationMs = Date.now() - started
  const result = error
    ? { status: "failed", message: error }
    : { status: "ok", message: "SMTP verify successful" }
  runtimeState.lastSmtpTest = {
    timestamp: nowIso(),
    ...result,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: maskEmail(config.user),
    durationMs
  }
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: error ? "SMTP_TEST_ERROR" : "SMTP_TEST_OK",
    target: `${config.host}:${config.port}`,
    reason: "Validate SMTP auth and connectivity",
    result: error ? "error" : "ok"
  }
  auditAction({
    action: "SMTP_TEST",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: configSafe(config),
    result: error ? "error" : "ok",
    durationMs,
    after: runtimeState.lastSmtpTest,
    error
  })
  logStructured(error ? LOG_ERROR : LOG_SERVICE, {
    event: error ? "SMTP_TEST_ERROR" : "SMTP_TEST_OK",
    level: error ? "error" : "info",
    message: error || "SMTP verify successful",
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: maskEmail(config.user),
    verify
  })
  return {
    status: error ? 500 : 200,
    payload: {
      ok: !error,
      data: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: maskEmail(config.user),
        status: result.status,
        message: result.message,
        latencyMs: durationMs,
        verify: Boolean(verify),
        error
      },
      error: error || undefined
    }
  }
}

async function handleSendTest(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const config = getDefaultSmtpConfig()
  const toEmail = clean(body.toEmail)
  const subject = clean(body.subject) || "AngelCare - preuve de livraison Menara"
  const text = clean(body.text) || "Email de test"
  const reason = clean(body.reason)
  if (!toEmail || !text) {
    return { status: 400, payload: { ok: false, error: "toEmail and text are required", errorName: "ProofSendMissingFields", errorMessage: "toEmail and text are required" } }
  }
  if (!reason) {
    return { status: 400, payload: { ok: false, error: "Reason is required", errorName: "ReasonRequired", errorMessage: "Reason is required" } }
  }
  const started = Date.now()
  const mailbox = maskEmail(config.user || config.fromEmail)
  let info = null
  let error = ""
  try {
    info = await sendMail(
      config,
      { fromEmail: config.fromEmail || config.user, toEmail, subject, text, html: String(text).replace(/\n/g, "<br />") },
      { mailbox, mailboxId: "" }
    )
  } catch (err) {
    error = err instanceof Error ? err.message : String(err || "send test failed")
  }
  const durationMs = Date.now() - started
  const payloadData = error
    ? null
    : {
        messageId: clean(info.messageId),
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        response: clean(info.response || ""),
        latencyMs: durationMs,
        transport: "angelcare-windows-email-bridge",
        from: config.fromEmail || config.user,
        to: toEmail
      }
  auditAction({
    action: error ? "SEND_TEST_ERROR" : "SEND_TEST_OK",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { toEmail, subject, textLength: text.length, mailbox: maskEmail(config.user), reason },
    result: error ? "error" : "ok",
    durationMs,
    after: payloadData,
    error
  })
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: error ? "SEND_TEST_ERROR" : "SEND_TEST_OK",
    target: toEmail,
    reason,
    result: error ? "error" : "ok"
  }
  logStructured(error ? LOG_ERROR : LOG_SERVICE, {
    event: error ? "SEND_TEST_ERROR" : "SEND_TEST_OK",
    level: error ? "error" : "info",
    message: error || "Delivery proof email sent",
    to: toEmail,
    subject,
    mailbox,
    latencyMs: durationMs,
    messageId: payloadData ? payloadData.messageId : ""
  })
  if (!error) {
    runtimeState.lastSendSuccess = {
      timestamp: nowIso(),
      event: "SEND_TEST_OK",
      message: "Delivery proof email sent",
      ...payloadData
    }
  }
  return {
    status: error ? 500 : 200,
    payload: {
      ok: !error,
      data: payloadData,
      error: error || undefined
    }
  }
}

async function handleNetworkTest(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const started = Date.now()
  const snapshot = await buildNetworkSnapshot()
  runtimeState.lastNetworkTest = {
    timestamp: nowIso(),
    classification: snapshot.classification,
    recommendedAction: snapshot.recommendedAction,
    diagnosticTree: snapshot.network.diagnosticTree
  }
  auditAction({
    action: "NETWORK_TEST",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: {},
    result: "ok",
    durationMs: Date.now() - started,
    after: runtimeState.lastNetworkTest
  })
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: "NETWORK_TEST",
    target: PUBLIC_DOMAIN,
    reason: "Run network diagnostic",
    result: "ok"
  }
  logStructured(LOG_SERVICE, {
    event: "NETWORK_TEST",
    level: "info",
    message: "Network diagnostic executed",
    snapshot: {
      classification: snapshot.classification,
      recommendedAction: snapshot.recommendedAction,
      diagnosticTree: snapshot.network.diagnosticTree
    }
  })
  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        classification: snapshot.classification,
        recommendedAction: snapshot.recommendedAction,
        diagnosticTree: snapshot.network.diagnosticTree,
        network: snapshot.network,
        smtp: snapshot.smtp,
        duckdns: snapshot.duckdns,
        caddy: snapshot.caddy,
        services: snapshot.services
      }
    }
  }
}

async function handleSystemCommand(request, kind, confirmation, reason = "") {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  if (!reason) {
    return { status: 400, payload: { ok: false, error: "Reason is required", errorName: "ReasonRequired", errorMessage: "Reason is required" } }
  }
  if ((kind === "reboot" || kind === "restart") && confirmation !== "CONFIRM SERVER RESTART") {
    return { status: 400, payload: { ok: false, error: "Invalid restart confirmation", errorName: "ActionConfirmationRequired", errorMessage: "Invalid restart confirmation" } }
  }
  if (kind === "shutdown" && confirmation !== "CONFIRM SERVER SHUTDOWN") {
    return { status: 400, payload: { ok: false, error: "Invalid shutdown confirmation", errorName: "ActionConfirmationRequired", errorMessage: "Invalid shutdown confirmation" } }
  }
  const command = kind === "reboot" || kind === "restart"
    ? ["shutdown", ["/r", "/t", "30", "/c", "AngelCare controlled Windows bridge restart"]]
    : ["shutdown", ["/s", "/t", "30", "/c", "AngelCare controlled Windows bridge shutdown"]]
  const commandText = `${command[0]} ${command[1].join(" ")}`
  const started = Date.now()
  auditAction({
    action: kind === "reboot" || kind === "restart" ? "SYSTEM_REBOOT" : "SYSTEM_SHUTDOWN",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: { confirmation: "***REDACTED***", reason },
    result: "accepted",
    durationMs: 0
  })
  runtimeState.lastAdminAction = {
    timestamp: nowIso(),
    action: kind === "reboot" || kind === "restart" ? "SYSTEM_RESTART" : "SYSTEM_SHUTDOWN",
    target: "windows-node",
    reason,
    result: "accepted"
  }
  try {
    await runCommand(command[0], command[1], 30000)
    logStructured(LOG_SERVICE, {
      event: kind === "reboot" || kind === "restart" ? "SYSTEM_REBOOT_ACCEPTED" : "SYSTEM_SHUTDOWN_ACCEPTED",
      level: "info",
      message: kind === "reboot" || kind === "restart" ? "Restart command accepted" : "Shutdown command accepted",
      command: commandText,
      reason
    })
    return {
      status: 200,
      payload: {
        ok: true,
        data: {
          accepted: true,
          command: commandText,
          delaySeconds: 30,
          durationMs: Date.now() - started
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "system command failed")
    logStructured(LOG_ERROR, {
      event: kind === "reboot" || kind === "restart" ? "SYSTEM_REBOOT_ERROR" : "SYSTEM_SHUTDOWN_ERROR",
      level: "error",
      message,
      command: commandText,
      reason
    })
    auditAction({
      action: kind === "reboot" || kind === "restart" ? "SYSTEM_REBOOT_ERROR" : "SYSTEM_SHUTDOWN_ERROR",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: { confirmation: "***REDACTED***", reason },
      result: "error",
      durationMs: Date.now() - started,
      error: message
    })
    return {
      status: 500,
      payload: {
        ok: false,
        error: message,
        errorName: "SystemCommandFailed",
        errorMessage: message
      }
    }
  }
}

async function handleCancelShutdown(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }
  const started = Date.now()
  try {
    await runCommand("shutdown", ["/a"], 15000)
    auditAction({
      action: "SYSTEM_CANCEL_SHUTDOWN",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: {},
      result: "ok",
      durationMs: Date.now() - started
    })
    runtimeState.lastAdminAction = {
      timestamp: nowIso(),
      action: "SYSTEM_CANCEL_SHUTDOWN",
      target: "windows-node",
      reason: "Cancel scheduled shutdown",
      result: "ok"
    }
    logStructured(LOG_SERVICE, {
      event: "SYSTEM_CANCEL_SHUTDOWN",
      level: "info",
      message: "Shutdown cancelled"
    })
    return {
      status: 200,
      payload: {
        ok: true,
        data: {
          accepted: true,
          command: "shutdown /a",
          durationMs: Date.now() - started
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "cancel shutdown failed")
    auditAction({
      action: "SYSTEM_CANCEL_SHUTDOWN_ERROR",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: {},
      result: "error",
      durationMs: Date.now() - started,
      error: message
    })
    logStructured(LOG_ERROR, {
      event: "SYSTEM_CANCEL_SHUTDOWN_ERROR",
      level: "error",
      message
    })
    return { status: 500, payload: { ok: false, error: message, errorName: "CancelShutdownFailed", errorMessage: message } }
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`)
  const pathname = url.pathname

  if (request.method === "GET" && pathname === "/health") {
    return writeJson(response, 200, {
      ok: true,
      data: {
        ...getSettings(),
        time: nowIso(),
        uptimeSeconds: Math.floor(process.uptime()),
        publicPurpose: "Production email relay for Email-OS",
        processId: process.pid
      }
    })
  }

  if (request.method === "POST" && pathname === "/send") {
    const body = await readJsonBody(request)
    const result = await handleSend(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/status" && request.method === "GET") {
    const auth = requireAdminToken(request)
    if (!auth.ok) return writeJson(response, auth.status, { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error })
    const result = await handleAdminStatus(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname.startsWith("/admin/logs/") && request.method === "GET") {
    const auth = requireAdminToken(request)
    if (!auth.ok) return writeJson(response, auth.status, { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error })
    const result = await handleAdminLogs(request, url)
    return writeJson(response, result.ok ? 200 : 404, result.payload)
  }

  if (pathname === "/admin/audit" && request.method === "GET") {
    const auth = requireAdminToken(request)
    if (!auth.ok) return writeJson(response, auth.status, { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error })
    const result = await handleAdminAudit(request, url)
    return writeJson(response, result.ok ? 200 : 404, result.payload)
  }

  if (pathname === "/admin/audit/event" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminAuditEvent(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/service/start" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminService(request, "start", body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/service/stop" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminService(request, "stop", body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/service/restart" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminService(request, "restart", body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/caddy/validate" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminCaddy(request, "validate", body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/caddy/reload" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminCaddy(request, "reload", body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/caddy/config" && request.method === "GET") {
    const auth = requireAdminToken(request)
    if (!auth.ok) return writeJson(response, auth.status, { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error })
    const config = readCaddyConfig()
    if (!config.ok) return writeJson(response, 404, { ok: false, error: config.error })
    return writeJson(response, 200, {
      ok: true,
      data: {
        filePath: CADDYFILE_PATH,
        config: config.preview,
        redacted: true
      }
    })
  }

  if (pathname === "/admin/duckdns/status" && request.method === "GET") {
    const auth = requireAdminToken(request)
    if (!auth.ok) return writeJson(response, auth.status, { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error })
    const [resolved, publicIp] = await Promise.all([resolveDuckDns(), getPublicIp()])
    return writeJson(response, 200, {
      ok: true,
      data: {
        domain: PUBLIC_DOMAIN,
        resolvedIp: resolved.ok ? resolved.ip : "",
        publicIp: publicIp.ok ? publicIp.ip : "",
        status: resolved.ok && publicIp.ok && resolved.ip === publicIp.ip ? "synced" : "mismatch",
        resolved,
        publicIpResult: publicIp
      }
    })
  }

  if (pathname === "/admin/duckdns/update" && request.method === "POST") {
    const result = await handleDuckDnsUpdate(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/backup/create" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleBackupCreate(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/backup/status" && request.method === "GET") {
    const result = await handleBackupStatus(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/maintenance/status" && request.method === "GET") {
    const result = await handleMaintenanceStatus(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/maintenance/enable" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleMaintenanceChange(request, true, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/maintenance/disable" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleMaintenanceChange(request, false, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/maintenance/extend" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleMaintenanceExtend(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/test/smtp" && request.method === "POST") {
    const result = await handleSmtpTest(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/test/send" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleSendTest(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/test/network" && request.method === "POST") {
    const result = await handleNetworkTest(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/system/restart" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleSystemCommand(request, "restart", clean(body.confirmation), clean(body.reason))
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/system/reboot" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleSystemCommand(request, "reboot", clean(body.confirmation), clean(body.reason))
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/system/shutdown" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleSystemCommand(request, "shutdown", clean(body.confirmation), clean(body.reason))
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/system/cancel-shutdown" && request.method === "POST") {
    const result = await handleCancelShutdown(request)
    return writeJson(response, result.status, result.payload)
  }

  return notFound(response)
}

function createServer() {
  return http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      const message = error instanceof Error ? error.message : String(error || "Internal server error")
      try {
        logStructured(LOG_ERROR, {
          event: "UNHANDLED_ERROR",
          level: "error",
          message
        })
      } catch {}
      writeJson(response, 500, { ok: false, error: message })
    })
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const server = createServer()

server.listen(PORT, HOST, () => {
  logStructured(LOG_OUT, {
    event: "SERVER_START",
    level: "info",
    message: `AngelCare email bridge started on ${HOST}:${PORT}`,
    serviceName: SERVICE_NAME,
    caddyServiceName: CADDY_SERVICE_NAME,
    version: VERSION
  })
  console.log(`[${SERVICE_NAME}] listening on http://${HOST}:${PORT}`)
})

process.on("SIGINT", () => {
  logStructured(LOG_OUT, { event: "SERVER_STOP", level: "info", message: "SIGINT received" })
  process.exit(0)
})

process.on("SIGTERM", () => {
  logStructured(LOG_OUT, { event: "SERVER_STOP", level: "info", message: "SIGTERM received" })
  process.exit(0)
})
