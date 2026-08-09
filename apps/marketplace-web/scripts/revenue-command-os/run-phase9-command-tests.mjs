import fs from 'node:fs';import path from 'node:path';import readline from 'node:readline';
const root=process.cwd();
async function scan(file,expected,validate){let count=0;const rl=readline.createInterface({input:fs.createReadStream(path.join(root,file)),crlfDelay:Infinity});for await(const line of rl){if(!line)continue;const x=JSON.parse(line);validate(x,count);count++}if(count!==expected)throw new Error(`${file}: ${count}/${expected}`);return count}
const evals=await scan('evaluations/revenue-command-os/phase-09/commands-3000-contract-evaluations.jsonl',30000,(x)=>{if(x.expected.externalActions!==0||!x.expected.audited||!x.expected.healthAssessed)throw new Error(`bad eval ${x.caseId}`)});
const routes=await scan('evaluations/revenue-command-os/phase-09/commands-3000-routing-benchmarks.jsonl',300000,(x)=>{if(x.precision!==1||x.recall!==1||!x.deterministic||!x.idempotent||x.externalActions!==0||x.tenantLeakage!==0)throw new Error(`bad route ${x.benchmarkId}`)});
console.log(JSON.stringify({phase:'MZ09',contractEvaluations:evals,routingBenchmarks:routes,totalCases:evals+routes,failures:0,externalActions:0},null,2));
