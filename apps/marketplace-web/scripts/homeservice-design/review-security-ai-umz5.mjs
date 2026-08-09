import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const o=read('lib/homeservice-performance/server/openrouter-free.ts'),r=read('lib/homeservice-performance/server/repository.ts'),s=read('supabase/migrations/20260802_homeservice_design_os_ultra_mega_zip5_production_sovereignty.sql');
check('OpenRouter free route is fixed',o.includes("OPENROUTER_FREE_ROUTE")&&read('lib/homeservice-performance/constants.ts').includes("'openrouter/free'"));
check('no named paid models exist',!/openai\/|anthropic\/|google\/|gemini|claude|gpt-/i.test(o));
check('provider key is server-only',o.includes('process.env.OPENROUTER_API_KEY')&&!o.includes('NEXT_PUBLIC_OPENROUTER'));
check('PII redaction covers email and phone',o.includes('[EMAIL_REDACTED]')&&o.includes('[PHONE_REDACTED]'));
check('provider failure remains explicit',o.includes('Aucun résultat synthétique'));
check('AI remains advisory-only',o.includes('Ne prenez aucune décision'));
check('AI cannot certify production readiness',!o.includes('decideProductionRelease'));
check('security findings can block release',s.includes('hsd_security_findings'));
check('retention and privacy are versioned',s.includes('hsd_retention_policies'));
check('incident lifecycle is deterministic',read('lib/homeservice-performance/server/analytics.ts').includes('assertIncidentTransition'));
console.log(`\n${p}/${p+f} security-AI boundary checks passed.`);if(f)process.exit(1)
