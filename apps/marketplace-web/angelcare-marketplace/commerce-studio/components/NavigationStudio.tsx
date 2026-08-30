'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { ExternalLink, GripVertical, History, Menu, Plus, Smartphone } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, MediaAsset, NavigationItemRecord, NavigationMenuRecord } from '../types'
import {
  apiRequest,
  CheckField,
  CommerceActionDialog,
  Field,
  SelectField,
  StudioForm,
  TextArea,
  useStudioMutation,
} from './StudioClient'

interface Props {
  initialMenus: NavigationMenuRecord[]
  media: MediaAsset[]
  mode?: string
  canManage?: boolean
  canViewHistory?: boolean
}

export function NavigationStudio({
  initialMenus,
  media,
  mode = 'header',
  canManage = false,
  canViewHistory = false,
}: Props) {
  const [menus, setMenus] = useState(initialMenus)
  const [menuId, setMenuId] = useState(initialMenus.find((menu) => menu.locale === 'fr')?.id || initialMenus[0]?.id || '')
  const [selectedId, setSelectedId] = useState<string>('new')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const mutation = useStudioMutation()
  const menu = useMemo(() => menus.find((item) => item.id === menuId) || null, [menus, menuId])
  const selected = menu?.items?.find((item) => item.id === selectedId) || null

  async function reorder(targetId: string) {
    if (!canManage || !menu || !draggedId || draggedId === targetId) return
    const ordered = [...(menu.items || [])].sort((a, b) => a.sort_order - b.sort_order)
    const from = ordered.findIndex((item) => item.id === draggedId)
    const to = ordered.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)
    const normalized = ordered.map((item, index) => ({ ...item, sort_order: index * 10 }))
    setMenus((current) => current.map((entry) => entry.id === menu.id ? { ...entry, items: normalized } : entry))
    await mutation.run(
      () => apiRequest('/api/angelcare-marketplace/admin/navigation/reorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ordered_ids: normalized.map((item) => item.id) }),
      }),
      'Ordre du menu enregistré et routes publiques rafraîchies.',
    )
    setDraggedId(null)
  }

  function insertMenu(record: CommerceRecord) {
    const next: NavigationMenuRecord = {
      ...record,
      menu_key: String(record.menu_key || ''),
      name: String(record.name || ''),
      locale: record.locale === 'en' || record.locale === 'ar' ? record.locale : 'fr',
      territory_id: record.territory_id ? String(record.territory_id) : null,
      status: String(record.status || 'draft'),
      items: [],
    }
    setMenus((current) => [...current, next])
    setMenuId(next.id)
    setSelectedId('new')
  }

  function upsertItem(record: CommerceRecord) {
    setMenus((current) => current.map((entry) => {
      if (entry.id !== menuId) return entry
      const nextItem = record as NavigationItemRecord
      return {
        ...entry,
        items: selected
          ? entry.items.map((item) => item.id === nextItem.id ? nextItem : item)
          : [...(entry.items || []), nextItem],
      }
    }))
  }

  function reflectMenuPublication() {
    if (!menu) return
    setMenus((current) => current.map((entry) => entry.id === menu.id ? { ...entry, status: menu.status === 'published' ? 'draft' : 'published' } : entry))
  }

  function reflectItemPublication() {
    if (!menu || !selected) return
    setMenus((current) => current.map((entry) => entry.id === menu.id ? {
      ...entry,
      items: entry.items.map((item) => item.id === selected.id ? { ...item, status: selected.status === 'active' ? 'paused' : 'active' } : item),
    } : entry))
  }

  return (
    <main className={styles.shell} data-readonly={!canManage}>
      <section className={styles.workspaceHero} data-accent="navigation">
        <div>
          <span>NAVIGATION STUDIO · {mode.toUpperCase()}</span>
          <h1>Header, mega-menu, mobile et footer sous contrôle.</h1>
          <p>Libellés trilingues, hiérarchie, routes, médias, audiences et publication explicite.</p>
        </div>
        <div className={styles.workspaceStats}><Menu size={27}/><strong>{menu?.items?.length || 0}</strong><span>items dans le menu</span></div>
      </section>

      <section className={styles.studioGovernanceBar}>
        <div>
          <span>MENU ACTIF</span>
          <strong>{menu?.name || 'Aucun menu'}</strong>
          <small>{menu?.locale.toUpperCase() || '—'} · {menu?.status || '—'} · hiérarchie validée au serveur</small>
        </div>
        <div>
          {canViewHistory ? <Link className={styles.secondaryActionLink} href="/angelcare-marketplace/admin/navigation/history"><History size={15}/> Historique</Link> : <button className={styles.secondaryActionLink} type="button" disabled title="Permission marketplace.publication.manage requise"><History size={15}/> Historique</button>}
          {menu ? (
            <CommerceActionDialog
              resource="navigation-menus"
              id={menu.id}
              action={menu.status === 'published' ? 'unpublish' : 'publish'}
              label={menu.status === 'published' ? 'Retirer le menu' : 'Publier le menu'}
              objectLabel={menu.name}
              currentState={menu.status}
              targetState={menu.status === 'published' ? 'draft' : 'published'}
              consequences={menu.status === 'published' ? 'Le menu cesse d’être servi comme navigation active; ses items et sa hiérarchie restent conservés.' : 'Le menu et ses items actifs deviennent la navigation publique de cette locale et de ce territoire.'}
              reversible
              danger={menu.status === 'published'}
              disabled={!canManage}
              disabledReason="Permission marketplace.navigation.manage requise"
              onDone={reflectMenuPublication}
            />
          ) : null}
        </div>
      </section>
      {!canManage ? <p className={styles.permissionBanner}>Navigation en lecture seule · permission marketplace.navigation.manage requise pour modifier ou publier.</p> : null}

      <section className={styles.navigationLayout}>
        <aside className={styles.menuRegistry}>
          <header>
            <span>MENUS</span>
            <button type="button" aria-label="Nouveau menu" disabled={!canManage} onClick={() => setSelectedId('new-menu')}><Plus size={15}/></button>
          </header>
          {menus.map((item) => (
            <button type="button" key={item.id} data-selected={item.id === menuId} onClick={() => { setMenuId(item.id); setSelectedId('new') }}>
              <strong>{item.name}</strong>
              <span>{item.locale} · {item.status}</span>
            </button>
          ))}
        </aside>

        <section className={styles.menuCanvas}>
          <div className={styles.menuPreview}>
            <div className={styles.brandPreview}>ANGELCARE <i/></div>
            {menu?.items?.filter((item) => !item.parent_id && item.status === 'active').sort((a, b) => a.sort_order - b.sort_order).map((item) => (
              <button type="button" key={item.id} onClick={() => setSelectedId(item.id)}>
                {item.label}<span>{menu.items.filter((child) => child.parent_id === item.id).length || ''}</span>
              </button>
            ))}
            <i/><span className={styles.previewDevice} aria-label="Aperçu mobile"><Smartphone size={16}/></span>
          </div>
          <div className={styles.menuTree}>
            <header>
              <div><span>MENU TREE</span><h2>{menu?.name || 'Navigation publique'}</h2></div>
              <button type="button" disabled={!canManage || !menu} onClick={() => setSelectedId('new')}><Plus size={16}/> Ajouter un item</button>
            </header>
            {menu?.items?.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
              <button
                type="button"
                key={item.id}
                data-selected={selectedId === item.id}
                draggable={canManage}
                onDragStart={() => { if (canManage) setDraggedId(item.id) }}
                onDragOver={(event: DragEvent<HTMLButtonElement>) => { if (canManage) event.preventDefault() }}
                onDrop={() => void reorder(item.id)}
                style={{ paddingInlineStart: `${18 + (item.parent_id ? 28 : 0)}px` }}
                onClick={() => setSelectedId(item.id)}
              >
                <GripVertical size={16}/>
                <span><strong>{item.label}</strong><small>{item.href}</small></span>
                <i>{item.desktop_visible ? 'DESKTOP' : ''} {item.mobile_visible ? 'MOBILE' : ''}</i>
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.navigationInspector}>
          {selectedId === 'new-menu' ? (
            <>
              <span>NEW MENU</span><h2>Créer un menu en brouillon</h2>
              <StudioForm resource="navigation-menus" onSaved={insertMenu} submitLabel="Créer le brouillon" extraPayload={{ status: 'draft' }} disabled={!canManage} disabledReason="Permission marketplace.navigation.manage requise">
                <Field name="name" label="Nom interne" required/>
                <Field name="menu_key" label="Clé"/>
                <SelectField name="locale" label="Locale" options={['fr', 'en', 'ar']}/>
              </StudioForm>
            </>
          ) : (
            <>
              <span>{selected ? 'ITEM INSPECTOR' : 'NEW ITEM'}</span>
              <h2>{selected?.label || 'Ajouter une entrée'}</h2>
              <StudioForm resource="navigation-items" id={selected?.id} extraPayload={{ menu_id: menuId }} onSaved={upsertItem} disabled={!canManage || !menu} disabledReason="Permission marketplace.navigation.manage requise">
                <Field name="label_fr" label="Libellé FR" defaultValue={selected?.label_fr || selected?.label} required/>
                <div className={styles.formGrid}><Field name="label_en" label="Libellé EN" defaultValue={selected?.label_en}/><Field name="label_ar" label="Libellé AR" defaultValue={selected?.label_ar}/></div>
                <Field name="href" label="Route ou URL" defaultValue={selected?.href} required/>
                <SelectField name="parent_id" label="Parent / groupe" defaultValue={selected?.parent_id} options={[{ value: '', label: 'Niveau principal' }, ...(menu?.items?.filter((item) => !item.parent_id).map((item) => ({ value: item.id, label: item.label })) || [])]}/>
                <div className={styles.formGrid}><Field name="sort_order" label="Ordre" type="number" defaultValue={selected?.sort_order || 0}/><Field name="icon_key" label="Icône" defaultValue={selected?.icon_key}/></div>
                <SelectField name="image_asset_id" label="Image promotionnelle Media Library" defaultValue={selected?.image_asset_id} options={[{ value: '', label: 'Aucune image' }, ...media.filter((asset) => asset.media_type === 'image').map((asset) => ({ value: asset.id, label: asset.file_name }))]}/>
                <div className={styles.formGrid}>
                  <SelectField name="visibility" label="Audience" defaultValue={selected?.visibility || 'public'} options={['public', 'family', 'organization', 'professional', 'authenticated']}/>
                  <label className={styles.field}><span>État serveur</span><input value={selected?.status || 'draft'} readOnly disabled/></label>
                </div>
                <div className={styles.formGrid}><CheckField name="desktop_visible" label="Visible desktop" defaultChecked={selected?.desktop_visible ?? true}/><CheckField name="mobile_visible" label="Visible mobile" defaultChecked={selected?.mobile_visible ?? true}/></div>
              </StudioForm>
              {selected ? (
                <div className={styles.actionBar}>
                  <CommerceActionDialog
                    resource="navigation-items"
                    id={selected.id}
                    action={selected.status === 'active' ? 'unpublish' : 'publish'}
                    label={selected.status === 'active' ? 'Masquer' : 'Afficher'}
                    objectLabel={selected.label}
                    currentState={selected.status}
                    targetState={selected.status === 'active' ? 'paused' : 'active'}
                    consequences={selected.status === 'active' ? 'L’entrée disparaît du menu public sur desktop et mobile.' : 'L’entrée devient visible dans le menu publié selon son audience et ses réglages device.'}
                    reversible
                    disabled={!canManage}
                    disabledReason="Permission marketplace.navigation.manage requise"
                    onDone={reflectItemPublication}
                  />
                  <a href={selected.href} target="_blank"><ExternalLink size={14}/> Tester la route</a>
                </div>
              ) : null}
              <div className={styles.routeWarnings}><strong>VALIDATION AUTOMATIQUE</strong><TextArea name="warnings" label="" defaultValue="Route interne contrôlée · hiérarchie sans boucle · locale cohérente · visibilité desktop/mobile"/></div>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}
