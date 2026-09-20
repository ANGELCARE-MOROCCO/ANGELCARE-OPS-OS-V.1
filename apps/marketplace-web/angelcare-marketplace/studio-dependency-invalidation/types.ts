import type { Data } from '@puckeditor/core'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export const STUDIO_DEPENDENCY_VERSION=1 as const
export const STUDIO_DEPENDENCY_MAX_DIRECT=500 as const
export const STUDIO_DEPENDENCY_MAX_IMPACT_PAGES=250 as const
export type StudioDependencyRelation='selects'|'navigates_to'|'queries'|'uses_media'|'uses_template'|'uses_context'|'workflow_target'|'action_target'|'source_reference'
export interface StudioDependencyReference extends StudioSourceReference{relation:StudioDependencyRelation;blockId:string;path:string}
export interface StudioDependencyGraph{version:1;dependencyCount:number;sourceCount:number;dependencies:StudioDependencyReference[];cacheTags:string[];truncated:boolean}
export interface StudioDependencyImpactPage{id:string;title:string;slug:string;locale:string;status:string;path:string}
export interface StudioDependencyImpact{reference:StudioSourceReference;cacheTags:string[];affectedPages:StudioDependencyImpactPage[];edgeCount:number;truncated:boolean}
export interface StudioDependencyInspection{graph:StudioDependencyGraph;storedEdgeCount:number;affectedPublishedPages:number;existingAuthority:'angelcare_marketplace_cms_dependency_edges';cache:{taggedReads:true;revalidateTag:true;revalidatePath:true;adminPreviewBypassesRuntimeCache:true};invariants:{noShadowDependencyStore:true;noBusinessFactsCopied:true;existingExperienceCoreGraph:true}}
export interface StudioDependencySyncResult{stored:boolean;edgeCount:number;revisionId:string|null;reason?:string}
export interface StudioDependencyInvalidationResult{tags:string[];paths:string[];affectedPages:number;reason:string}
export type StudioCachedReadInput<T>={namespace:string;keyParts:unknown[];tags:string[];revalidateSeconds:number;load:()=>Promise<T>}
export type StudioDocumentDependencyInput={data:Data;pageId?:string|null}
