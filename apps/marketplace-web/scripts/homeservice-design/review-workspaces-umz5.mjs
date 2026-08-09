import fs from'node:fs';import path from'node:path';const root=process.cwd();let p=0,f=0;const read=x=>fs.readFileSync(path.join(root,x),'utf8');const exists=x=>fs.existsSync(path.join(root,x));const check=(n,v,d='')=>{console.log(`${v?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`);v?p++:f++};
const dir=path.join(root,'components/carelink/service-design/performance/workspaces'),files=fs.readdirSync(dir).filter(x=>x.endsWith('.tsx'));
check('at least twenty-eight premium workspaces exist',files.length>=28,`${files.length} files`);
const all=files.map(x=>read(path.relative(root,path.join(dir,x)))).join('\n');
for(const label of ['Executive Intelligence Theatre','Plan-versus-Actual Mission Observatory','Customer Experience Command Centre','Root Cause Analysis Chamber','Production Readiness Command Room','Executive Document Studio'])check(`${label} has individual identity`,all.includes(label));
check('premium white enterprise panels are used',all.includes('PerformanceWorkspace')&&read('components/carelink/service-design/performance/PerformanceUI.tsx').includes('bg-white'));
check('distinct layout variants are present',new Set([...all.matchAll(/variant="([^"]+)"/g)].map(x=>x[1])).size>=8);
check('French operational language is present',all.includes('Expérience client')&&all.includes('Réconciliation'));
check('no fake signatures or seals exist',!/signature préchargée|sceau décoratif/i.test(all));
check('A4 executive document surface exists',all.includes('A4 · Versionné'));
check('CARELINK sovereignty is visible',read('components/carelink/service-design/performance/PerformanceUI.tsx').includes('CARELINK souverain'));
console.log(`\n${p}/${p+f} enterprise-workspace checks passed.`);if(f)process.exit(1)
