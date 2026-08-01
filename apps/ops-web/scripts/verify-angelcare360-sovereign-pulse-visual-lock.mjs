#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const app = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const dashboardRel = 'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.tsx'
const cssRel = 'components/angelcare360/operator/sovereign-pulse/SovereignPulseDashboard.module.css'
const cssTypesRel = 'types/angelcare360/operator/sovereign-pulse-css.d.ts'
const tsconfigRel = 'tsconfig.angelcare360-sovereign-pulse.json'

const dashboardPath = path.join(app, dashboardRel)
const cssPath = path.join(app, cssRel)
const cssTypesPath = path.join(app, cssTypesRel)
const tsconfigPath = path.join(app, tsconfigRel)

const failures = []
let checks = 0

function pass(label) {
  checks += 1
  console.log(`PASS  ${label}`)
}

function fail(label) {
  failures.push(label)
  console.error(`FAIL  ${label}`)
}

function requireFile(filePath, label) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) pass(label)
  else fail(label)
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

requireFile(dashboardPath, `file: ${dashboardRel}`)
requireFile(cssPath, `file: ${cssRel}`)
requireFile(cssTypesPath, `file: ${cssTypesRel}`)
requireFile(tsconfigPath, `file: ${tsconfigRel}`)

if (failures.length) process.exit(1)

const dashboard = fs.readFileSync(dashboardPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')
const cssHash = sha256(Buffer.from(css))
const expectedCssHash = '48cedc97ee16e1f6a3f9b290d8c7afe4acd9b17412e27408464d8de9c634c612'

if (cssHash === expectedCssHash) pass('visual lock: CSS bytes unchanged')
else fail(`visual lock: CSS hash changed (${cssHash})`)

const styleRefs = [...dashboard.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
const counts = new Map()
for (const name of styleRefs) counts.set(name, (counts.get(name) || 0) + 1)
const classFingerprintSource = [...counts.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, count]) => `${name}:${count}`)
  .join('\n')
const classFingerprint = sha256(Buffer.from(classFingerprintSource))
const expectedClassFingerprint = '12846c0c08f6f373e94dcff8d998d8bc1a9ee2bf0e1d1d5b2a8d3c9a55f8f921'

if (styleRefs.length === 156) pass('visual lock: CSS class-reference count unchanged')
else fail(`visual lock: expected 156 CSS references, found ${styleRefs.length}`)

if (counts.size === 144) pass('visual lock: CSS class-reference set unchanged')
else fail(`visual lock: expected 144 CSS classes, found ${counts.size}`)

if (classFingerprint === expectedClassFingerprint) pass('visual lock: CSS class-reference multiset unchanged')
else fail(`visual lock: class fingerprint changed (${classFingerprint})`)

const cssClasses = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
for (const className of counts.keys()) {
  if (cssClasses.has(className)) pass(`CSS module resolves: ${className}`)
  else fail(`CSS module missing: ${className}`)
}

const requiredMarkers = [
  "const LiveClockBlock = memo(function LiveClockBlock",
  "const PulseRefreshButton = memo(function PulseRefreshButton",
  "const CLOCK_FORMATTER = new Intl.DateTimeFormat",
  "const DATE_FORMATTER = new Intl.DateTimeFormat",
  "const controllerRef = useRef<AbortController | null>(null)",
  "const inFlightRef = useRef(false)",
  "stableSnapshotFingerprint",
  "signal: controller.signal",
  "if (inFlightRef.current || document.hidden) return",
  "document.addEventListener('visibilitychange', onVisibility)",
  "if (document.hidden) return\n      setScene",
  "const footerMissions = useMemo",
  "<LiveClockBlock generatedAt={snapshot.generatedAt} />",
  "<PulseRefreshButton mode={mode}",
]

for (const marker of requiredMarkers) {
  if (dashboard.includes(marker)) pass(`runtime optimization marker: ${marker.slice(0, 58)}`)
  else fail(`runtime optimization marker missing: ${marker}`)
}

const forbiddenMarkers = [
  "const [now, setNow] = useState(new Date())\n  const [refreshing, setRefreshing]",
  "[...snapshot.missions, ...snapshot.missions].map",
  "const refresh = useCallback(async () => {\n    if (refreshing) return",
]

for (const marker of forbiddenMarkers) {
  if (!dashboard.includes(marker)) pass(`legacy churn marker absent: ${marker.slice(0, 58)}`)
  else fail(`legacy churn marker remains: ${marker}`)
}

const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
const includes = Array.isArray(tsconfig.include) ? tsconfig.include : []
if (includes.includes(cssTypesRel)) pass('targeted TypeScript includes CSS module declaration')
else fail(`targeted TypeScript missing ${cssTypesRel}`)

try {
  const requireFromApp = createRequire(path.join(app, 'package.json'))
  const ts = requireFromApp('typescript')
  const result = ts.transpileModule(dashboard, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: dashboardPath,
    reportDiagnostics: true,
  })
  const diagnostics = result.diagnostics || []
  if (diagnostics.length === 0) pass('TypeScript/TSX syntax')
  else {
    for (const diagnostic of diagnostics) {
      fail(`TypeScript syntax: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
    }
  }
} catch (error) {
  fail(`project-local TypeScript resolution: ${error instanceof Error ? error.message : String(error)}`)
}

for (const marker of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(']) {
  if (!dashboard.includes(marker)) pass(`dead-control marker absent: ${marker}`)
  else fail(`dead-control marker present: ${marker}`)
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s). Sovereign Pulse Visual-Lock Performance Kernel rejected.`)
  process.exit(1)
}

console.log(`\n${checks} checks passed. Sovereign Pulse Visual-Lock Performance Kernel is statically accepted.`)
