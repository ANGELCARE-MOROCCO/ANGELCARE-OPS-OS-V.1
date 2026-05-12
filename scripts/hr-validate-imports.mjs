import fs from 'fs'
import path from 'path'

const required = [
  'lib/hr-production/repository.ts',
  'lib/hr-production/metrics.ts',
  'lib/hr-production/navigation.ts',
  'lib/hr-production/types.ts',
  'lib/supabase/server.ts',
]
let failed = false
for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error('Missing required HR file:', file)
    failed = true
  } else {
    console.log('OK', file)
  }
}
process.exit(failed ? 1 : 0)
