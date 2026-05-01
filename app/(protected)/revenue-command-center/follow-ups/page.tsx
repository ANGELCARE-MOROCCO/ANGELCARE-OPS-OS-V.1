import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { createFollowup, completeFollowup } from './actions'

export default async function FollowUpsPage(){
  const supabase = await createClient()

  const { data } = await supabase.from('bd_followups').select('*').order('due_at',{ascending:true})

  const list = data || []

  return (
    <AppShell title="Follow-ups Engine" subtitle="Central follow-up tracking and execution">
      <div style={{display:'grid',gap:20}}>

        <form action={createFollowup} style={{display:'grid',gap:10}}>
          <input name="title" placeholder="Follow-up title" required />
          <input name="due_at" type="datetime-local" />
          <button>Create Follow-up</button>
        </form>

        <div style={{display:'grid',gap:10}}>
          {list.map((f:any)=>(
            <div key={f.id} style={{border:'1px solid #ccc',padding:10}}>
              <strong>{f.title}</strong>
              <div>{f.status}</div>
              <div>{f.due_at}</div>

              {f.status!=='completed' && (
                <form action={completeFollowup}>
                  <input type="hidden" name="id" value={f.id}/>
                  <button>Complete</button>
                </form>
              )}
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  )
}
