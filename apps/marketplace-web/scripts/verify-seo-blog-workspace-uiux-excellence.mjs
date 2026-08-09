#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const root = process.cwd()
const failures = []
let passed = 0

function ok(condition, message) {
  if (condition) {
    passed += 1
    console.log(`✓ ${message}`)
  } else {
    failures.push(message)
    console.error(`✗ ${message}`)
  }
}
function read(relative) {
  const absolute = path.join(root, relative)
  ok(fs.existsSync(absolute), `File exists: ${relative}`)
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : ""
}
function hash(relative) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex")
}
function includes(source, value, message) { ok(source.includes(value), message) }
function excludes(source, value, message) { ok(!source.includes(value), message) }

const systemPath = "components/market-os/seo-blog/seo-blog-system.tsx"
const workspacePath = "components/market-os/seo-blog-workspace.tsx"
const subpagePath = "components/market-os/seo-blog/seo-subpage.tsx"
const system = read(systemPath)
const workspace = read(workspacePath)
const subpage = read(subpagePath)

const protectedHashes = {
  "app/(protected)/market-os/seo-blog-workspace/page.tsx":"ff6db023b740699c56d12b501992458190fe78e61b44e1a256c1adb2c57c2408",
  "app/(protected)/market-os/seo-blog-workspace/create/page.tsx":"3e3beb21ddc188a91708d9ec9b8262a61e08b7341eedb1f0af6d892b4f51dbbe",
  "app/(protected)/market-os/seo-blog-workspace/calendar/page.tsx":"0ed7ba4ae9ce1a8d18f1af3df3b95a7659af98f20350044ca0e2844cc4f120aa",
  "app/(protected)/market-os/seo-blog-workspace/review/page.tsx":"b8030f33931a31a32b679df4ce4e79c504e9055f9f751a54d18a3bd626ad04e8",
  "app/(protected)/market-os/seo-blog-workspace/publishing/page.tsx":"4ce0d7ab1634ceaa18434c28732c557dd280535744089f8a2c3e9d1342b69eab",
  "app/(protected)/market-os/seo-blog-workspace/optimizer/page.tsx":"e89a91e760991c34fbda20c2ecb29cb50b8ad6c3c53b9c167882f9a399a81d9d",
  "app/(protected)/market-os/seo-blog-workspace/topic-clusters/page.tsx":"c56f635e89321ef5696215232eca82d82dcd752c17d4e21ff77857cbed094678",
  "app/(protected)/market-os/seo-blog-workspace/analytics/page.tsx":"9776d5f78055909a4f59ec541db791c30e4ce3b18ac3b2c40e5604300bca1471",
  "app/(protected)/market-os/seo-blog-workspace/linking/page.tsx":"25a41a4c9e3f522989c0cbdebf542d1a9be2d6a27aae0744210237e659060c14",
  "app/(protected)/market-os/seo-blog-workspace/brand-governance/page.tsx":"b86a7fd7a0f2abe7c37f7e648e9b008357cbc97f1057383d81214af3c9927bbe",
  "app/(protected)/market-os/seo-blog-workspace/[id]/page.tsx":"12b78e7cd0edd88c0108aaa63c6dccf9f4dece01217c295bfb9776244d3140ae",
  "app/(protected)/market-os/seo-blog-workspace/[id]/edit/page.tsx":"f527816a13ca55a8babb2cea8f65c4e050a185721503959492c33e2db6c75237",
  "app/(protected)/market-os/seo-blog-workspace/[id]/delete/page.tsx":"c7ba14314f99a20edb04d6e0e2a055f6a095b1f79e99cb3c0c84a66772c18d12",
  "app/api/market-os/seo-blog-workspace/route.ts":"cae00ac5e95f344f1337107287b637d3a0a74729cac131968d151573df457e91",
  "app/api/market-os/seo-blog-workspace/[id]/route.ts":"4ca6d3c007d6e408b5b05a49c4f94a8b3056762ec2dfcaeaae69396cd0e8ca52",
  "app/api/market-os/seo-blog-workspace/action/route.ts":"bbe0d251d5ad9c32899c0518a0699783f520129f1fbf110275f625e71459f5b3",
  "app/api/market-os/seo-blog-workspace/analytics/route.ts":"0a0a844f0875c83a15011d7fab837ca8b080a5ee79eb23d0d0e1064034a4cf9e",
  "app/api/market-os/seo-blog-workspace/calendar/route.ts":"415bfcca6e15fb28790fce36d8325176e2cd31e6850380748abb9baddf258f36",
  "components/market-os/seo-blog-workspace-lib.ts":"adf763d62edaabe257dd86afc60d9929aac6fec4e099bf2d5471549325abbc07",
  "lib/browser-extension/generated/module-catalog.v1.json":"6496f087c411e5b46ce4b1dfb9a24410e3ecf9e2c6b3d1d8cfe948f8310ee6ad",
}

for (const [relative, expected] of Object.entries(protectedHashes)) {
  const absolute = path.join(root, relative)
  ok(fs.existsSync(absolute), `Protected file remains present: ${relative}`)
  if (fs.existsSync(absolute)) ok(hash(relative) === expected, `Protected file remains byte-identical: ${relative}`)
}

includes(system, 'export const SEO_STORE_KEY = "angelcare_market_os_seo_blog_real_execution_v3"', "Local-storage key is unchanged")
includes(system, 'localStorage.getItem(SEO_STORE_KEY)', "Existing local-storage read remains wired")
includes(system, 'localStorage.setItem(SEO_STORE_KEY', "Existing local-storage write remains wired")
excludes(system, "localStorage.removeItem", "No implicit local-storage wipe was introduced")
includes(system, 'export const statuses: SeoStatus[] = ["idea","brief","draft","review","approved","scheduled","published"]', "Canonical status sequence remains unchanged")
includes(system, 'export function nextStatus', "Existing stage progression helper remains available")
includes(system, 'return a.status==="approved"', "Existing publish-gate status requirement remains unchanged")
includes(system, 'articleReadiness(a,tasks,rules)>=80', "Existing readiness threshold remains 80")
includes(system, 'a.seoScore>=75', "Existing SEO threshold remains 75")
includes(system, 'a.brandScore>=75', "Existing brand threshold remains 75")

for (const mode of ["create","detail","edit","delete","calendar","review","publishing","optimizer","clusters","analytics","brand","linking"]) {
  includes(subpage, `mode===\"${mode}\"`, `Specialized workspace remains implemented: ${mode}`)
}
includes(subpage, 'status:"approved"', "Approval still sets status to approved")
includes(subpage, 'status:"draft",notes:', "Revision still returns content to draft and appends a note")
includes(subpage, 'status:"published",publishedDate:todayISO()', "Publishing action still records published status and date")
includes(subpage, 'status:"scheduled"', "Scheduling action still records scheduled status")
includes(subpage, 'seoScore:Math.min(100,item.seoScore+5)', "Optimizer keeps the existing SEO +5 behavior")
includes(subpage, 'brandScore:Math.min(100,item.brandScore+3)', "Optimizer keeps the existing brand +3 behavior")
includes(subpage, 'readability:Math.min(100,item.readability+2)', "Optimizer keeps the existing readability +2 behavior")
includes(subpage, 'item.status==="active"?"expanding":"active"', "Cluster toggle behavior remains active/expanding")
includes(subpage, 'active:!item.active', "Governance rule toggle remains unchanged")
includes(subpage, '`/market-os/seo-blog-workspace/${item.slug}`', "Internal-link suggestion path remains unchanged")
includes(subpage, 'draft.tasks=draft.tasks.filter(task=>task.articleId!==id)', "Article deletion still removes associated tasks")
includes(subpage, 'status:nextStatus(item.status)', "Article advancement still uses the canonical next-status helper")
includes(subpage, 'title:`SEO article scheduled ${iso}`', "Calendar date creation retains the existing article title behavior")
includes(subpage, 'owner:"SEO Lead",reviewer:"Brand Lead"', "Calendar-created article retains existing ownership defaults")

includes(workspace, 'Centre de commande SEO & contenu', "Premium French executive command identity is present")
includes(workspace, '<WorkspaceTruthNotice/>', "Local-data truth notice is visible on the command center")
includes(subpage, '<WorkspaceTruthNotice/>', "Local-data truth notice is visible on specialized workspaces")
includes(workspace, 'type View = "command" | "pipeline" | "table" | "calendar" | "intelligence"', "All five existing command views remain available")
includes(workspace, '<PipelineBoard', "Seven-stage editorial pipeline is present")
includes(workspace, '<PerformanceSnapshot', "Portfolio performance surface is present")
includes(workspace, '<ClusterSnapshot', "Cluster strategy surface is present")
includes(workspace, '<CalendarPreview', "Calendar preview remains present")
includes(workspace, '<ArticleRow', "Article inventory actions remain present")
includes(subpage, 'Bureau de validation éditoriale', "Purpose-built review experience is present")
includes(subpage, 'Préparation à la publication', "Purpose-built publishing control is present")
includes(subpage, 'Optimisation transparente', "Optimizer limitation disclosure is present")
includes(subpage, 'Origine des données', "Analytics data-origin disclosure is present")
includes(subpage, 'Plan de maillage interne', "Internal-linking scope disclosure is present")
includes(subpage, 'Action irréversible dans le store actuel', "Destructive-action safety language is present")
includes(subpage, 'Article introuvable', "Missing-article state is handled safely")

excludes(workspace, "SEO operating signal 001", "Repeated synthetic executive-signal array was removed")
excludes(subpage, "SEO execution workflow checkpoint 001", "Repeated synthetic workflow-checkpoint array was removed")
excludes(workspace, "Publish now", "Unsupported external-publishing wording is absent from command center")
excludes(subpage, ">Publish now<", "Unsupported external-publishing wording is absent from publishing desk")
excludes(workspace, "text-slate-9500", "Invalid Tailwind text token is absent from command center")
excludes(subpage, "text-slate-9500", "Invalid Tailwind text token is absent from specialized workspaces")

const catalog = JSON.parse(read("lib/browser-extension/generated/module-catalog.v1.json"))
const serializedCatalog = JSON.stringify(catalog)
includes(serializedCatalog, '"key":"seo_blog"', "Browser extension module key remains seo_blog")
includes(serializedCatalog, '"route":"/market-os/seo-blog-workspace"', "Browser extension deep link remains unchanged")
includes(serializedCatalog, '"defaultEnabled":false', "Browser extension remains disabled by default")

console.log(`\nSEO Blog Workspace Excellence verification: ${passed} checks passed, ${failures.length} failed.`)
if (failures.length) {
  console.error("\nContract violations detected:")
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`))
  process.exit(1)
}
console.log("No protected route, API, storage, browser-extension or workflow contract violation detected by the static gate.")
