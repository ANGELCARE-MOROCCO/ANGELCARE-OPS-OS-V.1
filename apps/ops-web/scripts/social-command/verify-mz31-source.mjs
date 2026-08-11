import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const files = {
  adapter: "lib/social-command/instagram-webhook.ts",
  route: "app/api/social-command/instagram-webhook/subscriptions/route.ts",
  ui: "app/(protected)/social-command/_components/WebhookCommandMZ31.tsx",
  control: "app/(protected)/social-command/_components/ControlMZ2.tsx",
  tsconfig: "tsconfig.social-command-mz31.json",
}
let failed = 0
function check(name, condition) { console.log(`${condition ? "PASS" : "FAIL"}  ${name}`); if (!condition) failed++ }
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8") }
for (const [name, rel] of Object.entries(files)) check(`${name} exists`, fs.existsSync(path.join(root, rel)))
if (!failed) {
  const adapter = read(files.adapter)
  const route = read(files.route)
  const ui = read(files.ui)
  const control = read(files.control)
  const tsconfig = read(files.tsconfig)
  check("dedicated Instagram token env", adapter.includes("SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCESS_TOKEN"))
  check("dedicated Instagram account env", adapter.includes("SOCIAL_COMMAND_INSTAGRAM_WEBHOOK_ACCOUNT_ID"))
  check("Instagram host is deterministic", adapter.includes("https://graph.instagram.com/") && !adapter.includes("graph.facebook.com"))
  check("subscribed_apps edge", adapter.includes("/subscribed_apps"))
  check("GET inspection", adapter.includes('instagramRequest("GET")'))
  check("POST reconciliation", adapter.includes('instagramRequest("POST")'))
  check("token never returned in snapshot", !/accessToken\s*[:,]/.test(adapter.split("export type InstagramWebhookSubscriptionSnapshot")[1]?.split("}")[0] || ""))
  check("route requires Social Command actor", route.includes("requireSocialCommandActor"))
  check("route audits inspect", route.includes("instagram_webhook.subscription.inspect"))
  check("route audits reconcile", route.includes("instagram_webhook.subscription.reconcile"))
  check("Control routes MZ3.1 webhook view", control.includes("WebhookCommandMZ31") && control.includes('view==="webhooks"'))
  check("UI labels historical rejects honestly", ui.includes("Rejets historiques 24h"))
  check("UI has no polling interval", !ui.includes("setInterval(") && !ui.includes("requestAnimationFrame("))
  check("targeted TS includes Next ambient declarations", tsconfig.includes("next-env.d.ts"))
  check("targeted TS disables incremental state", tsconfig.includes('"incremental": false'))
}
if (failed) { console.error(`SOCIAL COMMAND MZ3.1 VERIFY = FAIL (${failed})`); process.exit(1) }
console.log("SOCIAL COMMAND MZ3.1 VERIFY = PASS")
