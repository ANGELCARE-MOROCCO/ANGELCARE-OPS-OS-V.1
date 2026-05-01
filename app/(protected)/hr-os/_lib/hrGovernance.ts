
export function generateReference(module: string, type: string) {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(Math.random()*10000)
  return `${module.toUpperCase()}-${type.toUpperCase()}-${date}-${rand}`
}
