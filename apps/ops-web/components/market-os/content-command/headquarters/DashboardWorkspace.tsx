"use client"

import {
  CapacityAndActivity,
  DecisionIntegrityPanels,
  ExecutiveCommandDock,
  ExecutiveInterventionQueue,
  ExecutiveMandateMasthead,
  LifecyclePressureMap,
  ProductionRunway,
  SituationRoom,
  StrategicWaveTimeline,
} from "./command/ExecutiveCommandSections"
import { PageStatus } from "./primitives"
import { useHeadquartersSnapshot } from "./client"
import { buildCommandViewModel } from "./mz2-view-models"
import styles from "./mz2-executive-dossier.module.css"

export default function DashboardWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const model = buildCommandViewModel(snapshot)

  return <main className={styles.commandCanvas} data-mz2-commandement>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    {!loading && !error ? <>
      <ExecutiveMandateMasthead model={model} onRefresh={refresh}/>
      <SituationRoom model={model}/>
      <ExecutiveInterventionQueue model={model}/>
      <LifecyclePressureMap model={model}/>
      <ProductionRunway model={model}/>
      <DecisionIntegrityPanels model={model}/>
      <StrategicWaveTimeline model={model}/>
      <CapacityAndActivity model={model}/>
      <ExecutiveCommandDock/>
    </> : null}
  </main>
}
