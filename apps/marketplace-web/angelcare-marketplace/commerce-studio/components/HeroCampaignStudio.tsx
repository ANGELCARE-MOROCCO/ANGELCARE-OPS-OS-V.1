'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Eye, History, ImagePlus, Monitor, Plus, Smartphone, Tablet } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, MediaAsset } from '../types'
import {
  CommerceActionDialog,
  Field,
  ImmediateAction,
  SelectField,
  StudioForm,
  TextArea,
} from './StudioClient'

interface Props {
  initialCampaigns: CommerceRecord[]
  media: MediaAsset[]
  canManage?: boolean
  canViewHistory?: boolean
}

export function HeroCampaignStudio({
  initialCampaigns,
  media,
  canManage = false,
  canViewHistory = false,
}: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [selectedId, setSelectedId] = useState(initialCampaigns[0]?.id || 'new')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const selected = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || null,
    [campaigns, selectedId],
  )
  const previewUrl = selected
    ? String(
        device === 'mobile'
          ? selected.mobile_asset_url || selected.desktop_asset_url
          : device === 'tablet'
            ? selected.tablet_asset_url || selected.desktop_asset_url
            : selected.desktop_asset_url || '',
      )
    : ''
  const imageOptions = media
    .filter((asset) => asset.media_type === 'image')
    .map((asset) => ({ value: asset.desktop_url, label: asset.file_name }))

  function upsertCampaign(record: CommerceRecord) {
    setCampaigns((current) =>
      selected
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current],
    )
    setSelectedId(record.id)
  }

  function reflectPublication() {
    if (!selected) return
    setCampaigns((current) =>
      current.map((item) =>
        item.id === selected.id
          ? { ...item, status: selected.status === 'active' ? 'paused' : 'active' }
          : item,
      ),
    )
  }

  return (
    <main className={styles.shell}>
      <section className={styles.workspaceHero} data-accent="homepage">
        <div>
          <span>HERO & CAMPAIGN STUDIO</span>
          <h1>Campagnes responsive, ciblées et gouvernées.</h1>
          <p>
            Images Media Library, messages trilingues, CTA, audience, territoire,
            priorité, calendrier et publication contrôlée.
          </p>
        </div>
        <div className={styles.heroCommandStack}>
          <div className={styles.deviceSwitch} aria-label="Format de prévisualisation">
            <button type="button" aria-label="Desktop" data-active={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={17}/></button>
            <button type="button" aria-label="Tablette" data-active={device === 'tablet'} onClick={() => setDevice('tablet')}><Tablet size={17}/></button>
            <button type="button" aria-label="Mobile" data-active={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={17}/></button>
          </div>
          {canViewHistory ? (
            <Link className={styles.secondaryActionLink} href="/angelcare-marketplace/admin/homepage/history">
              <History size={15}/> Releases & historique
            </Link>
          ) : (
            <button type="button" className={styles.secondaryActionLink} disabled title="Permission marketplace.publication.manage requise">
              <History size={15}/> Releases & historique
            </button>
          )}
        </div>
      </section>

      <section className={styles.heroStudioLayout}>
        <aside className={styles.campaignRegistry}>
          <header>
            <span>CAMPAIGNS</span>
            <button type="button" aria-label="Nouvelle campagne" disabled={!canManage} title={!canManage ? 'Permission marketplace.homepage.manage requise' : undefined} onClick={() => setSelectedId('new')}>
              <Plus size={15}/>
            </button>
          </header>
          {campaigns.map((campaign) => (
            <button type="button" key={campaign.id} data-selected={campaign.id === selectedId} onClick={() => setSelectedId(campaign.id)}>
              <strong>{String(campaign.title)}</strong>
              <span>{String(campaign.locale)} · {String(campaign.status)}</span>
            </button>
          ))}
        </aside>

        <section
          className={styles.heroLivePreview}
          data-device={device}
          style={{ backgroundImage: previewUrl ? `linear-gradient(90deg,rgba(3,24,46,.84),rgba(3,24,46,.12)),url(${previewUrl})` : undefined }}
        >
          <span>{String(selected?.eyebrow || 'ANGELCARE MARKETPLACE')}</span>
          <h2>{String(selected?.title || 'Nouvelle campagne Hero')}</h2>
          <p>{String(selected?.subtitle || 'Configurez une campagne complète depuis le panneau administrateur.')}</p>
          <b>{String(selected?.primary_cta_label || 'Action principale')}</b>
        </section>

        <aside className={styles.campaignInspector}>
          <span>{selected ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}</span>
          <h2>{String(selected?.title || 'Créer une campagne')}</h2>
          <StudioForm
            resource="homepage-campaigns"
            id={selected?.id}
            onSaved={upsertCampaign}
            submitLabel={selected ? 'Enregistrer la campagne' : 'Créer le brouillon'}
            extraPayload={selected ? undefined : { status: 'draft' }}
            disabled={!canManage}
            disabledReason="Permission marketplace.homepage.manage requise"
          >
            <div className={styles.formGrid}>
              <SelectField name="locale" label="Locale" defaultValue={String(selected?.locale || 'fr')} options={['fr', 'en', 'ar']}/>
              <SelectField name="audience" label="Audience" defaultValue={String(selected?.audience || 'all')} options={['all', 'family', 'organization', 'professional']}/>
            </div>
            <Field name="eyebrow" label="Eyebrow" defaultValue={String(selected?.eyebrow || '')}/>
            <Field name="title" label="Titre" defaultValue={String(selected?.title || '')} required/>
            <TextArea name="subtitle" label="Sous-titre" defaultValue={String(selected?.subtitle || '')}/>
            <div className={styles.formGrid}>
              <Field name="primary_cta_label" label="CTA principal" defaultValue={String(selected?.primary_cta_label || 'Découvrir')} required/>
              <Field name="primary_cta_href" label="Destination" defaultValue={String(selected?.primary_cta_href || '/angelcare-marketplace/fr/marketplace')} required/>
            </div>
            <div className={styles.formGrid}>
              <Field name="secondary_cta_label" label="CTA secondaire" defaultValue={String(selected?.secondary_cta_label || '')}/>
              <Field name="secondary_cta_href" label="Destination secondaire" defaultValue={String(selected?.secondary_cta_href || '')}/>
            </div>
            <SelectField name="desktop_asset_url" label="Image desktop" defaultValue={String(selected?.desktop_asset_url || '')} options={[{ value: '', label: 'Sélectionner dans Media Library' }, ...imageOptions]}/>
            <div className={styles.formGrid}>
              <SelectField name="tablet_asset_url" label="Image tablette" defaultValue={String(selected?.tablet_asset_url || '')} options={[{ value: '', label: 'Dérivée automatiquement' }, ...media.filter((asset) => asset.media_type === 'image').map((asset) => ({ value: asset.tablet_url || asset.desktop_url, label: asset.file_name }))]}/>
              <SelectField name="mobile_asset_url" label="Image mobile" defaultValue={String(selected?.mobile_asset_url || '')} options={[{ value: '', label: 'Dérivée automatiquement' }, ...media.filter((asset) => asset.media_type === 'image').map((asset) => ({ value: asset.mobile_url || asset.desktop_url, label: asset.file_name }))]}/>
            </div>
            <div className={styles.formGrid}>
              <Field name="priority" label="Priorité" type="number" defaultValue={Number(selected?.priority || 100)}/>
              <label className={styles.field}><span>État serveur</span><input value={String(selected?.status || 'draft')} readOnly disabled/></label>
            </div>
            <div className={styles.formGrid}>
              <Field name="starts_at" label="Début" type="datetime-local" defaultValue={String(selected?.starts_at || '')}/>
              <Field name="ends_at" label="Fin" type="datetime-local" defaultValue={String(selected?.ends_at || '')}/>
            </div>
          </StudioForm>

          {selected ? (
            <div className={styles.actionBar}>
              <CommerceActionDialog
                resource="homepage-campaigns"
                id={selected.id}
                action={selected.status === 'active' ? 'unpublish' : 'publish'}
                label={selected.status === 'active' ? 'Mettre en pause' : 'Activer maintenant'}
                objectLabel={String(selected.title || selected.id)}
                currentState={String(selected.status || 'draft')}
                targetState={selected.status === 'active' ? 'paused' : 'active'}
                consequences={selected.status === 'active' ? 'La campagne quitte immédiatement le Hero public; son contenu et son calendrier sont conservés.' : 'La campagne devient éligible au Hero public selon sa locale, son audience, sa priorité et son calendrier.'}
                reversible
                danger={selected.status === 'active'}
                disabled={!canManage}
                disabledReason="Permission marketplace.homepage.manage requise"
                onDone={reflectPublication}
              />
              <ImmediateAction resource="homepage-campaigns" id={selected.id} action="duplicate" label="Dupliquer" disabled={!canManage} disabledReason="Permission marketplace.homepage.manage requise"/>
              <a href="/angelcare-marketplace/fr" target="_blank"><Eye size={14}/> Voir live</a>
            </div>
          ) : (
            <div className={styles.empty}><ImagePlus size={24}/> Créez le brouillon, contrôlez les médias responsive puis publiez explicitement.</div>
          )}
        </aside>
      </section>
    </main>
  )
}
