import type {Data} from '@puckeditor/core'
import {deterministicWorldFingerprint} from './fingerprint'
import type {PublicExperienceWorldFactoryRecord,WorldFactoryPackage} from './types'
import {PUBLIC_EXPERIENCE_WORLD_FACTORY_PACKAGE_VERSION} from './types'

export function createWorldFactoryPackage(input:{name:string;description?:string|null;themeVersion:string;manifest:Record<string,unknown>;factory:PublicExperienceWorldFactoryRecord;data:Data}):WorldFactoryPackage{
 const document=deterministicWorldFingerprint(input.data),factory=deterministicWorldFingerprint(input.factory),base={format:'angelcare-world-package-v1' as const,packageVersion:PUBLIC_EXPERIENCE_WORLD_FACTORY_PACKAGE_VERSION,exportedAt:new Date().toISOString(),world:{name:input.name,description:input.description||null,themeVersion:input.themeVersion,manifest:input.manifest,factory:input.factory},data:input.data,fingerprints:{document,factory,package:''}}
 return{...base,fingerprints:{...base.fingerprints,package:deterministicWorldFingerprint({...base,fingerprints:{document,factory}})}}
}
export function parseWorldFactoryPackage(value:unknown):WorldFactoryPackage|null{if(!value||typeof value!=='object'||Array.isArray(value))return null;const row=value as Record<string,unknown>;if(row.format!=='angelcare-world-package-v1'||Number(row.packageVersion)!==1)return null;const data=row.data&&typeof row.data==='object'&&!Array.isArray(row.data)?row.data as Data:null,world=row.world&&typeof row.world==='object'&&!Array.isArray(row.world)?row.world as Record<string,unknown>:null,fingerprints=row.fingerprints&&typeof row.fingerprints==='object'&&!Array.isArray(row.fingerprints)?row.fingerprints as Record<string,unknown>:null;if(!data||!world||!fingerprints||!world.factory)return null;return row as unknown as WorldFactoryPackage}
