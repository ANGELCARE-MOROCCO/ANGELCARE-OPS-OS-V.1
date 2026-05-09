
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const emailRoot = path.join(root, "app")
const matches = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full)
    else if (full.includes("email-os") && (item === "page.tsx" || item === "route.ts")) {
      matches.push(path.relative(root, full))
    }
  }
}

walk(emailRoot)

console.log("\nEMAIL-OS ROUTE AUDIT")
console.log("====================")
for (const file of matches.sort()) console.log(file)
console.log(`\nTotal Email-OS route/page files: ${matches.length}`)
