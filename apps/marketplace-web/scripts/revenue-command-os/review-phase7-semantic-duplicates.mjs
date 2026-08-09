import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const base=path.join(root,'lib/revenue-command-os/command-kernel/commands-1000')
const commands=JSON.parse(fs.readFileSync(path.join(base,'commands-1000.commands.json'),'utf8'))
const report=JSON.parse(fs.readFileSync(path.join(base,'commands-1000.semantic-duplicate-report.json'),'utf8'))
const ignored=new Set(['commands-1000','mz07','new-700','golden-300','mz06','shadow-safe'])
function tokens(command){
  const result=new Set([`family:${command.family}`,`approval:${command.approvalClass}`])
  for(const item of command.tags)if(!ignored.has(item)&&item!==command.family)result.add(`tag:${item}`)
  for(const item of command.triggerTypes)result.add(`trigger:${item}`)
  for(const item of command.segments)result.add(`segment:${item}`)
  for(const item of command.territories)result.add(`territory:${item}`)
  for(const item of command.commercialStages)result.add(`stage:${item}`)
  for(const item of command.requiredContext)result.add(`context:${item.key}`)
  for(const item of command.outputSchema)result.add(`output:${item.key}`)
  for(const item of command.toolPermissions)if(item.allowed)result.add(`tool:${item.toolCode}`)
  return result
}
const sets=commands.map(tokens)
let reviewedPairs=0,highSimilarityPairs=0,undocumented=0
const threshold=Number(report.reviewThreshold)
const documented=new Map(report.reviewedCandidates.map(item=>[[item.leftCommandCode,item.rightCommandCode].sort().join('|'),item]))
for(let left=0;left<sets.length;left++)for(let right=left+1;right<sets.length;right++){
  reviewedPairs++
  const a=sets[left],b=sets[right]
  let intersection=0
  for(const token of a)if(b.has(token))intersection++
  const similarity=intersection/(a.size+b.size-intersection)
  if(similarity>=threshold){
    highSimilarityPairs++
    const key=[commands[left].commandCode,commands[right].commandCode].sort().join('|')
    const review=documented.get(key)
    if(!review||review.reviewStatus!=='documented-variant'||!Array.isArray(review.differenceDimensions)||review.differenceDimensions.length===0)undocumented++
  }
}
const result={commands:commands.length,reviewedPairs,threshold,highSimilarityPairs,documentedVariants:highSimilarityPairs-undocumented,undocumentedSemanticDuplicates:undocumented,status:undocumented===0?'pass':'fail'}
console.log(JSON.stringify(result,null,2))
if(commands.length!==1000||reviewedPairs!==499500||highSimilarityPairs!==report.highSimilarityPairs||undocumented!==0)process.exit(1)
