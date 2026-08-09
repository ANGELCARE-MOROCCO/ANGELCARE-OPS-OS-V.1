'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360PermissionRecord, Angelcare360RoleRecord } from '@/types/angelcare360/rbac'

type RolePermissionRow = {
  role_id: string
  permission_key: string
  effect: string
}

type Angelcare360PermissionMatrixProps = {
  schoolId: string
  roles: Array<Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope'> & { is_system_locked?: boolean; status?: string }>
  permissions: Angelcare360PermissionRecord[]
  rolePermissions: RolePermissionRow[]
  canEdit: boolean
  disabledReason?: string
}

function domainLabel(domain: string) {
  return domain
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

export default function Angelcare360PermissionMatrix({
  schoolId,
  roles,
  permissions,
  rolePermissions,
  canEdit,
  disabledReason,
}: Angelcare360PermissionMatrixProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '')
  const [draft, setDraft] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const row of rolePermissions) {
      initial[`${row.role_id}:${row.permission_key}`] = row.effect === 'allow'
    }
    return initial
  })
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, startTransition] = useTransition()

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Angelcare360PermissionRecord[]>()
    for (const permission of permissions) {
      const current = groups.get(permission.domain_key) || []
      current.push(permission)
      groups.set(permission.domain_key, current)
    }
    return Array.from(groups.entries()).map(([domain, items]) => ({ domain, items }))
  }, [permissions])

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || null

  const toggle = (permissionKey: string, checked: boolean) => {
    if (!selectedRole) return
    setDraft((current) => ({ ...current, [`${selectedRole.id}:${permissionKey}`]: checked }))
  }

  const save = () => {
    if (!canEdit) {
      setMessage(disabledReason || 'La modification RBAC est verrouillée.')
      return
    }

    if (!selectedRole) {
      setMessage('Veuillez sélectionner un rôle.')
      return
    }

    startTransition(async () => {
      try {
        const permissionKeys = permissions
          .filter((permission) => draft[`${selectedRole.id}:${permission.permission_key}`])
          .map((permission) => permission.permission_key)

        const response = await fetch('/api/angelcare360/administration', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'role-permissions',
            operation: 'update',
            payload: {
              school_id: schoolId,
              role_id: selectedRole.id,
              permission_keys: permissionKeys,
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Enregistrement impossible.')
        }
        setMessage('Matrice RBAC enregistrée.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <section style={shellStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>RBAC</div>
          <h2 style={titleStyle}>Rôles & permissions</h2>
          <p style={subtitleStyle}>Vue de lecture et contrôle autorisé de la matrice de sécurité.</p>
        </div>
        <button type="button" onClick={save} disabled={!canEdit || isSaving} title={disabledReason} style={!canEdit ? disabledButtonStyle : primaryButtonStyle}>
          {isSaving ? 'Enregistrement…' : 'Enregistrer la matrice'}
        </button>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}

      <div style={roleBarStyle}>
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            style={{
              ...roleButtonStyle,
              ...(selectedRoleId === role.id ? roleButtonActiveStyle : null),
            }}
          >
            <div>{role.label}</div>
            <div style={roleMetaStyle}>{role.role_key}{role.is_system_locked ? ' · verrouillé' : ''}</div>
          </button>
        ))}
      </div>

      <div style={matrixStyle}>
        {groupedPermissions.map((group) => (
          <div key={group.domain} style={groupCardStyle}>
            <div style={groupHeaderStyle}>{domainLabel(group.domain)}</div>
            <div style={permissionListStyle}>
              {group.items.map((permission) => {
                const checked = selectedRole ? Boolean(draft[`${selectedRole.id}:${permission.permission_key}`]) : false
                const disabled = !canEdit || !selectedRole || selectedRole.is_system_locked
                return (
                  <label key={permission.permission_key} style={permissionItemStyle}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(event) => toggle(permission.permission_key, event.target.checked)}
                    />
                    <div style={permissionTextStyle}>
                      <div style={permissionLabelStyle}>{permission.label}</div>
                      <div style={permissionMetaStyle}>{permission.permission_key}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const messageStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  padding: 14,
  color: '#1e3a8a',
  fontWeight: 650,
}

const roleBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const roleButtonStyle: React.CSSProperties = {
  border: '1px solid #dbe4ef',
  borderRadius: 16,
  background: '#fff',
  padding: '12px 14px',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
  minWidth: 180,
  textAlign: 'left',
}

const roleButtonActiveStyle: React.CSSProperties = {
  border: '1px solid #93c5fd',
  background: '#eff6ff',
}

const roleMetaStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const matrixStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const groupCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const groupHeaderStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const permissionListStyle: React.CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
}

const permissionItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'start',
  borderRadius: 16,
  border: '1px solid #eef2f7',
  background: '#f8fafc',
  padding: 12,
}

const permissionTextStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const permissionLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}

const permissionMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}
