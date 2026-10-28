/** Indicative supplier profitability only. Exact fixed-point math; never a checkout quotation. */
function scaled(value: unknown, precision: number): bigint {
 const s=String(value ?? '').trim()
 if(!/^\d+(\.\d+)?$/.test(s)) throw Error('Invalid decimal')
 const [major,minor='']=s.split('.')
 if(minor.length>precision) throw Error('Precision exceeds scale')
 return BigInt(major)*10n**BigInt(precision)+BigInt(minor.padEnd(precision,'0'))
}
function asDecimal(n:bigint,p:number):string {
 const d=10n**BigInt(p),negative=n<0n,positive=negative?-n:n
 const whole=positive/d,minor=(positive%d).toString().padStart(p,'0')
 return (negative?'-':'')+(p?whole+'.'+minor:whole.toString())
}
export function costPreview(input:{unitCost:unknown;freight:unknown;duties:unknown;other:unknown;retailUsd:unknown;rate:unknown}) {
 const p=12,scale=10n**12n
 const local=scaled(input.unitCost,p)+scaled(input.freight,p)+scaled(input.duties,p)+scaled(input.other,p)
 const rate=scaled(input.rate,p)
 if(rate<=0n)throw Error('Missing approved positive FX rate')
 const usd=(local*scale+rate/2n)/rate
 const retail=input.retailUsd===null || input.retailUsd===undefined || String(input.retailUsd)===''?null:scaled(input.retailUsd,p)
 const margin=retail!==null && retail>0n?((retail-usd)*10000n/retail):null
 return {landedUsd:asDecimal((usd+500000n)/1000000n,6),marginPercent:margin===null?null:asDecimal(margin,2)}
}
