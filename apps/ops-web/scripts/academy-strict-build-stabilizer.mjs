#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const res = spawnSync(cmd, ['run', 'build'], { stdio: 'inherit' })
if (res.status !== 0) {
  console.error('\nAcademy strict build did not pass. Fix the first TypeScript error and rerun this script.')
  process.exit(res.status || 1)
}
console.log('\nAcademy strict build passed successfully.')
