const http = require("http")
const net = require("net")
const tls = require("tls")
const os = require("os")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const dns = require("dns").promises
const { execFile } = require("child_process")
const { promisify } = require("util")
const nodemailer = require("nodemailer")
const { simpleParser } = require("mailparser")

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
const STORAGE_ROOT = clean(process.env.ANGELCARE_STORAGE_ROOT || "C:\\AngelCare\\storage") || "C:\\AngelCare\\storage"
const CADDYFILE_PATH = clean(process.env.CADDYFILE_PATH || "C:\\AngelCare\\caddy\\Caddyfile") || "C:\\AngelCare\\caddy\\Caddyfile"
const DUCKDNS_UPDATE_SCRIPT = clean(process.env.DUCKDNS_UPDATE_SCRIPT || "C:\\AngelCare\\duckdns\\update-duckdns.ps1") || "C:\\AngelCare\\duckdns\\update-duckdns.ps1"
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const MAX_LOG_LINES = 1000
const MAX_BACKUP_COUNT = 50
const MAX_POP_MESSAGE_BYTES = 10 * 1024 * 1024
const POP_TIMEOUT_MS = 25_000
const STORAGE_BUCKET = "email-os-attachments"
const STORAGE_NODE = "angelcare-windows-node-01"
const STORAGE_MAX_FILE_BYTES = 8 * 1024 * 1024
const STORAGE_WARNING_FREE_BYTES = 40 * 1024 * 1024 * 1024
const STORAGE_CRITICAL_FREE_BYTES = 25 * 1024 * 1024 * 1024
const STORAGE_INVENTORY_MAX_FILES = Math.max(1000, Number(process.env.STORAGE_INVENTORY_MAX_FILES || 50000))
const STORAGE_INVENTORY_MAX_DURATION_MS = Math.max(2000, Number(process.env.STORAGE_INVENTORY_MAX_DURATION_MS || 12000))
const STORAGE_INVENTORY_CACHE_MS = Math.max(5000, Number(process.env.STORAGE_INVENTORY_CACHE_MS || 30000))
const STORAGE_INVENTORY_TOP_FILES = Math.max(20, Math.min(250, Number(process.env.STORAGE_INVENTORY_TOP_FILES || 100)))
const STORAGE_EXPLORER_MAX_RESULTS = Math.max(25, Math.min(500, Number(process.env.STORAGE_EXPLORER_MAX_RESULTS || 200)))
const STORAGE_EXPLORER_SEARCH_MS = Math.max(1000, Math.min(15000, Number(process.env.STORAGE_EXPLORER_SEARCH_MS || 5000)))
const STORAGE_PREVIEW_MAX_BYTES = Math.max(256 * 1024, Math.min(8 * 1024 * 1024, Number(process.env.STORAGE_PREVIEW_MAX_BYTES || 3 * 1024 * 1024)))
const STORAGE_TEXT_PREVIEW_MAX_BYTES = Math.max(64 * 1024, Math.min(2 * 1024 * 1024, Number(process.env.STORAGE_TEXT_PREVIEW_MAX_BYTES || 512 * 1024)))
const ANGELCARE_APP_ROOT = clean(process.env.ANGELCARE_APP_ROOT || "")
const ANGELCARE_UPLOADS_DIR = clean(process.env.ANGELCARE_UPLOADS_DIR || "")
const ANGELCARE_EXPORTS_DIR = clean(process.env.ANGELCARE_EXPORTS_DIR || "")
const STORAGE_QUARANTINE_ROOT = clean(process.env.STORAGE_QUARANTINE_ROOT || "C:\\AngelCare\\quarantine") || "C:\\AngelCare\\quarantine"
const STORAGE_QUARANTINE_TOKEN_SECRET = clean(process.env.STORAGE_QUARANTINE_TOKEN_SECRET || process.env.EMAIL_BRIDGE_ADMIN_TOKEN || "angelcare-storage-quarantine")
const STORAGE_QUARANTINE_MAX_FILE_BYTES = Math.max(1024 * 1024, Number(process.env.STORAGE_QUARANTINE_MAX_FILE_BYTES || 20 * 1024 * 1024 * 1024))
const STORAGE_CANONICAL_ROOT = clean(process.env.STORAGE_CANONICAL_ROOT || "C:\\AngelCare\\content-store") || "C:\\AngelCare\\content-store"
const STORAGE_DEDUP_MAPPING_FILE = path.join(STATUS_DIR, "storage-dedup-mappings.json")
const STORAGE_DEDUP_MAX_COPIES = Math.max(2, Math.min(250, Number(process.env.STORAGE_DEDUP_MAX_COPIES || 100)))
const STORAGE_PROVIDER_REMOTE_DELETE_ENABLED = String(process.env.STORAGE_PROVIDER_REMOTE_DELETE_ENABLED || "false").toLowerCase() === "true"

const LOG_OUT = path.join(LOG_DIR, "email-bridge-out.log")
const LOG_ERROR = path.join(LOG_DIR, "email-bridge-error.log")
const LOG_CADDY_OUT = path.join(LOG_DIR, "caddy-out.log")
const LOG_CADDY_ERROR = path.join(LOG_DIR, "caddy-error.log")
const LOG_DUCKDNS = path.join(LOG_DIR, "duckdns.log")
const LOG_SERVICE = path.join(LOG_DIR, "service-actions.jsonl")
const AUDIT_FILE = path.join(LOG_DIR, "email-bridge-audit.jsonl")
const STORAGE_EVENT_FILE = path.join(LOG_DIR, "storage-events.jsonl")
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
  lastStorageUpload: null,
  lastStorageDownload: null,
  lastStorageError: null,
  lastStorageInventory: null,
  previousStorageInventory: null,
  storageInventoryPromise: null,
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

function ensureStorageDirectories() {
  const directories = [
    path.join(STORAGE_ROOT, "email-os", "attachments", "inbound"),
    path.join(STORAGE_ROOT, "email-os", "attachments", "outbound"),
    path.join(STORAGE_ROOT, "email-os", "attachments", "temp"),
    path.join(STORAGE_ROOT, "email-os", "attachments", "archive")
  ]

  for (const directory of directories) {
    fs.mkdirSync(directory, { recursive: true })
  }

  return directories
}

function getStorageDirectories() {
  const [inbound, outbound, temp, archive] = ensureStorageDirectories()
  return { inbound, outbound, temp, archive }
}

function sanitizeStoragePart(value) {
  const raw = clean(value).replace(/[\\/:*?"<>|]+/g, "_")
  return raw.replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "item"
}

function sanitizeStorageFilename(value) {
  const raw = clean(value).replace(/[\\/:*?"<>|]+/g, "_")
  return raw.replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 160) || "attachment"
}

function normalizeStorageDirection(value) {
  const direction = clean(value).toLowerCase()
  if (direction === "inbound" || direction === "temp" || direction === "archive") return direction
  return "outbound"
}

function buildStorageFolder(direction, moduleKey, entityType, fileId) {
  const dirs = getStorageDirectories()
  const base = normalizeStorageDirection(direction)
  const root = base === "inbound" ? dirs.inbound : base === "temp" ? dirs.temp : base === "archive" ? dirs.archive : dirs.outbound
  return path.join(root, sanitizeStoragePart(moduleKey), sanitizeStoragePart(entityType), clean(fileId))
}

function buildStorageFilePath(direction, moduleKey, entityType, fileId, filename) {
  return path.join(buildStorageFolder(direction, moduleKey, entityType, fileId), sanitizeStorageFilename(filename))
}

function buildStorageMetaPath(direction, moduleKey, entityType, fileId, filename) {
  return path.join(buildStorageFolder(direction, moduleKey, entityType, fileId), "_metadata.json")
}

function isWithinRoot(candidate, rootPath) {
  const resolvedCandidate = path.resolve(candidate)
  const resolvedRoot = path.resolve(rootPath)
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)
}

function storageEventAction(label) {
  return String(label || "").trim().toUpperCase() || "STORAGE_EVENT"
}

function logStorageEvent(record) {
  appendJsonl(STORAGE_EVENT_FILE, {
    timestamp: nowIso(),
    action: storageEventAction(record.action),
    moduleKey: sanitizeStoragePart(record.moduleKey || "email_os"),
    fileId: clean(record.fileId) || "",
    mailboxId: clean(record.mailboxId) || "",
    entityType: sanitizeStoragePart(record.entityType || "attachment"),
    direction: normalizeStorageDirection(record.direction || "outbound"),
    status: clean(record.status) || "unknown",
    message: clean(record.message) || "",
    freeBytes: Number.isFinite(Number(record.freeBytes)) ? Math.round(Number(record.freeBytes)) : 0,
    usedBytes: Number.isFinite(Number(record.usedBytes)) ? Math.round(Number(record.usedBytes)) : 0,
    metadata: safeSummary(record.metadata || {})
  })
}

function storageDiskSnapshot() {
  const snapshot = computeDiskSnapshot(STORAGE_ROOT)
  const freeBytes = Number(snapshot.availableBytes || 0)
  const usedBytes = Number(snapshot.usedBytes || 0)
  const totalBytes = Number(snapshot.totalBytes || 0)
  const warning = freeBytes > 0 && freeBytes < STORAGE_WARNING_FREE_BYTES
  const critical = freeBytes > 0 && freeBytes < STORAGE_CRITICAL_FREE_BYTES
  return {
    ...snapshot,
    freeBytes,
    usedBytes,
    totalBytes,
    warning,
    critical,
    rootPath: STORAGE_ROOT
  }
}

function readStorageMeta(metaPath) {
  return readJsonFile(metaPath, null)
}

function readStorageDirectoryFile(directory) {
  if (!fs.existsSync(directory)) return null
  const entries = fs.readdirSync(directory)
  const fileName = entries.find((item) => item !== "." && item !== ".." && !item.endsWith(".meta.json")) || ""
  if (!fileName) return null
  return path.join(directory, fileName)
}

function findStorageRecordById(fileId) {
  const id = clean(fileId)
  if (!id) return null
  const dirs = getStorageDirectories()
  const searchRoots = [dirs.inbound, dirs.outbound, dirs.temp, dirs.archive]

  for (const root of searchRoots) {
    const stack = [root]
    while (stack.length) {
      const current = stack.pop()
      if (!current || !fs.existsSync(current)) continue
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === id) {
            const metaPath = path.join(fullPath, "_metadata.json")
            const meta = readStorageMeta(metaPath) || {}
            const filePath = readStorageDirectoryFile(fullPath)
            return {
              directory: fullPath,
              filePath,
              metaPath,
              meta
            }
          }
          stack.push(fullPath)
        }
      }
    }
  }

  return null
}

function buildStorageResponseData(meta, extra = {}) {
  const disk = storageDiskSnapshot()
  return {
    ok: true,
    data: {
      ...meta,
      ...extra,
      freeBytes: disk.freeBytes,
      usedBytes: disk.usedBytes,
      totalBytes: disk.totalBytes,
      warning: disk.warning,
      critical: disk.critical
    }
  }
}

function writeBinary(res, status, body, headers = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body || "")
  res.writeHead(status, {
    "Content-Type": headers["Content-Type"] || headers["content-type"] || "application/octet-stream",
    "Content-Length": payload.length,
    ...headers
  })
  res.end(payload)
}

function storageHealthPayload(extra = {}) {
  const disk = storageDiskSnapshot()
  return {
    ok: true,
    data: {
      rootDirectory: "storage-root",
      bucket: STORAGE_BUCKET,
      node: STORAGE_NODE,
      usedBytes: disk.usedBytes,
      freeBytes: disk.freeBytes,
      totalBytes: disk.totalBytes,
      warning: disk.warning,
      critical: disk.critical,
      warningThresholdBytes: STORAGE_WARNING_FREE_BYTES,
      criticalThresholdBytes: STORAGE_CRITICAL_FREE_BYTES,
      directories: {
        inbound: "email-os/attachments/inbound",
        outbound: "email-os/attachments/outbound",
        temp: "email-os/attachments/temp",
        archive: "email-os/attachments/archive"
      },
      ...extra
    }
  }
}


function inventoryExtensionGroup(filename, contentType) {
  const ext = path.extname(clean(filename)).toLowerCase()
  const type = clean(contentType).toLowerCase()
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".heic"].includes(ext)) return "images"
  if (type === "application/pdf" || ext === ".pdf") return "pdf"
  if (type.includes("spreadsheet") || type.includes("excel") || [".csv", ".xls", ".xlsx"].includes(ext)) return "spreadsheets"
  if (type.includes("word") || [".doc", ".docx", ".odt", ".rtf"].includes(ext)) return "documents"
  if (type.startsWith("video/") || [".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) return "video"
  if (type.startsWith("audio/") || [".mp3", ".wav", ".m4a", ".aac", ".ogg"].includes(ext)) return "audio"
  if ([".zip", ".7z", ".rar", ".tar", ".gz", ".tgz"].includes(ext)) return "archives"
  if ([".log", ".jsonl", ".txt"].includes(ext)) return "text_logs"
  if ([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".map"].includes(ext)) return "application_code"
  return ext ? ext.slice(1) : "other"
}

function inventoryAgeBucket(timestampMs) {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return "unknown"
  const ageDays = Math.max(0, (Date.now() - timestampMs) / 86400000)
  if (ageDays <= 7) return "0_7_days"
  if (ageDays <= 30) return "8_30_days"
  if (ageDays <= 90) return "31_90_days"
  if (ageDays <= 365) return "91_365_days"
  return "over_365_days"
}

function inventorySafeRelative(rootPath, filePath) {
  try {
    const relative = path.relative(rootPath, filePath)
    if (!relative || relative === ".") return "."
    if (relative.startsWith("..") || path.isAbsolute(relative)) return path.basename(filePath)
    return relative.split(path.sep).join("/")
  } catch {
    return path.basename(filePath)
  }
}

function inventoryTopPush(target, item, limit = STORAGE_INVENTORY_TOP_FILES) {
  target.push(item)
  target.sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0))
  if (target.length > limit) target.length = limit
}

function inventoryAggregateMap(map, key, sizeBytes, count = 1, extra = {}) {
  const safeKey = clean(key) || "unclassified"
  const current = map.get(safeKey) || { key: safeKey, sizeBytes: 0, fileCount: 0, ...extra }
  current.sizeBytes += Number(sizeBytes || 0)
  current.fileCount += Number(count || 0)
  for (const [extraKey, value] of Object.entries(extra || {})) {
    if (value !== undefined && value !== null && value !== "") current[extraKey] = value
  }
  map.set(safeKey, current)
  return current
}

function inventoryScanContext(mode) {
  const deep = mode === "deep"
  return {
    mode: deep ? "deep" : "summary",
    startedAt: Date.now(),
    deadline: Date.now() + (deep ? STORAGE_INVENTORY_MAX_DURATION_MS : Math.min(STORAGE_INVENTORY_MAX_DURATION_MS, 6500)),
    maxFiles: deep ? STORAGE_INVENTORY_MAX_FILES : Math.min(STORAGE_INVENTORY_MAX_FILES, 20000),
    filesVisited: 0,
    directoriesVisited: 0,
    errors: [],
    truncated: false
  }
}

function inventoryShouldStop(context) {
  if (context.filesVisited >= context.maxFiles || Date.now() >= context.deadline) {
    context.truncated = true
    return true
  }
  return false
}

async function inventoryScanGenericRoot(definition, context) {
  const result = {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    rootAlias: definition.rootAlias,
    status: "ready",
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    largestFiles: [],
    fileTypes: new Map(),
    ageBuckets: new Map(),
    topFolders: new Map(),
    errors: []
  }

  if (!definition.path || !fs.existsSync(definition.path)) {
    result.status = definition.optional ? "not_configured" : "unavailable"
    return result
  }

  const stack = [{ directory: definition.path, topFolder: "root" }]
  while (stack.length && !inventoryShouldStop(context)) {
    const current = stack.pop()
    if (!current) continue
    let entries
    try {
      entries = await fs.promises.readdir(current.directory, { withFileTypes: true })
      context.directoriesVisited += 1
      result.directoryCount += 1
    } catch (error) {
      const message = `${definition.rootAlias}:${inventorySafeRelative(definition.path, current.directory)}:${error instanceof Error ? error.message : String(error)}`
      result.errors.push(message)
      context.errors.push(message)
      continue
    }

    for (const entry of entries) {
      if (inventoryShouldStop(context)) break
      if (entry.name === "." || entry.name === "..") continue
      const fullPath = path.join(current.directory, entry.name)
      const relative = inventorySafeRelative(definition.path, fullPath)
      const topFolder = relative.includes("/") ? relative.split("/")[0] : relative

      if (entry.isDirectory()) {
        if ([".git", "node_modules", ".next", "$RECYCLE.BIN", "System Volume Information"].includes(entry.name) && definition.kind === "runtime") continue
        stack.push({ directory: fullPath, topFolder })
        continue
      }
      if (!entry.isFile()) continue

      context.filesVisited += 1
      let stat
      try {
        stat = await fs.promises.stat(fullPath)
      } catch (error) {
        const message = `${definition.rootAlias}:${relative}:${error instanceof Error ? error.message : String(error)}`
        result.errors.push(message)
        context.errors.push(message)
        continue
      }

      const sizeBytes = Number(stat.size || 0)
      result.sizeBytes += sizeBytes
      result.fileCount += 1
      inventoryAggregateMap(result.fileTypes, inventoryExtensionGroup(entry.name, ""), sizeBytes)
      inventoryAggregateMap(result.ageBuckets, inventoryAgeBucket(stat.mtimeMs), sizeBytes)
      inventoryAggregateMap(result.topFolders, topFolder || "root", sizeBytes)
      inventoryTopPush(result.largestFiles, {
        sourceId: definition.id,
        sourceLabel: definition.label,
        rootAlias: definition.rootAlias,
        relativePath: relative,
        filename: entry.name,
        sizeBytes,
        modifiedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        fileType: inventoryExtensionGroup(entry.name, ""),
        classification: definition.kind
      })
    }
  }

  if (context.truncated) result.status = "partial"
  return result
}

async function inventoryScanAttachments(context) {
  const directories = getStorageDirectories()
  const directions = [
    ["inbound", directories.inbound, "Pièces jointes reçues"],
    ["outbound", directories.outbound, "Pièces jointes envoyées"],
    ["temp", directories.temp, "Téléversements temporaires"],
    ["archive", directories.archive, "Archives de pièces jointes"]
  ]
  const result = {
    id: "email_attachments",
    label: "Email OS · Pièces jointes",
    kind: "email",
    rootAlias: "storage/email-os/attachments",
    status: "ready",
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    metadataBytes: 0,
    metadataCount: 0,
    directions: new Map(),
    mailboxes: new Map(),
    fileTypes: new Map(),
    ageBuckets: new Map(),
    largestFiles: [],
    duplicateHashes: new Map(),
    orphanCandidates: [],
    errors: []
  }

  for (const [direction, rootPath, label] of directions) {
    const directionAggregate = { key: direction, label, sizeBytes: 0, fileCount: 0 }
    result.directions.set(direction, directionAggregate)
    if (!fs.existsSync(rootPath)) continue

    const stack = [rootPath]
    while (stack.length && !inventoryShouldStop(context)) {
      const directory = stack.pop()
      if (!directory) continue
      let entries
      try {
        entries = await fs.promises.readdir(directory, { withFileTypes: true })
        context.directoriesVisited += 1
        result.directoryCount += 1
      } catch (error) {
        const message = `attachments:${direction}:${inventorySafeRelative(rootPath, directory)}:${error instanceof Error ? error.message : String(error)}`
        result.errors.push(message)
        context.errors.push(message)
        continue
      }

      const metaEntry = entries.find((entry) => entry.isFile() && entry.name === "_metadata.json")
      let meta = null
      let metaStat = null
      if (metaEntry) {
        const metaPath = path.join(directory, metaEntry.name)
        try {
          const raw = await fs.promises.readFile(metaPath, "utf8")
          meta = JSON.parse(raw)
          metaStat = await fs.promises.stat(metaPath)
          result.metadataCount += 1
          result.metadataBytes += Number(metaStat.size || 0)
          result.sizeBytes += Number(metaStat.size || 0)
          directionAggregate.sizeBytes += Number(metaStat.size || 0)
        } catch (error) {
          const message = `attachments:${direction}:${inventorySafeRelative(rootPath, metaPath)}:metadata_invalid`
          result.errors.push(message)
          context.errors.push(message)
        }
      }

      const contentEntries = entries.filter((entry) => entry.isFile() && entry.name !== "_metadata.json" && !entry.name.endsWith(".meta.json"))
      if (metaEntry && !contentEntries.length) {
        result.orphanCandidates.push({
          candidateType: "metadata_without_file",
          direction,
          rootAlias: `storage/email-os/attachments/${direction}`,
          relativePath: inventorySafeRelative(rootPath, directory),
          filename: clean(meta?.original_filename) || "Fichier manquant",
          sizeBytes: Number(meta?.size_bytes || 0),
          mailboxId: clean(meta?.mailbox_id) || null,
          entityType: clean(meta?.entity_type) || null,
          entityId: clean(meta?.entity_id) || null,
          reason: "Métadonnées présentes mais fichier physique absent"
        })
      }

      for (const entry of entries) {
        if (entry.isDirectory()) {
          stack.push(path.join(directory, entry.name))
          continue
        }
      }

      for (const entry of contentEntries) {
        if (inventoryShouldStop(context)) break
        context.filesVisited += 1
        const fullPath = path.join(directory, entry.name)
        let stat
        try {
          stat = await fs.promises.stat(fullPath)
        } catch (error) {
          const message = `attachments:${direction}:${inventorySafeRelative(rootPath, fullPath)}:${error instanceof Error ? error.message : String(error)}`
          result.errors.push(message)
          context.errors.push(message)
          continue
        }

        const sizeBytes = Number(stat.size || 0)
        const contentType = clean(meta?.content_type || meta?.contentType)
        const fileType = inventoryExtensionGroup(entry.name, contentType)
        const mailboxId = clean(meta?.mailbox_id || meta?.mailboxId) || "non_attribuee"
        const hash = clean(meta?.sha256_hash || meta?.sha256Hash)
        const relative = inventorySafeRelative(rootPath, fullPath)
        const entityId = clean(meta?.entity_id || meta?.entityId)
        const entityType = clean(meta?.entity_type || meta?.entityType) || "attachment"
        const moduleKey = clean(meta?.module_key || meta?.moduleKey) || "email_os"

        result.sizeBytes += sizeBytes
        result.fileCount += 1
        directionAggregate.sizeBytes += sizeBytes
        directionAggregate.fileCount += 1
        inventoryAggregateMap(result.mailboxes, mailboxId, sizeBytes, 1, { mailboxId })
        inventoryAggregateMap(result.fileTypes, fileType, sizeBytes)
        inventoryAggregateMap(result.ageBuckets, inventoryAgeBucket(stat.mtimeMs), sizeBytes)

        const item = {
          fileId: clean(meta?.id) || path.basename(directory),
          sourceId: "email_attachments",
          sourceLabel: "Email OS · Pièces jointes",
          rootAlias: `storage/email-os/attachments/${direction}`,
          relativePath: relative,
          filename: clean(meta?.original_filename || meta?.safe_filename) || entry.name,
          storedFilename: entry.name,
          sizeBytes,
          modifiedAt: stat.mtime.toISOString(),
          createdAt: safeDate(meta?.created_at) || stat.birthtime.toISOString(),
          contentType: contentType || "application/octet-stream",
          fileType,
          direction,
          mailboxId: mailboxId === "non_attribuee" ? null : mailboxId,
          moduleKey,
          entityType,
          entityId: entityId || null,
          storageStatus: clean(meta?.status) || "active",
          sha256Hash: hash || null,
          classification: direction === "temp" ? "temporary_upload" : direction === "archive" ? "email_archive" : "email_attachment",
          referenceState: !meta ? "metadata_missing" : !entityId ? "entity_reference_missing" : "referenced"
        }
        inventoryTopPush(result.largestFiles, item)

        if (hash) {
          const duplicate = result.duplicateHashes.get(hash) || { sha256Hash: hash, sizeBytes, totalBytes: 0, fileCount: 0, files: [] }
          duplicate.totalBytes += sizeBytes
          duplicate.fileCount += 1
          if (duplicate.files.length < 12) duplicate.files.push(item)
          result.duplicateHashes.set(hash, duplicate)
        }

        if (!meta || !entityId || !mailboxId || mailboxId === "non_attribuee") {
          result.orphanCandidates.push({
            candidateType: !meta ? "file_without_metadata" : !entityId ? "missing_entity_reference" : "missing_mailbox_reference",
            direction,
            rootAlias: `storage/email-os/attachments/${direction}`,
            relativePath: relative,
            filename: item.filename,
            sizeBytes,
            mailboxId: item.mailboxId,
            entityType,
            entityId: item.entityId,
            reason: !meta ? "Fichier sans métadonnées Email OS" : !entityId ? "Aucune référence d’entité enregistrée" : "Aucune boîte associée"
          })
        }
      }
    }
  }

  if (context.truncated) result.status = "partial"
  result.orphanCandidates.sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0))
  if (result.orphanCandidates.length > 100) result.orphanCandidates.length = 100
  return result
}

function inventoryMapToArray(map, labelMap = {}) {
  return Array.from(map.values())
    .map((item) => ({ ...item, label: item.label || labelMap[item.key] || item.key }))
    .sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0))
}

function inventoryBuildRootDefinitions() {
  const candidates = [
    { id: "backups", label: "Sauvegardes de production", kind: "backups", rootAlias: "backups", path: BACKUP_ROOT, optional: false },
    { id: "logs", label: "Journaux Windows & Bridge", kind: "logs", rootAlias: "logs", path: LOG_DIR, optional: false },
    { id: "bridge_runtime", label: "Runtime Email Bridge", kind: "runtime", rootAlias: "email-bridge", path: __dirname, optional: false },
    { id: "application", label: "Application AngelCare", kind: "application", rootAlias: "application", path: ANGELCARE_APP_ROOT, optional: true },
    { id: "uploads", label: "Téléversements applicatifs", kind: "uploads", rootAlias: "uploads", path: ANGELCARE_UPLOADS_DIR, optional: true },
    { id: "exports", label: "Exports générés", kind: "exports", rootAlias: "exports", path: ANGELCARE_EXPORTS_DIR, optional: true }
  ]
  const seen = new Set()
  return candidates.filter((item) => {
    if (!item.path) return item.optional
    const resolved = path.resolve(item.path).toLowerCase()
    if (seen.has(resolved)) return false
    seen.add(resolved)
    return true
  })
}

async function buildStorageInventory(mode = "summary") {
  const context = inventoryScanContext(mode)
  const disk = storageDiskSnapshot()
  const attachments = await inventoryScanAttachments(context)
  const roots = []
  for (const definition of inventoryBuildRootDefinitions()) {
    if (inventoryShouldStop(context)) break
    roots.push(await inventoryScanGenericRoot(definition, context))
  }

  const categories = [
    {
      id: "email_attachments",
      label: "Emails & pièces jointes",
      kind: "email",
      status: attachments.status,
      sizeBytes: attachments.sizeBytes,
      fileCount: attachments.fileCount + attachments.metadataCount,
      directoryCount: attachments.directoryCount,
      detail: `${attachments.fileCount} fichier(s) Email OS · ${attachments.metadataCount} métadonnée(s)`
    },
    ...roots.map((root) => ({
      id: root.id,
      label: root.label,
      kind: root.kind,
      status: root.status,
      sizeBytes: root.sizeBytes,
      fileCount: root.fileCount,
      directoryCount: root.directoryCount,
      detail: root.status === "not_configured" ? "Source optionnelle non configurée" : `${root.fileCount} fichier(s)`
    }))
  ]

  const classifiedBytes = categories.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0)
  const unclassifiedBytes = Math.max(0, Number(disk.usedBytes || 0) - classifiedBytes)
  categories.push({
    id: "outside_approved_roots",
    label: "Système & données hors périmètre",
    kind: "system",
    status: "unscanned",
    sizeBytes: unclassifiedBytes,
    fileCount: 0,
    directoryCount: 0,
    detail: "Espace utilisé hors des répertoires AngelCare autorisés — aucun accès fichier exposé"
  })

  const duplicateGroups = Array.from(attachments.duplicateHashes.values())
    .filter((group) => group.fileCount > 1)
    .map((group) => ({
      ...group,
      recoverableBytes: Math.max(0, Number(group.totalBytes || 0) - Number(group.sizeBytes || 0))
    }))
    .sort((left, right) => Number(right.recoverableBytes || 0) - Number(left.recoverableBytes || 0))
    .slice(0, 100)
  const duplicateRecoverableBytes = duplicateGroups.reduce((sum, group) => sum + Number(group.recoverableBytes || 0), 0)

  const allLargestFiles = [
    ...attachments.largestFiles,
    ...roots.flatMap((root) => root.largestFiles || [])
  ].sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0)).slice(0, STORAGE_INVENTORY_TOP_FILES)

  const previous = runtimeState.lastStorageInventory
  const completedAt = nowIso()
  const payload = {
    phase: 1,
    readOnly: true,
    scanMode: context.mode,
    scanStatus: context.truncated ? "partial" : context.errors.length ? "completed_with_warnings" : "complete",
    scanStartedAt: new Date(context.startedAt).toISOString(),
    scanCompletedAt: completedAt,
    scanDurationMs: Date.now() - context.startedAt,
    cacheTtlMs: STORAGE_INVENTORY_CACHE_MS,
    limits: {
      maxFiles: context.maxFiles,
      maxDurationMs: context.deadline - context.startedAt,
      filesVisited: context.filesVisited,
      directoriesVisited: context.directoriesVisited,
      truncated: context.truncated
    },
    disk: {
      rootAlias: "windows-primary-volume",
      totalBytes: disk.totalBytes,
      usedBytes: disk.usedBytes,
      freeBytes: disk.freeBytes,
      usedPercent: disk.totalBytes > 0 ? Math.round((disk.usedBytes / disk.totalBytes) * 1000) / 10 : 0,
      warning: disk.warning,
      critical: disk.critical,
      warningThresholdBytes: STORAGE_WARNING_FREE_BYTES,
      criticalThresholdBytes: STORAGE_CRITICAL_FREE_BYTES
    },
    summary: {
      classifiedBytes,
      unclassifiedBytes,
      attachmentBytes: attachments.sizeBytes,
      attachmentFileCount: attachments.fileCount,
      backupBytes: Number(roots.find((item) => item.id === "backups")?.sizeBytes || 0),
      logBytes: Number(roots.find((item) => item.id === "logs")?.sizeBytes || 0),
      temporaryBytes: Number(attachments.directions.get("temp")?.sizeBytes || 0),
      duplicateGroupCount: duplicateGroups.length,
      duplicateRecoverableBytes,
      orphanCandidateCount: attachments.orphanCandidates.length,
      largestFileBytes: Number(allLargestFiles[0]?.sizeBytes || 0)
    },
    growth: {
      previousScanAt: clean(previous?.scanCompletedAt) || null,
      diskUsedDeltaBytes: previous ? Number(disk.usedBytes || 0) - Number(previous.disk?.usedBytes || 0) : null,
      classifiedDeltaBytes: previous ? classifiedBytes - Number(previous.summary?.classifiedBytes || 0) : null,
      attachmentDeltaBytes: previous ? attachments.sizeBytes - Number(previous.summary?.attachmentBytes || 0) : null
    },
    categories: categories.sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0)),
    emailStorage: {
      totalBytes: attachments.sizeBytes,
      fileCount: attachments.fileCount,
      metadataCount: attachments.metadataCount,
      metadataBytes: attachments.metadataBytes,
      directions: inventoryMapToArray(attachments.directions),
      mailboxes: inventoryMapToArray(attachments.mailboxes).slice(0, 100),
      fileTypes: inventoryMapToArray(attachments.fileTypes).slice(0, 40),
      ageBuckets: inventoryMapToArray(attachments.ageBuckets, {
        "0_7_days": "0–7 jours",
        "8_30_days": "8–30 jours",
        "31_90_days": "31–90 jours",
        "91_365_days": "91–365 jours",
        "over_365_days": "Plus d’un an",
        unknown: "Date inconnue"
      }),
      largestFiles: attachments.largestFiles,
      duplicateGroups,
      orphanCandidates: attachments.orphanCandidates
    },
    sources: roots.map((root) => ({
      id: root.id,
      label: root.label,
      rootAlias: root.rootAlias,
      kind: root.kind,
      status: root.status,
      sizeBytes: root.sizeBytes,
      fileCount: root.fileCount,
      directoryCount: root.directoryCount,
      fileTypes: inventoryMapToArray(root.fileTypes || new Map()).slice(0, 20),
      ageBuckets: inventoryMapToArray(root.ageBuckets || new Map()).slice(0, 20),
      topFolders: inventoryMapToArray(root.topFolders || new Map()).slice(0, 20),
      errors: (root.errors || []).slice(0, 10)
    })),
    largestFiles: allLargestFiles,
    warnings: context.errors.slice(0, 25),
    sourceFreshness: [
      { id: "windows_filesystem", label: "Système de fichiers Windows", status: context.truncated ? "partial" : "synced", lastSyncedAt: completedAt, detail: `${context.filesVisited} fichier(s) inspecté(s)` },
      { id: "email_attachments", label: "Stockage pièces jointes Email OS", status: attachments.status === "partial" ? "partial" : "synced", lastSyncedAt: completedAt, detail: `${attachments.fileCount} pièce(s) jointe(s)` },
      { id: "backups", label: "Sauvegardes", status: roots.find((item) => item.id === "backups")?.status || "unavailable", lastSyncedAt: completedAt, detail: "Inventaire du répertoire de sauvegarde" },
      { id: "logs", label: "Journaux", status: roots.find((item) => item.id === "logs")?.status || "unavailable", lastSyncedAt: completedAt, detail: "Bridge, Caddy, services et audit" },
      { id: "database", label: "Base de données Email OS", status: "not_in_phase_1", lastSyncedAt: null, detail: "Mesure logique de la base prévue dans une phase ultérieure" },
      { id: "menara", label: "Rétention Menara", status: "provider_limited", lastSyncedAt: null, detail: "POP3 ne fournit pas une mesure détaillée du stockage distant" }
    ]
  }

  runtimeState.previousStorageInventory = runtimeState.lastStorageInventory
  runtimeState.lastStorageInventory = payload
  return payload
}

async function handleStorageInventory(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const mode = clean(url?.searchParams?.get("mode")).toLowerCase() === "deep" ? "deep" : "summary"
  const force = clean(url?.searchParams?.get("force")) === "1"
  const cached = runtimeState.lastStorageInventory
  const cacheAge = cached?.scanCompletedAt ? Date.now() - new Date(cached.scanCompletedAt).getTime() : Number.POSITIVE_INFINITY

  if (!force && cached && cacheAge >= 0 && cacheAge < STORAGE_INVENTORY_CACHE_MS && (mode === "summary" || cached.scanMode === "deep")) {
    return { status: 200, payload: { ok: true, data: { ...cached, cached: true, cacheAgeMs: cacheAge } } }
  }

  if (runtimeState.storageInventoryPromise) {
    try {
      const inventory = await runtimeState.storageInventoryPromise
      return { status: 200, payload: { ok: true, data: { ...inventory, sharedScan: true } } }
    } catch (error) {
      return { status: 500, payload: { ok: false, error: error instanceof Error ? error.message : String(error), errorName: "StorageInventoryFailed", errorMessage: error instanceof Error ? error.message : String(error) } }
    }
  }

  runtimeState.storageInventoryPromise = buildStorageInventory(mode)
  try {
    const inventory = await runtimeState.storageInventoryPromise
    logStorageEvent({
      action: "STORAGE_INVENTORY_SCAN",
      moduleKey: "opsos",
      entityType: "inventory",
      direction: "archive",
      status: inventory.scanStatus,
      freeBytes: inventory.disk.freeBytes,
      usedBytes: inventory.disk.usedBytes,
      metadata: {
        mode,
        durationMs: inventory.scanDurationMs,
        filesVisited: inventory.limits.filesVisited,
        classifiedBytes: inventory.summary.classifiedBytes,
        readOnly: true
      }
    })
    return { status: 200, payload: { ok: true, data: inventory } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    runtimeState.lastStorageError = { timestamp: nowIso(), action: "STORAGE_INVENTORY_SCAN", result: "error", message }
    return { status: 500, payload: { ok: false, error: message, errorName: "StorageInventoryFailed", errorMessage: message } }
  } finally {
    runtimeState.storageInventoryPromise = null
  }
}


function storageExplorerSourceDefinitions() {
  const attachmentRoot = path.join(STORAGE_ROOT, "email-os", "attachments")
  const definitions = [
    { id: "email_attachments", label: "Email OS · Pièces jointes", kind: "email", rootAlias: "storage/email-os/attachments", path: attachmentRoot, optional: false },
    ...inventoryBuildRootDefinitions()
  ]
  const seen = new Set()
  return definitions.filter((item) => {
    const rootPath = clean(item.path)
    if (!rootPath) return Boolean(item.optional)
    const resolved = path.resolve(rootPath).toLowerCase()
    if (seen.has(resolved)) return false
    seen.add(resolved)
    return true
  })
}

function storageExplorerPublicSources() {
  return storageExplorerSourceDefinitions().map((item) => {
    const configured = Boolean(clean(item.path))
    const exists = configured && fs.existsSync(item.path)
    return {
      id: item.id,
      label: item.label,
      kind: item.kind,
      rootAlias: item.rootAlias,
      status: !configured ? "not_configured" : exists ? "ready" : "unavailable",
      readOnly: true,
      detail: !configured ? "Source optionnelle non configurée" : exists ? "Source autorisée disponible" : "Répertoire autorisé indisponible"
    }
  })
}

function storageExplorerSourceById(sourceId) {
  const id = clean(sourceId)
  return storageExplorerSourceDefinitions().find((item) => item.id === id) || null
}

function normalizeExplorerRelativePath(value) {
  const raw = clean(value).replace(/\\/g, "/")
  if (!raw || raw === "." || raw === "/") return "."
  const normalized = path.posix.normalize(`/${raw}`).replace(/^\/+/, "")
  if (!normalized || normalized === ".") return "."
  if (normalized.startsWith("..") || normalized.includes("/../")) return null
  return normalized
}

function resolveExplorerPath(source, relativePath) {
  if (!source || !clean(source.path)) return { ok: false, error: "Storage source is not configured" }
  const relative = normalizeExplorerRelativePath(relativePath)
  if (relative === null) return { ok: false, error: "Invalid relative path" }
  const rootPath = path.resolve(source.path)
  const candidate = relative === "." ? rootPath : path.resolve(rootPath, ...relative.split("/"))
  if (!isWithinRoot(candidate, rootPath)) return { ok: false, error: "Path is outside the approved storage root" }
  return { ok: true, rootPath, candidate, relative }
}

function storagePreviewKind(filename, contentType, sizeBytes) {
  const ext = path.extname(clean(filename)).toLowerCase()
  const type = clean(contentType).toLowerCase()
  const blocked = new Set([".exe", ".dll", ".msi", ".bat", ".cmd", ".ps1", ".vbs", ".scr", ".com", ".app", ".dmg", ".pkg"])
  if (blocked.has(ext)) return { kind: "blocked", previewable: false, reason: "Executable and system files cannot be previewed" }
  if (ext === ".svg" || type === "image/svg+xml") return { kind: "blocked", previewable: false, reason: "SVG is treated as untrusted active content" }
  if (Number(sizeBytes || 0) > STORAGE_PREVIEW_MAX_BYTES) return { kind: "too_large", previewable: false, reason: `Preview limited to ${formatBytes(STORAGE_PREVIEW_MAX_BYTES)}` }
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].includes(ext)) return { kind: "image", previewable: true, reason: null }
  if (type === "application/pdf" || ext === ".pdf") return { kind: "pdf", previewable: true, reason: null }
  if (type === "application/json" || ext === ".json") return { kind: "json", previewable: true, reason: null }
  if (type === "text/csv" || ext === ".csv") return { kind: "csv", previewable: true, reason: null }
  if (type.startsWith("text/") || [".txt", ".log", ".jsonl", ".md", ".xml", ".html", ".css", ".js", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) return { kind: "text", previewable: true, reason: null }
  return { kind: "unsupported", previewable: false, reason: "Preview is unavailable for this file type" }
}

function readAttachmentMetadataForPath(source, filePath) {
  if (!source || source.id !== "email_attachments") return null
  const directory = path.dirname(filePath)
  const metadataPath = path.join(directory, "_metadata.json")
  const metadata = readStorageMeta(metadataPath)
  if (!metadata || typeof metadata !== "object") return null
  return { metadataPath, metadata }
}

function buildExplorerEntry(source, fullPath, stat, rootPath) {
  const relativePath = inventorySafeRelative(rootPath, fullPath)
  const parentRelativePath = inventorySafeRelative(rootPath, path.dirname(fullPath))
  const isDirectory = stat.isDirectory()
  const attachmentMetadata = isDirectory ? null : readAttachmentMetadataForPath(source, fullPath)
  const metadata = attachmentMetadata?.metadata || {}
  const contentType = clean(metadata.content_type || metadata.contentType) || null
  const preview = isDirectory ? { kind: "unsupported", previewable: false, reason: null } : storagePreviewKind(path.basename(fullPath), contentType, stat.size)
  const fileId = clean(metadata.id) || (!isDirectory && source.id === "email_attachments" ? path.basename(path.dirname(fullPath)) : "")
  const entityId = clean(metadata.entity_id || metadata.entityId)
  const mailboxId = clean(metadata.mailbox_id || metadata.mailboxId)
  const sha256Hash = clean(metadata.sha256_hash || metadata.sha256Hash)
  return {
    sourceId: source.id,
    sourceLabel: source.label,
    rootAlias: source.rootAlias,
    relativePath,
    parentRelativePath: parentRelativePath === "." ? "." : parentRelativePath,
    name: path.basename(fullPath),
    entryType: isDirectory ? "directory" : "file",
    sizeBytes: isDirectory ? 0 : Number(stat.size || 0),
    createdAt: Number(stat.birthtimeMs || 0) > 0 ? stat.birthtime.toISOString() : null,
    modifiedAt: stat.mtime ? stat.mtime.toISOString() : null,
    lastAccessedAt: stat.atime ? stat.atime.toISOString() : null,
    fileType: isDirectory ? "folder" : inventoryExtensionGroup(path.basename(fullPath), contentType),
    contentType,
    classification: isDirectory ? "directory" : source.kind === "email" ? "email_attachment" : source.kind,
    mailboxId: mailboxId || null,
    fileId: fileId || null,
    entityType: clean(metadata.entity_type || metadata.entityType) || null,
    entityId: entityId || null,
    sha256Hash: sha256Hash || null,
    referenceState: isDirectory ? null : attachmentMetadata ? (entityId ? "referenced" : "entity_reference_missing") : source.id === "email_attachments" ? "metadata_missing" : "filesystem_only",
    referenceCount: entityId ? 1 : 0,
    previewKind: preview.kind,
    previewable: preview.previewable,
    blockedReason: preview.reason,
    safetyStatus: preview.kind === "blocked" ? "blocked" : preview.previewable ? "safe_preview" : "metadata_only"
  }
}

function storageExplorerBreadcrumbs(relativePath) {
  const normalized = normalizeExplorerRelativePath(relativePath) || "."
  const rows = [{ label: "Racine", relativePath: "." }]
  if (normalized === ".") return rows
  const parts = normalized.split("/").filter(Boolean)
  let current = ""
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    rows.push({ label: part, relativePath: current })
  }
  return rows
}

async function storageExplorerRecursiveSearch(source, rootPath, query, limit, deadline) {
  const matches = []
  const warnings = []
  const stack = [rootPath]
  let totalMatched = 0
  let truncated = false
  while (stack.length) {
    if (Date.now() >= deadline || matches.length >= limit) {
      truncated = true
      break
    }
    const directory = stack.pop()
    if (!directory) continue
    let entries
    try {
      entries = await fs.promises.readdir(directory, { withFileTypes: true })
    } catch (error) {
      warnings.push(`${inventorySafeRelative(rootPath, directory)}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    for (const entry of entries) {
      if (Date.now() >= deadline || matches.length >= limit) {
        truncated = true
        break
      }
      if ([".", ".."].includes(entry.name)) continue
      if ([".git", "node_modules", ".next", "$RECYCLE.BIN", "System Volume Information"].includes(entry.name)) continue
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) stack.push(fullPath)
      if (!entry.name.toLowerCase().includes(query)) continue
      totalMatched += 1
      try {
        const stat = await fs.promises.stat(fullPath)
        matches.push(buildExplorerEntry(source, fullPath, stat, rootPath))
      } catch (error) {
        warnings.push(`${inventorySafeRelative(rootPath, fullPath)}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  return { matches, warnings, totalMatched, truncated }
}

async function handleStorageBrowse(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const sourceId = clean(url.searchParams.get("sourceId")) || "email_attachments"
  const source = storageExplorerSourceById(sourceId)
  if (!source) return { status: 404, payload: { ok: false, error: "Unknown storage source", errorName: "StorageSourceNotFound", errorMessage: "Unknown storage source" } }
  const resolved = resolveExplorerPath(source, url.searchParams.get("path") || ".")
  if (!resolved.ok) return { status: 400, payload: { ok: false, error: resolved.error, errorName: "InvalidStoragePath", errorMessage: resolved.error } }
  if (!fs.existsSync(resolved.candidate)) return { status: 404, payload: { ok: false, error: "Storage path not found", errorName: "StoragePathNotFound", errorMessage: "Storage path not found" } }
  const startedAt = Date.now()
  const query = clean(url.searchParams.get("query")).toLowerCase()
  const recursive = clean(url.searchParams.get("recursive")) === "1" || Boolean(query)
  const limit = Math.max(1, Math.min(STORAGE_EXPLORER_MAX_RESULTS, Number(url.searchParams.get("limit") || 150)))
  const cursor = Math.max(0, Number(url.searchParams.get("cursor") || 0))
  let entries = []
  let totalMatched = 0
  let truncated = false
  const warnings = []
  if (recursive && query) {
    const search = await storageExplorerRecursiveSearch(source, resolved.candidate, query, cursor + limit + 1, Date.now() + STORAGE_EXPLORER_SEARCH_MS)
    totalMatched = search.totalMatched
    truncated = search.truncated
    warnings.push(...search.warnings)
    entries = search.matches.slice(cursor, cursor + limit)
  } else {
    const stat = await fs.promises.stat(resolved.candidate)
    if (!stat.isDirectory()) return { status: 400, payload: { ok: false, error: "Browse path must be a directory", errorName: "StoragePathNotDirectory", errorMessage: "Browse path must be a directory" } }
    let directoryEntries = await fs.promises.readdir(resolved.candidate, { withFileTypes: true })
    directoryEntries = directoryEntries.filter((entry) => ![".", ".."].includes(entry.name))
    totalMatched = directoryEntries.length
    const pageEntries = directoryEntries.slice(cursor, cursor + limit)
    for (const entry of pageEntries) {
      const fullPath = path.join(resolved.candidate, entry.name)
      try {
        const childStat = await fs.promises.stat(fullPath)
        entries.push(buildExplorerEntry(source, fullPath, childStat, resolved.rootPath))
      } catch (error) {
        warnings.push(`${entry.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  entries.sort((left, right) => left.entryType === right.entryType ? Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0) || left.name.localeCompare(right.name) : left.entryType === "directory" ? -1 : 1)
  const data = {
    phase: 2,
    readOnly: true,
    source: storageExplorerPublicSources().find((item) => item.id === source.id),
    sources: storageExplorerPublicSources(),
    currentRelativePath: resolved.relative,
    breadcrumbs: storageExplorerBreadcrumbs(resolved.relative),
    entries,
    query,
    recursive,
    totalMatched,
    returned: entries.length,
    nextCursor: cursor + entries.length < totalMatched ? String(cursor + entries.length) : null,
    truncated,
    scannedAt: nowIso(),
    scanDurationMs: Date.now() - startedAt,
    warnings: warnings.slice(0, 20)
  }
  return { status: 200, payload: { ok: true, data } }
}

async function handleStorageFileDossier(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const source = storageExplorerSourceById(url.searchParams.get("sourceId"))
  if (!source) return { status: 404, payload: { ok: false, error: "Unknown storage source", errorName: "StorageSourceNotFound", errorMessage: "Unknown storage source" } }
  const resolved = resolveExplorerPath(source, url.searchParams.get("path") || "")
  if (!resolved.ok) return { status: 400, payload: { ok: false, error: resolved.error, errorName: "InvalidStoragePath", errorMessage: resolved.error } }
  if (!fs.existsSync(resolved.candidate)) return { status: 404, payload: { ok: false, error: "File not found", errorName: "StorageFileNotFound", errorMessage: "File not found" } }
  const stat = await fs.promises.stat(resolved.candidate)
  const entry = buildExplorerEntry(source, resolved.candidate, stat, resolved.rootPath)
  const attachment = stat.isFile() ? readAttachmentMetadataForPath(source, resolved.candidate) : null
  const metadata = attachment?.metadata || {}
  let computedHash = null
  const requestedHash = clean(url.searchParams.get("hash")) === "1"
  if (requestedHash && stat.isFile() && stat.size <= 50 * 1024 * 1024) {
    computedHash = crypto.createHash("sha256").update(await fs.promises.readFile(resolved.candidate)).digest("hex")
  }
  const sha256Hash = entry.sha256Hash || computedHash
  const metadataSize = Number(metadata.size_bytes || metadata.sizeBytes || 0)
  const references = []
  if (entry.fileId) references.push({ type: "storage_file", id: entry.fileId, label: "Objet de stockage", detail: entry.rootAlias, mailboxId: entry.mailboxId })
  if (entry.entityId) references.push({ type: entry.entityType || "business_entity", id: entry.entityId, label: "Référence métier", detail: `${entry.entityType || "entité"} · ${entry.entityId}`, mailboxId: entry.mailboxId })
  if (entry.mailboxId) references.push({ type: "mailbox", id: entry.mailboxId, label: "Boîte Email OS", detail: entry.mailboxId, mailboxId: entry.mailboxId })
  const data = {
    ...entry,
    phase: 2,
    readOnly: true,
    metadata: safeSummary(metadata, 5),
    references,
    integrity: {
      sha256Hash: sha256Hash || null,
      hashSource: entry.sha256Hash ? "metadata" : computedHash ? "computed" : "unavailable",
      physicalExists: true,
      metadataExists: Boolean(attachment),
      sizeMatchesMetadata: metadataSize > 0 ? metadataSize === stat.size : null
    },
    preview: {
      kind: entry.previewKind,
      supported: entry.previewable,
      maxBytes: STORAGE_PREVIEW_MAX_BYTES,
      reason: entry.blockedReason
    }
  }
  logStorageEvent({ action: "STORAGE_FILE_INSPECTED", moduleKey: "opsos", fileId: entry.fileId, mailboxId: entry.mailboxId, entityType: entry.entityType || "file", direction: clean(metadata.direction) || "archive", status: "read_only", metadata: { sourceId: source.id, relativePath: entry.relativePath, readOnly: true } })
  return { status: 200, payload: { ok: true, data } }
}

async function handleStoragePreview(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const source = storageExplorerSourceById(url.searchParams.get("sourceId"))
  if (!source) return { status: 404, payload: { ok: false, error: "Unknown storage source", errorName: "StorageSourceNotFound", errorMessage: "Unknown storage source" } }
  const resolved = resolveExplorerPath(source, url.searchParams.get("path") || "")
  if (!resolved.ok) return { status: 400, payload: { ok: false, error: resolved.error, errorName: "InvalidStoragePath", errorMessage: resolved.error } }
  if (!fs.existsSync(resolved.candidate)) return { status: 404, payload: { ok: false, error: "File not found", errorName: "StorageFileNotFound", errorMessage: "File not found" } }
  const stat = await fs.promises.stat(resolved.candidate)
  if (!stat.isFile()) return { status: 400, payload: { ok: false, error: "Preview path must be a file", errorName: "StoragePreviewNotFile", errorMessage: "Preview path must be a file" } }
  const attachment = readAttachmentMetadataForPath(source, resolved.candidate)
  const contentType = clean(attachment?.metadata?.content_type || attachment?.metadata?.contentType) || "application/octet-stream"
  const preview = storagePreviewKind(path.basename(resolved.candidate), contentType, stat.size)
  if (!preview.previewable) {
    return { status: 200, payload: { ok: true, data: { phase: 2, readOnly: true, sourceId: source.id, relativePath: resolved.relative, filename: path.basename(resolved.candidate), contentType, sizeBytes: stat.size, kind: preview.kind, encoding: "none", content: null, truncated: false, safetyStatus: preview.kind === "blocked" ? "blocked" : "metadata_only", reason: preview.reason } } }
  }
  const buffer = await fs.promises.readFile(resolved.candidate)
  let encoding = "base64"
  let content = buffer.toString("base64")
  let truncated = false
  if (["text", "json", "csv"].includes(preview.kind)) {
    encoding = "utf8"
    const limited = buffer.length > STORAGE_TEXT_PREVIEW_MAX_BYTES ? buffer.subarray(0, STORAGE_TEXT_PREVIEW_MAX_BYTES) : buffer
    content = limited.toString("utf8")
    truncated = buffer.length > limited.length
  }
  logStorageEvent({ action: "STORAGE_FILE_PREVIEWED", moduleKey: "opsos", fileId: clean(attachment?.metadata?.id), mailboxId: clean(attachment?.metadata?.mailbox_id), entityType: clean(attachment?.metadata?.entity_type) || "file", direction: clean(attachment?.metadata?.direction) || "archive", status: "read_only", metadata: { sourceId: source.id, relativePath: resolved.relative, previewKind: preview.kind, readOnly: true } })
  return { status: 200, payload: { ok: true, data: { phase: 2, readOnly: true, sourceId: source.id, relativePath: resolved.relative, filename: path.basename(resolved.candidate), contentType, sizeBytes: stat.size, kind: preview.kind, encoding, content, truncated, safetyStatus: "safe_preview", reason: null } } }
}

async function handleStorageDuplicatesInvestigation(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const inventory = await buildStorageInventory("deep")
  const hash = clean(url.searchParams.get("hash"))
  const groups = inventory.emailStorage.duplicateGroups || []
  const selectedGroup = hash ? groups.find((item) => item.sha256Hash === hash) || null : null
  return { status: 200, payload: { ok: true, data: { phase: 2, readOnly: true, groups, selectedGroup, totalGroups: groups.length, totalPhysicalBytes: groups.reduce((sum, item) => sum + Number(item.totalBytes || 0), 0), totalRecoverableBytes: groups.reduce((sum, item) => sum + Number(item.recoverableBytes || 0), 0), scannedAt: inventory.scanCompletedAt } } }
}

async function handleStorageOrphansInvestigation(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const inventory = await buildStorageInventory("deep")
  const candidates = (inventory.emailStorage.orphanCandidates || []).map((item) => {
    const type = clean(item.candidateType)
    const confidence = type === "metadata_without_file" ? "confirmed" : type === "file_without_metadata" ? "probable" : "review_required"
    return {
      ...item,
      confidence,
      referenceCount: item.entityId ? 1 : 0,
      metadataExists: type !== "file_without_metadata",
      physicalExists: type !== "metadata_without_file",
      businessImpact: item.entityId ? "Une référence métier est présente et doit être vérifiée avant toute future action." : "Aucune référence métier complète n’est actuellement visible dans les métadonnées locales.",
      recommendedReview: confidence === "confirmed" ? "Vérifier la base Email OS et les sauvegardes avant toute décision." : confidence === "probable" ? "Rechercher une relation de message ou de file d’attente dans Email OS." : "Comparer le fichier, la boîte, le message et la base de données."
    }
  })
  return { status: 200, payload: { ok: true, data: { phase: 2, readOnly: true, candidates, totalCandidates: candidates.length, confirmedCount: candidates.filter((item) => item.confidence === "confirmed").length, probableCount: candidates.filter((item) => item.confidence === "probable").length, reviewRequiredCount: candidates.filter((item) => item.confidence === "review_required").length, scannedAt: inventory.scanCompletedAt } } }
}


function quarantineToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  const signature = crypto.createHmac("sha256", STORAGE_QUARANTINE_TOKEN_SECRET).update(encoded).digest("base64url")
  return `${encoded}.${signature}`
}

function parseQuarantineToken(token, expectedKind) {
  const text = clean(token)
  const [encoded, signature] = text.split(".")
  if (!encoded || !signature) return { ok: false, error: "Invalid storage location token" }
  const expected = crypto.createHmac("sha256", STORAGE_QUARANTINE_TOKEN_SECRET).update(encoded).digest("base64url")
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return { ok: false, error: "Invalid storage location token signature" }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    if (expectedKind && payload.kind !== expectedKind) return { ok: false, error: "Unexpected storage location token type" }
    if (!payload.issuedAt || Date.now() - Number(payload.issuedAt) > 3650 * 86400000) return { ok: false, error: "Storage location token expired" }
    return { ok: true, payload }
  } catch {
    return { ok: false, error: "Invalid storage location token payload" }
  }
}

function quarantineCaseRoot(caseId) {
  const safe = clean(caseId).replace(/[^a-zA-Z0-9_-]/g, "")
  if (!safe) throw new Error("Invalid quarantine case ID")
  const root = path.resolve(STORAGE_QUARANTINE_ROOT, safe)
  if (!isWithinRoot(root, path.resolve(STORAGE_QUARANTINE_ROOT))) throw new Error("Invalid quarantine case path")
  return root
}

function quarantineManifestPath(caseId) {
  return path.join(quarantineCaseRoot(caseId), "manifest.json")
}

function quarantineBlockedReason(source, resolved, stat, entry) {
  const lower = resolved.candidate.toLowerCase()
  const filename = path.basename(resolved.candidate).toLowerCase()
  if (!stat.isFile()) return "Only regular files can be quarantined in Phase 3"
  if (stat.size > STORAGE_QUARANTINE_MAX_FILE_BYTES) return `File exceeds Phase 3 quarantine limit (${formatBytes(STORAGE_QUARANTINE_MAX_FILE_BYTES)})`
  if (source.id === "bridge_runtime" && ["server.js", ".env", "package.json", "package-lock.json"].includes(filename)) return "Active Email Bridge runtime files are blocked"
  if (source.id === "application") return "Active application source is blocked from Phase 3 quarantine"
  if (filename === "caddyfile" || lower.includes("\\caddy\\")) return "Active Caddy configuration is blocked"
  if (/\.(exe|dll|sys|msi|com|bat|cmd|ps1|vbs|scr|lnk)$/i.test(filename)) return "Executable and system files are blocked"
  if (/\.env($|\.)/i.test(filename) || /(credential|secret|token|password)/i.test(filename)) return "Credential and environment files are blocked"
  if (source.id === "logs" && [LOG_OUT, LOG_ERROR, LOG_CADDY_OUT, LOG_CADDY_ERROR, LOG_DUCKDNS, LOG_SERVICE, AUDIT_FILE, STORAGE_EVENT_FILE].map((item) => path.resolve(item).toLowerCase()).includes(path.resolve(resolved.candidate).toLowerCase())) return "Current active log files are blocked"
  if (entry.storageStatus === "uploading" || entry.storageStatus === "processing" || entry.storageStatus === "queued") return "Active upload or queue objects are blocked"
  return null
}

async function sha256File(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256")
    const stream = fs.createReadStream(filePath)
    stream.on("error", reject)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("end", () => resolve(hash.digest("hex")))
  })
}

async function atomicJson(filePath, value) {
  ensureDir(filePath)
  const temp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await fs.promises.writeFile(temp, JSON.stringify(value, null, 2), "utf8")
  await fs.promises.rename(temp, filePath)
}

async function handleStorageQuarantineImpact(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const source = storageExplorerSourceById(body?.sourceId)
  if (!source) return { status: 404, payload: { ok: false, error: "Unknown storage source", errorName: "StorageSourceNotFound", errorMessage: "Unknown storage source" } }
  const resolved = resolveExplorerPath(source, body?.path || "")
  if (!resolved.ok) return { status: 400, payload: { ok: false, error: resolved.error, errorName: "InvalidStoragePath", errorMessage: resolved.error } }
  if (!fs.existsSync(resolved.candidate)) return { status: 404, payload: { ok: false, error: "File not found", errorName: "StorageFileNotFound", errorMessage: "File not found" } }
  const stat = await fs.promises.stat(resolved.candidate)
  const entry = buildExplorerEntry(source, resolved.candidate, stat, resolved.rootPath)
  const attachment = stat.isFile() ? readAttachmentMetadataForPath(source, resolved.candidate) : null
  const metadata = attachment?.metadata || {}
  const blocked = quarantineBlockedReason(source, resolved, stat, entry)
  const hash = stat.isFile() ? await sha256File(resolved.candidate) : null
  const referenceState = clean(entry.referenceState) || "filesystem"
  const referenced = Boolean(entry.fileId || entry.entityId || entry.mailboxId || referenceState === "referenced")
  const active = ["active", "queued", "processing", "uploading"].includes(clean(entry.storageStatus).toLowerCase())
  let riskLevel = blocked ? "blocked" : referenced || active ? "controlled" : source.id === "email_attachments" ? "controlled" : "low"
  if (active && source.id === "email_attachments") riskLevel = "high"
  const allowedModes = blocked ? [] : active ? ["logical"] : ["logical", "physical"]
  const sameVolume = path.parse(resolved.candidate).root.toLowerCase() === path.parse(path.resolve(STORAGE_QUARANTINE_ROOT)).root.toLowerCase()
  const originalLocationToken = quarantineToken({ kind: "original", sourceId: source.id, relativePath: resolved.relative, fullPath: resolved.candidate, issuedAt: Date.now() })
  const data = {
    phase: 3,
    reversible: true,
    sourceId: source.id,
    relativePath: resolved.relative,
    filename: entry.name,
    sizeBytes: stat.size,
    contentType: clean(metadata.content_type || metadata.contentType) || null,
    sha256Hash: hash,
    objectType: source.id === "email_attachments" ? "email_attachment" : "filesystem_file",
    fileId: clean(entry.fileId) || null,
    mailboxId: clean(entry.mailboxId) || null,
    entityType: clean(entry.entityType) || null,
    entityId: clean(entry.entityId) || null,
    referenceState,
    references: [],
    referenceCount: referenced ? 1 : 0,
    activeReferenceCount: active ? 1 : 0,
    riskLevel,
    riskReasons: [referenced ? "Business or Email OS references are present" : "No explicit active reference found", active ? "The storage object is marked active" : "The storage object is not marked active"],
    blockedReasons: blocked ? [blocked] : [],
    allowedModes,
    recommendedMode: blocked ? null : active || referenced ? "logical" : "physical",
    estimatedRecoverableBytes: blocked ? 0 : stat.size,
    primaryStorageRecoveryByMode: { logical: 0, physical: sameVolume ? 0 : stat.size },
    userVisibleConsequence: source.id === "email_attachments" ? "The related message remains visible while attachment access is replaced by a reversible quarantine notice." : "The object is removed from normal production access while its evidence and restore path are preserved.",
    restoreReadiness: blocked ? "blocked" : hash ? "complete" : "partial",
    restoreWarnings: sameVolume ? ["Physical quarantine uses the same volume and will not reclaim primary disk capacity."] : [],
    backupCopiesUnaffected: true,
    providerCopyUnaffected: true,
    legalHold: false,
    originalLocationToken,
    sourceDetails: { rootAlias: source.rootAlias, sameVolumeQuarantine: sameVolume },
    analyzedAt: nowIso()
  }
  logStorageEvent({ action: "STORAGE_QUARANTINE_IMPACT_ANALYZED", moduleKey: "opsos", fileId: entry.fileId, mailboxId: entry.mailboxId, entityType: entry.entityType || "file", direction: clean(metadata.direction) || "archive", status: riskLevel, metadata: { sourceId: source.id, relativePath: resolved.relative, allowedModes, phase: 3, reversible: true } })
  return { status: 200, payload: { ok: true, data } }
}

async function moveFileReversibly(sourcePath, destinationPath) {
  ensureDir(destinationPath)
  const sameVolume = path.parse(sourcePath).root.toLowerCase() === path.parse(destinationPath).root.toLowerCase()
  if (sameVolume) {
    await fs.promises.rename(sourcePath, destinationPath)
    return { sameVolume: true }
  }
  await fs.promises.copyFile(sourcePath, destinationPath, fs.constants.COPYFILE_EXCL)
  const [sourceHash, destinationHash] = await Promise.all([sha256File(sourcePath), sha256File(destinationPath)])
  if (sourceHash !== destinationHash) {
    await fs.promises.unlink(destinationPath).catch(() => null)
    throw new Error("Quarantine vault copy failed integrity verification")
  }
  await fs.promises.unlink(sourcePath)
  return { sameVolume: false }
}

async function handleStorageQuarantineExecute(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const caseId = clean(body?.caseId)
  const caseNumber = clean(body?.caseNumber)
  const mode = clean(body?.mode)
  if (!caseId || !caseNumber || !["logical", "physical"].includes(mode)) return { status: 400, payload: { ok: false, error: "caseId, caseNumber and a valid mode are required", errorName: "InvalidQuarantineRequest", errorMessage: "caseId, caseNumber and a valid mode are required" } }
  const parsed = parseQuarantineToken(body?.originalLocationToken, "original")
  if (!parsed.ok) return { status: 400, payload: { ok: false, error: parsed.error, errorName: "InvalidStorageToken", errorMessage: parsed.error } }
  const source = storageExplorerSourceById(parsed.payload.sourceId)
  if (!source) return { status: 404, payload: { ok: false, error: "Unknown storage source", errorName: "StorageSourceNotFound", errorMessage: "Unknown storage source" } }
  const resolved = resolveExplorerPath(source, parsed.payload.relativePath)
  if (!resolved.ok || path.resolve(resolved.candidate) !== path.resolve(parsed.payload.fullPath)) return { status: 400, payload: { ok: false, error: "Storage token path mismatch", errorName: "StorageTokenMismatch", errorMessage: "Storage token path mismatch" } }
  if (!fs.existsSync(resolved.candidate)) return { status: 404, payload: { ok: false, error: "Original file not found", errorName: "StorageFileNotFound", errorMessage: "Original file not found" } }
  const stat = await fs.promises.stat(resolved.candidate)
  const entry = buildExplorerEntry(source, resolved.candidate, stat, resolved.rootPath)
  const blocked = quarantineBlockedReason(source, resolved, stat, entry)
  if (blocked) return { status: 409, payload: { ok: false, error: blocked, errorName: "StorageQuarantineBlocked", errorMessage: blocked } }
  const originalHash = await sha256File(resolved.candidate)
  if (clean(body?.expectedSha256) && clean(body.expectedSha256) !== originalHash) return { status: 409, payload: { ok: false, error: "File changed after impact analysis", errorName: "StorageObjectChanged", errorMessage: "File changed after impact analysis" } }
  const caseRoot = quarantineCaseRoot(caseId)
  const originalDir = path.join(caseRoot, "original")
  const vaultPath = path.join(originalDir, path.basename(resolved.candidate))
  const manifestPath = quarantineManifestPath(caseId)
  if (fs.existsSync(manifestPath)) return { status: 409, payload: { ok: false, error: "Quarantine case already has a manifest", errorName: "QuarantineCaseAlreadyExecuted", errorMessage: "Quarantine case already has a manifest" } }
  fs.mkdirSync(caseRoot, { recursive: true })
  const beforeDisk = storageDiskSnapshot()
  let moveResult = { sameVolume: true }
  if (mode === "physical") moveResult = await moveFileReversibly(resolved.candidate, vaultPath)
  const finalPath = mode === "physical" ? vaultPath : resolved.candidate
  const resultingHash = await sha256File(finalPath)
  if (resultingHash !== originalHash) throw new Error("Post-quarantine integrity verification failed")
  const quarantineLocationToken = quarantineToken({ kind: "quarantine", caseId, caseRoot, vaultPath: mode === "physical" ? vaultPath : null, manifestPath, issuedAt: Date.now() })
  const manifest = {
    phase: 3,
    reversible: true,
    caseId,
    caseNumber,
    mode,
    status: "quarantined",
    reason: clean(body?.reason),
    actor: clean(body?.actor) || clean(request.headers["x-angelcare-operator"]) || "operator",
    sourceId: source.id,
    originalFullPath: resolved.candidate,
    originalRelativePath: resolved.relative,
    originalLocationToken: clean(body?.originalLocationToken),
    quarantineLocationToken,
    vaultPath: mode === "physical" ? vaultPath : null,
    filename: path.basename(resolved.candidate),
    sizeBytes: stat.size,
    sha256Hash: originalHash,
    retentionUntil: clean(body?.retentionUntil),
    createdAt: nowIso(),
    evidence: safeSummary(body?.evidence || {}, 8)
  }
  await atomicJson(manifestPath, manifest)
  await atomicJson(path.join(caseRoot, "evidence.json"), safeSummary(body?.evidence || {}, 8))
  await fs.promises.writeFile(path.join(caseRoot, "checksum.sha256"), `${originalHash}  ${path.basename(finalPath)}\n`, "utf8")
  appendJsonl(path.join(caseRoot, "events.log"), { timestamp: nowIso(), event: "quarantined", mode, actor: manifest.actor, sha256Hash: originalHash, sizeBytes: stat.size })
  const afterDisk = storageDiskSnapshot()
  const actualRecoveredBytes = mode === "physical" && !moveResult.sameVolume ? Math.max(0, Number(afterDisk.freeBytes || 0) - Number(beforeDisk.freeBytes || 0)) || stat.size : 0
  logStorageEvent({ action: "STORAGE_OBJECT_QUARANTINED", moduleKey: "opsos", fileId: clean(body?.fileId), mailboxId: clean(body?.mailboxId), entityType: clean(body?.entityType) || "file", direction: "archive", status: "quarantined", metadata: { caseId, caseNumber, mode, sizeBytes: stat.size, actualRecoveredBytes, reversible: true } })
  return { status: 200, payload: { ok: true, data: { phase: 3, reversible: true, caseId, caseNumber, status: "quarantined", step: "Integrity verified and quarantine activated", stepIndex: 7, stepCount: 7, originalSha256: originalHash, resultingSha256: resultingHash, actualRecoveredBytes, quarantineLocationToken, restoredRelativePath: null, warnings: moveResult.sameVolume && mode === "physical" ? ["Same-volume quarantine isolated the file but did not reclaim disk capacity."] : [], completedAt: nowIso() } } }
}

async function handleStorageQuarantineStatus(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const caseId = clean(url.searchParams.get("caseId"))
  if (!caseId) return { status: 400, payload: { ok: false, error: "caseId is required", errorName: "InvalidQuarantineRequest", errorMessage: "caseId is required" } }
  const manifestPath = quarantineManifestPath(caseId)
  if (!fs.existsSync(manifestPath)) return { status: 404, payload: { ok: false, error: "Quarantine manifest not found", errorName: "QuarantineManifestNotFound", errorMessage: "Quarantine manifest not found" } }
  const manifest = readJsonFile(manifestPath, null)
  return { status: 200, payload: { ok: true, data: safeSummary(manifest, 8) } }
}

async function handleStorageQuarantineRestore(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const caseId = clean(body?.caseId)
  const parsed = parseQuarantineToken(body?.quarantineLocationToken, "quarantine")
  if (!caseId || !parsed.ok || parsed.payload.caseId !== caseId) return { status: 400, payload: { ok: false, error: parsed.ok ? "Quarantine token case mismatch" : parsed.error, errorName: "InvalidQuarantineToken", errorMessage: parsed.ok ? "Quarantine token case mismatch" : parsed.error } }
  const manifestPath = quarantineManifestPath(caseId)
  const manifest = readJsonFile(manifestPath, null)
  if (!manifest) return { status: 404, payload: { ok: false, error: "Quarantine manifest not found", errorName: "QuarantineManifestNotFound", errorMessage: "Quarantine manifest not found" } }
  if (manifest.status === "restored") return { status: 409, payload: { ok: false, error: "Object is already restored", errorName: "QuarantineAlreadyRestored", errorMessage: "Object is already restored" } }
  const originalPath = path.resolve(manifest.originalFullPath)
  const source = storageExplorerSourceById(manifest.sourceId)
  if (!source || !isWithinRoot(originalPath, path.resolve(source.path))) return { status: 409, payload: { ok: false, error: "Original destination is no longer an approved storage location", errorName: "RestoreDestinationBlocked", errorMessage: "Original destination is no longer an approved storage location" } }
  let warning = null
  if (fs.existsSync(originalPath)) {
    const existingHash = await sha256File(originalPath)
    if (existingHash !== manifest.sha256Hash) return { status: 409, payload: { ok: false, error: "A different file exists at the original destination", errorName: "RestoreConflict", errorMessage: "A different file exists at the original destination" } }
    warning = "An identical file already existed; references can be reactivated without overwriting it."
  } else if (manifest.mode === "physical") {
    const vaultPath = path.resolve(manifest.vaultPath)
    if (!isWithinRoot(vaultPath, quarantineCaseRoot(caseId)) || !fs.existsSync(vaultPath)) return { status: 404, payload: { ok: false, error: "Quarantined file is missing from the vault", errorName: "QuarantineVaultFileMissing", errorMessage: "Quarantined file is missing from the vault" } }
    ensureDir(originalPath)
    const sameVolume = path.parse(vaultPath).root.toLowerCase() === path.parse(originalPath).root.toLowerCase()
    if (sameVolume) {
      await fs.promises.rename(vaultPath, originalPath)
    } else {
      await fs.promises.copyFile(vaultPath, originalPath, fs.constants.COPYFILE_EXCL)
      const restoredHash = await sha256File(originalPath)
      if (restoredHash !== manifest.sha256Hash) {
        await fs.promises.unlink(originalPath).catch(() => null)
        throw new Error("Restored file failed integrity verification")
      }
      await fs.promises.unlink(vaultPath)
    }
  }
  if (!fs.existsSync(originalPath)) return { status: 500, payload: { ok: false, error: "Restore did not produce the original file", errorName: "RestoreVerificationFailed", errorMessage: "Restore did not produce the original file" } }
  const resultingHash = await sha256File(originalPath)
  if (resultingHash !== manifest.sha256Hash) return { status: 409, payload: { ok: false, error: "Restored file hash does not match the original", errorName: "RestoreHashMismatch", errorMessage: "Restored file hash does not match the original" } }
  manifest.status = "restored"
  manifest.restoredAt = nowIso()
  manifest.restoredBy = clean(body?.actor) || clean(request.headers["x-angelcare-operator"]) || "operator"
  await atomicJson(manifestPath, manifest)
  appendJsonl(path.join(quarantineCaseRoot(caseId), "events.log"), { timestamp: nowIso(), event: "restored", actor: manifest.restoredBy, sha256Hash: resultingHash })
  logStorageEvent({ action: "STORAGE_OBJECT_RESTORED", moduleKey: "opsos", fileId: clean(body?.fileId), mailboxId: clean(body?.mailboxId), entityType: clean(body?.entityType) || "file", direction: "archive", status: "restored", metadata: { caseId, caseNumber: manifest.caseNumber, reversible: true } })
  return { status: 200, payload: { ok: true, data: { phase: 3, reversible: true, caseId, caseNumber: manifest.caseNumber, status: "restored", step: "Hash verified and business references ready for reactivation", stepIndex: 6, stepCount: 6, originalSha256: manifest.sha256Hash, resultingSha256: resultingHash, actualRecoveredBytes: 0, quarantineLocationToken: clean(body?.quarantineLocationToken), restoredRelativePath: manifest.originalRelativePath, warnings: warning ? [warning] : [], completedAt: nowIso() } } }
}

async function handleStorageQuarantineVerify(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const caseId = clean(url.searchParams.get("caseId"))
  const manifest = readJsonFile(quarantineManifestPath(caseId), null)
  if (!manifest) return { status: 404, payload: { ok: false, error: "Quarantine manifest not found", errorName: "QuarantineManifestNotFound", errorMessage: "Quarantine manifest not found" } }
  const target = manifest.status === "restored" || manifest.mode === "logical" ? manifest.originalFullPath : manifest.vaultPath
  const exists = Boolean(target && fs.existsSync(target))
  const currentHash = exists ? await sha256File(target) : null
  return { status: 200, payload: { ok: true, data: { phase: 3, reversible: true, caseId, status: manifest.status, physicalExists: exists, expectedSha256: manifest.sha256Hash, currentSha256: currentHash, integrityMatch: exists && currentHash === manifest.sha256Hash, verifiedAt: nowIso() } } }
}


function destructionManifestPath(requestId) {
  const safe = clean(requestId).replace(/[^a-zA-Z0-9_-]/g, "")
  if (!safe) throw new Error("Invalid destruction request ID")
  return path.join(STORAGE_QUARANTINE_ROOT, "destruction-evidence", `${safe}.json`)
}

function destructionTargetFromManifest(caseId, manifest) {
  if (!manifest) return { ok: false, error: "Quarantine manifest not found" }
  if (!["quarantined", "eligible_for_future_purge"].includes(clean(manifest.status))) return { ok: false, error: "Quarantine manifest is not eligible for permanent destruction" }
  if (manifest.mode === "physical") {
    const candidate = path.resolve(clean(manifest.vaultPath))
    if (!candidate || !isWithinRoot(candidate, quarantineCaseRoot(caseId))) return { ok: false, error: "Quarantine vault path is outside the approved case root" }
    return { ok: true, candidate, kind: "quarantine_vault" }
  }
  const source = storageExplorerSourceById(manifest.sourceId)
  const candidate = path.resolve(clean(manifest.originalFullPath))
  if (!source || !candidate || !isWithinRoot(candidate, path.resolve(source.path))) return { ok: false, error: "Logical-quarantine object is outside an approved storage root" }
  return { ok: true, candidate, kind: "logical_primary" }
}

async function handleStorageDestructionPreflight(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const caseId = clean(body?.caseId)
  const parsed = parseQuarantineToken(body?.quarantineLocationToken, "quarantine")
  if (!caseId || !parsed.ok || parsed.payload.caseId !== caseId) return { status: 400, payload: { ok: false, error: parsed.ok ? "Quarantine token case mismatch" : parsed.error, errorName: "InvalidDestructionEvidence", errorMessage: parsed.ok ? "Quarantine token case mismatch" : parsed.error } }
  const manifest = readJsonFile(quarantineManifestPath(caseId), null)
  const target = destructionTargetFromManifest(caseId, manifest)
  const blockedReasons = []
  if (!target.ok) blockedReasons.push(target.error)
  const expectedSha256 = clean(body?.expectedSha256 || manifest?.sha256Hash)
  let currentSha256 = null
  let sizeBytes = Number(manifest?.sizeBytes || 0)
  if (target.ok) {
    if (!fs.existsSync(target.candidate)) blockedReasons.push("Targeted quarantined object is missing")
    else {
      const stat = await fs.promises.lstat(target.candidate)
      if (!stat.isFile() || stat.isSymbolicLink()) blockedReasons.push("Only a regular non-link file can be permanently destroyed")
      else {
        sizeBytes = stat.size
        currentSha256 = await sha256File(target.candidate)
        if (expectedSha256 && currentSha256 !== expectedSha256) blockedReasons.push("Current hash does not match the Phase 3 evidence")
      }
    }
  }
  const copies = [
    { label: "Objet ciblé en quarantaine", bytes: sizeBytes, targeted: true, status: target.ok && fs.existsSync(target.candidate) ? "present" : "unknown", detail: target.ok ? target.kind : "Target unavailable" },
    { label: "Sauvegardes", bytes: sizeBytes * 2, targeted: false, status: "unknown", detail: "Backups remain outside this destruction request." },
    { label: "Fournisseur Menara", bytes: 0, targeted: false, status: "unknown", detail: "Provider message is not changed by Phase 4." }
  ]
  return { status: 200, payload: { ok: true, data: { phase: 4, permanent: true, eligible: blockedReasons.length === 0, blockedReasons, caseId, sizeBytes, expectedSha256: expectedSha256 || null, currentSha256, immediateRecoverableBytes: sizeBytes, estimatedTotalRecoverableBytes: sizeBytes, copies, analyzedAt: nowIso() } } }
}

async function handleStorageDestructionExecute(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const requestId = clean(body?.requestId)
  const requestNumber = clean(body?.requestNumber)
  const caseId = clean(body?.quarantineCaseId)
  const scope = clean(body?.scope)
  const parsed = parseQuarantineToken(body?.quarantineLocationToken, "quarantine")
  if (!requestId || !requestNumber || !caseId || !parsed.ok || parsed.payload.caseId !== caseId) return { status: 400, payload: { ok: false, error: parsed.ok ? "Invalid destruction request" : parsed.error, errorName: "InvalidDestructionRequest", errorMessage: parsed.ok ? "Invalid destruction request" : parsed.error } }
  if (!["physical_file", "technical_cleanup", "application_message", "complete_local_message"].includes(scope)) return { status: 400, payload: { ok: false, error: "Unsupported destruction scope", errorName: "InvalidDestructionScope", errorMessage: "Unsupported destruction scope" } }
  const manifestPath = quarantineManifestPath(caseId)
  const manifest = readJsonFile(manifestPath, null)
  const target = destructionTargetFromManifest(caseId, manifest)
  if (!target.ok) return { status: 409, payload: { ok: false, error: target.error, errorName: "DestructionBlocked", errorMessage: target.error } }
  if (!fs.existsSync(target.candidate)) return { status: 404, payload: { ok: false, error: "Targeted quarantined object is missing", errorName: "DestructionTargetMissing", errorMessage: "Targeted quarantined object is missing" } }
  const stat = await fs.promises.lstat(target.candidate)
  if (!stat.isFile() || stat.isSymbolicLink()) return { status: 409, payload: { ok: false, error: "Only a regular non-link file can be permanently destroyed", errorName: "DestructionBlocked", errorMessage: "Only a regular non-link file can be permanently destroyed" } }
  const expectedSha256 = clean(body?.expectedSha256 || manifest.sha256Hash)
  const currentSha256 = await sha256File(target.candidate)
  if (!expectedSha256 || currentSha256 !== expectedSha256) return { status: 409, payload: { ok: false, error: "Target hash does not match approved evidence", errorName: "DestructionHashMismatch", errorMessage: "Target hash does not match approved evidence" } }
  const beforeDisk = storageDiskSnapshot()
  await fs.promises.unlink(target.candidate)
  const quarantinePathExistsAfterExecution = fs.existsSync(target.candidate)
  const originalPathExistsAfterExecution = Boolean(manifest.originalFullPath && fs.existsSync(manifest.originalFullPath))
  let targetedHashPresentAfterExecution = false
  if (quarantinePathExistsAfterExecution) {
    targetedHashPresentAfterExecution = (await sha256File(target.candidate)) === expectedSha256
  }
  manifest.status = "destroyed"
  manifest.destroyedAt = nowIso()
  manifest.destroyedBy = clean(body?.actor) || clean(request.headers["x-angelcare-operator"]) || "operator"
  manifest.destruction = { phase: 4, requestId, requestNumber, scope, reason: clean(body?.reason), permanent: true, expectedSha256, verifiedAbsent: !quarantinePathExistsAfterExecution && !targetedHashPresentAfterExecution }
  await atomicJson(manifestPath, manifest)
  appendJsonl(path.join(quarantineCaseRoot(caseId), "events.log"), { timestamp: nowIso(), event: "permanently_destroyed", requestId, requestNumber, actor: manifest.destroyedBy, sha256Hash: expectedSha256, sizeBytes: stat.size })
  const afterDisk = storageDiskSnapshot()
  const measured = Math.max(0, Number(afterDisk.freeBytes || 0) - Number(beforeDisk.freeBytes || 0))
  const actualRecoveredBytes = measured || stat.size
  const remainingCopies = [
    { label: "Sauvegardes", bytes: stat.size * 2, targeted: false, status: "unknown", detail: "Backup copies remain until their independent retention expires." },
    { label: "Fournisseur Menara", bytes: 0, targeted: false, status: "unknown", detail: "Provider message remains unaffected." }
  ]
  const evidence = { phase: 4, permanent: true, requestId, requestNumber, caseId, scope, expectedSha256, sizeBytes: stat.size, targetedHashPresentAfterExecution, quarantinePathExistsAfterExecution, originalPathExistsAfterExecution, actualRecoveredBytes, remainingCopies, completedAt: nowIso() }
  await atomicJson(destructionManifestPath(requestId), evidence)
  logStorageEvent({ action: "STORAGE_OBJECT_PERMANENTLY_DESTROYED", moduleKey: "opsos", fileId: clean(body?.fileId), mailboxId: clean(body?.mailboxId), entityType: clean(body?.entityType) || "file", direction: "archive", status: "destroyed", metadata: { requestId, requestNumber, caseId, scope, actualRecoveredBytes, permanent: true } })
  return { status: 200, payload: { ok: true, data: { phase: 4, permanent: true, requestId, requestNumber, status: targetedHashPresentAfterExecution || quarantinePathExistsAfterExecution ? "partially_destroyed" : "destroyed", step: "Physical absence and hash verification completed", stepIndex: 7, stepCount: 7, expectedSha256, targetedHashPresentAfterExecution, quarantinePathExistsAfterExecution, originalPathExistsAfterExecution, actualRecoveredBytes, remainingCopies, warnings: ["Backup and provider copies remain outside this request."], completedAt: nowIso() } } }
}

async function handleStorageDestructionCancel(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const requestId = clean(body?.requestId)
  if (!requestId) return { status: 400, payload: { ok: false, error: "requestId is required", errorName: "InvalidDestructionRequest", errorMessage: "requestId is required" } }
  if (fs.existsSync(destructionManifestPath(requestId))) return { status: 409, payload: { ok: false, error: "Destruction evidence already exists; cancellation is no longer possible", errorName: "DestructionAlreadyExecuted", errorMessage: "Destruction evidence already exists; cancellation is no longer possible" } }
  return { status: 200, payload: { ok: true, data: { phase: 4, permanent: false, requestId, status: "cancelled", cancelledAt: nowIso() } } }
}

async function handleStorageDestructionStatus(request, url) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const requestId = clean(url.searchParams.get("requestId"))
  const evidence = requestId ? readJsonFile(destructionManifestPath(requestId), null) : null
  if (!evidence) return { status: 404, payload: { ok: false, error: "Destruction evidence not found", errorName: "DestructionEvidenceNotFound", errorMessage: "Destruction evidence not found" } }
  return { status: 200, payload: { ok: true, data: safeSummary(evidence, 8) } }
}

function cleanupCandidates(profile) {
  const candidates = []
  const cutoff = Date.now() - Math.max(0, Number(profile?.minimumAgeDays || 0)) * 86400000
  const maximum = Math.max(1, Math.min(5000, Number(profile?.maximumBatchSize || 100)))
  const sourceIds = Array.isArray(profile?.sourceIds) ? profile.sourceIds : []
  const extensions = (Array.isArray(profile?.extensions) ? profile.extensions : []).map((item) => clean(item).toLowerCase()).filter(Boolean)
  for (const sourceId of sourceIds) {
    const source = storageExplorerSourceById(sourceId)
    if (!source || !fs.existsSync(source.path)) continue
    const stack = [path.resolve(source.path)]
    while (stack.length && candidates.length < maximum) {
      const current = stack.pop()
      let entries = []
      try { entries = fs.readdirSync(current, { withFileTypes: true }) } catch { continue }
      for (const item of entries) {
        if (candidates.length >= maximum) break
        const full = path.join(current, item.name)
        let stat
        try { stat = fs.lstatSync(full) } catch { continue }
        if (stat.isSymbolicLink()) continue
        if (stat.isDirectory()) { stack.push(full); continue }
        if (!stat.isFile() || stat.mtimeMs > cutoff) continue
        const lower = item.name.toLowerCase()
        if (extensions.length && !extensions.some((extension) => lower.endsWith(extension))) continue
        if (quarantineBlockedReason(source, { candidate: full }, stat, { storageStatus: "historical" })) continue
        candidates.push({ sourceId, relativePath: path.relative(source.path, full), name: item.name, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString(), fullPath: full })
      }
    }
  }
  return candidates
}

async function handleStorageCleanupDryRun(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const profile = body?.profile || {}
  const candidates = cleanupCandidates(profile)
  return { status: 200, payload: { ok: true, data: { phase: 4, readOnly: true, profileId: clean(profile.id), profileName: clean(profile.name), matchedCount: candidates.length, matchedBytes: candidates.reduce((sum, item) => sum + item.sizeBytes, 0), candidates: candidates.map(({ fullPath, ...item }) => item), simulatedAt: nowIso() } } }
}

async function handleStorageCleanupExecute(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  const profile = body?.profile || {}
  if (clean(body?.confirmation) !== `EXECUTER ${clean(profile.id)}`) return { status: 400, payload: { ok: false, error: "Invalid cleanup confirmation", errorName: "InvalidCleanupConfirmation", errorMessage: "Invalid cleanup confirmation" } }
  const candidates = cleanupCandidates(profile)
  let recoveredBytes = 0
  const results = []
  for (const item of candidates) {
    try {
      const source = storageExplorerSourceById(item.sourceId)
      if (!source || !isWithinRoot(item.fullPath, path.resolve(source.path))) throw new Error("Path outside approved root")
      const stat = await fs.promises.lstat(item.fullPath)
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Blocked file type")
      await fs.promises.unlink(item.fullPath)
      recoveredBytes += stat.size
      results.push({ sourceId: item.sourceId, relativePath: item.relativePath, status: "destroyed", sizeBytes: stat.size })
    } catch (error) {
      results.push({ sourceId: item.sourceId, relativePath: item.relativePath, status: "failed", error: error instanceof Error ? error.message : String(error) })
    }
  }
  return { status: 200, payload: { ok: true, data: { phase: 4, permanent: true, profileId: clean(profile.id), status: results.some((item) => item.status === "failed") ? "completed_with_warnings" : "completed", matchedCount: candidates.length, destroyedCount: results.filter((item) => item.status === "destroyed").length, failedCount: results.filter((item) => item.status === "failed").length, recoveredBytes, results, completedAt: nowIso() } } }
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
      if (Buffer.byteLength(raw, "utf8") > 25 * 1024 * 1024) {
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

function parseBoolean(value, fallback = false) {
  const text = clean(value).toLowerCase()
  if (!text) return fallback
  if (["true", "1", "yes", "on"].includes(text)) return true
  if (["false", "0", "no", "off"].includes(text)) return false
  return fallback
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function normalizeAddressList(value) {
  return Array.isArray(value) ? value.map((item) => clean(item)).filter(Boolean) : []
}

function previewMessage(text, html, snippet) {
  const source = clean(snippet) || clean(text) || (typeof html === "string" ? html.replace(/<[^>]+>/g, " ") : "") || ""
  return source.replace(/\s+/g, " ").trim().slice(0, 280)
}

function normalizeHeaders(headers) {
  const output = {}
  try {
    if (!headers) return output
    for (const [key, value] of headers) {
      if (typeof value === "string") output[key] = value
      else if (Array.isArray(value)) output[key] = value.map((item) => String(item)).join(", ")
      else if (value) output[key] = String(value)
    }
  } catch {}
  return output
}

function normalizePop3Body(body) {
  return {
    mailboxId: clean(body.mailboxId || body.mailbox_id),
    email: clean(body.email).toLowerCase(),
    username: clean(body.username || body.user || body.login || body.email).toLowerCase(),
    password: clean(body.password),
    host: clean(body.host || body.incoming?.host),
    port: parsePositiveInteger(body.port || body.incoming?.port, 110),
    secure: parseBoolean(body.secure ?? body.incoming?.secure, false),
    limit: Math.min(100, Math.max(1, parsePositiveInteger(body.limit, 25)))
  }
}

function pop3Error(code, message, status = 502, diagnostics = {}) {
  const error = new Error(message)
  error.code = code
  error.status = status
  error.diagnostics = diagnostics
  return error
}

function mapPop3Error(error, context) {
  const code = clean(error && error.code).toUpperCase()
  const diagnostics = {
    mailboxId: context.mailboxId,
    email: context.email,
    incoming: context.incoming,
    limit: context.limit
  }

  if (code === "POP_AUTH_FAILED") return pop3Error("POP_AUTH_FAILED", "POP3 authentication failed", 502, diagnostics)
  if (code === "POP_PARSE_FAILED") return pop3Error("POP_PARSE_FAILED", "POP3 parse failed", 502, diagnostics)
  if (code === "POP_HOST_UNREACHABLE") return pop3Error("POP_HOST_UNREACHABLE", "POP3 host unreachable from Windows bridge", 502, diagnostics)
  if (code === "POP_TIMEOUT") return pop3Error("POP_TIMEOUT", "POP3 connection timed out from Windows bridge", 504, diagnostics)
  if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code)) {
    return pop3Error("POP_HOST_UNREACHABLE", "POP3 host unreachable from Windows bridge", 502, diagnostics)
  }
  if (code === "ETIMEDOUT") return pop3Error("POP_TIMEOUT", "POP3 connection timed out from Windows bridge", 504, diagnostics)
  return pop3Error("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502, {
    ...diagnostics,
    reason: error instanceof Error ? error.message : String(error || "POP3 request failed")
  })
}

class Pop3Client {
  constructor(config) {
    this.config = config
    this.socket = null
    this.buffer = ""
  }

  connectSocket() {
    const { host, port, secure } = this.config
    return secure
      ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
      : net.connect({ host, port })
  }

  async connect() {
    const { timeoutMs = POP_TIMEOUT_MS } = this.config
    this.socket = this.connectSocket()
    this.socket.setTimeout(timeoutMs)

    await new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = (error) => {
        cleanup()
        reject(error)
      }
      const cleanup = () => {
        this.socket.off("connect", onReady)
        this.socket.off("secureConnect", onReady)
        this.socket.off("error", onError)
      }
      this.socket.once(this.config.secure ? "secureConnect" : "connect", onReady)
      this.socket.once("error", onError)
    })

    await this.readResponse()
  }

  readLine() {
    return new Promise((resolve, reject) => {
      const tryRead = () => {
        const index = this.buffer.indexOf("\r\n")
        if (index >= 0) {
          const line = this.buffer.slice(0, index)
          this.buffer = this.buffer.slice(index + 2)
          cleanup()
          resolve(line)
          return true
        }
        return false
      }

      const onData = (chunk) => {
        this.buffer += chunk.toString("binary")
        tryRead()
      }
      const onError = (error) => {
        cleanup()
        reject(error)
      }
      const onTimeout = () => {
        cleanup()
        reject(pop3Error("POP_TIMEOUT", "POP3 connection timed out from Windows bridge", 504))
      }
      const cleanup = () => {
        this.socket.off("data", onData)
        this.socket.off("error", onError)
        this.socket.off("timeout", onTimeout)
      }

      if (tryRead()) return
      this.socket.on("data", onData)
      this.socket.once("error", onError)
      this.socket.once("timeout", onTimeout)
    })
  }

  async readResponse() {
    const line = await this.readLine()
    if (line.startsWith("+OK")) return line
    if (/auth|password|login|credentials?/i.test(line) || line.startsWith("-ERR")) {
      throw pop3Error("POP_AUTH_FAILED", "POP3 authentication failed", 502, { response: line })
    }
    throw pop3Error("POP_HOST_UNREACHABLE", "POP3 host unreachable from Windows bridge", 502, { response: line })
  }

  async readMultiline() {
    const first = await this.readLine()
    if (!first.startsWith("+OK")) {
      if (/auth|password|login|credentials?/i.test(first) || first.startsWith("-ERR")) {
        throw pop3Error("POP_AUTH_FAILED", "POP3 authentication failed", 502, { response: first })
      }
      throw pop3Error("POP_HOST_UNREACHABLE", "POP3 host unreachable from Windows bridge", 502, { response: first })
    }

    const lines = []
    while (true) {
      const line = await this.readLine()
      if (line === ".") break
      lines.push(line.startsWith("..") ? line.slice(1) : line)
    }
    return lines
  }

  async command(command) {
    if (!this.socket) throw pop3Error("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502)
    this.socket.write(`${command}\r\n`, "binary")
    return this.readResponse()
  }

  async multiline(command) {
    if (!this.socket) throw pop3Error("BRIDGE_UNAVAILABLE", "Windows inbound bridge unavailable", 502)
    this.socket.write(`${command}\r\n`, "binary")
    return this.readMultiline()
  }

  async login(user, pass) {
    await this.command(`USER ${clean(user)}`)
    await this.command(`PASS ${clean(pass)}`)
  }

  async listMessages() {
    let uidLines = []
    try {
      uidLines = await this.multiline("UIDL")
    } catch {}

    const listLines = await this.multiline("LIST")
    const sizes = new Map()

    for (const line of listLines) {
      const [numberText, sizeText] = String(line || "").trim().split(/\s+/)
      const number = Number(numberText)
      const size = Number(sizeText)
      if (Number.isFinite(number) && Number.isFinite(size)) {
        sizes.set(number, size)
      }
    }

    if (uidLines.length) {
      return uidLines
        .map((line) => {
          const [numberText, uid] = String(line || "").trim().split(/\s+/)
          const number = Number(numberText)
          return Number.isFinite(number) && uid ? { number, uid, size: sizes.get(number) || 0 } : null
        })
        .filter(Boolean)
    }

    return listLines
      .map((line) => {
        const [numberText, sizeText] = String(line || "").trim().split(/\s+/)
        const number = Number(numberText)
        const size = Number(sizeText)
        return Number.isFinite(number) ? { number, uid: String(number), size: Number.isFinite(size) ? size : 0 } : null
      })
      .filter(Boolean)
  }

  async retrieve(number) {
    return this.multiline(`RETR ${number}`)
  }

  async quit() {
    try {
      await this.command("QUIT")
    } catch {}
    try {
      this.socket && this.socket.destroy()
    } catch {}
  }
}

async function handleAdminInboundSync(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, code: "BRIDGE_UNAVAILABLE" } }
  }

  const input = normalizePop3Body(body || {})
  if (!input.mailboxId || !input.email || !input.username || !input.password || !input.host) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Missing required fields",
        code: "INVALID_REQUEST"
      }
    }
  }

  const incoming = {
    protocol: "pop3",
    host: input.host,
    port: input.port,
    secure: input.secure
  }
  const started = Date.now()
  const client = new Pop3Client({
    host: input.host,
    port: input.port,
    secure: input.secure,
    timeoutMs: POP_TIMEOUT_MS
  })

  auditAction({
    action: "INBOUND_POP3_SYNC",
    actor: clean(request.headers["x-angelcare-operator"]) || "system",
    ip: getRequestIp(request),
    params: {
      mailboxId: input.mailboxId,
      email: input.email,
      incoming,
      limit: input.limit
    },
    result: "running",
    durationMs: 0
  })

  try {
    await client.connect()
    await client.login(input.username, input.password)

    const refs = await client.listMessages()
    const selected = refs.slice(-Math.max(1, Math.min(input.limit, 100)))
    const messages = []
    let skipped = 0

    for (const ref of selected) {
      if (Number.isFinite(ref.size) && ref.size > MAX_POP_MESSAGE_BYTES) {
        skipped += 1
        continue
      }

      const rawLines = await client.retrieve(ref.number)
      const rawText = rawLines.join("\r\n")
      if (Buffer.byteLength(rawText, "utf8") > MAX_POP_MESSAGE_BYTES) {
        skipped += 1
        continue
      }

      let parsed
      try {
        parsed = await simpleParser(Buffer.from(rawText, "utf8"))
      } catch (error) {
        throw pop3Error("POP_PARSE_FAILED", "POP3 parse failed", 502, {
          mailboxId: input.mailboxId,
          email: input.email,
          reason: error instanceof Error ? error.message : String(error || "parse failed")
        })
      }

      const from = parsed.from?.value?.[0] || null
      const to = normalizeAddressList(parsed.to?.value?.map((item) => item.address))
      const cc = normalizeAddressList(parsed.cc?.value?.map((item) => item.address))
      const attachments = []
      if (Array.isArray(parsed.attachments)) {
        for (const attachment of parsed.attachments) {
          const filename = sanitizeStorageFilename(attachment.filename || attachment.name || "attachment")
          const contentType = clean(attachment.contentType || attachment.content_type || "application/octet-stream") || "application/octet-stream"
          const size = Number.isFinite(Number(attachment.size)) ? Number(attachment.size) : 0
          const buffer = Buffer.isBuffer(attachment.content)
            ? attachment.content
            : attachment.content
              ? Buffer.from(attachment.content)
              : Buffer.alloc(0)

          let storageFileId = ""
          let storageBucket = ""
          let storageKey = ""
          let storageStatus = "metadata_only"

          if (buffer.length && buffer.length <= STORAGE_MAX_FILE_BYTES) {
            storageFileId = crypto.randomUUID()
            storageBucket = STORAGE_BUCKET
            storageKey = path.posix.join("email-os", "attachments", "inbound", sanitizeStoragePart(mailbox.key || mailbox.mailboxId || mailbox.email || "email_os"), "pop3-message", storageFileId, filename)
            const storagePath = path.join(STORAGE_ROOT, storageKey)
            const metaPath = buildStorageMetaPath("inbound", mailbox.key || mailbox.mailboxId || mailbox.email || "email_os", "pop3-message", storageFileId, filename)
            if (isWithinRoot(storagePath, STORAGE_ROOT)) {
              fs.mkdirSync(path.dirname(storagePath), { recursive: true })
              fs.writeFileSync(storagePath, buffer)
              fs.writeFileSync(metaPath, `${JSON.stringify({
                id: storageFileId,
                module_key: "email_os",
                mailbox_id: mailbox.mailboxId,
                entity_type: "pop3_message",
                entity_id: String(ref.uid || ref.number),
                original_filename: filename,
                safe_filename: filename,
                content_type: contentType,
                size_bytes: buffer.length,
                sha256_hash: crypto.createHash("sha256").update(buffer).digest("hex"),
                storage_provider: "windows_node",
                storage_node: STORAGE_NODE,
                storage_bucket: storageBucket,
                storage_key: storageKey,
                status: "active",
                created_by: "windows_bridge_pop3",
                created_at: nowIso(),
                updated_at: nowIso(),
                deleted_at: null,
                metadata: {
                  source: "pop3",
                  mailboxKey: mailbox.key,
                  providerUid: String(ref.uid || ref.number)
                }
              }, null, 2)}\n`, "utf8")
              storageStatus = "active"
              logStorageEvent({
                action: "STORAGE_INBOUND_SYNC",
                moduleKey: "email_os",
                fileId: storageFileId,
                mailboxId: mailbox.mailboxId,
                entityType: "pop3_message",
                direction: "inbound",
                status: "ok",
                freeBytes: storageDiskSnapshot().freeBytes,
                usedBytes: storageDiskSnapshot().usedBytes,
                metadata: { filename, contentType, sizeBytes: buffer.length, storageBucket, storageKey }
              })
            }
          }

          attachments.push({
            filename,
            contentType,
            size,
            storageFileId: storageFileId || null,
            storageBucket: storageBucket || null,
            storageKey: storageKey || null,
            storageStatus,
            sha256Hash: storageFileId ? crypto.createHash("sha256").update(buffer).digest("hex") : null
          })
        }
      }
      const receivedAt = parsed.date ? parsed.date.toISOString() : new Date().toISOString()
      const subject = parsed.subject || "(Sans objet)"

      messages.push({
        externalId: String(ref.uid || ref.number),
        messageId: parsed.messageId || null,
        subject,
        fromEmail: from?.address || "",
        fromName: from?.name || null,
        to,
        cc,
        date: receivedAt,
        text: parsed.text || null,
        html: typeof parsed.html === "string" ? parsed.html : null,
        snippet: previewMessage(parsed.text, parsed.html, null),
        hasAttachments: attachments.length > 0,
        attachments,
        rawHeaders: normalizeHeaders(parsed.headers)
      })
    }

    const durationMs = Date.now() - started
    auditAction({
      action: "INBOUND_POP3_SYNC",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: {
        mailboxId: input.mailboxId,
        email: input.email,
        incoming,
        limit: input.limit
      },
      result: "ok",
      durationMs,
      after: {
        fetched: messages.length,
        skipped
      }
    })

    return {
      status: 200,
      payload: {
        ok: true,
        mailboxId: input.mailboxId,
        email: input.email,
        incoming,
        fetched: messages.length,
        skipped,
        messages,
        diagnostics: {
          mailboxId: input.mailboxId,
          incoming,
          limit: input.limit,
          messageCount: refs.length,
          parsedCount: messages.length,
          skipped
        }
      }
    }
  } catch (error) {
    const mapped = mapPop3Error(error, {
      mailboxId: input.mailboxId,
      email: input.email,
      incoming,
      limit: input.limit
    })
    const durationMs = Date.now() - started

    auditAction({
      action: "INBOUND_POP3_SYNC_ERROR",
      actor: clean(request.headers["x-angelcare-operator"]) || "system",
      ip: getRequestIp(request),
      params: {
        mailboxId: input.mailboxId,
        email: input.email,
        incoming,
        limit: input.limit
      },
      result: "error",
      durationMs,
      error: mapped.message
    })

    logStructured(LOG_ERROR, {
      event: "INBOUND_POP3_SYNC_ERROR",
      level: "error",
      message: mapped.message,
      error: mapped.code,
      diagnostics: sanitizeLogEntryValue({
        mailboxId: input.mailboxId,
        email: input.email,
        incoming,
        limit: input.limit
      })
    })

    return {
      status: mapped.status || 502,
      payload: {
        ok: false,
        error: mapped.message,
        code: mapped.code,
        diagnostics: mapped.diagnostics
      }
    }
  } finally {
    await client.quit()
  }
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024
const MAX_ATTACHMENT_COUNT = 10

function sanitizeAttachmentFilename(value) {
  const raw = clean(value).replace(/[\\/:*?"<>|]/g, "_")
  return raw.slice(0, 160) || "attachment"
}

function estimateBase64Bytes(value) {
  const cleanValue = String(value || "").replace(/\s/g, "")
  const padding = cleanValue.endsWith("==") ? 2 : cleanValue.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor(cleanValue.length * 3 / 4) - padding)
}

function normalizeBridgeAttachments(input) {
  const rows = Array.isArray(input) ? input.slice(0, MAX_ATTACHMENT_COUNT) : []
  let totalBytes = 0

  return rows.map((item) => {
    const filename = sanitizeAttachmentFilename(item && (item.filename || item.name))
    const contentType = clean(item && (item.contentType || item.content_type || item.mimeType)) || "application/octet-stream"
    const rawBase64 = clean(item && (item.contentBase64 || item.content_base64 || item.base64 || item.content))

    if (!rawBase64) {
      throw new Error(`Attachment ${filename} has no file content.`)
    }

    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(rawBase64)) {
      throw new Error(`Attachment ${filename} is not valid base64.`)
    }

    const bytes = estimateBase64Bytes(rawBase64)
    if (bytes > MAX_ATTACHMENT_BYTES) {
      throw new Error(`Attachment ${filename} exceeds the 8 MB limit.`)
    }

    totalBytes += bytes
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new Error("Total attachments exceed the 15 MB limit.")
    }

    return {
      filename,
      contentType,
      content: Buffer.from(rawBase64, "base64")
    }
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
    const resolvedFromAddress = input.fromEmail || config.fromEmail
    const resolvedFrom = input.fromName
      ? { name: input.fromName, address: resolvedFromAddress }
      : resolvedFromAddress
    const resolvedReplyTo = input.replyTo
      ? input.replyToName
        ? { name: input.replyToName, address: input.replyTo }
        : input.replyTo
      : undefined

    const info = await transport.sendMail({
      from: resolvedFrom,
      to: input.toEmail,
      cc: input.cc || undefined,
      bcc: input.bcc || undefined,
      subject: input.subject || "(Sans objet)",
      text: input.text || "",
      html: input.html || String(input.text || "").replace(/\n/g, "<br />"),
      attachments: normalizeBridgeAttachments(input.attachments || []),
      replyTo: resolvedReplyTo,
      headers: {
        "X-AngelCare-Mailbox": diagnostics.mailbox || "",
        "X-AngelCare-Mailbox-ID": diagnostics.mailboxId || "",
        "X-AngelCare-From": resolvedFromAddress || "",
        "X-AngelCare-From-Name": input.fromName || "",
        "X-AngelCare-Sender-Identity-ID": diagnostics.senderIdentityId || "",
        "X-AngelCare-Sender-Identity-Version": diagnostics.senderIdentityVersion || "",
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
  const fromName = clean(body.fromName)
  const toEmail = clean(body.toEmail)
  const cc = clean(body.cc)
  const bcc = clean(body.bcc)
  const subject = clean(body.subject) || "(Sans objet)"
  const text = clean(body.text)
  const html = clean(body.html)
  const replyTo = clean(body.replyTo)
  const replyToName = clean(body.replyToName)
  const attachments = Array.isArray(body.attachments) ? body.attachments : []
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
    fromName,
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
        attachmentCount: Array.isArray(attachments) ? attachments.length : 0,
        secure: smtpSecure,
        user: username,
        pass: password,
        fromEmail
      },
      { fromEmail, fromName, toEmail, cc, bcc, subject, text, html, replyTo, replyToName, attachments },
      {
        mailbox,
        mailboxId,
        senderIdentityId: clean(body.diagnostics?.senderIdentity?.senderIdentityId),
        senderIdentityVersion: clean(body.diagnostics?.senderIdentity?.senderIdentityVersion)
      }
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
        port: smtpPort,
        attachmentCount: Array.isArray(attachments) ? attachments.length : 0
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
        disk: {
          ...computeDiskSnapshot(STORAGE_ROOT),
          rootPath: "storage-root"
        },
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

async function handleStorageUpload(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const originalFilename = sanitizeStorageFilename(body.originalFilename || body.filename || "attachment")
  const contentType = clean(body.contentType || body.content_type || body.mimeType) || "application/octet-stream"
  const rawBase64 = clean(body.contentBase64 || body.content_base64 || body.base64 || body.content)
  const moduleKey = sanitizeStoragePart(body.moduleKey || body.module_key || "email_os")
  const entityType = sanitizeStoragePart(body.entityType || body.entity_type || "attachment")
  const entityId = clean(body.entityId || body.entity_id) || null
  const mailboxId = clean(body.mailboxId || body.mailbox_id) || null
  const createdBy = clean(body.createdBy || body.created_by) || null
  const direction = normalizeStorageDirection(body.direction || "outbound")
  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {}

  if (!rawBase64) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "contentBase64 is required",
        errorName: "StorageUploadInvalid",
        errorMessage: "contentBase64 is required"
      }
    }
  }

  const content = Buffer.from(rawBase64.replace(/^data:[^,]+,/, ""), "base64")
  if (!content.length) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Attachment content is empty",
        errorName: "StorageUploadInvalid",
        errorMessage: "Attachment content is empty"
      }
    }
  }

  if (content.length > STORAGE_MAX_FILE_BYTES) {
    return {
      status: 413,
      payload: {
        ok: false,
        error: `Attachment exceeds the ${Math.floor(STORAGE_MAX_FILE_BYTES / (1024 * 1024))} MB limit.`,
        errorName: "StorageUploadTooLarge",
        errorMessage: `Attachment exceeds the ${Math.floor(STORAGE_MAX_FILE_BYTES / (1024 * 1024))} MB limit.`
      }
    }
  }

  const fileId = clean(body.id || body.fileId || body.file_id) || crypto.randomUUID()
  const folder = buildStorageFolder(direction, moduleKey, entityType, fileId)
  const filePath = buildStorageFilePath(direction, moduleKey, entityType, fileId, originalFilename)
  const metaPath = buildStorageMetaPath(direction, moduleKey, entityType, fileId, originalFilename)
  const storageKey = path.posix.join("email-os", "attachments", direction, moduleKey, entityType, fileId, sanitizeStorageFilename(originalFilename))
  const storageBucket = STORAGE_BUCKET
  const sha256Hash = crypto.createHash("sha256").update(content).digest("hex")
  const createdAt = nowIso()

  if (!isWithinRoot(filePath, STORAGE_ROOT)) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "Invalid storage path",
        errorName: "StorageUploadInvalid",
        errorMessage: "Invalid storage path"
      }
    }
  }

  fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(filePath, content)

  const record = {
    id: fileId,
    module_key: moduleKey,
    mailbox_id: mailboxId,
    entity_type: entityType,
    entity_id: entityId,
    original_filename: originalFilename,
    safe_filename: sanitizeStorageFilename(originalFilename),
    content_type: contentType,
    size_bytes: content.length,
    sha256_hash: sha256Hash,
    storage_provider: "windows_node",
    storage_node: STORAGE_NODE,
    storage_bucket: storageBucket,
    storage_key: storageKey,
    status: "active",
    created_by: createdBy,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    metadata: safeSummary(metadata)
  }

  fs.writeFileSync(metaPath, `${JSON.stringify(record, null, 2)}\n`, "utf8")

  const disk = storageDiskSnapshot()
  const event = {
    action: "STORAGE_UPLOAD",
    moduleKey: moduleKey,
    fileId,
    mailboxId,
    entityType,
    direction,
    status: "ok",
    freeBytes: disk.freeBytes,
    usedBytes: disk.usedBytes,
    metadata: {
      originalFilename,
      contentType,
      sizeBytes: content.length,
      storageBucket,
      storageKey
    }
  }
  logStorageEvent(event)
  runtimeState.lastStorageUpload = {
    timestamp: createdAt,
    ...event
  }

  return {
    status: 200,
    payload: buildStorageResponseData(record, {
      direction,
      storageBucket,
      storageKey,
      freeBytes: disk.freeBytes,
      usedBytes: disk.usedBytes,
      totalBytes: disk.totalBytes,
      warning: disk.warning,
      critical: disk.critical
    })
  }
}

async function handleStorageHealth(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const disk = storageDiskSnapshot()
  const eventTail = readTailJsonl(STORAGE_EVENT_FILE, 100)
  const events = Array.isArray(eventTail.lines) ? eventTail.lines : []
  const lastUpload = events.filter((entry) => String(entry.action || "") === "STORAGE_UPLOAD").at(-1) || null
  const lastDownload = events.filter((entry) => String(entry.action || "") === "STORAGE_DOWNLOAD").at(-1) || null
  const lastError = events.filter((entry) => String(entry.action || "").includes("STORAGE_") && String(entry.result || "").toLowerCase() === "error").at(-1) || null

  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        bucket: STORAGE_BUCKET,
        node: STORAGE_NODE,
        usedBytes: disk.usedBytes,
        freeBytes: disk.freeBytes,
        totalBytes: disk.totalBytes,
        warning: disk.warning,
        critical: disk.critical,
        warningThresholdBytes: STORAGE_WARNING_FREE_BYTES,
        criticalThresholdBytes: STORAGE_CRITICAL_FREE_BYTES,
        directoryLabels: {
          inbound: "email-os/attachments/inbound",
          outbound: "email-os/attachments/outbound",
          temp: "email-os/attachments/temp",
          archive: "email-os/attachments/archive"
        },
        lastUpload: lastUpload ? sanitizeLogEntryValue(lastUpload) : null,
        lastDownload: lastDownload ? sanitizeLogEntryValue(lastDownload) : null,
        lastError: lastError ? sanitizeLogEntryValue(lastError) : null,
        lastCheckedAt: nowIso()
      }
    }
  }
}

async function handleStorageUsage(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const disk = storageDiskSnapshot()
  const eventTail = readTailJsonl(STORAGE_EVENT_FILE, 200)
  const events = Array.isArray(eventTail.lines) ? eventTail.lines : []
  const lastUpload = events.filter((entry) => String(entry.action || "").includes("UPLOAD")).at(-1) || null
  const lastDownload = events.filter((entry) => String(entry.action || "").includes("DOWNLOAD")).at(-1) || null
  const lastError = events.filter((entry) => String(entry.action || "").includes("ERROR") || String(entry.result || "").toLowerCase() === "error").at(-1) || null
  const storageFilesSize = getDirectorySize(path.join(STORAGE_ROOT, "email-os", "attachments"))

  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        bucket: STORAGE_BUCKET,
        node: STORAGE_NODE,
        usedBytes: storageFilesSize || disk.usedBytes,
        freeBytes: disk.freeBytes,
        totalBytes: disk.totalBytes,
        warning: disk.warning,
        critical: disk.critical,
        warningThresholdBytes: STORAGE_WARNING_FREE_BYTES,
        criticalThresholdBytes: STORAGE_CRITICAL_FREE_BYTES,
        fileCount: events.filter((entry) => String(entry.action || "").includes("UPLOAD")).length,
        eventCount: events.length,
        lastUpload: lastUpload ? sanitizeLogEntryValue(lastUpload) : null,
        lastDownload: lastDownload ? sanitizeLogEntryValue(lastDownload) : null,
        lastError: lastError ? sanitizeLogEntryValue(lastError) : null,
        lastCheckedAt: nowIso()
      }
    }
  }
}

async function handleStorageDownload(request, url, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const fileId = clean(url?.pathname?.split("/").pop() || body?.fileId || body?.file_id)
  if (!fileId) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "fileId is required",
        errorName: "StorageFileRequired",
        errorMessage: "fileId is required"
      }
    }
  }

  const found = findStorageRecordById(fileId)
  if (!found || !found.filePath || !fs.existsSync(found.filePath)) {
    return {
      status: 404,
      payload: {
        ok: false,
        error: "Storage file not found",
        errorName: "StorageFileNotFound",
        errorMessage: "Storage file not found"
      }
    }
  }

  const meta = found.meta && typeof found.meta === "object" ? found.meta : {}
  if (String(meta.status || "").toLowerCase() === "deleted") {
    return {
      status: 410,
      payload: {
        ok: false,
        error: "Storage file has been deleted",
        errorName: "StorageFileDeleted",
        errorMessage: "Storage file has been deleted"
      }
    }
  }
  const buffer = fs.readFileSync(found.filePath)
  const contentType = clean(meta.content_type || meta.contentType) || "application/octet-stream"
  const safeFilename = sanitizeStorageFilename(meta.safe_filename || meta.original_filename || path.basename(found.filePath))

  const disk = storageDiskSnapshot()
  const event = {
    action: "STORAGE_DOWNLOAD",
    moduleKey: meta.module_key || "email_os",
    fileId,
    mailboxId: meta.mailbox_id || null,
    entityType: meta.entity_type || "attachment",
    direction: found.directory.includes(`${path.sep}archive${path.sep}`) ? "archive" : found.directory.includes(`${path.sep}inbound${path.sep}`) ? "inbound" : "outbound",
    status: "ok",
    freeBytes: disk.freeBytes,
    usedBytes: disk.usedBytes,
    metadata: {
      originalFilename: meta.original_filename || safeFilename,
      contentType,
      sizeBytes: buffer.length
    }
  }
  logStorageEvent(event)
  runtimeState.lastStorageDownload = {
    timestamp: nowIso(),
    ...event
  }

  return {
    status: 200,
    binary: {
      status: 200,
      body: buffer,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename.replace(/"/g, "_")}"`,
        "X-AngelCare-Storage-File-Id": fileId,
        "X-AngelCare-Storage-Bucket": clean(meta.storage_bucket || STORAGE_BUCKET),
        "X-AngelCare-Storage-Key": clean(meta.storage_key || ""),
        "X-AngelCare-Storage-Status": clean(meta.status || "active"),
        "X-AngelCare-Storage-Size-Bytes": String(buffer.length),
        "X-Content-Type-Options": "nosniff"
      }
    }
  }
}

async function handleStorageDelete(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) {
    return { status: auth.status, payload: { ok: false, error: auth.error, errorName: "Unauthorized", errorMessage: auth.error } }
  }

  const fileId = clean(body.fileId || body.file_id)
  const reason = clean(body.reason) || "requested_delete"
  if (!fileId) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "fileId is required",
        errorName: "StorageFileRequired",
        errorMessage: "fileId is required"
      }
    }
  }

  const found = findStorageRecordById(fileId)
  if (!found || !found.directory || !fs.existsSync(found.directory)) {
    return {
      status: 404,
      payload: {
        ok: false,
        error: "Storage file not found",
        errorName: "StorageFileNotFound",
        errorMessage: "Storage file not found"
      }
    }
  }

  const meta = found.meta && typeof found.meta === "object" ? found.meta : {}
  const currentDirection = found.directory.includes(`${path.sep}archive${path.sep}`) ? "archive" : found.directory.includes(`${path.sep}inbound${path.sep}`) ? "inbound" : found.directory.includes(`${path.sep}temp${path.sep}`) ? "temp" : "outbound"
  const targetFolder = buildStorageFolder("archive", meta.module_key || "email_os", meta.entity_type || "attachment", fileId)
  if (currentDirection === "archive" && found.directory === targetFolder) {
    const archivedMeta = {
      ...meta,
      status: "deleted",
      deleted_at: meta.deleted_at || nowIso(),
      updated_at: nowIso()
    }
    fs.writeFileSync(path.join(targetFolder, "_metadata.json"), `${JSON.stringify(archivedMeta, null, 2)}\n`, "utf8")
    return {
      status: 200,
      payload: {
        ok: true,
        data: {
          fileId,
          status: "deleted",
          deletedAt: archivedMeta.deleted_at,
          reason
        }
      }
    }
  }
  fs.mkdirSync(path.dirname(targetFolder), { recursive: true })
  if (fs.existsSync(targetFolder)) {
    fs.rmSync(targetFolder, { recursive: true, force: true })
  }
  fs.renameSync(found.directory, targetFolder)

  const safeFilename = sanitizeStorageFilename(meta.safe_filename || meta.original_filename || path.basename(found.filePath || "attachment"))
  const archivedMeta = {
    ...meta,
    status: "deleted",
    deleted_at: nowIso(),
    updated_at: nowIso(),
    storage_key: path.posix.join("email-os", "attachments", "archive", sanitizeStoragePart(meta.module_key || "email_os"), sanitizeStoragePart(meta.entity_type || "attachment"), fileId, safeFilename)
  }
  fs.writeFileSync(path.join(targetFolder, "_metadata.json"), `${JSON.stringify(archivedMeta, null, 2)}\n`, "utf8")

  const disk = storageDiskSnapshot()
  logStorageEvent({
    action: "STORAGE_DELETE",
    moduleKey: meta.module_key || "email_os",
    fileId,
    mailboxId: meta.mailbox_id || null,
    entityType: meta.entity_type || "attachment",
    direction: currentDirection,
    status: "ok",
    freeBytes: disk.freeBytes,
    usedBytes: disk.usedBytes,
    metadata: { reason }
  })
  runtimeState.lastStorageError = null

  return {
    status: 200,
    payload: {
      ok: true,
      data: {
        fileId,
        status: "deleted",
        deletedAt: archivedMeta.deleted_at,
        reason
      }
    }
  }
}


function readDedupMappings() {
  const value = readJsonFile(STORAGE_DEDUP_MAPPING_FILE, { version: 1, updatedAt: null, plans: {}, files: {} })
  return value && typeof value === "object" ? value : { version: 1, updatedAt: null, plans: {}, files: {} }
}

function writeDedupMappings(value) {
  fs.mkdirSync(path.dirname(STORAGE_DEDUP_MAPPING_FILE), { recursive: true })
  const temp = `${STORAGE_DEDUP_MAPPING_FILE}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8")
  fs.renameSync(temp, STORAGE_DEDUP_MAPPING_FILE)
}

function normalizeDedupRelativePath(source, value) {
  let relative = clean(value).replace(/\\/g, "/")
  if (source && source.id === "email_attachments") {
    relative = relative.replace(/^\/?email-os\/attachments\/?/i, "")
  }
  return relative || "."
}

function resolveDedupCopy(copy) {
  const source = storageExplorerSourceById(copy && copy.sourceId)
  if (!source) return { ok: false, error: `Unknown approved storage source: ${clean(copy && copy.sourceId)}` }
  const relativePath = normalizeDedupRelativePath(source, copy && copy.relativePath)
  const resolved = resolveExplorerPath(source, relativePath)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  if (!fs.existsSync(resolved.candidate)) return { ok: false, error: `File not found: ${relativePath}` }
  const stat = fs.statSync(resolved.candidate)
  if (!stat.isFile()) return { ok: false, error: `Only regular files can be deduplicated: ${relativePath}` }
  const actualHash = sha256File(resolved.candidate)
  const expectedHash = clean(copy && (copy.sha256 || copy.sha256Hash)).toLowerCase()
  if (expectedHash && actualHash.toLowerCase() !== expectedHash) return { ok: false, error: `SHA-256 mismatch: ${relativePath}` }
  return {
    ok: true,
    source,
    relativePath: resolved.relative,
    fullPath: resolved.candidate,
    fileId: clean(copy && copy.fileId) || null,
    filename: clean(copy && copy.filename) || path.basename(resolved.candidate),
    sizeBytes: stat.size,
    sha256: actualHash,
    canonical: Boolean(copy && copy.canonical),
    volume: path.parse(resolved.candidate).root.toLowerCase(),
    links: Number(stat.nlink || 1),
  }
}

function buildDedupPreflight(body) {
  const copies = Array.isArray(body && body.copies) ? body.copies.slice(0, STORAGE_DEDUP_MAX_COPIES) : []
  const expectedSha256 = clean(body && body.sha256).toLowerCase()
  const blockedReasons = []
  if (copies.length < 2) blockedReasons.push("At least two physical copies are required")
  if (Array.isArray(body && body.copies) && body.copies.length > STORAGE_DEDUP_MAX_COPIES) blockedReasons.push(`Plan exceeds ${STORAGE_DEDUP_MAX_COPIES} copies`)
  const resolved = copies.map((copy) => resolveDedupCopy(copy))
  for (const item of resolved) if (!item.ok) blockedReasons.push(item.error)
  const valid = resolved.filter((item) => item.ok)
  const hashes = new Set(valid.map((item) => item.sha256.toLowerCase()))
  if (hashes.size > 1) blockedReasons.push("Copies do not have identical SHA-256 content")
  if (expectedSha256 && hashes.size === 1 && !hashes.has(expectedSha256)) blockedReasons.push("Group SHA-256 does not match the files")
  const volumes = new Set(valid.map((item) => item.volume))
  if (volumes.size > 1) blockedReasons.push("NTFS hard-link consolidation requires all copies to be on the same volume")
  const canonical = valid.find((item) => item.canonical) || valid[0] || null
  if (!canonical) blockedReasons.push("Canonical copy could not be resolved")
  const totalPhysicalBytes = valid.reduce((sum, item) => sum + item.sizeBytes, 0)
  const potentialRecoverableBytes = canonical ? Math.max(0, totalPhysicalBytes - canonical.sizeBytes) : 0
  return {
    phase: 5,
    eligible: blockedReasons.length === 0,
    blockedReasons,
    canonical,
    copies: valid,
    sha256: canonical ? canonical.sha256 : expectedSha256,
    physicalCopies: valid.length,
    totalPhysicalBytes,
    potentialRecoverableBytes,
    hardLinkSupported: process.platform === "win32",
    sameVolume: volumes.size <= 1,
    analyzedAt: nowIso(),
  }
}

async function handleStorageDedupPreflight(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const data = buildDedupPreflight(body || {})
  return { status: data.eligible ? 200 : 409, payload: { ok: data.eligible, data, error: data.eligible ? undefined : data.blockedReasons.join("; ") } }
}

async function handleStorageDedupExecute(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const planId = clean(body && body.planId)
  const planNumber = clean(body && body.planNumber)
  if (!planId || !planNumber) return { status: 400, payload: { ok: false, error: "planId and planNumber are required" } }
  const preflight = buildDedupPreflight(body || {})
  if (!preflight.eligible || !preflight.canonical) return { status: 409, payload: { ok: false, error: preflight.blockedReasons.join("; "), data: preflight } }
  if (process.platform !== "win32") return { status: 409, payload: { ok: false, error: "Physical hard-link consolidation is enabled only on Windows NTFS" } }
  const canonicalPath = preflight.canonical.fullPath
  const canonicalHash = preflight.canonical.sha256
  const before = storageDiskSnapshot()
  const completed = []
  const warnings = []
  for (const item of preflight.copies) {
    if (item.fullPath === canonicalPath) {
      completed.push({ fileId: item.fileId, relativePath: item.relativePath, canonical: true, hardlinked: false, sha256: item.sha256 })
      continue
    }
    const backupPath = `${item.fullPath}.dedup-backup-${planId}`
    try {
      if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true })
      fs.renameSync(item.fullPath, backupPath)
      fs.linkSync(canonicalPath, item.fullPath)
      const linkedHash = sha256File(item.fullPath)
      if (linkedHash !== canonicalHash) throw new Error("Post-link SHA-256 verification failed")
      fs.rmSync(backupPath, { force: true })
      completed.push({ fileId: item.fileId, relativePath: item.relativePath, canonical: false, hardlinked: true, sha256: linkedHash })
    } catch (error) {
      try {
        if (fs.existsSync(item.fullPath)) fs.rmSync(item.fullPath, { force: true })
        if (fs.existsSync(backupPath)) fs.renameSync(backupPath, item.fullPath)
      } catch {}
      warnings.push(`${item.relativePath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  const after = storageDiskSnapshot()
  const mapping = readDedupMappings()
  mapping.updatedAt = nowIso()
  mapping.plans = mapping.plans || {}
  mapping.files = mapping.files || {}
  mapping.plans[planId] = { planId, planNumber, sha256: canonicalHash, canonicalPath, completed, warnings, createdAt: nowIso() }
  for (const item of completed) if (item.fileId) mapping.files[item.fileId] = { planId, planNumber, sha256: canonicalHash, canonicalFileId: preflight.canonical.fileId, canonicalPath, relativePath: item.relativePath, hardlinked: item.hardlinked, updatedAt: nowIso() }
  writeDedupMappings(mapping)
  const actualRecoveredBytes = Math.max(0, Number(after.freeBytes || 0) - Number(before.freeBytes || 0))
  const status = warnings.length ? "completed_with_warnings" : "completed"
  logStorageEvent({ action: "STORAGE_DEDUP_EXECUTED", moduleKey: "opsos", fileId: preflight.canonical.fileId, mailboxId: null, entityType: "dedup_plan", direction: "archive", status, freeBytes: after.freeBytes, usedBytes: after.usedBytes, metadata: { phase: 5, planId, planNumber, physicalCopies: preflight.physicalCopies, potentialRecoverableBytes: preflight.potentialRecoverableBytes, actualRecoveredBytes, warnings } })
  return { status: 200, payload: { ok: true, data: { phase: 5, planId, planNumber, status, sha256: canonicalHash, hardlinked: completed.some((item) => item.hardlinked), completedCopies: completed.length, warningCount: warnings.length, warnings, potentialRecoverableBytes: preflight.potentialRecoverableBytes, actualRecoveredBytes, planToken: quarantineToken({ kind: "dedup", planId, planNumber, sha256: canonicalHash, issuedAt: Date.now() }), completedAt: nowIso() } } }
}

async function handleStorageDedupMaterialize(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const resolved = resolveDedupCopy(body || {})
  if (!resolved.ok) return { status: 400, payload: { ok: false, error: resolved.error } }
  const stat = fs.statSync(resolved.fullPath)
  if (Number(stat.nlink || 1) <= 1) return { status: 200, payload: { ok: true, data: { materialized: false, reason: "File already has an independent physical allocation", links: Number(stat.nlink || 1) } } }
  const temp = `${resolved.fullPath}.materialize-${Date.now()}`
  fs.copyFileSync(resolved.fullPath, temp)
  const hash = sha256File(temp)
  if (hash !== resolved.sha256) { fs.rmSync(temp, { force: true }); return { status: 500, payload: { ok: false, error: "Materialized copy hash mismatch" } } }
  fs.rmSync(resolved.fullPath, { force: true })
  fs.renameSync(temp, resolved.fullPath)
  return { status: 200, payload: { ok: true, data: { materialized: true, sha256: hash, links: Number(fs.statSync(resolved.fullPath).nlink || 1), completedAt: nowIso() } } }
}

async function handleStorageProviderCapabilities(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const input = normalizePop3Body(body || {})
  if (!input.mailboxId || !input.email || !input.username || !input.password || !input.host) return { status: 400, payload: { ok: false, error: "Complete POP3 mailbox credentials are required" } }
  const client = new Pop3Client({ host: input.host, port: input.port, secure: input.secure, timeoutMs: POP_TIMEOUT_MS })
  try {
    await client.connect()
    await client.login(input.username, input.password)
    let capabilityLines = []
    try { capabilityLines = await client.multiline("CAPA") } catch {}
    const refs = await client.listMessages()
    const capabilities = capabilityLines.map((line) => clean(line)).filter(Boolean)
    const upper = capabilities.map((line) => line.toUpperCase())
    const data = {
      phase: 5,
      mailboxId: input.mailboxId,
      email: input.email,
      protocol: "pop3",
      host: input.host,
      port: input.port,
      secure: input.secure,
      authenticated: true,
      uidlSupported: refs.some((item) => clean(item.uid) && String(item.uid) !== String(item.number)),
      listSupported: true,
      capaSupported: capabilities.length > 0,
      deleteCommandAdvertised: upper.some((line) => line.startsWith("DELE")),
      remoteDeletionEnabled: STORAGE_PROVIDER_REMOTE_DELETE_ENABLED,
      messageCount: refs.length,
      totalBytes: refs.reduce((sum, item) => sum + Number(item.size || 0), 0),
      capabilities,
      checkedAt: nowIso(),
      warning: STORAGE_PROVIDER_REMOTE_DELETE_ENABLED ? "Remote POP3 deletion is enabled by environment policy and remains separately governed." : "Remote provider deletion is disabled. Phase 5 performs synchronization and reconciliation only.",
    }
    return { status: 200, payload: { ok: true, data } }
  } catch (error) {
    const mapped = mapPop3Error(error, { mailboxId: input.mailboxId, email: input.email, incoming: { protocol: "pop3", host: input.host, port: input.port, secure: input.secure }, limit: input.limit })
    return { status: mapped.status || 502, payload: { ok: false, error: mapped.message, code: mapped.code } }
  } finally { await client.quit() }
}

async function handleStorageProviderReconcile(request, body) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const input = normalizePop3Body(body || {})
  if (!input.mailboxId || !input.email || !input.username || !input.password || !input.host) return { status: 400, payload: { ok: false, error: "Complete POP3 mailbox credentials are required" } }
  const client = new Pop3Client({ host: input.host, port: input.port, secure: input.secure, timeoutMs: POP_TIMEOUT_MS })
  try {
    await client.connect()
    await client.login(input.username, input.password)
    const refs = await client.listMessages()
    return { status: 200, payload: { ok: true, data: { phase: 5, mailboxId: input.mailboxId, email: input.email, uids: refs.map((item) => clean(item.uid)).filter(Boolean), messageCount: refs.length, totalBytes: refs.reduce((sum, item) => sum + Number(item.size || 0), 0), checkedAt: nowIso(), remoteDeletionEnabled: STORAGE_PROVIDER_REMOTE_DELETE_ENABLED } } }
  } catch (error) {
    const mapped = mapPop3Error(error, { mailboxId: input.mailboxId, email: input.email, incoming: { protocol: "pop3", host: input.host, port: input.port, secure: input.secure }, limit: input.limit })
    return { status: mapped.status || 502, payload: { ok: false, error: mapped.message, code: mapped.code } }
  } finally { await client.quit() }
}

async function handleStorageLifecycleSnapshot(request) {
  const auth = requireAdminToken(request)
  if (!auth.ok) return { status: auth.status, payload: { ok: false, error: auth.error } }
  const inventory = await buildStorageInventory("summary")
  const mappings = readDedupMappings()
  const disk = storageDiskSnapshot()
  return { status: 200, payload: { ok: true, data: { phase: 5, disk, inventory, dedupPlanCount: Object.keys(mappings.plans || {}).length, dedupFileCount: Object.keys(mappings.files || {}).length, capturedAt: nowIso() } } }
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

  if (pathname === "/admin/storage/health" && request.method === "GET") {
    const result = await handleStorageHealth(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/usage" && request.method === "GET") {
    const result = await handleStorageUsage(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/inventory" && request.method === "GET") {
    const result = await handleStorageInventory(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/browse" && request.method === "GET") {
    const result = await handleStorageBrowse(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/file" && request.method === "GET") {
    const result = await handleStorageFileDossier(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/preview" && request.method === "GET") {
    const result = await handleStoragePreview(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/duplicates" && request.method === "GET") {
    const result = await handleStorageDuplicatesInvestigation(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/orphans" && request.method === "GET") {
    const result = await handleStorageOrphansInvestigation(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/quarantine/impact" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageQuarantineImpact(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/quarantine/execute" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageQuarantineExecute(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/quarantine/status" && request.method === "GET") {
    const result = await handleStorageQuarantineStatus(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/quarantine/restore" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageQuarantineRestore(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/quarantine/verify" && request.method === "GET") {
    const result = await handleStorageQuarantineVerify(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/destruction/preflight" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDestructionPreflight(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/destruction/execute" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDestructionExecute(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/destruction/status" && request.method === "GET") {
    const result = await handleStorageDestructionStatus(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/destruction/verify" && request.method === "GET") {
    const result = await handleStorageDestructionStatus(request, url)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/destruction/cancel" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDestructionCancel(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/cleanup/dry-run" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageCleanupDryRun(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/cleanup/execute" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageCleanupExecute(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/lifecycle/snapshot" && request.method === "GET") {
    const result = await handleStorageLifecycleSnapshot(request)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/dedup/preflight" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDedupPreflight(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/dedup/execute" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDedupExecute(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/dedup/materialize" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDedupMaterialize(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/provider/capabilities" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageProviderCapabilities(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/provider/reconcile" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageProviderReconcile(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/upload" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageUpload(request, body)
    return writeJson(response, result.status, result.payload)
  }

  if ((pathname === "/admin/storage/download" || pathname.startsWith("/admin/storage/download/")) && (request.method === "GET" || request.method === "POST")) {
    const body = request.method === "POST" ? await readJsonBody(request) : {}
    const result = await handleStorageDownload(request, url, body)
    if (result.binary) {
      return writeBinary(response, result.binary.status, result.binary.body, result.binary.headers)
    }
    return writeJson(response, result.status, result.payload)
  }

  if (pathname === "/admin/storage/delete" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleStorageDelete(request, body)
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

  if (pathname === "/admin/inbound/sync" && request.method === "POST") {
    const body = await readJsonBody(request)
    const result = await handleAdminInboundSync(request, body)
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
