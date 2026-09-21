'use client'

import { Puck, createUsePuck } from '@puckeditor/core'
import { useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Database,
  Eye,
  Monitor,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  WandSparkles,
} from 'lucide-react'
import type { CmsPage } from '@/angelcare-marketplace/experience-builder/types'
import { HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS } from '@/angelcare-marketplace/studio-homepage-pro-max/recipe'
import { diagnoseStudioDocument } from '../document-doctor'
import type { StudioMaterializationState } from './StudioMaterializationContext'
import styles from './studio-workspace.module.css'

const usePuck = createUsePuck()
type Tab = 'overview' | 'content' | 'data' | 'design' | 'responsive' | 'truth' | 'diagnostics'
type Mode = 'standard' | 'advanced' | 'developer'
type DeviceStyleKey = 'mobileStyle' | 'tabletStyle' | 'desktopStyle'

const tabs: [Tab, string][] = [
  ['overview', 'Vue 360'],
  ['content', 'Contenu'],
  ['data', 'Données'],
  ['design', 'Design'],
  ['responsive', 'Responsive'],
  ['truth', 'Vérité'],
  ['diagnostics', 'Diagnostic'],
]

const provenance = (key: string) => {
  if (key.startsWith('__studio')) return 'GOUVERNÉ'
  if (key.toLowerCase().includes('price') || key.toLowerCase().includes('rating')) return 'CANONIQUE'
  if (key.includes('media')) return 'MEDIA VAULT'
  if (['collectionKey', 'categoryKey'].includes(key)) return 'CANONIQUE'
  return 'ÉDITABLE'
}
const bool = (value: unknown, fallback = true) => (typeof value === 'boolean' ? value : fallback)
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

export function StudioInspector2031({
  page,
  data,
  device,
  materialization,
  serverReady,
  onOpenDoctor,
  onPatchSelected,
}: {
  page: CmsPage
  data: any
  device: 'mobile' | 'tablet' | 'desktop' | 'wide'
  materialization: StudioMaterializationState
  serverReady: boolean | null
  onOpenDoctor: () => void
  onPatchSelected: (id: string, patch: Record<string, unknown>) => void
}) {
  const selected = usePuck((api) => api.selectedItem) as any
  const [tab, setTab] = useState<Tab>('overview')
  const [mode, setMode] = useState<Mode>('standard')

  const props = record(selected?.props)
  const id = typeof props.id === 'string' ? props.id : ''
  const type = String(selected?.type || '')
  const def = HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.find((row) => row.type === type)
  const doctor = useMemo(() => diagnoseStudioDocument(data), [data])
  const source = materialization.report?.entries.find((row) => row.blockId === id)
  const materializedItems = useMemo(() => {
    if (!materialization.data || !id) return []
    const component = (materialization.data.content || []).find((row: any) => row?.props?.id === id) as any
    return Array.isArray(component?.props?.items) ? component.props.items : []
  }, [id, materialization.data])

  const responsive = record(props.responsive)
  const design = record(props.sourceDesign)
  const deviceStyleKey: DeviceStyleKey =
    device === 'mobile' ? 'mobileStyle' : device === 'tablet' ? 'tabletStyle' : 'desktopStyle'
  const deviceStyle = record(responsive[deviceStyleKey])

  const patchResponsive = (key: string, value: boolean) => {
    if (id) onPatchSelected(id, { responsive: { ...responsive, [key]: value } })
  }
  const patchDesign = (key: string, value: unknown) => {
    if (id) onPatchSelected(id, { sourceDesign: { ...design, [key]: value } })
  }
  const patchDeviceStyle = (key: string, value: unknown) => {
    if (!id) return
    onPatchSelected(id, {
      responsive: {
        ...responsive,
        [deviceStyleKey]: { ...deviceStyle, [key]: value },
      },
    })
  }

  if (!selected) {
    return (
      <div className={styles.futureInspectorEmpty}>
        <WandSparkles size={26} />
        <strong>Inspector 2031</strong>
        <p>
          Sélectionnez un bloc. L’inspecteur affichera sa santé, ses données, son design, son responsive et sa provenance.
        </p>
        <div className={styles.readinessMini}>
          <span data-state={doctor.ready ? 'pass' : 'warn'}>Document {doctor.ready ? 'PASS' : 'À revoir'}</span>
          <span data-state={serverReady ? 'pass' : 'neutral'}>Save {serverReady ? 'READY' : 'Preflight'}</span>
          <span data-state={materialization.report?.blockerCount === 0 ? 'pass' : 'warn'}>
            Sources {materialization.report?.blockerCount === 0 ? 'PASS' : 'À vérifier'}
          </span>
        </div>
      </div>
    )
  }

  const visibleTabs = tabs.filter(([key]) => mode !== 'standard' || ['overview', 'content', 'data', 'responsive'].includes(key))

  return (
    <div className={styles.futureInspector}>
      <div className={styles.inspectorIdentity}>
        <div>
          <span>{def?.id || 'BLOC'} · {def?.dataClass || 'Studio'}</span>
          <strong>{def?.label || type}</strong>
          <code>{id || 'ID manquant'}</code>
        </div>
        <div className={styles.healthDots}>
          <i data-state={doctor.blockers ? 'bad' : 'good'} />
          <i data-state={source?.status === 'RESOLVED' ? 'good' : 'neutral'} />
          <i data-state={serverReady ? 'good' : 'neutral'} />
        </div>
      </div>

      <div className={styles.inspectorModes}>
        {(['standard', 'advanced', 'developer'] as const).map((row) => (
          <button key={row} data-active={mode === row} onClick={() => setMode(row)}>
            {row === 'standard' ? 'Standard' : row === 'advanced' ? 'Avancé' : 'Developer'}
          </button>
        ))}
      </div>

      <div className={styles.inspectorTabs}>
        {visibleTabs.map(([key, label]) => (
          <button key={key} data-active={tab === key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className={styles.inspectorPane}>
          <div className={styles.healthGrid}>
            <article><CheckCircle2/><span>Document</span><strong>{doctor.blockers ? 'BLOCK' : 'PASS'}</strong></article>
            <article><Database/><span>Source</span><strong>{source?.status || 'STATIQUE'}</strong></article>
            <article><Eye/><span>Résolus</span><strong>{source?.count ?? materializedItems.length}</strong></article>
            <article><ShieldCheck/><span>Save</span><strong>{serverReady ? 'READY' : 'PREFLIGHT'}</strong></article>
          </div>
          <section className={styles.inspectorCard}>
            <h4>Mission du bloc</h4>
            <p>{def?.purpose || 'Composant AngelCare éditable.'}</p>
          </section>
          <section className={styles.inspectorCard}>
            <h4>Provenance</h4>
            <div className={styles.provenanceRows}>
              {Object.keys(props).filter((key) => !['id', 'items'].includes(key)).slice(0, 20).map((key) => (
                <div key={key}><code>{key}</code><span>{provenance(key)}</span></div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'content' ? (
        <div className={styles.inspectorPane}>
          <div className={styles.inspectorNotice}>
            <SlidersHorizontal size={15}/>
            <div><strong>Édition localisée</strong><span>Les champs Puck restent l’autorité d’édition. Les badges indiquent leur provenance.</span></div>
          </div>
          <Puck.Fields wrapFields={false}/>
        </div>
      ) : null}

      {tab === 'data' ? (
        <div className={styles.inspectorPane}>
          <section className={styles.inspectorCard}>
            <h4>Source réelle</h4>
            {source ? (
              <>
                <dl className={styles.sourceFacts}>
                  <div><dt>Authority</dt><dd>{source.authority || source.sourceId}</dd></div>
                  <div><dt>Source</dt><dd>{source.sourceId}</dd></div>
                  <div><dt>Strategy</dt><dd>{source.strategy}</dd></div>
                  <div><dt>Status</dt><dd>{source.status}</dd></div>
                  <div><dt>Resolved</dt><dd>{source.count}</dd></div>
                </dl>
                <p>{source.note}</p>
              </>
            ) : <p>Ce bloc n’utilise pas de source dynamique P06.</p>}
          </section>
          {materializedItems.length ? (
            <section className={styles.inspectorCard}>
              <h4>Aperçu canonique · {materializedItems.length}</h4>
              <div className={styles.resolvedList}>
                {materializedItems.slice(0, 12).map((row: any, index: number) => (
                  <article key={row.id || index}>
                    {row.mediaUrl ? <img src={String(row.mediaUrl)} alt=""/> : <span/>}
                    <div>
                      <strong>{String(row.title || 'Ressource')}</strong>
                      <small>{row.priceMad != null ? `${row.priceMad} ${row.currencyLabel || 'MAD'}` : String(row.subtitle || row.body || '')}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'design' ? (
        <div className={styles.inspectorPane}>
          <section className={styles.inspectorCard}>
            <h4>Design gouverné · direct</h4>
            <p>Tokens structurés uniquement. Aucun CSS arbitraire n’est requis pour les réglages courants.</p>
            <div className={styles.designControls}>
              <label><span>Fond</span><select value={String(props.background || 'white')} onChange={(e) => id && onPatchSelected(id, { background: e.target.value })}><option value="white">Blanc</option><option value="soft-blue">Bleu doux</option><option value="soft-pink">Rose doux</option><option value="navy">Navy</option><option value="transparent">Transparent</option></select></label>
              <label><span>Densité</span><select value={String(props.density || 'dense')} onChange={(e) => id && onPatchSelected(id, { density: e.target.value })}><option value="dense">Dense</option><option value="balanced">Équilibrée</option><option value="editorial">Éditoriale</option></select></label>
              <label><span>Padding haut</span><input type="number" min="0" max="240" value={Number(design.paddingTop || 0)} onChange={(e) => patchDesign('paddingTop', Number(e.target.value))}/></label>
              <label><span>Padding bas</span><input type="number" min="0" max="240" value={Number(design.paddingBottom || 0)} onChange={(e) => patchDesign('paddingBottom', Number(e.target.value))}/></label>
              <label><span>Gap</span><input type="number" min="0" max="160" value={Number(design.gap || 0)} onChange={(e) => patchDesign('gap', Number(e.target.value))}/></label>
              <label><span>Rayon</span><input type="number" min="0" max="100" value={Number(design.borderRadius || 0)} onChange={(e) => patchDesign('borderRadius', Number(e.target.value))}/></label>
              <label><span>Largeur max</span><input value={String(design.maxWidth || '')} placeholder="ex. 1380px" onChange={(e) => patchDesign('maxWidth', e.target.value)}/></label>
              <label><span>Alignement</span><select value={String(design.textAlign || 'start')} onChange={(e) => patchDesign('textAlign', e.target.value)}><option value="start">Début</option><option value="center">Centre</option><option value="end">Fin</option></select></label>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'responsive' ? (
        <div className={styles.inspectorPane}>
          <section className={styles.inspectorCard}>
            <h4>Responsive Pro · visibilité</h4>
            <div className={styles.responsiveSwitches}>
              <label><Smartphone/><span>Mobile</span><input type="checkbox" checked={bool(responsive.mobileVisible)} onChange={(e) => patchResponsive('mobileVisible', e.target.checked)}/></label>
              <label><Tablet/><span>Tablette</span><input type="checkbox" checked={bool(responsive.tabletVisible)} onChange={(e) => patchResponsive('tabletVisible', e.target.checked)}/></label>
              <label><Monitor/><span>Desktop</span><input type="checkbox" checked={bool(responsive.desktopVisible)} onChange={(e) => patchResponsive('desktopVisible', e.target.checked)}/></label>
            </div>
          </section>
          <section className={styles.inspectorCard}>
            <h4>Réglages du device courant · {device}</h4>
            <p>Ces valeurs sont compilées en règles responsive gouvernées et partagées avec le runtime public.</p>
            {device === 'wide' ? <p>Le mode Wide hérite du contrat Desktop.</p> : (
              <div className={styles.designControls}>
                <label><span>Padding haut</span><input type="number" min="0" max="180" value={Number(deviceStyle.paddingTop || 0)} onChange={(e) => patchDeviceStyle('paddingTop', Number(e.target.value))}/></label>
                <label><span>Padding bas</span><input type="number" min="0" max="180" value={Number(deviceStyle.paddingBottom || 0)} onChange={(e) => patchDeviceStyle('paddingBottom', Number(e.target.value))}/></label>
                <label><span>Gap</span><input type="number" min="0" max="120" value={Number(deviceStyle.gap || 0)} onChange={(e) => patchDeviceStyle('gap', Number(e.target.value))}/></label>
                <label><span>Taille texte</span><input type="number" min="0" max="96" value={Number(deviceStyle.fontSize || 0)} onChange={(e) => patchDeviceStyle('fontSize', Number(e.target.value))}/></label>
                <label><span>Largeur max</span><input value={String(deviceStyle.maxWidth || '')} onChange={(e) => patchDeviceStyle('maxWidth', e.target.value)}/></label>
                <label><span>Alignement</span><select value={String(deviceStyle.textAlign || 'start')} onChange={(e) => patchDeviceStyle('textAlign', e.target.value)}><option value="start">Début</option><option value="center">Centre</option><option value="end">Fin</option></select></label>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'truth' ? (
        <div className={styles.inspectorPane}>
          <section className={styles.inspectorCard}>
            <h4>Vérité & commerce</h4>
            <p>{source?.sourceId === 'catalog.items' ? 'Prix, disponibilité et identité affichés dans le canvas proviennent du Catalog Discovery canonique. Ils ne sont pas copiés dans le draft.' : 'Aucune vérité commerciale dynamique détectée sur ce bloc.'}</p>
            <span className={styles.truthPill}>{source?.status === 'RESOLVED' ? 'CANONICAL · PROVEN' : 'DRAFT · REVIEW'}</span>
          </section>
        </div>
      ) : null}

      {tab === 'diagnostics' ? (
        <div className={styles.inspectorPane}>
          <section className={styles.inspectorCard}>
            <h4>Document Doctor</h4>
            <p>{doctor.blockers} blocker(s) · {doctor.repairable} réparation(s) sûre(s) · {doctor.warnings} warning(s).</p>
            <button className={styles.inspectorAction} onClick={onOpenDoctor}><Activity size={14}/> Ouvrir le diagnostic complet</button>
          </section>
          {mode === 'developer' ? (
            <section className={styles.inspectorCard}>
              <h4>Contrat technique</h4>
              <pre>{JSON.stringify({ pageId: page.id, type, id, source, props: Object.keys(props) }, null, 2)}</pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
