'use client'
import {useRouter} from 'next/navigation'
import styles from '../operations-commerce.module.css'
import {GovernedCommandDialog} from '../../reality-completion/components/GovernedCommandDialog'
async function send(url:string,body:Record<string,unknown>){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const p=await r.json();if(!r.ok)throw new Error(p?.error?.message||'Action impossible.');return p}
export function EvidenceReviewActions({evidenceId,status}:{evidenceId:string;status:string}){const router=useRouter();async function review(next:'validated'|'rejected',reason:string){await send(`/api/angelcare-marketplace/operations/evidence/${evidenceId}/review`,{status:next,reason});router.refresh()}if(['validated','rejected'].includes(status))return null;return <div className={styles.caseActions}><GovernedCommandDialog title="Valider la preuve opérationnelle" triggerLabel="Valider" fields={[]} onSubmit={async(_v,r)=>review('validated',r)}/><GovernedCommandDialog title="Rejeter la preuve opérationnelle" triggerLabel="Rejeter" danger fields={[]} onSubmit={async(_v,r)=>review('rejected',r)}/></div>}
