/** Keep the structure of a public dossier value; strip operational/private keys at every depth. */
const privateKey=/^(?:__.*|id|.*_id|metadata|attributes|internal.*|private.*|import.*|admin.*|supplier.*|secret.*|token.*|password.*|cost.*|margin.*|commission.*|notes)$/i
export function cleanPublicStructure(value:unknown,depth=0):unknown{
 if(depth>5)return null
 if(typeof value==='string'){const text=value.trim();if(/^[\[{]/.test(text))try{return cleanPublicStructure(JSON.parse(text),depth+1)}catch{}return text.slice(0,20000)}
 if(typeof value==='number')return Number.isFinite(value)?value:null
 if(typeof value==='boolean'||value===null)return value
 if(Array.isArray(value))return value.slice(0,100).map(row=>cleanPublicStructure(row,depth+1)).filter(row=>row!==null&&row!==undefined&&row!=='')
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([key])=>!privateKey.test(key)).slice(0,60).map(([key,row])=>[key,cleanPublicStructure(row,depth+1)]).filter(([,row])=>row!==null&&row!==undefined&&row!==''))
 return null
}
