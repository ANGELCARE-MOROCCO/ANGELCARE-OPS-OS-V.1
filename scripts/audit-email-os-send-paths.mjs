import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const targets = ["app", "lib", "components", "hooks"]

const badPatterns = [
  "EMAIL_OS_SMTP_USER",
  "EMAIL_OS_SMTP_PASSWORD",
  "EMAIL_OS_SMTP_FROM",
  "MENARA_SMTP_USER",
  "MENARA_SMTP_PASSWORD",
  "nodemailer.createTransport"
]

const allow = new Set([
  "lib/email-os-core/send-mail.ts",
  "app/api/email-os/auth-diagnostics/route.ts"
])

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      if ([".next", "node_modules", ".git"].includes(entry)) continue
      walk(full, files)
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      files.push(full)
    }
  }

  return files
}

const hits = []

for (const target of targets) {
  for (const file of walk(path.join(root, target))) {
    const rel = path.relative(root, file)
    const text = fs.readFileSync(file, "utf8")

    for (const pattern of badPatterns) {
      if (!text.includes(pattern)) continue
      if (pattern === "nodemailer.createTransport" && allow.has(rel)) continue
      hits.push({ file: rel, pattern })
    }
  }
}

console.log("EMAIL-OS SEND PATH AUDIT")
console.log("========================")

if (hits.length === 0) {
  console.log("✓ No stale SMTP send paths found.")
  process.exit(0)
}

for (const hit of hits) {
  console.log(`✗ ${hit.file} contains ${hit.pattern}`)
}

process.exit(1)
