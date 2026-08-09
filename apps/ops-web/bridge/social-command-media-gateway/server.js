'use strict'
const http = require('node:http')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { pipeline } = require('node:stream/promises')

const PORT = Number(process.env.SOCIAL_COMMAND_MEDIA_GATEWAY_PORT || 8789)
const HOST = process.env.SOCIAL_COMMAND_MEDIA_GATEWAY_HOST || '0.0.0.0'
const ROOT = path.resolve(process.env.SOCIAL_COMMAND_MEDIA_ROOT || 'D:\\AngelCareData\\SocialCommand')
const SIGNING_SECRET = String(process.env.SOCIAL_COMMAND_MEDIA_SIGNING_SECRET || '')
const ADMIN_TOKEN = String(process.env.SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN || '')
const ALLOWED_ORIGIN = String(process.env.SOCIAL_COMMAND_MEDIA_ALLOWED_ORIGIN || '').replace(/\/$/, '')
const DEFAULT_MAX_BYTES = Number(process.env.SOCIAL_COMMAND_MEDIA_MAX_BYTES || 1024 * 1024 * 1024)
const ALLOWED_MIME = new Set((process.env.SOCIAL_COMMAND_MEDIA_ALLOWED_MIME || 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime').split(',').map(v=>v.trim()).filter(Boolean))

if (!SIGNING_SECRET || !ADMIN_TOKEN) {
  console.error('SOCIAL_COMMAND_MEDIA_SIGNING_SECRET and SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN are required')
  process.exit(1)
}

const dirs = {
  assets: path.join(ROOT,'assets'),
  thumbnails: path.join(ROOT,'thumbnails'),
  temporary: path.join(ROOT,'temporary'),
  archive: path.join(ROOT,'archive'),
  metadata: path.join(ROOT,'.metadata')
}
for (const dir of Object.values(dirs)) fs.mkdirSync(dir,{recursive:true})

function json(res,status,payload,extra={}) {
  res.writeHead(status,{...corsHeaders(),...extra,'content-type':'application/json; charset=utf-8','cache-control':'no-store'})
  res.end(JSON.stringify(payload))
}
function corsHeaders() {
  return {
    'access-control-allow-origin': ALLOWED_ORIGIN || '*',
    'access-control-allow-methods':'GET,HEAD,PUT,DELETE,OPTIONS',
    'access-control-allow-headers':'content-type,content-length,x-social-media-admin-token',
    'access-control-expose-headers':'content-length,content-range,accept-ranges'
  }
}
function safeId(value){return String(value||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100)}
function safeName(value){
  const raw=path.basename(String(value||'asset')).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  const clean=raw.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160)
  return clean || 'asset'
}
function b64urlDecode(s){return Buffer.from(String(s),'base64url')}
function verifySigned(token,kind,assetId){
  const [body,sig]=String(token||'').split('.')
  if(!body||!sig) throw new Error('invalid signed token')
  const expected=crypto.createHmac('sha256',SIGNING_SECRET).update(body).digest('base64url')
  if(sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) throw new Error('invalid signature')
  const payload=JSON.parse(b64urlDecode(body).toString('utf8'))
  if(payload.kind!==kind) throw new Error('wrong token kind')
  if(assetId && safeId(payload.assetId)!==safeId(assetId)) throw new Error('asset mismatch')
  if(!Number.isFinite(Number(payload.exp)) || Date.now()>Number(payload.exp)) throw new Error('token expired')
  return payload
}
function metadataPath(assetId){return path.join(dirs.metadata,`${safeId(assetId)}.json`)}
function assetDir(assetId){return path.join(dirs.assets,safeId(assetId))}
async function readMeta(assetId){return JSON.parse(await fsp.readFile(metadataPath(assetId),'utf8'))}
async function writeMeta(assetId,meta){await fsp.writeFile(metadataPath(assetId),JSON.stringify(meta,null,2),'utf8')}
function isAdmin(req){
  const provided=String(req.headers['x-social-media-admin-token']||'')
  if(!provided || provided.length!==ADMIN_TOKEN.length) return false
  return crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(ADMIN_TOKEN))
}
async function sha256File(file){
  const hash=crypto.createHash('sha256'); await pipeline(fs.createReadStream(file),hash); return hash.digest('hex')
}
async function detectMime(file){
  const handle=await fsp.open(file,'r')
  try{
    const buf=Buffer.alloc(32);const {bytesRead}=await handle.read(buf,0,buf.length,0);const b=buf.subarray(0,bytesRead)
    if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg'
    if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return 'image/png'
    if(b.length>=12&&b.subarray(0,4).toString('ascii')==='RIFF'&&b.subarray(8,12).toString('ascii')==='WEBP')return 'image/webp'
    if(b.length>=12&&b.subarray(4,8).toString('ascii')==='ftyp')return b.subarray(8,12).toString('ascii')==='qt  '?'video/quicktime':'video/mp4'
    return null
  }finally{await handle.close()}
}
function allowedExtensionForMime(filename,mime){
  const ext=path.extname(filename).toLowerCase()
  const allowed={
    'image/jpeg':['.jpg','.jpeg'], 'image/png':['.png'], 'image/webp':['.webp'],
    'video/mp4':['.mp4','.m4v'], 'video/quicktime':['.mov','.qt'],
  }
  return (allowed[mime]||[]).includes(ext)
}
async function diskUsage(){
  try {
    const stat=await fsp.statfs(ROOT)
    return {freeBytes:Number(stat.bavail)*Number(stat.bsize), totalBytes:Number(stat.blocks)*Number(stat.bsize)}
  } catch { return {freeBytes:null,totalBytes:null} }
}
async function handleUpload(req,res,assetId,url){
  let claims
  try{claims=verifySigned(url.searchParams.get('token'),'upload',assetId)}catch(e){return json(res,403,{ok:false,error:e.message})}
  if(req.method!=='PUT') return json(res,405,{ok:false,error:'PUT required'})
  const contentType=String(req.headers['content-type']||claims.mimeType||'application/octet-stream').split(';')[0].trim().toLowerCase()
  if(!ALLOWED_MIME.has(contentType)) return json(res,415,{ok:false,error:`Unsupported media type: ${contentType}`})
  const declared=Number(req.headers['content-length']||0)
  const maxBytes=Math.min(Number(claims.maxBytes||DEFAULT_MAX_BYTES),DEFAULT_MAX_BYTES)
  if(declared && declared>maxBytes) return json(res,413,{ok:false,error:'File exceeds allowed size'})
  const id=safeId(assetId); if(!id) return json(res,400,{ok:false,error:'Invalid asset id'})
  const name=safeName(claims.filename)
  const dir=assetDir(id); await fsp.mkdir(dir,{recursive:true})
  const tmp=path.join(dirs.temporary,`${id}-${crypto.randomUUID()}.part`)
  const final=path.join(dir,name)
  let bytes=0
  req.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxBytes) req.destroy(new Error('File exceeds allowed size'))})
  try {
    await pipeline(req,fs.createWriteStream(tmp,{flags:'wx'}))
    if(bytes>maxBytes) throw new Error('File exceeds allowed size')
    const detectedMime=await detectMime(tmp)
    if(!detectedMime||!ALLOWED_MIME.has(detectedMime)) throw new Error('Media signature is not supported')
    if(detectedMime!==contentType) throw new Error(`Media signature does not match declared MIME (${detectedMime} != ${contentType})`)
    if(!allowedExtensionForMime(name,detectedMime)) throw new Error(`File extension does not match media type ${detectedMime}`)
    await fsp.rename(tmp,final)
    const digest=await sha256File(final)
    const meta={assetId:id,storageKey:`assets/${id}/${name}`,safeFilename:name,mimeType:contentType,sizeBytes:bytes,sha256:digest,actorUserId:String(claims.actorUserId||''),createdAt:new Date().toISOString(),metadata:{windowsRootLabel:path.parse(ROOT).root}}
    await writeMeta(id,meta)
    return json(res,201,{ok:true,data:meta})
  } catch(e){await fsp.rm(tmp,{force:true}).catch(()=>{});return json(res,e.message.includes('exceeds')?413:500,{ok:false,error:e.message})}
}
async function handleDelivery(req,res,assetId,url){
  try{verifySigned(url.searchParams.get('token'),'delivery',assetId)}catch(e){return json(res,403,{ok:false,error:e.message})}
  let meta;try{meta=await readMeta(assetId)}catch{return json(res,404,{ok:false,error:'Asset not found'})}
  const file=path.resolve(ROOT,meta.storageKey)
  if(!file.startsWith(dirs.assets+path.sep)) return json(res,403,{ok:false,error:'Invalid storage path'})
  let st;try{st=await fsp.stat(file)}catch{return json(res,404,{ok:false,error:'Asset not found'})}
  const range=req.headers.range
  const base={'content-type':meta.mimeType||'application/octet-stream','accept-ranges':'bytes','cache-control':'private, max-age=300',...corsHeaders()}
  if(req.method==='HEAD'){res.writeHead(200,{...base,'content-length':String(st.size)});return res.end()}
  if(range){
    const m=/bytes=(\d*)-(\d*)/.exec(range)
    if(!m){res.writeHead(416,{...base,'content-range':`bytes */${st.size}`});return res.end()}
    let start=m[1]?Number(m[1]):0; let end=m[2]?Number(m[2]):st.size-1
    if(start>st.size-1||end<start){res.writeHead(416,{...base,'content-range':`bytes */${st.size}`});return res.end()}
    end=Math.min(end,st.size-1)
    res.writeHead(206,{...base,'content-range':`bytes ${start}-${end}/${st.size}`,'content-length':String(end-start+1)})
    return fs.createReadStream(file,{start,end}).pipe(res)
  }
  res.writeHead(200,{...base,'content-length':String(st.size)})
  fs.createReadStream(file).pipe(res)
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==='OPTIONS'){res.writeHead(204,corsHeaders());return res.end()}
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`)
    const parts=url.pathname.split('/').filter(Boolean)
    if(url.pathname==='/health'){
      const disk=await diskUsage();return json(res,200,{ok:true,data:{service:'angelcare-social-command-media-gateway',rootLabel:path.parse(ROOT).root||'windows',freeBytes:disk.freeBytes,totalBytes:disk.totalBytes,serverTime:new Date().toISOString()}})
    }
    if(parts[0]==='upload'&&parts[1]) return handleUpload(req,res,parts[1],url)
    if(parts[0]==='media'&&parts[1]) return handleDelivery(req,res,parts[1],url)
    if(parts[0]==='admin'&&parts[1]==='assets'&&parts[2]){
      if(!isAdmin(req)) return json(res,401,{ok:false,error:'Admin token required'})
      const id=safeId(parts[2])
      if(req.method==='GET'){try{return json(res,200,{ok:true,data:await readMeta(id)})}catch{return json(res,404,{ok:false,error:'Asset not found'})}}
      if(req.method==='DELETE'){
        await fsp.rm(assetDir(id),{recursive:true,force:true});await fsp.rm(metadataPath(id),{force:true});return json(res,200,{ok:true,data:{deleted:true,assetId:id}})
      }
    }
    return json(res,404,{ok:false,error:'Not found'})
  } catch(e){return json(res,500,{ok:false,error:e instanceof Error?e.message:String(e)})}
})
server.requestTimeout=15*60*1000
server.headersTimeout=65*1000
server.listen(PORT,HOST,()=>console.log(`AngelCare Social Command Media Gateway listening on ${HOST}:${PORT} root=${ROOT}`))
