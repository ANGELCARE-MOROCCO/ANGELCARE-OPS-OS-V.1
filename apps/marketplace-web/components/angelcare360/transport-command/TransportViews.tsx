import Link from 'next/link'
import type {
  TransportAssignment, TransportDriver, TransportRoute, TransportRun, TransportSnapshot, TransportStop, TransportVehicle
} from '@/types/angelcare360/transport-mobility'
import {
  AssignmentStudio, DriverStudio, ResolveAlertButton, RouteStudio, RunEventConsole, RunStudio, SafetyStudio, StopStudio, VehicleStudio
} from './TransportActions'
import { EmptyState, StatusPill, formatDate, formatMoney, formatTime } from './TransportCommandShell'
import styles from './TransportCommand.module.css'

const BASE='/angelcare-360-command-center/transport'
function tone(value:string):'good'|'warn'|'bad'|'neutral'{
  if(['active','completed','passed','confirmed','recorded'].includes(value))return'good'
  if(['warning','planned','started','in_progress','acknowledged','maintenance','paused','pending'].includes(value))return'warn'
  if(['failed','blocked','critical','incident','suspended','unavailable','cancelled'].includes(value))return'bad'
  return'neutral'
}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca'}).format(new Date())}
function expired(value?:string|null){if(!value)return false;const d=new Date(`${value}T23:59:59`);return Number.isFinite(d.getTime())&&d.getTime()<Date.now()}

function Integrity({snapshot}:{snapshot:TransportSnapshot}){
  const i=snapshot.integrity
  return <div className={styles.integrity}>
    <StatusPill value={snapshot.authority==='advanced'?(i.installed&&i.safeForOperations?'Exécution sécurisée':'Mutation avancée verrouillée'):'Planification historique'} tone={snapshot.authority==='advanced'?(i.installed&&i.safeForOperations?'good':'warn'):'warn'} />
    <div><strong>{snapshot.authority==='advanced'?'Autorité Transport avancée':'Autorité Transport historique préservée'}</strong>
      <p>{snapshot.authority==='advanced'
        ? i.installed
          ? i.safeForOperations
            ? 'Courses, affectations, contrôles sécurité et événements passent par les garde-fous transactionnels SANILA.'
            : `L’intégrité courante bloque l’exécution : ${i.assignmentStopRouteMismatch+i.assignmentCrossOrg+i.routeReferenceCrossOrg+i.runReferenceCrossOrg+i.runEventReferenceCrossOrg+i.safetyReferenceCrossOrg} incohérence(s) de référence.`
          : i.message
        : 'Le tenant conserve ses données historiques sans dual-write. Les fonctions live-style avancées restent explicitement indisponibles tant qu’une autorité ac360_school_* n’est pas liée.'}</p>
    </div>
  </div>
}

function PlannedNetwork({routes,stops}:{routes:TransportRoute[];stops:TransportStop[]}){
  const active=routes.filter(x=>x.status==='active').slice(0,6)
  if(!active.length)return <EmptyState title="Aucun circuit actif" copy="Créez ou activez un circuit pour construire la cartographie de planification."/>
  return <div className={styles.routeCanvas}>{active.map(route=>{
    const rs=stops.filter(x=>x.routeId===route.id&&x.status!=='archived').sort((a,b)=>a.order-b.order)
    return <Link href={`${BASE}/circuits/${route.id}`} key={route.id} className={styles.routeLine} style={{textDecoration:'none',color:'inherit'}}>
      <div className={styles.routeIdentity}><strong>{route.code}</strong><span>{route.label}</span></div>
      <div className={styles.routeTrack}>{rs.slice(0,7).map(x=><span key={x.id} className={styles.routeDot} title={`${x.order}. ${x.label}`}/>)}{!rs.length?<span className={styles.subtle}>Aucun arrêt</span>:null}</div>
      <div className={styles.routeStats}><strong>{route.assignmentCount}</strong><span>élèves · {route.stopCount} arrêts</span></div>
    </Link>
  })}</div>
}

export function MobilityCommandTheatre({snapshot}:{snapshot:TransportSnapshot}){
  const m=snapshot.metrics
  const todays=snapshot.runs.filter(x=>x.runDate===today()).sort((a,b)=>(a.plannedStartAt||a.startedAt||'').localeCompare(b.plannedStartAt||b.startedAt||'')).slice(0,8)
  const attention=[
    m.failedSafetyChecks?{n:m.failedSafetyChecks,title:'Contrôles sécurité en échec',copy:'Résultats failed/blocked enregistrés aujourd’hui.'}:null,
    m.routesWithoutDriver?{n:m.routesWithoutDriver,title:'Circuits sans chauffeur',copy:'Circuits actifs sans chauffeur par défaut.'}:null,
    m.routesWithoutVehicle?{n:m.routesWithoutVehicle,title:'Circuits sans véhicule',copy:'Circuits actifs sans véhicule par défaut.'}:null,
    m.capacityWarnings?{n:m.capacityWarnings,title:'Pression de capacité',copy:'Affectations actives supérieures à la capacité enregistrée.'}:null,
    m.openAlerts?{n:m.openAlerts,title:'Alertes Transport ouvertes',copy:'Éléments nécessitant une décision ou une résolution.'}:null,
  ].filter(Boolean) as Array<{n:number;title:string;copy:string}>
  return <>
    <section className={styles.hero}><div className={styles.heroGrid}>
      <div className={styles.heroLead}><div><div className={styles.heroKicker}>Mobility Command Theatre · readiness réel</div>
        <h2 className={styles.heroHeadline}>Être prêt à déplacer des enfants en sécurité — sans inventer une seconde de GPS live.</h2>
        <p className={styles.heroCopy}>SANILA relie circuits, arrêts, véhicules, chauffeurs, affectations, courses, événements et contrôles sécurité. Les coordonnées enregistrées servent à la planification; aucun véhicule animé, ETA télématique ou notification parent n’est simulé.</p></div>
        <div className={styles.pulseLine}>
          <div className={styles.pulseItem}><strong>{m.activeRoutes}</strong><span>Circuits actifs</span></div>
          <div className={styles.pulseItem}><strong>{m.activeVehicles}</strong><span>Véhicules actifs</span></div>
          <div className={styles.pulseItem}><strong>{m.activeDrivers}</strong><span>Chauffeurs actifs</span></div>
          <div className={styles.pulseItem}><strong className={m.failedSafetyChecks?styles.bad:styles.good}>{m.failedSafetyChecks}</strong><span>Échecs sécurité aujourd’hui</span></div>
        </div></div>
      <aside className={styles.instrument}><div className={styles.instrumentTitle}>Mobility Readiness</div>
        <div className={styles.instrumentMetric}><span>Affectations actives</span><strong>{m.activeAssignments}</strong></div>
        <div className={styles.instrumentMetric}><span>Courses aujourd’hui</span><strong>{m.runsToday}</strong></div>
        <div className={styles.instrumentMetric}><span>Courses ouvertes</span><strong>{m.runsOpen}</strong></div>
        <div className={styles.instrumentMetric}><span>Alertes ouvertes</span><strong>{m.openAlerts}</strong></div>
        <div className={styles.instrumentMetric}><span>GPS live</span><strong>LOCKED</strong></div>
      </aside>
    </div></section>
    <Integrity snapshot={snapshot}/>
    <section className={styles.section}><div className={styles.gridTwo}>
      <div className={styles.panel}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Planned Network Canvas</div><h2 className={styles.sectionTitle}>Réseau de circuits planifiés</h2><p className={styles.sectionCopy}>Séquence des arrêts et charge connue. Le tracé est conceptuel, jamais une position véhicule en temps réel.</p></div></div><PlannedNetwork routes={snapshot.routes} stops={snapshot.stops}/></div>
      <div className={styles.panel}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>À traiter</div><h2 className={styles.sectionTitle}>Attention opérationnelle</h2></div></div>
        {attention.length?<div className={styles.attention}>{attention.map(x=><div key={x.title} className={styles.attentionItem}><div className={styles.num}>{x.n}</div><div><strong>{x.title}</strong><p>{x.copy}</p></div></div>)}</div>:<EmptyState title="Aucune anomalie prioritaire détectée" copy="Les indicateurs actuellement disponibles ne révèlent pas de blocage critique."/ >}
      </div>
    </div></section>
    <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Daily Movement Board</div><h2 className={styles.sectionTitle}>Mouvements d’aujourd’hui</h2><p className={styles.sectionCopy}>États de course enregistrés, distincts de tout tracking GPS.</p></div><Link className={styles.navLink} href={`${BASE}/courses`}>Ouvrir les courses</Link></div>
      <div className={styles.panel}>{todays.length?<div className={styles.timeline}>{todays.map(run=><div className={styles.timelineItem} key={run.id}><div className={styles.time}>{formatTime(run.plannedStartAt||run.startedAt)}</div><div className={styles.rail}/><div className={styles.timelineBody}><Link href={`${BASE}/courses/${run.id}`}><strong>{run.routeCode} · {run.runType}</strong></Link><p>{run.driverName||'Chauffeur non affecté'} · {run.vehicleLabel||'Véhicule non affecté'} · <StatusPill value={run.status} tone={tone(run.status)}/></p></div></div>)}</div>:<EmptyState title="Aucune course enregistrée aujourd’hui" copy="Les circuits planifiés existent indépendamment des courses d’exécution."/ >}</div>
    </section>
  </>
}

export function RoutesCommand({snapshot}:{snapshot:TransportSnapshot}){
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Route Command</div><h2 className={styles.sectionTitle}>Circuits et préparation</h2><p className={styles.sectionCopy}>Chaque circuit articule direction, type, véhicule, chauffeur, arrêts et population affectée.</p></div></div>
    <div className={styles.cardGrid}>{snapshot.routes.map(r=><Link href={`${BASE}/circuits/${r.id}`} className={styles.card} key={r.id} style={{textDecoration:'none',color:'inherit'}}><div className={styles.cardTop}><span className={styles.cardCode}>{r.code}</span><StatusPill value={r.status} tone={tone(r.status)}/></div><h3 className={styles.cardTitle}>{r.label}</h3><div className={styles.cardMeta}>{r.direction} · {r.routeType}<br/>{r.vehicleLabel||'Véhicule non affecté'} · {r.driverName||'Chauffeur non affecté'}</div><div className={styles.cardFooter}><div className={styles.metricPair}><strong>{r.stopCount}</strong><span>arrêts</span></div><div className={styles.metricPair}><strong className={r.capacityPressure?styles.bad:''}>{r.assignmentCount}</strong><span>élèves</span></div><div className={styles.metricPair}><strong>{r.capacity||'—'}</strong><span>places</span></div></div></Link>)}</div></section>
    <RouteStudio routes={snapshot.routes} vehicles={snapshot.vehicles} drivers={snapshot.drivers}/></>
}

export function RouteOperationsChamber({snapshot,route,stops,assignments,runs}:{snapshot:TransportSnapshot;route:TransportRoute;stops:TransportStop[];assignments:TransportAssignment[];runs:TransportRun[]}){
  return <><section className={styles.dossierHero}><div className={styles.identity}><div className={styles.sectionKicker}>Route Operations Chamber</div><h2>{route.code} · {route.label}</h2><p className={styles.sectionCopy}>Circuit {route.direction} · {route.routeType}</p><div className={styles.identityGrid}>
    <div className={styles.identityCell}><span>État</span><StatusPill value={route.status} tone={tone(route.status)}/></div><div className={styles.identityCell}><span>Véhicule</span><strong>{route.vehicleLabel||'Non affecté'}</strong></div><div className={styles.identityCell}><span>Chauffeur</span><strong>{route.driverName||'Non affecté'}</strong></div><div className={styles.identityCell}><span>Arrêts</span><strong>{route.stopCount}</strong></div><div className={styles.identityCell}><span>Élèves actifs</span><strong>{route.assignmentCount}</strong></div><div className={styles.identityCell}><span>Capacité</span><strong>{route.capacity||'Non renseignée'}</strong></div></div></div>
    <aside className={styles.readiness}><h3>Departure Readiness</h3><div className={styles.readinessRow}><span>Arrêts</span><strong>{stops.length?'READY':'MISSING'}</strong></div><div className={styles.readinessRow}><span>Véhicule</span><strong>{route.vehicleId?'READY':'MISSING'}</strong></div><div className={styles.readinessRow}><span>Chauffeur</span><strong>{route.driverId?'READY':'MISSING'}</strong></div><div className={styles.readinessRow}><span>Capacité</span><strong>{route.capacityPressure?'OVER':'OK'}</strong></div><div className={styles.readinessRow}><span>GPS live</span><strong>LOCKED</strong></div></aside></section>
    <section className={styles.section}><div className={styles.gridTwo}><div className={styles.panel}><div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Séquence des arrêts</h2><p className={styles.sectionCopy}>Heures planifiées; aucune ETA live.</p></div></div>{stops.length?<div className={styles.timeline}>{stops.map(st=><div className={styles.timelineItem} key={st.id}><div className={styles.time}>{formatTime(st.plannedTime)}</div><div className={styles.rail}/><div className={styles.timelineBody}><strong>{st.order}. {st.label}</strong><p>{st.zone||st.address||'Localisation textuelle non renseignée'} · {st.studentCount} élève(s)</p></div></div>)}</div>:<EmptyState title="Aucun arrêt" copy="Ajoutez les arrêts avant la mise en service du circuit."/ >}</div>
      <div className={styles.panel}><div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Population affectée</h2></div></div>{assignments.length?<div className={styles.attention}>{assignments.slice(0,12).map(a=><div className={styles.attentionItem} key={a.id}><div className={styles.num}>{a.studentCode.slice(-3)}</div><div><strong>{a.studentName}</strong><p>{a.stopLabel||'Sans arrêt'} · {a.serviceDirection}</p></div></div>)}</div>:<EmptyState title="Aucun élève actif" copy="Le circuit n’a pas encore de population de transport."/ >}</div></div></section>
    <section className={styles.section}><div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Mémoire des courses</h2></div></div><RunsTable runs={runs}/></section>
  </>
}

function RunsTable({runs}:{runs:TransportRun[]}){return runs.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Date</th><th>Circuit</th><th>Type</th><th>Véhicule</th><th>Chauffeur</th><th>Départ</th><th>État</th><th>Événements</th></tr></thead><tbody>{runs.slice(0,100).map(r=><tr key={r.id}><td>{formatDate(r.runDate)}</td><td><Link href={`${BASE}/courses/${r.id}`}>{r.routeCode}</Link><span className={styles.subtle}>{r.routeLabel}</span></td><td>{r.runType}</td><td>{r.vehicleLabel||'—'}</td><td>{r.driverName||'—'}</td><td>{formatTime(r.startedAt||r.plannedStartAt)}</td><td><StatusPill value={r.status} tone={tone(r.status)}/></td><td>{r.eventCount}</td></tr>)}</tbody></table></div>:<EmptyState title="Aucune course" copy="Les exécutions quotidiennes apparaîtront ici lorsqu’elles seront enregistrées."/>}

export function StopsCommand({snapshot}:{snapshot:TransportSnapshot}){
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Stop Sequence Control</div><h2 className={styles.sectionTitle}>Arrêts planifiés</h2><p className={styles.sectionCopy}>Adresse, zone, ordre et heure planifiée. Les coordonnées servent uniquement à la cartographie de planification.</p></div></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ordre</th><th>Arrêt</th><th>Circuit</th><th>Zone / adresse</th><th>Heure planifiée</th><th>Élèves</th><th>État</th></tr></thead><tbody>{snapshot.stops.map(x=><tr key={x.id}><td>{x.order}</td><td><strong>{x.label}</strong>{x.latitude!=null&&x.longitude!=null?<span className={styles.subtle}>{x.latitude.toFixed(4)}, {x.longitude.toFixed(4)} · PLANIFIÉ</span>:null}</td><td>{x.routeCode}<span className={styles.subtle}>{x.routeLabel}</span></td><td>{x.zone||x.address||'—'}</td><td>{formatTime(x.plannedTime)}</td><td>{x.studentCount}</td><td><StatusPill value={x.status} tone={tone(x.status)}/></td></tr>)}</tbody></table></div></section>
    <StopStudio routes={snapshot.routes} stops={snapshot.stops}/></>
}

export function FleetReadiness({snapshot}:{snapshot:TransportSnapshot}){
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Fleet Readiness Command</div><h2 className={styles.sectionTitle}>Flotte et horizons de conformité</h2></div></div>
    <div className={styles.cardGrid}>{snapshot.vehicles.map(v=><Link href={`${BASE}/vehicules/${v.id}`} className={styles.card} key={v.id} style={{textDecoration:'none',color:'inherit'}}><div className={styles.cardTop}><span className={styles.cardCode}>{v.code}</span><StatusPill value={v.status} tone={tone(v.status)}/></div><h3 className={styles.cardTitle}>{v.label}</h3><div className={styles.cardMeta}>{v.vehicleType} · {v.plateNumber||'Immatriculation non renseignée'}<br/>Assurance {v.insuranceExpiry?formatDate(v.insuranceExpiry):'—'} · Inspection {v.inspectionExpiry?formatDate(v.inspectionExpiry):'—'}</div><div className={styles.cardFooter}><div className={styles.metricPair}><strong>{v.capacity}</strong><span>places</span></div><div className={styles.metricPair}><strong>{v.seatbeltCount||'—'}</strong><span>ceintures</span></div><div className={styles.metricPair}><strong className={(expired(v.insuranceExpiry)||expired(v.inspectionExpiry))?styles.bad:''}>{expired(v.insuranceExpiry)||expired(v.inspectionExpiry)?'EXP':'OK'}</strong><span>horizon</span></div></div></Link>)}</div></section>
    <VehicleStudio vehicles={snapshot.vehicles}/></>
}

export function VehicleDossier({snapshot,vehicle,routes,runs,safety}:{snapshot:TransportSnapshot;vehicle:TransportVehicle;routes:TransportRoute[];runs:TransportRun[];safety:TransportSnapshot['safetyChecks']}){
  return <><section className={styles.dossierHero}><div className={styles.identity}><div className={styles.sectionKicker}>Vehicle Readiness Dossier</div><h2>{vehicle.code} · {vehicle.label}</h2><p className={styles.sectionCopy}>{vehicle.vehicleType} · {vehicle.plateNumber||'Immatriculation non renseignée'}</p><div className={styles.identityGrid}><div className={styles.identityCell}><span>État</span><StatusPill value={vehicle.status} tone={tone(vehicle.status)}/></div><div className={styles.identityCell}><span>Capacité</span><strong>{vehicle.capacity}</strong></div><div className={styles.identityCell}><span>Ceintures</span><strong>{vehicle.seatbeltCount||'Non renseigné'}</strong></div><div className={styles.identityCell}><span>Assurance</span><strong className={expired(vehicle.insuranceExpiry)?styles.bad:''}>{formatDate(vehicle.insuranceExpiry)}</strong></div><div className={styles.identityCell}><span>Inspection</span><strong className={expired(vehicle.inspectionExpiry)?styles.bad:''}>{formatDate(vehicle.inspectionExpiry)}</strong></div><div className={styles.identityCell}><span>Circuits actifs</span><strong>{vehicle.routeCount}</strong></div></div></div>
    <aside className={styles.readiness}><h3>Readiness Horizon</h3><div className={styles.readinessRow}><span>Assurance</span><strong>{vehicle.insuranceExpiry?(expired(vehicle.insuranceExpiry)?'EXPIRED':'VALID'):'UNKNOWN'}</strong></div><div className={styles.readinessRow}><span>Inspection</span><strong>{vehicle.inspectionExpiry?(expired(vehicle.inspectionExpiry)?'EXPIRED':'VALID'):'UNKNOWN'}</strong></div><div className={styles.readinessRow}><span>Charge affectée</span><strong>{vehicle.assignmentCount}/{vehicle.capacity||'—'}</strong></div></aside></section>
    <section className={styles.section}><div className={styles.gridTwo}><div className={styles.panel}><h2 className={styles.sectionTitle}>Circuits affectés</h2>{routes.length?routes.map(r=><div className={styles.attentionItem} key={r.id}><div className={styles.num}>{r.assignmentCount}</div><div><Link href={`${BASE}/circuits/${r.id}`}><strong>{r.code} · {r.label}</strong></Link><p>{r.direction} · {r.stopCount} arrêts</p></div></div>):<EmptyState title="Aucun circuit" copy="Ce véhicule n’est affecté à aucun circuit actif."/ >}</div><div className={styles.panel}><h2 className={styles.sectionTitle}>Contrôles sécurité récents</h2>{safety.length?safety.slice(0,10).map(c=><div className={styles.attentionItem} key={c.id}><div className={styles.num}>•</div><div><strong>{c.checkType} · {c.result}</strong><p>{formatDate(c.checkedAt,true)} · {c.notes||'Sans note'}</p></div></div>):<EmptyState title="Aucun contrôle enregistré" copy="Le véhicule n’a pas encore de contrôle sécurité dans l’autorité avancée."/ >}</div></div></section>
    <section className={styles.section}><h2 className={styles.sectionTitle}>Courses</h2><RunsTable runs={runs}/></section>
  </>
}

export function DriversCommand({snapshot}:{snapshot:TransportSnapshot}){
  if(snapshot.authority!=='advanced')return <><div className={styles.truthBox}><h2>Chauffeurs · autorité avancée indisponible</h2><p className={styles.sectionCopy}>Le schéma historique ne possède pas de registre chauffeur autonome. SANILA ne fabrique pas cette couche; la planification reste disponible via les responsables historiques.</p></div></>
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Driver Readiness</div><h2 className={styles.sectionTitle}>Chauffeurs</h2></div></div><div className={styles.cardGrid}>{snapshot.drivers.map(d=><Link href={`${BASE}/chauffeurs/${d.id}`} className={styles.card} key={d.id} style={{textDecoration:'none',color:'inherit'}}><div className={styles.cardTop}><span className={styles.cardCode}>{d.code}</span><StatusPill value={d.status} tone={tone(d.status)}/></div><h3 className={styles.cardTitle}>{d.fullName}</h3><div className={styles.cardMeta}>{d.phone||'Téléphone non renseigné'}<br/>Permis {d.licenseNumber||'—'} · expire {formatDate(d.licenseExpiry)}</div><div className={styles.cardFooter}><div className={styles.metricPair}><strong>{d.routeCount}</strong><span>circuits</span></div><div className={styles.metricPair}><strong>{d.runCountToday}</strong><span>courses jour</span></div><div className={styles.metricPair}><strong className={expired(d.licenseExpiry)?styles.bad:''}>{expired(d.licenseExpiry)?'EXP':'OK'}</strong><span>permis</span></div></div></Link>)}</div></section><DriverStudio drivers={snapshot.drivers} staff={snapshot.staff}/></>
}

export function DriverDossier({driver,routes,runs,safety}:{driver:TransportDriver;routes:TransportRoute[];runs:TransportRun[];safety:TransportSnapshot['safetyChecks']}){
  return <><section className={styles.dossierHero}><div className={styles.identity}><div className={styles.sectionKicker}>Driver Readiness Dossier</div><h2>{driver.fullName}</h2><p className={styles.sectionCopy}>{driver.code} · {driver.phone||'Téléphone non renseigné'}</p><div className={styles.identityGrid}><div className={styles.identityCell}><span>État</span><StatusPill value={driver.status} tone={tone(driver.status)}/></div><div className={styles.identityCell}><span>Permis</span><strong>{driver.licenseNumber||'—'}</strong></div><div className={styles.identityCell}><span>Expiration</span><strong className={expired(driver.licenseExpiry)?styles.bad:''}>{formatDate(driver.licenseExpiry)}</strong></div><div className={styles.identityCell}><span>Circuits</span><strong>{driver.routeCount}</strong></div><div className={styles.identityCell}><span>Courses aujourd’hui</span><strong>{driver.runCountToday}</strong></div></div></div>
    <aside className={styles.readiness}><h3>Driver Gate</h3><div className={styles.readinessRow}><span>Statut</span><strong>{driver.status.toUpperCase()}</strong></div><div className={styles.readinessRow}><span>Permis</span><strong>{driver.licenseExpiry?(expired(driver.licenseExpiry)?'EXPIRED':'VALID'):'UNKNOWN'}</strong></div></aside></section>
    <section className={styles.section}><div className={styles.gridTwo}><div className={styles.panel}><h2 className={styles.sectionTitle}>Circuits</h2>{routes.map(r=><div key={r.id} className={styles.attentionItem}><div className={styles.num}>{r.assignmentCount}</div><div><Link href={`${BASE}/circuits/${r.id}`}><strong>{r.code} · {r.label}</strong></Link><p>{r.vehicleLabel||'Sans véhicule'} · {r.stopCount} arrêts</p></div></div>)}</div><div className={styles.panel}><h2 className={styles.sectionTitle}>Sécurité</h2>{safety.slice(0,10).map(c=><div key={c.id} className={styles.attentionItem}><div className={styles.num}>•</div><div><strong>{c.checkType} · {c.result}</strong><p>{formatDate(c.checkedAt,true)}</p></div></div>)}</div></div></section><section className={styles.section}><RunsTable runs={runs}/></section>
  </>
}

export function AssignmentsMatrix({snapshot}:{snapshot:TransportSnapshot}){
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Student Mobility Matrix</div><h2 className={styles.sectionTitle}>Affectations élèves</h2><p className={styles.sectionCopy}>Circuit, arrêt, direction et période de service. Le montant affiché est un montant Transport enregistré, pas une facture Finance.</p></div></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Élève</th><th>Circuit</th><th>Arrêt</th><th>Direction</th><th>Période</th><th>Montant enregistré</th><th>État</th></tr></thead><tbody>{snapshot.assignments.map(a=><tr key={a.id}><td><strong>{a.studentName}</strong><span className={styles.subtle}>{a.studentCode}</span></td><td>{a.routeCode}<span className={styles.subtle}>{a.routeLabel}</span></td><td>{a.stopLabel||'—'}</td><td>{a.serviceDirection}</td><td>{formatDate(a.startsOn)} → {formatDate(a.endsOn)}</td><td>{formatMoney(a.monthlyFeeMad)}</td><td><StatusPill value={a.status} tone={tone(a.status)}/></td></tr>)}</tbody></table></div></section>
    <AssignmentStudio students={snapshot.students} routes={snapshot.routes} stops={snapshot.stops}/></>
}

export function RunsBoard({snapshot}:{snapshot:TransportSnapshot}){
  const locked=snapshot.authority!=='advanced'||!snapshot.integrity.installed||!snapshot.integrity.safeForOperations
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Daily Movement Board</div><h2 className={styles.sectionTitle}>Courses et exécution</h2><p className={styles.sectionCopy}>État enregistré de l’opération; aucun véhicule en mouvement n’est simulé.</p></div></div><RunsTable runs={[...snapshot.runs].sort((a,b)=>(b.runDate+b.startedAt).localeCompare(a.runDate+a.startedAt))}/></section>
    {snapshot.authority==='advanced'?<RunStudio routes={snapshot.routes} vehicles={snapshot.vehicles} drivers={snapshot.drivers} locked={locked}/>:<div className={styles.truthBox}><strong>Course avancée non disponible sur l’autorité historique.</strong></div>}</>
}

export function RunChamber({snapshot,run,route,stops,assignments,events,safety}:{snapshot:TransportSnapshot;run:TransportRun;route:TransportRoute|null;stops:TransportStop[];assignments:TransportAssignment[];events:TransportSnapshot['events'];safety:TransportSnapshot['safetyChecks']}){
  const locked=!snapshot.integrity.installed||!snapshot.integrity.safeForOperations
  const students=assignments.map(a=>snapshot.students.find(s=>s.id===a.studentId)).filter(Boolean) as TransportSnapshot['students']
  return <><section className={styles.dossierHero}><div className={styles.identity}><div className={styles.sectionKicker}>Mobility Run Chamber</div><h2>{run.routeCode} · {run.runType}</h2><p className={styles.sectionCopy}>{formatDate(run.runDate)} · départ {formatTime(run.startedAt||run.plannedStartAt)}</p><div className={styles.identityGrid}><div className={styles.identityCell}><span>État</span><StatusPill value={run.status} tone={tone(run.status)}/></div><div className={styles.identityCell}><span>Véhicule</span><strong>{run.vehicleLabel||'—'}</strong></div><div className={styles.identityCell}><span>Chauffeur</span><strong>{run.driverName||'—'}</strong></div><div className={styles.identityCell}><span>Élèves attendus</span><strong>{assignments.length}</strong></div><div className={styles.identityCell}><span>Événements</span><strong>{events.length}</strong></div><div className={styles.identityCell}><span>Dernier safety</span><strong>{run.safetyResult||'—'}</strong></div></div></div><aside className={styles.readiness}><h3>Operational Truth</h3><div className={styles.readinessRow}><span>GPS live</span><strong>NOT AVAILABLE</strong></div><div className={styles.readinessRow}><span>État de course</span><strong>{run.status.toUpperCase()}</strong></div><div className={styles.readinessRow}><span>Sécurité</span><strong>{run.safetyResult?.toUpperCase()||'UNKNOWN'}</strong></div></aside></section>
    {['started','in_progress','incident','planned'].includes(run.status)?<RunEventConsole run={run} students={students} stops={stops} locked={locked}/>:null}
    <section className={styles.section}><div className={styles.gridTwo}><div className={styles.panel}><h2 className={styles.sectionTitle}>Chronologie d’exécution</h2>{events.length?<div className={styles.timeline}>{events.map(e=><div className={styles.timelineItem} key={e.id}><div className={styles.time}>{formatTime(e.occurredAt)}</div><div className={styles.rail}/><div className={styles.timelineBody}><strong>{e.eventType}</strong><p>{e.studentName||e.stopLabel||e.notes||'Événement opérationnel'}</p></div></div>)}</div>:<EmptyState title="Aucun événement" copy="Les montées, absences, dépôts, arrêts, retards et incidents apparaîtront ici."/ >}</div><div className={styles.panel}><h2 className={styles.sectionTitle}>Contrôles sécurité</h2>{safety.length?safety.map(c=><div key={c.id} className={styles.attentionItem}><div className={styles.num}>•</div><div><strong>{c.checkType} · {c.result}</strong><p>{formatDate(c.checkedAt,true)} · {c.notes||'Sans note'}</p></div></div>):<EmptyState title="Aucun contrôle lié" copy="Aucun contrôle sécurité n’est directement associé à cette course."/ >}</div></div></section>
  </>
}

function operationRows(snapshot:TransportSnapshot,mode:'pickup'|'dropoff'){
  const runs=snapshot.runs.filter(r=>r.runDate===today()&&r.runType===mode&&['planned','started','in_progress','incident'].includes(r.status))
  return runs.flatMap(run=>snapshot.assignments.filter(a=>a.routeId===run.routeId&&a.status==='active').map(a=>{
    const related=snapshot.events.filter(e=>e.routeRunId===run.id&&e.studentId===a.studentId)
    const success=related.find(e=>e.eventType===(mode==='pickup'?'student_boarded':'student_dropped'))
    const absent=related.find(e=>e.eventType==='student_absent')
    return{run,a,state:success?'confirmed':absent?'absent':'pending',time:success?.occurredAt||absent?.occurredAt||null}
  }))
}
export function PickupControl({snapshot}:{snapshot:TransportSnapshot}){const rows=operationRows(snapshot,'pickup');return <OperationControl title="Pickup Operations" copy="Ramassage quotidien fondé sur les événements réellement enregistrés." rows={rows} />}
export function DropoffControl({snapshot}:{snapshot:TransportSnapshot}){const rows=operationRows(snapshot,'dropoff');return <OperationControl title="Dropoff Operations" copy="Dépôt quotidien, distinct du ramassage, avec preuve d’événement enregistrée." rows={rows} />}
function OperationControl({title,copy,rows}:{title:string;copy:string;rows:any[]}){return <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>{title}</div><h2 className={styles.sectionTitle}>{title==='Pickup Operations'?'Ramassage':'Dépôt'} aujourd’hui</h2><p className={styles.sectionCopy}>{copy}</p></div></div>{rows.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Élève</th><th>Circuit</th><th>Arrêt</th><th>État</th><th>Heure enregistrée</th><th>Course</th></tr></thead><tbody>{rows.map(({run,a,state,time})=><tr key={`${run.id}-${a.id}`}><td><strong>{a.studentName}</strong><span className={styles.subtle}>{a.studentCode}</span></td><td>{a.routeCode}</td><td>{a.stopLabel||'—'}</td><td><StatusPill value={state} tone={state==='confirmed'?'good':state==='absent'?'bad':'warn'}/></td><td>{formatTime(time)}</td><td><Link href={`${BASE}/courses/${run.id}`}>Ouvrir</Link></td></tr>)}</tbody></table></div>:<EmptyState title="Aucune opération active" copy="Aucune course correspondante n’est actuellement ouverte pour aujourd’hui."/>}</section>}

export function SafetyDepartureGate({snapshot}:{snapshot:TransportSnapshot}){
  const locked=snapshot.authority!=='advanced'||!snapshot.integrity.installed||!snapshot.integrity.safeForOperations
  const latest=snapshot.safetyChecks.slice().sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt)).slice(0,20)
  return <><section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Safety Departure Gate</div><h2 className={styles.sectionTitle}>Préparation avant mouvement</h2><p className={styles.sectionCopy}>Le contrôle sécurité est un registre opérationnel; « blocked » et « failed » ne sont jamais maquillés en readiness.</p></div></div>
    <div className={styles.gridThree}><div className={`${styles.truthBox} ${snapshot.metrics.failedSafetyChecks?styles.lock:styles.ok}`}><strong>Contrôles en échec aujourd’hui</strong><span>{snapshot.metrics.failedSafetyChecks}</span></div><div className={`${styles.truthBox} ${snapshot.metrics.routesWithoutDriver?styles.lock:styles.ok}`}><strong>Circuits sans chauffeur</strong><span>{snapshot.metrics.routesWithoutDriver}</span></div><div className={`${styles.truthBox} ${snapshot.metrics.capacityWarnings?styles.lock:styles.ok}`}><strong>Pression capacité</strong><span>{snapshot.metrics.capacityWarnings}</span></div></div></section>
    {snapshot.authority==='advanced'?<SafetyStudio vehicles={snapshot.vehicles} drivers={snapshot.drivers} locked={locked}/>:null}
    <section className={styles.section}><div className={styles.panel}><h2 className={styles.sectionTitle}>Contrôles récents</h2>{latest.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Date</th><th>Type</th><th>Véhicule</th><th>Chauffeur</th><th>Résultat</th><th>Note</th></tr></thead><tbody>{latest.map(c=><tr key={c.id}><td>{formatDate(c.checkedAt,true)}</td><td>{c.checkType}</td><td>{c.vehicleLabel||'—'}</td><td>{c.driverName||'—'}</td><td><StatusPill value={c.result} tone={tone(c.result)}/></td><td>{c.notes||'—'}</td></tr>)}</tbody></table></div>:<EmptyState title="Aucun contrôle sécurité" copy="Aucun contrôle n’est encore enregistré dans l’autorité active."/ >}</div></section>
  </>
}

export function IncidentCommand({snapshot}:{snapshot:TransportSnapshot}){
  const incidentRuns=snapshot.runs.filter(x=>x.status==='incident')
  const incidentEvents=snapshot.events.filter(x=>x.eventType==='incident')
  const failed=snapshot.safetyChecks.filter(x=>['failed','blocked'].includes(x.result))
  return <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Incident Truth</div><h2 className={styles.sectionTitle}>Incidents et exceptions réelles</h2><p className={styles.sectionCopy}>Aucune table « incident » n’est inventée. Cette chambre consolide courses en incident, événements incident et contrôles sécurité en échec réellement présents.</p></div></div>
    <div className={styles.gridThree}><div className={styles.panel}><h2 className={styles.sectionTitle}>Courses incident</h2>{incidentRuns.length?incidentRuns.map(r=><div className={styles.attentionItem} key={r.id}><div className={styles.num}>!</div><div><Link href={`${BASE}/courses/${r.id}`}><strong>{r.routeCode}</strong></Link><p>{formatDate(r.runDate)} · {r.driverName||'—'}</p></div></div>):<EmptyState title="Aucune course en incident" copy="Aucun état incident n’est actuellement enregistré."/ >}</div>
    <div className={styles.panel}><h2 className={styles.sectionTitle}>Événements incident</h2>{incidentEvents.length?incidentEvents.slice(0,20).map(e=><div className={styles.attentionItem} key={e.id}><div className={styles.num}>!</div><div><strong>{formatDate(e.occurredAt,true)}</strong><p>{e.studentName||e.stopLabel||e.notes||'Incident de course'}</p></div></div>):<EmptyState title="Aucun événement incident" copy="Aucun événement incident enregistré."/ >}</div>
    <div className={styles.panel}><h2 className={styles.sectionTitle}>Safety failed/blocked</h2>{failed.length?failed.slice(0,20).map(c=><div className={styles.attentionItem} key={c.id}><div className={styles.num}>×</div><div><strong>{c.result} · {c.checkType}</strong><p>{c.vehicleLabel||c.driverName||'Référence sécurité'}</p></div></div>):<EmptyState title="Aucun échec sécurité" copy="Aucun contrôle failed/blocked enregistré."/ >}</div></div></section>
}

export function NotificationsTruth({snapshot}:{snapshot:TransportSnapshot}){
  const parentEvents=snapshot.events.filter(x=>x.eventType==='parent_notified')
  return <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Commercial Truth</div><h2 className={styles.sectionTitle}>Notifications Transport</h2><p className={styles.sectionCopy}>Un événement « parent_notified » est une trace interne. Il n’est jamais assimilé à une livraison WhatsApp/SMS/email/push sans preuve fournisseur.</p></div></div>
    <div className={styles.truthGrid}><div className={`${styles.truthItem} ${styles.ok}`}><strong>Notifications internes / événements</strong><span>Traçabilité disponible dans l’autorité Transport.</span></div><div className={`${styles.truthItem} ${styles.lock}`}><strong>WhatsApp parent</strong><span>Non prouvé / non activé par ce module.</span></div><div className={`${styles.truthItem} ${styles.lock}`}><strong>SMS parent</strong><span>Non prouvé / non activé par ce module.</span></div><div className={`${styles.truthItem} ${styles.lock}`}><strong>GPS / tracking live</strong><span>Verrouillé. Coordonnées d’arrêt ≠ localisation véhicule.</span></div></div>
    <div className={styles.panel} style={{marginTop:18}}><h2 className={styles.sectionTitle}>Événements « parent_notified » enregistrés</h2>{parentEvents.length?<div className={styles.timeline}>{parentEvents.slice(0,30).map(e=><div className={styles.timelineItem} key={e.id}><div className={styles.time}>{formatTime(e.occurredAt)}</div><div className={styles.rail}/><div className={styles.timelineBody}><strong>Notification event recorded</strong><p>{e.studentName||e.notes||'Aucune preuve de livraison externe associée.'}</p></div></div>)}</div>:<EmptyState title="Aucun événement de notification" copy="Aucune trace interne « parent_notified » n’est actuellement enregistrée."/ >}</div></section>
}

export function Watchtower({snapshot}:{snapshot:TransportSnapshot}){
  const alerts=snapshot.alerts.filter(x=>['open','acknowledged'].includes(x.status))
  return <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Transport Watchtower</div><h2 className={styles.sectionTitle}>Alertes opérationnelles</h2></div></div>{alerts.length?<div className={styles.watch}>{alerts.map(a=><div className={styles.alert} key={a.id}><StatusPill value={a.severity} tone={tone(a.severity)}/><div><strong>{a.title}</strong><p>{a.message||a.key} · {formatDate(a.createdAt,true)}</p></div><ResolveAlertButton alertId={a.id}/></div>)}</div>:<EmptyState title="Aucune alerte Transport ouverte" copy="La Watchtower ne contient actuellement aucune alerte ouverte ou reconnue."/>}</section>
}

export function MobilityForensics({snapshot}:{snapshot:TransportSnapshot}){
  return <section className={styles.section}><div className={styles.sectionHeader}><div><div className={styles.sectionKicker}>Mobility Forensics</div><h2 className={styles.sectionTitle}>Mémoire et audit Transport</h2><p className={styles.sectionCopy}>Événements d’audit centralisés, sans masquer l’origine ou la sévérité.</p></div></div>{snapshot.audits.length?<div className={styles.timeline}>{snapshot.audits.map(a=><div className={styles.timelineItem} key={a.id}><div className={styles.time}>{formatTime(a.createdAt)}</div><div className={styles.rail}/><div className={styles.timelineBody}><strong>{a.action}</strong><p>{a.entityType||'transport'} · {a.actorRole||'acteur'} · {formatDate(a.createdAt,true)}</p></div></div>)}</div>:<EmptyState title="Aucun événement d’audit Transport" copy="Aucun événement correspondant n’est actuellement présent dans l’autorité d’audit centrale."/>}</section>
}
