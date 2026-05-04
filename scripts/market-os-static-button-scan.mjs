#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targets = ['components/market-os', 'app/(protected)/market-os', 'app/components/market-os']
const exts = new Set(['.tsx', '.ts'])

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (exts.has(path.extname(full))) files.push(full)
  }
  return files
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

const findings = []
for (const target of targets) {
  for (const file of walk(path.join(root, target))) {
    const text = fs.readFileSync(file, 'utf8')
    const regex = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/gi
    let match
    while ((match = regex.exec(text))) {
      const attrs = match[1] || ''
      const body = (match[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const hasHandler = /onClick\s*=|type\s*=\s*["']submit["']|data-market-action\s*=|data-action-key\s*=/.test(attrs)
      if (!hasHandler) {
        findings.push({
          file: path.relative(root, file),
          line: lineOf(text, match.index),
          text: body.slice(0, 140) || '[button without visible text]',
        })
      }
    }
  }
}

console.log(JSON.stringify({
  ok: findings.length === 0,
  checked_at: new Date().toISOString(),
  static_button_findings: findings.length,
  findings,
}, null, 2))

if (findings.length) process.exitCode = 1
