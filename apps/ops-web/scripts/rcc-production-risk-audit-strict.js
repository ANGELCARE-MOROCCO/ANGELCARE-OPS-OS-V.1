#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

const root = process.cwd()
const targets = [
  "components/revenue-command-center",
  "app/(protected)/revenue-command-center",
  "app/revenue-command-center",
  "lib/revenue-command-center",
]

const allowedLocalStorage = [
  "recovery",
  "Recovery",
  "fallback",
  "Fallback",
  "production-prospect-store",
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

const rows = []

function allowed(file, pattern) {
  if (pattern === "localStorage" || pattern === "sessionStorage") {
    return allowedLocalStorage.some((x) => file.includes(x))
  }
  return false
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
      for (const pattern of patterns) {
        if (text.includes(pattern) && !allowed(rel, pattern)) {
          rows.push({ file: rel, pattern })
        }
      }
    }
  }
}

targets.forEach((t) => walk(path.join(root, t)))
console.table(rows)
console.log(`\nTotal risk hits: ${rows.length}`)
if (rows.length) process.exitCode = 1
