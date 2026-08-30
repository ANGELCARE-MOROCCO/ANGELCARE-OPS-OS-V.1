import {unstable_cache} from 'next/cache'
import {createServiceClient} from '@/lib/supabase/server'
import {buildPublishedDictionaryFromRows,type LocalizationDictionary,type RuntimeLocale,type RuntimeScope} from './runtime-dictionary'
export {buildPublishedDictionaryFromRows}
export type {LocalizationDictionary,RuntimeLocale,RuntimeScope}
export async function resolvePublishedDictionary(locale:RuntimeLocale,scope:RuntimeScope='public'):Promise<LocalizationDictionary>{
 if(locale==='fr')return{locale,direction:'ltr',byKey:{},bySource:{},byTemplate:{}}
 return unstable_cache(async()=>{const db=await createServiceClient(),published:unknown[]=[];for(let from=0;;from+=1000){const{data,error}=await db.from('angelcare_marketplace_translations').select('id,translation_text,source_hash_at_translation,status,freshness_state,candidate:angelcare_marketplace_translation_candidates(translation_key,source_text_fr,source_hash,freshness_state,classification,audience)').eq('target_locale',locale).eq('status','published').eq('freshness_state','current').order('id').range(from,from+999);if(error)throw new Error(`Localization runtime unavailable: ${error.message}`);const page=Array.isArray(data)?data:[];published.push(...page);if(page.length<1000)break}return buildPublishedDictionaryFromRows(locale,published,scope)},['marketplace-localization-runtime',locale,scope],{revalidate:300,tags:['marketplace-localization-runtime']})()
}
