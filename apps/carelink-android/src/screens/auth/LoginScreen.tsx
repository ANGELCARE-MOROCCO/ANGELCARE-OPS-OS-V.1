import React, {useMemo, useState} from 'react'
import {Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import {AppShell} from '../../ui/AppShell'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {MetricCard} from '../../ui/MetricCard'
import {StatusPill} from '../../ui/StatusPill'
import type {BackendHealth} from '../../types/runtime'
import {EmptyState} from '../../ui/EmptyState'

const logo = require('../../assets/angelcare-logo.png')

export function LoginScreen({
  backendHealth,
  onLogin,
  onCheckHealth,
  onEnterDemo,
  busy,
}: {
  backendHealth: BackendHealth
  onLogin: (identifier: string, password: string) => Promise<void>
  onCheckHealth: () => Promise<void>
  onEnterDemo: () => void
  busy: boolean
}) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [localBusy, setLocalBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  async function submit() {
    const cleanIdentifier = identifier.trim()
    if (!cleanIdentifier || !password.trim()) {
      setError('Veuillez saisir l’identifiant et le mot de passe.')
      return
    }

    setError(null)
    setLocalBusy(true)
    try {
      await onLogin(cleanIdentifier, password)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Connexion refusée par le backend.')
    } finally {
      setLocalBusy(false)
    }
  }

  return (
    <AppShell inverse>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.page}>
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={[CareLinkType.heroKicker, styles.kicker]}>ANGELCARE CARELINK</Text>
            <Text style={[CareLinkType.heroTitle, styles.title]}>Connexion agent mobile</Text>
            <Text style={[CareLinkType.heroBody, styles.body]}>
              Accès sécurisé au cockpit CareLink terrain, avec backend OPS, contrôle d’accès et synchronisation mobile.
            </Text>

            <View style={styles.healthRow}>
              <StatusPill label={backendHealth.state === 'online' ? 'Backend live' : backendHealth.state === 'offline' ? 'Backend offline' : 'Backend vérifié'} tone={backendHealth.state === 'online' ? 'emerald' : backendHealth.state === 'offline' ? 'rose' : 'slate'} />
              <Text style={styles.healthText}>{backendHealth.label}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Card style={styles.formCard}>
            <Text style={CareLinkType.cardTitle}>Connexion CareLink</Text>
            <Text style={CareLinkType.caption}>Utilisez votre identifiant ou votre email approuvé par OPS.</Text>

            <Text style={styles.inputLabel}>Identifiant / email</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="agent@angelcare.ma"
              placeholderTextColor={CareLinkColors.textSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={CareLinkColors.textSoft}
              secureTextEntry
              style={styles.input}
            />

            <Button label="Se connecter" onPress={submit} loading={busy || localBusy} />

            <View style={styles.actionRow}>
              <Pressable onPress={onCheckHealth} style={({pressed}) => [styles.ghostAction, pressed && styles.pressed]}>
                <Text style={styles.ghostLabel}>Tester le backend</Text>
              </Pressable>
              <Pressable onPress={onEnterDemo} style={({pressed}) => [styles.ghostAction, pressed && styles.pressed]}>
                <Text style={styles.ghostLabel}>Mode aperçu</Text>
              </Pressable>
            </View>
          </Card>

          <View style={styles.metricsRow}>
            <MetricCard label="SYNC" value={backendHealth.state === 'online' ? 'Prêt' : 'Attente'} detail={todayLabel} tone={backendHealth.state === 'online' ? 'emerald' : 'amber'} />
            <MetricCard label="SÉCURITÉ" value="Ops" detail="Contrôle d’accès mobile" tone="slate" />
          </View>

          <EmptyState
            title="Phase 1"
            body="La fondation native est posée. Les modules métier seront branchés étape par étape sans changer la structure approuvée."
          />
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    padding: CareLinkSpace.lg,
    gap: CareLinkSpace.lg,
  },
  hero: {
    borderRadius: CareLinkRadius.xxl,
    backgroundColor: CareLinkColors.surfaceInverse,
    padding: CareLinkSpace.xl,
    gap: CareLinkSpace.md,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CareLinkColors.surface,
  },
  logo: {
    width: 78,
    height: 78,
  },
  kicker: {
    color: '#93c5fd',
  },
  title: {
    marginTop: 2,
  },
  body: {
    marginTop: -2,
  },
  healthRow: {
    marginTop: CareLinkSpace.xs,
    gap: CareLinkSpace.sm,
  },
  healthText: {
    color: '#dbeafe',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  error: {
    borderRadius: CareLinkRadius.lg,
    padding: CareLinkSpace.md,
    backgroundColor: CareLinkColors.dangerBg,
    color: CareLinkColors.rose,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  formCard: {
    gap: CareLinkSpace.sm,
  },
  inputLabel: {
    marginTop: CareLinkSpace.sm,
    color: CareLinkColors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 56,
    borderRadius: CareLinkRadius.lg,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    backgroundColor: CareLinkColors.surfaceMuted,
    paddingHorizontal: CareLinkSpace.lg,
    color: CareLinkColors.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
  },
  ghostAction: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.backgroundSoft,
    borderWidth: 1,
    borderColor: '#d7e4ff',
  },
  ghostLabel: {
    color: CareLinkColors.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.92,
    transform: [{scale: 0.99}],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
  },
})
