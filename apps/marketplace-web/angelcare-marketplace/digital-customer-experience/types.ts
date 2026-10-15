export type Locale = 'en' | 'fr' | 'ar'
export type Tri = readonly [string, string, string]
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Data = { [key: string]: Json }
export type Kind = 'experience' | 'topic' | 'content' | 'asset' | 'template' | 'bundle' | 'access_policy' | 'offer_link' | 'contribution' | 'case' | 'setting' | 'ad_connection' | 'ad_unit' | 'ad_policy' | 'run' | 'grant'
export type Lifecycle = 'draft' | 'review' | 'approved' | 'published' | 'archived' | 'pending' | 'open' | 'assigned' | 'waiting_customer' | 'resolved' | 'closed' | 'hidden' | 'rejected'
export interface DceRecord { id: string; kind: Kind; key: string; title: string; family: string | null; topic: string | null; audience: string; data: Data; lifecycle: Lifecycle; revision: number; published_release_id: string | null; created_by: string; updated_by: string; tenant_id: string | null; territory_id: string | null; created_at: string; updated_at: string }
export interface Release { id: string; record_id: string; revision: number; snapshot: DceRecord; manifest: Data; validation: Validation; state: 'scheduled' | 'published' | 'withdrawn' | 'cancelled' | 'failed'; scheduled_at: string | null; published_at: string | null; actor_id: string; created_at: string; error: string | null }
export interface Issue { path: string; code: string; message: Tri; severity: 'error' | 'warning' }
export interface Validation { valid: boolean; errors: Issue[]; warnings: Issue[]; checkedAt: string; revision: number; capabilities: string[] }
export interface Page<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface Rights { view: boolean; manage: boolean; publish: boolean; moderate: boolean; monetize: boolean; export: boolean; purge: boolean; media: boolean; customers: boolean }
export interface Actor { id: string; name: string; email: string | null; locale: Locale; rights: Rights }
export interface Field { key: string; label: Tri; type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'reference'; options?: readonly string[]; required?: boolean; min?: number; max?: number; hint?: Tri; defaultValue?: Json; localized?: boolean; classification?: 'public' | 'private'; reference?: 'media' | 'offers' | 'content' | 'experience' | 'staff' | 'record'; mime?: string[]; modes?: string[]; optionLabels?: Record<string,Tri> }
export interface Collection { key: string; label: Tri; fields: Field[]; min?: number; max?: number }
export interface Family { key: string; number: number; name: Tri; description: Tri; icon: string; color: string; modes: readonly string[]; actions: readonly string[]; fields: Field[]; collections: Collection[]; capabilities?: import('./action-contract').ActionCapability[]; definitionVersion?: number; modesContract?: import('./capabilities').ModeContract[] }
export interface Module { key: string; label: Tri; group: string; icon: string; kind?: Kind; description: Tri }
export interface Format { id: string; name: string; family: 'manual' | 'auto' | 'rewarded' | 'search' | 'game' | 'creative' | 'video'; owner: 'angelcare' | 'google-console' | 'specialist'; zones: readonly string[]; requires: string; description: Tri }
export interface Bootstrap { actor: Actor; activated: boolean; databaseError?: string; summary: Data; recent: DceRecord[]; topics: DceRecord[]; releases: Release[]; health: Data; settings: Data; contract: string }
export interface Command { action: string; requestId: string; id?: string; revision?: number; record?: Partial<DceRecord>; reason?: string; [key: string]: unknown }
export const BASE = '/angelcare-marketplace/admin/digital-customer-experience'
export const API = '/api/angelcare-marketplace/admin/digital-customer-experience'
export const CONTRACT = 'ANGELCARE_DCE_ADMIN_R1'
export const LOCALES: readonly Locale[] = ['fr', 'en', 'ar']
export const AUDIENCES = ['child', 'parent', 'educator', 'professional', 'school'] as const
export const KINDS: readonly Kind[] = ['experience','topic','content','asset','template','bundle','access_policy','offer_link','contribution','case','setting','ad_connection','ad_unit','ad_policy','run','grant']
export const LIFECYCLES: readonly Lifecycle[] = ['draft','review','approved','published','archived','pending','open','assigned','waiting_customer','resolved','closed','hidden','rejected']
export function tr(value: Tri, locale: Locale): string { return value[locale === 'fr' ? 1 : locale === 'ar' ? 2 : 0] }
export function object(value: unknown): Data { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {} }
export function array(value: unknown): Data[] { return Array.isArray(value) ? value.filter(v => v && typeof v === 'object' && !Array.isArray(v)) as Data[] : [] }
export function text(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
export function number(value: unknown, fallback = 0): number { const n = Number(value); return Number.isFinite(n) ? n : fallback }
export function localized(data: Data, field: string, locale: Locale): string { const values = object(data.locales); return text(object(values[locale])[field]) || text(object(values.en)[field]) || text(object(values.fr)[field]) }

export function canWriteKind(rights:Rights,kind:Kind):boolean {return !['run','grant'].includes(kind)&&rights[['ad_policy','ad_connection','ad_unit'].includes(kind)?'monetize':['case','contribution'].includes(kind)?'moderate':'manage']}
