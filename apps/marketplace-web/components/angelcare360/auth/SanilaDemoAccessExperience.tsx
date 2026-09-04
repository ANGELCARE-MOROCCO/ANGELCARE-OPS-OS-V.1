'use client'

import Image from 'next/image'
import { ArrowRight, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import type { Angelcare360CustomerBroadcastSnapshot } from '@/lib/angelcare360/customer-broadcasts'
import SanilaLogo from '@/components/brand/SanilaLogo'
import { CustomerBroadcastBar, TrustRail } from './Angelcare360CustomerLoginExperience'
import styles from './Angelcare360CustomerLoginExperience.module.css'

type DemoAction = (formData: FormData) => void | Promise<void>

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button className={styles.submitButton} type="submit" disabled={pending}>
      <span>{pending ? 'Validation sécurisée…' : 'Accéder à SANILA'}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  )
}

export default function SanilaDemoAccessExperience({
  demoAction,
  hasError,
  initialBroadcasts,
}: {
  demoAction: DemoAction
  hasError: boolean
  initialBroadcasts: Angelcare360CustomerBroadcastSnapshot
}) {
  return (
    <main className={styles.page}>
      <CustomerBroadcastBar initial={initialBroadcasts} />
      <div className={styles.desktopStage}>
        <section className={styles.heroPanel} aria-label="Direction d’établissement scolaire SANILA">
          <Image
            src="/angelcare360/login/angelcare360-executive-morocco.webp"
            alt="Directrice d’établissement scolaire dans un environnement professionnel marocain"
            fill
            priority
            sizes="(min-width: 1200px) 55vw, 52vw"
            className={styles.heroImage}
          />
          <div className={styles.heroEdge} aria-hidden="true" />
        </section>

        <section className={styles.loginPanel}>
          <div className={styles.productBlock}>
            <SanilaLogo variant="normal" width={188} height={66} priority className={styles.officialLogo} />
            <div className={styles.sanilaLine}>
              <span>SANILA Operating System</span>
              <i aria-hidden="true" />
            </div>
            <h1>SANILA OS</h1>
            <h2>Accès à votre démonstration</h2>
            <p>Un environnement isolé. <strong>Un accès contrôlé.</strong> Une expérience SANILA complète.</p>
          </div>

          <section className={styles.loginCard} aria-label="Accès à la démonstration SANILA">
            <div className={styles.cardBody}>
              <form action={demoAction} className={styles.form}>
                <div className={styles.inviteIntro}>
                  <ShieldCheck aria-hidden="true" />
                  <div>
                    <strong>Démonstration SANILA</strong>
                    <span>Entrez le code d’accès transmis par AngelCare.</span>
                  </div>
                </div>

                {hasError ? (
                  <div className={styles.errorNotice} role="alert">
                    <CircleAlert aria-hidden="true" />
                    <span>Code invalide, expiré ou indisponible. Vérifiez votre invitation puis réessayez.</span>
                  </div>
                ) : null}

                <label className={styles.field}>
                  <span>CODE D’ACCÈS</span>
                  <span className={styles.inputShell}>
                    <LockKeyhole aria-hidden="true" />
                    <input
                      name="pin"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      minLength={8}
                      maxLength={8}
                      required
                      autoComplete="one-time-code"
                      aria-describedby="demo-pin-guidance"
                      placeholder="8 chiffres"
                    />
                  </span>
                </label>
                <p id="demo-pin-guidance" className={styles.recoveryNotice}>
                  Accès contrôlé · environnement sécurisé · démonstration isolée · durée et usage gouvernés par votre invitation.
                </p>
                <SubmitButton />
              </form>
            </div>
          </section>

          <TrustRail />
          <footer className={styles.footer}>© 2026 SANILA Operating System · by AngelCare.</footer>
        </section>
      </div>
    </main>
  )
}
