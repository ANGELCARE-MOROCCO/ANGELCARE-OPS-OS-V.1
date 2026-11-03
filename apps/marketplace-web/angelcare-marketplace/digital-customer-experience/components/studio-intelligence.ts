/* KidFlix Studio static project inspector. Never executes package-authored code. */
export type StudioFile = {path:string;size:number;mime:string;sha256:string};
export type StudioIssue = {code:string;severity:'error'|'warning'|'info';file:string;message:string;action?:string};
export type StudioReport = {
  files:number;bytes:number;images:number;audio:number;video:number;fonts:number;scripts:number;styles:number;html:number;
  interactiveControls:number;editableElements:number;externalReferences:number;localReferences:number;
  issues:StudioIssue[];filesChecked:number;filesUnread:number;frameworks:string[];potentialScenes:number;
};
const EXT=(name:string)=>name.split('.').pop()?.toLowerCase()||'';
const SOURCE=new Set(['html','htm','css','js','mjs','json','svg']);
const RESOURCE_ATTR=/(?:\bsrc|\bhref|\bposter)\s*=\s*["']([^"']+)["']/gi;
const JS_IMPORT=/(?:import\s*(?:[^;]*?\s+from\s*)?|import\s*\()\s*["']([^"']+)["']/gi;
const CSS_URL=/\burl\(\s*["']?([^"')]+)["']?\s*\)/gi;
const REMOTE=/^(?:https?:|\/\/|data:|blob:|mailto:|tel:)/i;
function cleanReference(path:string){return path.split(/[?#]/,1)[0];}
function relativePath(parent:string,ref:string){
 const dir=parent.split('/').slice(0,-1);let decoded='';try{decoded=decodeURI(cleanReference(ref))}catch{return null}for(const seg of decoded.split('/')){
  if(!seg||seg==='.')continue;
  if(seg==='..'){if(!dir.length)return null;dir.pop()}else dir.push(seg);
 }return dir.join('/');
}
function sourceRefs(file:string,src:string){
 const ext=EXT(file),refs:string[]=[];
 if(ext==='html'||ext==='htm'){for(const m of src.matchAll(RESOURCE_ATTR))refs.push(m[1]);}
 if(ext==='css'){for(const m of src.matchAll(CSS_URL))refs.push(m[1]);}
 if(ext==='js'||ext==='mjs'){for(const m of src.matchAll(JS_IMPORT))refs.push(m[1]);}
 return refs;
}
export function inspectStudioProject(files:StudioFile[],sources:Record<string,string>,entry='index.html'):StudioReport {
 const issues:StudioIssue[]=[],map=new Map(files.map(f=>[f.path,f]));
 const exts=files.map(f=>EXT(f.path));
 const count=(fn:(f:StudioFile)=>boolean)=>files.filter(fn).length;
 const html=count(f=>['html','htm'].includes(EXT(f.path))),scripts=count(f=>['js','mjs'].includes(EXT(f.path)));
 const styles=count(f=>EXT(f.path)==='css'),images=count(f=>/^image\//.test(f.mime)),audio=count(f=>/^audio\//.test(f.mime)),video=count(f=>/^video\//.test(f.mime)),fonts=count(f=>/^font\//.test(f.mime));
 const report:StudioReport={files:files.length,bytes:files.reduce((n,f)=>n+f.size,0),images,audio,video,fonts,scripts,styles,html,interactiveControls:0,editableElements:0,externalReferences:0,localReferences:0,issues,filesChecked:0,filesUnread:0,frameworks:[],potentialScenes:0};
 const add=(severity:StudioIssue['severity'],code:string,file:string,message:string,action?:string)=>issues.push({severity,code,file,message,action});
 if(!map.has(entry))add('error','MISSING_ENTRY',entry,'The declared HTML entry point does not exist.');
 if(!map.has('kidflix.manifest.json'))add('error','MISSING_MANIFEST','kidflix.manifest.json','Package manifest is missing.');
 const observed=new Set<string>(),frameworks=new Set<string>();
 for(const f of files){
  if(!SOURCE.has(EXT(f.path)))continue;
  const src=sources[f.path];if(src===undefined){report.filesUnread++;continue}
  report.filesChecked++;
  if(['html','htm'].includes(EXT(f.path))){
   report.interactiveControls+=(src.match(/<(?:button|select|input|textarea|details|canvas)\b/gi)||[]).length;
   report.editableElements+=(src.match(/\bdata-kf-edit\s*=/gi)||[]).length;
   report.potentialScenes+=(src.match(/\b(?:data-scene|data-step|data-slide)\s*=/gi)||[]).length;
   if(!/<html\b[^>]*\blang\s*=/i.test(src))add('warning','LANG_MISSING',f.path,'Document language is missing; set html lang to the chosen FR, EN or AR edition.');
   if(!/<meta\s+name\s*=\s*["']viewport["']/i.test(src))add('warning','VIEWPORT_MISSING',f.path,'Responsive viewport metadata is missing.');
   if(/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(src))add('warning','IMAGE_ALT_MISSING',f.path,'At least one image has no alt attribute.');
   if(/<iframe\b/i.test(src))add('warning','NESTED_FRAME',f.path,'Nested frames need review under the isolated KidFlix runtime policy.');
   if(/<script\b[^>]*>\s*[^\s<]/i.test(src))add('warning','INLINE_SCRIPT',f.path,'Inline scripts are incompatible with the standard executable-package policy.');
  }
  if(['js','mjs'].includes(EXT(f.path))){
   if(/\bReact\b|from\s+["']react(?:\/|["'])/i.test(src))frameworks.add('React');
   if(/\bPhaser\b|from\s+["']phaser/i.test(src))frameworks.add('Phaser');
   if(/\bTHREE\b|three(?:\.module)?/i.test(src))frameworks.add('Three.js');
   if(/\bPIXI\b|pixi\.js/i.test(src))frameworks.add('PixiJS');
   if(/\bWebGLRenderingContext\b|\.getContext\(["']webgl/i.test(src))frameworks.add('WebGL');
   if(/\bWebAssembly\b/i.test(src))frameworks.add('WebAssembly');
   if(/new\s+Worker\s*\(/i.test(src))frameworks.add('Web Workers');
  }
  for(const ref of sourceRefs(f.path,src)){
   if(ref.startsWith('#')||ref.startsWith('javascript:')){if(ref.startsWith('javascript:'))add('error','JAVASCRIPT_URI',f.path,'JavaScript URI found in source.');continue}
   if(REMOTE.test(ref)){report.externalReferences++;if(/^https?:|^\/\//i.test(ref))add('warning','EXTERNAL_RESOURCE',f.path,`External dependency detected: ${ref.slice(0,120)}`);continue}
   if(ref.startsWith('/')){add('warning','ROOT_ABSOLUTE_PATH',f.path,`Root-relative path may not resolve in a packaged runtime: ${ref.slice(0,120)}`);continue}
   const target=relativePath(f.path,ref);if(target===null){add('error','REFERENCE_ESCAPE',f.path,`Asset reference leaves the package: ${ref}`);continue}
   report.localReferences++;
   if(!map.has(target)&&!observed.has(f.path+'|'+target)){
    observed.add(f.path+'|'+target);
    // JavaScript import aliases and bare package specifiers may be transformed by a build step.
    if(!ref.startsWith('.')&&!ref.includes('/')&&['js','mjs'].includes(EXT(f.path)))continue;
    add('warning','MISSING_ASSET',f.path,`Referenced asset not found: ${target}`,'Inspect the path or bundle the missing resource.');
   }
  }
 }
 report.frameworks=[...frameworks].sort();
 if(!html)add('error','NO_HTML','index.html','No HTML document was found in this package.');
 if(report.interactiveControls===0)add('info','NO_CONTROLS',entry,'No conventional interactive controls were detected in the inspected HTML. A canvas-based game may be valid.');
 if(report.editableElements===0)add('info','NO_EDITABLE_MARKERS',entry,'Use data-kf-edit on key elements to enable stable visual-property editing.');
 if(report.filesUnread)add('info','PARTIAL_SOURCE_INSPECTION',entry,`${report.filesUnread} source files could not be inspected within safe read limits.`);
 report.issues=issues.sort((a,b)=>({error:0,warning:1,info:2}[a.severity]-{error:0,warning:1,info:2}[b.severity]));
 return report;
}
