#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const read=(rel)=>fs.readFileSync(path.join(root,rel),'utf8')
const exists=(rel)=>fs.existsSync(path.join(root,rel))
const hash=(rel)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex')
const has=(source,parts)=>parts.every(part=>source.includes(part))
let gates=0
function gate(name,condition,detail=''){if(!condition){console.error(`FAIL — ${name}${detail?`: ${detail}`:''}`);process.exitCode=1;return}gates++;console.log(`PASS — ${name}`)}
const required=[
'app/(protected)/market-os/content-command-center/record-governance/page.tsx',
'app/api/market-os/content-command-headquarters/record-governance/route.ts',
'lib/market-os/content-command-headquarters/record-lifecycle-service.ts',
'components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx',
'components/market-os/content-command/experience-bulk9/LifecycleControlDock.tsx',
'components/market-os/content-command/experience-bulk9/bulk9-governance-model.ts',
'components/market-os/content-command/experience-bulk9/bulk9-governance-ui.tsx',
'components/market-os/content-command/experience-bulk9/bulk9-governance.module.css',
'components/market-os/content-command/experience-bulk9/bulk9-governance.module.css.d.ts',
'tsconfig.content-experience-bulk9.json','BULK9_VISUAL_VALIDATION_MANIFEST.md']
gate('Bulk 9 authority route, API, service and premium UI exist',required.every(exists))
const service=read('lib/market-os/content-command-headquarters/record-lifecycle-service.ts')
const api=read('app/api/market-os/content-command-headquarters/record-governance/route.ts')
const auth=read('lib/market-os/content-command-headquarters/auth.ts')
const shell=read('components/market-os/content-command/ContentCommand360Shell.tsx')
const nav=read('components/market-os/content-command/content-command-navigation.tsx')
const workspace=read('components/market-os/content-command/experience-bulk9/RecordGovernanceAuthority.tsx')
const dock=read('components/market-os/content-command/experience-bulk9/LifecycleControlDock.tsx')
const model=read('components/market-os/content-command/experience-bulk9/bulk9-governance-model.ts')
const css=read('components/market-os/content-command/experience-bulk9/bulk9-governance.module.css')
const visual=read('BULK9_VISUAL_VALIDATION_MANIFEST.md')
const entityTypes=['signal','strategy','action_plan','dossier','mission','task','checkpoint','evidence','human_review','ai_review','source_object','generated_sample','publication_package','asset','approval','performance_event','learning_record','ai_director','ai_command','ai_skill','ai_schedule','ai_mission','ai_compilation','ai_execution_job','ai_decision','ai_doctrine','ai_learning']
gate('Entity registry covers Bulks 1–8 operational families',entityTypes.every(type=>service.includes(`${type}: { type:'${type}'`)))
gate('Lifecycle controls cover edit, cancellation, suspension, archive, recycle, restore, reopen, supersession and purge',has(service,["'edit' | 'cancel' | 'suspend' | 'archive' | 'soft_delete' | 'restore' | 'reopen'","'supersede' | 'permanent_delete'"]))
gate('Soft deletion remains distinct from permanent deletion',has(service,["consider('soft_delete'","input.action==='archive'||input.action==='soft_delete'","record.permanent_delete.requested"]))
gate('Permanent deletion requires typed identity confirmation',has(service,['TYPED_CONFIRMATION_MISMATCH','inspection.code||inspection.label','confirmation']))
gate('Every lifecycle mutation requires a meaningful reason',service.includes("clean(input.reason).length<8") && workspace.includes('Motif obligatoire'))
gate('Dependency inspection precedes destructive authority',has(service,['inspectRecordLifecycle','inspectDependency','activeDependencies','totalDependencies']) && workspace.includes('DEPENDENCY & CONSEQUENCE MAP'))
gate('Records with dependencies cannot be permanently purged',service.includes("activeDependencies === 0 && totalDependencies === 0") && service.includes('Des dépendances doivent être résolues'))
gate('Institutional evidence and decisions are immutable by doctrine',has(service,['alwaysImmutable:true','human_review','ai_decision','approval','source_object']))
gate('Validated, published and effective states are protected',has(service,["immutableStatuses:['validated','scheduled','published','closed']","immutableStatuses:['published','verified','withdrawn','superseded']","immutableStatuses:['effective','adopted']"]))
gate('Immutable records expose supersession/revocation rather than silent editing',service.includes("consider('supersede'") && workspace.includes('Frontière d’immutabilité'))
gate('Server-side audit survives permanent record deletion',has(service,['auditContentHeadquarters','record.permanent_delete.requested','record.${input.action}']))
gate('Generic edit patches are strict allow-lists',has(service,['editableFields','filteredPatch','allowed.has(key)']))
gate('Actor identity is resolved from authenticated session',has(api,['requireContentHeadquartersUser(permission)','actor.id','actor.name']) && !workspace.includes('actorId'))
gate('Purge authority is privileged and not merely hidden client-side',has(auth,["'purge'","permission === 'purge' && privilegedRoles.has(role)"]) && api.includes("action==='permanent_delete'?'purge'"))
gate('Distinct permissions exist for edit, cancel, archive, restore, delete, purge, reopen and supersede',has(auth,["'edit' | 'cancel' | 'archive' | 'restore' | 'delete' | 'purge' | 'reopen' | 'supersede'"]))
gate('Lifecycle API is no-store and separates inspection from mutation',has(api,["dynamic='force-dynamic'",'export async function GET','export async function POST']))
gate('Missing optional legacy tables fail honestly without fabricating records',has(service,['isMissing(error)','return []','market_content_','market_ai_']))
gate('Global lifecycle dock is mounted across the entire Content Command shell',shell.includes('LifecycleControlDock pathname={pathname}') && dock.includes('BULKS 1–8'))
gate('Dock resolves route and query context for dossier, mission, task, proof, package and AI records',has(dock,['dossierId','missionId','taskId','evidenceId','packageId','compilationId','jobId']))
gate('Record Governance is a permanent protected workspace in navigation',has(nav,['key: "record-governance"','Record Governance & Recovery','admin:configure']))
gate('Premium workspace uses a consequence chamber rather than a generic trash table',has(workspace,['authorityCrown','consequenceChamber','dependencyMap','lifecycleDock','blockedRegister']) && !/(data-table|generic dashboard|three KPI)/i.test(workspace))
gate('Delete confirmations explain consequences, not only “Are you sure?”',has(workspace,['Action irréversible','Cette opération efface définitivement','relation(s)']) && !workspace.includes('Are you sure'))
gate('Mobile retains lifecycle actions and typed confirmation',has(css,['@media(max-width:720px)','globalDock a{width:100%}','actionDialog']))
gate('Accessibility includes dialog semantics, labels and polite result announcement',has(workspace,['role="dialog"','aria-modal="true"','aria-labelledby','aria-live']) && dock.includes('aria-label'))
gate('Visual doctrine remains white, icy-blue, navy and selective AngelCare red',has(css,['#fff','#eef7ff','#102b4e','#c52432','box-shadow']))
gate('Visual layer avoids dark gaming, neon, glass and generic card factories',!/(neon|gaming|animated radar|glassmorphism|grid-cols-3|rounded-3xl)/i.test(`${workspace}\n${css}`))
gate('No SQL, migration, Prisma or database redesign is introduced',!read('BULK9_PATCH_FILE_LIST.txt').split(/\r?\n/).some(rel=>/\.(sql|prisma)$/i.test(rel)||rel.includes('/migrations/')))
gate('No package dependency or provider configuration is modified',!read('BULK9_PATCH_FILE_LIST.txt').split(/\r?\n/).some(rel=>rel==='package.json'||rel.endsWith('/package.json')||rel.includes('ai-provider-control')))
const ids=[...visual.matchAll(/^B9-VIS-(\d{3})\b/gm)].map(match=>match[1])
gate('Forty-eight separate visual acceptance states are registered',ids.length===48&&new Set(ids).size===48&&ids[0]==='001'&&ids.at(-1)==='048')
gate('Visual register does not falsely claim runtime captures are complete',visual.includes('Runtime capture status: PENDING')&&!visual.includes('Runtime capture status: PASSED'))
const preservation=JSON.parse(read('BULK9_PRESERVATION_BASELINE.json'))
const drift=Object.entries(preservation).filter(([rel,expected])=>!exists(rel)||hash(rel)!==expected)
gate('Bulk 1–8 and Provider Control preservation hashes remain intact',drift.length===0,drift.slice(0,6).map(([rel])=>rel).join(', '))
if(process.exitCode)process.exit(process.exitCode)
console.log(`PASS — ${gates} Bulk 9 record-governance gates passed`)
