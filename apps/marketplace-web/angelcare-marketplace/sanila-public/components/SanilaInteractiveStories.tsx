'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { CUSTOMER_ACCESS, sanilaHref } from '../content'
import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

const moments = [
  { time: '07:30', role: 'Administration', domain: 'Structure', action: 'Ouvre la journée et vérifie les éléments opérationnels.' },
  { time: '07:55', role: 'Personnel', domain: 'Présences', action: 'Les premiers statuts remontent depuis les classes.' },
  { time: '08:15', role: 'Direction', domain: 'Pilotage', action: 'La direction lit les exceptions qui méritent une décision.' },
  { time: '09:30', role: 'Admissions', domain: 'Famille', action: 'Une nouvelle demande rejoint un dossier et une prochaine action.' },
  { time: '11:00', role: 'Finance', domain: 'Encaissement', action: 'Un paiement reste relié à sa facture, son reçu et son solde.' },
  { time: '13:40', role: 'Enseignant', domain: 'Pédagogie', action: 'Cours, devoirs et évaluations progressent dans le contexte de la classe.' },
  { time: '15:45', role: 'Transport', domain: 'Opération', action: 'Circuits, arrêts, véhicules et responsabilités structurent la sortie.' },
  { time: '17:10', role: 'Parent', domain: 'Relation', action: 'La famille accède à l’information autorisée et à son contexte.' },
  { time: '18:00', role: 'Direction', domain: 'Clôture', action: 'La journée se ferme avec une lecture institutionnelle plutôt qu’une collection de messages.' },
]

export function InteractiveDayStory() {
  const [active, setActive] = useState(2)
  const moment = moments[active]
  return (
    <div className={styles.interactiveDayStory}>
      <div className={styles.interactiveDayRail} role="tablist" aria-label="Une journée avec SANILA">
        {moments.map((item, index) => (
          <button type="button" role="tab" aria-selected={active === index} key={item.time} onClick={() => setActive(index)}>
            <time>{item.time}</time><span>{item.domain}</span>
          </button>
        ))}
      </div>
      <div className={styles.interactiveDayDetail}>
        <div className={styles.interactiveDayClock}><strong>{moment.time}</strong><span>{String(active + 1).padStart(2, '0')} / {moments.length.toString().padStart(2, '0')}</span></div>
        <div><span>{moment.role} • {moment.domain}</span><h3>{moment.action}</h3><p>Chaque moment conserve son acteur, son domaine et sa conséquence opérationnelle. L’histoire ne dépend pas d’un faux cockpit marketing.</p></div>
        <Link href={sanilaHref(moment.domain === 'Encaissement' ? 'finance' : moment.domain === 'Pédagogie' ? 'pedagogie' : moment.domain === 'Présences' ? 'presences' : 'produit')}>Explorer le domaine <SanilaIcon name="arrow" size={15} /></Link>
      </div>
    </div>
  )
}

export function RoleSwitchboard() {
  const [active, setActive] = useState(0)
  const entry = CUSTOMER_ACCESS[active]
  return (
    <div className={styles.roleSwitchboard}>
      <nav aria-label="Expériences utilisateurs">
        {CUSTOMER_ACCESS.map((item, index) => <button type="button" key={item.key} onClick={() => setActive(index)} aria-current={index === active ? 'true' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong></button>)}
      </nav>
      <div className={styles.roleSwitchboardStage}>
        <div className={styles.roleSwitchboardImage}>{entry.image ? <Image src={entry.image} alt={`Accès SANILA — ${entry.title}`} fill sizes="(max-width: 900px) 100vw, 55vw" /> : null}</div>
        <div className={styles.roleSwitchboardCopy}><span>EXPÉRIENCE {entry.title.toUpperCase()}</span><h3>{entry.title}</h3><p>{entry.description}</p><Link href={entry.href}>Accéder à l’espace <SanilaIcon name="arrow" size={15} /></Link></div>
      </div>
    </div>
  )
}
