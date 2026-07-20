import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'dist/manifest.json',
  'dist/runtime-config.json',
  'dist/background/service-worker.js',
  'dist/content/generic-web.js',
  'dist/content/google-maps.js',
  'dist/content/gmail.js',
  'dist/content/whatsapp-web.js',
  'dist/content/google-calendar.js',
  'dist/modules/revenue-b2b.js',
  'dist/modules/revenue-b2b/capability-ui.js',
  'dist/modules/revenue-b2b/workspace-store.js',
  'dist/modules/revenue-b2b/workspace-types.js',
  'dist/modules/revenue-b2b/partner-mode.js',
  'dist/modules/revenue-b2b/partner-actions.js',
  'dist/modules/revenue-b2b/management-mode.js',
  'dist/modules/revenue-b2b/management-actions.js',
  'dist/focus.html',
  'dist/focus/focus.js',
  'dist/sidepanel.css',
  'dist/generated/b2b-capabilities.v1.json',
  'dist/generated/b2b-account-intelligence.v2.json',
  'dist/generated/b2b-revenue-execution.v3.json',
  'dist/generated/b2b-deal-closing.v4.json',
  'dist/generated/b2b-enterprise-experience.v4_5.json',
  'dist/generated/b2b-partner-lifecycle.v5.json',
  'dist/generated/b2b-ai-sales-director.v6.json',
]
let failed = 0
for (const rel of required) {
  const ok = fs.existsSync(path.join(root, rel))
  console.log(`${ok ? 'PASS' : 'FAIL'} ${rel}`)
  if (!ok) failed += 1
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/manifest.json'), 'utf8'))
if (manifest.version !== '0.6.0') {
  console.error(`FAIL manifest version ${manifest.version}`)
  failed += 1
} else console.log('PASS manifest version 0.6.0')

for (const rel of ['dist/content/generic-web.js','dist/content/google-maps.js','dist/content/gmail.js','dist/content/whatsapp-web.js','dist/content/google-calendar.js']) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8')
  const ok = !text.includes('export {};') && text.includes('ANGELCARE_')
  console.log(`${ok ? 'PASS' : 'FAIL'} classic content script ${rel}`)
  if (!ok) failed += 1
}

const revenue = [
  'dist/modules/revenue-b2b.js',
  'dist/modules/revenue-b2b/partner-mode.js',
  'dist/modules/revenue-b2b/partner-actions.js',
  'dist/modules/revenue-b2b/management-mode.js',
  'dist/modules/revenue-b2b/management-actions.js',
].map((relative) => fs.readFileSync(path.join(root, relative), 'utf8')).join('\n')
const runtimeSignals = [
  'b2b.opportunity.create','b2b.daily_command.read','b2b.gmail.reply_prepare','b2b.whatsapp.message_prepare',
  'b2b.meeting.outcome_apply','b2b.sequence.enroll','b2b.proposal.create','b2b.pricing.calculate',
  'b2b.negotiation.open','b2b.closing.gate_check','b2b.payment_promise.create','b2b.revenue_rescue.create',
  'premium-account-360','proposal-studio-runtime','capability-command-center','command-domain-nav',
  'b2b.handoff.generate','b2b.partner.activate','b2b.activation.approve','b2b.partner_health.calculate',
  'b2b.qbr.generate','b2b.expansion.plan_create','b2b.renewal.plan_create','b2b.tender.submit','partner-runtime',
  'b2b.ai_director.review_pipeline','b2b.pipeline_truth.assess','b2b.forecast.calculate','b2b.revenue_risk.detect',
  'b2b.execution_quality.assess','b2b.coaching.create','b2b.report.daily_revenue_generate','b2b.automation.kill','management-runtime',
]
for (const signal of runtimeSignals) {
  const ok = revenue.includes(signal)
  console.log(`${ok ? 'PASS' : 'FAIL'} runtime signal ${signal}`)
  if (!ok) failed += 1
}

const experience = JSON.parse(fs.readFileSync(path.join(root, 'dist/generated/b2b-enterprise-experience.v4_5.json'), 'utf8'))
const director = JSON.parse(fs.readFileSync(path.join(root, 'dist/generated/b2b-ai-sales-director.v6.json'), 'utf8'))
const lifecycle = JSON.parse(fs.readFileSync(path.join(root, 'dist/generated/b2b-partner-lifecycle.v5.json'), 'utf8'))
const contract = JSON.parse(fs.readFileSync(path.join(root, 'dist/generated/b2b-capabilities.v1.json'), 'utf8'))
const preservedExperienceOk = experience.operationalCapabilityCount === 35 && experience.capabilities?.length === 35
console.log(`${preservedExperienceOk ? 'PASS' : 'FAIL'} Mega ZIP 4.5 35/35 capability foundation preserved`)
if (!preservedExperienceOk) failed += 1
const operational = contract.capabilities.filter((item) => item.patch02Status === 'implemented' || item.patch03Status === 'implemented' || item.patch04Status === 'implemented' || item.patch05Status === 'implemented' || (item.patch06Status === 'implemented' || item.patch06Status === 'preserved'))
const coverageOk = operational.length === 45 && lifecycle.implementedCapabilityIds?.length === 6 && lifecycle.focusWorkspaces?.length === 8 && director.implementedCapabilityIds?.length === 4 && director.focusWorkspaces?.length === 10
console.log(`${coverageOk ? 'PASS' : 'FAIL'} Mega ZIP 6 cumulative 45/45 capability-to-UI coverage`)
if (!coverageOk) failed += 1

const css = fs.readFileSync(path.join(root, 'dist/sidepanel.css'), 'utf8')
for (const signal of ['Mega ZIP 4.5','command-account-hero','proposal-paper','focus-root','partner-runtime','partner-hero','tender-board','management-runtime','management-safety-banner']) {
  const ok = css.includes(signal)
  console.log(`${ok ? 'PASS' : 'FAIL'} visual system ${signal}`)
  if (!ok) failed += 1
}

if (failed) process.exit(1)
console.log('ANGELCARE Revenue Command Mega ZIP 6 cumulative AI Sales Director and controlled automation verified')
