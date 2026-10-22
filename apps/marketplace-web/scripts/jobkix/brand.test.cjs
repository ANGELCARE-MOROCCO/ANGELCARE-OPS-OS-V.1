const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict'),sharp=require('sharp'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),registry=JSON.parse(fs.readFileSync(path.join(root,'docs/jobkix/brand-register.json')));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('all three approved source masters and eight registered derivatives are present and hash verified',async()=>{
 assert.equal(registry.originals.length,3);assert.equal(registry.derivatives.length,8);
 for(const record of registry.originals){const bytes=fs.readFileSync(path.join(root,record.preservedPath)),m=await sharp(bytes).metadata();assert.equal(sha(bytes),record.sha256);assert.deepEqual([m.width,m.height],record.dimensions);}
 for(const record of registry.derivatives){const bytes=fs.readFileSync(path.join(root,record.path)),m=await sharp(bytes).metadata();assert.equal(sha(bytes),record.sha256);assert.equal(bytes.length,record.bytes);assert.deepEqual([m.width,m.height],[record.width,record.height]);}
});
for(const role of ['color','white'])test(role+' logo has real transparency, exact interior source RGB and preserved crop geometry',async()=>{
 const record=registry.derivatives.find(row=>row.path.endsWith('logo-'+role+'.png')),source=await sharp(path.join(root,record.source)).removeAlpha().raw().toBuffer({resolveWithObject:true}),output=await sharp(path.join(root,record.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,partial=0,interior=0;
 for(let y=0;y<output.info.height;y++)for(let x=0;x<output.info.width;x++){
  const i=(y*output.info.width+x)*4,a=output.data[i+3];if(a===0)transparent++;else if(a<255)partial++;
  const original=((y+record.crop.top)*source.info.width+x+record.crop.left)*3,r=source.data[original],g=source.data[original+1],b=source.data[original+2];
  const seed=(role==='color'?Math.max(r,g,b)<115:Math.min(r,g,b)>215)||(b>225&&r<130&&g<140)||(r>240&&g<165&&b<155);
  if(seed){assert.equal(a,255);assert.deepEqual([...output.data.subarray(i,i+3)],[r,g,b]);interior++;}
  if(x<8||y<8||x>=output.info.width-8||y>=output.info.height-8)assert.equal(a,0,'Transparent padding must surround the complete mark');
 }
 assert.equal(interior,record.opaqueSourcePixelsPreserved);assert.ok(interior>100000);assert.ok(transparent>output.info.width*output.info.height*.4);assert.ok(partial>100);
});
test('favicon exports are exact proportional resizes of the original supplied icon',async()=>{
 const original=registry.originals.find(row=>row.preservedPath.endsWith('-favicon.png'));
 for(const record of registry.derivatives.filter(row=>row.source===original.preservedPath)){
  const expected=await sharp(path.join(root,original.preservedPath)).resize(record.width,record.height,{fit:'contain',kernel:'lanczos3'}).raw().toBuffer(),actual=await sharp(path.join(root,record.path)).raw().toBuffer();assert.deepEqual(actual,expected);
 }
});
test('JOBKIX native icon descriptors point only to the registered JOBKIX namespace',()=>{
 const file=path.join(root,'angelcare-marketplace/jobkix/brand.ts'),compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,loaded={exports:{}};
 new Function('module','exports',compiled)(loaded,loaded.exports);const icons=loaded.exports.jobkixIcons();
 for(const entry of [...icons.icon,...icons.apple,...icons.shortcut])assert.ok(registry.derivatives.some(row=>'/'+row.path.replace(/^public\//,'')===entry.url));
 assert.deepEqual(icons.icon.map(row=>row.sizes),['16x16','32x32','48x48']);
});
test('native localized route owns JOBKIX social identity and icons for all seven languages',async()=>{
 const owned=path.join(root,'angelcare-marketplace/jobkix'),cache=new Map();
 function pure(name){const file=path.join(owned,name+'.ts');if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',compiled)(name=>{assert.ok(name.startsWith('./'));return pure(name.slice(2));},m,m.exports);cache.set(file,m.exports);return m.exports;}
 const source=ts.createSourceFile('layout.tsx',fs.readFileSync(path.join(root,'app/jobkix/[locale]/layout.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),fn=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='generateMetadata');assert.ok(fn);
 const m={exports:{}},compiled=ts.transpileModule(fn.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('module','exports','isLocale','t','jobkixIcons',compiled)(m,m.exports,pure('contracts').isLocale,pure('i18n').t,pure('brand').jobkixIcons);
 for(const locale of pure('contracts').LOCALES){const metadata=await m.exports.generateMetadata({params:Promise.resolve({locale})});assert.equal(metadata.applicationName,'JOBKIX');assert.equal(metadata.alternates.canonical,'/jobkix/'+locale);assert.equal(metadata.openGraph.siteName,'JOBKIX');assert.equal(metadata.twitter.card,'summary');assert.deepEqual(metadata.icons,pure('brand').jobkixIcons());assert.equal(metadata.description,pure('i18n').t(locale,'heroDescription'));}
 assert.deepEqual(await m.exports.generateMetadata({params:Promise.resolve({locale:'unsupported'})}),{robots:{index:false,follow:false}});
});
test('protected favicon/storefront bytes remain intact; only the explicitly approved KidFlix CSS repair is allowed',()=>{
 assert.equal(registry.protectedSources.length,4);
 for(const record of registry.protectedSources){const amendment=record.approvedAmendment;if(amendment){assert.equal(amendment.beforeSha256,record.sha256);const approved=JSON.parse(fs.readFileSync(path.join(root,amendment.scope))),entry=approved.files.find(row=>row.path===record.path);assert.equal(entry.baselineSha256,record.sha256);assert.equal(entry.proposedSha256,amendment.afterSha256);assert.equal(sha(fs.readFileSync(path.join(root,entry.originalPath))),record.sha256);}assert.equal(sha(fs.readFileSync(path.join(root,record.path))),amendment?.afterSha256||record.sha256,record.path);}
 const relative='angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx',shared=JSON.parse(fs.readFileSync(path.join(root,'docs/jobkix/shared-file-register.json'))),actual=fs.readFileSync(path.join(root,relative),'utf8');
 const original=actual.replace("import {MarketplaceBrandPair} from '../../jobkix/MarketplaceEntry'\n",'').replaceAll('<MarketplaceBrandPair><KidFlixMarketplaceEntry/></MarketplaceBrandPair>','<KidFlixMarketplaceEntry/>');
 assert.equal(sha(original),shared.find(entry=>entry.path.endsWith('/'+relative)).baselineSha256);
});
test('actual server-rendered brand pair retains English destinations, accessible names and LTR order',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 function load(relative){const file=path.join(root,relative),loaded={exports:{}},compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','module','exports',compiled)(name=>name.endsWith('.module.css')?{default:{pair:'pair',entry:'entry',header:'header'}}:require(name),loaded,loaded.exports);return loaded.exports;}
 const {MarketplaceBrandPair}=load('angelcare-marketplace/jobkix/MarketplaceEntry.tsx'),{KidFlixMarketplaceEntry}=load('angelcare-marketplace/kidflix/MarketplaceEntry.tsx');
 const html=renderToStaticMarkup(React.createElement(MarketplaceBrandPair,null,React.createElement(KidFlixMarketplaceEntry)));
 assert.match(html,/<span class="pair" dir="ltr">/);assert.ok(html.indexOf('href="/kidflix/en"')<html.indexOf('href="/jobkix/en"'));assert.match(html,/aria-label="JOBKIX · GLOBAL CAREERS PLATFORM"/);assert.equal((html.match(/<a /g)||[]).length,2);
});
