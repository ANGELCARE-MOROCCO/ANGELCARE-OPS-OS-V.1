import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { createRule } from './actions'

export default async function AutomationPage(){
  const supabase = await createClient()
  const { data } = await supabase.from('bd_automation_rules').select('*')

  const rules = data || []

  return (
    <AppShell title="Automation Brain" subtitle="System rules and triggers engine">
      <div style={{display:'grid',gap:20}}>

        <form action={createRule} style={{display:'grid',gap:10}}>
          <input name="name" placeholder="Rule name" required/>
          <select name="trigger_type">
            <option value="prospect">Prospect</option>
            <option value="task">Task</option>
          </select>
          <button>Create Rule</button>
        </form>

        <div style={{display:'grid',gap:10}}>
          {rules.map((r:any)=>(
            <div key={r.id} style={{border:'1px solid #ccc',padding:10}}>
              <strong>{r.name}</strong>
              <div>{r.trigger_type}</div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
