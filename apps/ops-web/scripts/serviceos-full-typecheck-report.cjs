const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const outFile = path.join(process.cwd(), 'serviceos-full-typecheck-report.txt')
const result = spawnSync('npx', ['tsc', '-p', 'tsconfig.json', '--noEmit', '--pretty', 'false'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32'
})

const output = [
  'SERVICEOS FULL TYPESCRIPT REPORT',
  '================================',
  '',
  result.stdout || '',
  result.stderr || '',
].join('\n')

fs.writeFileSync(outFile, output, 'utf8')
console.log(`Wrote ${outFile}`)
if (result.status !== 0) {
  console.log('TypeScript found errors. Open serviceos-full-typecheck-report.txt and send it here.')
  process.exit(result.status)
}
console.log('No TypeScript errors found by tsc --noEmit.')
