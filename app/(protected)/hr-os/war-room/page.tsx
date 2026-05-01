
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data: forecasts } = await supabase.from('hr_os_workforce_forecasts').select('*')

  return (
    <div style={{padding:20, display:'grid', gap:20}}>
      <h1>HR WAR ROOM</h1>

      <section style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        {(forecasts || []).map(f => (
          <div key={f.id} style={{border:'1px solid #ddd', padding:10}}>
            <strong>{f.city}</strong>
            <p>Required: {f.required}</p>
            <p>Current: {f.current}</p>
            <p>Gap: {f.required - f.current}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Strategic Insights</h2>
        <ul>
          <li>Focus recruitment where gap is highest</li>
          <li>Push compliant-ready profiles to allocation</li>
          <li>Block deployment if compliance missing</li>
        </ul>
      </section>

    </div>
  )
}
