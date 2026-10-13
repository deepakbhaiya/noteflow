import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeIn,
  Layout,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/store/AppStore';
import { noteColorBg, noteColorAccent } from '@/theme';
import { relativeTime, reminderLabel } from '@/lib/date';
import { titleFromBody } from '@/lib/text';
import type { NoteWithMeta } from '@/types';
import { AppText } from './AppText';
import { PressableScale } from './ui';

export type NoteLayout = 'list' | 'grid' | 'compact';

export interface NoteCardProps {
  note: NoteWithMeta;
  layout?: NoteLayout;
  onPress: () => void;
  onLongPress?: () => void;
  onTogglePin?: () => void;
  onToggleFavorite?: () => void;
  onArchive?: () => void;
  onTrash?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
  query?: string;
  index?: number;
  hideSwipe?: boolean;
}

/** Highlight matched substrings from a search query. */
function Highlight({
  text,
  query,
  style,
  variant = 'body',
  weight,
  tone,
  numberOfLines,
  scale,
}: {
  text: string;
  query?: string;
  style?: any;
  variant?: any;
  weight?: any;
  tone?: any;
  numberOfLines?: number;
  scale?: number;
}) {
  const theme = useTheme();
  if (!query || !query.trim()) {
    return (
      <AppText variant={variant} weight={weight} tone={tone} numberOfLines={numberOfLines} style={style} scale={scale}>
        {text}
      </AppText>
    );
  }
  const q = query.trim();
  const lower = text.toLowerCase();
  const lq = q.toLowerCase();
  const idx = lower.indexOf(lq);
  if (idx === -1) {
    return (
      <AppText variant={variant} weight={weight} tone={tone} numberOfLines={numberOfLines} style={style} scale={scale}>
        {text}
      </AppText>
    );
  }
  return (
    <AppText variant={variant} weight={weight} tone={tone} numberOfLines={numberOfLines} style={style} scale={scale}>
      {text.slice(0, idx)}
      <AppText
        variant={variant}
        weight="bold"
        scale={scale}
        style={{ color: theme.colors.accent }}
        numberOfLines={numberOfLines}
      >
        {text.slice(idx, idx + q.length)}
      </AppText>
      {text.slice(idx + q.length)}
    </AppText>
  );
}

function SwipeAction({
  icon,
  color,
  bg,
  label,
  onPress,
  side,
  progress,
  total,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  label?: string;
  onPress?: () => void;
  side: 'left' | 'right';
  progress: SharedValue<number>;
  total: number;
}) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => {
    const dist = Math.abs(progress.value);
    return {
      width: dist > 0 ? Math.min(dist, 200) : 0,
      opacity: dist > 6 ? 1 : 0,
    };
  });
  return (
    <Animated.View style={[{ flexDirection: 'row' }, style]}>
      <PressableScale
        onPress={onPress}
        haptic="medium"
        scaleTo={0.9}
        style={{
          flex: 1,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingHorizontal: 14,
          marginVertical: 4,
          marginLeft: side === 'left' ? 4 : 0,
          marginRight: side === 'right' ? 4 : 0,
          borderRadius: theme.radius.lg,
          minWidth: 68,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
        {label ? (
          <AppText variant="micro" weight="bold" color={color}>
            {label}
          </AppText>
        ) : null}
      </PressableScale>
      {total === 0 ? null : null}
    </Animated.View>
  );
}

export function NoteCard({
  note,
  layout = 'list',
  onPress,
  onLongPress,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onTrash,
  selected,
  selectionMode,
  query,
}: NoteCardProps) {
  const theme = useTheme();
  const bg = noteColorBg(note.colorId, theme.colors.dark);
  const accent = noteColorAccent(note.colorId, theme.colors.dark);
  const title = note.title.trim() || titleFromBody(note.body) || 'Untitled note';
  const isColored = note.colorId && note.colorId !== 'default';
  const checklist = note.checklistTotal > 0 ? note.checklistDone / note.checklistTotal : null;

  const meta = useMemo(() => {
    const bits: string[] = [];
    bits.push(relativeTime(note.updatedAt));
    if (note.folder) bits.push(note.folder.name);
    if (note.wordCount > 0) bits.push(`${note.wordCount}w`);
    return bits;
  }, [note]);

  const cardStyle = {
    backgroundColor: bg,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: selected ? theme.colors.accent : isColored ? accent + '33' : theme.colors.border,
  };

  const renderLeft = (progress: SharedValue<number>) => (
    <View style={{ flexDirection: 'row', width: 150 }}>
      <SwipeAction
        icon={note.pinned ? 'pin' : 'pin-outline'}
        color={theme.colors.accent}
        bg={theme.colors.accentSoft}
        label={note.pinned ? 'Unpin' : 'Pin'}
        onPress={onTogglePin}
        side="left"
        progress={progress}
        total={2}
      />
      <SwipeAction
        icon={note.favorite ? 'star' : 'star-outline'}
        color="#EAAA08"
        bg={theme.colors.dark ? '#2B2310' : '#FEF6E0'}
        label="Star"
        onPress={onToggleFavorite}
        side="left"
        progress={progress}
        total={2}
      />
    </View>
  );

  const renderRight = (progress: SharedValue<number>) => (
    <View style={{ flexDirection: 'row', width: 150 }}>
      <SwipeAction
        icon="archive-outline"
        color={theme.colors.info}
        bg={theme.colors.dark ? '#132539' : '#E8F2FF'}
        label="Archive"
        onPress={onArchive}
        side="right"
        progress={progress}
        total={2}
      />
      <SwipeAction
        icon="trash-outline"
        color={theme.colors.danger}
        bg={theme.colors.dark ? '#2E1517' : '#FDECEA'}
        label="Delete"
        onPress={onTrash}
        side="right"
        progress={progress}
        total={2}
      />
    </View>
  );

  const content =
    layout === 'grid' ? (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        haptic="light"
        scaleTo={0.97}
        style={[cardStyle, { padding: theme.spacing.md, height: 172, justifyContent: 'space-between' }]}
      >
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {note.pinned ? <Ionicons name="pin" size={12} color={accent} /> : null}
            {note.favorite ? <Ionicons name="star" size={12} color="#EAAA08" /> : null}
            {note.locked ? <Ionicons name="lock-closed" size={12} color={theme.colors.textTertiary} /> : null}
            {selected ? (
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} style={{ marginLeft: 'auto' }} />
            ) : null}
          </View>
          <Highlight
            text={title}
            query={query}
            variant="body"
            weight="semibold"
            numberOfLines={3}
          />
          {note.excerpt ? (
            <AppText variant="caption" tone="secondary" numberOfLines={3} style={{ marginTop: 3 }}>
              {note.excerpt}
            </AppText>
          ) : null}
        </View>
        <View>
          {checklist !== null ? (
            <View style={{ marginBottom: 8 }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.scrim,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${Math.round(checklist * 100)}%`,
                    height: '100%',
                    backgroundColor: accent,
                  }}
                />
              </View>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {note.attachmentCount > 0 ? (
              <Ionicons name="image-outline" size={11} color={theme.colors.textTertiary} />
            ) : null}
            <AppText variant="micro" tone="tertiary" numberOfLines={1} style={{ flex: 1 }}>
              {meta.join(' · ')}
            </AppText>
          </View>
        </View>
      </PressableScale>
    ) : layout === 'compact' ? (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        haptic="light"
        scaleTo={0.99}
        style={[
          cardStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 11,
          },
        ]}
      >
        <View style={{ width: 3, height: 26, borderRadius: 2, backgroundColor: accent, opacity: isColored ? 1 : 0.25 }} />
        <Highlight text={title} query={query} variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }} />
        {note.pinned ? <Ionicons name="pin" size={13} color={accent} /> : null}
        {note.favorite ? <Ionicons name="star" size={13} color="#EAAA08" /> : null}
        <AppText variant="micro" tone="tertiary">
          {relativeTime(note.updatedAt)}
        </AppText>
        {selected ? <Ionicons name="checkmark-circle" size={17} color={theme.colors.accent} /> : null}
      </PressableScale>
    ) : (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        haptic="light"
        scaleTo={0.98}
        style={[
          cardStyle,
          {
            padding: theme.spacing.lg,
            gap: 6,
          },
          theme.elevation(1),
        ]}
      >
        {isColored ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 16,
              bottom: 16,
              width: 3,
              borderRadius: 2,
              backgroundColor: accent,
            }}
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} /> : null}
          <Highlight
            text={title}
            query={query}
            variant="bodyLg"
            weight="semibold"
            numberOfLines={2}
            style={{ flex: 1 }}
          />
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {note.locked ? <Ionicons name="lock-closed" size={13} color={theme.colors.textTertiary} /> : null}
            {note.pinned ? <Ionicons name="pin" size={14} color={accent} /> : null}
            {note.favorite ? <Ionicons name="star" size={14} color="#EAAA08" /> : null}
          </View>
        </View>

        {note.excerpt ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={2} style={{ lineHeight: 19 }}>
            {note.excerpt}
          </AppText>
        ) : null}

        {checklist !== null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <View
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.scrim,
                overflow: 'hidden',
              }}
            >
              <View
                style={{ width: `${Math.round(checklist * 100)}%`, height: '100%', backgroundColor: accent }}
              />
            </View>
            <AppText variant="micro" weight="semibold" tone="tertiary">
              {note.checklistDone}/{note.checklistTotal}
            </AppText>
          </View>
        ) : null}

        {note.tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {note.tags.slice(0, 4).map((t) => (
              <View
                key={t.id}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.scrim,
                }}
              >
                <AppText variant="micro" weight="semibold" tone="secondary">
                  #{t.name}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {note.folder ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="folder-outline" size={12} color={theme.colors.textTertiary} />
              <AppText variant="micro" tone="tertiary">
                {note.folder.name}
              </AppText>
            </View>
          ) : null}
          {note.reminderAt ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="alarm-outline" size={12} color={theme.colors.warning} />
              <AppText variant="micro" weight="semibold" style={{ color: theme.colors.warning }}>
                {reminderLabel(note.reminderAt)}
              </AppText>
            </View>
          ) : null}
          {note.attachmentCount > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="image-outline" size={12} color={theme.colors.textTertiary} />
              <AppText variant="micro" tone="tertiary">
                {note.attachmentCount}
              </AppText>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <AppText variant="micro" tone="tertiary">
            {meta[0]}
          </AppText>
        </View>
      </PressableScale>
    );

  if (layout === 'grid' || selectionMode) {
    return <Animated.View layout={Layout.springify().damping(20)}>{content}</Animated.View>;
  }

  return (
    <Animated.View layout={Layout.springify().damping(20)} entering={FadeIn.duration(180)}>
      <ReanimatedSwipeable
        friction={2}
        leftThreshold={64}
        rightThreshold={64}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={renderLeft}
        renderRightActions={renderRight}
        containerStyle={{ borderRadius: theme.radius.lg }}
      >
        {content}
      </ReanimatedSwipeable>
    </Animated.View>
  );
}
