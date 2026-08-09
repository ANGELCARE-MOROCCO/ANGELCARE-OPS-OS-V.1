'use client'

import Link from 'next/link'
import { Boxes, FileSpreadsheet, LayoutDashboard, Network, ScanSearch, Sparkles, Workflow } from 'lucide-react'
import styles from '../category-native.module.css'
import type { CategoryNativeStudioData } from '../types'

const workspaces = [
  ['/angelcare-marketplace/admin/category-native/schemas','Architecture des schémas','Hiérarchie, héritage, champs et autorités.',Network],
  ['/angelcare-marketplace/admin/category-native/archetypes','Studios par archétype','Expériences d’administration réellement verticalisées.',Boxes],
  ['/angelcare-marketplace/admin/category-native/template-factory','CSV Template Factory','Templates précis, guides et colonnes adaptées.',FileSpreadsheet],
  ['/angelcare-marketplace/admin/category-native/imports','Import Command','Dry-run, erreurs ligne par ligne, exécution et rollback.',Workflow],
  ['/angelcare-marketplace/admin/category-native/homepage-designer','Homepage Designer 2.0','Canvas premium et blocs commerce category-aware.',LayoutDashboard],
]

export function CategoryNativeCommand({ data }: { data: CategoryNativeStudioData }) {
  return <main className={styles.shell}>
    <section className={styles.commandHero}>
      <div><span>CATEGORY-NATIVE COMMERCE CONTROL PLANE · MZ1</span><h1>Une intelligence commerciale différente pour chaque réalité ANGELCARE.</h1><p>Le même schéma gouverne le studio Admin, le CSV, les variantes, les attributs, la disponibilité, la homepage et le futur moteur client.</p></div>
      <div className={styles.readinessDial}><strong>{data.summary.readiness.schemaCoverage}%</strong><span>SCHEMA COVERAGE</span><i>{data.summary.activeSchemas} archétypes actifs</i></div>
    </section>
    <section className={styles.metricRibbon}>
      <article><Network/><span>Schémas actifs</span><strong>{data.summary.activeSchemas}</strong></article>
      <article><ScanSearch/><span>Champs gouvernés</span><strong>{data.summary.totalFields}</strong></article>
      <article><FileSpreadsheet/><span>Templates CSV</span><strong>{data.summary.csvTemplates}</strong></article>
      <article><Sparkles/><span>Blocs homepage</span><strong>{data.summary.homepageBlocks}</strong></article>
      <article><Workflow/><span>Imports actifs</span><strong>{data.summary.activeImports}</strong></article>
    </section>
    <section className={styles.workspaceGrid}>{workspaces.map(([href,title,copy,Icon]) => <Link href={String(href)} key={String(href)}><span>CONTROL SURFACE</span><Icon size={28}/><h2>{String(title)}</h2><p>{String(copy)}</p><b>Ouvrir →</b></Link>)}</section>
    <section className={styles.coverageGrid}>
      <article><header><span>SEGMENTS</span><strong>{data.summary.segments.length}</strong></header>{data.summary.segments.map((entry)=><div key={entry.key}><span>{entry.key.replaceAll('_',' ')}</span><b>{entry.count}</b></div>)}</article>
      <article><header><span>VERTICALES</span><strong>{data.summary.verticals.length}</strong></header>{data.summary.verticals.slice(0,12).map((entry)=><div key={entry.key}><span>{entry.key.replaceAll('_',' ')}</span><b>{entry.count}</b></div>)}</article>
      <article className={styles.doctrineCard}><span>OPERATING LAW</span><h2>Admin configure. Admin importe. Admin publie. Le système reste synchronisé.</h2><p>Aucune approbation obligatoire. Les validations protègent uniquement l’intégrité structurelle et la vérité commerciale.</p></article>
    </section>
  </main>
}
