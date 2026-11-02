/**
 * KIDFLIX_UNIVERSAL_INTERACTIVE, native package contract.
 * No trusted content is read from ZIP filenames or browser-provided MIME types.
 * The package is executable only on a separately configured runtime origin.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

export const KF_FAMILIES = [
  'documents','printables','stories','learning','video','audio','visual-cards',
  'presentations','assessments','activities','tools','planners','forms',
  'community','commerce','bundles',
] as const;
export type KfLocale = 'fr' | 'en' | 'ar';
export type KfFile = { path:string; bytes:Buffer; mime:string; hash:string };
export type KfPackage = {
  manifest: Record<string,unknown> & { family_key:string; target_locale:KfLocale };
  files: KfFile[];
  checksum:string;
  entry:string;
  bytes:number;
};
const MAX_ZIP = 64*1024*1024;
const MAX_UNCOMPRESSED = 160*1024*1024;
const MAX_ENTRY = 36*1024*1024;
const MAX_COUNT = 1600;
const EXT: Record<string,string> = {
  html:'text/html; charset=utf-8', htm:'text/html; charset=utf-8',
  css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8',
  mjs:'text/javascript; charset=utf-8', json:'application/json; charset=utf-8',
  png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp',
  gif:'image/gif', avif:'image/avif', svg:'image/svg+xml',
  mp3:'audio/mpeg', ogg:'audio/ogg', wav:'audio/wav',
  mp4:'video/mp4', webm:'video/webm', vtt:'text/vtt; charset=utf-8',
  woff:'font/woff', woff2:'font/woff2', wasm:'application/wasm',
  glb:'model/gltf-binary', gltf:'model/gltf+json', bin:'application/octet-stream',
  txt:'text/plain; charset=utf-8',md:'text/markdown; charset=utf-8',csv:'text/csv; charset=utf-8',
};
const sha = (b:Buffer) => createHash('sha256').update(b).digest('hex');
const utf8 = new TextDecoder('utf-8',{fatal:true});
const crcTable = Array.from({length:256},(_,n)=>{
  let c=n;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
export function crc32(buf:Buffer):number {
  let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
export function safePackagePath(s:string):string {
  if(!s||s.length>512||s.includes('\\')||s.includes('\0')||s.startsWith('/')||/^[a-z]:/i.test(s)) throw Error('UNSAFE_ARCHIVE_PATH');
  const p=s.replace(/^\.\//,'');
  if(p.split('/').some(x=>!x||x==='.'||x==='..') || /[\x00-\x1f\x7f]/.test(p))throw Error('UNSAFE_ARCHIVE_PATH');
  if(p.startsWith('__MACOSX/')||p.startsWith('.DS_Store')) throw Error('FORBIDDEN_ARCHIVE_ENTRY');
  return p;
}
const u64=(b:Buffer,p:number)=>{
  const n=b.readBigUInt64LE(p);
  if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('ZIP64_TOO_LARGE');
  return Number(n);
};
function zip64Values(b:Buffer,p:number,length:number,needSize:boolean,needCompressed:boolean,needOffset:boolean){
  let vals:{size?:number;compressed?:number;offset?:number}={};
  for(let i=p;i+4<=p+length;){
    const id=b.readUInt16LE(i),n=b.readUInt16LE(i+2),start=i+4; if(start+n>p+length)throw Error('CORRUPTED_ZIP_EXTRA');
    if(id===1){let q=start; if(needSize){if(q+8>start+n)throw Error('INVALID_ZIP64');vals.size=u64(b,q);q+=8}if(needCompressed){if(q+8>start+n)throw Error('INVALID_ZIP64');vals.compressed=u64(b,q);q+=8}if(needOffset){if(q+8>start+n)throw Error('INVALID_ZIP64');vals.offset=u64(b,q)}return vals}
    i=start+n;
  }
  throw Error('MISSING_ZIP64_EXTRA');
}
export function inspectZip(input:Buffer):KfPackage {
  if(input.length<22||input.length>MAX_ZIP)throw Error('ZIP_SIZE_OUT_OF_RANGE');
  let end=-1;for(let i=input.length-22;i>=Math.max(0,input.length-65557);i--){
    if(input.readUInt32LE(i)===0x06054b50&&i+22+input.readUInt16LE(i+20)===input.length){end=i;break}
  }
  if(end<0)throw Error('INVALID_ZIP_CENTRAL_DIRECTORY');
  const count=input.readUInt16LE(end+10),centralSize=input.readUInt32LE(end+12),centralOffset=input.readUInt32LE(end+16);
  if(count<1||count>MAX_COUNT||count===0xffff||centralSize===0xffffffff||centralOffset===0xffffffff)throw Error('ZIP_ENTRY_COUNT_OR_DIRECTORY_UNSUPPORTED');
  if(input.readUInt16LE(end+8)!==count||input.readUInt16LE(end+4)!==0||input.readUInt16LE(end+6)!==0)throw Error('MULTI_DISK_ZIP_UNSUPPORTED');
  if(centralOffset+centralSize>end)throw Error('INVALID_CENTRAL_DIRECTORY_RANGE');
  const files:KfFile[]=[],seen=new Set<string>();let cursor=centralOffset,total=0;
  for(let n=0;n<count;n++){
    if(cursor+46>centralOffset+centralSize||input.readUInt32LE(cursor)!==0x02014b50)throw Error('CORRUPTED_CENTRAL_DIRECTORY');
    const flags=input.readUInt16LE(cursor+8),method=input.readUInt16LE(cursor+10),crc=input.readUInt32LE(cursor+16);
    let packed=input.readUInt32LE(cursor+20),size=input.readUInt32LE(cursor+24),off=input.readUInt32LE(cursor+42);
    const nameLen=input.readUInt16LE(cursor+28),extraLen=input.readUInt16LE(cursor+30),commentLen=input.readUInt16LE(cursor+32),attr=input.readUInt32LE(cursor+38);
    const next=cursor+46+nameLen+extraLen+commentLen;
    if(next>centralOffset+centralSize)throw Error('CORRUPTED_CENTRAL_ENTRY');
    const name=utf8.decode(input.subarray(cursor+46,cursor+46+nameLen));
    cursor=next;
    if(name.endsWith('/'))continue;
    if(flags&1||!([0,8].includes(method))||((attr>>>16)&0xf000)===0xa000)throw Error('UNSUPPORTED_OR_UNSAFE_ZIP_MEMBER');
    if(size===0xffffffff||packed===0xffffffff||off===0xffffffff){
      const z=zip64Values(input,next-commentLen-extraLen,extraLen,size===0xffffffff,packed===0xffffffff,off===0xffffffff);
      size=z.size??size;packed=z.compressed??packed;off=z.offset??off;
    }
    let path=safePackagePath(name);
    if(path.startsWith('._')||path.includes('/._'))throw Error('FORBIDDEN_ARCHIVE_ENTRY');
    const canonical=path.toLowerCase();if(seen.has(canonical))throw Error('DUPLICATE_PACKAGE_FILE');seen.add(canonical);
    const ext=path.split('.').pop()?.toLowerCase()||'';
    if(!EXT[ext])throw Error('UNSUPPORTED_PACKAGE_FILE_TYPE: '+path);
    if(size>MAX_ENTRY||packed>MAX_ZIP||total+size>MAX_UNCOMPRESSED)throw Error('PACKAGE_DECOMPRESSION_LIMIT');
    if(packed && size/packed>150)throw Error('ZIP_COMPRESSION_RATIO_LIMIT');
    if(off+30>input.length||input.readUInt32LE(off)!==0x04034b50)throw Error('INVALID_ZIP_LOCAL_HEADER');
    if(input.readUInt16LE(off+8)!==method)throw Error('ZIP_HEADER_METHOD_MISMATCH');
    const localNameLength=input.readUInt16LE(off+26),localExtraLength=input.readUInt16LE(off+28);
    const localName=utf8.decode(input.subarray(off+30,off+30+localNameLength));
    if(localName!==name)throw Error('ZIP_HEADER_FILENAME_MISMATCH');
    const dataAt=off+30+localNameLength+localExtraLength;
    if(dataAt+packed>centralOffset)throw Error('ZIP_DATA_OUT_OF_BOUNDS');
    const compressed=input.subarray(dataAt,dataAt+packed);
    const bytes=method===0?Buffer.from(compressed):inflateRawSync(compressed,{maxOutputLength:MAX_ENTRY});
    if(bytes.length!==size||crc32(bytes)!==crc)throw Error('ZIP_CRC_OR_SIZE_MISMATCH: '+path);
    total+=size;files.push({path,bytes,mime:EXT[ext],hash:sha(bytes)});
  }
  if(cursor!==centralOffset+centralSize)throw Error('ZIP_TRAILING_DIRECTORY_BYTES');
  // macOS folder dropping may wrap the project once; support one clean root.
  const direct=files.some(f=>f.path==='kidflix.manifest.json');
  if(!direct){const roots=[...new Set(files.map(x=>x.path.split('/')[0]))];if(roots.length!==1)throw Error('MISSING_PACKAGE_MANIFEST');const prefix=roots[0]+'/';for(const f of files)f.path=safePackagePath(f.path.slice(prefix.length));}
  const mf=files.find(x=>x.path==='kidflix.manifest.json');if(!mf||mf.bytes.length>128*1024)throw Error('MISSING_OR_OVERSIZED_MANIFEST');
  let m:Record<string,unknown>;try{m=JSON.parse(utf8.decode(mf.bytes))}catch{throw Error('INVALID_MANIFEST_JSON')}
  if(m.contract!=='KIDFLIX_UNIVERSAL_INTERACTIVE')throw Error('INVALID_UNIVERSAL_CONTRACT');
  const family=String(m.family_key||'');if(!KF_FAMILIES.includes(family as typeof KF_FAMILIES[number]))throw Error('INVALID_ATOMIC_FAMILY');
  const locale=String(m.target_locale||'');if(!['fr','en','ar'].includes(locale))throw Error('INVALID_OR_MISSING_TARGET_LOCALE');
  if(m.required_locales && (JSON.stringify(m.required_locales)!==JSON.stringify([locale])))throw Error('ONLY_REQUESTED_LOCALE_ALLOWED');
  const runtime=m.runtime as Record<string,unknown>||{};
  if(runtime.kind!=='sandboxed-web-app')throw Error('INVALID_RUNTIME_KIND');
  const entry=safePackagePath(String(runtime.entry||'index.html'));
  if(!files.some(f=>f.path===entry && f.mime.startsWith('text/html')))throw Error('MISSING_HTML_ENTRY');
  const branding=m.branding as Record<string,unknown>||{};
  if(branding.provider!=='kidflix-host'||branding.official_logo_required!==true||branding.copyright_required!==true)throw Error('HOST_BRANDING_CONTRACT_REQUIRED');
  if(!String(m.title||'').trim())throw Error('EXPERIENCE_TITLE_REQUIRED');
  const rights=m.copyright as Record<string,unknown>||{};
  if(!String(rights.holder||'').trim()||!String(rights.license||'').trim()||/REPLACE_|TODO|TBD/i.test(String(rights.holder)+String(rights.license)))throw Error('VERIFIABLE_CONTENT_RIGHTS_METADATA_REQUIRED');
  const audience=m.audience as Record<string,unknown>||{};
  if((typeof audience.age_min!=='number'||!Number.isInteger(audience.age_min))||(typeof audience.age_max!=='number'||!Number.isInteger(audience.age_max))||Number(audience.age_min)<0||Number(audience.age_max)>25||Number(audience.age_max)<Number(audience.age_min))throw Error('VALID_AUDIENCE_AGE_REQUIRED');
  for(const f of files){
    if(f.mime.startsWith('text/html')){
      const html=utf8.decode(f.bytes);
      if(/<base\b/i.test(html))throw Error('HTML_BASE_OVERRIDE_FORBIDDEN');
      if(/<iframe\b/i.test(html)||/<object\b/i.test(html)||/<embed\b/i.test(html))throw Error('EMBEDDED_FRAMES_OR_OBJECTS_FORBIDDEN');
      if(/<script\b(?![^>]*\bsrc\s*=)/i.test(html))throw Error('INLINE_SCRIPT_NOT_SUPPORTED_USE_MODULE_FILE');
      if(/(?:src|href)\s*=\s*["'](?:https?:|\/\/)/i.test(html))throw Error('REMOTE_HTML_ASSET_FORBIDDEN');
    }
  }
  return {manifest:{...m,family_key:family,target_locale:locale as KfLocale},files,entry,checksum:sha(input),bytes:total};
}
export function sha256(input:Buffer|string){return createHash('sha256').update(input).digest('hex')}
export function previewToken(packageId:string,subject:string,expires:number){
  const key=process.env.KIDFLIX_INTERACTIVE_SIGNING_SECRET;
  if(!key||key.length<48)throw Error('INTERACTIVE_SIGNING_SECRET_REQUIRED');
  const payload=Buffer.from(JSON.stringify({packageId,subject,expires})).toString('base64url');
  const mac=createHmac('sha256',key).update(payload).digest('base64url');
  return payload+'.'+mac;
}
export function verifyPreviewToken(token:string,packageId:string){
  const key=process.env.KIDFLIX_INTERACTIVE_SIGNING_SECRET;if(!key||key.length<48)return false;
  const [payload,mac]=token.split('.');if(!payload||!mac||payload.length>1200)return false;
  const expected=createHmac('sha256',key).update(payload).digest('base64url');
  const a=Buffer.from(mac),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return false;
  try{const p=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return p.packageId===packageId&&Number(p.expires)>Date.now()&&Number(p.expires)<Date.now()+900000}catch{return false}
}
export function runtimeOrigin():string {
  const o=process.env.KIDFLIX_INTERACTIVE_RUNTIME_ORIGIN||'';
  const site=process.env.KIDFLIX_APPLICATION_ORIGIN||process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_APP_URL||'';
  if(!site)throw Error('KIDFLIX_APPLICATION_ORIGIN_REQUIRED');
  if(!o)throw Error('SEPARATE_INTERACTIVE_RUNTIME_ORIGIN_REQUIRED');
  const u=new URL(o);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('INVALID_RUNTIME_ORIGIN');
  if(site){const main=new URL(site);if(main.protocol!=='https:')throw Error('APP_ORIGIN_MUST_BE_HTTPS');
    const own=u.hostname.split('.').slice(-2).join('.'),privileged=main.hostname.split('.').slice(-2).join('.');
    if(u.host===main.host||own===privileged)throw Error('RUNTIME_REQUIRES_SEPARATE_REGISTRABLE_DOMAIN');}
  return u.origin;
}

/**
 * Rebuild a complete, portable ZIP after an in-Studio asset or source edit.
 * Unlike a metadata overlay, this produces a truthful replacement source archive.
 * A rebuilt ZIP must pass inspectZip() before it is stored.
 */
export function rebuildPackageArchive(files: ReadonlyArray<Pick<KfFile,'path'|'bytes'>>): Buffer {
  if (!files.length || files.length > MAX_COUNT) throw Error('INVALID_PACKAGE_FILE_COUNT');
  const parts: Buffer[] = [], directory: Buffer[] = [];
  let offset = 0, total = 0;
  const unique = new Set<string>();
  for (const file of files) {
    const pathname = safePackagePath(file.path);
    if (unique.has(pathname)) throw Error('DUPLICATE_PACKAGE_FILE');
    unique.add(pathname);
    const name = Buffer.from(pathname, 'utf8');
    const bytes = Buffer.from(file.bytes);
    total += bytes.length;
    if (name.length > 512 || bytes.length > MAX_ENTRY || total > MAX_UNCOMPRESSED)
      throw Error('PACKAGE_ARCHIVE_LIMIT_EXCEEDED');
    const compressed = deflateRawSync(bytes, { level: 6 });
    const useDeflate = compressed.length < bytes.length;
    const payload = useDeflate ? compressed : bytes;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // ZIP 2.0
    local.writeUInt16LE(0x800, 6); // UTF-8 paths
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, payload);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += local.length + name.length + payload.length;
    if (offset > MAX_ZIP) throw Error('REBUILT_PACKAGE_EXCEEDS_64_MIB');
  }
  const dirBytes = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dirBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  const archive = Buffer.concat([...parts, dirBytes, end]);
  if (archive.length > MAX_ZIP) throw Error('REBUILT_PACKAGE_EXCEEDS_64_MIB');
  inspectZip(archive); // Mandatory integrity and contract recheck
  return archive;
}
