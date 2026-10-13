import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Thin wrapper around expo-notifications: permission handling, a channel for
 * Android and scheduling/cancelling note reminders.
 */

let configured = false;

export async function ensureNotificationsConfigured(): Promise<boolean> {
  if (configured) return true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  } as any);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Note reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#6D5DFC',
    });
  }
  configured = true;
  return true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureNotificationsConfigured();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function scheduleNoteReminder(
  noteId: string,
  title: string,
  fireAt: number,
): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: title.trim() || 'Note reminder',
      body: 'You asked NoteFlow to remind you about this note.',
      data: { noteId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fireAt),
      channelId: 'reminders',
    },
  });
  return id;
}

export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already gone
  }
}

export async function cancelAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
