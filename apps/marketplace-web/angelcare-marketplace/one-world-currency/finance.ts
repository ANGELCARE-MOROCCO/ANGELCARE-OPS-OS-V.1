
// USD-only canonical base. Convert using fixed-point bigint and rate strings.
export const RATE_SCALE = BigInt(12)
const SCALE = BigInt(10)**RATE_SCALE
export function parseScaled(value:unknown,decimals=12):bigint {
 const raw=String(value??'').trim()
 if(!/^-?\d+(\.\d+)?$/.test(raw))throw Error('Invalid decimal')
 const sign=raw.startsWith('-')?-BigInt(1):BigInt(1)
 const [a,b='']=raw.replace('-','').split('.')
 if(b.length>decimals)throw Error('Too many decimal places')
 return sign*(BigInt(a)*BigInt(10)**BigInt(decimals)+BigInt(b.padEnd(decimals,'0')))
}
export function formatMinor(v:bigint,scale:number):string {
 const q=BigInt(10)**BigInt(scale),neg=v<BigInt(0)?'-':'',abs=v<BigInt(0)?-v:v
 return neg+String(abs/q)+(scale?'.'+String(abs%q).padStart(scale,'0'):'')
}
export function currencyDigits(currency:string):number {
 const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits
 if(typeof digits!=='number')throw Error('Currency precision unavailable')
 return digits
}
export function calculateQuote(input:{usd:string;rate:string;upliftBp:number;currency:string}){
 if(!Number.isSafeInteger(input.upliftBp)||input.upliftBp<=-10000||input.upliftBp>=100000)throw Error('Invalid uplift')
 const usd=parseScaled(input.usd,12),rate=parseScaled(input.rate,12)
 if(usd<BigInt(0)||rate<=BigInt(0))throw Error('Invalid USD or FX rate')
 const digits=currencyDigits(input.currency)
 const multiplier=BigInt(10000+input.upliftBp)
 const n=usd*rate*multiplier*BigInt(10)**BigInt(digits)
 const d=SCALE*SCALE*BigInt(10000)
 const minor=(n+d/BigInt(2))/d
 return {currency:input.currency,amount:formatMinor(minor,digits),minor:minor.toString(),digits}
}
