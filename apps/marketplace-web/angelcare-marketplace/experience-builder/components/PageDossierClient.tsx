'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  Blocks,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileClock,
  History,
  Languages,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { CmsBlock, CmsPage, CmsPageStatus, CmsPageVersion, CmsRevision, PreviewSession } from '../types'
import styles from '../experience.module.css'

type Tab = 'overview' | 'content' | 'seo' | 'history'

interface Permissions {
  edit: boolean
  blocks: boolean
  preview: boolean
  rollback: boolean
  transitions: Partial<Record<CmsPageStatus, boolean>>
}

interface Props {
  initialPage: CmsPage
  blocks: CmsBlock[]
  versions: CmsPageVersion[]
  revisions?: CmsRevision[]
  permissions: Permissions
}

const transitions: Record<CmsPageStatus, CmsPageStatus[]> = {
  draft: ['submitted', 'archived'],
  submitted: ['in_review', 'draft', 'archived'],
  in_review: ['approved', 'draft', 'archived'],
  approved: ['scheduled', 'published', 'draft', 'archived'],
  scheduled: ['published', 'approved', 'archived'],
  published: ['retired', 'draft'],
  retired: ['published', 'archived'],
  archived: [],
}

const transitionLabels: Partial<Record<CmsPageStatus, string>> = {
  submitted: 'Soumettre',
  in_review: 'Prendre en revue',
  approved: 'Approuver',
  scheduled: 'Planifier',
  published: 'Publier',
  retired: 'Retirer du public',
  archived: 'Archiver',
  draft: 'Renvoyer au brouillon',
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options)
  const payload = await response.json() as { data?: T; error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }
  if (!response.ok || !payload.data) {
    const fields = payload.error?.details?.fieldErrors
    const detail = fields ? Object.values(fields).flat().join(' ') : ''
    throw new Error([payload.error?.message || 'Commande impossible.', detail].filter(Boolean).join(' '))
  }
  return payload.data
}

function displayDate(value: string | null) {
  if (!value) return 'Non défini'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function PageDossierClient({ initialPage, blocks, versions, revisions = [], permissions }: Props) {
  const [page, setPage] = useState(initialPage)
  const [tab, setTab] = useState<Tab>('overview')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pendingTarget, setPendingTarget] = useState<CmsPageStatus | null>(null)
  const [rollbackVersion, setRollbackVersion] = useState<CmsPageVersion | CmsRevision | null>(null)
  const [previewSessions, setPreviewSessions] = useState<PreviewSession[]>([])
  const transitionDialog = useRef<HTMLDialogElement>(null)
  const rollbackDialog = useRef<HTMLDialogElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const rollbackReasonRef = useRef<HTMLTextAreaElement>(null)
  const readiness = useMemo(() => [
    { label: 'Titre public', ready: Boolean(page.title.trim()), evidence: page.title || 'Manquant' },
    { label: 'Slug stable', ready: Boolean(page.slug.trim()), evidence: page.slug || 'Manquant' },
    { label: 'Titre SEO', ready: Boolean(page.seo_title?.trim()), evidence: page.seo_title || 'Manquant' },
    { label: 'Description SEO', ready: Boolean(page.seo_description?.trim()), evidence: page.seo_description || 'Manquante' },
    { label: 'Composition', ready: blocks.length > 0, evidence: `${blocks.length} bloc(s)` },
    { label: 'Traduction', ready: page.locale === 'fr' || page.translation_status === 'approved', evidence: page.translation_status },
  ], [blocks.length, page])
  const ready = readiness.every((item) => item.ready)
  const lifecycleTargets = useMemo(() => { const base = transitions[page.status]; return page.publication_state === 'published' && !base.includes('retired') ? [...base, 'retired' as CmsPageStatus] : base }, [page.publication_state, page.status])
  const publicLocale = page.published_locale || page.locale
  const publicSlug = page.published_slug || page.slug
  const publicHref = publicSlug === 'accueil' ? `/angelcare-marketplace/${publicLocale}` : `/angelcare-marketplace/${publicLocale}/${publicSlug}`

  useEffect(() => {
    if (!permissions.preview) return
    void request<PreviewSession[]>(`/api/angelcare-marketplace/cms/previews?pageId=${page.id}`).then(setPreviewSessions).catch(() => setPreviewSessions([]))
  }, [page.id, permissions.preview])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  async function run<T>(operation: () => Promise<T>, success: string): Promise<T | null> {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = await operation()
      setMessage(success)
      return result
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Commande impossible.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await run(
      () => request<CmsPage>(`/api/angelcare-marketplace/cms/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          navigation_label: form.get('navigation_label'),
          slug: form.get('slug'),
          description: form.get('description'),
          seo_title: form.get('seo_title'),
          seo_description: form.get('seo_description'),
          canonical_url: form.get('canonical_url'),
          translation_status: form.get('translation_status'),
          sensitive: form.get('sensitive') === 'on',
          scheduled_at: form.get('scheduled_at') || null,
          changeSummary: form.get('changeSummary'),
          expectedVersion: page.current_version,
        }),
      }),
      'Page versionnée et métadonnées enregistrées.',
    )
    if (result) {
      setPage(result)
      setDirty(false)
    }
  }

  function openTransition(target: CmsPageStatus) {
    setPendingTarget(target)
    transitionDialog.current?.showModal()
    window.setTimeout(() => reasonRef.current?.focus(), 0)
  }

  async function confirmTransition() {
    if (!pendingTarget) return
    const reason = reasonRef.current?.value.trim() || ''
    if (!reason) {
      setError('Un motif opérateur est obligatoire.')
      reasonRef.current?.focus()
      return
    }
    const result = await run(
      () => request<CmsPage>(`/api/angelcare-marketplace/cms/pages/${page.id}/transition`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: pendingTarget, reason }),
      }),
      `Transition vers ${pendingTarget} enregistrée et auditée.`,
    )
    if (!result) return
    setPage(result)
    transitionDialog.current?.close()
    setPendingTarget(null)
  }

  function openRollback(version: CmsPageVersion | CmsRevision) {
    setRollbackVersion(version)
    rollbackDialog.current?.showModal()
    window.setTimeout(() => rollbackReasonRef.current?.focus(), 0)
  }

  async function confirmRollback() {
    if (!rollbackVersion) return
    const reason = rollbackReasonRef.current?.value.trim() || ''
    if (!reason) {
      setError('Un motif de restauration est obligatoire.')
      rollbackReasonRef.current?.focus()
      return
    }
    const result = await run(
      () => request<CmsPage>(`/api/angelcare-marketplace/cms/pages/${page.id}/rollback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ versionNumber: 'revision_number' in rollbackVersion ? rollbackVersion.revision_number : rollbackVersion.version_number, reason }),
      }),
      `Version ${'revision_number' in rollbackVersion ? rollbackVersion.revision_number : rollbackVersion.version_number} restaurée en nouveau brouillon et auditée.`,
    )
    if (!result) return
    setPage(result)
    rollbackDialog.current?.close()
    setRollbackVersion(null)
  }

  async function preview() {
    const session = await run(
      () => request<{ preview_token: string; revision_id?: string | null; version_number: number }>(`/api/angelcare-marketplace/cms/pages/${page.id}/preview`, { method: 'POST' }),
      'Preview immuable, révision-pinnée et gouvernée créée pour deux heures.',
    )
    if (session) { window.open(`/angelcare-marketplace/preview/${session.preview_token}`, '_blank', 'noopener,noreferrer'); void request<PreviewSession[]>(`/api/angelcare-marketplace/cms/previews?pageId=${page.id}`).then(setPreviewSessions).catch(() => undefined) }
  }

  return (
    <main className={styles.pageDossier}>
      <header className={styles.dossierHeader}>
        <div>
          <span>EXPERIENCE STUDIO · PAGE AUTHORITY</span>
          <h1>{page.title}</h1>
          <p>/{page.locale}/{page.slug} · {page.public_reference} · draft v{page.current_version} · publié {page.published_version ? `v${page.published_version}` : 'jamais'}</p>
          <div className={styles.dossierBadges}>
            <span className={styles.status} data-status={page.status}>{page.status}</span>
            <span className={styles.status} data-status={page.publication_state || (page.published_version ? 'published' : 'never_published')}>{page.publication_state || (page.published_version ? 'published' : 'never_published')}</span>
            <span className={styles.status} data-status={page.translation_status}><Languages size={12}/>{page.translation_status}</span>
            {page.sensitive ? <span data-risk="true"><ShieldCheck size={12}/> sensible</span> : null}
            {dirty ? <span data-risk="true"><AlertTriangle size={12}/> non enregistré</span> : null}
          </div>
        </div>
        <div className={styles.dossierHeaderActions}>
          {permissions.preview ? <button type="button" className={styles.secondary} disabled={busy || dirty} title={dirty ? 'Enregistrez les modifications avant la preview.' : undefined} onClick={() => void preview()}><ExternalLink size={15}/> Preview brouillon</button> : <button type="button" className={styles.secondary} disabled title="Permission marketplace.cms.preview requise"><ExternalLink size={15}/> Preview</button>}
          {permissions.blocks ? <Link className={styles.primary} href={`/angelcare-marketplace/admin/experience/pages/${page.id}/builder`}><Blocks size={15}/> Ouvrir le builder</Link> : <button type="button" className={styles.primary} disabled title="Permission marketplace.cms.blocks.manage requise"><Blocks size={15}/> Builder</button>}
        </div>
      </header>

      {(message || error) ? <div className={styles.dossierNotice} data-error={Boolean(error)}>{error ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}<span>{error || message}</span><button type="button" aria-label="Fermer" onClick={() => { setMessage(''); setError('') }}><X size={15}/></button></div> : null}

      <nav className={styles.dossierTabs} aria-label="Sections du dossier page">
        {([['overview', 'Identité'], ['content', 'Contenu'], ['seo', 'SEO & localisation'], ['history', 'Versions & audit']] as Array<[Tab, string]>).map(([key, label]) => <button type="button" key={key} data-active={tab === key} onClick={() => setTab(key)}>{label}</button>)}
      </nav>

      <section className={styles.dossierGrid}>
        <div className={styles.dossierMain}>
          {tab === 'overview' || tab === 'seo' ? (
            <form className={styles.pageMetadataForm} onSubmit={saveMetadata} onChange={() => setDirty(true)}>
              <fieldset disabled={!permissions.edit || busy}>
                <div className={styles.formSection}>
                  <header><Pencil size={17}/><div><strong>Identité publique</strong><span>Source persistante, route stable et propriétaire.</span></div></header>
                  <div className={styles.formTwo}><label>Titre<input name="title" defaultValue={page.title} required/></label><label>Libellé navigation<input name="navigation_label" defaultValue={page.navigation_label || ''}/></label></div>
                  <div className={styles.formTwo}><label>Slug<input name="slug" defaultValue={page.slug} required/></label><label>Canonical URL<input name="canonical_url" defaultValue={page.canonical_url || ''}/></label></div>
                  <label>Description<textarea name="description" defaultValue={page.description || ''} rows={4}/></label>
                </div>
                <div className={styles.formSection}>
                  <header><Languages size={17}/><div><strong>SEO & gouvernance locale</strong><span>La validation serveur bloque les publications incomplètes.</span></div></header>
                  <label>Titre SEO<input name="seo_title" defaultValue={page.seo_title || ''}/></label>
                  <label>Description SEO<textarea name="seo_description" defaultValue={page.seo_description || ''} rows={3}/></label>
                  <div className={styles.formTwo}><label>Statut traduction<select name="translation_status" defaultValue={page.translation_status}><option value="source">source</option><option value="missing">missing</option><option value="draft">draft</option><option value="reviewed">reviewed</option><option value="approved">approved</option><option value="stale">stale</option></select></label><label>Publication planifiée<input name="scheduled_at" type="datetime-local" defaultValue={page.scheduled_at ? new Date(page.scheduled_at).toISOString().slice(0,16) : ''}/></label></div>
                  <label className={styles.checkLine}><input name="sensitive" type="checkbox" defaultChecked={page.sensitive}/> Contenu sensible soumis au gate de fraîcheur</label>
                  <label>Résumé du changement<textarea name="changeSummary" required placeholder="Pourquoi cette version est-elle créée ?" rows={2}/></label>
                </div>
              </fieldset>
              <button className={styles.primary} type="submit" disabled={!permissions.edit || busy || !dirty}>{busy ? <Loader2 className={styles.spin} size={15}/> : <Save size={15}/>} Enregistrer et versionner</button>
              {!permissions.edit ? <p className={styles.permissionReason}>Lecture seule · permission marketplace.cms.edit requise.</p> : null}
            </form>
          ) : null}

          {tab === 'content' ? (
            <section className={styles.contentInventory}>
              <header><div><span>COMPOSITION ACTIVE</span><h2>{blocks.length} blocs structurés</h2></div>{permissions.blocks ? <Link className={styles.primary} href={`/angelcare-marketplace/admin/experience/pages/${page.id}/builder`}>Composer</Link> : null}</header>
              {blocks.map((block, index) => <article key={block.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{block.block_type}</strong><small>{block.block_key} · {block.locale.toUpperCase()} · {block.status}</small></div><code>{block.territory_id || 'Global'}</code></article>)}
              {!blocks.length ? <div className={styles.empty}><Blocks size={23}/><strong>Aucun bloc</strong><span>La publication restera bloquée tant que la page n’a pas de composition.</span></div> : null}
            </section>
          ) : null}

          {tab === 'history' ? (
            <section className={styles.versionTimeline}>
              <header><div><span>IMMUTABLE PAGE HISTORY</span><h2>Versions, auteur et restauration</h2></div><History size={19}/></header>
              {revisions.map((revision) => <article key={revision.id}><div className={styles.versionMarker}><FileClock size={15}/></div><div><strong>Révision {revision.revision_number} · {revision.state}</strong><span>Document schema v{revision.schema_version} · {displayDate(revision.created_at)}</span><p>{revision.change_summary || 'Révision de composition durable.'}</p><small>Auteur {revision.created_by || 'non renseigné'} · SHA {revision.checksum.slice(0,12)}</small></div>{permissions.rollback ? <button type="button" className={styles.secondary} disabled={busy || revision.revision_number === page.current_version} onClick={() => openRollback(revision)}><RotateCcw size={14}/> Restaurer</button> : <button type="button" className={styles.secondary} disabled title="Permission marketplace.cms.rollback requise"><RotateCcw size={14}/> Restaurer</button>}</article>)}
              {!revisions.length ? versions.map((version) => <article key={version.id}><div className={styles.versionMarker}><FileClock size={15}/></div><div><strong>Version legacy {version.version_number} · {version.title}</strong><span>{version.status} · {displayDate(version.created_at)}</span><p>{version.change_summary || 'Snapshot legacy créé avant modification.'}</p><small>Auteur {version.created_by || 'non renseigné'}</small></div>{permissions.rollback ? <button type="button" className={styles.secondary} disabled={busy} onClick={() => openRollback(version)}><RotateCcw size={14}/> Restaurer</button> : <button type="button" className={styles.secondary} disabled><RotateCcw size={14}/> Restaurer</button>}</article>) : null}
              {!revisions.length && !versions.length ? <div className={styles.empty}>Aucune révision antérieure conservée.</div> : null}
            </section>
          ) : null}
        </div>

        <aside className={styles.dossierRail}>
          <section>
            <span>PUBLICATION READINESS</span><h2>{ready ? 'Prête au contrôle' : 'Bloquants à résoudre'}</h2>
            <div className={styles.readinessList}>{readiness.map((item) => <div key={item.label} data-ready={item.ready}>{item.ready ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>}<div><strong>{item.label}</strong><span>{item.evidence}</span></div></div>)}</div>
          </section>
          <section>
            <span>LIFECYCLE COMMANDS</span><h2>{page.status}</h2>
            <div className={styles.lifecycleActions}>{lifecycleTargets.map((target) => permissions.transitions[target] ? <button type="button" key={target} data-danger={['retired', 'archived', 'draft'].includes(target)} disabled={busy || dirty || ((target === 'published' || target === 'scheduled') && !ready)} onClick={() => openTransition(target)}><Send size={14}/>{transitionLabels[target] || target}</button> : <button type="button" key={target} disabled title={`Permission requise pour ${target}`}><Send size={14}/>{transitionLabels[target] || target}</button>)}</div>
            {dirty ? <p className={styles.railHint}>Enregistrez la fiche avant une transition.</p> : null}
            {!ready ? <p className={styles.railHint}>Le serveur refusera publication et planification tant que les critères de readiness restent incomplets.</p> : null}
          </section>
          <section>
            <span>RELATIONS</span>
            <Link href="/angelcare-marketplace/admin/localization/inventory"><Languages size={14}/> Inventaire localisation</Link>
            <Link href="/angelcare-marketplace/admin/media"><Blocks size={14}/> Media Library</Link>
            <Link href="/angelcare-marketplace/admin/publication"><Clock3 size={14}/> Historique publication</Link>
            {page.publication_state === 'published' ? <a href={publicHref} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Ouvrir la version publiée</a> : null}
          </section>
          {permissions.preview ? <section><span>PREVIEWS ACTIVES</span><h2>{previewSessions.length} session(s)</h2><div className={styles.previewSessionList}>{previewSessions.slice(0,6).map(session => <div key={session.id}><div><strong>v{session.version_number}</strong><small>{session.revision_id ? `Révision ${session.revision_id.slice(0,8)}` : 'Legacy'} · expire {displayDate(session.expires_at)}</small></div><button type="button" onClick={() => void request<PreviewSession>('/api/angelcare-marketplace/cms/previews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({previewId:session.id})}).then(() => setPreviewSessions(items => items.filter(item => item.id !== session.id))).catch(caught => setError(caught instanceof Error ? caught.message : 'Révocation impossible.'))}>Révoquer</button></div>)}</div>{!previewSessions.length ? <p className={styles.railHint}>Aucune URL preview active.</p> : null}</section> : null}
        </aside>
      </section>

      <dialog className={styles.governedDialog} ref={transitionDialog} onCancel={() => setPendingTarget(null)}>
        <header><div><span>TRANSITION CMS GOUVERNÉE</span><h2>{pendingTarget ? transitionLabels[pendingTarget] || pendingTarget : 'Transition'}</h2></div><button type="button" aria-label="Fermer" disabled={busy} onClick={() => transitionDialog.current?.close()}><X size={17}/></button></header>
        <div className={styles.dialogBody}>
          <dl><div><dt>Page</dt><dd>{page.public_reference} · {page.title}</dd></div><div><dt>État actuel</dt><dd>{page.status}</dd></div><div><dt>État proposé</dt><dd>{pendingTarget}</dd></div><div><dt>Impact</dt><dd>{pendingTarget === 'published' ? 'Version rendue publiquement accessible.' : pendingTarget === 'retired' ? 'Page retirée de la surface publique.' : 'Cycle éditorial et audit mis à jour.'}</dd></div></dl>
          <label>Motif obligatoire<textarea ref={reasonRef} rows={4} placeholder="Décision, preuve ou raison opérationnelle…"/></label>
          {(pendingTarget === 'published' || pendingTarget === 'scheduled') ? <div className={styles.dialogReadiness} data-ready={ready}>{ready ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>} {ready ? 'Tous les critères source sont satisfaits.' : 'La validation serveur refusera cette commande.'}</div> : null}
        </div>
        <footer><button type="button" disabled={busy} onClick={() => transitionDialog.current?.close()}>Annuler</button><button type="button" disabled={busy || !pendingTarget || ((pendingTarget === 'published' || pendingTarget === 'scheduled') && !ready)} onClick={() => void confirmTransition()}>{busy ? <Loader2 className={styles.spin} size={15}/> : null} Confirmer</button></footer>
      </dialog>

      <dialog className={styles.governedDialog} ref={rollbackDialog} onCancel={() => setRollbackVersion(null)}>
        <header><div><span>RESTAURATION DE VERSION</span><h2>Restaurer la version {rollbackVersion ? ('revision_number' in rollbackVersion ? rollbackVersion.revision_number : rollbackVersion.version_number) : '—'}</h2></div><button type="button" aria-label="Fermer" disabled={busy} onClick={() => rollbackDialog.current?.close()}><X size={17}/></button></header>
        <div className={styles.dialogBody}>
          <dl><div><dt>Page</dt><dd>{page.public_reference}</dd></div><div><dt>Version actuelle</dt><dd>{page.current_version}</dd></div><div><dt>Version cible</dt><dd>{rollbackVersion ? ('revision_number' in rollbackVersion ? rollbackVersion.revision_number : rollbackVersion.version_number) : '—'}</dd></div><div><dt>Réversibilité</dt><dd>Le rollback crée une nouvelle trace serveur; l’historique antérieur reste conservé.</dd></div></dl>
          <label>Motif obligatoire<textarea ref={rollbackReasonRef} rows={4} placeholder="Incident, régression ou décision éditoriale…"/></label>
        </div>
        <footer><button type="button" disabled={busy} onClick={() => rollbackDialog.current?.close()}>Annuler</button><button type="button" data-danger="true" disabled={busy || !rollbackVersion} onClick={() => void confirmRollback()}>{busy ? <Loader2 className={styles.spin} size={15}/> : <RotateCcw size={15}/>} Restaurer</button></footer>
      </dialog>
    </main>
  )
}
