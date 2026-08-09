'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react'
import styles from './admin-login.module.css'

export function AdminLoginExperience({ returnTo }: { returnTo: string }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ identifier, password, returnTo }),
      })
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string; returnTo?: string } | null
      if (!response.ok || !payload?.ok) {
        setError(payload?.message || 'Connexion administrateur impossible.')
        return
      }
      window.location.assign(payload.returnTo || '/angelcare-marketplace/admin')
    } catch {
      setError('Connexion administrateur momentanément indisponible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label="ANGELCARE Marketplace Administration">
        <div className={styles.brandTop}>
          <Image src="/brand/angelcare-official-inverse.webp" alt="ANGELCARE" width={180} height={58} priority />
          <span>MARKETPLACE · ADMIN AUTHORITY</span>
        </div>
        <div className={styles.brandCopy}>
          <small>ACCÈS INTERNE PROTÉGÉ</small>
          <h1>Commandez le Marketplace depuis une identité vérifiée.</h1>
          <p>L’accès au backoffice est réservé aux comptes ANGELCARE disposant explicitement de l’autorité Marketplace Admin.</p>
        </div>
        <div className={styles.securityGrid}>
          <div><ShieldCheck size={19}/><span><strong>RBAC Marketplace</strong><small>Permission administrateur contrôlée avant création de session.</small></span></div>
          <div><LockKeyhole size={19}/><span><strong>Session isolée</strong><small>Cookie sécurisé, durée gouvernée et révocation serveur.</small></span></div>
          <div><UserRoundCheck size={19}/><span><strong>Traçabilité</strong><small>Succès, refus et tentatives sont inscrits dans l’audit applicatif.</small></span></div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={16}/>Retour au Marketplace</Link>
          <header className={styles.formHeader}>
            <small>ANGELCARE MARKETPLACE ADMIN</small>
            <h2>Connexion administrateur</h2>
            <p>Utilisez votre identifiant interne ANGELCARE. Les comptes clients ne peuvent pas entrer ici.</p>
          </header>

          <form className={styles.form} onSubmit={submit}>
            <label>
              <span>Email ou nom d’utilisateur</span>
              <div className={styles.field}><UserRoundCheck size={18}/><input autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoFocus /></div>
            </label>
            <label>
              <span>Mot de passe</span>
              <div className={styles.field}>
                <KeyRound size={18}/>
                <input autoComplete="current-password" type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
            </label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button className={styles.submit} type="submit" disabled={busy}>{busy ? 'Vérification…' : <>Accéder au backoffice <ArrowRight size={17}/></>}</button>
          </form>

          <div className={styles.note}>
            <LockKeyhole size={16}/>
            <span>Aucun accès n’est accordé sur la seule base du mot de passe : le rôle et les permissions Marketplace sont validés côté serveur.</span>
          </div>
        </div>
      </section>
    </main>
  )
}
