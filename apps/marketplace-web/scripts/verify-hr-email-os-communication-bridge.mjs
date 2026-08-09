import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const checks = []

function check(label, condition) {
  checks.push({ label, ok: Boolean(condition) })
}

function read(relative) {
  const target = path.join(root, relative)
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : ""
}

const component = read("app/(protected)/hr/employees/_components/HREmployeeCommunicationHub.tsx")
const sendRoute = read("app/api/hr/employees/communications/send-email/route.ts")
const statusRoute = read("app/api/hr/employees/communications/send-email/status/route.ts")
const service = read("lib/hr-production/email-os-employee-communication.ts")
const migration = read("supabase/migrations/20260804_hr_employee_communication_email_os_bridge.sql")

check("HR communication component exists", Boolean(component))
check("mailto removed from HR communication component", !component.includes("mailto:"))
check("real HR email API called", component.includes("/api/hr/employees/communications/send-email"))
check("status polling API called", component.includes("/api/hr/employees/communications/send-email/status"))
check("progress modal implemented", component.includes("Envoi de la communication RH"))
check("send route exists", Boolean(sendRoute))
check("send route reuses canonical Email OS send service", sendRoute.includes("sendEmailOSDirect"))
check("send route fixes sender to RH mailbox resolver", sendRoute.includes("resolveCanonicalRhEmailOSMailbox"))
check("send route writes Email OS outbox", sendRoute.includes('from("email_os_core_outbox")'))
check("status route is user-scoped", statusRoute.includes("requested_by_user_id"))
check("RH mailbox discovery is database-first", service.includes("listEmailOSMultiMailboxesFromDb"))
check("RH mailbox is not hardcoded to a full address", !service.includes("rh@angelcare"))
check("progress migration exists", migration.includes("hr_employee_email_send_jobs"))
check("progress ledger has no message body column", !/\bbody\s+text\b/i.test(migration))
check("progress ledger enables RLS", migration.includes("enable row level security"))

const failed = checks.filter((item) => !item.ok)
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.label}`)
console.log(`\nChecks passed: ${checks.length - failed.length}`)
console.log(`Checks failed: ${failed.length}`)
console.log("Production build: NO")
console.log("Git mutation: NO")

if (failed.length) process.exit(1)
console.log("\n✓ HR EMAIL OS COMMUNICATION BRIDGE STATIC ACCEPTANCE PASSED")
