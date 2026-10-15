import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'../..'),out=process.env.DCE_PREVIEW_OUT||'/private/tmp/angelcare-dce-20261014/preview'
const esbuild=require(process.env.DCE_ESBUILD||'/Users/user/.npm/_npx/fd45a72a545557e9/node_modules/esbuild')
mkdirSync(out,{recursive:true})
const auth=readFileSync(path.join(root,'angelcare-marketplace/auth/context.ts'),'utf8'),start=auth.indexOf('export function hasMarketplacePermission('),end=auth.indexOf('\nexport function hasMarketplaceWorkspaceAccess',start)
const nativeAuth="import {accessWorkspaceKeyForPermission,isSensitiveWorkspacePermission} from '"+path.join(root,'angelcare-marketplace/workspace-access/catalog')+"';\n"+auth.slice(start,end)
await esbuild.build({entryPoints:[path.join(root,'scripts/dce-completion/client.tsx')],outfile:path.join(out,'client.js'),bundle:true,platform:'browser',jsx:'automatic',sourcemap:true,loader:{'.css':'local-css'},plugins:[{name:'isolated-next-navigation',setup(build){build.onResolve({filter:/^next\/(link|navigation)$/},args=>({path:args.path,namespace:'isolated-next'}));build.onLoad({filter:/.*/,namespace:'isolated-next'},args=>({resolveDir:root,loader:'tsx',contents:args.path==='next/link'?`export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}`:`export function useRouter(){return {replace:url=>location.assign(url),push:url=>location.assign(url)}};export function useSearchParams(){return new URLSearchParams(location.search)}`}))}}]})
await esbuild.build({entryPoints:[path.join(root,'angelcare-marketplace/digital-customer-experience/repository.ts')],outfile:path.join(out,'repository.cjs'),bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'isolated-authorities',setup(build){
 build.onResolve({filter:/^@\/lib\/supabase\/server$/},()=>({path:'database',namespace:'isolated'}));
 build.onResolve({filter:/\/auth\/context$/},()=>({path:'native-auth',namespace:'isolated'}));
 build.onResolve({filter:/commerce-studio\/media-storage$/},()=>({path:'media',namespace:'isolated'}));
 build.onLoad({filter:/.*/,namespace:'isolated'},args=>({resolveDir:root,loader:'ts',contents:args.path==='database'?'export async function createServiceClient(){return globalThis.__DCE_TEST_DB}':args.path==='native-auth'?nativeAuth:`export function marketplaceMediaStorageConfiguration(){return {configured:false}};export function createMarketplaceMediaDeliveryUrl(){throw Error('Native gateway excluded from isolated tests')};export function fetchMarketplaceGatewayAsset(){throw Error('Native gateway excluded from isolated tests')}`}))
 }}]})
await esbuild.build({entryPoints:[path.join(root,'angelcare-marketplace/digital-customer-experience/model.ts')],outfile:path.join(out,'model.cjs'),bundle:true,platform:'node',format:'cjs'})
await esbuild.build({entryPoints:[path.join(root,'angelcare-marketplace/digital-customer-experience/imports.ts')],outfile:path.join(out,'imports.cjs'),bundle:true,platform:'node',format:'cjs'})
await esbuild.build({entryPoints:[path.join(root,'angelcare-marketplace/digital-customer-experience/capabilities.ts')],outfile:path.join(out,'capabilities.cjs'),bundle:true,platform:'node',format:'cjs'})
await esbuild.build({entryPoints:[path.join(root,'angelcare-marketplace/digital-customer-experience/registry.ts')],outfile:path.join(out,'registry.cjs'),bundle:true,platform:'node',format:'cjs'})
writeFileSync(path.join(out,'index.html'),'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/client.css"><title>DCE isolated verification</title><style>body{margin:0;background:#f5f9ff}button,input,textarea,select{font:inherit}</style></head><body><div id="root"></div><script src="/client.js"></script></body></html>')
console.log('Isolated DCE bundle prepared in '+out)
