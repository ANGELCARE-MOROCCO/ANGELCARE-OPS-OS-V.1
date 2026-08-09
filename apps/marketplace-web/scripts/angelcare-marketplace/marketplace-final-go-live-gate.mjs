import { spawn } from 'node:child_process'
const scripts=['marketplace-runtime-acceptance.mjs','marketplace-security-negative-tests.mjs','marketplace-visual-acceptance.mjs']
let failed=0
for(const script of scripts){const code=await new Promise((resolve)=>{const child=spawn(process.execPath,[new URL(`./${script}`,import.meta.url).pathname],{stdio:'inherit',env:process.env});child.on('exit',(value)=>resolve(value||0))});if(code!==0)failed++}
console.log('\n============================================================')
console.log(failed===0?'GO-LIVE ENVIRONMENTAL GATE PASSED':'GO-LIVE ENVIRONMENTAL GATE BLOCKED')
console.log('============================================================')
if(failed)process.exitCode=2
