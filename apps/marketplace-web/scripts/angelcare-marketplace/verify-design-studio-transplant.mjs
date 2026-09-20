import { spawnSync } from 'node:child_process'
const scripts=['scripts/angelcare-marketplace/verify-universal-studio.test.mjs',...Array.from({length:10},(_,index)=>`scripts/angelcare-marketplace/verify-studio-catalogue-category-${String(index+1).padStart(2,'0')}.mjs`)]
for(const script of scripts){const result=spawnSync(process.execPath,[script],{cwd:process.cwd(),stdio:'inherit'});if(result.status!==0){console.error(`FAIL ${script}`);process.exit(result.status||1)}}
console.log('PASS ANGELCARE_DESIGN_STUDIO_TRANSPLANT BASELINE=PASS CATEGORIES=10 EXPERIENCES=100 SQL=NO DEPLOY=NO')
