import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
let pass = 0
let fail = 0
const failures = []
function ok(condition, label) {
  if (condition) { pass += 1; console.log(`PASS  ${label}`) }
  else { fail += 1; failures.push(label); console.log(`FAIL  ${label}`) }
}
function p(rel){ return path.join(root, rel) }
function exists(rel){ return fs.existsSync(p(rel)) }
function read(rel){ return fs.readFileSync(p(rel),'utf8') }
function has(rel, needle){ return exists(rel) && read(rel).includes(needle) }
function notHas(rel, needle){ return exists(rel) && !read(rel).includes(needle) }
function allFiles(dir, exts = null){
  const base=p(dir); if(!fs.existsSync(base)) return []
  const out=[]; const walk=d=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name); if(e.isDirectory())walk(f); else if(!exts || exts.includes(path.extname(e.name)))out.push(f)}}; walk(base); return out
}
function allText(files){ return files.map(f=>fs.readFileSync(f,'utf8')).join('\n') }

const routes = [
 'app/(protected)/angelcare-360-command-center/messagerie/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/layout.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/_utils.ts',
 'app/(protected)/angelcare-360-command-center/messagerie/loading.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/error.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/not-found.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/conversations/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/conversations/[id]/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/annonces/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/campagnes/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/campagnes/[id]/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/audiences/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/audiences/[id]/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/modeles/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/modeles/[id]/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/surveillance/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/livraison/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/preferences/page.tsx',
 'app/(protected)/angelcare-360-command-center/messagerie/audit/page.tsx',
]
const components = [
 'components/angelcare360/communication-command/CommunicationCommand.module.css',
 'components/angelcare360/communication-command/CommunicationActionForm.tsx',
 'components/angelcare360/communication-command/CommunicationSectionFrame.tsx',
 'components/angelcare360/communication-command/SanilaCommunicationCommand.tsx',
 'components/angelcare360/communication-command/ConversationsCommand.tsx',
 'components/angelcare360/communication-command/ConversationChamber.tsx',
 'components/angelcare360/communication-command/ThreadReplyStudio.tsx',
 'components/angelcare360/communication-command/CampaignsCommand.tsx',
 'components/angelcare360/communication-command/CampaignChamber.tsx',
 'components/angelcare360/communication-command/TemplateAtelier.tsx',
 'components/angelcare360/communication-command/TemplateChamber.tsx',
 'components/angelcare360/communication-command/TemplateRenderStudio.tsx',
 'components/angelcare360/communication-command/AudienceStudio.tsx',
 'components/angelcare360/communication-command/AudienceChamber.tsx',
 'components/angelcare360/communication-command/AudienceMemberStudio.tsx',
 'components/angelcare360/communication-command/Watchtower.tsx',
 'components/angelcare360/communication-command/DeliveryCommand.tsx',
 'components/angelcare360/communication-command/PreferencesCommand.tsx',
 'components/angelcare360/communication-command/CommunicationAudit.tsx',
]
const authority = [
 'lib/angelcare360/server/communication-command.ts',
 'types/angelcare360/communication-command.ts',
 'app/api/angelcare360/communication-command/route.ts',
 'tsconfig.sanila-communication-command.json',
]
for (const rel of [...routes,...components,...authority]) ok(exists(rel), `required file exists: ${rel}`)

const routeText = allText(routes.filter(exists).map(p))
const componentText = allText(components.filter(exists).map(p))
const newCode = routeText + '\n' + componentText + '\n' + (exists(authority[0])?read(authority[0]):'') + '\n' + (exists(authority[2])?read(authority[2]):'')

// Root identity and spatial grammar.
ok(has(routes[0], 'SanilaCommunicationCommand'), 'root uses Communication Command experience')
ok(has(components[3], 'Communication Pulse'), 'Communication Pulse instrument present')
ok(has(components[3], 'Live Conversation Field'), 'Live Conversation Field present')
ok(has(components[3], 'Broadcast Command'), 'Broadcast Command present')
ok(has(components[3], 'Watchtower'), 'Watchtower present at root')
ok(has(components[3], 'Channel Readiness'), 'channel readiness is first-class')
ok(has(components[3], 'Archive historique'), 'legacy archive clearly labeled')
ok(has(components[3], 'sans confondre'), 'delivery truth doctrine visible')
ok(has(components[1], 'payload'), 'action form serializes controlled payload')
ok(has(components[1], 'fixed}),[fixed,fields,values]'), 'fixed fields override user input')

// Complete navigation universe.
for (const slug of ['conversations','annonces','campagnes','audiences','modeles','surveillance','livraison','preferences','audit']) ok(componentText.includes(`/messagerie/${slug}`), `navigation/deep link includes ${slug}`)
ok(componentText.includes('/messagerie/conversations/${t.id}') || componentText.includes('/messagerie/conversations/${thread.id}'), 'conversation deep route linked')
ok(componentText.includes('/messagerie/campagnes/${c.id}'), 'campaign deep route linked')
ok(componentText.includes('/messagerie/modeles/${t.id}'), 'template deep route linked')
ok(componentText.includes('/messagerie/audiences/${s.id}'), 'audience deep route linked')

// Conversation Chamber maturity.
ok(has(components[5], 'Relationship Context'), 'relationship context rail present')
ok(has(components[5], 'Conversation Canvas'), 'conversation narrative canvas present')
ok(has(components[5], 'Communication Command'), 'conversation command rail present')
ok(has(components[5], 'guardian_name'), 'guardian context rendered')
ok(has(components[5], 'student_name'), 'student context rendered')
ok(has(components[5], 'assigned_staff_name'), 'responsibility rendered')
ok(has(components[5], "thread_type==='complaint'"), 'complaint deep link to Trust Resolution present')
ok(has(components[5], "thread_type==='finance_followup'"), 'finance authority deep link present')
ok(has(components[5], "thread_type==='absence_followup'"), 'attendance authority deep link present')
ok(has(components[5], "thread_type==='admissions_followup'"), 'admissions authority deep link present')
ok(has(components[4], "value:'complaint'"), 'complaint thread type available when opening thread')
ok(has(components[6], "channel:'internal'"), 'thread reply is forced to internal channel')
ok(has(components[6], 'Les canaux externes ne sont pas simulés'), 'reply studio states external channels are not simulated')
ok(has(components[6], 'source:\'documents\''), 'attachments remain linked to Documents authority')

// Campaign and dispatch truth.
ok(has(components[7], 'External Channel Gate'), 'external channel gate present')
ok(has(components[7], 'brouillon externe'), 'external campaigns are framed as drafts')
ok(has(components[8], "campaign.channel==='internal'"), 'UI dispatch gate requires internal channel')
ok(has(components[8], "providerKey:'internal_stub'"), 'internal stub provider is explicit')
ok(has(components[8], 'pas « livrés »'), 'dispatched is not represented as delivered')
ok(has(components[8], 'Recipient Truth'), 'recipient truth table present')
ok(has(components[8], 'Delivery Jobs'), 'delivery jobs present')
ok(has(components[8], 'Delivery Events'), 'delivery event chronology present')
ok(has(authority[0], "campaign.channel !== 'internal'"), 'server blocks external campaign dispatch')
ok(has(authority[0], "providerKey: 'internal_stub'"), 'server pins internal stub dispatch')
ok(has(authority[0], 'allowedTransitions'), 'campaign lifecycle transition matrix present')
ok(has(authority[2], "action === 'campaign.dispatchInternal'"), 'dispatch is only exposed as internal action')

// Template maturity.
ok(has(components[9], 'Institutional Template Atelier'), 'Template Atelier present')
ok(has(components[10], 'Institutional Template Chamber'), 'Template Chamber present')
ok(has(components[10], 'Version Chronicle'), 'template version chronology present')
ok(has(components[11], 'Render & Variable Safety Lab'), 'template render safety lab present')
ok(has(components[11], "action: 'template.render'"), 'template preview uses authoritative render action')
ok(has(authority[0], 'renderAc360MessageTemplate'), 'template render delegates to current authority')
ok(has(authority[0], 'listSanilaTemplateVersions'), 'template versions are read from authority')

// Audience maturity.
ok(has(components[12], 'Audience Intelligence & Selection'), 'Audience Studio present')
ok(has(components[13], 'Audience Inspection Chamber'), 'Audience Chamber present')
ok(has(components[13], 'Population explicite'), 'full audience population exposed')
ok(has(components[13], 'pas synonyme de livrabilité'), 'contact presence not confused with deliverability')
ok(has(components[14], 'Membership Studio'), 'audience membership studio present')
ok(has(authority[0], "ac360_school_audience_segments"), 'current audience segments authority used')
ok(has(authority[0], "ac360_school_audience_segment_members"), 'current audience members authority used')
ok(has(authority[0], 'enqueueSanilaCampaignFromSegment'), 'segment-to-campaign path is server resolved')

// Alerts / delivery / preferences / audit.
ok(has(components[15], 'Communication Watchtower'), 'Communication Watchtower present')
ok(has(components[15], 'Résoudre l’alerte'), 'alert resolution studio present')
ok(has(components[16], 'Delivery Truth'), 'Delivery Truth workspace present')
ok(has(components[17], 'Consent & Preference Governance'), 'preference governance present')
ok(has(components[17], 'Heures calmes & gouvernance'), 'quiet-hours governance present')
ok(has(components[18], 'Communication Forensics'), 'forensic audit experience present')
ok(has(authority[0], 'angelcare360_audit_logs'), 'audit authority queried')
ok(has(authority[0], 'recordAngelcare360AuditEventServer'), 'new direct mutations audited')
ok(has(authority[0], 'updateSanilaPreferenceGovernance'), 'quiet-hours write authority present')

// Current advanced authority is primary.
for (const table of [
 'ac360_school_communication_threads','ac360_school_thread_messages','ac360_school_message_campaigns','ac360_school_message_recipients','ac360_school_delivery_jobs','ac360_school_delivery_events','ac360_school_message_templates','ac360_school_message_template_versions','ac360_school_audience_segments','ac360_school_audience_segment_members','ac360_school_notification_preferences','ac360_school_communication_alerts'
]) ok(has(authority[0], table), `advanced authority referenced: ${table}`)
for (const fn of [
 'getAc360SchoolCommunicationDashboard','createAc360MessageCampaign','dispatchAc360CampaignBatch','enqueueAc360CampaignRecipients','openAc360CommunicationThread','postAc360ThreadMessage','renderAc360MessageTemplate','resolveAc360CommunicationAlert','updateAc360NotificationPreference','upsertAc360MessageTemplate'
]) ok(has(authority[0], fn), `existing AC360 function delegated: ${fn}`)

// Legacy is compatibility/read-only only.
ok(has(authority[0], 'legacyArchiveCounts'), 'legacy communication retained as archive counts')
for (const table of ['angelcare360_conversations','angelcare360_messages','angelcare360_announcements','angelcare360_message_templates']) {
  const regex = new RegExp(`from\\(['\"]${table}['\"]\\)[\\s\\S]{0,180}?\\.(insert|update|upsert|delete)\\(`)
  ok(!regex.test(read(authority[0])), `no legacy write: ${table}`)
}

// Permission / tenant gates.
ok(has(authority[0], "commandContext('messagerie.view')"), 'view permission gate present')
ok(has(authority[0], "commandContext('messagerie.update')"), 'update permission gate present')
ok(has(authority[0], 'requireAngelcare360Permission'), 'AngelCare 360 permission authority preserved')
ok(has(authority[0], 'resolveAc360SchoolOpsContext'), 'advanced org authority resolved')
ok(has(routes[1], 'requireSanilaCommunicationContext'), 'layout requires communication context')
ok(has(routes[2], "permission='messagerie.view'"), 'route utility defaults to view permission')

// Unified API boundary; no fragile dependency on historical wrapper routes.
ok(!componentText.includes('/api/ac360/school-communication/'), 'new UI does not depend on historical route wrapper paths')
for (const action of ['thread.open','thread.reply','thread.update','audience.upsert','audience.member.upsert','template.upsert','template.render','campaign.create','campaign.update','campaign.enqueue','campaign.enqueueSegment','campaign.dispatchInternal','preference.update','preference.governance','alert.resolve']) ok(has(authority[2], `action === '${action}'`), `unified API action exists: ${action}`)
ok(has(authority[2], "Cache-Control', 'no-store'"), 'mutation API is no-store')

// No old beta UI / Zone F bleed.
ok(!routeText.includes('ZoneFRelationshipCommand'), 'no Zone F UI in Messagerie')
ok(!routeText.includes('loadAngelcare360ZoneFRelationshipSnapshot'), 'no Zone F loader in Messagerie')
ok(!newCode.includes('Angelcare360CommunicationMutationForm'), 'no old generic communication mutation form')
ok(!newCode.includes("@/components/angelcare360/communication/"), 'no first-generation communication component import')

// No fake intelligence or fake provider truth.
for (const term of ['sentimentScore','churnProbability','predictedMood','fakeDelivery','mockDelivery','fakeSentiment']) ok(!newCode.includes(term), `no fake intelligence marker: ${term}`)
ok(!newCode.includes("status:'delivered'"), 'UI/server does not fabricate delivered status')
ok(!newCode.includes("status: 'delivered'"), 'UI/server does not fabricate delivered status spaced')
ok(newCode.includes('locked_external'), 'external locked state represented')
ok(newCode.includes('internal_stub'), 'stub nature explicitly represented')

// No polling / unsafe UI tricks.
ok(!newCode.includes('setInterval('), 'no short polling loop')
ok(!newCode.includes('setTimeout('), 'no timer-driven refresh loop')
ok(!newCode.includes('dangerouslySetInnerHTML'), 'no unsafe HTML rendering')
ok(!newCode.includes('window.location.reload'), 'no forced whole-page reload')

// Accessibility / states / responsiveness.
const css=read(components[0])
ok(css.includes(':focus-visible'), 'focus-visible treatment present')
ok(css.includes('prefers-reduced-motion'), 'reduced-motion fallback present')
ok(css.includes('@media(max-width:1180px)'), 'tablet/laptop adaptive breakpoint present')
ok(css.includes('@media(max-width:760px)'), 'mobile adaptive breakpoint present')
ok(css.includes('.tableWrap{overflow:auto}'), 'dense tables remain scroll-safe')
ok(has(routes[3], 'aria-busy="true"'), 'loading state exposes aria-busy')
ok(has(routes[4], 'role="alert"'), 'error state exposes alert semantics')
ok(has(routes[5], 'Objet de communication introuvable'), 'purpose-built not-found state present')

// Typography and spatial richness.
ok(css.includes('--copper'), 'institutional copper authority accent present')
ok(css.includes('radial-gradient'), 'layered spatial background present')
ok(css.includes('.chamberGrid'), 'distinct Conversation Chamber spatial grammar present')
ok(css.includes('.signalLanes'), 'conversation field lanes present')
ok(css.includes('.pulse'), 'communication pulse styling present')
ok(css.includes('.timeline'), 'forensic/event timeline styling present')
ok(css.includes('.studio'), 'focused studio grammar present')
ok(css.includes('.codeBlock'), 'template render result treatment present')

// Isolated TypeScript contract.
if (exists(authority[3])) {
  const config=JSON.parse(read(authority[3]))
  ok(Array.isArray(config.include) && config.include.length===0, 'targeted tsconfig disables inherited repo-wide include')
  ok(Array.isArray(config.files) && config.files.length >= 40, 'targeted tsconfig enumerates communication files')
  ok(config.compilerOptions?.noEmit===true, 'targeted tsconfig forbids emit')
  ok(config.compilerOptions?.skipLibCheck===true, 'targeted tsconfig skips dependency declaration noise')
}

// New-code debt gates.
for (const term of ['TODO','FIXME','coming soon','demo-only','placeholder implementation']) ok(!newCode.includes(term), `zero new code debt marker: ${term}`)

console.log('')
console.log('========================================================================')
console.log(`SANILA COMMUNICATION COMMAND — ${pass}/${pass+fail} checks passed`)
console.log('========================================================================')
if (fail) {
  console.log('Failures:')
  for (const item of failures) console.log(` - ${item}`)
  process.exit(1)
}
