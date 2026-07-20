import crypto from 'node:crypto'
import type { AccessTokenClaims } from './types'
function base64url(input: string | Buffer) { return Buffer.from(input).toString('base64url') }
function secret() {
  const value = String(process.env.BROWSER_EXTENSION_TOKEN_SECRET || '').trim()
  if (value.length < 32) throw new Error('BROWSER_EXTENSION_TOKEN_SECRET must contain at least 32 characters.')
  return value
}
export function hashOpaqueToken(value: string) { return crypto.createHmac('sha256', secret()).update(value).digest('hex') }
export function randomOpaqueToken(bytes = 32) { return crypto.randomBytes(bytes).toString('base64url') }
export function signAccessToken(input: Omit<AccessTokenClaims,'typ'|'iat'|'exp'|'jti'>, ttlSeconds = Number(process.env.BROWSER_EXTENSION_ACCESS_TOKEN_TTL_SECONDS || 900)) {
  const now=Math.floor(Date.now()/1000); const claims:AccessTokenClaims={typ:'angelcare_browser_access',...input,iat:now,exp:now+Math.max(60,ttlSeconds),jti:crypto.randomUUID()}
  const header=base64url(JSON.stringify({alg:'HS256',typ:'JWT',kid:'angelcare-browser-v1'})); const payload=base64url(JSON.stringify(claims)); const signature=crypto.createHmac('sha256',secret()).update(`${header}.${payload}`).digest('base64url')
  return { token:`${header}.${payload}.${signature}`, claims, expiresAt:new Date(claims.exp*1000).toISOString() }
}
export function verifyAccessToken(token: string): AccessTokenClaims {
  const [header,payload,signature]=token.split('.'); if(!header||!payload||!signature) throw new Error('INVALID_ACCESS_TOKEN')
  const expected=crypto.createHmac('sha256',secret()).update(`${header}.${payload}`).digest('base64url')
  if(signature.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) throw new Error('INVALID_ACCESS_TOKEN_SIGNATURE')
  const claims=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as AccessTokenClaims
  if(claims.typ!=='angelcare_browser_access' || claims.exp<=Math.floor(Date.now()/1000)) throw new Error('EXPIRED_ACCESS_TOKEN')
  return claims
}
export function bearerToken(request: Request) { const value=request.headers.get('authorization')||''; return value.toLowerCase().startsWith('bearer ')?value.slice(7).trim():null }
