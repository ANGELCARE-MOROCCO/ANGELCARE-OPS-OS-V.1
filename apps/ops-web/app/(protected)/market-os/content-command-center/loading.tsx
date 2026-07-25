export default function ContentCommandCenterLoading() {
  return (
    <main className="cc360-route-state" aria-busy="true" aria-label="Chargement Content Command 360">
      <section className="cc360-loading-hero" />
      <section className="cc360-loading-metrics">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</section>
      <section className="cc360-loading-grid"><div /><div /><div /></section>
      <section className="cc360-loading-table"><header /><div /><div /><div /><div /></section>
    </main>
  )
}
