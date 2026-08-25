'use client'

import {useRouter} from 'next/navigation'
import styles from '../academy.module.css'
import type {AcademyCertificate} from '../types'
import {GovernedCommandDialog} from '../../reality-completion/components/GovernedCommandDialog'

async function decide(id:string,action:'issue'|'suspend'|'revoke'|'renew',reason:string){
 const response=await fetch(`/api/angelcare-marketplace/academy/certificates/${id}/decision`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,reason})})
 const payload=await response.json().catch(()=>({}))
 if(!response.ok)throw new Error(payload?.error?.message||'Décision certificat refusée.')
 return payload.data
}

function CertificateDecision({certificate,action,label,danger=false}:{certificate:AcademyCertificate;action:'issue'|'suspend'|'revoke'|'renew';label:string;danger?:boolean}){
 const router=useRouter()
 return <GovernedCommandDialog title={`${label} · ${certificate.public_reference}`} triggerLabel={label} danger={danger} fields={[]} reasonLabel="Motif / base de décision" onSubmit={async(_values,reason)=>{await decide(certificate.id,action,reason);router.refresh()}}/>
}

export function CertificateAuthority({certificates}:{certificates:AcademyCertificate[]}){
 return <div className={styles.shell}>
  <section className={styles.hero}><div><div className={styles.eyebrow}>CERTIFICATE AUTHORITY · REALITY COMPLETION</div><h1 className={styles.title}>Aucune certification sans présence, évaluation et approbation.</h1><p className={styles.copy}>Émission, suspension, révocation et renouvellement passent par le moteur d’éligibilité Academy, écrivent l’événement certificat et recalculent l’éligibilité provider lorsqu’elle s’applique.</p></div><div className={styles.heroPanel}><strong>{certificates.filter(c=>['issued','active','renewed'].includes(c.status)).length}</strong><span>certificats actifs / renouvelés</span></div></section>
  <section className={styles.panel}><div className={styles.panelHead}><h2>Registre certificats · décisions gouvernées</h2></div><div className={styles.panelBody}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Référence</th><th>Statut</th><th>Compétences</th><th>Émis</th><th>Expire</th><th>Décisions</th></tr></thead><tbody>{certificates.map(c=><tr key={c.id}><td><strong>{c.public_reference}</strong><br/><small>{c.id}</small></td><td><span className={styles.status}>{c.status}</span></td><td>{c.competency_keys.join(', ')||'À préciser'}</td><td>{c.issued_at?new Date(c.issued_at).toLocaleDateString('fr-FR'):'—'}</td><td>{c.expires_at?new Date(c.expires_at).toLocaleDateString('fr-FR'):'—'}</td><td><div className={styles.rowActions}>{['draft','eligible','pending_approval'].includes(c.status)?<CertificateDecision certificate={c} action="issue" label="Émettre"/>:null}{['active','issued','renewed','expiring'].includes(c.status)?<CertificateDecision certificate={c} action="suspend" label="Suspendre" danger/>:null}{!['revoked','archived'].includes(c.status)?<CertificateDecision certificate={c} action="revoke" label="Révoquer" danger/>:null}{['active','expiring','expired'].includes(c.status)?<CertificateDecision certificate={c} action="renew" label="Renouveler"/>:null}</div>{c.revocation_reason?<small>Révocation: {c.revocation_reason}</small>:null}</td></tr>)}</tbody></table></div></div></section>
 </div>
}
