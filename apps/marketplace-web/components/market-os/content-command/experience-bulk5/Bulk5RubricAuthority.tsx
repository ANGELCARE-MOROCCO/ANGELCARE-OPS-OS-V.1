"use client"

import * as React from "react"
import { BookOpenCheck, CheckCircle2, FileKey2, Scale, ShieldAlert, Tags } from "lucide-react"
import { REVIEW_RUBRICS } from "./bulk5-model"
import { SectionTitle, TonePill, styles } from "./Bulk5Shared"

export default function Bulk5RubricAuthority() {
  const [selected, setSelected] = React.useState(REVIEW_RUBRICS[0].code)
  const rubric = REVIEW_RUBRICS.find((item) => item.code === selected) || REVIEW_RUBRICS[0]
  return <section className={styles.rubricAuthority} data-bulk5-silhouette="rubric-constitution">
    <aside className={styles.rubricLibrary}><SectionTitle eyebrow="REVIEW RUBRIC LIBRARY" title="Critères d’inspection versionnés" description="Référentiel front-end source-governed; aucune modification n’est prétendue persistée sans API dédiée."/>{REVIEW_RUBRICS.map((item) => <button type="button" key={item.code} aria-current={item.code === rubric.code ? "page" : undefined} onClick={() => setSelected(item.code)}><span><small>{item.code} · v{item.version}</small><strong>{item.name}</strong><em>{item.family}</em></span><TonePill tone={item.status === "active" ? "success" : "warning"}>{item.status}</TonePill></button>)}</aside>
    <article className={styles.rubricConstitution}><header><BookOpenCheck/><span><small>RUBRIC CONSTITUTION</small><h2>{rubric.name}</h2><p>{rubric.code} · Version {rubric.version} · {rubric.authority}</p></span></header><section className={styles.rubricMeta}><div><Tags/><span><small>APPLICABILITÉ</small><strong>{rubric.appliesTo.join(" · ")}</strong></span></div><div><Scale/><span><small>AUTORITÉ</small><strong>{rubric.authority}</strong></span></div><div><FileKey2/><span><small>VERSION</small><strong>{rubric.version} · Source governed</strong></span></div></section><div className={styles.criteriaConstitution}>{rubric.criteria.map((criterion) => <article key={criterion.code}><span>{criterion.blocking ? <ShieldAlert/> : <CheckCircle2/>}</span><div><small>{criterion.code} · {criterion.severity}</small><strong>{criterion.title}</strong><p>{criterion.purpose}</p><em>Preuve attendue : {criterion.evidence}</em></div><TonePill tone={criterion.blocking ? "danger" : criterion.severity === "major" || criterion.severity === "critical" ? "warning" : "info"}>{criterion.blocking ? "Bloquant" : "Contrôle"}</TonePill></article>)}</div></article>
  </section>
}
