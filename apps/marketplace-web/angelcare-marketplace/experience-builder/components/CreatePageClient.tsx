'use client'

import { useState } from 'react'
import type { ApiSuccess } from '../../domain/types'
import type { CmsPage } from '../types'
import styles from '../experience.module.css'

export function CreatePageClient() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(formData: FormData) {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/angelcare-marketplace/cms/pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          routeKey: String(formData.get('routeKey') || ''),
          locale: 'fr',
          title: String(formData.get('title') || ''),
          navigationLabel: String(formData.get('navigationLabel') || ''),
          slug: String(formData.get('slug') || ''),
          description: String(formData.get('description') || ''),
          seoTitle: String(formData.get('seoTitle') || ''),
          seoDescription: String(formData.get('seoDescription') || ''),
          sensitive: formData.get('sensitive') === 'on',
        }),
      })
      const payload = await response.json() as ApiSuccess<CmsPage> | { error?: { message?: string } }
      if (!response.ok || !('data' in payload)) {
        throw new Error('error' in payload ? payload.error?.message : 'Création impossible.')
      }
      window.location.assign(`/angelcare-marketplace/admin/experience/pages/${payload.data.id}/builder`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Création impossible.')
      setBusy(false)
    }
  }

  return <form className={styles.registry} action={(formData) => void submit(formData)}>
    <div className={styles.commandGrid}>
      <label className={styles.field}><span>Titre français</span><input className={styles.input} name="title" required maxLength={240} /></label>
      <label className={styles.field}><span>Clé de route stable</span><input className={styles.input} name="routeKey" required maxLength={120} placeholder="public.home" /></label>
      <label className={styles.field}><span>Slug</span><input className={styles.input} name="slug" required maxLength={180} placeholder="accueil" /></label>
      <label className={styles.field}><span>Libellé navigation</span><input className={styles.input} name="navigationLabel" maxLength={120} /></label>
      <label className={styles.field}><span>Titre SEO</span><input className={styles.input} name="seoTitle" maxLength={240} /></label>
      <label className={styles.field}><span>Description SEO</span><textarea className={styles.textarea} name="seoDescription" maxLength={500} /></label>
    </div>
    <label className={styles.field}><span>Description française</span><textarea className={styles.textarea} name="description" maxLength={2000} /></label>
    <label><input type="checkbox" name="sensitive" /> Contenu sensible soumis à une validation renforcée</label>
    <div className={styles.toolbar}><button className={styles.primary} disabled={busy} type="submit">{busy ? 'Création…' : 'Créer et ouvrir le builder'}</button>{message ? <p>{message}</p> : null}</div>
  </form>
}
