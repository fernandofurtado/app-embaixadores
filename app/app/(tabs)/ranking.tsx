/**
 * ═══════════════════════════════════════════════════════════════
 *  Ranking Screen — Leaderboard with "my position" + period filter
 *  PRD §5.2: Exibir posição do usuário mesmo fora do top-N
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import type { LeaderboardEntry, UserRank } from '../../services/types';

export default function RankingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<UserRank | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('all');

  const loadData = async () => {
    try {
      const [data, rank] = await Promise.all([
        api.getLeaderboard(50),
        api.getMyRank(),
      ]);
      setLeaderboard(data || []);
      setMyRank(rank);
    } catch {
      // placeholder
    }
  };

  useEffect(() => { loadData(); }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const podiumColors = [Colors.warning, '#A8A8A8', '#CD7F32'];
  const podiumIcons: Array<React.ComponentProps<typeof MaterialIcons>['name']> = ['looks-one', 'looks-two', 'looks-3'];

  const isUserInTop = leaderboard.some((e) => e.user_id === user?.id);

  const periods = [
    { key: 'weekly' as const, label: 'Semanal' },
    { key: 'monthly' as const, label: 'Mensal' },
    { key: 'all' as const, label: 'Geral' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ═══ MY POSITION BANNER ═══ */}
      {myRank && !isUserInTop && (
        <View style={[styles.myRankBanner, { backgroundColor: Colors.primary + '15', marginTop: insets.top + 100 }]}>
          <View style={styles.myRankLeft}>
            <View style={[styles.myRankAvatar, { backgroundColor: user?.current_level?.color || Colors.primary }]}>
              <Text style={styles.myRankAvatarText}>{user?.full_name?.charAt(0) || '?'}</Text>
            </View>
            <View>
              <Text style={[Typography.subhead, { color: theme.text, fontWeight: '600' }]}>Sua posição</Text>
              <Text style={[Typography.caption2, { color: theme.textSecondary }]}>
                {myRank.total_points} pontos
              </Text>
            </View>
          </View>
          <View style={[styles.myRankPosition, { backgroundColor: Colors.primary }]}>
            <Text style={[Typography.title3, { color: '#fff' }]}>#{myRank.rank}</Text>
          </View>
        </View>
      )}

      {/* ═══ PERIOD FILTER ═══ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersContainer, !myRank || isUserInTop ? { marginTop: insets.top + 100 } : {}]}
        contentContainerStyle={styles.filtersContent}
      >
        {periods.map((p) => (
          <Pressable
            key={p.key}
            style={[
              styles.filterChip,
              { borderColor: theme.border },
              period === p.key && styles.filterChipActive,
            ]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[
              Typography.caption1,
              { color: period === p.key ? '#fff' : theme.text, fontWeight: '600' },
            ]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ═══ TOP 3 PODIUM ═══ */}
      {leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {[1, 0, 2].map((idx) => {
            const entry = leaderboard[idx];
            if (!entry) return null;
            const isFirst = idx === 0;
            const isMe = entry.user_id === user?.id;
            return (
              <View key={entry.user_id} style={[styles.podiumEntry, isFirst && styles.podiumFirst]}>
                <View style={[
                  styles.podiumAvatar,
                  { backgroundColor: entry.level_color || Colors.primary },
                  isFirst && styles.podiumAvatarFirst,
                  isMe && { borderWidth: 3, borderColor: Colors.primary },
                ]}>
                  <Text style={[styles.podiumAvatarText, isFirst && { fontSize: 28 }]}>
                    {entry.full_name?.charAt(0)}
                  </Text>
                </View>
                <MaterialIcons name={podiumIcons[idx]} size={isFirst ? 28 : 22} color={podiumColors[idx]} style={{ marginTop: Spacing.xs }} />
                <Text style={[Typography.caption1, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                  {entry.full_name?.split(' ')[0]} {isMe && '(Você)'}
                </Text>
                <Text style={[Typography.caption2, { color: entry.level_color || Colors.primary, fontWeight: '700' }]}>
                  {entry.total_points} pts
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ═══ REST OF LEADERBOARD ═══ */}
      <FlatList
        data={leaderboard.slice(3)}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ padding: Spacing.base, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item, index }) => {
          const isMe = item.user_id === user?.id;
          return (
            <View style={[
              styles.rankRow,
              { backgroundColor: isMe ? Colors.primary + '10' : theme.surface },
              isMe && { borderColor: Colors.primary, borderWidth: 1 },
              Shadows.sm,
            ]}>
              <Text style={[Typography.headline, { color: theme.textSecondary, width: 32 }]}>
                {index + 4}
              </Text>
              <View style={[styles.rankAvatar, { backgroundColor: item.level_color || Colors.primary }]}>
                <Text style={styles.rankAvatarText}>{item.full_name?.charAt(0)}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={[Typography.subhead, { color: theme.text, fontWeight: '600' }]}>
                  {item.full_name} {isMe && '(Você)'}
                </Text>
                <Text style={[Typography.caption2, { color: item.level_color || theme.textTertiary }]}>
                  {item.level_name || 'Apoiador'}
                </Text>
              </View>
              <Text style={[Typography.headline, { color: Colors.primary }]}>
                {item.total_points}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={64} color={theme.textTertiary} />
            <Text style={[Typography.title3, { color: theme.text }]}>Ranking vazio</Text>
            <Text style={[Typography.subhead, { color: theme.textSecondary, textAlign: 'center' }]}>
              Complete missões para aparecer no ranking!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  myRankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  myRankLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  myRankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankAvatarText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  myRankPosition: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filtersContainer: { maxHeight: 48, marginBottom: Spacing.sm },
  filtersContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.base,
  },
  podiumEntry: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: Spacing.base },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarFirst: { width: 64, height: 64, borderRadius: 32 },
  podiumAvatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  rankInfo: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['5xl'], gap: Spacing.base },
});
