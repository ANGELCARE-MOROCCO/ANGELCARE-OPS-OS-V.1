'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleDot, LockKeyhole, ShieldCheck } from 'lucide-react'
import Angelcare360OperatorDrawer from './Angelcare360OperatorDrawer'
import Angelcare360OperatorFormField, { type Angelcare360OperatorFormFieldConfig } from './Angelcare360OperatorFormField'
import Angelcare360OperatorMutationBanner from './Angelcare360OperatorMutationBanner'
import Angelcare360OperatorConfirmPanel from './Angelcare360OperatorConfirmPanel'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'
import styles from './Angelcare360OperatorExperience.module.css'

export type Angelcare360OperatorActionDescriptor = {
  id: string
  label: string
  endpoint: string
  operation: string
  entity?: string
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
  description?: string
  submitLabel?: string
  successMessage?: string
  lockedReason?: string | null
  confirmTitle?: string
  confirmMessage?: string
  fields: Angelcare360OperatorFormFieldConfig[]
  defaultValues?: Record<string, string>
}

export type Angelcare360OperatorActionDrawerGroup = {
  title: string
  description?: string
  actionIds: string[]
}

type Props = {
  title?: string
  subtitle?: string
  actions: Angelcare360OperatorActionDescriptor[]
  groups?: Angelcare360OperatorActionDrawerGroup[]
}

type BannerState = { kind: 'idle' | 'loading' | 'success' | 'error'; message: string | null }

export default function Angelcare360OperatorActionDrawer({ title = 'Actions opérateur', subtitle, actions, groups }: Props) {
  const router = useRouter()
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<BannerState>({ kind: 'idle', message: null })
  const [confirming, setConfirming] = useState(false)

  const currentAction = useMemo(
    () => actions.find((action) => action.id === openActionId) || null,
    [actions, openActionId],
  )

  useEffect(() => {
    if (!currentAction) return
    setFormValues(currentAction.defaultValues || {})
    setConfirming(false)
    setBanner({ kind: 'idle', message: null })
  }, [currentAction])

  async function submitCurrentAction() {
    if (!currentAction) return
    if (currentAction.confirmMessage && !confirming) return
    setBusy(true)
    setBanner({ kind: 'loading', message: 'Exécution sécurisée de l’action opérateur…' })
    try {
      const response = await fetch(currentAction.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: currentAction.operation,
          entity: currentAction.entity,
          payload: formValues,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || 'Action opérateur indisponible.')
      }
      setBanner({ kind: 'success', message: currentAction.successMessage || 'Action opérateur enregistrée.' })
      setOpenActionId(null)
      setConfirming(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue.'
      setBanner({ kind: 'error', message })
    } finally {
      setBusy(false)
    }
  }

  const availableCount = actions.filter((action) => !action.lockedReason).length
  const lockedActions = actions.filter((action) => action.lockedReason)

  return (
    <section className={styles.actionPanel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.panelEyebrow}>Centre d’exécution</div>
          <h2 className={styles.panelTitle}>{title}</h2>
          {subtitle ? <p className={styles.panelDescription}>{subtitle}</p> : null}
        </div>
        <span className={styles.rowCount}>{availableCount} action{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''}</span>
      </div>

      {groups?.length ? (
        <div className={styles.actionGroups}>
          {groups.map((group) => {
            const groupActions = group.actionIds
              .map((id) => actions.find((action) => action.id === id))
              .filter((action): action is Angelcare360OperatorActionDescriptor => Boolean(action))
            const availableActions = groupActions.filter((action) => !action.lockedReason)
            if (!availableActions.length) return null
            return (
              <article key={group.title} className={styles.actionGroup}>
                <div>
                  <div className={styles.actionGroupTitle}>{group.title}</div>
                  {group.description ? <div className={styles.actionGroupDescription}>{group.description}</div> : null}
                </div>
                <div className={styles.actionToolbar}>
                  {availableActions.map((action) => (
                    <Angelcare360OperatorActionButton
                      key={action.id}
                      label={action.label}
                      tone={action.tone || 'secondary'}
                      onClick={() => setOpenActionId(action.id)}
                    />
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className={styles.actionToolbar}>
          {actions.filter((action) => !action.lockedReason).map((action) => (
            <Angelcare360OperatorActionButton
              key={action.id}
              label={action.label}
              tone={action.tone || 'secondary'}
              onClick={() => setOpenActionId(action.id)}
            />
          ))}
        </div>
      )}

      {lockedActions.length ? (
        <div className={styles.actionGroup}>
          <div>
            <div className={styles.actionGroupTitle}><LockKeyhole size={14} aria-hidden="true" /> Capacités verrouillées</div>
            <div className={styles.actionGroupDescription}>Ces actions restent visibles pour expliquer la capacité attendue, sans simuler une infrastructure absente.</div>
          </div>
          <div className={styles.actionToolbar}>
            {lockedActions.map((action) => (
              <Angelcare360OperatorActionButton
                key={action.id}
                label={action.label}
                tone="secondary"
                disabled
                disabledReason={action.lockedReason || action.label}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Angelcare360OperatorMutationBanner kind={banner.kind} message={banner.message} />

      {currentAction ? (
        <Angelcare360OperatorDrawer
          open
          variant={resolveActionVariant(currentAction)}
          title={currentAction.label}
          subtitle={currentAction.description || `Opération ${currentAction.operation} exécutée sur le périmètre opérateur sélectionné.`}
          onClose={() => {
            setOpenActionId(null)
            setBanner({ kind: 'idle', message: null })
            setConfirming(false)
          }}
          footer={
            <>
              <Angelcare360OperatorActionButton label="Annuler" tone="secondary" onClick={() => setOpenActionId(null)} disabled={busy} />
              <Angelcare360OperatorActionButton
                label={currentAction.submitLabel || 'Exécuter l’action'}
                tone={currentAction.tone === 'danger' ? 'danger' : 'primary'}
                type="button"
                disabled={busy || (currentAction.confirmMessage ? !confirming : false)}
                disabledReason={currentAction.confirmMessage && !confirming ? 'Validez d’abord la compréhension de l’impact.' : null}
                onClick={() => void submitCurrentAction()}
              />
            </>
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submitCurrentAction()
            }}
            className={styles.form}
          >
            <div className={styles.missionGrid}>
              <div className={styles.missionCell}>
                <span className={styles.missionIcon}><CircleDot size={15} aria-hidden="true" /></span>
                <span className={styles.missionLabel}>Opération</span>
                <span className={styles.missionText}>{currentAction.operation}</span>
              </div>
              <div className={styles.missionCell}>
                <span className={styles.missionIcon}><ShieldCheck size={15} aria-hidden="true" /></span>
                <span className={styles.missionLabel}>Contrôle</span>
                <span className={styles.missionText}>{currentAction.confirmMessage ? 'Impact à confirmer avant exécution.' : 'Mutation validée côté serveur et auditée.'}</span>
              </div>
              <div className={styles.missionCell}>
                <span className={styles.missionIcon}><CircleDot size={15} aria-hidden="true" /></span>
                <span className={styles.missionLabel}>Données requises</span>
                <span className={styles.missionText}>{currentAction.fields.length} champ{currentAction.fields.length > 1 ? 's' : ''} dans cette mission.</span>
              </div>
            </div>

            {currentAction.confirmMessage ? (
              <Angelcare360OperatorConfirmPanel
                title={currentAction.confirmTitle || 'Confirmation d’impact requise'}
                message={currentAction.confirmMessage}
                confirmLabel="Impact compris"
                tone={currentAction.tone === 'danger' ? 'danger' : 'warning'}
                busy={busy}
                onConfirm={() => setConfirming(true)}
              />
            ) : null}

            {currentAction.fields.length ? (
              <div className={styles.fieldsGrid}>
                {currentAction.fields.map((field) => (
                  <Angelcare360OperatorFormField
                    key={field.name}
                    field={field}
                    value={formValues[field.name] ?? field.defaultValue ?? ''}
                    onChange={(name, value) => setFormValues((current) => ({ ...current, [name]: value }))}
                    disabled={busy || (currentAction.confirmMessage ? !confirming : false)}
                  />
                ))}
              </div>
            ) : null}
          </form>
        </Angelcare360OperatorDrawer>
      ) : null}
    </section>
  )
}

function resolveActionVariant(action: Angelcare360OperatorActionDescriptor): 'default' | 'finance' | 'commercial' | 'support' | 'infrastructure' | 'governance' | 'danger' {
  if (action.tone === 'danger') return 'danger'
  const scope = `${action.endpoint} ${action.entity || ''} ${action.operation}`.toLowerCase()
  if (scope.includes('billing') || scope.includes('payment') || scope.includes('invoice') || scope.includes('dunning')) return 'finance'
  if (scope.includes('subscription') || scope.includes('plan') || scope.includes('package') || scope.includes('feature') || scope.includes('usage')) return 'commercial'
  if (scope.includes('tenant') || scope.includes('access') || scope.includes('provision')) return 'infrastructure'
  if (scope.includes('support') || scope.includes('service') || scope.includes('incident') || scope.includes('task')) return 'support'
  if (scope.includes('audit') || scope.includes('setting') || scope.includes('role')) return 'governance'
  return 'default'
}
