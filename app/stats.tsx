import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useApp, useTheme } from '@/store/AppStore';
import * as db from '@/db';
import type { Stats } from '@/db';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/ui';

function StatTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  tint: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: '45%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        gap: 8,
        ...theme.elevation(1),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: tint + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

function Ring({ progress, size = 128 }: { progress: number; size?: number }) {
  const theme = useTheme();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.scrim} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <AppText variant="title">{Math.round(progress * 100)}%</AppText>
        <AppText variant="micro" tone="tertiary">
          tasks done
        </AppText>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { revision } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const s = await db.getStats();
        if (active) setStats(s);
      })();
      return () => {
        active = false;
      };
    }, [revision]),
  );

  const maxActivity = stats ? Math.max(1, ...stats.activity) : 1;
  const taskProgress =
    stats && stats.checklistsTotal > 0 ? stats.checklistsDone / stats.checklistsTotal : 0;

  return (
    <Screen>
      <Header onBack={() => router.back()} title="Insights" subtitle="Your writing at a glance" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <LinearGradient
            colors={theme.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: theme.radius.xl, padding: theme.spacing.xxl, ...theme.elevation(3) }}
          >
            <AppText variant="caption" weight="semibold" color="rgba(255,255,255,0.8)" style={{ letterSpacing: 1 }}>
              TOTAL NOTES
            </AppText>
            <AppText variant="display" color="#fff" style={{ marginTop: 4 }}>
              {stats?.total ?? 0}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 18, marginTop: theme.spacing.md }}>
              <View>
                <AppText variant="headline" color="#fff">
                  {stats?.words ?? 0}
                </AppText>
                <AppText variant="micro" color="rgba(255,255,255,0.75)">
                  words written
                </AppText>
              </View>
              <View>
                <AppText variant="headline" color="#fff">
                  {stats?.favorites ?? 0}
                </AppText>
                <AppText variant="micro" color="rgba(255,255,255,0.75)">
                  starred
                </AppText>
              </View>
              <View>
                <AppText variant="headline" color="#fff">
                  {stats?.folders ?? 0}
                </AppText>
                <AppText variant="micro" color="rgba(255,255,255,0.75)">
                  spaces
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Activity chart */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <Card>
            <AppText variant="headline" style={{ marginBottom: theme.spacing.md }}>
              Last 7 days
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 10 }}>
              {(stats?.activity ?? [0, 0, 0, 0, 0, 0, 0]).map((v, i) => {
                const h = Math.max(6, (v / maxActivity) * 96);
                const isToday = i === (stats?.activity.length ?? 7) - 1;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                      <View
                        style={{
                          height: h,
                          borderRadius: 8,
                          backgroundColor: isToday ? theme.colors.accent : theme.colors.accentMuted,
                        }}
                      />
                    </View>
                    <AppText variant="micro" tone="tertiary">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Task ring + counts */}
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            flexDirection: 'row',
            gap: 12,
            marginBottom: theme.spacing.md,
          }}
        >
          <Card style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ring progress={taskProgress} />
            <AppText variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
              {stats?.checklistsDone ?? 0} of {stats?.checklistsTotal ?? 0} tasks
            </AppText>
          </Card>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatTile icon="document-text-outline" label="Active notes" value={stats?.active ?? 0} tint={theme.colors.accent} />
          <StatTile icon="star-outline" label="Starred" value={stats?.favorites ?? 0} tint="#EAAA08" />
          <StatTile icon="pin-outline" label="Pinned" value={stats?.pinned ?? 0} tint={theme.colors.info} />
          <StatTile icon="archive-outline" label="Archived" value={stats?.archived ?? 0} tint={theme.colors.success} />
          <StatTile icon="pricetags-outline" label="Tags" value={stats?.tags ?? 0} tint={theme.colors.warning} />
          <StatTile icon="image-outline" label="Attachments" value={stats?.attachments ?? 0} tint={theme.colors.danger} />
          <StatTile icon="trash-outline" label="In trash" value={stats?.trashed ?? 0} tint={theme.colors.textSecondary} />
          <StatTile icon="lock-closed-outline" label="Locked" value={stats?.locked ?? 0} tint={theme.colors.accent} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});
