import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/AppStore';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { AppText } from '@/components/AppText';
import { Card, Divider } from '@/components/ui';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
  { icon: 'create-outline', title: 'Markdown editor', body: 'Bold, lists, checklists, quotes, code and more.' },
  { icon: 'folder-outline', title: 'Spaces & tags', body: 'Organise with folders, hashtags and pinning.' },
  { icon: 'alarm-outline', title: 'Reminders', body: 'Get notified when a note needs your attention.' },
  { icon: 'lock-closed-outline', title: 'Private by design', body: 'Everything is stored locally on your device.' },
  { icon: 'color-palette-outline', title: 'Beautiful themes', body: 'Light, dark and a curated note colour palette.' },
  { icon: 'share-outline', title: 'Export anywhere', body: 'Share notes as Markdown or back up as JSON.' },
];

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <Header onBack={() => router.back()} title="About" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <LinearGradient
            colors={theme.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 92,
              height: 92,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.elevation(3),
            }}
          >
            <Ionicons name="document-text" size={44} color="#fff" />
          </LinearGradient>
          <AppText variant="title" style={{ marginTop: theme.spacing.lg }}>
            NoteFlow
          </AppText>
          <AppText variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
            Version 1.0.0
          </AppText>
          <AppText
            variant="footnote"
            tone="secondary"
            align="center"
            style={{ marginTop: theme.spacing.md, maxWidth: 300 }}
          >
            A calm, premium home for your notes, tasks and ideas. Built with React Native and Expo.
          </AppText>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, gap: 12 }}>
          {FEATURES.map((f) => (
            <Card key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: theme.colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={f.icon} size={20} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">
                  {f.title}
                </AppText>
                <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                  {f.body}
                </AppText>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
          <Card padded={false}>
            <View style={{ padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="heart" size={18} color={theme.colors.danger} />
              <AppText variant="footnote" tone="secondary" style={{ flex: 1 }}>
                Thank you for using NoteFlow.
              </AppText>
            </View>
            <Divider />
            <View style={{ padding: theme.spacing.lg }}>
              <AppText variant="caption" tone="tertiary" align="center">
                Made with care · 2026
              </AppText>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});
