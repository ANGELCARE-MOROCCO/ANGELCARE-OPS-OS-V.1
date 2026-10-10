import { useId } from 'react'
import { copy, type CareLocale, type NavigationPhase } from './navigation-contract'
import styles from './care-orbit.module.css'
export function CareOrbitCard({ locale, phase = 'pending', target, onDismiss }: { locale: CareLocale; phase?: NavigationPhase; target?: string | null; onDismiss?: () => void }) {
  const t = copy[locale], id = useId().replace(/:/g, ''), delayed = phase === 'slow' || phase === 'offline'
  return <section className={styles.card} data-phase={phase} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} data-localization-ignore data-care-orbit-card>
    {onDismiss ? <button className={styles.close} type="button" onClick={onDismiss} aria-label={t.close}><span aria-hidden="true">×</span></button> : null}
    <div className={styles.art} aria-hidden="true">
      <div className={styles.aura}/><div className={styles.ringOne}><i/><i/><i/></div><div className={styles.ringTwo}><i/><i/></div>
      <div className={styles.heart}><svg viewBox="0 0 100 92" fill="none" focusable="false"><defs><linearGradient id={`${id}-heart`} x1="12" y1="4" x2="82" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor="#ffc5dc"/><stop offset=".38" stopColor="#ff6ca8"/><stop offset=".75" stopColor="#f72b79"/><stop offset="1" stopColor="#cf1669"/></linearGradient><radialGradient id={`${id}-shine`}><stop stopColor="white" stopOpacity=".85"/><stop offset="1" stopColor="white" stopOpacity="0"/></radialGradient></defs><path d="M50 84C42 78 7 54 7 30C7 9 33 1 50 21C67 1 93 9 93 30C93 54 58 78 50 84Z" fill={`url(#${id}-heart)`}/><ellipse cx="31" cy="25" rx="17" ry="12" fill={`url(#${id}-shine)`}/><path d="M20 29C20 20 30 15 37 18" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".64"/></svg></div>
      <span className={styles.sparkOne}>✦</span><span className={styles.sparkTwo}>✧</span>
    </div>
    <div className={styles.message} role="status" aria-live="polite" aria-atomic="true"><h2>{phase === 'offline' ? t.offline : delayed ? t.slow : t.title}</h2><p>{phase === 'offline' ? t.offlineBody : delayed ? t.slowBody : t.body}</p></div>
    <div className={styles.dots} aria-hidden="true"><i/><i/><i/></div>
    {delayed && onDismiss ? <div className={styles.actions}>{target ? <a href={target} data-care-orbit-ignore>{t.direct}</a> : null}<button type="button" onClick={onDismiss}>{t.dismiss}</button></div> : null}
    <small className={styles.signature}>{t.brand}</small>
  </section>
}
