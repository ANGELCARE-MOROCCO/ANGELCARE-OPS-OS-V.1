import type {AudioAsset,HotlineConfig,Locale} from './types'
export type AudioMetadata={locale:Locale|'all';purpose:AudioAsset['purpose']}
export function inferAudioMetadata(label:string):AudioMetadata|null {
 const name=label.toLowerCase().trim().replace(/\.mp3$/,'')
 if(/^(?:angelcare[-_])?(?:care[-_])?(?:celesta|waiting[-_]music|hold[-_]music|music)$/.test(name))return{locale:'all',purpose:'music'}
 const match=name.match(/^(ar|fr|en)[-_](greeting|closed|error|menu(?:[-_][a-z0-9]+)*)$/)
 if(!match)return null
 return{locale:match[1] as Locale,purpose:match[2].startsWith('menu')?'menu':match[2] as AudioAsset['purpose']}
}
export function audioSuggestions(assets:AudioAsset[]){return assets.flatMap(asset=>{const metadata=inferAudioMetadata(asset.label);return asset.status==='ready'&&metadata&&(asset.locale!==metadata.locale||asset.purpose!==metadata.purpose)?[{asset,metadata}]:[]})}
export function voiceCandidates(assets:AudioAsset[],locale:Locale){return assets.filter(a=>a.status==='ready'&&a.locale===locale&&a.purpose!=='music'&&a.duration_seconds>0&&a.mime_type==='audio/mpeg')}
export function proposeAudioMapping(config:HotlineConfig,assets:AudioAsset[]){
 const next:HotlineConfig=JSON.parse(JSON.stringify(config)),filled:string[]=[],ambiguous:string[]=[]
 function unique(locale:Locale|'all',purpose:AudioAsset['purpose'],label:string){const matches=assets.filter(a=>a.status==='ready'&&a.locale===locale&&a.purpose===purpose&&a.label.toLowerCase().replace(/\.mp3$/,'').replace(/_/g,'-')===label&&a.duration_seconds>0&&a.mime_type==='audio/mpeg');if(matches.length>1)ambiguous.push(label);return matches.length===1?matches[0].id:null}
 for(const locale of next.locales){for(const field of ['greeting','closed','error'] as const)if(!next[field][locale]){const id=unique(locale,field,locale+'-'+field);if(id){next[field][locale]=id;filled.push(locale+' '+field)}}for(const node of next.nodes.filter(n=>n.kind==='menu'))if(!node.prompt[locale]){const id=unique(locale,'menu',locale+'-menu-'+node.id);if(id){node.prompt[locale]=id;filled.push(locale+' '+node.id)}}}
 if(!next.musicAssetId){const music=assets.filter(a=>a.status==='ready'&&a.purpose==='music'&&a.locale==='all'&&a.duration_seconds>0&&a.mime_type==='audio/mpeg');if(music.length===1){next.musicAssetId=music[0].id;filled.push('music')}else if(music.length>1)ambiguous.push('music')}
 return{config:next,filled,ambiguous}
}
