'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { LibraryBook, LibraryBorrower, LibraryCopy, LibraryLoan } from '@/types/angelcare360/library-circulation'
import styles from './LibraryCommand.module.css'

type Result = { ok?: boolean; error?: string; locked?: boolean; copy?: LibraryCopy | null }

async function post(body: Record<string, unknown>): Promise<Result> {
  const response = await fetch('/api/angelcare360/library-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  })
  return response.json()
}

function useSubmit() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  async function submit(body: Record<string, unknown>) {
    setBusy(true)
    setMessage(null)
    try {
      const result = await post(body)
      if (!result.ok) {
        setMessage({ text: result.error || 'Action non exécutée.', ok: false })
        return false
      }
      setMessage({ text: 'Action enregistrée avec succès.', ok: true })
      router.refresh()
      return true
    } catch {
      setMessage({ text: 'La requête n’a pas abouti. Aucune confirmation de mutation n’a été reçue.', ok: false })
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, message, submit }
}

function Feedback({ message }: { message: { text: string; ok: boolean } | null }) {
  if (!message) return null
  return <div role="status" className={`${styles.message} ${message.ok ? styles.messageGood : styles.messageBad}`}>{message.text}</div>
}

export function BookStudio({ book }: { book?: LibraryBook }) {
  const { busy, message, submit } = useSubmit()
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await submit({
      action: book ? 'book.update' : 'book.create',
      id: book?.id,
      schoolId: book?.schoolId,
      bookCode: form.get('bookCode'),
      title: form.get('title'),
      author: form.get('author'),
      publisher: form.get('publisher'),
      isbn: form.get('isbn'),
      category: form.get('category'),
      language: form.get('language'),
      status: form.get('status'),
    })
  }
  return (
    <section className={styles.studio}>
      <h2 className={styles.studioTitle}>{book ? 'Dossier éditorial' : 'Enregistrer un ouvrage'}</h2>
      <p className={styles.studioCopy}>Les données bibliographiques décrivent l’œuvre. Les exemplaires physiques sont enregistrés séparément.</p>
      <form onSubmit={onSubmit} className={styles.formGrid}>
        <label className={styles.field}><span>Code ouvrage</span><input className={styles.input} name="bookCode" required defaultValue={book?.bookCode || ''} /></label>
        <label className={styles.field}><span>ISBN</span><input className={styles.input} name="isbn" defaultValue={book?.isbn || ''} /></label>
        <label className={`${styles.field} ${styles.fieldFull}`}><span>Titre</span><input className={styles.input} name="title" required defaultValue={book?.title || ''} /></label>
        <label className={styles.field}><span>Auteur</span><input className={styles.input} name="author" defaultValue={book?.author || ''} /></label>
        <label className={styles.field}><span>Éditeur</span><input className={styles.input} name="publisher" defaultValue={book?.publisher || ''} /></label>
        <label className={styles.field}><span>Catégorie</span><input className={styles.input} name="category" defaultValue={book?.category || ''} /></label>
        <label className={styles.field}><span>Langue</span><input className={styles.input} name="language" defaultValue={book?.language || 'fr'} /></label>
        {book ? <label className={styles.field}><span>Cycle de vie</span>
          <select className={styles.select} name="status" defaultValue={book.status}>
            <option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archivé</option>
          </select>
        </label> : null}
        <div className={`${styles.field} ${styles.fieldFull}`}><button className={styles.button} disabled={busy}>{busy ? 'Enregistrement…' : book ? 'Enregistrer le dossier' : 'Créer l’ouvrage'}</button></div>
      </form>
      <Feedback message={message} />
    </section>
  )
}

export function CopyStudio({ books, copy, initialBookId }: { books: LibraryBook[]; copy?: LibraryCopy; initialBookId?: string }) {
  const { busy, message, submit } = useSubmit()
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await submit({
      action: copy ? 'copy.update' : 'copy.create',
      id: copy?.id,
      schoolId: copy?.schoolId,
      bookId: form.get('bookId'),
      copyCode: form.get('copyCode'),
      barcode: form.get('barcode'),
      acquisitionDate: form.get('acquisitionDate'),
      shelfLocation: form.get('shelfLocation'),
      condition: form.get('condition'),
      status: form.get('status'),
    })
  }
  const activeLoan = Boolean(copy?.activeLoanId)
  return (
    <section className={styles.studio}>
      <h2 className={styles.studioTitle}>{copy ? 'Fiche exemplaire' : 'Enregistrer un exemplaire physique'}</h2>
      <p className={styles.studioCopy}>Un exemplaire possède sa propre identité, localisation, condition et disponibilité. Il n’est jamais confondu avec l’œuvre.</p>
      <form onSubmit={onSubmit} className={styles.formGrid}>
        <label className={`${styles.field} ${styles.fieldFull}`}><span>Ouvrage</span>
          <select className={styles.select} name="bookId" required defaultValue={copy?.bookId || initialBookId || ''} disabled={Boolean(copy)}>
            <option value="">Sélectionner…</option>{books.filter(b => b.status !== 'archived').map(b => <option key={b.id} value={b.id}>{b.title} · {b.bookCode}</option>)}
          </select>
        </label>
        <label className={styles.field}><span>Code exemplaire</span><input className={styles.input} name="copyCode" required defaultValue={copy?.copyCode || ''} /></label>
        <label className={styles.field}><span>Code-barres</span><input className={styles.input} name="barcode" defaultValue={copy?.barcode || ''} /></label>
        <label className={styles.field}><span>Date d’acquisition</span><input className={styles.input} type="date" name="acquisitionDate" defaultValue={copy?.acquisitionDate || ''} /></label>
        <label className={styles.field}><span>Rayon / localisation</span><input className={styles.input} name="shelfLocation" defaultValue={copy?.shelfLocation || ''} /></label>
        <label className={styles.field}><span>Condition physique</span><input className={styles.input} name="condition" defaultValue={copy?.condition || 'good'} /></label>
        <label className={styles.field}><span>État de disponibilité</span>
          <select className={styles.select} name="status" defaultValue={copy?.status || 'available'} disabled={activeLoan}>
            <option value="available">Disponible</option><option value="damaged">Endommagé</option><option value="lost">Perdu</option><option value="reserved" disabled>Réservé · état factuel existant</option><option value="archived">Archivé</option>
          </select>
        </label>
        {activeLoan ? <div className={`${styles.message} ${styles.messageWarn} ${styles.fieldFull}`}>État verrouillé par un prêt actif. Le retour, la perte ou l’annulation doivent passer par la Circulation afin de préserver l’intégrité.</div> : null}
        <div className={`${styles.field} ${styles.fieldFull}`}><button className={styles.button} disabled={busy}>{busy ? 'Enregistrement…' : copy ? 'Enregistrer l’exemplaire' : 'Créer l’exemplaire'}</button></div>
      </form>
      <Feedback message={message} />
    </section>
  )
}

export function LoanStudio({ copies, borrowers, locked }: { copies: LibraryCopy[]; borrowers: LibraryBorrower[]; locked: boolean }) {
  const { busy, message, submit } = useSubmit()
  const [borrowerType, setBorrowerType] = useState<'student' | 'staff'>('student')
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const dueValue = String(form.get('dueAt') || '')
    await submit({
      action: 'loan.create',
      copyId: form.get('copyId'),
      borrowerType,
      borrowerId: form.get('borrowerId'),
      dueAt: dueValue ? new Date(dueValue).toISOString() : '',
      notes: form.get('notes'),
    })
  }
  const available = copies.filter(c => c.status === 'available' && !c.activeLoanId)
  const currentBorrowers = borrowers.filter(b => b.type === borrowerType && b.status === 'active')
  return (
    <section className={styles.studio}>
      <h2 className={styles.studioTitle}>Nouveau prêt</h2>
      <p className={styles.studioCopy}>Le prêt et le passage de l’exemplaire à « prêté » sont exécutés dans une seule transaction de base de données.</p>
      {locked ? <div className={`${styles.message} ${styles.messageWarn}`}>Circulation verrouillée : appliquez et validez le SQL d’intégrité Bibliothèque avant tout prêt.</div> : null}
      <form onSubmit={onSubmit} className={styles.formGrid}>
        <label className={styles.field}><span>Type d’emprunteur</span>
          <select className={styles.select} value={borrowerType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setBorrowerType(e.target.value === 'staff' ? 'staff' : 'student')}>
            <option value="student">Élève</option><option value="staff">Personnel</option>
          </select>
        </label>
        <label className={styles.field}><span>Emprunteur</span>
          <select className={styles.select} name="borrowerId" required><option value="">Sélectionner…</option>{currentBorrowers.map(b => <option key={b.id} value={b.id}>{b.fullName} · {b.code}</option>)}</select>
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}><span>Exemplaire disponible</span>
          <select className={styles.select} name="copyId" required><option value="">Sélectionner…</option>{available.map(c => <option key={c.id} value={c.id}>{c.bookTitle} · {c.copyCode}{c.shelfLocation ? ` · ${c.shelfLocation}` : ''}</option>)}</select>
        </label>
        <label className={styles.field}><span>Retour attendu</span><input className={styles.input} type="datetime-local" name="dueAt" required /></label>
        <label className={styles.field}><span>Note interne</span><input className={styles.input} name="notes" placeholder="Facultatif" /></label>
        <div className={`${styles.field} ${styles.fieldFull}`}><button className={styles.button} disabled={busy || locked || available.length === 0}>{busy ? 'Confirmation…' : 'Confirmer le prêt'}</button></div>
      </form>
      <Feedback message={message} />
    </section>
  )
}

export function ReturnStudio({ loan, locked }: { loan: LibraryLoan; locked: boolean }) {
  const { busy, message, submit } = useSubmit()
  const [outcome, setOutcome] = useState<'available' | 'damaged'>('available')
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await submit({
      action: 'loan.return',
      loanId: loan.id,
      conditionOutcome: outcome,
      condition: form.get('condition'),
      notes: form.get('notes'),
    })
  }
  return (
    <section className={styles.studio}>
      <h2 className={styles.studioTitle}>Studio de retour</h2>
      <p className={styles.studioCopy}>Le retour clôt le prêt et remet l’exemplaire en disponibilité — ou le place en état endommagé — dans la même transaction.</p>
      {locked ? <div className={`${styles.message} ${styles.messageWarn}`}>Retour verrouillé jusqu’à validation du garde-fou transactionnel.</div> : null}
      <form onSubmit={onSubmit} className={styles.formGrid}>
        <label className={styles.field}><span>État au retour</span>
          <select className={styles.select} value={outcome} onChange={(e: ChangeEvent<HTMLSelectElement>) => setOutcome(e.target.value === 'damaged' ? 'damaged' : 'available')}>
            <option value="available">Retour normal · disponible</option><option value="damaged">Retour endommagé</option>
          </select>
        </label>
        <label className={styles.field}><span>Condition observée</span><input className={styles.input} name="condition" defaultValue={loan.copyCondition} /></label>
        <label className={`${styles.field} ${styles.fieldFull}`}><span>Note de retour</span><textarea className={styles.textarea} name="notes" /></label>
        <div className={`${styles.field} ${styles.fieldFull}`}><button className={styles.button} disabled={busy || locked}>{busy ? 'Validation…' : 'Certifier le retour'}</button></div>
      </form>
      <Feedback message={message} />
    </section>
  )
}

export function LossCancelStudio({ loan, locked }: { loan: LibraryLoan; locked: boolean }) {
  const { busy, message, submit } = useSubmit()
  const [reason, setReason] = useState('')
  return (
    <section className={styles.studio}>
      <h2 className={styles.studioTitle}>Exceptions de circulation</h2>
      <p className={styles.studioCopy}>Perte et annulation sont des événements audités. Ils ne suppriment jamais l’historique du prêt.</p>
      <label className={styles.field}><span>Motif obligatoire</span><textarea className={styles.textarea} value={reason} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} /></label>
      <div className={styles.toolbar}>
        <button className={styles.buttonDanger + ' ' + styles.button} disabled={busy || locked || !reason.trim()} onClick={() => submit({ action: 'loan.lost', loanId: loan.id, reason })}>Déclarer perdu</button>
        <button className={`${styles.button} ${styles.buttonSecondary}`} disabled={busy || locked || !reason.trim()} onClick={() => submit({ action: 'loan.cancel', loanId: loan.id, reason })}>Annuler le prêt</button>
      </div>
      <Feedback message={message} />
    </section>
  )
}

export function BarcodeLookup({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('')
  const [copy, setCopy] = useState<LibraryCopy | null>(null)
  const [message, setMessage] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  async function lookup(value = query) {
    const needle = value.trim()
    if (!needle) return
    setMessage('Recherche…')
    try {
      const response = await fetch(`/api/angelcare360/library-command?mode=barcode&query=${encodeURIComponent(needle)}`, { cache: 'no-store' })
      const result = await response.json()
      setCopy(result.copy || null)
      setMessage(result.copy ? '' : 'Aucun exemplaire correspondant.')
    } catch {
      setMessage('Recherche indisponible.')
    }
  }

  function stop() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  async function scan() {
    const Detector = (window as any).BarcodeDetector
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setMessage('Scanner caméra non pris en charge ici. La saisie manuelle reste disponible.')
      return
    }
    stop()
    setMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      if (!videoRef.current) return stop()
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setScanning(true)
      const detector = new Detector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code'] })
      const detect = async () => {
        if (!videoRef.current || !streamRef.current) return
        try {
          const found = await detector.detect(videoRef.current)
          const raw = found?.[0]?.rawValue
          if (raw) {
            setQuery(raw)
            stop()
            await lookup(raw)
            return
          }
        } catch { /* keep manual fallback */ }
        timerRef.current = window.setTimeout(detect, 450)
      }
      detect()
    } catch {
      stop()
      setMessage('Accès caméra refusé ou indisponible. Utilisez la saisie manuelle.')
    }
  }

  useEffect(() => () => stop(), [])

  return (
    <section className={styles.scanner}>
      {!compact ? <><h2 className={styles.studioTitle}>Recherche code-barres</h2><p className={styles.studioCopy}>Le scanner est optionnel. La caméra ne reste active que pendant la recherche et s’arrête à la fermeture.</p></> : null}
      <div className={styles.toolbar}>
        <input className={styles.search} value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); lookup() } }} placeholder="Code-barres ou code exemplaire" />
        <button className={styles.button} type="button" onClick={() => lookup()}>Rechercher</button>
        <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={scanning ? stop : scan}>{scanning ? 'Arrêter' : 'Scanner'}</button>
      </div>
      {scanning ? <video ref={videoRef} className={styles.video} playsInline muted aria-label="Aperçu caméra du scanner code-barres" /> : <video ref={videoRef} style={{ display: 'none' }} playsInline muted />}
      {message ? <div className={`${styles.message} ${styles.messageWarn}`} role="status">{message}</div> : null}
      {copy ? <div className={styles.copyCard}>
        <div className={styles.copyCardHead}><div><div className={styles.copyCode}>{copy.copyCode}</div><div className={styles.bookAuthor}>{copy.bookTitle}</div></div><span className={styles.status} data-tone={copy.status === 'available' ? 'good' : copy.daysOverdue ? 'bad' : 'neutral'}>{copy.status}</span></div>
        <div className={styles.metaList}><div className={styles.metaRow}><span>Rayon</span><strong>{copy.shelfLocation || 'Non renseigné'}</strong></div><div className={styles.metaRow}><span>Emprunteur</span><strong>{copy.borrowerName || 'Aucun'}</strong></div></div>
        <a className={styles.button} href={`/angelcare-360-command-center/bibliotheque/exemplaires/${copy.id}`}>Ouvrir l’exemplaire</a>
      </div> : null}
    </section>
  )
}
