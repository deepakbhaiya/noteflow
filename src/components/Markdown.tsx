import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/AppStore';
import { AppText } from './AppText';
import { PressableScale } from './ui';

/**
 * A small, dependency-free markdown renderer tuned for note content.
 * Supports headings, lists, task lists, quotes, fenced code, rules and
 * inline bold / italic / code / strike / links / tags.
 */

type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strike'; text: string }
  | { kind: 'link'; text: string; url: string }
  | { kind: 'tag'; text: string };

const INLINE_RE =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|#[\p{L}\p{N}_-]+)/gu;

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  const re = new RegExp(INLINE_RE.source, 'gu');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push({ kind: 'text', text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**') || tok.startsWith('__')) nodes.push({ kind: 'bold', text: tok.slice(2, -2) });
    else if (tok.startsWith('`')) nodes.push({ kind: 'code', text: tok.slice(1, -1) });
    else if (tok.startsWith('~~')) nodes.push({ kind: 'strike', text: tok.slice(2, -2) });
    else if (tok.startsWith('[')) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (mm) nodes.push({ kind: 'link', text: mm[1], url: mm[2] });
      else nodes.push({ kind: 'text', text: tok });
    } else if (tok.startsWith('#')) nodes.push({ kind: 'tag', text: tok });
    else if (tok.startsWith('*') || tok.startsWith('_')) nodes.push({ kind: 'italic', text: tok.slice(1, -1) });
    else nodes.push({ kind: 'text', text: tok });
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push({ kind: 'text', text: text.slice(last) });
  return nodes;
}

function Inline({
  text,
  scale,
  onTagPress,
}: {
  text: string;
  scale: number;
  onTagPress?: (tag: string) => void;
}) {
  const theme = useTheme();
  const nodes = parseInline(text);
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.kind) {
          case 'bold':
            return (
              <AppText key={i} variant="bodyLg" weight="bold" scale={scale}>
                {n.text}
              </AppText>
            );
          case 'italic':
            return (
              <AppText key={i} variant="bodyLg" scale={scale} style={{ fontStyle: 'italic' }}>
                {n.text}
              </AppText>
            );
          case 'strike':
            return (
              <AppText key={i} variant="bodyLg" scale={scale} style={{ textDecorationLine: 'line-through' }}>
                {n.text}
              </AppText>
            );
          case 'code':
            return (
              <AppText
                key={i}
                variant="mono"
                scale={scale}
                style={{
                  backgroundColor: theme.colors.surfaceAlt,
                  color: theme.colors.accent,
                }}
              >
                {' '}
                {n.text}{' '}
              </AppText>
            );
          case 'link':
            return (
              <AppText key={i} variant="bodyLg" scale={scale} color={theme.colors.info}>
                {n.text}
              </AppText>
            );
          case 'tag':
            return (
              <AppText
                key={i}
                variant="bodyLg"
                weight="semibold"
                scale={scale}
                color={theme.colors.accent}
                onPress={() => onTagPress?.(n.text.slice(1))}
              >
                {n.text}
              </AppText>
            );
          default:
            return (
              <AppText key={i} variant="bodyLg" scale={scale}>
                {n.text}
              </AppText>
            );
        }
      })}
    </>
  );
}

export function Markdown({
  content,
  scale = 1,
  onTagPress,
  onToggleCheckbox,
}: {
  content: string;
  scale?: number;
  onTagPress?: (tag: string) => void;
  onToggleCheckbox?: (line: number) => void;
}) {
  const theme = useTheme();
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <View
          key={key++}
          style={{
            backgroundColor: theme.colors.dark ? '#0E1017' : '#F6F7FB',
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            padding: theme.spacing.md,
            marginVertical: 6,
          }}
        >
          {lang ? (
            <AppText variant="micro" tone="tertiary" style={{ marginBottom: 6, letterSpacing: 0.6 }}>
              {lang.toUpperCase()}
            </AppText>
          ) : null}
          <AppText variant="mono" scale={scale} style={{ lineHeight: 21 }}>
            {buf.join('\n')}
          </AppText>
        </View>,
      );
      continue;
    }

    // headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const variant = level === 1 ? 'display' : level === 2 ? 'largeTitle' : level === 3 ? 'title' : 'headline';
      blocks.push(
        <AppText key={key++} variant={variant as any} scale={scale} style={{ marginTop: level === 1 ? 4 : 14 }}>
          {h[2]}
        </AppText>,
      );
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(
        <View key={key++} style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider, marginVertical: 12 }} />,
      );
      i++;
      continue;
    }

    // quote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push(
        <View
          key={key++}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.accent,
            paddingLeft: theme.spacing.md,
            paddingVertical: 4,
            marginVertical: 6,
            backgroundColor: theme.colors.accentSoft,
            borderRadius: 4,
          }}
        >
          <Inline text={buf.join(' ')} scale={scale} onTagPress={onTagPress} />
        </View>,
      );
      continue;
    }

    // task list
    const task = /^(\s*)[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(line);
    if (task) {
      const checked = task[2].toLowerCase() === 'x';
      const lineIndex = i;
      blocks.push(
        <PressableScale
          key={key++}
          onPress={() => onToggleCheckbox?.(lineIndex)}
          haptic="select"
          scaleTo={0.99}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5, paddingLeft: 4 }}
        >
          <View
            style={{
              width: 21,
              height: 21,
              borderRadius: 7,
              borderWidth: 1.6,
              borderColor: checked ? theme.colors.accent : theme.colors.borderStrong,
              backgroundColor: checked ? theme.colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Inline text={task[3]} scale={scale} onTagPress={onTagPress} />
            </View>
          </View>
        </PressableScale>,
      );
      i++;
      continue;
    }

    // bullet list
    const bullet = /^(\s*)[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      const indent = Math.min(Math.floor(bullet[1].length / 2), 3);
      blocks.push(
        <View key={key++} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4, paddingLeft: 4 + indent * 16 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.colors.accent,
              marginTop: 8,
            }}
          />
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            <Inline text={bullet[2]} scale={scale} onTagPress={onTagPress} />
          </View>
        </View>,
      );
      i++;
      continue;
    }

    // ordered list
    const ordered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      const indent = Math.min(Math.floor(ordered[1].length / 2), 3);
      blocks.push(
        <View key={key++} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4, paddingLeft: 4 + indent * 16 }}>
          <AppText variant="bodyLg" weight="semibold" scale={scale} color={theme.colors.accent} style={{ minWidth: 18 }}>
            {ordered[2]}.
          </AppText>
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            <Inline text={ordered[3]} scale={scale} onTagPress={onTagPress} />
          </View>
        </View>,
      );
      i++;
      continue;
    }

    // blank
    if (line.trim() === '') {
      i++;
      continue;
    }

    // paragraph
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^(\s*)[-*+]\s/.test(lines[i]) &&
      !/^(\s*)\d+[.)]\s/.test(lines[i]) &&
      !lines[i].trim().startsWith('```')
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <View key={key++} style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 3 }}>
        <Inline text={buf.join(' ')} scale={scale} onTagPress={onTagPress} />
      </View>,
    );
  }

  return <View style={{ gap: 2 }}>{blocks}</View>;
}

const styles = StyleSheet.create({});
