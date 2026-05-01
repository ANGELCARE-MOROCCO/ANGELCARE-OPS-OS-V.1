export function evaluateRules(entity:any, rules:any[]){
  const results = []

  for(const rule of rules){
    if(!rule.is_active) continue

    try{
      const cond = rule.condition || {}
      let pass = true

      if(cond.field && cond.operator){
        const value = entity[cond.field]

        if(cond.operator === 'missing'){
          pass = !value
        }

        if(cond.operator === 'gt'){
          pass = Number(value) > Number(cond.value)
        }
      }

      if(pass){
        results.push({
          rule:rule.name,
          action:rule.action
        })
      }
    }catch(e){
      console.error(e)
    }
  }

  return results
}
