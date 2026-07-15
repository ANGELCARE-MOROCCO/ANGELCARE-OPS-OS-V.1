import fs from 'node:fs'
import path from 'node:path'

export type ActionStatus = 'live' | 'partial' | 'static' | 'broken' | 'missing_api' | 'missing_route' | 'unknown'

export type AuditAction = {
  file: string
  route: string
  kind: string
  label: string
  target: string
  status: ActionStatus
  reason: string
}

export type AuditSummary = {
  generatedAt: string
  totals: Record<ActionStatus | 'actions' | 'files' | 'routes', number>
  actions: AuditAction[]
  recommendations: string[]
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const ROOT = process.cwd()

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

function rel(file: string) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/')
}

function appRouteFromFile(file: string) {
  const r = rel(file)
  if (!r.startsWith('app/')) return ''
  let route = r
    .replace(/^app\//, '/')
    .replace(/\/page\.(tsx|ts|jsx|js)$/, '')
    .replace(/\/route\.(tsx|ts|jsx|js)$/, '')
    .replace(/\([^/]+\)\//g, '')
    .replace(/\/index$/, '')
  route = route.replace(/\[([^/]+)\]/g, ':$1')
  return route === '' ? '/' : route
}

function routeMatches(pattern: string, target: string) {
  const p = pattern.split('/').filter(Boolean)
  const t = target.split('/').filter(Boolean)
  if (p.length !== t.length) return false
  return p.every((part, i) => part.startsWith(':') || part === t[i])
}

function hasRoute(target: string, pages: Set<string>, apiRoutes: Set<string>) {
  const cleanTarget = target.split('?')[0].split('#')[0]
  if (cleanTarget.startsWith('/api/')) {
    if (apiRoutes.has(cleanTarget)) return true
    return [...apiRoutes].some((r) => routeMatches(r, cleanTarget))
  }
  if (pages.has(cleanTarget)) return true
  return [...pages].some((r) => routeMatches(r, cleanTarget))
}

function cleanLabel(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Unlabeled action'
}

function classify(
  file: string,
  content: string,
  kind: string,
  target: string,
  pages: Set<string>,
  apiRoutes: Set<string>,
): { status: ActionStatus; reason: string } {
  const lower = content.toLowerCase()
  const cleanTarget = target.split('?')[0].split('#')[0]

  if (target === '#' || target.startsWith('#')) return { status: 'static', reason: 'Hash/modal-only target detected; verify modal writes data.' }
  if (target.includes('javascript:void')) return { status: 'static', reason: 'javascript:void placeholder target.' }
  if (cleanTarget.startsWith('/api/') && !hasRoute(cleanTarget, pages, apiRoutes)) return { status: 'missing_api', reason: `API route not found for ${target}.` }
  if (cleanTarget.startsWith('/') && !cleanTarget.startsWith('/api/') && !hasRoute(cleanTarget, pages, apiRoutes)) return { status: 'missing_route', reason: `Page route not found for ${target}.` }
  if (/alert\s*\(|toast\.(success|info)\(|console\.log\(/.test(content) && !/fetch\s*\(|action=|formAction|use server|supabase\.from/.test(content)) {
    return { status: 'static', reason: 'UI feedback found without clear mutation path.' }
  }
  if (lower.includes('todo') || lower.includes('placeholder') || lower.includes('demo')) return { status: 'partial', reason: 'Placeholder/demo/TODO marker present in same file.' }
  if (/fetch\s*\(|supabase\.from|use server|formAction|action=|POST|PATCH|DELETE/.test(content)) return { status: 'live', reason: 'Has route/API/server-action/database mutation indicators.' }
  if (kind === 'link' && cleanTarget.startsWith('/') && hasRoute(cleanTarget, pages, apiRoutes)) return { status: 'partial', reason: 'Navigation exists; action liveliness depends on destination.' }
  return { status: 'unknown', reason: 'Clickable element detected but no reliable action signal found.' }
}

function extractTargetFromButton(full: string) {
  const fetchTarget = full.match(/fetch\(\s*["'`]([^"'`]+)["'`]/)?.[1]
  if (fetchTarget) return fetchTarget

  const hrefTarget = full.match(/href=\{?["'`]([^"'`{}]+)["'`]\}?/)?.[1]
  if (hrefTarget) return hrefTarget

  const routerTarget = full.match(/router\.push\(\s*["'`]([^"'`]+)["'`]/)?.[1]
  if (routerTarget) return routerTarget

  return 'inline_button'
}

function extractActions(file: string, content: string, pages: Set<string>, apiRoutes: Set<string>): AuditAction[] {
  const actions: AuditAction[] = []
  const route = appRouteFromFile(file) || rel(file)
  const hrefRegex = /href=\{?["'`]([^"'`{}]+)["'`]\}?/g
  const fetchRegex = /fetch\(\s*["'`]([^"'`]+)["'`]/g
  const buttonRegex = /<button[\s\S]*?>([\s\S]*?)<\/button>/g
  const formRegex = /<form[\s\S]*?(action|formAction)=\{?([^\s>}]+)[\s\S]*?>/g

  let m: RegExpExecArray | null

  while ((m = hrefRegex.exec(content))) {
    const target = m[1]
    if (!target.startsWith('/hr') && !target.startsWith('/api/hr') && !target.startsWith('/api/attendance') && target !== '#') continue
    const c = classify(file, content, 'link', target, pages, apiRoutes)
    actions.push({ file: rel(file), route, kind: 'link', label: target, target, ...c })
  }

  while ((m = fetchRegex.exec(content))) {
    const target = m[1]
    if (!target.startsWith('/api/hr') && !target.startsWith('/api/attendance')) continue
    const c = classify(file, content, 'api_call', target, pages, apiRoutes)
    actions.push({ file: rel(file), route, kind: 'api_call', label: target, target, ...c })
  }

  while ((m = formRegex.exec(content))) {
    const target = m[2].replace(/[{}]/g, '')
    const c = /Action|action/.test(target)
      ? { status: 'live' as ActionStatus, reason: 'Form is wired to server action reference.' }
      : classify(file, content, 'form', target, pages, apiRoutes)
    actions.push({ file: rel(file), route, kind: 'form', label: target, target, ...c })
  }

  while ((m = buttonRegex.exec(content))) {
    const full = m[0]
    const label = cleanLabel(m[1])
    if (!/onClick|formAction|type=["']submit|<button/.test(full)) continue

    const target = extractTargetFromButton(full)
    const start = Math.max(0, content.indexOf(full) - 500)
    const end = content.indexOf(full) + full.length + 500
    const context = full + '\n' + content.slice(start, end)
    const c = classify(file, context, 'button', target, pages, apiRoutes)
    actions.push({ file: rel(file), route, kind: 'button', label, target, ...c })
  }

  return actions
}

export function runHrActionabilityAudit(): AuditSummary {
  const appFiles = walk(path.join(ROOT, 'app'))
  const hrFiles = [
    ...walk(path.join(ROOT, 'app', '(protected)', 'hr')),
    ...walk(path.join(ROOT, 'components')).filter((f) => rel(f).toLowerCase().includes('hr') || rel(f).toLowerCase().includes('attendance') || rel(f).toLowerCase().includes('employee')),
    ...walk(path.join(ROOT, 'lib')).filter((f) => rel(f).toLowerCase().includes('hr') || rel(f).toLowerCase().includes('attendance')),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const pages = new Set<string>()
  const apiRoutes = new Set<string>()
  for (const f of appFiles) {
    if (/\/page\.(tsx|ts|jsx|js)$/.test(f)) pages.add(appRouteFromFile(f))
    if (/\/route\.(tsx|ts|jsx|js)$/.test(f)) apiRoutes.add(appRouteFromFile(f))
  }

  const actions = hrFiles.flatMap((file) => {
    try {
      return extractActions(file, fs.readFileSync(file, 'utf8'), pages, apiRoutes)
    } catch {
      return []
    }
  })

  const totals: AuditSummary['totals'] = {
    actions: actions.length,
    files: hrFiles.length,
    routes: [...pages].filter((r) => r.startsWith('/hr')).length,
    live: 0,
    partial: 0,
    static: 0,
    broken: 0,
    missing_api: 0,
    missing_route: 0,
    unknown: 0,
  }

  for (const action of actions) totals[action.status]++

  const recommendations = [
    'Convert static/modal-only HR actions into server actions or API mutations with audit logs.',
    'Create missing API routes before exposing buttons in production UI.',
    'Replace placeholder/demo/TODO flows with real repository calls from lib/hr-production.',
    'Every write action should refresh affected pages, log to hr_activity_timeline, and appear in /hr/sync-center when incomplete.',
    'Prioritize critical HR pages: staff, recruitment, onboarding, attendance, contracts, documents, payroll, compliance.',
  ]

  return { generatedAt: new Date().toISOString(), totals, actions, recommendations }
}
