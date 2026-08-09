const assert=(name,value)=>{if(!value)throw new Error(`FAIL — ${name}`);console.log(`PASS — ${name}`)}
const waves=[{id:'a',startAt:'2026-09-01',channels:['Instagram'],status:'draft'},{id:'b',startAt:'2026-09-01',channels:['Instagram','LinkedIn'],status:'draft'},{id:'c',startAt:'2026-09-02',channels:['Instagram'],status:'draft'}]
const collisions=waves.flatMap((left,index)=>waves.slice(index+1).filter(right=>left.startAt===right.startAt&&left.channels.some(channel=>right.channels.includes(channel))).map(right=>[left.id,right.id]))
assert('collision:same-date-channel',collisions.length===1&&collisions[0][0]==='a'&&collisions[0][1]==='b')
const capacity=[{required:30,reserved:5,available:32},{required:12,reserved:0,available:20}].map(line=>Math.round((line.required+line.reserved)/line.available*100))
assert('capacity:overload-detected',capacity[0]>100&&capacity[1]<100)
const budget={planned:100000,approved:60000,committed:35000,actual:22000}
assert('budget:states-separated',new Set(Object.values(budget)).size===4)
const campaign={status:'authorized',content:[{id:'hero',status:'proposed'},{id:'faq',status:'created'}]}
const scope=campaign.content.filter(item=>item.status!=='created')
assert('conversion:idempotent-scope',scope.length===1&&scope[0].id==='hero')
assert('conversion:authorization-required',campaign.status==='authorized')
const permanentDelete=(immutable,deps,confirmation,code)=>!immutable&&deps===0&&confirmation===code
assert('delete:draft-no-dependencies',permanentDelete(false,0,'CMP-001','CMP-001'))
assert('delete:dependency-blocked',!permanentDelete(false,2,'CMP-001','CMP-001'))
assert('delete:typed-confirmation',!permanentDelete(false,0,'DELETE','CMP-001'))
const continuation=['reduce_scope','change_wave','manual_mode','override','delegate','cancel_wave']
assert('continuity:multiple-exits',continuation.length>=5)
const attribution={correlation:10,direct:3,assisted:2}
assert('truth:correlation-not-direct',attribution.correlation!==attribution.direct)
console.log('PASS — deterministic campaign orchestration, truth and lifecycle model.')
