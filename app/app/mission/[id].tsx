/**
 * ═══════════════════════════════════════════════════════════════
 *  Mission Detail Screen — Full state machine workflow
 *  PRD §4.2: Start → Submit (evidence) → Ver status
 *  PRD §6.2: Animação de pontos ao completar
 * ═══════════════════════════════════════════════════════════════
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { useMissionStore } from '../../stores/missionStore';
import api from '../../services/api';
import type { Mission, UserMission, UserMissionStatus } from '../../services/types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const STATUS_META: Record<string, { color: string; icon: IconName; label: string; description: string }> = {
  AVAILABLE: { color: Colors.primary, icon: 'play-circle-outline', label: 'Disponível', description: 'Inicie esta missão para começar' },
  IN_PROGRESS: { color: Colors.warning, icon: 'hourglass-top', label: 'Em Progresso', description: 'Complete as atividades e envie' },
  SUBMITTED: { color: Colors.info, icon: 'pending', label: 'Enviada', description: 'Aguardando análise da equipe' },
  VALIDATED: { color: Colors.success, icon: 'verified', label: 'Validada', description: 'Sua submissão foi aprovada!' },
  REJECTED: { color: Colors.danger, icon: 'cancel', label: 'Rejeitada', description: 'Sua submissão foi rejeitada' },
  COMPLETED: { color: Colors.success, icon: 'check-circle', label: 'Concluída', description: 'Missão completada com sucesso!' },
};

const RECURRENCE_LABELS: Record<string, string> = {
  ONE_TIME: 'Única',
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  PER_EVENT: 'Por Evento',
};

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { myMissions, startMission, submitMission } = useMissionStore();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [showEvidence, setShowEvidence] = useState(false);

  // Points animation
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const [showPointsAward, setShowPointsAward] = useState(false);

  useEffect(() => {
    loadMission();
  }, [id]);

  const loadMission = async () => {
    try {
      const data = await api.getMission(id!);
      setMission(data);
    } catch { /* placeholder */ }
    setLoading(false);
  };

  // Find this mission in user's missions
  const userMission = myMissions.find((um) => um.mission_id === id);
  const currentStatus: UserMissionStatus = userMission?.status || 'AVAILABLE';
  const statusMeta = STATUS_META[currentStatus] || STATUS_META.AVAILABLE;

  const showPointsAnimation = (points: number) => {
    setShowPointsAward(true);
    pointsAnim.setValue(0);
    Animated.sequence([
      Animated.spring(pointsAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 100 }),
      Animated.delay(1500),
      Animated.timing(pointsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowPointsAward(false));
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startMission(id!);
      Alert.alert('Missão Iniciada!', 'Boa sorte! Complete as atividades para ganhar pontos.');
      loadMission();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
    setActionLoading(false);
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const result = await submitMission(id!, evidenceUrl || undefined);
      if (result.status === 'COMPLETED') {
        showPointsAnimation(mission?.points_reward || 0);
        Alert.alert('Missão Completada! 🎉', `Você ganhou ${mission?.points_reward || 0} pontos!`);
      } else {
        Alert.alert('Enviado ✓', 'Sua submissão será analisada pela equipe.');
      }
      setShowEvidence(false);
      setEvidenceUrl('');
      loadMission();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!mission) return null;

  const recurrenceLabel = RECURRENCE_LABELS[mission.recurrence] || mission.recurrence;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }}
      >
        {/* ═══ STATUS BANNER ═══ */}
        {currentStatus !== 'AVAILABLE' && (
          <View style={[styles.statusBanner, { backgroundColor: statusMeta.color + '15', borderLeftColor: statusMeta.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <MaterialIcons name={statusMeta.icon} size={20} color={statusMeta.color} />
              <Text style={[Typography.headline, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
            <Text style={[Typography.caption1, { color: statusMeta.color, marginTop: 2 }]}>
              {statusMeta.description}
            </Text>
            {userMission && (
              <View style={styles.progressRow}>
                <Text style={[Typography.caption2, { color: theme.textSecondary }]}>
                  Progresso: {userMission.current_count}/{mission.required_count}
                </Text>
                <View style={[styles.miniProgressBar, { backgroundColor: theme.surfaceElevated }]}>
                  <View style={[styles.miniProgressFill, {
                    width: `${Math.min((userMission.current_count / mission.required_count) * 100, 100)}%`,
                    backgroundColor: statusMeta.color,
                  }]} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ═══ REJECTION REASON ═══ */}
        {currentStatus === 'REJECTED' && userMission?.rejected_reason && (
          <View style={[styles.rejectedCard, { backgroundColor: Colors.danger + '10' }]}>
            <MaterialIcons name="info" size={18} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.headline, { color: Colors.danger }]}>Motivo da rejeição</Text>
              <Text style={[Typography.body, { color: theme.text, marginTop: Spacing.xs }]}>
                {userMission.rejected_reason}
              </Text>
            </View>
          </View>
        )}

        {/* ═══ HEADER ═══ */}
        <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.lg]}>
          {mission.is_featured && (
            <View style={[styles.featuredBadge, { backgroundColor: Colors.warning + '20' }]}>
              <Text style={[Typography.caption1, { color: Colors.warning, fontWeight: '700' }]}><MaterialIcons name="star" size={12} color={Colors.warning} /> DESTAQUE</Text>
            </View>
          )}
          <Text style={[Typography.title1, { color: theme.text }]}>{mission.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: Colors.success + '15' }]}>
              <Text style={[Typography.headline, { color: Colors.success }]}>+{mission.points_reward} pts</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: theme.surfaceElevated }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name={mission.recurrence !== 'ONE_TIME' ? 'loop' : 'check-circle'} size={14} color={theme.textSecondary} />
                <Text style={[Typography.caption1, { color: theme.textSecondary }]}>
                  {recurrenceLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ DESCRIPTION ═══ */}
        <View style={[styles.section, { backgroundColor: theme.surface }, Shadows.sm]}>
          <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.sm }]}>Descrição</Text>
          <Text style={[Typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>
            {mission.description}
          </Text>
        </View>

        {/* ═══ DETAILS ═══ */}
        <View style={[styles.section, { backgroundColor: theme.surface }, Shadows.sm]}>
          <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.base }]}>Detalhes</Text>
          <DetailRow theme={theme} label="Contagem necessária" value={`${mission.required_count}x`} />
          <DetailRow theme={theme} label="Verificação" value={mission.requires_verification ? 'Necessária' : 'Automática'} />
          <DetailRow theme={theme} label="Recorrência" value={recurrenceLabel} />
          {mission.category && (
            <DetailRow theme={theme} label="Categoria" value={`${mission.category.icon || ''} ${mission.category.name}`} />
          )}
        </View>

        {/* ═══ EVIDENCE FORM (for submit) ═══ */}
        {showEvidence && (
          <View style={[styles.section, { backgroundColor: theme.surface }, Shadows.sm]}>
            <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.sm }]}>Evidência</Text>
            <Text style={[Typography.caption1, { color: theme.textSecondary, marginBottom: Spacing.sm }]}>
              Adicione um link para sua evidência (foto, documento ou URL)
            </Text>
            <TextInput
              style={[styles.evidenceInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              value={evidenceUrl}
              onChangeText={setEvidenceUrl}
              placeholder="https://..."
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        )}

        {/* ═══ CTA ═══ */}
        <View style={styles.ctaContainer}>
          {currentStatus === 'AVAILABLE' && (
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: Colors.primary, opacity: pressed ? 0.85 : 1 },
                actionLoading && { opacity: 0.6 },
              ]}
              onPress={handleStart}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <MaterialIcons name="rocket-launch" size={18} color="#fff" />
                  <Text style={styles.ctaText}>Iniciar Missão</Text>
                </View>
              )}
            </Pressable>
          )}

          {(currentStatus === 'IN_PROGRESS' || currentStatus === 'REJECTED') && !showEvidence && (
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: Colors.success, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                if (mission.requires_verification) {
                  setShowEvidence(true);
                } else {
                  handleSubmit();
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text style={styles.ctaText}>
                  {currentStatus === 'REJECTED' ? 'Re-submeter' : 'Submeter Missão'}
                </Text>
              </View>
            </Pressable>
          )}

          {showEvidence && (
            <View style={{ gap: Spacing.sm }}>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: Colors.success, opacity: pressed ? 0.85 : 1 },
                  actionLoading && { opacity: 0.6 },
                ]}
                onPress={handleSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <MaterialIcons name="check" size={18} color="#fff" />
                    <Text style={styles.ctaText}>Enviar Submissão</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaButton,
                  { backgroundColor: theme.surfaceElevated, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => { setShowEvidence(false); setEvidenceUrl(''); }}
              >
                <Text style={[Typography.headline, { color: theme.text }]}>Cancelar</Text>
              </Pressable>
            </View>
          )}

          {currentStatus === 'SUBMITTED' && (
            <View style={[styles.infoCard, { backgroundColor: Colors.info + '15' }]}>
              <MaterialIcons name="schedule" size={20} color={Colors.info} />
              <Text style={[Typography.subhead, { color: Colors.info }]}>
                Sua submissão está sendo analisada. Você será notificado quando houver uma resposta.
              </Text>
            </View>
          )}

          {currentStatus === 'COMPLETED' && (
            <View style={[styles.infoCard, { backgroundColor: Colors.success + '15' }]}>
              <MaterialIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={[Typography.subhead, { color: Colors.success }]}>
                Missão completada! +{mission.points_reward} pontos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ═══ POINTS ANIMATION OVERLAY ═══ */}
      {showPointsAward && (
        <Animated.View
          style={[
            styles.pointsOverlay,
            {
              opacity: pointsAnim,
              transform: [
                { scale: pointsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { translateY: pointsAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.pointsAwardCard}>
            <MaterialIcons name="star" size={48} color={Colors.warning} />
            <Text style={[Typography.largeTitle, { color: Colors.success }]}>
              +{mission?.points_reward} pts!
            </Text>
            <Text style={[Typography.headline, { color: '#fff' }]}>Parabéns! 🎉</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function DetailRow({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[Typography.subhead, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[Typography.subhead, { color: theme.text, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.base,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  rejectedCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  header: {
    marginHorizontal: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  metaBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  section: {
    marginHorizontal: Spacing.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  evidenceInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  ctaContainer: { paddingHorizontal: Spacing.base, marginTop: Spacing.base },
  ctaButton: {
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    ...Shadows.md,
  },
  ctaText: { ...Typography.headline, color: '#fff' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  pointsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pointsAwardCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
});
