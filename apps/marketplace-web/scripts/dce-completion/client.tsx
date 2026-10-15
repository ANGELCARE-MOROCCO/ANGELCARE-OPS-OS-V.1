import { createRoot } from 'react-dom/client'
import { Workspace } from '../../angelcare-marketplace/digital-customer-experience/components/Workspace'
import { query } from '../../angelcare-marketplace/digital-customer-experience/components/ui'
import { BASE } from '../../angelcare-marketplace/digital-customer-experience/types'
const last=location.pathname.split('/').filter(Boolean).at(-1),module=last==='digital-customer-experience'?'dashboard':last
query({op:'bootstrap'}).then(initial=>createRoot(document.getElementById('root')!).render(<><div style={{padding:'6px 20px',font:'11px Arial',background:'#eaf3ff',color:'#244775'}}>ISOLATED TEST DATABASE · Actual DCE components and repository · No production session or provider requests</div><Workspace initial={initial} module={module}/></>)).catch(e=>{document.getElementById('root')!.textContent=e.message})
