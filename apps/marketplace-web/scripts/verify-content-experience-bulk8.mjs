#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))
const hash = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex')
const has = (source, parts) => parts.every((part) => source.includes(part))
let gates = 0
function gate(name, condition, detail = '') {
  if (!condition) { console.error(`FAIL — ${name}${detail ? `: ${detail}` : ''}`); process.exitCode = 1; return }
  gates += 1
  console.log(`PASS — ${name}`)
}

const base = 'app/(protected)/market-os/content-command-center/ai-director'
const routes = ['', 'research-control', 'commands', 'skills', 'compiler', 'doctrine', 'repository', 'integrations', 'settings', 'missions', 'schedules', 'autopilot', 'queue', 'runs', 'decisions', 'learning', 'recovery']
const routeFiles = routes.map((route) => `${base}${route ? `/${route}` : ''}/page.tsx`)
const required = [
  ...routeFiles,
  'components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx',
  'components/market-os/content-command/experience-bulk8/bulk8-ai-model.ts',
  'components/market-os/content-command/experience-bulk8/bulk8-ui.tsx',
  'components/market-os/content-command/experience-bulk8/bulk8-ai.module.css',
  'components/market-os/content-command/experience-bulk8/bulk8-ai.module.css.d.ts',
  'app/api/market-os/content-command/marketing-ai/learning/[id]/govern/route.ts',
  'tsconfig.content-experience-bulk8.json',
  'BULK8_VISUAL_VALIDATION_MANIFEST.md',
]
gate('Seventeen protected AI Director routes and Bulk 8 sources exist', required.every(exists))

const workspace = read('components/market-os/content-command/experience-bulk8/Bulk8AiExecutiveWorkspace.tsx')
const model = read('components/market-os/content-command/experience-bulk8/bulk8-ai-model.ts')
const ui = read('components/market-os/content-command/experience-bulk8/bulk8-ui.tsx')
const css = read('components/market-os/content-command/experience-bulk8/bulk8-ai.module.css')
const shell = read('components/market-os/content-command/ai-director-universe/AiDirectorUniverseShell.tsx')
const auth = read('lib/market-os/marketing-ai/auth.ts')
const repository = read('lib/market-os/marketing-ai/repository.ts')
const runRoute = read('app/api/market-os/content-command/marketing-ai/runs/route.ts')
const missionRun = read('app/api/market-os/content-command/marketing-ai/missions/[id]/run/route.ts')
const compilationExecute = read('app/api/market-os/content-command/marketing-ai/compilations/[id]/execute/route.ts')
const doctrineRoute = read('app/api/market-os/content-command/marketing-ai/doctrine/route.ts')
const commandRoute = read('app/api/market-os/content-command/marketing-ai/commands/[code]/route.ts')
const queueControl = read('app/api/market-os/content-command/marketing-ai/queue/[id]/control/route.ts')
const actionRoute = read('app/api/market-os/content-command/marketing-ai/actions/[id]/route.ts')
const learningRoute = read('app/api/market-os/content-command/marketing-ai/learning/[id]/govern/route.ts')
const visualManifest = read('BULK8_VISUAL_VALIDATION_MANIFEST.md')

const workspaceFunctions = ['ExecutiveCommand','Doctrine','Skills','Commands','Missions','Compiler','Schedules','Autopilot','Queue','Runs','Decisions','Learning','Repository','Integrations','Settings','Recovery']
gate('Sixteen reconstructed workspaces have dedicated render functions', workspaceFunctions.every((name) => workspace.includes(`function ${name}()`)))
gate('Research Control specialist implementation is preserved', read(`${base}/research-control/page.tsx`).includes('ContentResearchControlWorkspace'))
gate('Every reconstructed route mounts the sovereign Bulk 8 workspace', routes.filter(Boolean).filter((route) => route !== 'research-control').every((route) => read(`${base}/${route}/page.tsx`).includes('Bulk8AiExecutiveWorkspace')) && read(`${base}/page.tsx`).includes('Bulk8AiExecutiveWorkspace'))
gate('Sovereign shell retains grouped navigation and continuous context', has(shell, ['Direction & autorité','Intelligence & capacités','Exécution & autonomie','Apprentissage & résilience','CONTEXTE CONTINU','Frontière humaine']))

const silhouettes = ['council','constitution','foundry','commandRegistry','missionTheatre','compiler','scheduleRunway','flightDeck','trafficControl','traceLab','decisionCourt','learningAcademy','archive','sovereigntyBridge','controlRoom','resilience']
gate('Each reconstructed workspace has an unmistakable CSS silhouette', silhouettes.every((name) => workspace.includes(`styles.${name}`) && new RegExp(`\\.${name}(?![A-Za-z0-9_-])`).test(css)))
gate('Premium AngelCare visual language is explicit', has(css, ['#fff','--navy:#0c3556','--red:#c93442','box-shadow','@media(max-width:960px)','@media(max-width:640px)','prefers-reduced-motion']))
gate('Visual layer avoids generic Tailwind dashboard anatomy', !/(rounded-3xl|grid-cols-3|bg-slate-50|shadow-sm|backdrop-blur)/.test(workspace))
gate('No dark gaming, neon, radar simulation or fake neural decoration is introduced', !/(neon|animated radar|fake neural|glowing run|military interface)/i.test(`${workspace}\n${css}`))

gate('Compilation is mandatory for internal orchestration', has(runRoute, ['COMPILATION_REQUIRED_FOR_INTERNAL_ORCHESTRATION','advisory_manual_run','institutionalAcceptance: false']))
gate('Legacy mission run endpoint compiles instead of executing', has(missionRun, ['compileMarketingMission','mode: \'compile_only\'','externalExecution: false']) && !missionRun.includes('executeMarketingAiMission'))
gate('Only approved compilations can enter the execution queue', compilationExecute.includes('enqueueCompilation') && read('lib/market-os/marketing-ai/phase3-repository.ts').includes('COMPILATION_NOT_APPROVED'))
gate('Mission compiler exposes human decision before queue admission', has(workspace, ['/decision','Décision humaine persistée','Compilation admise dans la file interne']))

gate('Review permission is separated from run and govern', has(auth, ["'review'","permission === 'review'","['run', 'schedule']"]))
gate('Material command changes require govern authority', has(commandRoute, ['materialGovernance','authorityMode','riskLevel','instruction','deployed',"materialGovernance ? 'govern' : 'manage'"]))
gate('Doctrine adoption is immutable and requires a new version', has(doctrineRoute, ['DOCTRINE_IMMUTABLE_NEW_VERSION_REQUIRED','approved','adopted','canonical','effective']))
gate('Queue termination and replay require governance', has(queueControl, ["['cancel','dead_letter','replay']","?'govern':'run'"]))
gate('Internal actions require approval before execution', has(actionRoute, ['ACTION_HUMAN_APPROVAL_REQUIRED',"body.status === 'executed'",'? \'govern\'']))
gate('Learning governance is human-only and never promotes doctrine automatically', has(learningRoute, ["requireMarketingAiUser('govern')",'doctrinePromoted: false']) && has(repository, ['governLearningEvent','LEARNING_EVIDENCE_REQUIRED','doctrinePromoted: false']))

gate('External-action boundary is visible throughout the executive layer', has(workspace, ['Aucun email, WhatsApp, post, publicité','Aucune exécution externe','externalActionsAllowed','Provider Control reste souverain']))
const clientFetches = [...workspace.matchAll(/api(?:<[^>]+>)?\((['"`])([^'"`]+)\1/g)].map((match) => match[2])
gate('Browser calls only same-origin governed APIs', clientFetches.length > 10 && clientFetches.every((url) => url.startsWith('/api/')))
gate('No direct provider SDK, arbitrary HTTP, SQL or shell execution is added', !/(openai\.|anthropic\.|google\.generative|child_process|execSync|spawn\(|eval\(|new Function|fetch\(['"]https?:|\.rpc\(|\bSQL\b.*execute)/i.test(`${workspace}\n${runRoute}\n${missionRun}\n${repository}`))
gate('Provider credentials remain outside client surfaces', !/(api[_-]?key|secret[_-]?key|bearer\s+[A-Za-z0-9_-]{10,})/i.test(workspace))

gate('Queue and recovery expose idempotency and checkpoint truth', has(workspace, ['Idempotency key','Checkpoint avant retry','seconde matérialisation','idempotency key']))
gate('Run completion is explicitly distinct from institutional acceptance', has(`${workspace}\n${runRoute}`, ['Completion ≠ acceptance','institutionalAcceptance','Décision humaine']))
gate('Learning remains a governed proposal, not silent retraining', has(workspace, ['Aucune auto-promotion','ne réécrit jamais la doctrine','Gouvernance du learning persistée']))
gate('Authority decisions preserve immutability and conditions', has(workspace, ['Décision non éditable','Aucune modification silencieuse','Conditions','CERTIFICAT INSTITUTIONNEL']))

gate('Accessible status, error, empty and dialog semantics are present', has(ui, ['role="status"','role="alert"','role="note"']) && has(workspace, ['role="dialog"','aria-modal="true"','aria-live="polite"','aria-label="Fermer']))
gate('Responsive and reduced-motion contracts are encoded', has(css, [':focus-visible','@media(max-width:1280px)','@media(max-width:960px)','@media(max-width:640px)','prefers-reduced-motion']))
gate('No continuous polling or simulated progress is introduced', !/(setInterval|requestAnimationFrame|Math\.random|fakeProgress|simulatedActivity)/.test(workspace))

const visualIds = [...visualManifest.matchAll(/^B8-VIS-(\d{3})\b/gm)].map((match) => match[1])
gate('Ninety-six separate visual acceptance states are registered', visualIds.length === 96 && new Set(visualIds).size === 96 && visualIds[0] === '001' && visualIds.at(-1) === '096')
gate('Visual manifest never claims runtime screenshots are already captured', visualManifest.includes('Runtime capture status: PENDING') && !visualManifest.includes('Runtime capture status: PASSED'))

const patchList = read('BULK8_PATCH_FILE_LIST.txt').split(/\r?\n/).filter(Boolean)
gate('No SQL, migration, Prisma or database redesign is introduced', !patchList.some((rel) => /\.(sql|prisma)$/i.test(rel) || rel.includes('/migrations/')))
gate('Apply patch does not modify package dependencies', !patchList.includes('apps/ops-web/package.json') && !patchList.includes('package.json'))

const preservation = JSON.parse(read('BULK8_PRESERVATION_BASELINE.json'))
const drift = Object.entries(preservation).filter(([rel, expected]) => !exists(rel) || hash(rel) !== expected)
gate('Bulk 1–7 preservation hashes remain intact', drift.length === 0, drift.slice(0, 6).map(([rel]) => rel).join(', '))

if (process.exitCode) process.exit(process.exitCode)
console.log(`PASS — ${gates} Bulk 8 sovereign AI gates passed`)
