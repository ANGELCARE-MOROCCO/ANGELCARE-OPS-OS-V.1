import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(); const outDir=path.join(root,'docs/sanila-final-product-closure'); fs.mkdirSync(outDir,{recursive:true})
const actionsSource=fs.readFileSync(path.join(root,'lib/angelcare360/server/portal-actions.ts'),'utf8')
const uiSource=fs.readFileSync(path.join(root,'components/angelcare360/role-portals/PortalActionPanel.tsx'),'utf8')
const viewActions={
 teacher:{attendance:['attendance.batch','attendance.mark'],teaching:['lesson.create','lesson.update'],homework:['assignment.create','assignment.update'],submissions:['submission.grade'],assessments:['exam.create','exam.update'],marks:['mark.upsert'],bulletins:['comment.create'],families:['family.message','message.reply'],tasks:['task.update'],work:['task.update','leave.request']},
 parent:{requests:['request.create'],attendance:['attendance.justify'],meetings:['meeting.create','meeting.cancel'],satisfaction:['satisfaction.submit','feedback.submit'],finance:['request.create'],transport:['pickup.request','pickup.revoke','request.create'],messages:['teacher.message','message.reply'],account:['account.update']},
 student:{submissions:['assignment.submit'],messages:['teacher.message','message.reply']},
 staff:{leave:['leave.request'],tasks:['task.update'],approvals:['approval.decide'],workflows:['workflow.transition'],tickets:['incident.create','incident.update'],messages:['staff.message','message.reply']},
}
function actionWindow(action){const token=`action==='${action}'`;const starts=[];let i=0;while((i=actionsSource.indexOf(token,i))>=0){starts.push(i);i+=token.length}return starts.map(start=>{const rest=actionsSource.slice(start+token.length);const next=rest.search(/\n\s*if\((?:kind===|\(kind===|action===)/);return actionsSource.slice(start,next<0?actionsSource.length:start+token.length+next)})}
function evidence(action){const windows=actionWindow(action);const joined=windows.join('\n');const commandKeys=[...joined.matchAll(/commandKey:\s*`?['"]?([^'"`,}]+(?:\$\{[^}]+\}[^'"`,}]*)?)/g)].map(m=>m[1]);const resources=[...joined.matchAll(/resourceType:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);const tables=[...joined.matchAll(/\.from\(['"]([^'"]+)['"]\)/g)].map(m=>m[1]);const rpcs=[...joined.matchAll(/\.rpc\(['"]([^'"]+)['"]/g)].map(m=>m[1]);return{handlers:windows.length,commandKeys:[...new Set(commandKeys)],resources:[...new Set(resources)],canonicalStores:[...new Set([...tables,...rpcs])].slice(0,16)}}
const entries=[]
for(const [role,views] of Object.entries(viewActions))for(const [view,acts] of Object.entries(views))for(const action of acts){const ev=evidence(action);const uiDeclared=uiSource.includes(`'${action}'`)||uiSource.includes(`"${action}"`);entries.push({role,view,action,uiDeclared,backendHandlers:ev.handlers,commandKeys:ev.commandKeys,resources:ev.resources,canonicalStores:ev.canonicalStores,status:uiDeclared&&ev.handlers>0?'COMPLETE':'BLOCKED'})}
const visibleActions=[...new Set(entries.map(e=>`${e.role}:${e.action}`))]
const backendActions=[...actionsSource.matchAll(/action==='([^']+)'/g)].map(m=>m[1])
const blocked=entries.filter(e=>e.status!=='COMPLETE')
const orphanBackend=[...new Set(backendActions)].filter(a=>!entries.some(e=>e.action===a)&&a!=='task.complete')
const json={generatedAt:'SOURCE_FROZEN_2026-09-11',counts:{routeActionAssociations:entries.length,uniqueVisibleRoleActions:visibleActions.length,blocked:blocked.length,orphanBackendActions:orphanBackend.length},entries,orphanBackendActions:orphanBackend}
fs.writeFileSync(path.join(outDir,'PRODUCT_ACTION_LEDGER.json'),JSON.stringify(json,null,2))
let md=`# SANILA Final Product Closure — Action Ledger\n\nGenerated from actual UI and server action sources.\n\n- Route/action associations: **${entries.length}**\n- Unique role/action pairs: **${visibleActions.length}**\n- Blocked UI→backend actions: **${blocked.length}**\n- Unmapped backend actions (excluding explicit compatibility handler): **${orphanBackend.length}**\n\n| Role | View | UI action | Backend handlers | Command keys | Canonical resources/stores | Status |\n|---|---|---|---:|---|---|---|\n`
for(const e of entries)md+=`| ${e.role} | ${e.view} | \`${e.action}\` | ${e.backendHandlers} | ${e.commandKeys.join('<br>')||'direct canonical handler'} | ${[...e.resources,...e.canonicalStores].join('<br>')||'—'} | ${e.status} |\n`
if(orphanBackend.length)md+=`\n## Unmapped backend actions\n\n${orphanBackend.map(a=>`- \`${a}\``).join('\n')}\n`
fs.writeFileSync(path.join(outDir,'PRODUCT_ACTION_LEDGER.md'),md)
console.log(`ACTION_ASSOCIATIONS=${entries.length}`);console.log(`UNIQUE_VISIBLE_ROLE_ACTIONS=${visibleActions.length}`);console.log(`BLOCKED_ACTIONS=${blocked.length}`);console.log(`ORPHAN_BACKEND_ACTIONS=${orphanBackend.length}`);if(blocked.length||orphanBackend.length)process.exit(1)
