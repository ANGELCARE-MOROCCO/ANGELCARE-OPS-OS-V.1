import 'server-only'
import { createHash } from 'node:crypto'
import { unstable_cache,revalidatePath,revalidateTag } from 'next/cache'
import type { StudioCachedReadInput } from './types'
import { STUDIO_CACHE_ROOT_TAG } from './registry'

const stable=(value:unknown)=>JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v)
export async function studioCachedRead<T>(input:StudioCachedReadInput<T>):Promise<T>{const digest=createHash('sha256').update(stable(input.keyParts)).digest('hex');const tags=[...new Set([STUDIO_CACHE_ROOT_TAG,...input.tags])];const cached=unstable_cache(input.load,['angelcare-marketplace-studio-p12',input.namespace,digest],{tags,revalidate:Math.max(30,Math.min(3600,input.revalidateSeconds))});return cached()}
export function revalidateStudioTags(tags:string[]){for(const tag of [...new Set([STUDIO_CACHE_ROOT_TAG,...tags])])revalidateTag(tag,'max')}
export function revalidateStudioPaths(paths:string[]){for(const path of [...new Set(paths.filter(v=>v.startsWith('/angelcare-marketplace/')))])revalidatePath(path)}
