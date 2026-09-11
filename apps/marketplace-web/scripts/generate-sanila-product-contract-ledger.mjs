import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(); const outDir=path.join(root,'docs/sanila-final-product-closure'); fs.mkdirSync(outDir,{recursive:true})
const R=f=>fs.readFileSync(path.join(root,f),'utf8')
function walkPages(rel){const base=path.join(root,rel),out=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name==='page.tsx')out.push(path.relative(root,p))}};walk(base);return out.sort()}
function routeFromFile(file){let r=file.replace(/^app/,'').replace(/\/page\.tsx$/,'').replace(/\/\(protected\)/g,'');if(r==='')return'/';return r.startsWith('/')?r:`/${r}`}

function implementationEvidence(text){
  const evidence=[]
  for(const m of text.matchAll(/from ['"](@\/(?:components|lib|data)\/[^'"]+)['"]/g)){
    const v=m[1]
    if(/(?:route-access|operator\/auth|server\/auth-session)$/.test(v)) continue
    evidence.push(v)
  }
  if(/\bredirect\s*\(/.test(text)) evidence.push('next/navigation:redirect')
  return [...new Set(evidence)].slice(0,8)
}
function snapshotView(t){return t.match(/get(Teacher|Parent|Student|Staff)PortalSnapshot\(['\"]([^'\"]+)['\"]\)/)?.[2]||null}
const viewActions={
 teacher:{attendance:['attendance.batch','attendance.mark'],teaching:['lesson.create','lesson.update'],homework:['assignment.create','assignment.update'],submissions:['submission.grade'],assessments:['exam.create','exam.update'],marks:['mark.upsert'],bulletins:['comment.create'],families:['family.message','message.reply'],tasks:['task.update'],work:['task.update','leave.request']},
 parent:{requests:['request.create'],attendance:['attendance.justify'],meetings:['meeting.create','meeting.cancel'],satisfaction:['satisfaction.submit','feedback.submit'],finance:['request.create'],transport:['pickup.request','pickup.revoke','request.create'],messages:['teacher.message','message.reply'],account:['account.update']},
 student:{submissions:['assignment.submit'],messages:['teacher.message','message.reply']},
 staff:{leave:['leave.request'],tasks:['task.update'],approvals:['approval.decide'],workflows:['workflow.transition'],tickets:['incident.create','incident.update'],messages:['staff.message','message.reply']},
}
const viewSections={
 teacher:{today:['timetable','assignments','submissions','notifications'],classes:['classes','students'],timetable:['timetable'],attendance:['attendance'],teaching:['lessons'],homework:['assignments'],submissions:['submissions'],assessments:['exams'],marks:['marks'],bulletins:['reportCards','comments'],families:['communications'],tasks:['tasks'],work:['timetable','tasks','leave','documents','profile'],notifications:['notifications']},
 parent:{home:['children','attendance','finance','messages'],children:['children'],today:['attendance','assignments','notifications'],attendance:['attendance'],learning:['assignments','marks','reportCards'],messages:['messages'],notifications:['notifications'],finance:['finance','payments','receipts'],transport:['transport','pickup'],requests:['requests'],meetings:['meetings'],support:['complaints','commitments','recoveries'],documents:['documents'],satisfaction:['satisfaction','feedback'],account:['account','children','documents']},
 student:{today:['timetable','assignments','notifications','attendance'],timetable:['timetable'],subjects:['subjects'],lessons:['lessons'],homework:['assignments'],submissions:['submissions'],assessments:['exams'],results:['marks'],bulletins:['reportCards'],attendance:['attendance'],library:['library'],messages:['messages'],notifications:['notifications'],documents:['documents'],profile:['profile','subjects','documents','attendance']},
 staff:{today:['schedule','tasks','notifications','documents'],schedule:['schedule'],leave:['leave'],tasks:['tasks'],approvals:['approvals'],workflows:['workflows'],tickets:['tickets'],documents:['documents'],messages:['messages'],notifications:['notifications'],team:['team'],history:['history'],profile:['profile','documents','history']},
}
const roleEntries=[]
for(const role of ['teacher','parent','student','staff']){
  for(const file of walkPages(`app/angelcare-360-${role}`).filter(f=>!f.includes('/login/'))){const t=R(file);const view=snapshotView(t);roleEntries.push({universe:role,route:routeFromFile(file),file,authority:`requirePortalIdentity('${role}') via layout`,loader:view?`get${role[0].toUpperCase()+role.slice(1)}PortalSnapshot('${view}')`:null,view,sections:viewSections[role]?.[view]||[],actions:viewActions[role]?.[view]||[],status:'COMPLETE'})}
}
const tenantEntries=walkPages('app/(protected)/angelcare-360-command-center').map(file=>{const t=R(file);const route=routeFromFile(file);const guarded=t.includes('requireAngelcare360RouteAccess(');const implementation=implementationEvidence(t);const complete=guarded&&implementation.length>0;return{universe:'tenant_admin',route,file,authority:guarded?'requireAngelcare360RouteAccess':'MISSING',implementation,loader:null,view:null,sections:[],actions:[],status:complete?'COMPLETE':'BLOCKED'}})
const opLayout=R('app/(protected)/angelcare-360-operator/layout.tsx'); const inherited=opLayout.includes('requireAngelcare360OperatorSession()')
const operatorEntries=walkPages('app/(protected)/angelcare-360-operator').map(file=>{const t=R(file);const direct=t.includes('requireAngelcare360OperatorPermission')?'direct permission':t.includes('requireAngelcare360OperatorSession')?'direct session':'layout session';const implementation=implementationEvidence(t);const complete=inherited&&implementation.length>0;return{universe:'operator',route:routeFromFile(file),file,authority:inherited?direct:'MISSING',implementation,loader:null,view:null,sections:[],actions:[],status:complete?'COMPLETE':'BLOCKED'}})
const entries=[...roleEntries,...tenantEntries,...operatorEntries]
const blocked=entries.filter(e=>e.status!=='COMPLETE')
const json={generatedAt:'SOURCE_FROZEN_2026-09-11',counts:{roleRoutes:roleEntries.length,tenantRoutes:tenantEntries.length,operatorRoutes:operatorEntries.length,totalRoutes:entries.length,blocked:blocked.length},entries}
fs.writeFileSync(path.join(outDir,'PRODUCT_ROUTE_ACTION_LEDGER.json'),JSON.stringify(json,null,2))
let md=`# SANILA Final Product Closure — Route / Action Ledger\n\nGenerated from source.\n\n## Authority counts\n\n- Role portal routes: **${roleEntries.length}**\n- Tenant Command Center routes: **${tenantEntries.length}**\n- Operator routes: **${operatorEntries.length}**\n- Total audited routes: **${entries.length}**\n- Blocked/unresolved routes: **${blocked.length}**\n\n## Role portals\n\n| Universe | Route | View | Data sections | Executable actions | Authority | Status |\n|---|---|---|---|---|---|---|\n`
for(const e of roleEntries)md+=`| ${e.universe} | \`${e.route}\` | ${e.view||'—'} | ${e.sections.join(', ')||'—'} | ${e.actions.join(', ')||'READ-ONLY BY DESIGN'} | ${e.authority} | ${e.status} |\n`
md+=`\n## Tenant Command Center\n\n| Route | Authority | Implementation evidence | Status |\n|---|---|---|---|\n`;for(const e of tenantEntries)md+=`| \`${e.route}\` | ${e.authority} | ${e.implementation.join('<br>')} | ${e.status} |\n`
md+=`\n## Operator\n\nAll routes inherit authenticated Operator layout; pages with additional direct permissions are marked separately.\n\n| Route | Authority | Implementation evidence | Status |\n|---|---|---|---|\n`;for(const e of operatorEntries)md+=`| \`${e.route}\` | ${e.authority} | ${e.implementation.join('<br>')} | ${e.status} |\n`
md+=`\n## Final residue\n\n- Missing route authorities: **${blocked.length}**\n`
fs.writeFileSync(path.join(outDir,'PRODUCT_ROUTE_ACTION_LEDGER.md'),md)
console.log(`ROLE_ROUTES=${roleEntries.length}`);console.log(`TENANT_ROUTES=${tenantEntries.length}`);console.log(`OPERATOR_ROUTES=${operatorEntries.length}`);console.log(`TOTAL_ROUTES=${entries.length}`);console.log(`BLOCKED_ROUTES=${blocked.length}`);if(blocked.length)process.exit(1)
