#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

const root = process.cwd()
const targets = [
  "components/revenue-command-center",
  "app/(protected)/revenue-command-center",
  "app/api/revenue-command-center",
  "lib/revenue-command-center",
]

const patterns = [
  { key: "localStorage", allowed: ["Recovery", "recovery", "fallback", "production-prospect-store"] },
  { key: "sessionStorage", allowed: [] },
  { key: "Math.random", allowed: [] },
  { key: "demo", allowed: [] },
  { key: "fake", allowed: [] },
  { key: "placeholder", allowed: ["placeholder:text"] },
  { key: "seed", allowed: [] },
  { key: "setInterval", allowed: ["fallback"] },
]

const hits = []
function allowed(file, text, pattern) {
  return pattern.allowed.some((a) => file.includes(a) || text.includes(a))
}
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) walk(file)
    else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      const rel = path.relative(root, file)
      const text = fs.readFileSync(file, "utf8")
      for (const p of patterns) {
        if (text.includes(p.key) && !allowed(rel, text, p)) {
          hits.push({ file: rel, pattern: p.key })
        }
      }
    }
  }
}

targets.forEach((target) => walk(path.join(root, target)))
console.table(hits)
console.log(`Total strict risk hits: ${hits.length}`)
if (hits.length) process.exitCode = 1
