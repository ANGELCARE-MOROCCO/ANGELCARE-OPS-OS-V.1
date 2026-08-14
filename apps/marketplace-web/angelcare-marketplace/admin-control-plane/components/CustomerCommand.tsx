"use client"

import { useMemo, useState } from 'react'
import { ArrowRight, Baby, CheckCircle2, CreditCard, Home, Plus, Save, Search, ShieldCheck, UserRound, UsersRound, WalletCards } from 'lucide-react'
import type { AdminCustomerDossier, AdminCustomerList, AdminCustomerSummary } from '../types'
import styles from '../../design-system/marketplace.module.css'
import { Button, Card, MetricCard, PageHeader, StatePanel, StatusChip } from '../../design-system/ui'
import { CustomerMegaDossierOverlay } from '../../enterprise-command/components/CustomerMegaDossier'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) {
    throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  }
  return payload.data
}

const rowText = (row: Record<string, unknown> | null | undefined, key: string) => {
  const value = row?.[key]
  return value === null || value === undefined ? '' : String(value)
}

const formatDate = (value: string) => value ? new Date(value).toLocaleString('fr-FR') : '—'
const money = (value: unknown) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh`

export function CustomerCommand({ initial, initialCustomerId, initialCreateKind }: { initial: AdminCustomerList; initialCustomerId?: string | null; initialCreateKind?: string | null }) {
  const [portfolio, setPortfolio] = useState(initial)
  const [selectedId, setSelectedId] = useState(initialCustomerId || initial.customers[0]?.id || '')
  const [dossier, setDossier] = useState<AdminCustomerDossier | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(Boolean(initialCreateKind))
  const [megaCustomerId, setMegaCustomerId] = useState<string | null>(null)
  const [createResult, setCreateResult] = useState<string | null>(null)

  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createKind, setCreateKind] = useState(initialCreateKind && ['family', 'individual', 'organization', 'employee_beneficiary', 'guest'].includes(initialCreateKind) ? initialCreateKind : 'family')
  const [createLocale, setCreateLocale] = useState('fr')

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStatus, setEditStatus] = useState('active')
  const [editPremium, setEditPremium] = useState(false)
  const [familyCity, setFamilyCity] = useState('')
  const [familyConsent, setFamilyConsent] = useState('pending')

  const [addressCity, setAddressCity] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [addressDefault, setAddressDefault] = useState(false)

  const [childName, setChildName] = useState('')
  const [childBirthDate, setChildBirthDate] = useState('')
  const [childAgeGroup, setChildAgeGroup] = useState('3-5 ans')
  const [guardians, setGuardians] = useState<Record<string, unknown>[]>([])
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('parent')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianPrimary, setGuardianPrimary] = useState(false)

  const filtered = useMemo(() => portfolio.customers.filter((customer) => {
    const haystack = `${customer.display_name} ${customer.email || ''} ${customer.phone || ''} ${customer.public_reference}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) &&
      (kind === 'all' || customer.account_kind === kind) &&
      (status === 'all' || customer.status === status)
  }), [portfolio.customers, query, kind, status])

  async function loadCustomer(customerId: string) {
    if (!customerId) return
    setSelectedId(customerId)
    setBusy(true)
    setError(null)
    try {
      const result = await request<AdminCustomerDossier>(`/api/angelcare-marketplace/admin/customers/${customerId}`)
      setDossier(result)
      setEditName(result.account.display_name)
      setEditEmail(result.account.email || '')
      setEditPhone(result.account.phone || '')
      setEditStatus(result.account.status)
      setEditPremium(result.account.premium_status)
      setFamilyCity(rowText(result.family, 'city'))
      setFamilyConsent(rowText(result.family, 'consent_status') || 'pending')
      if (result.account.family_account_id) {
        try {
          const guardianResult = await request<{ guardians: Record<string, unknown>[] }>(`/api/angelcare-marketplace/admin/families/${result.account.family_account_id}/guardians`)
          setGuardians(guardianResult.guardians)
        } catch {
          setGuardians([])
        }
      } else {
        setGuardians([])
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger le dossier client.')
    } finally {
      setBusy(false)
    }
  }

  async function createCustomer() {
    setBusy(true)
    setError(null)
    setCreateResult(null)
    try {
      const result = await request<{ customer: AdminCustomerSummary; temporaryPassword: string }>('/api/angelcare-marketplace/admin/customers', {
        method: 'POST',
        body: JSON.stringify({
          displayName: createName,
          email: createEmail,
          phone: createPhone || null,
          accountKind: createKind,
          preferredLocale: createLocale,
        }),
      })
      setPortfolio((current) => ({ ...current, customers: [result.customer, ...current.customers], total: current.total + 1 }))
      setCreateResult(`Compte créé. Mot de passe temporaire : ${result.temporaryPassword}`)
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      await loadCustomer(result.customer.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function saveCustomer() {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const updated = await request<AdminCustomerSummary>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: editName,
          email: editEmail,
          phone: editPhone || null,
          status: editStatus,
          premiumStatus: editPremium,
        }),
      })
      setPortfolio((current) => ({ ...current, customers: current.customers.map((item) => item.id === updated.id ? updated : item) }))
      setDossier((current) => current ? { ...current, account: updated } : current)
      setNotice('Dossier client enregistré.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function saveFamily() {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const family = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}/family`, {
        method: 'PATCH',
        body: JSON.stringify({ city: familyCity || null, consentStatus: familyConsent }),
      })
      setDossier((current) => current ? { ...current, family } : current)
      setNotice('Dossier famille synchronisé.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mise à jour famille impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function addAddress() {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const address = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}/addresses`, {
        method: 'POST',
        body: JSON.stringify({ city: addressCity, addressLine, label: addressLabel || null, isDefault: addressDefault }),
      })
      setDossier((current) => current ? { ...current, addresses: [address, ...current.addresses] } : current)
      setAddressCity('')
      setAddressLine('')
      setAddressLabel('')
      setAddressDefault(false)
      setNotice('Adresse ajoutée au dossier client.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création de l’adresse impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function addChild() {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const child = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}/family/children`, {
        method: 'POST',
        body: JSON.stringify({ firstName: childName, birthDate: childBirthDate, ageGroup: childAgeGroup }),
      })
      setDossier((current) => current ? { ...current, children: [child, ...current.children] } : current)
      setChildName('')
      setChildBirthDate('')
      setNotice('Profil enfant créé.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création du profil enfant impossible.')
    } finally {
      setBusy(false)
    }
  }


  async function addGuardian() {
    if (!dossier?.account.family_account_id) return
    setBusy(true)
    setError(null)
    try {
      const guardian = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/families/${dossier.account.family_account_id}/guardians`, {
        method: 'POST',
        body: JSON.stringify({ fullName: guardianName, relationship: guardianRelation, email: guardianEmail || null, phone: guardianPhone || null, isPrimary: guardianPrimary }),
      })
      setGuardians((current) => guardianPrimary ? [guardian, ...current.map((item) => ({ ...item, is_primary: false }))] : [guardian, ...current])
      setGuardianName('')
      setGuardianEmail('')
      setGuardianPhone('')
      setGuardianPrimary(false)
      setNotice('Responsable familial ajouté.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création du responsable impossible.')
    } finally {
      setBusy(false)
    }
  }


  async function setAddressStatus(address: Record<string, unknown>, nextStatus: 'active' | 'archived') {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const updated = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}/addresses/${rowText(address, 'id')}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setDossier((current) => current ? { ...current, addresses: current.addresses.map((item) => rowText(item, 'id') === rowText(updated, 'id') ? updated : item) } : current)
      setNotice(nextStatus === 'active' ? 'Adresse restaurée.' : 'Adresse archivée.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mise à jour de l’adresse impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function setChildStatus(child: Record<string, unknown>, nextStatus: 'active' | 'archived') {
    if (!dossier) return
    setBusy(true)
    setError(null)
    try {
      const updated = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/customers/${dossier.account.id}/family/children/${rowText(child, 'id')}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setDossier((current) => current ? { ...current, children: current.children.map((item) => rowText(item, 'id') === rowText(updated, 'id') ? updated : item) } : current)
      setNotice(nextStatus === 'active' ? 'Profil enfant restauré.' : 'Profil enfant archivé.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mise à jour du profil enfant impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function setGuardianStatus(guardian: Record<string, unknown>, nextStatus: 'active' | 'archived') {
    if (!dossier?.account.family_account_id) return
    setBusy(true)
    setError(null)
    try {
      const updated = await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/families/${dossier.account.family_account_id}/guardians/${rowText(guardian, 'id')}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: rowText(guardian, 'full_name'),
          relationship: rowText(guardian, 'relationship') || 'guardian',
          email: rowText(guardian, 'email') || null,
          phone: rowText(guardian, 'phone') || null,
          isPrimary: rowText(guardian, 'is_primary') === 'true',
          status: nextStatus,
          notes: rowText(guardian, 'notes') || null,
        }),
      })
      setGuardians((current) => current.map((item) => rowText(item, 'id') === rowText(updated, 'id') ? updated : item))
      setNotice(nextStatus === 'active' ? 'Responsable restauré.' : 'Responsable archivé.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mise à jour du responsable impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
    <div>
      <PageHeader
        eyebrow="CUSTOMER & FAMILY CONTROL"
        title="Clients, familles et dossiers commerciaux"
        description="Un vrai centre opérateur : créer un client, modifier son identité, piloter son dossier famille, adresses, enfants, commandes, paiements et Wallet sans sortir de l’administration."
        actions={<Button onClick={() => setCreateOpen((value) => !value)}><Plus size={16} /> Nouveau client</Button>}
      />

      {error ? <div className={styles.noticeDanger} style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className={styles.noticeSuccess} style={{ marginBottom: 14 }}><CheckCircle2 size={16} />{notice}</div> : null}
      {createResult ? <div className={styles.notice} style={{ marginBottom: 14 }}><ShieldCheck size={16} /><span>{createResult}</span></div> : null}

      <div className={styles.metricGrid}>
        <MetricCard label="Clients" value={portfolio.total} hint="Dossiers Marketplace persistants" icon={<UsersRound size={16} />} />
        <MetricCard label="Actifs" value={portfolio.active} hint="Comptes utilisables maintenant" icon={<CheckCircle2 size={16} />} />
        <MetricCard label="Familles" value={portfolio.families} hint="Dossiers famille reliés" icon={<Baby size={16} />} />
        <MetricCard label="Restreints" value={portfolio.restricted} hint="Suspendus ou sous restriction" icon={<ShieldCheck size={16} />} />
      </div>

      {createOpen ? (
        <Card title="Créer un client" subtitle="Création Auth + dossier Marketplace + dossier famille si le type est Famille.">
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Nom complet</label><input className={styles.textField} value={createName} onChange={(event) => setCreateName(event.target.value)} /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Email</label><input className={styles.textField} type="email" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Téléphone</label><input className={styles.textField} value={createPhone} onChange={(event) => setCreatePhone(event.target.value)} /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Type de compte</label><select className={styles.selectField} value={createKind} onChange={(event) => setCreateKind(event.target.value)}><option value="family">Famille</option><option value="individual">Individuel</option><option value="organization">Organisation</option><option value="employee_beneficiary">Bénéficiaire entreprise</option><option value="guest">Invité</option></select></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Langue</label><select className={styles.selectField} value={createLocale} onChange={(event) => setCreateLocale(event.target.value)}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></div>
            <div className={styles.pageActions}><Button disabled={busy || !createName || !createEmail} onClick={() => void createCustomer()}><Save size={15} /> Créer le compte</Button></div>
          </div>
        </Card>
      ) : null}

      <div className={styles.gridTwo} style={{ marginTop: 16 }}>
        <Card title="Registre clients" subtitle={`${filtered.length} dossier(s) visibles dans le registre courant.`}>
          <div className={styles.toolbar}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}><Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#65748a' }} /><input className={styles.searchField} style={{ paddingLeft: 34 }} placeholder="Nom, email, téléphone, référence…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <select className={styles.selectField} value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">Tous les types</option><option value="family">Famille</option><option value="individual">Individuel</option><option value="organization">Organisation</option><option value="employee_beneficiary">Bénéficiaire</option><option value="guest">Invité</option></select>
            <select className={styles.selectField} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="pending_verification">À vérifier</option><option value="restricted">Restreint</option><option value="suspended">Suspendu</option><option value="closed">Fermé</option></select>
          </div>
          {filtered.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Client</th><th>Type</th><th>Statut</th><th>Commerce</th><th>Dernière mise à jour</th><th /></tr></thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.id} onClick={() => void loadCustomer(customer.id)} style={{ cursor: 'pointer' }}>
                      <td><div className={styles.tablePrimary}>{customer.display_name}</div><div className={styles.tableSecondary}>{customer.public_reference} · {customer.email || 'Sans email'}</div></td>
                      <td>{customer.account_kind}</td>
                      <td><StatusChip status={customer.status} /></td>
                      <td>{customer.order_count} commandes · {customer.payment_count} paiements</td>
                      <td><Button variant="quiet" onClick={(event) => { event.stopPropagation(); setMegaCustomerId(customer.id) }}><UsersRound size={14} /> 360</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <StatePanel type="empty" title="Aucun client trouvé" text="Ajustez la recherche ou créez directement un nouveau dossier client." />}
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {dossier ? (
            <>
              <Card title="Dossier client" subtitle={`${dossier.account.public_reference} · ${dossier.account.auth_user_id}`}>
                <div className={styles.pageActions} style={{ marginBottom: 12 }}><Button onClick={() => setMegaCustomerId(dossier.account.id)}><UsersRound size={15} /> Ouvrir Mega Dossier 360</Button></div>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Nom</label><input className={styles.textField} value={editName} onChange={(event) => setEditName(event.target.value)} /></div>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Email</label><input className={styles.textField} value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></div>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Téléphone</label><input className={styles.textField} value={editPhone} onChange={(event) => setEditPhone(event.target.value)} /></div>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Statut</label><select className={styles.selectField} value={editStatus} onChange={(event) => setEditStatus(event.target.value)}><option value="active">Actif</option><option value="restricted">Restreint</option><option value="suspended">Suspendu</option><option value="closed">Fermé</option></select></div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}><input type="checkbox" checked={editPremium} onChange={(event) => setEditPremium(event.target.checked)} /> Statut premium</label>
                  <div className={styles.pageActions}><Button disabled={busy} onClick={() => void saveCustomer()}><Save size={15} /> Enregistrer</Button></div>
                </div>
              </Card>

              {dossier.family ? (
                <Card title="Dossier famille" subtitle="Le dossier famille est une extension opérateur du client.">
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Ville</label><input className={styles.textField} value={familyCity} onChange={(event) => setFamilyCity(event.target.value)} /></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Consentement</label><select className={styles.selectField} value={familyConsent} onChange={(event) => setFamilyConsent(event.target.value)}><option value="pending">En attente</option><option value="granted">Accordé</option><option value="withdrawn">Retiré</option></select></div>
                    <div className={styles.pageActions}><Button disabled={busy} onClick={() => void saveFamily()}><Save size={15} /> Enregistrer famille</Button></div>
                  </div>
                  <div className={styles.detailMeta} style={{ marginTop: 16 }}>
                    <div><span className={styles.metricLabel}>Référence</span><strong>{rowText(dossier.family, 'public_reference')}</strong></div>
                    <div><span className={styles.metricLabel}>Onboarding</span><strong>{rowText(dossier.family, 'onboarding_status')}</strong></div>
                    <div><span className={styles.metricLabel}>Statut</span><strong>{rowText(dossier.family, 'status')}</strong></div>
                  </div>
                </Card>
              ) : null}

              {dossier.family ? (
                <Card title="Parents & responsables" subtitle="Plusieurs responsables réels peuvent être associés au même dossier famille.">
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Nom complet</label><input className={styles.textField} value={guardianName} onChange={(event) => setGuardianName(event.target.value)} /></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Relation</label><select className={styles.selectField} value={guardianRelation} onChange={(event) => setGuardianRelation(event.target.value)}><option value="parent">Parent</option><option value="mother">Mère</option><option value="father">Père</option><option value="guardian">Tuteur</option><option value="relative">Proche autorisé</option></select></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Email</label><input className={styles.textField} value={guardianEmail} onChange={(event) => setGuardianEmail(event.target.value)} /></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Téléphone</label><input className={styles.textField} value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} /></div>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}><input type="checkbox" checked={guardianPrimary} onChange={(event) => setGuardianPrimary(event.target.checked)} /> Responsable principal</label>
                    <div className={styles.pageActions}><Button disabled={busy || !guardianName} onClick={() => void addGuardian()}><UserRound size={15} /> Ajouter responsable</Button></div>
                  </div>
                  <div className={styles.list} style={{ marginTop: 14 }}>
                    {guardians.map((guardian) => { const active = rowText(guardian, 'status') !== 'archived'; return <div className={styles.listItem} key={rowText(guardian, 'id')}><UserRound size={16} /><div className={styles.listItemContent}><strong>{rowText(guardian, 'full_name')} · {rowText(guardian, 'relationship')}</strong><p>{rowText(guardian, 'email') || 'Sans email'} · {rowText(guardian, 'phone') || 'Sans téléphone'} {rowText(guardian, 'is_primary') === 'true' ? '· Principal' : ''} · {active ? 'Actif' : 'Archivé'}</p></div><Button variant={active ? 'quiet' : 'secondary'} disabled={busy} onClick={() => void setGuardianStatus(guardian, active ? 'archived' : 'active')}>{active ? 'Archiver' : 'Restaurer'}</Button></div>})}
                    {!guardians.length ? <div className={styles.tableSecondary}>Aucun responsable secondaire enregistré.</div> : null}
                  </div>
                </Card>
              ) : null}

              <Card title="Adresses" subtitle="Création et contrôle des adresses utilisées par le commerce.">
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Libellé</label><input className={styles.textField} value={addressLabel} onChange={(event) => setAddressLabel(event.target.value)} placeholder="Domicile" /></div>
                  <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Ville</label><input className={styles.textField} value={addressCity} onChange={(event) => setAddressCity(event.target.value)} /></div>
                  <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}><label className={styles.fieldLabel}>Adresse</label><input className={styles.textField} value={addressLine} onChange={(event) => setAddressLine(event.target.value)} /></div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}><input type="checkbox" checked={addressDefault} onChange={(event) => setAddressDefault(event.target.checked)} /> Adresse par défaut</label>
                  <div className={styles.pageActions}><Button disabled={busy || !addressCity || !addressLine} onClick={() => void addAddress()}><Home size={15} /> Ajouter</Button></div>
                </div>
                <div className={styles.list} style={{ marginTop: 14 }}>
                  {dossier.addresses.map((address) => { const active = rowText(address, 'status') !== 'archived'; return <div className={styles.listItem} key={rowText(address, 'id')}><Home size={16} /><div className={styles.listItemContent}><strong>{rowText(address, 'label') || rowText(address, 'address_type')} · {rowText(address, 'city')}</strong><p>{rowText(address, 'address_line')} {rowText(address, 'is_default') === 'true' ? '· Par défaut' : ''} · {active ? 'Active' : 'Archivée'}</p></div><Button variant={active ? 'quiet' : 'secondary'} disabled={busy} onClick={() => void setAddressStatus(address, active ? 'archived' : 'active')}>{active ? 'Archiver' : 'Restaurer'}</Button></div>})}
                  {!dossier.addresses.length ? <div className={styles.tableSecondary}>Aucune adresse enregistrée.</div> : null}
                </div>
              </Card>

              {dossier.family ? (
                <Card title="Enfants" subtitle="Profils enfants directement gérables depuis le dossier famille.">
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Prénom</label><input className={styles.textField} value={childName} onChange={(event) => setChildName(event.target.value)} /></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Date de naissance</label><input className={styles.textField} type="date" value={childBirthDate} onChange={(event) => setChildBirthDate(event.target.value)} /></div>
                    <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Tranche d’âge</label><input className={styles.textField} value={childAgeGroup} onChange={(event) => setChildAgeGroup(event.target.value)} /></div>
                    <div className={styles.pageActions}><Button disabled={busy || !childName || !childBirthDate} onClick={() => void addChild()}><Baby size={15} /> Ajouter enfant</Button></div>
                  </div>
                  <div className={styles.tableWrap} style={{ marginTop: 14 }}>
                    <table className={styles.table}><thead><tr><th>Enfant</th><th>Naissance</th><th>Âge</th><th>Statut</th><th>Action</th></tr></thead><tbody>{dossier.children.map((child) => { const active = rowText(child, 'status') !== 'archived'; return <tr key={rowText(child, 'id')}><td><strong>{rowText(child, 'first_name')}</strong></td><td>{rowText(child, 'birth_date')}</td><td>{rowText(child, 'age_group')}</td><td><StatusChip status={rowText(child, 'status') || 'active'} /></td><td><Button variant={active ? 'quiet' : 'secondary'} disabled={busy} onClick={() => void setChildStatus(child, active ? 'archived' : 'active')}>{active ? 'Archiver' : 'Restaurer'}</Button></td></tr>})}</tbody></table>
                  </div>
                </Card>
              ) : null}

              <Card title="Commerce lié" subtitle="Les objets réels qui appartiennent à ce client.">
                <div className={styles.list}>
                  {dossier.orders.map((order) => <div className={styles.listItem} key={rowText(order, 'id')}><CreditCard size={16} /><div className={styles.listItemContent}><strong>{rowText(order, 'title') || rowText(order, 'public_reference')}</strong><p>{rowText(order, 'public_reference')} · {rowText(order, 'journey_type')} · {rowText(order, 'status')} · mis à jour {formatDate(rowText(order, 'updated_at'))}</p></div></div>)}
                  {!dossier.orders.length ? <div className={styles.tableSecondary}>Aucune commande reliée.</div> : null}
                </div>
              </Card>

              <Card title="Paiements" subtitle="Registre financier du client. Les écritures ne sont pas éditées comme de simples lignes.">
                <div className={styles.list}>
                  {dossier.payments.map((payment) => <div className={styles.listItem} key={rowText(payment, 'id')}><WalletCards size={16} /><div className={styles.listItemContent}><strong>{rowText(payment, 'public_reference')} · {money(payment.expected_amount)}</strong><p>{rowText(payment, 'status')} · {rowText(payment, 'selected_method') || 'Méthode non définie'} · capturé {money(payment.captured_amount)}</p></div></div>)}
                  {!dossier.payments.length ? <div className={styles.tableSecondary}>Aucun paiement enregistré.</div> : null}
                </div>
              </Card>
            </>
          ) : (
            <StatePanel type="empty" title="Sélectionnez un client" text="Le panneau de droite devient le dossier opérateur complet du client sélectionné." />
          )}
        </div>
      </div>
    </div>
      {megaCustomerId ? <CustomerMegaDossierOverlay customerId={megaCustomerId} onClose={() => setMegaCustomerId(null)} /> : null}
    </>
  )
}
