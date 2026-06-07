/**
 * ═══════════════════════════════════════════════════════════════
 *  Event Detail Screen — Check-in with code + geo
 *  PRD §4.3: Check-in = código + janela temporal + geo
 * ═══════════════════════════════════════════════════════════════
 */

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
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
import api from '../../services/api';
import type { Event as EventType } from '../../services/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Check-in modal state
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Points animation
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const [showPointsAward, setShowPointsAward] = useState(false);

  useEffect(() => { loadEvent(); }, [id]);

  const loadEvent = async () => {
    try {
      const data = await api.getEvent(id!);
      setEvent(data);
    } catch { /* placeholder */ }
    setLoading(false);
  };

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      await api.registerForEvent(id!);
      Alert.alert('Inscrição Confirmada!', 'Você está inscrito neste evento. Não esqueça de fazer check-in!');
      loadEvent();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
    setActionLoading(false);
  };

  const requestLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      // Try to use expo-location if available
      const Location = await import('expo-location').catch(() => null);
      if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } else {
          setLocationError('Permissão de localização negada. Apenas o código será usado.');
        }
      } else {
        setLocationError('Localização não disponível. Apenas o código será usado.');
      }
    } catch {
      setLocationError('Não foi possível obter sua localização. Apenas o código será usado.');
    }
    setLocationLoading(false);
  };

  const openCheckinModal = () => {
    setShowCheckinModal(true);
    setCheckinCode('');
    setUserLocation(null);
    setLocationError(null);
    requestLocation();
  };

  const handleCheckin = async () => {
    if (!checkinCode.trim()) {
      Alert.alert('Atenção', 'Informe o código do evento');
      return;
    }

    setActionLoading(true);
    try {
      const result = await api.checkinEvent(id!, {
        checkin_code: checkinCode.trim(),
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });

      setShowCheckinModal(false);

      if (result.gamification) {
        showPointsAnimation();
        Alert.alert(
          'Check-in Realizado! 🎉',
          `Presença confirmada! Você ganhou ${result.gamification.points_awarded} pontos!`
        );
      } else {
        Alert.alert('Check-in Realizado!', 'Presença confirmada!');
      }
      loadEvent();
    } catch (error: any) {
      Alert.alert('Erro no Check-in', error.message);
    }
    setActionLoading(false);
  };

  const showPointsAnimation = () => {
    setShowPointsAward(true);
    pointsAnim.setValue(0);
    Animated.sequence([
      Animated.spring(pointsAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 100 }),
      Animated.delay(1500),
      Animated.timing(pointsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowPointsAward(false));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.start_datetime);
  const now = new Date();
  const checkinStart = event.checkin_start ? new Date(event.checkin_start) : null;
  const checkinEnd = event.checkin_end ? new Date(event.checkin_end) : null;
  const isCheckinOpen = checkinStart && checkinEnd
    ? now >= checkinStart && now <= checkinEnd
    : now >= eventDate; // fallback: after event start

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }}
      >
        {/* ═══ HEADER ═══ */}
        <View style={[styles.header, { backgroundColor: Colors.primary }, Shadows.lg]}>
          <Text style={[Typography.title3, { color: 'rgba(255,255,255,0.8)' }]}>
            {eventDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
          </Text>
          <Text style={[Typography.largeTitle, { color: '#fff' }]}>
            {eventDate.getDate()} {eventDate.toLocaleDateString('pt-BR', { month: 'long' })}
          </Text>
          <Text style={[Typography.headline, { color: 'rgba(255,255,255,0.9)' }]}>
            {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* ═══ EVENT INFO ═══ */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }, Shadows.md]}>
          <Text style={[Typography.title2, { color: theme.text }]}>{event.title}</Text>
          {event.description && (
            <Text style={[Typography.body, { color: theme.textSecondary, marginTop: Spacing.sm, lineHeight: 24 }]}>
              {event.description}
            </Text>
          )}
        </View>

        {/* ═══ DETAILS ═══ */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }, Shadows.sm]}>
          {event.location_name && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.headline, { color: theme.text }]}>{event.location_name}</Text>
                {event.address && (
                  <Text style={[Typography.caption1, { color: theme.textSecondary }]}>{event.address}</Text>
                )}
              </View>
            </View>
          )}
          {event.online_url && (
            <View style={styles.detailRow}>
              <MaterialIcons name="laptop" size={22} color={Colors.primary} />
              <Text style={[Typography.subhead, { color: Colors.primary }]}>Evento Online</Text>
            </View>
          )}
          {event.points_reward > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="star" size={22} color={Colors.success} />
              <Text style={[Typography.headline, { color: Colors.success }]}>+{event.points_reward} pontos por participar</Text>
            </View>
          )}
          {event.max_capacity && (
            <View style={styles.detailRow}>
              <MaterialIcons name="group" size={22} color={Colors.primary} />
              <Text style={[Typography.subhead, { color: theme.text }]}>
                {event.participants_count || 0}/{event.max_capacity} inscritos
              </Text>
            </View>
          )}
          {/* Check-in window info */}
          {checkinStart && checkinEnd && (
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={22} color={isCheckinOpen ? Colors.success : theme.textTertiary} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.subhead, { color: isCheckinOpen ? Colors.success : theme.text }]}>
                  {isCheckinOpen ? 'Check-in aberto!' : 'Check-in fechado'}
                </Text>
                <Text style={[Typography.caption2, { color: theme.textTertiary }]}>
                  {checkinStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {checkinEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ═══ CTA BUTTONS ═══ */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: Colors.primary, opacity: pressed ? 0.85 : 1 },
              actionLoading && { opacity: 0.6 },
            ]}
            onPress={handleRegister}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <MaterialIcons name="how-to-reg" size={18} color="#fff" />
                <Text style={styles.ctaText}>Inscrever-se</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: isCheckinOpen ? Colors.success : theme.surfaceElevated,
                opacity: pressed ? 0.85 : 1,
              },
              !isCheckinOpen && { opacity: 0.6 },
            ]}
            onPress={openCheckinModal}
            disabled={!isCheckinOpen}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <MaterialIcons name="qr-code-scanner" size={18} color={isCheckinOpen ? '#fff' : theme.textTertiary} />
              <Text style={[styles.ctaText, !isCheckinOpen && { color: theme.textTertiary }]}>
                Fazer Check-in
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* ═══ CHECK-IN MODAL ═══ */}
      <Modal
        visible={showCheckinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.title3, { color: theme.text }]}>Check-in</Text>
              <Pressable onPress={() => setShowCheckinModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Code input */}
            <View style={styles.modalSection}>
              <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.sm }]}>
                Código do Evento
              </Text>
              <TextInput
                style={[styles.codeInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
                value={checkinCode}
                onChangeText={setCheckinCode}
                placeholder="Digite o código"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Location status */}
            <View style={styles.modalSection}>
              <Text style={[Typography.headline, { color: theme.text, marginBottom: Spacing.sm }]}>
                Localização
              </Text>
              {locationLoading ? (
                <View style={styles.locationStatus}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={[Typography.subhead, { color: theme.textSecondary }]}>Obtendo localização...</Text>
                </View>
              ) : userLocation ? (
                <View style={[styles.locationStatus, { backgroundColor: Colors.success + '10' }]}>
                  <MaterialIcons name="my-location" size={18} color={Colors.success} />
                  <Text style={[Typography.subhead, { color: Colors.success }]}>Localização obtida ✓</Text>
                </View>
              ) : (
                <View style={[styles.locationStatus, { backgroundColor: Colors.warning + '10' }]}>
                  <MaterialIcons name="location-off" size={18} color={Colors.warning} />
                  <Text style={[Typography.caption1, { color: Colors.warning }]}>
                    {locationError || 'Localização indisponível'}
                  </Text>
                </View>
              )}
            </View>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: Colors.success, opacity: pressed ? 0.85 : 1 },
                actionLoading && { opacity: 0.6 },
              ]}
              onPress={handleCheckin}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <MaterialIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.ctaText}>Confirmar Check-in</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ═══ POINTS ANIMATION ═══ */}
      {showPointsAward && (
        <Animated.View
          style={[
            styles.pointsOverlay,
            {
              opacity: pointsAnim,
              transform: [
                { scale: pointsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.pointsAwardCard}>
            <MaterialIcons name="location-on" size={48} color={Colors.success} />
            <Text style={[Typography.largeTitle, { color: Colors.success }]}>
              +{event?.points_reward} pts!
            </Text>
            <Text style={[Typography.headline, { color: '#fff' }]}>Check-in realizado! 🎉</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginHorizontal: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoCard: {
    marginHorizontal: Spacing.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ctaContainer: { paddingHorizontal: Spacing.base, gap: Spacing.sm, marginTop: Spacing.base },
  ctaButton: {
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    ...Shadows.md,
  },
  ctaText: { ...Typography.headline, color: '#fff' },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSection: { gap: Spacing.xs },
  codeInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Typography.title3,
    textAlign: 'center',
    letterSpacing: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  // Points animation
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
