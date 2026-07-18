import React, {useMemo, useState} from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import {AppShell} from '../../ui/AppShell'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {MetricCard} from '../../ui/MetricCard'
import {StatusPill} from '../../ui/StatusPill'
import type {BackendHealth} from '../../types/runtime'

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

  const backendOnline = backendHealth.state === 'online'
  const locked = busy || localBusy

  async function submit() {
    const cleanIdentifier = identifier.trim()

    if (!cleanIdentifier || !password.trim()) {
      setError('Veuillez saisir votre identifiant CareLink et votre mot de passe.')
      return
    }

    setError(null)
    setLocalBusy(true)

    try {
      await onLogin(cleanIdentifier, password)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Connexion refusée par le backend AngelCare OPS.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function checkHealth() {
    setError(null)
    try {
      await onCheckHealth()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Impossible de vérifier le serveur OPS.')
    }
  }

  return (
    <AppShell inverse>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.logoBox}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={styles.heroStatus}>
                <StatusPill
                  label={backendOnline ? 'Backend live' : backendHealth.state === 'offline' ? 'Backend offline' : 'Serveur à vérifier'}
                  tone={backendOnline ? 'emerald' : backendHealth.state === 'offline' ? 'rose' : 'amber'}
                />
                <Text style={styles.privateLabel}>Accès agent privé</Text>
              </View>
            </View>

            <Text style={[CareLinkType.heroKicker, styles.kicker]}>ANGELCARE CARELINK</Text>
            <Text style={styles.heroTitle}>Connexion mobile terrain</Text>
            <Text style={styles.heroBody}>
              Espace sécurisé pour consulter les missions, recevoir les instructions OPS, échanger avec l’équipe,
              confirmer la disponibilité et synchroniser les actions terrain.
            </Text>

            <View style={styles.heroStrip}>
              <View style={styles.heroMiniCard}>
                <Text style={styles.heroMiniValue}>OPS</Text>
                <Text style={styles.heroMiniLabel}>Serveur central</Text>
              </View>
              <View style={styles.heroMiniCard}>
                <Text style={styles.heroMiniValue}>SYNC</Text>
                <Text style={styles.heroMiniLabel}>Données live</Text>
              </View>
            </View>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formTitleBlock}>
                <Text style={CareLinkType.cardTitle}>Identification CareLink</Text>
                <Text style={styles.formSubtitle}>
                  Utilisez uniquement l’identifiant ou l’email mobile transmis par l’administration AngelCare.
                </Text>
              </View>

              <View style={styles.secureBadge}>
                <Text style={styles.secureBadgeText}>SÉCURISÉ</Text>
              </View>
            </View>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>Avant de commencer</Text>
              <Text style={styles.instructionBody}>
                Si votre accès ne fonctionne pas, ne créez pas un nouveau compte. Demandez au superviseur de vérifier
                l’activation mobile, le statut du compte et l’autorisation CareLink.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Connexion non finalisée</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Identifiant ou email</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="ex: agent@angelcare.ma ou alias agent"
              placeholderTextColor={CareLinkColors.textSoft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Saisir le mot de passe"
              placeholderTextColor={CareLinkColors.textSoft}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
              style={styles.input}
            />

            <Button label="Ouvrir CareLink" onPress={submit} loading={locked} disabled={locked} />

            <View style={styles.actionRow}>
              <Pressable
                disabled={locked}
                onPress={checkHealth}
                style={({pressed}) => [styles.secondaryAction, pressed && styles.pressed, locked && styles.disabled]}>
                <Text style={styles.secondaryLabel}>Tester serveur</Text>
              </Pressable>

              <Pressable
                disabled={locked}
                onPress={onEnterDemo}
                style={({pressed}) => [styles.secondaryAction, pressed && styles.pressed, locked && styles.disabled]}>
                <Text style={styles.secondaryLabel}>Aperçu interne</Text>
              </Pressable>
            </View>
          </Card>

          <View style={styles.metricsRow}>
            <MetricCard
              label="ÉTAT"
              value={backendOnline ? 'Prêt' : 'Attente'}
              detail={backendHealth.label || 'Vérification backend OPS'}
              tone={backendOnline ? 'emerald' : 'amber'}
            />
            <MetricCard label="DATE" value="Jour" detail={todayLabel} tone="slate" />
          </View>

          <Card style={styles.processCard}>
            <Text style={styles.processTitle}>Processus d’accès CareLink</Text>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>01</Text>
              <Text style={styles.stepText}>L’administration active votre compte mobile CareLink.</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>02</Text>
              <Text style={styles.stepText}>Vous recevez votre identifiant et votre mot de passe.</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>03</Text>
              <Text style={styles.stepText}>L’application se synchronise avec le serveur OPS AngelCare.</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepIndex}>04</Text>
              <Text style={styles.stepText}>Vos missions, messages et notifications deviennent disponibles.</Text>
            </View>
          </Card>

          <Text style={styles.footerNote}>ANGELCARE OPS · CareLink Mobile Native</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: CareLinkSpace.lg,
    paddingBottom: 56,
    gap: CareLinkSpace.lg,
  },
  hero: {
    borderRadius: 36,
    backgroundColor: CareLinkColors.surfaceInverse,
    padding: CareLinkSpace.xl,
    gap: CareLinkSpace.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: CareLinkSpace.md,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CareLinkColors.surface,
  },
  logo: {
    width: 72,
    height: 72,
  },
  heroStatus: {
    alignItems: 'flex-end',
    gap: CareLinkSpace.xs,
    maxWidth: 178,
  },
  privateLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  kicker: {
    color: '#93c5fd',
    marginTop: CareLinkSpace.xs,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  heroBody: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  heroStrip: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
    marginTop: CareLinkSpace.xs,
  },
  heroMiniCard: {
    flex: 1,
    borderRadius: CareLinkRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    padding: CareLinkSpace.md,
  },
  heroMiniValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  heroMiniLabel: {
    marginTop: 3,
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: '800',
  },
  formCard: {
    gap: CareLinkSpace.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: CareLinkSpace.md,
  },
  formTitleBlock: {
    flex: 1,
  },
  formSubtitle: {
    marginTop: 6,
    color: CareLinkColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  secureBadge: {
    borderRadius: CareLinkRadius.pill,
    backgroundColor: CareLinkColors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secureBadgeText: {
    color: CareLinkColors.emerald,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  instructionBox: {
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.backgroundSoft,
    borderWidth: 1,
    borderColor: '#d7e4ff',
    padding: CareLinkSpace.md,
  },
  instructionTitle: {
    color: CareLinkColors.textStrong,
    fontSize: 13,
    fontWeight: '900',
  },
  instructionBody: {
    marginTop: 5,
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.dangerBg,
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: CareLinkSpace.md,
  },
  errorTitle: {
    color: CareLinkColors.rose,
    fontSize: 13,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 4,
    color: CareLinkColors.rose,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  inputLabel: {
    color: CareLinkColors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 58,
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.surfaceMuted,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    paddingHorizontal: CareLinkSpace.lg,
    color: CareLinkColors.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: CareLinkRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CareLinkColors.backgroundSoft,
    borderWidth: 1,
    borderColor: '#d7e4ff',
  },
  secondaryLabel: {
    color: CareLinkColors.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
  },
  processCard: {
    gap: CareLinkSpace.sm,
  },
  processTitle: {
    color: CareLinkColors.textStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  step: {
    flexDirection: 'row',
    gap: CareLinkSpace.sm,
    alignItems: 'flex-start',
    borderRadius: CareLinkRadius.md,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.md,
  },
  stepIndex: {
    color: CareLinkColors.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stepText: {
    flex: 1,
    color: CareLinkColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{scale: 0.99}],
  },
  disabled: {
    opacity: 0.55,
  },
  footerNote: {
    textAlign: 'center',
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingBottom: CareLinkSpace.sm,
  },
})
