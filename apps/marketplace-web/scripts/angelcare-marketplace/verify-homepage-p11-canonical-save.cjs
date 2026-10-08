const fs=require('fs')
const path=require('path')
const Module=require('module')
const cp=require('child_process')
const assert=require('assert/strict')

const APP=process.cwd()
function resolveTs(){
  const local=path.join(APP,'node_modules/typescript/lib/typescript.js')
  if(fs.existsSync(local))return local
  try{const root=cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();const p=path.join(root,'typescript/lib/typescript.js');if(fs.existsSync(p))return p}catch{}
  throw new Error('TypeScript compiler module unavailable.')
}
const ts=require(resolveTs())
for(const ext of ['.ts','.tsx'])require.extensions[ext]=function(mod,filename){
  const source=fs.readFileSync(filename,'utf8')
  const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs},fileName:filename,reportDiagnostics:true})
  const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error)
  if(errors.length)throw new Error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'))
  mod._compile(result.outputText,filename)
}
const originalResolve=Module._resolveFilename
Module._resolveFilename=function(request,parent,isMain,options){if(request.startsWith('@/'))request=path.join(APP,request.slice(2));return originalResolve.call(this,request,parent,isMain,options)}

const recipe=require(path.join(APP,'angelcare-marketplace/studio-homepage-pro-max/recipe.ts'))
const pageJson=require(path.join(APP,'angelcare-marketplace/studio-universal/page-json.ts'))

const poisoned=JSON.parse('{"content":[],"root":{"props":{"title":"Accueil","locale":"fr","pageId":"page-p11-fixture","constructor":"legacy-root-contamination"}}}')
const candidate=recipe.buildHomepageProMaxWorld01Data(poisoned,'replace')
assert.equal(candidate.content.length,18,'Homepage World 01 must contain exactly 18 root sections')
assert.deepEqual(candidate.content.map(x=>x.type),recipe.HOMEPAGE_PRO_MAX_COMPONENT_KEYS,'World content must match registered Homepage Pro Max component keys')
assert.equal(candidate.root.props.title,'Accueil')
assert.equal(candidate.root.props.locale,'fr')
assert.equal(candidate.root.props.pageId,'page-p11-fixture')
assert.equal(Object.prototype.hasOwnProperty.call(candidate.root.props,'constructor'),false,'replacement root must discard inherited/legacy root contamination')
assert.equal(candidate.root.props.__homepageProMaxWorld.worldId,'ac.homepage.pro-max.family-commerce.01')
const validated=pageJson.validateStudioPageJson(candidate)
assert.equal(validated.content.length,18)
assert.deepEqual(validated.root,candidate.root)
console.log('PASS HOMEPAGE_P11_RUNTIME_FIXTURE')
console.log('PASS REPLACE_ROOT_CANONICAL_IDENTITY_ONLY')
console.log('PASS ROOT_CONTAMINATION_REMOVED')
console.log('PASS WORLD_SECTIONS=18')
console.log('PASS VALIDATE_STUDIO_PAGE_JSON')
console.log('PASS P11_DOCUMENT_INTEGRITY_CANDIDATE')
