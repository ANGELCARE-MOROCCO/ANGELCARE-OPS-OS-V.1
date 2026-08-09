import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  Globe2,
  Languages,
  MapPinned,
  Settings2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { TerritoryDetailBundle, TerritoryStatus } from '../types'
import { formatDate, formatDateTime, ownerLabel } from '../format'
import styles from '../territory-os.module.css'
import { CommandPanel, GateStatusPill, ScoreRing, TerritoryHealthPill, TerritoryStatusPill } from './TerritoryPrimitives'
import { TerritoryTransitionActions } from './TerritoryTransitionActions'

const lifecycle: TerritoryStatus[] = ['draft','configuring','review','soft_launch','live','paused','archived']

export function TerritoryDetailCommand({ bundle, allowedTargets }: { bundle: TerritoryDetailBundle; allowedTargets: TerritoryStatus[] }) {
  const { territory, readiness, settings, overrides, launchChecks, healthEvents, cityZones, supportContacts, approvals } = bundle
  const currentIndex = lifecycle.indexOf(territory.status)
  const openIssues = healthEvents.filter((event)=>['open','acknowledged'].includes(event.status)).length
  const pendingOverrides = overrides.filter((item)=>['submitted','in_review'].includes(item.status)).length
  return <div className={styles.territoryCommand}>
    <section className={styles.detailHero}>
      <div className={styles.detailIdentity}><div className={styles.detailMonogram}>{territory.country_code}</div><div><span className={styles.detailEyebrow}>Territory Command · {territory.public_reference}</span><h1 className={styles.detailTitle}>{territory.name}</h1><div className={styles.detailMeta}><TerritoryStatusPill status={territory.status}/><TerritoryHealthPill status={territory.health_status}/><span><Globe2 size={12}/> {territory.territory_code}</span><span><Clock3 size={12}/> {territory.timezone}</span><span><Languages size={12}/> {territory.active_locales.join(' · ').toUpperCase()}</span><span><UserRound size={12}/> {ownerLabel(territory.owner_id)}</span></div></div></div>
      <div className={styles.detailActions}><Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/preview`} className={styles.buttonSecondary}>Prévisualiser</Link><TerritoryTransitionActions territory={territory} allowedTargets={allowedTargets}/></div>
    </section>

    <nav className={styles.detailNavigation} aria-label="Dossier territoire">
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}`}>Vue exécutive</Link>
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/settings`}>Paramètres</Link>
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/overrides`}>Héritage & overrides</Link>
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/readiness`}>Launch gates</Link>
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/health`}>Santé & événements</Link>
      <Link className={styles.detailNavLink} href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/preview`}>Preview</Link>
    </nav>

    <section className={styles.summaryGrid}>
      <Summary label="Readiness" value={`${readiness.score}%`} hint={`${readiness.blocking} gate(s) bloquante(s)`}/>
      <Summary label="Overrides ouverts" value={pendingOverrides} hint={`${overrides.length} dérogation(s) enregistrée(s)`}/>
      <Summary label="Couverture" value={cityZones.length} hint={`${cityZones.filter((zone)=>zone.coverage_status==='operational').length} zone(s) opérationnelle(s)`}/>
      <Summary label="Alertes ouvertes" value={openIssues} hint={`${healthEvents.filter((event)=>event.severity==='critical'&&event.status!=='resolved').length} critique(s)`}/>
    </section>

    <CommandPanel title="Cycle de vie contrôlé" subtitle="Les transitions sont validées côté serveur; les launch gates restent souveraines.">
      <div className={styles.lifecycle}>{lifecycle.map((status,index)=>{const complete=index<currentIndex;const current=index===currentIndex;return <div key={status} className={`${styles.lifecycleStep} ${complete?styles.lifecycleComplete:''} ${current?styles.lifecycleCurrent:''}`}><span className={styles.lifecycleDot}>{complete?<CheckCircle2 size={13}/>:current?<Circle size={10}/>:index+1}</span><span>{status.replace('_',' ')}</span></div>})}</div>
    </CommandPanel>

    <section className={styles.twoColumn}>
      <div style={{display:'grid',gap:18}}>
        <CommandPanel title="Launch readiness" subtitle="Lecture exécutive des gates réelles et des preuves manquantes." action={<Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/readiness`} className={styles.buttonSecondary}>Ouvrir le command board <ArrowRight size={13}/></Link>}>
          <div className={styles.readinessHero} style={{border:0,padding:0}}><ScoreRing value={readiness.score}/><div className={styles.readinessNarrative}><h2>{readiness.launchEligible?'Éligible à la décision live':readiness.softLaunchEligible?'Éligible au soft launch contrôlé':'Lancement bloqué'}</h2><p>{readiness.blocking?`${readiness.blocking} gate(s) obligatoire(s) empêchent encore la mise en service. Chaque blocage doit recevoir un propriétaire, une preuve et une décision.`:'Toutes les gates bloquantes sont validées. La Direction conserve l’autorité finale de lancement.'}</p><div className={styles.readinessStats}><Stat label="Validées" value={readiness.passed}/><Stat label="Bloquantes" value={readiness.blocking}/><Stat label="En retard" value={readiness.overdue}/><Stat label="Sans owner" value={readiness.missingOwners}/></div></div></div>
          <div className={styles.gateGroups} style={{marginTop:18}}>{launchChecks.slice(0,5).map((check)=><div className={styles.decisionItem} key={check.id}><span className={styles.decisionIcon}>{check.status==='failed'?<AlertTriangle size={15}/>:<FileCheck2 size={15}/>}</span><span className={styles.decisionContent}><strong>{check.title}</strong><p>{check.next_action || check.description}</p></span><GateStatusPill status={check.status}/></div>)}</div>
        </CommandPanel>

        <CommandPanel title="Configuration territoriale" subtitle="Standards effectifs, héritage et verrouillage." action={<Link href={`/angelcare-marketplace/admin/territories/${territory.territory_code}/settings`} className={styles.buttonSecondary}><Settings2 size={13}/> Administrer</Link>} flush>
          <div className={styles.settingList}>{settings.slice(0,7).map((setting)=><div className={styles.settingRow} key={setting.id}><span className={styles.settingLabel}><strong>{setting.label}</strong><span>{setting.category} · {setting.setting_key}</span></span><span className={styles.settingValue}>{formatValue(setting.effective_value)}</span><span className={`${styles.inheritanceBadge} ${setting.is_locked?styles.lockedGlobal:setting.inheritance_mode==='local_override'?styles.localOverride:styles.inherited}`}>{setting.is_locked?'Global verrouillé':setting.inheritance_mode==='local_override'?'Override local':'Hérité'}</span></div>)}</div>
        </CommandPanel>
      </div>

      <div style={{display:'grid',gap:18}}>
        <CommandPanel title="Carte opérationnelle" subtitle="Couverture déclarée, jamais supposée.">
          <div className={styles.decisionQueue}>
            {cityZones.length?cityZones.slice(0,6).map((zone)=><div className={styles.decisionItem} key={zone.id}><span className={styles.decisionIcon}><MapPinned size={15}/></span><span className={styles.decisionContent}><strong>{zone.city_name}{zone.zone_name?` · ${zone.zone_name}`:''}</strong><p>{zone.coverage_status} · support {zone.support_level}</p></span><span className={styles.localeTag}>{zone.active?'ACTIVE':'OFF'}</span></div>):<div className={styles.noticeWarning}><MapPinned size={16}/><span>Aucune zone enregistrée. La gate opérations doit rester bloquée.</span></div>}
          </div>
        </CommandPanel>
        <CommandPanel title="Responsabilité & support" subtitle="Ce territoire ne doit dépendre d’aucune mémoire informelle.">
          <div className={styles.activityList}>
            <Info icon={<UserRound size={12}/>} title="Propriétaire" text={ownerLabel(territory.owner_id)}/>
            <Info icon={<Building2 size={12}/>} title="Sponsor exécutif" text={territory.executive_sponsor_id?ownerLabel(territory.executive_sponsor_id):'À assigner avant le lancement'}/>
            <Info icon={<ShieldCheck size={12}/>} title="Routes de support" text={`${supportContacts.filter((contact)=>contact.active).length} contact(s) actif(s)`}/>
            <Info icon={<CalendarDays size={12}/>} title="Date cible" text={formatDate(territory.target_launch_at)}/>
          </div>
        </CommandPanel>
        <CommandPanel title="Décisions enregistrées" subtitle="Sign-offs conservés dans le dossier de lancement.">
          {approvals.length?<div className={styles.activityList}>{approvals.slice(0,4).map((approval)=><Info key={approval.id} icon={<CheckCircle2 size={12}/>} title={`${approval.approval_type} · ${approval.decision}`} text={`${approval.readiness_score}% · ${formatDateTime(approval.created_at)}`}/>)}</div>:<div className={styles.noticeInfo}><FileCheck2 size={16}/><span>Aucun sign-off de lancement enregistré.</span></div>}
        </CommandPanel>
      </div>
    </section>
  </div>
}

function Summary({label,value,hint}:{label:string;value:string|number;hint:string}) { return <article className={styles.summaryCard}><span className={styles.summaryCardLabel}>{label}</span><div className={styles.summaryCardValue}>{value}</div><div className={styles.summaryCardHint}>{hint}</div></article> }
function Stat({label,value}:{label:string;value:number}) { return <div className={styles.readinessStat}><span>{label}</span><strong>{value}</strong></div> }
function Info({icon,title,text}:{icon:ReactNode;title:string;text:string}) { return <div className={styles.activityItem}><span className={styles.activityDot}>{icon}</span><span className={styles.activityContent}><strong>{title}</strong><p>{text}</p></span></div> }
function formatValue(value:unknown):string { if(value==null)return 'Non renseigné'; if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value); return JSON.stringify(value) }
