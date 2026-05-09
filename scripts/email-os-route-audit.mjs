
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const app = path.join(root, "app")
const found = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full)
    else if (full.includes("email-os") && ["page.tsx", "route.ts"].includes(item)) {
      found.push(path.relative(root, full))
    }
  }
}

walk(app)

console.log("\nEMAIL-OS ROUTE AUDIT")
console.log("====================")
for (const f of found.sort()) console.log(f)
console.log(`\nTotal: ${found.length}`)
