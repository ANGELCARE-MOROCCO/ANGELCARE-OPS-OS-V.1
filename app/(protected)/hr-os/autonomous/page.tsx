
import { evaluateAutoTriggers } from '../_lib/hrAutonomousEngine'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('hr_os_actions').select('*').limit(50)

  return (
    <div style={{padding:20}}>
      <h1>HR Autonomous System</h1>
      {data?.map(a => {
        const auto = evaluateAutoTriggers(a)
        return (
          <div key={a.id} style={{border:'1px solid #ddd',margin:10,padding:10}}>
            <strong>{a.title}</strong>
            <p>{auto.auto ? auto.effect : 'No automation'}</p>
          </div>
        )
      })}
    </div>
  )
}
