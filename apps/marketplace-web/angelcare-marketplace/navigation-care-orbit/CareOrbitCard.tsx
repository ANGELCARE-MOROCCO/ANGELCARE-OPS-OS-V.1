import { copy, type CareLocale, type NavigationPhase } from './navigation-contract'
import styles from './care-orbit.module.css'

export function CareOrbitCard({ locale, phase = 'pending', target, onDismiss }: { locale: CareLocale; phase?: NavigationPhase; target?: string | null; onDismiss?: () => void }) {
  const t = copy[locale], delayed = phase === 'slow' || phase === 'offline'
  return <section className={styles.card} data-phase={phase} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} data-localization-ignore data-care-orbit-card>
    {onDismiss ? <button className={styles.close} type="button" onClick={onDismiss} aria-label={t.close}><span aria-hidden="true">×</span></button> : null}
    <div className={styles.art} aria-hidden="true">
      <div className={styles.aura}/>
      <div className={styles.contourOrbit}>
        <svg viewBox="0 0 120 120" fill="none" focusable="false">
          <circle className={styles.contourTrack} cx="60" cy="60" r="49"/>
          <g strokeWidth="1.8" strokeLinecap="round" strokeDasharray="58 250">
            <circle cx="60" cy="60" r="49" stroke="#24b844"/>
            <circle cx="60" cy="60" r="49" stroke="#05b9e9" transform="rotate(90 60 60)"/>
            <circle cx="60" cy="60" r="49" stroke="#ffac18" transform="rotate(180 60 60)"/>
            <circle cx="60" cy="60" r="49" stroke="#ed438d" transform="rotate(270 60 60)"/>
          </g>
        </svg>
      </div>
      <div className={styles.heart}>
        <svg viewBox="0 0 100 92" fill="none" focusable="false">
          <path d="M50 84C42 78 7 54 7 30C7 9 33 1 50 21C67 1 93 9 93 30C93 54 58 78 50 84Z" fill="#f8e4ed" fillOpacity=".65" stroke="#e9a8c2" strokeWidth="1.3"/>
          <path d="M20 29C20 20 30 15 37 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className={styles.sparkOne}>✦</span><span className={styles.sparkTwo}>✧</span>
    </div>
    <div className={styles.message} role="status" aria-live="polite" aria-atomic="true">
      <h2>{t.title}</h2>
      <p>{phase === 'offline' ? t.offlineBody : t.body}</p>
    </div>
    <div className={styles.dots} aria-hidden="true"><i/><i/><i/><i/></div>
    {delayed && onDismiss ? <div className={styles.actions}>{target ? <a href={target} data-care-orbit-ignore>{t.direct}</a> : null}<button type="button" onClick={onDismiss}>{t.dismiss}</button></div> : null}
    <img className={styles.brandLogo} src="/brand/angelcare-pearl-rim-colour-r1.png" alt="AngelCare" width="76" height="26"/>
  </section>
}
