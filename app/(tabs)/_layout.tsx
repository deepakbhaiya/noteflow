import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/AppStore';
import { haptics } from '@/lib/haptics';
import { AppText } from '@/components/AppText';

const TABS: {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { name: 'index', label: 'Notes', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'folders', label: 'Spaces', icon: 'folder-outline', activeIcon: 'folder' },
  { name: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

function TabItem({
  focused,
  label,
  icon,
  activeIcon,
  onPress,
}: {
  focused: boolean;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 16, stiffness: 340 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
    >
      <Animated.View style={[{ alignItems: 'center', gap: 3 }, style]}>
        <View
          style={{
            width: 44,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? theme.colors.accentSoft : 'transparent',
          }}
        >
          <Ionicons
            name={focused ? activeIcon : icon}
            size={21}
            color={focused ? theme.colors.accent : theme.colors.textTertiary}
          />
        </View>
        <AppText
          variant="micro"
          weight={focused ? 'bold' : 'semibold'}
          color={focused ? theme.colors.accent : theme.colors.textTertiary}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.surface,
        overflow: 'hidden',
      }}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint={theme.colors.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={{ flexDirection: 'row' }}>
        {state.routes.map((route: any, index: number) => {
          const meta = TABS.find((t) => t.name === route.name) ?? TABS[0];
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={meta.label}
              icon={meta.icon}
              activeIcon={meta.activeIcon}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Notes' }} />
      <Tabs.Screen name="folders" options={{ title: 'Spaces' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
