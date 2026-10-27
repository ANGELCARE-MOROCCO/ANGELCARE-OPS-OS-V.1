import esbuild from 'esbuild';import path from 'node:path';
export const plugins=[{name:'test-sources',setup(build){build.onLoad({filter:/\.ts\.txt$/},async args=>({contents:await (await import('node:fs/promises')).readFile(args.path,'utf8'),loader:'ts'}));}},{name:'native-fixtures',setup(build){
 build.onResolve({filter:/^(server-only|next\/cache|next\/server|next\/headers)$/},args=>({path:args.path,namespace:'fixture'}));
 build.onResolve({filter:/auth\/context$/},()=>({path:path.resolve('scripts/seo-power-tests/fixture-auth.ts.txt')}));
 build.onResolve({filter:/^@\/lib\/supabase\/server$/},()=>({path:path.resolve('scripts/seo-power-tests/fixture-supabase.ts.txt')}));
 build.onResolve({filter:/storefront-navigation$/},()=>({path:'navigation',namespace:'fixture'}));
 build.onResolve({filter:/^\.\/crawler$/},args=>args.importer.endsWith('actions.ts')||args.importer.endsWith('runner.ts')?{path:path.resolve('scripts/seo-power-tests/fixture-crawler.ts.txt')}:null);
 build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='next/headers'?`export const headers=async()=>new Headers({'host':'my.angelcarehub.com'});`:args.path==='next/server'?`export class NextResponse extends Response{static json(data,init={}){return new NextResponse(JSON.stringify(data),{...init,headers:{'Content-Type':'application/json',...init.headers}})}}`:args.path==='next/cache'?`export const unstable_cache=(fn)=>fn;export const revalidateTag=()=>{};export const revalidatePath=()=>{};`:args.path==='navigation'?`export const getPublicStorefrontNavigation=()=>[];`:'export {};'}));
 build.onLoad({filter:/\.module\.css$/},()=>({contents:'export default {};',loader:'js'}));
}}];
await esbuild.build({entryPoints:['scripts/seo-power-tests/api-entry.ts.txt'],outfile:'scripts/seo-power-tests/api-bundle.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',jsx:'automatic',plugins});
