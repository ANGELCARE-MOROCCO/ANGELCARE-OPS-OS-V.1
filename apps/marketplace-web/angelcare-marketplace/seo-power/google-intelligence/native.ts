import 'server-only'
import { db, projects } from '../repository'
import type { Project } from '../model'

export type WorldKey = 'angelcare' | 'kidflix' | 'jobkix'
export type NativeWorld = { id: string; world: WorldKey; name: string; origin: string; registered: number; eligible: number; unscanned: number; httpFailures: number; paused: boolean }
export type NativeSummary = { registered: number; eligible: number; unscanned: number; httpFailures: number; worlds: NativeWorld[]; note: string }
export type NativeItem = { id: string; world: WorldKey; projectId: string; path: string; url: string; locale: string; kind: string; title: string; indexable: boolean; httpStatus: number | null; lastScannedAt: string | null }
export type NativePage = { items: NativeItem[]; total: number; page: number; pageSize: number; totalPages: number; source: 'ac_seo_power_pages'; note: string }

const worlds: WorldKey[] = ['angelcare','kidflix','jobkix']
const authorizedWorld = (v:string): v is WorldKey => worlds.includes(v as WorldKey)
const boundedInt = (v: string | null, fallback: number, limit: number) => { const n = Number(v);return Number.isInteger(n) && n > 0 ? Math.min(n,limit) : fallback }
const cleanTerm = (x:string) => x.trim().slice(0,100).replace(/[%,().\\*_]/g, '')

async function countPages(projectId:string, condition: 'all'|'eligible'|'unscanned'|'httpFailures'): Promise<number> {
  const client = await db()
  let query = client.from('ac_seo_power_pages').select('id', { count: 'exact', head: true }).eq('project_id', projectId)
  if (condition === 'eligible') query = query.eq('indexable', true)
  if (condition === 'unscanned') query = query.is('last_scanned_at', null)
  if (condition === 'httpFailures') query = query.gte('http_status', 400)
  const result = await query
  if (result.error) throw new Error('Native SEO inventory count unavailable')
  return result.count ?? 0
}

export async function nativeSummary(): Promise<NativeSummary> {
  const list = (await projects()).filter(p=>authorizedWorld(p.world))
  const worldsResult = await Promise.all(list.map(async (p:Project) => {
    const [registered, eligible, unscanned, httpFailures] = await Promise.all([
      countPages(p.id,'all'),countPages(p.id,'eligible'),countPages(p.id,'unscanned'),countPages(p.id,'httpFailures')
    ])
    return { id:p.id,world:p.world as WorldKey,name:p.name,origin:p.origin,registered,eligible,unscanned,httpFailures,paused:!p.enabled }
  }))
  return { registered:worldsResult.reduce((n,p)=>n+p.registered,0), eligible:worldsResult.reduce((n,p)=>n+p.eligible,0), unscanned:worldsResult.reduce((n,p)=>n+p.unscanned,0), httpFailures:worldsResult.reduce((n,p)=>n+p.httpFailures,0), worlds: worldsResult, note:'Complete counts within the registered SEO Power database only; not a guarantee that every native published resource has been registered or indexed by Google.' }
}

export async function nativeInventory(search:URLSearchParams):Promise<NativePage> {
  const list = (await projects()).filter(p=>authorizedWorld(p.world))
  const world = search.get('world') || 'all'
  if (world !== 'all' && !authorizedWorld(world)) throw new Error('Invalid world filter')
  const page = boundedInt(search.get('page'),1,100000)
  const pageSize = boundedInt(search.get('size'),40,100)
  const term = cleanTerm(search.get('q')||'')
  const locale = (search.get('locale')||'all').toLowerCase()
  if (locale !== 'all' && !/^(fr|en|ar|es|hi|tl|id)$/.test(locale)) throw new Error('Invalid locale filter')
  const state = search.get('state') || 'all'
  if (!['all','eligible','excluded','unscanned','http-error'].includes(state)) throw new Error('Invalid native state filter')
  const relevant = list.filter(p=>world==='all'||p.world===world)
  if (!relevant.length) return {items:[],total:0,page,pageSize,totalPages:0,source:'ac_seo_power_pages',note:'No registered world in this filter.'}
  const client = await db()
  let query = client.from('ac_seo_power_pages')
    .select('id,project_id,path,locale,kind,title,indexable,http_status,last_scanned_at', { count:'exact' })
    .in('project_id',relevant.map(p=>p.id))
    .order('path',{ascending:true}).order('id',{ascending:true})
  if (term) query = query.or(`path.ilike.%${term}%,title.ilike.%${term}%`)
  if (locale !== 'all') query = query.eq('locale',locale)
  if (state === 'eligible') query = query.eq('indexable',true)
  if (state === 'excluded') query = query.eq('indexable',false)
  if (state === 'unscanned') query = query.is('last_scanned_at',null)
  if (state === 'http-error') query = query.gte('http_status',400)
  const result = await query.range((page-1)*pageSize,page*pageSize-1)
  if (result.error) throw new Error('Native SEO inventory page unavailable')
  const byId = new Map(relevant.map(p=>[p.id,p]))
  const items: NativeItem[] = (result.data||[]).flatMap((raw:Record<string,unknown>)=> {
    const p=byId.get(String(raw.project_id));if(!p)return []
    let url=''
    try {url = new URL(String(raw.path||''),p.origin).href} catch {url = String(raw.path||'')}
    return [{id:String(raw.id),world:p.world as WorldKey,projectId:p.id,path:String(raw.path||''),url,locale:String(raw.locale||''),kind:String(raw.kind||''),title:String(raw.title||''),indexable:raw.indexable===true,httpStatus:typeof raw.http_status==='number'?raw.http_status:null,lastScannedAt:raw.last_scanned_at?String(raw.last_scanned_at):null}]
  })
  return {items,total:result.count??0,page,pageSize,totalPages:Math.ceil((result.count??0)/pageSize),source:'ac_seo_power_pages',note:'Registered native SEO pages only. An absent GSC performance row does not mean that an eligible page is unindexed.'}
}
