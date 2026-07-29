import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const payloadRoot = path.join(packageRoot, 'payload')
const cwd = process.cwd()

function resolveRepoRoot() {
  if (fs.existsSync(path.join(cwd, 'apps', 'ops-web'))) return cwd
  if (fs.existsSync(path.join(cwd, 'app')) && path.basename(cwd) === 'ops-web') {
    return path.resolve(cwd, '..', '..')
  }
  throw new Error('Run this installer from the AngelCare repository root or apps/ops-web.')
}

const repoRoot = resolveRepoRoot()
const files = [
  'apps/ops-web/lib/ac-capital-os/server/live-intelligence.ts',
  'apps/ops-web/app/api/ac-capital-os/capital-radar/research/run/route.ts',
  'apps/ops-web/lib/ai-provider-control/types.ts',
  'apps/ops-web/lib/ai-provider-control/repository.ts',
  'apps/ops-web/app/api/ai-provider-control/action/route.ts',
  'apps/ops-web/components/ai-provider-control/AiProviderControlWorkspace.tsx',
  'apps/ops-web/components/ai-provider-control/AcCapitalAiControlWorkspace.tsx',
]

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupRoot = path.join(repoRoot, '.angelcare_backups', `ac-capital-single-model-ai-control-04-${stamp}`)

for (const relative of files) {
  const source = path.join(payloadRoot, relative)
  const target = path.join(repoRoot, relative)
  if (!fs.existsSync(source)) throw new Error(`Payload missing: ${relative}`)
  if (fs.existsSync(target)) {
    const backup = path.join(backupRoot, relative)
    fs.mkdirSync(path.dirname(backup), { recursive: true })
    fs.copyFileSync(target, backup)
  }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
}

console.log('AC_CAPITAL_OS_SINGLE_MODEL_AI_CONTROL_04_INSTALLED')
console.log(`Repository root: ${repoRoot}`)
console.log(`Files installed: ${files.length}`)
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`)
console.log('No TypeScript, build, SQL, Git, commit, push or deployment was executed.')
console.log('Next: restart apps/ops-web, open /ai-provider-control, select AC Capital AI, and apply the single-model profile once.')
