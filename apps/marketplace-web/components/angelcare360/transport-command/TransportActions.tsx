'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TransportDriver, TransportRoute, TransportRun, TransportStaff, TransportStop, TransportStudent, TransportVehicle } from '@/types/angelcare360/transport-mobility'
import styles from './TransportCommand.module.css'

function useSubmit(){
  const router=useRouter();const[busy,setBusy]=useState(false);const[message,setMessage]=useState<{ok:boolean;text:string}|null>(null)
  async function submit(payload:Record<string,unknown>){
    setBusy(true);setMessage(null)
    try{
      const res=await fetch('/api/angelcare360/transport-command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const body=await res.json().catch(()=>({}))
      if(!res.ok||!body.ok){setMessage({ok:false,text:body.error||'Opération non exécutée.'});return false}
      setMessage({ok:true,text:'Opération confirmée.'});router.refresh();return true
    }catch(e){setMessage({ok:false,text:e instanceof Error?e.message:'Erreur réseau.'});return false}
    finally{setBusy(false)}
  }
  return{busy,message,submit}
}
function Feedback({message}:{message:{ok:boolean;text:string}|null}){return message?<div className={`${styles.message} ${message.ok?styles.messageGood:styles.messageBad}`}>{message.text}</div>:null}

export function RouteStudio({routes,vehicles,drivers}:{routes:TransportRoute[];vehicles:TransportVehicle[];drivers:TransportDriver[]}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'route.upsert',id:f.get('id'),code:f.get('code'),label:f.get('label'),direction:f.get('direction'),routeType:f.get('routeType'),vehicleId:f.get('vehicleId'),driverId:f.get('driverId'),status:f.get('status')})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Route Design Studio</span><h2>Concevoir ou gouverner un circuit</h2><p>Le circuit décrit la planification. Les coordonnées d’arrêt ne sont jamais présentées comme position GPS live.</p></div></div>
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={styles.field}><span>Modifier un circuit</span><select name="id"><option value="">Nouveau circuit</option>{routes.map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Code</span><input name="code" placeholder="RAB-04" required /></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Libellé</span><input name="label" placeholder="Hay Riad → École" required /></label>
      <label className={styles.field}><span>Direction</span><select name="direction"><option value="round_trip">Aller-retour</option><option value="pickup">Ramassage</option><option value="dropoff">Dépôt</option></select></label>
      <label className={styles.field}><span>Type</span><select name="routeType"><option value="regular">Régulier</option><option value="temporary">Temporaire</option><option value="event">Événement</option><option value="emergency">Urgence</option><option value="external_partner">Partenaire externe</option></select></label>
      <label className={styles.field}><span>Véhicule par défaut</span><select name="vehicleId"><option value="">Non affecté</option>{vehicles.map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Chauffeur par défaut</span><select name="driverId"><option value="">Non affecté</option>{drivers.map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={styles.field}><span>État</span><select name="status"><option value="active">Actif</option><option value="draft">Brouillon</option><option value="paused">En pause</option><option value="suspended">Suspendu</option><option value="archived">Archivé</option></select></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy}>{busy?'Validation…':'Enregistrer le circuit'}</button></div>
    </form><Feedback message={message}/></section>
}

export function StopStudio({routes,stops}:{routes:TransportRoute[];stops:TransportStop[]}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'stop.upsert',id:f.get('id'),routeId:f.get('routeId'),code:f.get('code'),label:f.get('label'),order:Number(f.get('order')||1),zone:f.get('zone'),address:f.get('address'),plannedTime:f.get('plannedTime'),latitude:f.get('latitude')||null,longitude:f.get('longitude')||null,status:f.get('status')})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Stop Sequence Control</span><h2>Ordonnancer un arrêt</h2><p>Heure planifiée, adresse et coordonnées stockées. Aucun ETA ou mouvement live n’est inventé.</p></div></div>
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={styles.field}><span>Modifier</span><select name="id"><option value="">Nouvel arrêt</option>{stops.map(x=><option key={x.id} value={x.id}>{x.routeCode} · {x.order} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Circuit</span><select name="routeId" required><option value="">Sélectionner…</option>{routes.filter(x=>x.status!=='archived').map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Code historique</span><input name="code" placeholder="STOP-03" /></label>
      <label className={styles.field}><span>Ordre</span><input name="order" type="number" min="1" defaultValue="1" required /></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Libellé</span><input name="label" required /></label>
      <label className={styles.field}><span>Zone</span><input name="zone" /></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Adresse</span><input name="address" /></label>
      <label className={styles.field}><span>Heure planifiée</span><input name="plannedTime" type="time" /></label>
      <label className={styles.field}><span>Latitude planifiée</span><input name="latitude" inputMode="decimal" /></label>
      <label className={styles.field}><span>Longitude planifiée</span><input name="longitude" inputMode="decimal" /></label>
      <label className={styles.field}><span>État</span><select name="status"><option value="active">Actif</option><option value="paused">En pause</option><option value="archived">Archivé</option></select></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy}>{busy?'Validation…':'Enregistrer l’arrêt'}</button></div>
    </form><Feedback message={message}/></section>
}

export function VehicleStudio({vehicles}:{vehicles:TransportVehicle[]}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'vehicle.upsert',id:f.get('id'),code:f.get('code'),label:f.get('label'),vehicleType:f.get('vehicleType'),plateNumber:f.get('plateNumber'),capacity:Number(f.get('capacity')||0),seatbeltCount:Number(f.get('seatbeltCount')||0),insuranceExpiry:f.get('insuranceExpiry'),inspectionExpiry:f.get('inspectionExpiry'),status:f.get('status')})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Fleet Readiness Studio</span><h2>Enregistrer ou mettre à jour un véhicule</h2><p>Capacité, ceintures, assurance et inspection deviennent des horizons de préparation — pas de simples champs CRUD.</p></div></div>
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={styles.field}><span>Modifier</span><select name="id"><option value="">Nouveau véhicule</option>{vehicles.map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Code</span><input name="code" placeholder="BUS-04" required /></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Libellé / modèle</span><input name="label" required /></label>
      <label className={styles.field}><span>Type</span><select name="vehicleType"><option value="bus">Bus</option><option value="minibus">Minibus</option><option value="van">Van</option><option value="car">Voiture</option><option value="external_partner">Partenaire externe</option><option value="other">Autre</option></select></label>
      <label className={styles.field}><span>Immatriculation</span><input name="plateNumber" /></label>
      <label className={styles.field}><span>Capacité</span><input name="capacity" type="number" min="0" defaultValue="0" /></label>
      <label className={styles.field}><span>Ceintures</span><input name="seatbeltCount" type="number" min="0" defaultValue="0" /></label>
      <label className={styles.field}><span>Assurance expire</span><input name="insuranceExpiry" type="date" /></label>
      <label className={styles.field}><span>Inspection expire</span><input name="inspectionExpiry" type="date" /></label>
      <label className={styles.field}><span>État</span><select name="status"><option value="active">Actif</option><option value="maintenance">Maintenance</option><option value="suspended">Suspendu</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy}>{busy?'Validation…':'Enregistrer le véhicule'}</button></div>
    </form><Feedback message={message}/></section>
}

export function DriverStudio({drivers,staff}:{drivers:TransportDriver[];staff:TransportStaff[]}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'driver.upsert',id:f.get('id'),staffId:f.get('staffId'),code:f.get('code'),fullName:f.get('fullName'),phone:f.get('phone'),licenseNumber:f.get('licenseNumber'),licenseExpiry:f.get('licenseExpiry'),status:f.get('status')})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Driver Readiness</span><h2>Gouverner un chauffeur</h2><p>La licence et son échéance sont des faits opérationnels. SANILA ne fabrique aucun « score de conduite ».</p></div></div>
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={styles.field}><span>Modifier</span><select name="id"><option value="">Nouveau chauffeur</option>{drivers.map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={styles.field}><span>Lier au personnel</span><select name="staffId"><option value="">Sans liaison</option>{staff.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={styles.field}><span>Code chauffeur</span><input name="code" placeholder="DRV-04" /></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Nom complet</span><input name="fullName" required /></label>
      <label className={styles.field}><span>Téléphone</span><input name="phone" /></label>
      <label className={styles.field}><span>N° permis</span><input name="licenseNumber" /></label>
      <label className={styles.field}><span>Expiration permis</span><input name="licenseExpiry" type="date" /></label>
      <label className={styles.field}><span>État</span><select name="status"><option value="active">Actif</option><option value="on_leave">En congé</option><option value="suspended">Suspendu</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy}>{busy?'Validation…':'Enregistrer le chauffeur'}</button></div>
    </form><Feedback message={message}/></section>
}

export function AssignmentStudio({students,routes,stops}:{students:TransportStudent[];routes:TransportRoute[];stops:TransportStop[]}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'assignment.upsert',studentId:f.get('studentId'),routeId:f.get('routeId'),stopId:f.get('stopId'),serviceDirection:f.get('serviceDirection'),monthlyFeeMad:Number(f.get('monthlyFeeMad')||0),startsOn:f.get('startsOn'),endsOn:f.get('endsOn'),status:'active'})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Student Mobility Assignment</span><h2>Affecter un élève</h2><p>Le garde-fou vérifie que l’arrêt appartient au circuit et que les références restent dans la même organisation.</p></div></div>
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Élève</span><select name="studentId" required><option value="">Sélectionner…</option>{students.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Circuit</span><select name="routeId" required><option value="">Sélectionner…</option>{routes.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Arrêt</span><select name="stopId"><option value="">Sans arrêt</option>{stops.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.routeCode} · {x.order} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Direction de service</span><select name="serviceDirection"><option value="round_trip">Aller-retour</option><option value="pickup">Ramassage</option><option value="dropoff">Dépôt</option></select></label>
      <label className={styles.field}><span>Montant mensuel enregistré</span><input name="monthlyFeeMad" type="number" min="0" step="0.01" defaultValue="0" /></label>
      <label className={styles.field}><span>Début</span><input name="startsOn" type="date" /></label>
      <label className={styles.field}><span>Fin</span><input name="endsOn" type="date" /></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy}>{busy?'Validation…':'Confirmer l’affectation'}</button></div>
    </form><Feedback message={message}/></section>
}

export function SafetyStudio({vehicles,drivers,locked}:{vehicles:TransportVehicle[];drivers:TransportDriver[];locked:boolean}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await submit({action:'safety.record',vehicleId:f.get('vehicleId'),driverId:f.get('driverId'),checkType:f.get('checkType'),result:f.get('result'),notes:f.get('notes')})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Safety Departure Gate</span><h2>Enregistrer un contrôle sécurité</h2><p>Un contrôle « failed » ou « blocked » reste un fait bloquant pour l’ouverture d’une nouvelle course SANILA.</p></div></div>
    {locked?<div className={`${styles.message} ${styles.messageBad}`}>Mutation verrouillée : appliquez et validez le SQL d’intégrité Transport.</div>:null}
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={styles.field}><span>Véhicule</span><select name="vehicleId" required><option value="">Sélectionner…</option>{vehicles.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Chauffeur</span><select name="driverId" required><option value="">Sélectionner…</option>{drivers.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={styles.field}><span>Type de contrôle</span><select name="checkType"><option value="pre_route">Avant départ</option><option value="post_route">Après course</option><option value="vehicle">Véhicule</option><option value="driver">Chauffeur</option><option value="incident_followup">Suite incident</option><option value="custom">Personnalisé</option></select></label>
      <label className={styles.field}><span>Résultat</span><select name="result"><option value="passed">Conforme</option><option value="warning">Avertissement</option><option value="failed">Échec</option><option value="blocked">Bloqué</option></select></label>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Notes</span><textarea name="notes" /></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy||locked}>{busy?'Enregistrement…':'Certifier le contrôle'}</button></div>
    </form><Feedback message={message}/></section>
}

export function RunStudio({routes,vehicles,drivers,locked}:{routes:TransportRoute[];vehicles:TransportVehicle[];drivers:TransportDriver[];locked:boolean}){
  const{busy,message,submit}=useSubmit()
  async function onSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const start=String(f.get('plannedStartAt')||'');await submit({action:'run.open',routeId:f.get('routeId'),vehicleId:f.get('vehicleId'),driverId:f.get('driverId'),runDate:f.get('runDate'),runType:f.get('runType'),plannedStartAt:start?new Date(start).toISOString():null})}
  return <section className={styles.studio}><div className={styles.studioHead}><div><span>Daily Movement Board</span><h2>Ouvrir une course</h2><p>Le départ est transactionnel et vérifie circuit, véhicule, chauffeur, capacité et dernier contrôle pré-départ.</p></div></div>
    {locked?<div className={`${styles.message} ${styles.messageBad}`}>Course verrouillée jusqu’à validation du garde-fou SQL SANILA Mobility.</div>:null}
    <form onSubmit={onSubmit} className={styles.formGrid}>
      <label className={`${styles.field} ${styles.fieldWide}`}><span>Circuit</span><select name="routeId" required><option value="">Sélectionner…</option>{routes.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Véhicule</span><select name="vehicleId"><option value="">Par défaut du circuit</option>{vehicles.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.label}</option>)}</select></label>
      <label className={styles.field}><span>Chauffeur</span><select name="driverId"><option value="">Par défaut du circuit</option>{drivers.filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.code} · {x.fullName}</option>)}</select></label>
      <label className={styles.field}><span>Type</span><select name="runType"><option value="pickup">Ramassage</option><option value="dropoff">Dépôt</option><option value="event">Événement</option><option value="emergency">Urgence</option></select></label>
      <label className={styles.field}><span>Date</span><input name="runDate" type="date" /></label>
      <label className={styles.field}><span>Départ planifié</span><input name="plannedStartAt" type="datetime-local" /></label>
      <div className={`${styles.field} ${styles.fieldWide}`}><button className={styles.button} disabled={busy||locked}>{busy?'Ouverture…':'Ouvrir la course'}</button></div>
    </form><Feedback message={message}/></section>
}

export function RunEventConsole({run,students,stops,locked}:{run:TransportRun;students:TransportStudent[];stops:TransportStop[];locked:boolean}){
  const{busy,message,submit}=useSubmit()
  async function event(kind:string,studentId?:string,stopId?:string){await submit({action:'event.record',runId:run.id,eventType:kind,studentId:studentId||null,stopId:stopId||null})}
  async function close(){await submit({action:'run.close',runId:run.id,status:'completed'})}
  return <section className={styles.fieldConsole}><div className={styles.consoleHead}><div><span>Run Field Console</span><h2>{run.routeCode} · {run.runType==='dropoff'?'Dépôt':'Ramassage'}</h2></div><span className={styles.liveTruth}>STATUT ENREGISTRÉ · PAS DE GPS LIVE</span></div>
    {locked?<div className={`${styles.message} ${styles.messageBad}`}>Console verrouillée jusqu’à validation du SQL d’intégrité.</div>:null}
    <div className={styles.quickActions}>{stops.map(st=><button disabled={busy||locked} key={st.id} onClick={()=>event('stop_reached',undefined,st.id)}>Arrêt atteint · {st.order} {st.label}</button>)}</div>
    <div className={styles.studentOps}>{students.map(st=><div key={st.id} className={styles.studentRow}><div><strong>{st.fullName}</strong><span>{st.code}</span></div><div><button disabled={busy||locked} onClick={()=>event('student_boarded',st.id)}>Monté</button><button disabled={busy||locked} onClick={()=>event('student_absent',st.id)}>Absent</button><button disabled={busy||locked} onClick={()=>event('student_dropped',st.id)}>Déposé</button></div></div>)}</div>
    <div className={styles.consoleFooter}><button disabled={busy||locked} onClick={()=>event('delay')}>Enregistrer retard</button><button disabled={busy||locked} onClick={()=>event('incident')}>Signaler incident</button><button className={styles.button} disabled={busy||locked} onClick={close}>Clôturer la course</button></div><Feedback message={message}/></section>
}

export function ResolveAlertButton({alertId}:{alertId:string}){const{busy,message,submit}=useSubmit();return <div><button className={styles.smallButton} disabled={busy} onClick={()=>submit({action:'alert.resolve',alertId,notes:'Résolution confirmée depuis Transport Watchtower'})}>{busy?'…':'Résoudre'}</button><Feedback message={message}/></div>}
