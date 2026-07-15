'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Angelcare360OperatorDrawer from './Angelcare360OperatorDrawer'
import Angelcare360OperatorFormField, { type Angelcare360OperatorFormFieldConfig } from './Angelcare360OperatorFormField'
import Angelcare360OperatorMutationBanner from './Angelcare360OperatorMutationBanner'
import Angelcare360OperatorConfirmPanel from './Angelcare360OperatorConfirmPanel'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'

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
    setBanner({ kind: 'loading', message: 'Traitement de l’action opérateur en cours…' })
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

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Mouvements opérateur</div>
          <h2 style={titleStyle}>{title}</h2>
          {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
        </div>
      </div>

      {groups?.length ? (
        <div style={groupsGridStyle}>
          {groups.map((group) => {
            const groupActions = group.actionIds
              .map((id) => actions.find((action) => action.id === id))
              .filter((action): action is Angelcare360OperatorActionDescriptor => Boolean(action))
            const availableActions = groupActions.filter((action) => !action.lockedReason)
            if (!availableActions.length) return null
            return (
              <article key={group.title} style={groupCardStyle}>
                <div style={groupHeadingStyle}>
                  <div style={groupTitleStyle}>{group.title}</div>
                  {group.description ? <div style={groupDescriptionStyle}>{group.description}</div> : null}
                </div>
                <div style={toolbarStyle}>
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
        <div style={toolbarStyle}>
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

      {actions.some((action) => action.lockedReason) ? (
        <div style={lockedRowStyle}>
          {actions.filter((action) => action.lockedReason).map((action) => (
            <Angelcare360OperatorActionButton
              key={action.id}
              label={action.label}
              tone="secondary"
              disabled
              disabledReason={action.lockedReason || action.label}
            />
          ))}
        </div>
      ) : null}

      <Angelcare360OperatorMutationBanner kind={banner.kind} message={banner.message} />

      {currentAction ? (
        <Angelcare360OperatorDrawer
          open
          title={currentAction.label}
          subtitle={currentAction.description}
          onClose={() => {
            setOpenActionId(null)
            setBanner({ kind: 'idle', message: null })
            setConfirming(false)
          }}
          footer={
            <>
              <Angelcare360OperatorActionButton label="Annuler" tone="secondary" onClick={() => setOpenActionId(null)} disabled={busy} />
              <Angelcare360OperatorActionButton label={currentAction.submitLabel || 'Enregistrer'} tone={currentAction.tone === 'danger' ? 'danger' : 'primary'} type="button" disabled={busy || (currentAction.confirmMessage ? !confirming : false)} onClick={() => void submitCurrentAction()} />
            </>
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submitCurrentAction()
            }}
            style={formStyle}
          >
            {currentAction.confirmMessage ? (
                <Angelcare360OperatorConfirmPanel
                  title={currentAction.confirmTitle || 'Confirmation requise'}
                  message={currentAction.confirmMessage}
                  confirmLabel="Compris"
                  tone={currentAction.tone === 'danger' ? 'danger' : 'warning'}
                  busy={busy}
                  onConfirm={() => setConfirming(true)}
                />
              ) : null}

            {currentAction.fields.length ? (
              <div style={fieldsGridStyle}>
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

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  borderRadius: 26,
  border: '1px solid #dbe4ef',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
  alignItems: 'start',
  paddingBottom: 12,
  borderBottom: '1px solid #e2e8f0',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#1d4ed8',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 6,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 21,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  justifyContent: 'end',
  alignItems: 'center',
}

const groupsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}

const groupCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 16px 36px rgba(15,23,42,.04)',
  padding: 14,
  display: 'grid',
  gap: 12,
}

const groupHeadingStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const groupTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 950,
}

const groupDescriptionStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
  fontSize: 13,
}

const lockedRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const fieldsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
}
