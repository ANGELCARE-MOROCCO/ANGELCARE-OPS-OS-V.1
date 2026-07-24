import { styles } from '@/components/service-os/Services360UI'

export default function Loading() {
  return <main className={styles.shell} aria-busy="true" aria-label="Chargement Services 360">
    <section className={styles.hero} style={{ minHeight: 280 }}>
      <div style={{ display: 'grid', gap: 14, alignContent: 'center' }}>
        <div style={{ width: 150, height: 18, borderRadius: 999, background: '#dceafa' }} />
        <div style={{ width: '70%', height: 54, borderRadius: 18, background: '#e7f1fb' }} />
        <div style={{ width: '88%', height: 20, borderRadius: 999, background: '#edf5fc' }} />
        <div style={{ width: '63%', height: 20, borderRadius: 999, background: '#edf5fc' }} />
      </div>
      <div className={styles.heroBrief} style={{ opacity: .72 }} />
    </section>
    <section className={styles.kpiGrid}>{Array.from({ length: 6 }).map((_, index) => <div className={styles.kpi} key={index} style={{ minHeight: 105, background: '#f6faff' }} />)}</section>
    <section className={styles.grid3}>{Array.from({ length: 6 }).map((_, index) => <div className={styles.card} key={index} style={{ minHeight: 180, background: '#fbfdff' }} />)}</section>
  </main>
}
