import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=process.cwd();const failures=[];const passes=[];const check=(ok,label)=>{(ok?passes:failures).push(label)};const p=x=>path.join(root,x);const read=x=>fs.readFileSync(p(x),'utf8');const json=x=>JSON.parse(read(x));const exists=x=>fs.existsSync(p(x));
const required=[
'lib/revenue-command-os/command-kernel/golden-300/catalog.ts',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.commands.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.versions.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.triggers.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.schedules.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.graphs.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.coverage.json',
'lib/revenue-command-os/command-kernel/golden-300/golden-300.uniqueness.json',
'evaluations/revenue-command-os/phase-06/golden-300-contract-evaluations.jsonl',
'evaluations/revenue-command-os/phase-06/golden-300-routing-benchmarks.jsonl',
'evaluations/revenue-command-os/phase-06/EVALUATION_MANIFEST_MZ06.json',
'app/api/revenue-command-os/command-kernel/golden-300/route.ts',
'supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql',
'docs/revenue-command-os/phase-06/ROLLBACK.sql'
];for(const f of required)check(exists(f),`Fichier requis: ${f}`);
const commands=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.commands.json');
const versions=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.versions.json');
const triggers=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.triggers.json');
const schedules=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.schedules.json');
const graphs=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.graphs.json');
const coverage=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.coverage.json');
const uniqueness=json('lib/revenue-command-os/command-kernel/golden-300/golden-300.uniqueness.json');
check(commands.length===300,`Exactement 300 commandes (${commands.length})`);
check(new Set(commands.map(c=>c.commandCode)).size===300,'300 codes uniques');
check(new Set(commands.map(c=>c.name)).size===300,'300 noms uniques');
check(new Set(commands.map(c=>c.purpose)).size===300,'300 finalités uniques');
check(versions.length===300&&new Set(versions.map(v=>v.commandCode)).size===300,'300 versions immuables');
check(triggers.length===300&&new Set(triggers.map(v=>v.commandCode)).size===300,'300 liens de déclenchement');
check(schedules.length>=60,`Planification représentative (${schedules.length})`);
check(graphs.length===24,'24 graphes gouvernés');
check(coverage.length===12&&coverage.every(x=>x.count===25),'25 commandes dans chacune des 12 familles');
check(uniqueness.length===300&&new Set(uniqueness.map(x=>x.fingerprint)).size===300,'300 empreintes fonctionnelles uniques');
const familyCounts=new Map();const forbidden=new Set(['send_email','send_whatsapp','apply_discount','sign_contract','release_payment','confirm_capacity','commit_price']);
for(const c of commands){familyCounts.set(c.family,(familyCounts.get(c.family)||0)+1);check(c.status==='approved',`${c.commandCode}: approuvée`);check(c.activeVersion==='1.0.0',`${c.commandCode}: version 1.0.0`);check(c.tags.includes('golden-300'),`${c.commandCode}: tag Golden 300`);check(c.requiredContext.length>=3,`${c.commandCode}: contexte exact`);check(c.inputSchema.length>=5&&c.outputSchema.length>=8,`${c.commandCode}: schémas exacts`);check(c.validatorChain.length>=10,`${c.commandCode}: chaîne validateurs`);check(c.prohibitedCases.length>=7,`${c.commandCode}: cas prohibés`);check(c.expectedOutcomes.length>=4,`${c.commandCode}: résultats attendus`);check(c.performanceMetrics.length>=10,`${c.commandCode}: métriques`);check(c.toolPermissions.filter(t=>t.allowed&&forbidden.has(t.toolCode)).length===0,`${c.commandCode}: aucune action externe autorisée`);for(const tool of forbidden)check(c.toolPermissions.some(t=>t.toolCode===tool&&t.allowed===false),`${c.commandCode}: verrou ${tool}`)}
check([...familyCounts.values()].every(x=>x===25),'Répartition équilibrée 25 × 12');
const manifest=json('evaluations/revenue-command-os/phase-06/EVALUATION_MANIFEST_MZ06.json');
check(manifest.goldenCommands===300&&manifest.totalCases===33600,'Manifest évaluations 33 600');
const evalLines=read('evaluations/revenue-command-os/phase-06/golden-300-contract-evaluations.jsonl').trim().split('\n');
const benchLines=read('evaluations/revenue-command-os/phase-06/golden-300-routing-benchmarks.jsonl').trim().split('\n');
check(evalLines.length===3600,`3 600 évaluations contractuelles (${evalLines.length})`);
check(benchLines.length===30000,`30 000 benchmarks (${benchLines.length})`);
const classes=new Set();for(const line of evalLines){const x=JSON.parse(line);classes.add(x.evaluationClass);if(x.expected.externalActions!==0)failures.push(`${x.caseId}: action externe`)}
check(classes.size===12,'12 classes d’évaluation par commande');
for(const line of benchLines){const x=JSON.parse(line);if(x.expected.externalActions!==0)failures.push(`${x.benchmarkId}: action externe`);const h=crypto.createHash('sha256').update(`${x.commandCode}:${Number(x.benchmarkId.slice(-3))}`).digest('hex');if(h.length!==64)failures.push(`${x.benchmarkId}: hash`)}
const migration=read('supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql');
for(const t of ['revenue_os_command_releases','revenue_os_command_coverage','revenue_os_command_uniqueness_fingerprints','revenue_os_command_benchmarks'])check(migration.includes(`create table if not exists public.${t}`),`Migration additive ${t}`);
check(migration.includes("'AC-REVENUE-OS-MZ06-GOLDEN-300'"),'Release DB MZ06');
check(migration.includes("'goldenCommands',300")&&migration.includes("'benchmarkCases',30000"),'Métadonnées DB exactes');
check(migration.includes('enable row level security')&&migration.includes('revoke all on table')&&migration.includes('to service_role'),'RLS et service-only');
check(!migration.toLowerCase().includes('drop table'),'Migration sans destruction');
const seed=read('lib/revenue-command-os/command-kernel/seed-data.ts');check(seed.includes('GOLDEN_300_COMMANDS')&&seed.includes('REVENUE_COMMAND_GOLDEN_300_COUNT'),'Registre MZ05 étendu cumulativement');
const constants=read('lib/revenue-command-os/command-kernel/constants.ts');check((constants.includes('MZ06-GOLDEN-300')&&constants.includes('6.0.0-phase6'))||(constants.includes('MZ07-COMMANDS-1000')&&constants.includes('7.0.0-phase7'))||(constants.includes('MZ08-COMMANDS-2000')&&constants.includes('8.0.0-phase8'))||(constants.includes('MZ09-COMMANDS-3000')&&constants.includes('9.0.0-phase9')),'Identité runtime MZ06 préservée ou cumulativement avancée');
const frame=read('app/(protected)/revenue-command-os/command-kernel/_components/CommandKernelFrame.tsx');check((frame.includes('MZ06')&&frame.includes('Golden 300'))||(frame.includes('MZ07')&&frame.includes('Commandes 1000'))||(frame.includes('MZ08')&&frame.includes('Commandes 2000'))||(frame.includes('MZ09')&&frame.includes('Commandes 3000')),'UI française cumulative MZ06–MZ08');
const api=read('app/api/revenue-command-os/command-kernel/golden-300/route.ts');check(api.includes('GOLDEN_300_COMMANDS')&&api.includes('externalActionsEnabled:false'),'API catalogue Golden 300 sécurisée');
const fonts=[];const secrets=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else{if(/\.(woff2?|ttf|otf)$/i.test(e.name))fonts.push(full);if(/\.(ts|tsx|js|mjs|json|sql|md|txt|sh)$/i.test(e.name)&&fs.statSync(full).size<10_000_000){const s=fs.readFileSync(full,'utf8');if(/sk-[A-Za-z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^<]/.test(s))secrets.push(full)}}}}walk(root);check(fonts.length===0,'Aucune police incluse');check(secrets.length===0,'Aucun secret détecté');
console.log(`\nMZ06 STATIC ACCEPTANCE\nPasses: ${passes.length}\nFailures: ${failures.length}`);for(const f of failures.slice(0,100))console.error(`  ✗ ${f}`);if(failures.length)process.exit(1);console.log(`Golden commands: ${commands.length}\nFamilies: ${familyCounts.size}\nContract evaluations: ${evalLines.length}\nBenchmarks: ${benchLines.length}\nExternal actions: 0\nMEGA ZIP 6 STATIC ACCEPTANCE: PASS\n`);
