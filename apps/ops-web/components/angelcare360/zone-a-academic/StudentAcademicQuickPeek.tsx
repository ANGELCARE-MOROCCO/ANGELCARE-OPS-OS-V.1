'use client'

import Link from 'next/link'
import AcademicZoneACommandDrawer from './AcademicZoneACommandDrawer'
import styles from './AcademicZoneAChrome.module.css'

type Props = {
  studentId: string
  name: string
  code: string
  score: number | null
  maxScore: number | null
  state: string
}

export default function StudentAcademicQuickPeek({ studentId, name, code, score, maxScore, state }: Props) {
  const result = score === null ? 'Non saisie' : `${score}${maxScore ? ` / ${maxScore}` : ''}`
  return (
    <AcademicZoneACommandDrawer triggerLabel="Vue élève" triggerKind="quiet" title="Student Academic Quick-Peek" eyebrow="Contexte académique" description="Consulter le contexte de cette ligne avant d’ouvrir le dossier maître Élève 360.">
      <div className={styles.studentPeek}>
        <header><span>Élève</span><h3>{name}</h3><p>{code}</p></header>
        <div className={styles.studentPeekGrid}>
          <div><span>Résultat courant</span><strong>{result}</strong></div>
          <div><span>État</span><strong>{state}</strong></div>
        </div>
        <p>Cette vue ne recrée pas le dossier étudiant. Elle conserve la note courante dans son contexte et délègue l’identité, le parcours et les autres vérités à Élève 360.</p>
        <Link href={`/angelcare-360-command-center/eleves/${studentId}`}>Ouvrir le dossier Élève 360 →</Link>
      </div>
    </AcademicZoneACommandDrawer>
  )
}
