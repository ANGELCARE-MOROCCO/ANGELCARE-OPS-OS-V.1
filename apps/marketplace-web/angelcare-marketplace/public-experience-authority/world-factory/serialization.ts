import type {PublicExperienceWorldFactoryRecord} from './types'
import {PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE,PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION,PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION} from './types'
import {migrateWorldFactoryRecord} from './migrations'
const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const text=(value:unknown)=>typeof value==='string'?value.trim():''
export function parseWorldFactoryRecord(value:unknown):PublicExperienceWorldFactoryRecord|null{const migrated=migrateWorldFactoryRecord(value);if(!migrated)return null;const row=rec(migrated),cert=rec(row.certification),gates=Array.isArray(cert.gates)?cert.gates:[];if(row.engineVersion!==PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION||row.schemaVersion!==PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION||row.compilerProfile!==PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE)return null;if(!text(row.candidateFingerprint)||!text(row.compiledFingerprint)||!['detail','storefront'].includes(text(row.themeKind))||!gates.length)return null;return migrated}
