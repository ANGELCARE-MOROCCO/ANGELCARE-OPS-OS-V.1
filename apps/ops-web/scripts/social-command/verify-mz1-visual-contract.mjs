import fs from 'node:fs';import path from 'node:path'
const app=path.resolve(process.argv[2]||process.cwd());const cssPath=path.join(app,'app/(protected)/social-command/_components/SocialCommand.module.css');const css=fs.readFileSync(cssPath,'utf8');const dir=path.dirname(cssPath)
const tsx=fs.readdirSync(dir).filter(f=>f.endsWith('.tsx')).map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n')
const declared=new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(m=>m[1]));const used=new Set([...tsx.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(m=>m[1]));const dynamicPrefixes=['format_','formatCard_','job_','pulse_','radar_','vault_'];const missing=[...used].filter(x=>!declared.has(x)&&!dynamicPrefixes.some(p=>x.startsWith(p))).sort()
const assertions={
  cssDepth:css.length>65000,
  sovereignModal:css.includes('.sovereignModal')&&css.includes('.sovereignWide'),
  actionPulse:css.includes('.actionPulse')&&css.includes('.pulse_completed'),
  commandConstellation:css.includes('.networkConstellation')&&css.includes('.liveRunway'),
  spatialStudio:css.includes('.studioRadar')&&css.includes('.formatDeck'),
  vaultSixMode:tsx.includes('Mosaic')&&tsx.includes('Filmstrip')&&tsx.includes('Folders')&&tsx.includes('Usage Map'),
  bulkThreePane:css.includes('.bulkArchitecture')&&css.includes('grid-template-columns:270px minmax(520px,1fr) 270px'),
  temporalWeek:css.includes('.weekCommand'), temporalMonth:css.includes('.monthAtlas'), temporalRadar:css.includes('.executionRadar'),
  responsive:css.includes('@media(max-width:1380px)')&&css.includes('@media(max-width:900px)'),
  classResolution:missing.length===0,
  noDarkFullPage:!css.includes('background:#000'),
}
const failures=Object.entries(assertions).filter(([,ok])=>!ok).map(([k])=>k);console.log(JSON.stringify({contract:'AC-SOCIAL-COMMAND-MZ1-UIX',passed:Object.values(assertions).filter(Boolean).length,failed:failures.length,failures,cssBytes:css.length,cssClasses:declared.size,usedClasses:used.size,missingClasses:missing},null,2));if(failures.length)process.exit(1);console.log('SOCIAL COMMAND MZ1 VISUAL CONTRACT PASSED')
