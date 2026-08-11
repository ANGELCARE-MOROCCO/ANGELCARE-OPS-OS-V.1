import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
let passed = 0
let failed = 0
function read(rel){ return fs.readFileSync(path.join(root, rel), "utf8") }
function check(name, condition){ if(condition){ console.log(`PASS  ${name}`); passed++ } else { console.error(`FAIL  ${name}`); failed++ } }
function has(rel, token){ return read(rel).includes(token) }

const webhook = "lib/social-command/webhook.ts"
const meta = "lib/social-command/meta.ts"
const cryptoFile = "lib/social-command/crypto.ts"
const auth = "lib/social-command/auth.ts"
const publishing = "lib/social-command/publishing.ts"
const route = "app/api/social-command/[...segments]/route.ts"
const control = "app/(protected)/social-command/_components/ControlMZ2.tsx"
const gateway = "bridge/social-command-media-gateway/server.js"
const scheduler = "bridge/social-command-media-gateway/INSTALL_WINDOWS_SCHEDULER.ps1"

check("dedicated webhook signing secret supported", has(webhook, "SOCIAL_COMMAND_META_WEBHOOK_SIGNING_SECRET"))
check("webhook supports multiple signing candidates", has(webhook, "webhookSigningCandidates") && has(webhook, "META_APP_SECRET") && has(webhook, "INSTAGRAM_APP_SECRET"))
check("webhook verification remains strict HMAC SHA-256", has(webhook, "createHmac(\"sha256\"") && has(webhook, "timingSafeEqual"))
check("rejected webhook bodies are hashed, not persisted raw", has(webhook, "bodySha256") && !has(webhook, "rawRejectedBody"))
check("webhook replay exists", has(webhook, "replayMetaWebhookEvent"))
check("signed webhook self-test exists", has(webhook, "runWebhookSignatureSelfTest"))
check("Meta subscribed_apps inspect/reconcile exists", has(meta, "/subscribed_apps") && has(meta, "reconcileMetaWebhookSubscriptions"))
check("desired webhook fields include engagement primitives", ["comments","live_comments","messages","messaging_postbacks","messaging_seen","mentions"].every(v=>has(meta, `\"${v}\"`)))
check("superseded Meta tokens are scrubbed", has(meta, "encrypted_user_token: null") && has(meta, "encrypted_page_token: null"))
check("OAuth expiry cleanup exists", has(meta, "cleanupExpiredMetaOAuthSessions"))
check("encryption keyring v2 exists", has(cryptoFile, "v2.${active.id}") && has(cryptoFile, "SOCIAL_COMMAND_TOKEN_ENCRYPTION_KEYS_PREVIOUS"))
check("legacy v1 encrypted tokens remain decryptable", has(cryptoFile, 'parts[0] === "v1"'))
check("RBAC control is present and feature-gated", has(auth, "SOCIAL_COMMAND_RBAC_ENFORCE") && has(auth, "requireSocialCommandRoutePermission"))
check("DELETE requires destructive permission", has(auth, 'if (verb === "DELETE") return "destructive"'))
check("execution job claim is conditional", has(publishing, "claimExecutionJob") && has(publishing, '.in("status", ["queued", "retrying", "confirming"])'))
check("stale execution locks are recovered", has(publishing, "recoverStaleExecutionLocks"))
check("API exposes webhook self-test", has(route, 'key==="control/webhook-self-test"'))
check("API exposes subscription reconcile", has(route, 'key==="control/webhook-subscriptions/reconcile"'))
check("API exposes replay", has(route, 'key==="control/webhook-replay"'))
check("Control UI exposes webhook operations", has(control, "Self-test signature") && has(control, "Reconcile subscriptions") && has(control, "Replay latest failure"))
check("gateway protects free-space reserve", has(gateway, "SOCIAL_COMMAND_MEDIA_MIN_FREE_BYTES") && has(gateway, "507"))
check("gateway cleans stale temporary uploads", has(gateway, "cleanupTemporaryFiles") && has(gateway, "SOCIAL_COMMAND_MEDIA_TEMP_RETENTION_HOURS"))
check("Windows scheduler resolves worker secret at runtime", has(scheduler, '[Environment]::GetEnvironmentVariable("SOCIAL_COMMAND_WORKER_SECRET", "Machine")'))
const schedulerText = read(scheduler)
check("Windows scheduler does not interpolate worker secret into generated runner", schedulerText.includes("@'") && schedulerText.includes("$WorkerSecret = [Environment]::GetEnvironmentVariable"))

console.log(`\n${passed} MZ3 checks passed; ${failed} failed.`)
if (failed) process.exit(1)
