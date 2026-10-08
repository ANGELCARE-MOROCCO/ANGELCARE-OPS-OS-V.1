'use client'

import type { Data } from '@puckeditor/core'
import { CheckCircle2, ChevronDown, Layers3, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildHomepageProMaxWorld01Data, HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS, HOMEPAGE_PRO_MAX_WORLD_01 } from '../recipe'
import { buildLivingMarketplaceWorld02Data, LIVING_MARKETPLACE_COMPONENT_TYPE, LIVING_MARKETPLACE_WORLD_02 } from '@/angelcare-marketplace/homepage-living-marketplace/world'
import styles from './homepage-pro-max-library.module.css'

type WorldKey = 'world01' | 'world02'

type InsertMode = 'replace' | 'append'

export function HomepageProMaxLibrary({ currentData, onApply }: { currentData: Data; onApply: (data: Data, summary: string) => Promise<void> | void }) {
  const [open, setOpen] = useState(true)
  const [confirming, setConfirming] = useState<WorldKey | null>(null)
  const [busy, setBusy] = useState<WorldKey | null>(null)
  const content = Array.isArray(currentData.content) ? currentData.content : []
  const count = content.length

  const status = useMemo(() => {
    const byType = new Map(content.map((row: any) => [String(row?.type || ''), row]))
    return HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(def => ({ def, row: byType.get(def.type) as any, present: byType.has(def.type) }))
  }, [content])
  const installed = status.filter(row => row.present).length
  const livingInstalled = content.some((row: any) => String(row?.type || '') === LIVING_MARKETPLACE_COMPONENT_TYPE)

  const applyWorld = async (world: WorldKey, mode: InsertMode) => {
    setBusy(world)
    try {
      const next = world === 'world02'
        ? buildLivingMarketplaceWorld02Data(currentData, mode)
        : buildHomepageProMaxWorld01Data(currentData, mode)
      const label = world === 'world02' ? 'Living Marketplace Hyper-Commerce 02' : 'Homepage Pro Max World 01'
      await onApply(next, `${label} · ${mode === 'replace' ? 'remplacement complet' : 'insertion complète'}`)
      setConfirming(null)
    } finally {
      setBusy(null)
    }
  }

  return <section className={styles.shell} aria-label="11 · HOMEPAGE PRO MAX">
    <button className={styles.categoryHead} onClick={() => setOpen(v => !v)} aria-expanded={open}>
      <span><b>11</b><span><strong>HOMEPAGE PRO MAX</strong><em>2 mondes source · sélectionnables et publiables</em></span></span><ChevronDown size={16} data-open={open} />
    </button>
    {open ? <>
      <div className={styles.world} data-featured="true">
        <div className={styles.worldHero}><img src={LIVING_MARKETPLACE_WORLD_02.referenceImage} alt="Aperçu AngelCare Living Marketplace — Hyper-Commerce 02" /><div className={styles.worldOverlay}><span>NEW · SOURCE-OWNED WORLD</span><strong>Living Marketplace · Hyper-Commerce 02</strong></div></div>
        <div className={styles.body}>
          <div className={styles.worldTitle}><div><span>MONDE HOMEPAGE · HARD-CODÉ · BODY ONLY</span><h3>{LIVING_MARKETPLACE_WORLD_02.label}</h3><p>Ultra-dense · données canoniques live · médias réels · conversion type-aware · shell global préservé.</p></div><Sparkles size={20} /></div>
          <div className={styles.meta}><i>Hardcoded</i><i>Canonical live</i><i>FR · EN · AR</i><i>Responsive</i><i>Truth firewall</i></div>
          <div className={styles.sourceWorldContract}>
            <header><LockKeyhole size={14}/><strong>Composition protégée</strong><span>{livingInstalled ? 'INSTALLÉ' : 'DISPONIBLE'}</span></header>
            <p>Le Studio assigne et publie ce monde; son design n’est pas reconstruit bloc par bloc. Header, navigation horizontale et footer restent fournis par le shell public existant.</p>
          </div>
          <details className={styles.installOptions} open={!livingInstalled && count === 0}>
            <summary>Activer / insérer ce monde</summary>
            <p>« Remplacer » remplace uniquement le document homepage Studio courant. Le monde source World 01 reste enregistré dans la bibliothèque et n’est jamais supprimé du code.</p>
            {confirming === 'world02' ? <div className={styles.confirm}><strong>Assigner World 02 à la page courante ?</strong><p>Les {count} blocs actuels seront remplacés dans ce document; l’historique Puck conserve l’état précédent.</p><div><button disabled={busy !== null} onClick={() => void applyWorld('world02', 'replace')}>{busy === 'world02' ? 'Application…' : 'Confirmer World 02'}</button><button disabled={busy !== null} onClick={() => setConfirming(null)}>Annuler</button></div></div> : <div className={styles.actions}><button disabled={busy !== null || livingInstalled} onClick={() => count ? setConfirming('world02') : void applyWorld('world02', 'replace')}>{livingInstalled ? 'World 02 assigné à ce brouillon' : 'Assigner ce monde'}</button></div>}
          </details>
        </div>
      </div>

      <div className={styles.world}>
        <div className={styles.worldHero}><img src={HOMEPAGE_PRO_MAX_WORLD_01.referenceImage} alt="Aperçu AngelCare Famille & Bébé — Hyper-Commerce 01" /><div className={styles.worldOverlay}><span>EXISTING WORLD · PRESERVED</span><strong>Édition guidée</strong></div></div>
        <div className={styles.body}>
          <div className={styles.worldTitle}><div><span>MONDE HOMEPAGE · APPROUVÉ</span><h3>{HOMEPAGE_PRO_MAX_WORLD_01.label}</h3><p>{HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.length} sections · Desktop + mobile · MAD/Dhs · données réelles</p></div><ShieldCheck size={20} /></div>
          <div className={styles.meta}><i>18 sections</i><i>Puck</i><i>Données réelles</i><i>Responsive</i></div>
          <div className={styles.sectionNavigator}>
            <header><div><Layers3 size={14}/><strong>Sections de la page</strong></div><span>{installed === 18 ? 'COMPLET' : `${installed}/18`}</span></header>
            <div className={styles.sectionList}>{status.map(({ def, row, present }) => <article key={def.type} data-present={present || undefined} data-hidden={Boolean(row?.props?.hidden) || undefined}>
              <span className={styles.sectionIndex}>{def.id}</span>
              <span className={styles.sectionCopy}><strong>{def.label.replace(/^S\d+\s*·\s*/, '')}</strong><small>{def.purpose}</small></span>
              <span className={styles.sectionState}>{present ? <CheckCircle2 size={14}/> : <span>—</span>}</span>
            </article>)}</div>
          </div>
          <details className={styles.installOptions}>
            <summary>Installation & options avancées</summary>
            <p>World 01 reste disponible tel quel. Ces actions modifient uniquement le document courant.</p>
            {confirming === 'world01' ? <div className={styles.confirm}><strong>Remplacer les {count} blocs actuels ?</strong><p>L’historique Puck conserve l’état précédent pour Undo.</p><div><button disabled={busy !== null} onClick={() => void applyWorld('world01', 'replace')}>{busy === 'world01' ? 'Application…' : 'Confirmer le remplacement'}</button><button disabled={busy !== null} onClick={() => setConfirming(null)}>Annuler</button></div></div> : <div className={styles.actions}><button disabled={busy !== null} onClick={() => count ? setConfirming('world01') : void applyWorld('world01', 'replace')}>Remplacer la page</button><button disabled={busy !== null} onClick={() => void applyWorld('world01', 'append')}>Insérer ici</button></div>}
          </details>
        </div>
      </div>
    </> : null}
  </section>
}
