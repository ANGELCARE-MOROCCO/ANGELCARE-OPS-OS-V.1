
// USD-only canonical base. Convert using fixed-point bigint and rate strings.
export const RATE_SCALE = 12n
const SCALE = 10n**RATE_SCALE
export function parseScaled(value:unknown,decimals=12):bigint {
 const raw=String(value??'').trim()
 if(!/^-?\d+(\.\d+)?$/.test(raw))throw Error('Invalid decimal')
 const sign=raw.startsWith('-')?-1n:1n
 const [a,b='']=raw.replace('-','').split('.')
 if(b.length>decimals)throw Error('Too many decimal places')
 return sign*(BigInt(a)*10n**BigInt(decimals)+BigInt(b.padEnd(decimals,'0')))
}
export function formatMinor(v:bigint,scale:number):string {
 const q=10n**BigInt(scale),neg=v<0n?'-':'',abs=v<0n?-v:v
 return neg+String(abs/q)+(scale?'.'+String(abs%q).padStart(scale,'0'):'')
}
export function currencyDigits(currency:string):number {
 return new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits
}
export function calculateQuote(input:{usd:string;rate:string;upliftBp:number;currency:string}){
 if(!Number.isSafeInteger(input.upliftBp)||input.upliftBp<=-10000||input.upliftBp>=100000)throw Error('Invalid uplift')
 const usd=parseScaled(input.usd,12),rate=parseScaled(input.rate,12)
 if(usd<0n||rate<=0n)throw Error('Invalid USD or FX rate')
 const digits=currencyDigits(input.currency)
 const multiplier=BigInt(10000+input.upliftBp)
 const n=usd*rate*multiplier*10n**BigInt(digits)
 const d=SCALE*SCALE*10000n
 const minor=(n+d/2n)/d
 return {currency:input.currency,amount:formatMinor(minor,digits),minor:minor.toString(),digits}
}
