import React, {useState} from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type {BackendHealth} from '../../types/runtime'

const logo = require('../../assets/angelcare-logo.png')

type LoginScreenProps = {
  backendHealth: BackendHealth
  onLogin: (identifier: string, password: string) => Promise<void>
  onCheckHealth: () => Promise<void>
  onEnterDemo: () => void
  busy: boolean
}

const ADMIN_PHONE_DISPLAY = '+212 5 37 58 14 62'
const ADMIN_PHONE_TEL = '+212537581462'
const WHATSAPP_PHONE = '212723211143'

export function LoginScreen({onLogin, busy}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [localBusy, setLocalBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locked = busy || localBusy

  async function submit() {
    const cleanIdentifier = identifier.trim()

    if (!cleanIdentifier || !password.trim()) {
      setError('Veuillez saisir votre email CareLink et votre mot de passe.')
      return
    }

    setError(null)
    setLocalBusy(true)

    try {
      await onLogin(cleanIdentifier, password)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Connexion refusée. Veuillez vérifier vos accès.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function callAdmin() {
    try {
      await Linking.openURL(`tel:${ADMIN_PHONE_TEL}`)
    } catch {
      Alert.alert('Appel indisponible', `Veuillez appeler ANGELCARE Admin: ${ADMIN_PHONE_DISPLAY}`)
    }
  }

  async function openWhatsApp() {
    const text = encodeURIComponent('Bonjour, j’ai besoin d’assistance pour me connecter à CareLink.')
    const url = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${text}`

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('WhatsApp indisponible', 'Veuillez contacter ANGELCARE Admin pour assistance login.')
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.sheet}>
          <View style={styles.brandCapsule}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />

            <View style={styles.brandDivider} />

            <View>
              <Text style={styles.brandTitle}>ANGELCARE</Text>
              <Text style={styles.brandSubtitle}>OPERATIONS SYSTEM</Text>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>CARELINK ANGELCARE OS</Text>
            <Text style={styles.title}>Connexion agent</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>LOGIN EMAIL</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="agent@angelcare.ma"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>MOT DE PASSE</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
              style={styles.input}
            />

            <Pressable
              disabled={locked}
              onPress={submit}
              style={({pressed}) => [styles.primaryButton, pressed && styles.pressed, locked && styles.disabled]}>
              {locked ? <ActivityIndicator color="#ffffff" /> : null}
              <Text style={styles.primaryText}>OUVRIR CARELINK</Text>
            </Pressable>
          </View>

          <Pressable onPress={callAdmin} style={({pressed}) => [styles.supportCard, pressed && styles.pressed]}>
            <View>
              <Text style={styles.supportTitle}>Appeler ANGELCARE Admin</Text>
              <Text style={styles.supportSub}>{ADMIN_PHONE_DISPLAY}</Text>
            </View>

            <View style={styles.roundIcon}>
              <Text style={styles.roundIconText}>☎</Text>
            </View>
          </Pressable>

          <Pressable onPress={openWhatsApp} style={({pressed}) => [styles.whatsappCard, pressed && styles.pressed]}>
            <View>
              <Text style={styles.whatsappTitle}>WhatsApp Support</Text>
              <Text style={styles.whatsappSub}>Assistance login</Text>
            </View>

            <View style={styles.roundIcon}>
              <Text style={styles.arrowIcon}>↗</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#edf3f8',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  sheet: {
    minHeight: '96%',
    borderRadius: 42,
    backgroundColor: '#ffffff',
    paddingHorizontal: 38,
    paddingTop: 38,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: '#e8eef5',
    shadowColor: '#0f172a',
    shadowOpacity: 0.09,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 14},
    elevation: 7,
  },
  brandCapsule: {
    alignSelf: 'center',
    minHeight: 100,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5eaf0',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 5,
  },
  logo: {
    width: 108,
    height: 54,
  },
  brandDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#e2e8f0',
  },
  brandTitle: {
    fontFamily: 'sans-serif-medium',
    color: '#070b1a',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 7,
  },
  brandSubtitle: {
    marginTop: 7,
    fontFamily: 'sans-serif-medium',
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
  },
  titleBlock: {
    marginTop: 46,
  },
  kicker: {
    fontFamily: 'sans-serif-medium',
    color: '#566176',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 6,
  },
  title: {
    marginTop: 5,
    fontFamily: 'sans-serif-medium',
    color: '#030718',
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  errorBox: {
    marginTop: 22,
    borderRadius: 20,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  errorText: {
    fontFamily: 'sans-serif-medium',
    color: '#be123c',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  form: {
    marginTop: 44,
  },
  label: {
    marginBottom: 18,
    fontFamily: 'sans-serif-medium',
    color: '#101827',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 5,
  },
  input: {
    minHeight: 84,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe5ef',
    paddingHorizontal: 24,
    color: '#0f172a',
    fontFamily: 'sans-serif',
    fontSize: 23,
    fontWeight: '600',
    marginBottom: 34,
  },
  primaryButton: {
    minHeight: 84,
    borderRadius: 24,
    backgroundColor: '#030718',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 7,
  },
  primaryText: {
    fontFamily: 'sans-serif-medium',
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 7,
  },
  supportCard: {
    marginTop: 30,
    minHeight: 94,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  supportTitle: {
    fontFamily: 'sans-serif-medium',
    color: '#101827',
    fontSize: 19,
    fontWeight: '900',
  },
  supportSub: {
    marginTop: 8,
    fontFamily: 'sans-serif-medium',
    color: '#101827',
    fontSize: 16,
    fontWeight: '900',
  },
  whatsappCard: {
    marginTop: 18,
    minHeight: 94,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  whatsappTitle: {
    fontFamily: 'sans-serif-medium',
    color: '#065f46',
    fontSize: 19,
    fontWeight: '900',
  },
  whatsappSub: {
    marginTop: 8,
    fontFamily: 'sans-serif-medium',
    color: '#047857',
    fontSize: 16,
    fontWeight: '900',
  },
  roundIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 4,
  },
  roundIconText: {
    color: '#071022',
    fontSize: 25,
    fontWeight: '900',
  },
  arrowIcon: {
    color: '#071022',
    fontSize: 32,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{scale: 0.99}],
  },
  disabled: {
    opacity: 0.65,
  },
})
