import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const root = process.cwd()
const rel = (...parts) => path.join(root, ...parts)
const checks = []
const check = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail })
const read = (...parts) => fs.readFileSync(rel(...parts), "utf8")
const exists = (...parts) => fs.existsSync(rel(...parts))

const clientPath = ["app", "(protected)", "social-command", "_components", "SocialCommandClient.tsx"]
const engagePath = ["app", "(protected)", "social-command", "_components", "EngagementCommand.tsx"]
const shellPath = ["app", "(protected)", "social-command", "_components", "SocialCommandMZ4Shell.tsx"]
const workspacesPath = ["app", "(protected)", "social-command", "_components", "SocialCommandMZ4Workspaces.tsx"]
const cssPath = ["app", "(protected)", "social-command", "_components", "SocialCommandMZ4.module.css"]
const rulesPath = ["lib", "social-command", "mz4-broadcast.ts"]
const logoPath = ["public", "angelcare-social-command-official-logo.png"]

for (const parts of [clientPath, engagePath, shellPath, workspacesPath, cssPath, rulesPath, logoPath]) {
  check(`present:${parts.join("/")}`, exists(...parts))
}

const client = read(...clientPath)
const engage = read(...engagePath)
const shell = read(...shellPath)
const workspaces = read(...workspacesPath)
const css = read(...cssPath)
const rules = read(...rulesPath)

check("institutional masthead mounted", client.includes("MZ4InstitutionalMasthead"))
check("workspace prelude mounted", client.includes("MZ4WorkspacePrelude"))
check("executive workspace mounted", client.includes("MZ4ExecutiveWorkspace"))
check("content factory mounted", client.includes('studioView==="factory"'))
check("brand command mounted", client.includes('studioView==="brand"'))
check("dispatch mounted", client.includes('publishView==="dispatch"'))
check("broadcast rules workspace mounted", client.includes('automateView==="broadcast-rules"'))
check("control governance mounted", client.includes('controlView==="governance"'))
check("control security mounted", client.includes('controlView==="security"'))
check("control retention mounted", client.includes('controlView==="retention"'))
check("continuous bootstrap polling removed", !/setInterval\s*\(\s*refresh/.test(client))
check("navigation snapshot refresh present", client.includes("navigationReady"))
check("commercial engage view", engage.includes('view==="commercial"'))
check("sensitive engage view", engage.includes('view==="sensitive"'))
check("sla engage view", engage.includes('view==="sla"'))
check("snapshot time passed to engagement", client.includes("snapshotAt={snapshotAt}"))
check("official logo referenced", shell.includes('/angelcare-social-command-official-logo.png'))
check("rail hover pause", css.includes("animation-play-state:paused"))
check("reduced-motion contract", css.includes("prefers-reduced-motion:reduce"))
check("compositor transform", css.includes("translate3d") && css.includes("will-change:transform"))
check("no JS animation loop", !/requestAnimationFrame|setInterval/.test(shell + workspaces))
check("command palette", shell.includes("metaKey") && shell.includes("ctrlKey") && shell.includes('key.toLowerCase() === "k"'))
check("rule resolution drawer", shell.includes("selectedSignal") && shell.includes("resolution"))
check("truth-capability vocabulary", shell.includes("AUTHORIZATION REQUIRED") && shell.includes("PROVIDER LIMITED"))
check("120-rule UI declaration", shell.includes("BROADCAST_RULES.length"))
check("12 rule families", ["publishing","engagement","campaign","brand","media","meta","automation","commercial","governance","system","intelligence","workflow"].every((x) => rules.includes(`${x}: [`)))
check("10 rules generated per family", rules.includes("String(index + 1).padStart(3, \"0\")"))
check("production truth principle", /fabric|invent|unavailable, never zero/i.test(workspaces))
check("registered logo shown in brand command", workspaces.includes('/angelcare-social-command-official-logo.png'))

const logo = fs.readFileSync(rel(...logoPath))
const logoHash = crypto.createHash("sha256").update(logo).digest("hex")
check("official logo immutable sha256", logoHash === "1cc97b1e2824f15883f2d8c796b07efc994173e49f5d30ea86319e214c5c4df4", logoHash)

const missing = checks.filter((item) => !item.ok)
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}${item.detail ? ` :: ${item.detail}` : ""}`)
console.log(`\n${checks.length - missing.length}/${checks.length} MZ4 source gates passed.`)
if (missing.length) process.exit(1)
