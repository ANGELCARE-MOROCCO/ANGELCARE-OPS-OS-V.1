'use client'
import { useState, type ChangeEvent, type MouseEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import { useCustomerExperience } from '@/components/angelcare360/customer-experience/CustomerExperienceProvider'
import styles from './FoundationDecisionComposer.module.css'

export default function FoundationDecisionComposer() {
  const [open,setOpen]=useState(false); const [title,setTitle]=useState(''); const [detail,setDetail]=useState(''); const [severity,setSeverity]=useState('info'); const [dueAt,setDueAt]=useState(''); const [busy,setBusy]=useState(false)
  const { notify }=useCustomerExperience(); const router=useRouter()
  async function submit(){ if(!title.trim()){notify({title:'Titre requis',message:'Décrivez la décision à traiter.',tone:'warning'});return} setBusy(true)
    try{const response=await fetch('/api/angelcare360/customer-foundation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entity:'management-decision',operation:'create',payload:{title,detail,severity,dueAt:dueAt||null,domain:'direction'}})})
      const result=await response.json().catch(()=>null); if(!response.ok||!result?.ok) throw new Error(result?.error||'Décision non enregistrée.')
      setOpen(false);setTitle('');setDetail('');setDueAt('');notify({title:'Décision enregistrée',message:'La file de direction a été mise à jour.',tone:'success'})
      router.refresh()
    }catch(error){notify({title:'Action non réalisée',message:error instanceof Error?error.message:'Erreur inattendue.',tone:'error'})}finally{setBusy(false)} }
  return <><button type="button" className={styles.trigger} onClick={()=>setOpen(true)}><Plus size={16}/> Nouvelle décision</button>{open?<CustomerOverlayPortal><div className={styles.backdrop} onMouseDown={()=>setOpen(false)}><section className={styles.drawer} onMouseDown={(event: MouseEvent<HTMLElement>)=>event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Créer une décision de direction"><header><div><small>Direction · gouvernance</small><h2>Nouvelle décision</h2><p>Créer un arbitrage traçable avec priorité et échéance.</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={18}/></button></header><div className={styles.body}><label>Titre<input value={title} onChange={(event: ChangeEvent<HTMLInputElement>)=>setTitle(event.target.value)} placeholder="Ex. Valider la conversion exceptionnelle"/></label><label>Détail<textarea value={detail} onChange={(event: ChangeEvent<HTMLTextAreaElement>)=>setDetail(event.target.value)} rows={5} placeholder="Contexte, conséquence et résultat attendu"/></label><div className={styles.grid}><label>Priorité<select value={severity} onChange={(event: ChangeEvent<HTMLSelectElement>)=>setSeverity(event.target.value)}><option value="info">Normale</option><option value="warning">À surveiller</option><option value="critical">Critique</option></select></label><label>Échéance<input type="datetime-local" value={dueAt} onChange={(event: ChangeEvent<HTMLInputElement>)=>setDueAt(event.target.value)}/></label></div></div><footer><button type="button" className={styles.secondary} onClick={()=>setOpen(false)}>Annuler</button><button type="button" className={styles.primary} onClick={submit} disabled={busy}>{busy?'Enregistrement…':'Enregistrer la décision'}</button></footer></section></div></CustomerOverlayPortal>:null}</>
}
