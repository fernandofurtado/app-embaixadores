/**
 * ═══════════════════════════════════════════════════════════════
 *  Register Screen — Multi-field registration with LGPD consents
 *  PRD §8.1: Consentimento granular no cadastro
 * ═══════════════════════════════════════════════════════════════
 */

import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // LGPD Consents (PRD §8.1)
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentCommunication, setConsentCommunication] = useState(false);
  const [consentPublicRanking, setConsentPublicRanking] = useState(false);

  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (!consentDataProcessing) {
      Alert.alert(
        'Consentimento Necessário',
        'Para criar sua conta, é obrigatório aceitar o tratamento de dados pessoais conforme a LGPD.'
      );
      return;
    }
    try {
      await register({
        full_name: fullName,
        email,
        password,
        phone: phone || undefined,
        referral_code: referralCode || undefined,
        consents: [
          { consent_type: 'data_processing', accepted: consentDataProcessing },
          { consent_type: 'communication', accepted: consentCommunication },
          { consent_type: 'public_ranking', accepted: consentPublicRanking },
        ],
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha no cadastro');
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    optional,
  }: any) => (
    <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
        {optional && (
          <Text style={[Typography.caption2, { color: theme.textTertiary }]}>Opcional</Text>
        )}
      </View>
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
    </View>
  );

  const ConsentCheckbox = ({
    checked,
    onToggle,
    label,
    sublabel,
    required,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
    sublabel?: string;
    required?: boolean;
  }) => (
    <Pressable
      style={[styles.consentRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onToggle}
    >
      <View style={[
        styles.checkbox,
        { borderColor: checked ? Colors.primary : theme.textTertiary },
        checked && { backgroundColor: Colors.primary },
      ]}>
        {checked && <MaterialIcons name="check" size={14} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.subhead, { color: theme.text }]}>
          {label}
          {required && <Text style={{ color: Colors.danger }}> *</Text>}
        </Text>
        {sublabel && (
          <Text style={[Typography.caption2, { color: theme.textTertiary, marginTop: 2 }]}>
            {sublabel}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ HEADER ═══ */}
        <View style={styles.header}>
          <Text style={[Typography.largeTitle, { color: theme.text }]}>Criar Conta</Text>
          <Text style={[Typography.subhead, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
            Junte-se à Rede de Embaixadores e faça a diferença
          </Text>
        </View>

        {/* ═══ FORM ═══ */}
        <View style={styles.form}>
          <InputField
            label="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Maria da Silva"
          />
          <InputField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="maria@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            optional
          />
          <InputField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />
          <InputField
            label="Confirmar Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repita a senha"
            secureTextEntry
          />
          <InputField
            label="Código de Indicação"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Ex: ABC12345"
            autoCapitalize="characters"
            optional
          />

          {/* ═══ LGPD CONSENTS (PRD §8.1) ═══ */}
          <View style={styles.consentSection}>
            <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.sm }]}>
              Consentimentos (LGPD)
            </Text>
            <ConsentCheckbox
              checked={consentDataProcessing}
              onToggle={() => setConsentDataProcessing(!consentDataProcessing)}
              label="Tratamento de dados pessoais"
              sublabel="Necessário para o funcionamento do app"
              required
            />
            <ConsentCheckbox
              checked={consentCommunication}
              onToggle={() => setConsentCommunication(!consentCommunication)}
              label="Receber comunicações da campanha"
              sublabel="Notificações, e-mails e atualizações"
            />
            <ConsentCheckbox
              checked={consentPublicRanking}
              onToggle={() => setConsentPublicRanking(!consentPublicRanking)}
              label="Exibir meu nome no ranking público"
              sublabel="Outros participantes poderão ver sua posição"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: Colors.primary, opacity: pressed ? 0.85 : 1 },
              isLoading && styles.buttonDisabled,
              !consentDataProcessing && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading || !consentDataProcessing}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Criar Conta</Text>
            )}
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://embaixadores.app/privacidade')}>
            <Text style={[Typography.caption1, { color: Colors.primary, textAlign: 'center', marginTop: Spacing.sm, textDecorationLine: 'underline' }]}>
              Política de Privacidade
            </Text>
          </Pressable>
          <Text style={[Typography.caption2, { color: theme.textTertiary, textAlign: 'center', marginTop: Spacing.xs }]}>
            Ao criar sua conta, você concorda com os Termos de Uso.
          </Text>
        </View>

        {/* ═══ LOGIN LINK ═══ */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Text style={[Typography.subhead, { color: theme.textSecondary }]}>Já tem conta? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[Typography.subhead, { color: Colors.primary, fontWeight: '600' }]}>Entrar</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  header: { marginBottom: Spacing['2xl'] },
  form: { gap: Spacing.base },
  inputContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabel: { ...Typography.caption1, marginBottom: Spacing.xs },
  input: { ...Typography.body, paddingVertical: Spacing.xs },
  consentSection: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.headline, color: '#FFFFFF' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
});
