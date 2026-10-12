import {categoryNativeCsvFields} from '../category-native/product360-enrichment'
import type {ExperienceSchemaRecord} from '../category-native/types'
import type {Row} from './model'
/** Structured columns must remain JSON when a source snapshot is exported. */
export function serializeProfileRow(row:Row,schema:ExperienceSchemaRecord):Row{const structured=new Set(categoryNativeCsvFields(schema).filter(f=>['json','component_list','time_ranges'].includes(f.field_type)).map(f=>f.field_key));return Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value&&typeof value==='object'&&structured.has(key)?JSON.stringify(value):value]))}
