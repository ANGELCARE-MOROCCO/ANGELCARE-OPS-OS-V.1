
export function computeForecast(prospects:any[]){
 let gross=0, weighted=0
 for(const p of prospects){
  const v=Number(p.estimated_value||0)
  const prob=Number(p.probability||0)/100
  gross+=v
  weighted+=v*prob
 }
 const target=800000
 const gap=target-weighted
 const confidence=Math.max(5,Math.min(95,Math.round((weighted/gross||0)*100)))
 return {gross,weighted,target,gap,confidence}
}
