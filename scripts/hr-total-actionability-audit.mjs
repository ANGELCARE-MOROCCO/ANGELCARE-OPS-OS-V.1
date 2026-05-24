#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const hrRoot = path.join(root, 'app', '(protected)', 'hr')
const apiRoot = path.join(root, 'app', 'api')
const reportsDir = path.join(root, 'reports')
fs.mkdirSync(reportsDir, { recursive: true })

const pageFiles = []
const componentFiles = []
const apiFiles = []
function walk(dir, out, filter = () => true) {
  if (!fs.existsSync(dir)) return
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out, filter)
    else if (filter(p)) out.push(p)
  }
}
walk(hrRoot, pageFiles, p => /\.(tsx|ts)$/.test(p))
walk(path.join(root, 'components'), componentFiles, p => /\.(tsx|ts)$/.test(p) && /hr|attendance|employee/i.test(p))
walk(apiRoot, apiFiles, p => /route\.(ts|js)$/.test(p))

function routeFromPage(file) {
  let rel = path.relative(hrRoot, file).replace(/\\/g, '/')
  if (!rel.endsWith('/page.tsx')) return null
  rel = rel.replace(/\/page\.tsx$/, '')
  if (!rel) return '/hr'
  return '/hr/' + rel.replace(/\([^/]+\)/g, '').replace(/\[([^\]]+)\]/g, ':$1')
}
const routes = new Set(pageFiles.map(routeFromPage).filter(Boolean))
function normalizeHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null
  const base = href.split('?')[0].split('#')[0]
  return base.replace(/\/$/, '') || '/'
}
function routeExists(href) {
  const clean = normalizeHref(href)
  if (!clean) return true
  if (!clean.startsWith('/hr')) return true
  if (routes.has(clean)) return true
  for (const r of routes) {
    const pattern = '^' + r.replace(/:[^/]+/g, '[^/]+') + '$'
    if (new RegExp(pattern).test(clean)) return true
  }
  return false
}
function apiExists(url) {
  const clean = normalizeHref(url)
  if (!clean || !clean.startsWith('/api')) return true
  const expected = path.join(root, 'app', clean, 'route.ts')
  return fs.existsSync(expected) || apiFiles.some(f => f.replace(/\\/g,'/').includes(clean.replace(/^\//,'') + '/route.'))
}
function classify(file, kind, label, target, content) {
  if (kind === 'link' && target?.startsWith('/hr') && !routeExists(target)) return ['missing_route', `Page route not found for ${target}.`]
  if (kind === 'api_call' && target?.startsWith('/api') && !apiExists(target)) return ['missing_api', `API route not found for ${target}.`]
  if (/action=\{|formAction=\{|fetch\(|router\.push|href=|<Link|revalidatePath|redirect\(/.test(label + content.slice(Math.max(0, content.indexOf(label)-500), content.indexOf(label)+800))) return ['live', 'Action has an execution/navigation signal.']
  if (/TODO|placeholder|demo|mock|static/i.test(content) && /(button|form|href|fetch)/i.test(label)) return ['partial', 'Placeholder/demo marker present near actionable UI.']
  if (kind === 'button') return ['unknown', 'Clickable element detected but no reliable action signal found.']
  return ['partial', 'Navigation/action exists; destination or mutation should be verified manually.']
}
const findings=[]
const allFiles=[...pageFiles,...componentFiles]
for (const file of allFiles) {
  const content=fs.readFileSync(file,'utf8')
  const rel=path.relative(root,file).replace(/\\/g,'/')
  const patterns=[
    ['link', /href=["']([^"']+)["']/g],
    ['api_call', /fetch\(["']([^"']+)["']/g],
    ['form', /<form[^>]*(?:action=\{([^}]+)\}|action=["']([^"']+)["'])/g],
    ['button', /<button[^>]*>([\s\S]*?)<\/button>/g],
  ]
  for (const [kind,re] of patterns) {
    let m
    while ((m=re.exec(content))) {
      const raw=(m[1]||m[2]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,160)
      const target=kind==='link'||kind==='api_call'?raw:null
      const [status,reason]=classify(rel,kind,raw,target,content)
      findings.push({status,kind,label:raw || 'Unlabeled action',target,file:rel,reason})
    }
  }
}
const totals={actions:findings.length,files:allFiles.length,routes:routes.size,live:0,partial:0,static:0,broken:0,missing_api:0,missing_route:0,unknown:0}
for (const f of findings) totals[f.status]=(totals[f.status]||0)+1
const priority=findings.filter(f=>f.status!=='live').slice(0,160)
const report={ok:true,generated:new Date().toISOString(),totals,priorityFindings:priority,findings}
fs.writeFileSync(path.join(reportsDir,'hr-actionability-audit.json'),JSON.stringify(report,null,2))
const md=['# HR Total Actionability Audit','',`Generated: ${report.generated}`,'','## Totals','',...Object.entries(totals).map(([k,v])=>`- ${k}: ${v}`),'','## Priority findings','',...priority.map(f=>`- **${f.status}** ${f.kind} \`${f.label||f.target||'action'}\` in \`${f.file}\` → ${f.reason}`),''].join('\n')
fs.writeFileSync(path.join(reportsDir,'hr-actionability-audit.md'),md)
console.log(JSON.stringify({ok:true,report:'reports/hr-actionability-audit.json',markdown:'reports/hr-actionability-audit.md',totals},null,2))
