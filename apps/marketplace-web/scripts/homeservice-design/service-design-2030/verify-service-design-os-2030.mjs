import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
let passed = 0
let failed = 0
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const safeOutput = (result) => `${typeof result?.stdout === 'string' ? result.stdout : ''}${typeof result?.stderr === 'string' ? result.stderr : ''}`.trim()
const check = (name, value, detail = '') => {
  console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  value ? passed++ : failed++
}
const walk = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

const required = [
  'components/carelink/service-design/HomeServiceDesignShell.tsx',
  'components/carelink/service-design/studio2030/ServiceDesignStudio2030.tsx',
  'components/carelink/service-design/studio2030/ServiceDesignDock.tsx',
  'components/carelink/service-design/factory/CategoryGatewayWorkspace.tsx',
  'components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx',
  'components/carelink/service-design/factory/experience/PresetGallery.tsx',
  'components/carelink/service-design/factory/experience/DateTimeCommand.tsx',
  'components/carelink/service-design/planning/workspaces/PlanningCommandWorkspace.tsx',
  'components/carelink/service-design/commercial/workspaces/CommercialCommandWorkspace.tsx',
  'components/carelink/service-design/commercial/workspaces/B2CVitrineWorkspace.tsx',
  'components/carelink/service-design/commercial/workspaces/B2BVitrineWorkspace.tsx',
  'components/carelink/service-design/handoff/workspaces/HandoffCommandWorkspace.tsx',
  'components/carelink/service-design/workspaces/DoctrineStandardsWorkspace.tsx',
  'tsconfig.service-design-os-2030.json',
]
required.forEach((file) => check(`required ${file}`, exists(file)))

const shell = read('components/carelink/service-design/HomeServiceDesignShell.tsx')
const studio = read('components/carelink/service-design/studio2030/ServiceDesignStudio2030.tsx')
const dock = read('components/carelink/service-design/studio2030/ServiceDesignDock.tsx')
const gateway = read('components/carelink/service-design/factory/CategoryGatewayWorkspace.tsx')
const master = read('components/carelink/service-design/factory/CategoryMasterExperienceWorkspace.tsx')
const presets = read('components/carelink/service-design/factory/experience/PresetGallery.tsx')
const dates = read('components/carelink/service-design/factory/experience/DateTimeCommand.tsx')
const planning = read('components/carelink/service-design/planning/workspaces/PlanningCommandWorkspace.tsx')
const commercial = read('components/carelink/service-design/commercial/workspaces/CommercialCommandWorkspace.tsx')
const b2c = read('components/carelink/service-design/commercial/workspaces/B2CVitrineWorkspace.tsx')
const b2b = read('components/carelink/service-design/commercial/workspaces/B2BVitrineWorkspace.tsx')
const handoff = read('components/carelink/service-design/handoff/workspaces/HandoffCommandWorkspace.tsx')
const doctrine = read('components/carelink/service-design/workspaces/DoctrineStandardsWorkspace.tsx')

check('Service Design is branded as Service Intelligence Studio', shell.includes('Service Intelligence Studio'))
check('Studio Dock is route-aware and focus capable', shell.includes('ServiceDesignDock') && dock.includes('Focus Studio') && dock.includes('localStorage'))
check('Studio Dock accepts immutable contextual navigation', dock.includes('ReadonlyArray<{ readonly href: string; readonly label: string }>'))
check('Service pulse contains no synthetic event fixture', shell.includes('ServiceDesignPulseRail') && !dock.toLowerCase().includes('mock event') && !dock.toLowerCase().includes('fake event'))
check('root experience is category-first', gateway.includes('Service Portfolio Landscape') && gateway.includes('Créer une mission') && gateway.includes('Créer un programme') && gateway.includes('Composer un package'))
check('category gateway exposes ten experience concepts', ['family_care','newborn_calm','adapted_precision','learning_studio','event_control','hospitality_suite','route_safety','comfort_dignity','household_flow','enterprise_deployment'].every((value) => gateway.includes(value)))
check('preset gallery is a scenario-first experience', presets.includes('Expériences prêtes') && presets.includes('scénarios complets'))
check('dates and times remain explicit user controls', dates.includes('Dates') && dates.includes('startTime') && dates.includes('endTime'))
check('Mission Experience Canvas is live', master.includes('ExperienceCanvas') && master.includes('structuredSelections'))
check('AI Scenario Theatre is explicit and bounded', master.includes('Scenario Theatre') && master.includes('scenarioCount'))
check('planning command has real creation entrances', planning.includes('Mission unique') && planning.includes('Programme multi-missions') && planning.includes('Package commercial'))
check('all obsolete illustrative planning metrics are removed', !walk(path.join(root, 'components/carelink/service-design/planning')).some((file) => /\.(ts|tsx)$/.test(file) && read(path.relative(root, file)).includes('Valeur illustrative de structure')))
check('generic Action principale placeholders are removed', !walk(path.join(root, 'components/carelink/service-design')).some((file) => /\.(ts|tsx)$/.test(file) && read(path.relative(root, file)).includes('Action principale')))
check('Package & Economics Studio contains a service ladder', commercial.includes('Service Package Ladder') && ['Essential','Balanced','Premium','Signature'].every((value) => commercial.includes(value)))
check('B2C vitrine uses a family experience portfolio', b2c.includes('Family Experience Portfolio') && b2c.includes('Prévisualiser'))
check('B2B vitrine is deployment-specific', b2b.includes('Enterprise Deployment Portfolio') && b2b.includes('Économie de déploiement'))
check('CARELINK Mission Bridge is transparent', handoff.includes('Mission Translation Architecture') && handoff.includes('Service Design OS') && handoff.includes('CARELINK-OPS'))
check('Doctrine workspace provides targeted import', doctrine.includes('/factory/import') && doctrine.includes('Category Knowledge Coverage'))
check('no styled-jsx compatibility hazard', !walk(path.join(root, 'components/carelink/service-design')).some((file) => /\.(ts|tsx)$/.test(file) && read(path.relative(root, file)).includes('<style jsx')))
check('no SQL migration exists for this visual transformation', !walk(path.join(root, 'supabase/migrations')).some((file) => file.includes('service_design_os_2030')))

const sourceFiles = [
  ...walk(path.join(root, 'app/carelink-ops/service-design')),
  ...walk(path.join(root, 'components/carelink/service-design')),
].filter((file) => /\.(ts|tsx)$/.test(file))

let localLinks = 0
const missing = []
const importPattern = /(?:from\s*|import\s*)['"]([^'"]+)['"]/g
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(importPattern)) {
    const spec = match[1]
    if (!spec.startsWith('.')) continue
    localLinks++
    const base = path.resolve(path.dirname(file), spec)
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    if (!candidates.some((candidate) => fs.existsSync(candidate))) missing.push(`${path.relative(root, file)} -> ${spec}`)
  }
}
check('local Service Design imports resolve', missing.length === 0, missing.length ? missing.slice(0, 8).join('; ') : `${localLinks} links`)

const localTsc = path.join(root, 'node_modules/.bin/tsc')
if (fs.existsSync(localTsc)) {
  const result = spawnSync(localTsc, ['-p', 'tsconfig.service-design-os-2030.json', '--pretty', 'false'], { cwd: root, encoding: 'utf8', shell: false })
  const output = safeOutput(result)
  check('strict dependency-backed TypeScript passes', result.status === 0, result.status === 0 ? '0 errors' : output.slice(-1800))
} else {
  const compiler = process.env.TSC_BIN || 'tsc'
  const result = spawnSync(compiler, ['--noEmit', '--noCheck', '--jsx', 'preserve', '--module', 'esnext', '--target', 'es2022', '--moduleResolution', 'bundler', '--skipLibCheck', ...sourceFiles, '--pretty', 'false'], { cwd: root, encoding: 'utf8', shell: false })
  const output = safeOutput(result)
  check('TypeScript syntax gate passes', result.status === 0, result.status === 0 ? `${sourceFiles.length} sources; strict check will run with repository dependencies` : output.slice(-1800))
}

console.log(`\n${passed}/${passed + failed} Service Design OS 2030 checks passed.`)
if (failed) process.exit(1)
