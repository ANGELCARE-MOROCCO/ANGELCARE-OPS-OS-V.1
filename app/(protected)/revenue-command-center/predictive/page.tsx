
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { computeForecast } from '@/lib/predictiveEngine'

export default async function Page(){
 const supabase=await createClient()
 const {data}=await supabase.from('bd_prospects').select('*')
 const res=computeForecast(data||[])
 return(
  <AppShell title="Predictive Revenue">
   <pre>{JSON.stringify(res,null,2)}</pre>
  </AppShell>
 )
}
