/** Indicative supplier profitability only. Exact fixed-point math; never a checkout quotation. */
function scaled(value: unknown, precision: number): bigint {
 const s=String(value ?? '').trim()
 if(!/^\d+(\.\d+)?$/.test(s)) throw Error('Invalid decimal')
 const [major,minor='']=s.split('.')
 if(minor.length>precision) throw Error('Precision exceeds scale')
 return BigInt(major)*BigInt(10)**BigInt(precision)+BigInt(minor.padEnd(precision,'0'))
}
function asDecimal(n:bigint,p:number):string {
 const d=BigInt(10)**BigInt(p),negative=n<BigInt(0),positive=negative?-n:n
 const whole=positive/d,minor=(positive%d).toString().padStart(p,'0')
 return (negative?'-':'')+(p?whole+'.'+minor:whole.toString())
}
export function costPreview(input:{unitCost:unknown;freight:unknown;duties:unknown;other:unknown;retailUsd:unknown;rate:unknown}) {
 const p=12,scale=BigInt(10)**BigInt(12)
 const local=scaled(input.unitCost,p)+scaled(input.freight,p)+scaled(input.duties,p)+scaled(input.other,p)
 const rate=scaled(input.rate,p)
 if(rate<=BigInt(0))throw Error('Missing approved positive FX rate')
 const usd=(local*scale+rate/BigInt(2))/rate
 const retail=input.retailUsd===null || input.retailUsd===undefined || String(input.retailUsd)===''?null:scaled(input.retailUsd,p)
 const margin=retail!==null && retail>BigInt(0)?((retail-usd)*BigInt(10000)/retail):null
 return {landedUsd:asDecimal((usd+BigInt(500000))/BigInt(1000000),6),marginPercent:margin===null?null:asDecimal(margin,2)}
}
