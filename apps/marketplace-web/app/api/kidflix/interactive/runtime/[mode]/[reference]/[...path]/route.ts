import { createServiceClient } from '@/lib/supabase/server';
import { KF_PACKAGE_BUCKET,KF_PACKAGE_TABLE,type PackageRow } from '@/angelcare-marketplace/kidflix/interactive/service';
import { applicationOrigin,runtimeOrigin,safePackagePath,sha256,verifyPreviewToken } from '@/angelcare-marketplace/kidflix/interactive/package';
import {previewStudioScript} from '@/angelcare-marketplace/kidflix/interactive/preview-studio-script';
import {randomBytes} from 'node:crypto';
export const dynamic='force-dynamic';export const runtime='nodejs';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const headers={'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const error=(x:string,s=404)=>new Response(x,{status:s,headers});
function trustedRuntimeHost(request:Request){
  const u=new URL(runtimeOrigin());const requestHost=request.headers.get('host');
  // Do not serve untrusted code through the privileged KidFlix application origin.
  if(!requestHost||requestHost.toLowerCase()!==u.host.toLowerCase())throw Error('RUNTIME_HOST_NOT_ISOLATED');
}
function frameAncestors(){
  // KIDFLIX_RUNTIME_ROOT_HOST_BRIDGE_R1: exactly two allowed first-party parents.
  // The request Host enforcement remains strict and unchanged.
  const app=applicationOrigin();
  return app==='https://my.angelcarehub.com'
    ? 'https://my.angelcarehub.com https://angelcarehub.com' : app;
}
function officialLogo(){
  const path=process.env.KIDFLIX_OFFICIAL_LOGO_PATH||'/kidflix/kidflix-official.png';
  // A host-owned official asset only. Never accept a logo URL supplied by the ZIP.
  if(!/^\/[A-Za-z0-9/_\-.]+\.png$/.test(path)||path.includes('..'))throw Error('OFFICIAL_KIDFLIX_LOGO_NOT_CONFIGURED');
  return path;
}
function brandOverlay(){
  const logo=officialLogo();
  // The host injects this outside package control. CSP allows the isolated origin's own PNG.
  return `<div id="kidflix-host-authenticity" role="contentinfo"><img src="${logo}" alt="KidFlix" width="64" height="22"><span>KidFlix · Official educational experience</span></div>`;
}
function htmlShell(html:string,previewNonce?:string,parentOrigin?:string){
  // HTML is executed only on the separate origin with a strict CSP.
  if(!/<\/body\s*>/i.test(html))throw Error('HTML_BODY_REQUIRED');
  const style=`<style>#kidflix-host-authenticity{position:fixed!important;right:10px!important;bottom:10px!important;z-index:2147483647!important;display:flex!important;align-items:center!important;gap:5px!important;background:rgba(255,255,255,.92)!important;border:1px solid rgba(25,42,70,.13)!important;border-radius:8px!important;padding:3px 5px!important;font:9px/1.2 system-ui,sans-serif!important;color:#56606f!important;pointer-events:none!important;max-width:150px!important;box-shadow:0 1px 6px rgba(0,0,0,.08)!important}#kidflix-host-authenticity img{display:block!important;max-height:22px!important;max-width:64px!important;object-fit:contain!important}#kidflix-host-authenticity span{font-size:8px!important;max-width:73px!important}</style>`;
  // KF_EXPERIENCE_STUDIO_ULTIMATE_20261103 — the inspector exists only in signed previews.
  const instrumentation=previewNonce&&parentOrigin
    ? '<script nonce="'+previewNonce+'">'+previewStudioScript(parentOrigin)+'</script>' : '';
  return html.replace(/<\/body\s*>/i,style+brandOverlay()+instrumentation+'</body>');
}
export async function GET(req:Request,{params}:{params:Promise<{mode:string;reference:string;path:string[]}>}){
  try{
    trustedRuntimeHost(req);const {mode,reference,path}=await params;
    if(!['preview','release'].includes(mode)||path.length<2)return error('INVALID_RUNTIME_PATH');
    const id=path[0];if(!ID.test(id))return error('INVALID_PACKAGE');
    const relative=safePackagePath(path.slice(1).join('/'));
    const db=await createServiceClient();
    const read=await db.from(KF_PACKAGE_TABLE).select('*').eq('id',id).maybeSingle();
    if(read.error||!read.data)return error('PACKAGE_UNAVAILABLE');
    const p=read.data as PackageRow;
    if(p.state!=='validated'&&p.state!=='published')return error('PACKAGE_UNAVAILABLE');
    if(mode==='preview'){
      if(!verifyPreviewToken(reference,id))return error('PREVIEW_EXPIRED_OR_INVALID',403);
    }else{
      if(!ID.test(reference))return error('PUBLISHED_RELEASE_MISMATCH',403);
      // Published release snapshots are immutable authorities. A later publication
      // must never make a historical release's player disappear by changing a
      // mutable 'latest release' pointer on the package row.
      const release=await db.from('ac_dce_releases')
        .select('id,record_id,state,snapshot,manifest,tenant_id,territory_id')
        .eq('id',reference).eq('state','published').maybeSingle();
      if(release.error||!release.data)return error('RELEASE_NOT_ACTIVE');
      const releaseScope=(release.data.tenant_id||'~')+'|'+(release.data.territory_id||'~');
      if(releaseScope!==p.scope_key||(p.record_id&&p.record_id!==release.data.record_id))
        return error('RELEASE_SCOPE_MISMATCH',403);
      const projected=(release.data.manifest as any)?.definition?.interactivePackage||(release.data.snapshot as any)?.data?.interactivePackage;
      if(projected?.id!==id||projected?.checksum!==p.checksum_sha256||
        projected?.locale!==(release.data.manifest as any)?.editionLocale||
        projected?.entry!==p.entry_path)return error('PACKAGE_RELEASE_CONTRACT_MISMATCH',403);
    }
    const meta=p.file_index?.[relative];if(!meta)return error('FILE_NOT_IN_VALIDATED_MANIFEST');
    const base=p.scope_key.replace(/[^a-zA-Z0-9_-]/g,'_')+'/'+id+'/files/'+relative;
    const f=await db.storage.from(KF_PACKAGE_BUCKET).download(base);
    if(f.error||!f.data)return error('PACKAGE_OBJECT_UNAVAILABLE');
    const bytes=Buffer.from(await f.data.arrayBuffer());
    if(bytes.length!==meta.size||sha256(bytes)!==meta.sha256)return error('PACKAGE_INTEGRITY_MISMATCH',503);
    const isHtml=meta.mime.startsWith('text/html');
    const origin=applicationOrigin();if(isHtml)officialLogo();
    const nonce=isHtml&&mode==='preview'?randomBytes(18).toString('base64'):undefined;
    const content=isHtml?htmlShell(bytes.toString('utf8'),nonce,origin):new Uint8Array(bytes);
    // Sandbox is enforced by the response, even if opened directly.
// Without allow-same-origin, executable HTML has an opaque origin.
    const assetOrigin=runtimeOrigin();
    const csp=[
      ...(isHtml?['sandbox allow-scripts']:[]),
      "default-src 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      "form-action 'none'",
      "frame-src 'none'",
      `script-src ${assetOrigin} 'wasm-unsafe-eval'${nonce?" 'nonce-"+nonce+"'":''}`,
      `style-src ${assetOrigin} 'unsafe-inline'`,
      `img-src ${assetOrigin} data: blob:`,
      `font-src ${assetOrigin} data:`,
      `media-src ${assetOrigin} blob:`,
      "connect-src 'none'",
      "worker-src 'none'",
      `frame-ancestors ${frameAncestors()}`
    ].join('; ');
    return new Response(content,{headers:{'Content-Type':meta.mime,'Content-Security-Policy':csp,...(isHtml?{}:{'Access-Control-Allow-Origin':'*'}),'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'private,no-store','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()'}});
  }catch(e){return error('INTERACTIVE_RUNTIME_UNAVAILABLE',503)}
}
