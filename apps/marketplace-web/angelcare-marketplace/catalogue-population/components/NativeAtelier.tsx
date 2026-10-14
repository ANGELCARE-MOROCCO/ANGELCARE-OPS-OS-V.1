'use client'
import type {ExperienceSchemaRecord} from '../../category-native/types'
import type {Row} from '../model'
import {Dialog} from './Dialogs'
import {ImportWorkspace} from '../../catalogue-import/ImportWorkspace'
export function NativeAtelier({schema,category,seed,onClose,canImport}:{schema:ExperienceSchemaRecord;category:Row|null;seed?:Row;onClose:()=>void;onStart:(schema:ExperienceSchemaRecord,source:string)=>void;canImport:boolean}){return <Dialog title={schema.name_fr} kicker="POPULATE & IMPORT · PARCOURS NATIF" onClose={onClose} wide><ImportWorkspace initialSchemas={[schema]} initialSchemaKey={schema.schema_key} initialCategory={category} initialSeed={seed} permissions={{manage:canImport,media:canImport,categories:canImport,export:canImport,publish:canImport}} compact/></Dialog>}
