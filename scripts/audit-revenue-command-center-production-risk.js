#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

const root = process.cwd()
const targets = [
  "components/revenue-command-center",
  "lib/revenue-command-center",
  "app/(protected)/revenue-command-center",
  "app/revenue-command-center",
]

const patterns = [
  "localStorage",
  "sessionStorage",
  "Math.random",
  "demo",
  "fake",
  "placeholder",
  "seed",
  "setInterval",
]

const hits = []
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) walk(file)
    else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      const text = fs.readFileSync(file, "utf8")
      for (const p of patterns) {
        if (text.includes(p)) hits.push({ file: path.relative(root, file), pattern: p })
      }
    }
  }
}
targets.forEach((t) => walk(path.join(root, t)))
console.table(hits)
if (hits.length) process.exitCode = 1
